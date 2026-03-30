# Day 5 - Node.js Vulnerability Patterns

## Pattern 1: SQL Injection

### What is it?
User input is directly inserted into a SQL query string, allowing attackers to manipulate the query.

### Vulnerable Code
```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // DANGEROUS: string concatenation
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  const [rows] = await db.query(query);

  if (rows.length > 0) {
    req.session.userId = rows[0].id;
    res.json({ success: true });
  }
});
```

### Attack Example
```
email:    ' OR 1=1 --
password: anything
```

Query becomes:
```sql
SELECT * FROM users WHERE email = '' OR 1=1 --' AND password = 'anything'
```

- `OR 1=1` is always true
- `--` comments out the rest (password check ignored)
- Result: login succeeds without valid credentials

### Safe Code
```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // SAFE: Prepared Statement (parameter binding)
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]  // input is always passed separately
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, rows[0].password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = rows[0].id;
  res.json({ success: true });
});
```

### Why Prepared Statements are Safe
```
Vulnerable:  query = "SELECT ... WHERE email = '" + userInput + "'"
             → userInput becomes part of the SQL structure

Safe:        query = "SELECT ... WHERE email = ?"  + [userInput]
             → userInput is always treated as data, never as SQL
             → ' OR 1=1 -- is treated as a literal string, not SQL
```

---

## Pattern 2: Password Storage

### Three approaches

#### 1. Plain text (most dangerous)
```javascript
// DANGEROUS: store password as-is
await db.query('INSERT INTO users (password) VALUES (?)', [password]);
```
If DB is leaked → attacker gets all passwords immediately.

#### 2. MD5 / SHA1 (still dangerous)
```javascript
const crypto = require('crypto');

// DANGEROUS: MD5 is vulnerable to rainbow table attacks
const hash = crypto.createHash('md5').update(password).digest('hex');

// DANGEROUS: SHA256 without salt is also vulnerable
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

**Rainbow Table Attack:**
Hackers pre-compute hashes for millions of common passwords:
```
5f4dcc3b5aa765d61d8327deb882cf99 → "password"
e10adc3949ba59abbe56e057f20f883e → "123456"
```
Look up the hash from the leaked DB → get the original password instantly.

Also MD5 is extremely fast:
```
MD5:    billions of attempts per second possible
bcrypt: only hundreds of attempts per second
```

#### 3. bcrypt (safe)
```javascript
const bcrypt = require('bcrypt');

// Registration
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // saltRounds: how many times to repeat hashing
  // 2^12 = 4,096 repetitions — hard for attackers, acceptable for users
  const passwordHash = await bcrypt.hash(password, 12);

  await db.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
});

// Login
const isValid = await bcrypt.compare(password, rows[0].password_hash);
```

**Why bcrypt is safer:**
1. **Salt** — adds random data before hashing, so same password gives different hash every time → rainbow table is useless
2. **Slow by design** — intentionally slow to make brute force impractical
3. **saltRounds** — controls how many times hashing is repeated (2^n times)
   - saltRounds 10 → 1,024 repetitions (fast, minimum recommended)
   - saltRounds 12 → 4,096 repetitions (recommended balance)
   - saltRounds 14 → 16,384 repetitions (slow, high security)

---

## Pattern 3: JWT (JSON Web Token)

### What is JWT?
A way to maintain login state between requests.

```
1. User logs in successfully
2. Server issues a JWT token
3. Client stores the token
4. Client sends token with every request
5. Server verifies token → recognizes login state
```

### JWT Structure
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.abc123
       header               payload          signature
```

Decoded:
```json
header:    { "alg": "HS256" }
payload:   { "userId": 1, "role": "user", "exp": 1234567890 }
signature: HMAC(header + payload, SECRET_KEY)
```

### Vulnerable Code
```javascript
// DANGEROUS 1: hardcoded secret
const SECRET = 'mysecret';
const SECRET = 'secret';
const SECRET = '1234567890';

// DANGEROUS 2: no expiry → token valid forever
const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);

// DANGEROUS 3: algorithm not specified → alg:none attack possible
jwt.verify(token, SECRET);
```

### Attack 1: Hardcoded Secret
```
Source code pushed to GitHub
→ Attacker finds SECRET = 'mysecret'
→ Crafts a token: { "userId": 1, "role": "admin" }
→ Signs it with the known secret
→ Admin access gained
```

### Attack 2: alg:none
```
Normal token header:  { "alg": "HS256" }
Attacker changes to:  { "alg": "none" }
→ Server skips signature verification
→ Attacker can put anything in payload: { "role": "admin" }
→ No secret key needed
```

### Safe Code
```javascript
// SAFE: secret in environment variable
const SECRET = process.env.JWT_SECRET;  // random 64+ character string in .env

// SAFE: expiry + algorithm specified
const token = jwt.sign(
  { userId: user.id },   // only put necessary info in payload
  SECRET,
  {
    expiresIn: '1h',     // token expires in 1 hour
    algorithm: 'HS256'   // algorithm explicitly set
  }
);

// SAFE: force algorithm on verification
const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
```

### Summary

| Issue | Vulnerable | Safe |
|-------|-----------|------|
| Secret storage | Hardcoded in source | Environment variable (.env) |
| Expiry | No expiry | expiresIn: '1h' |
| Algorithm | Not specified | algorithms: ['HS256'] |
| Payload | Sensitive data included | Only userId, minimal info |

---

## Key Takeaways

| Pattern | Vulnerable | Safe |
|---------|-----------|------|
| SQL Injection | String concatenation in query | Prepared Statement |
| Password storage | Plain text / MD5 | bcrypt (saltRounds 12) |
| JWT | Hardcoded secret, no alg | Environment variable, force algorithm |
