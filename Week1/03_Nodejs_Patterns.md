# Node.js 취약/안전 코드 패턴 비교

> LLM 생성 코드에서 실제로 등장하는 패턴들을 정리.
> 각 패턴이 왜 취약한지 이해하는 것이 실험 분석의 기초.

---

## Node.js 웹 서비스 기본 구조

LLM이 생성하는 Express 앱의 일반적인 구조:

```
project/
├── app.js           (또는 server.js, index.js)
├── package.json
├── routes/
│   ├── auth.js      (로그인, 회원가입)
│   ├── posts.js     (게시판)
│   └── comments.js  (댓글)
├── middleware/
│   └── auth.js      (인증 미들웨어)
├── models/          (DB 모델)
├── uploads/         (파일 업로드 경로)
└── .env             (환경변수)
```

---

## 패턴 1: SQL Injection

### 취약 패턴 (LLM이 자주 생성)
```javascript
// routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 위험: 문자열 연결로 쿼리 조합
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  const [rows] = await db.query(query);

  if (rows.length > 0) {
    req.session.userId = rows[0].id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

**공격 예시**: `email = "' OR 1=1 --"` → 비밀번호 없이 로그인

### 안전 패턴
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

  // 비밀번호는 bcrypt로 비교
  const isValid = await bcrypt.compare(password, rows[0].password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = rows[0].id;
  res.json({ success: true });
});
```

---

## 패턴 2: 비밀번호 저장

### 취약 패턴 — 평문 저장
```javascript
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // 위험: 비밀번호 평문 저장
  await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
  res.json({ success: true });
});
```

### 취약 패턴 — MD5/SHA1
```javascript
const crypto = require('crypto');

// 위험: MD5는 레인보우 테이블 공격에 취약
const hash = crypto.createHash('md5').update(password).digest('hex');

// 위험: SHA256도 솔트 없이 사용하면 위험
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

### 안전 패턴 — bcrypt
```javascript
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // 안전: bcrypt (saltRounds 10~12 권장, 클수록 느리고 안전)
  const passwordHash = await bcrypt.hash(password, 12);

  await db.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
  res.json({ success: true });
});
```

---

## 패턴 3: JWT 설정

### 취약 패턴 — 하드코딩 시크릿 + 만료 없음
```javascript
const jwt = require('jsonwebtoken');

// 위험 1: 시크릿이 소스코드에 하드코딩
const SECRET = 'mysecret';
const SECRET = 'secret';
const SECRET = '1234567890';

// 위험 2: 만료 시간 없음 → 토큰이 영원히 유효
const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);

// 위험 3: 알고리즘 명시 안 함 → alg:none 공격 가능
jwt.verify(token, SECRET);
```

### 안전 패턴
```javascript
// .env 파일에 저장: JWT_SECRET=랜덤한_긴_문자열_64자_이상
const SECRET = process.env.JWT_SECRET;

// 만료 시간 설정 + 알고리즘 명시
const token = jwt.sign(
  { userId: user.id },
  SECRET,
  {
    expiresIn: '1h',
    algorithm: 'HS256'
  }
);

// 검증 시 알고리즘 강제 지정
const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
```

---

## 패턴 4: 파일 업로드

### 취약 패턴 — 검증 없음
```javascript
const multer = require('multer');

// 위험: 모든 파일을 웹 루트 내부에 저장
const upload = multer({ dest: 'public/uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  // 위험: 원본 파일명을 그대로 사용 (경로 순회 공격 가능)
  res.json({
    filename: req.file.originalname,
    url: `/uploads/${req.file.originalname}`
  });
});
```

**공격 예시**:
- `../../../app.js` 같은 파일명으로 소스코드 덮어쓰기
- `shell.js` 업로드 후 직접 실행

### 안전 패턴
```javascript
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/gif':  '.gif',
  'application/pdf': '.pdf'
};

const storage = multer.diskStorage({
  // 웹 루트 밖에 저장
  destination: path.join(__dirname, '..', 'private_uploads'),
  filename: (req, file, cb) => {
    // 파일명 완전히 새로 생성 (원본 파일명 사용 금지)
    const ext = ALLOWED_TYPES[file.mimetype] || '.bin';
    const safeName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 파일 형식입니다.'));
    }
  }
});

