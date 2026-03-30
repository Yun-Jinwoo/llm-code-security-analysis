# Day 5 - Node.js 취약 코드 패턴

## 패턴 1: SQL Injection

### 개념
사용자 입력이 SQL 쿼리 문자열에 직접 삽입되면, 공격자가 쿼리 구조를 조작할 수 있음.

### 취약 코드
```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 위험: 문자열 직접 연결
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  const [rows] = await db.query(query);

  if (rows.length > 0) {
    req.session.userId = rows[0].id;
    res.json({ success: true });
  }
});
```

### 공격 예시
```
email:    ' OR 1=1 --
password: 아무거나
```

실제 실행되는 쿼리:
```sql
SELECT * FROM users WHERE email = '' OR 1=1 --' AND password = '아무거나'
```

- `OR 1=1` 은 항상 참
- `--` 는 주석 처리 → 비밀번호 검사 무시
- 결과: 비밀번호 없이 로그인 성공

### 안전 코드
```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 안전: Prepared Statement (파라미터 바인딩)
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]  // 입력값은 항상 배열로 분리
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

### 왜 Prepared Statement가 안전한가
```
취약:  query = "SELECT ... WHERE email = '" + userInput + "'"
       → userInput이 SQL 구조의 일부가 됨

안전:  query = "SELECT ... WHERE email = ?"  + [userInput]
       → userInput은 항상 데이터로만 처리, SQL로 해석되지 않음
       → ' OR 1=1 -- 도 그냥 문자열로 취급됨
```

---

## 패턴 2: 비밀번호 저장

### 세 가지 방식 비교

#### 1. 평문 저장 (가장 위험)
```javascript
// 위험: 비밀번호를 그대로 저장
await db.query('INSERT INTO users (password) VALUES (?)', [password]);
```
DB가 유출되면 → 공격자가 모든 비밀번호를 즉시 사용 가능.

#### 2. MD5 / SHA1 (여전히 위험)
```javascript
const crypto = require('crypto');

// 위험: MD5는 레인보우 테이블 공격에 취약
const hash = crypto.createHash('md5').update(password).digest('hex');

// 위험: 솔트 없는 SHA256도 위험
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

**레인보우 테이블 공격:**
해커들이 흔한 비밀번호의 해시값을 미리 계산해서 표로 만들어 놓음:
```
5f4dcc3b5aa765d61d8327deb882cf99 → "password"
e10adc3949ba59abbe56e057f20f883e → "123456"
```
유출된 DB에서 해시값 찾아서 표에서 조회하면 원래 비밀번호 즉시 파악.

또한 MD5는 매우 빠름:
```
MD5:    초당 수십억 번 시도 가능
bcrypt: 초당 수백 번만 시도 가능
```

#### 3. bcrypt (안전)
```javascript
const bcrypt = require('bcrypt');

// 회원가입
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // saltRounds: 해싱을 몇 번 반복할지 (2^n회)
  // 2^12 = 4,096번 반복 → 공격자에겐 어렵고, 사용자 입장에선 허용 범위
  const passwordHash = await bcrypt.hash(password, 12);

  await db.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
});

// 로그인 시 비교
const isValid = await bcrypt.compare(password, rows[0].password_hash);
```

**bcrypt가 안전한 이유:**
1. **솔트** — 같은 비밀번호도 매번 다른 해시값 생성 → 레인보우 테이블 무력화
2. **느림** — 일부러 느리게 설계 → 브루트포스 공격 비실용적
3. **saltRounds** — 해싱 반복 횟수 조절 (2^n회)
   - saltRounds 10 → 1,024회 (빠름, 최소 권장)
   - saltRounds 12 → 4,096회 (권장 균형점)
   - saltRounds 14 → 16,384회 (느림, 고보안)

---

## 패턴 3: JWT (JSON Web Token)

### JWT란?
요청 사이에 로그인 상태를 유지하는 방법.

```
1. 사용자 로그인 성공
2. 서버가 JWT 토큰 발급
3. 클라이언트가 토큰 저장
4. 이후 요청마다 토큰 첨부
5. 서버가 토큰 확인 → 로그인 상태 인식
```

### JWT 구조
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.abc123
       헤더                  페이로드          서명
```

디코딩하면:
```json
헤더:    { "alg": "HS256" }
페이로드: { "userId": 1, "role": "user", "exp": 1234567890 }
서명:    HMAC(헤더 + 페이로드, SECRET_KEY)
```

### 취약 코드
```javascript
// 위험 1: 시크릿 하드코딩
const SECRET = 'mysecret';
const SECRET = 'secret';
const SECRET = '1234567890';

// 위험 2: 만료 시간 없음 → 토큰이 영원히 유효
const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);

// 위험 3: 알고리즘 미명시 → alg:none 공격 가능
jwt.verify(token, SECRET);
```

### 공격 1: 하드코딩된 시크릿
```
소스코드가 GitHub에 올라감
→ 공격자가 SECRET = 'mysecret' 발견
→ { "userId": 1, "role": "admin" } 페이로드로 토큰 직접 생성
→ 관리자 권한 탈취
```

### 공격 2: alg:none
```
정상 토큰 헤더:  { "alg": "HS256" }
공격자가 변조:   { "alg": "none" }
→ 서버가 서명 검증을 건너뜀
→ 페이로드를 { "role": "admin" } 으로 마음대로 조작 가능
→ 시크릿 키 없이도 관리자 권한 탈취
```

### 안전 코드
```javascript
// 안전: 환경변수에 시크릿 저장
const SECRET = process.env.JWT_SECRET;  // .env에 랜덤 64자 이상 문자열

// 안전: 만료 시간 + 알고리즘 명시
const token = jwt.sign(
  { userId: user.id },   // 페이로드에 최소한의 정보만
  SECRET,
  {
    expiresIn: '1h',     // 1시간 후 만료
    algorithm: 'HS256'   // 알고리즘 명시
  }
);

// 안전: 검증 시 알고리즘 강제 지정
const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
```

### 정리

| 항목 | 취약 | 안전 |
|------|------|------|
| 시크릿 저장 | 소스코드에 하드코딩 | 환경변수 (.env) |
| 만료 시간 | 없음 | expiresIn: '1h' |
| 알고리즘 | 미명시 | algorithms: ['HS256'] 강제 |
| 페이로드 | 민감 정보 포함 | userId 등 최소 정보만 |

---

## 오늘 핵심 요약

| 패턴 | 취약 | 안전 |
|------|------|------|
| SQL Injection | 쿼리에 문자열 직접 연결 | Prepared Statement |
| 비밀번호 저장 | 평문 / MD5 | bcrypt (saltRounds 12) |
| JWT | 하드코딩 시크릿, alg 미명시 | 환경변수, 알고리즘 강제 지정 |