// 파일 다운로드는 별도 API를 통해 스트리밍 (직접 URL 노출 금지)
router.get('/download/:id', authMiddleware, async (req, res) => {
  const file = await File.findByPk(req.params.id);
  if (!file || file.userId !== req.user.id) {
    return res.status(403).end();
  }
  res.download(path.join(__dirname, '..', 'private_uploads', file.storedName));
});
```

---

## 패턴 5: 접근 제어 (IDOR)

### 취약 패턴 — 소유권 확인 없음
```javascript
// 위험: 로그인만 확인하고 소유권은 확인 안 함
router.delete('/post/:id', authMiddleware, async (req, res) => {
  await Post.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

// 위험: 관리자 권한 확인 안 함
router.get('/admin/users', authMiddleware, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

### 안전 패턴
```javascript
router.delete('/post/:id', authMiddleware, async (req, res) => {
  const post = await Post.findByPk(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '게시글이 없습니다.' });
  }

  // 소유권 확인 (관리자도 허용하려면 || req.user.role === 'admin' 추가)
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  await post.destroy();
  res.json({ success: true });
});

// 관리자 전용 라우트
router.get('/admin/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json(users);
});

// 역할 확인 미들웨어
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

---

## 패턴 6: XSS (Cross-Site Scripting)

### 발생 위치
서버 사이드 렌더링(EJS, Pug 등) 또는 React/Vue 없이 `innerHTML`을 사용하는 경우.

### 취약 패턴
```javascript
// EJS 템플릿 — 이스케이프 없이 출력
// views/post.ejs
<h1><%- post.title %></h1>        // 취약: <%- 는 HTML 그대로 출력
<div><%- post.content %></div>

// 클라이언트 JS에서 innerHTML 사용
document.getElementById('content').innerHTML = post.content;  // 취약
```

### 안전 패턴
```javascript
// EJS — HTML 자동 이스케이프
<h1><%= post.title %></h1>         // 안전: <%= 는 HTML 이스케이프
<div><%= post.content %></div>

// 클라이언트 JS — textContent 사용
document.getElementById('content').textContent = post.content;  // 안전

// HTML 렌더링이 필요하면 DOMPurify로 정화
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(post.content);
```

---

## 패턴 7: 환경변수 관리

### 취약 패턴 — 시크릿 하드코딩
```javascript
// 위험: 소스코드에 시크릿 직접 작성
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root1234',
  database: 'myapp'
});

const JWT_SECRET = 'my-super-secret-key';
const ADMIN_PASSWORD = 'admin123';
```

### 안전 패턴 — dotenv 사용
```javascript
// .env 파일 (Git에 커밋 금지 — .gitignore에 추가)
// DB_HOST=localhost
// DB_USER=appuser
// DB_PASS=랜덤한_강력한_패스워드
// JWT_SECRET=랜덤한_64자_이상_문자열

require('dotenv').config();

const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});
```

---

## 패턴 8: 에러 처리 & 정보 노출

### 취약 패턴 — 스택 트레이스 노출
```javascript
// 위험: 에러 상세 정보를 클라이언트에 그대로 전달
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack   // DB 구조, 파일 경로 등 민감 정보 노출
  });
});

// 위험: SQL 에러를 그대로 응답
try {
  const result = await db.query(query);
} catch (err) {
  res.status(500).json({ error: err.message });
  // "ER_NO_SUCH_TABLE: Table 'myapp.usres' doesn't exist" 같은 정보 노출
}
```

### 안전 패턴
```javascript
// 안전: 서버 로그에만 기록, 클라이언트엔 일반 메시지만
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err); // 서버 로그
  res.status(500).json({ error: '서버 오류가 발생했습니다.' }); // 일반 메시지
});
```

---

## 패턴 9: 보안 헤더

### 취약 패턴 — 기본 Express 설정
```javascript
const express = require('express');
const app = express();
// 별도 보안 헤더 설정 없음
// X-Powered-By: Express 헤더가 자동으로 노출됨
```

### 안전 패턴 — helmet 사용
```javascript
const helmet = require('helmet');

app.use(helmet()); // 다음 헤더들을 자동으로 설정:
// X-Content-Type-Options: nosniff
// X-Frame-Options: SAMEORIGIN
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=15552000
// Content-Security-Policy: (기본 정책)
// X-Powered-By 헤더 제거

// CORS 제한
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## 체크리스트 — LLM 생성 코드 분석 시 확인 항목

### 인증 & 세션
- [ ] 비밀번호 bcrypt 해시 사용 여부
- [ ] JWT 시크릿 환경변수 처리 여부
- [ ] JWT 만료 시간 설정 여부
- [ ] JWT 알고리즘 명시 여부
- [ ] 세션 쿠키 `httpOnly`, `secure`, `sameSite` 설정 여부

### 데이터 처리
- [ ] SQL 쿼리 Prepared Statement 사용 여부
- [ ] ORM 사용 시 raw query 혼용 여부
- [ ] 사용자 입력값 직접 `exec()` 전달 여부

### 파일 업로드
- [ ] MIME 타입 화이트리스트 검증 여부
- [ ] 파일명 재생성 여부
- [ ] 업로드 경로 웹 루트 밖 여부
- [ ] 파일 크기 제한 여부

### 접근 제어
- [ ] 리소스 수정/삭제 시 소유권 확인 여부
- [ ] 관리자 기능 역할 검증 여부

### 설정 & 기타
- [ ] 시크릿 키 하드코딩 여부
- [ ] `helmet` 또는 보안 헤더 설정 여부
- [ ] 에러 스택 트레이스 클라이언트 노출 여부
- [ ] `npm audit` 취약 패키지 여부
