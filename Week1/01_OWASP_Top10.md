# OWASP Top 10 (2021) 핵심 개념 정리

> 실험 서비스(로그인, 게시판, 파일 업로드, 댓글)와 연관성이 높은 항목 위주로 정리

---

## 실험 우선순위 요약

| 우선순위 | 항목 | 실험 서비스 연관 포인트 |
|---------|------|----------------------|
| ★★★ | A03 Injection | 로그인·게시판 검색 입력값 |
| ★★★ | A07 Auth Failures | 비밀번호 저장 방식, 세션/JWT 처리 |
| ★★★ | A08 파일 업로드 | 파일 첨부 기능 |
| ★★ | A01 접근제어 | 남의 게시글 삭제, 댓글 수정 |
| ★★ | A02 암호화 실패 | 비밀번호·민감정보 저장 |
| ★ | A05 보안 설정 오류 | HTTP 헤더, 에러 메시지 노출 |
| ★ | A06 취약한 컴포넌트 | npm 패키지 버전 |

---

## A01 — Broken Access Control (접근 제어 실패)

### 개념
인증된 사용자가 **권한 없는 자원에 접근**할 수 있는 취약점.
"로그인은 되어 있지만, 남의 데이터를 건드릴 수 있다"는 상황.

### 실험 서비스에서 확인할 포인트
- 다른 사용자의 게시글을 `DELETE /post/:id` 로 삭제할 수 있는가?
- 다른 사용자의 댓글을 수정할 수 있는가?
- URL의 ID 값을 바꿔서 타인의 데이터에 접근 가능한가? (IDOR)

### 취약 코드 예시
```javascript
// 요청한 사람이 게시글 작성자인지 확인하지 않음
app.delete('/post/:id', async (req, res) => {
  await Post.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});
```

### 안전한 코드 예시
```javascript
app.delete('/post/:id', authMiddleware, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post || post.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await post.destroy();
  res.json({ success: true });
});
```

### 관련 CWE
- CWE-284: Improper Access Control
- CWE-639: Authorization Bypass Through User-Controlled Key (IDOR)

---

## A02 — Cryptographic Failures (암호화 실패)

### 개념
민감한 데이터(비밀번호, 개인정보 등)가 **적절히 암호화되지 않고** 저장·전송되는 취약점.

### 실험 서비스에서 확인할 포인트
- 비밀번호를 평문으로 DB에 저장하는가?
- MD5 / SHA1 같은 **취약한 해시 알고리즘** 사용하는가?
- bcrypt / argon2 같은 **솔트+스트레칭** 방식을 쓰는가?
- HTTPS가 아닌 HTTP로만 서비스하는가?

### 알고리즘 비교

| 알고리즘 | 안전성 | 이유 |
|---------|-------|------|
| 평문 저장 | 매우 위험 | DB 유출 시 즉시 노출 |
| MD5 | 위험 | 레인보우 테이블, 충돌 취약 |
| SHA1 | 위험 | 충돌 공격 가능 |
| SHA256 (솔트 없음) | 위험 | 레인보우 테이블 가능 |
| bcrypt | 안전 | 솔트 자동 생성, 느린 연산 |
| argon2 | 매우 안전 | 메모리 집약적, 현재 최선 |

### 취약 코드 예시
```javascript
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');
// 또는 그냥 password 그대로 저장
```

### 안전한 코드 예시
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12); // saltRounds: 10~12 권장
// 검증 시
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 관련 CWE
- CWE-256: Plaintext Storage of a Password
- CWE-327: Use of a Broken or Risky Cryptographic Algorithm

---

## A03 — Injection (인젝션)

### 개념
사용자 입력값이 **명령어나 쿼리의 일부로 해석**되어 실행되는 취약점.
SQL Injection이 가장 대표적이며, Command Injection, NoSQL Injection 등도 포함.

### SQL Injection 원리
```
정상 입력: username = "alice"
쿼리: SELECT * FROM users WHERE username = 'alice'

악의적 입력: username = "' OR '1'='1"
쿼리: SELECT * FROM users WHERE username = '' OR '1'='1'
→ 모든 사용자 정보 반환
```

### 실험 서비스에서 확인할 포인트
- 로그인 폼에서 SQL Injection 가능한가?
- 게시판 검색 기능에서 SQL Injection 가능한가?
- Node.js에서 문자열 연결(`+`, 템플릿 리터럴)로 쿼리를 만드는가?

### 취약 코드 예시
```javascript
// 문자열 연결 — SQL Injection 가능
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
db.query(query, (err, results) => { ... });

// 템플릿 리터럴도 동일하게 위험
db.query(`SELECT * FROM posts WHERE title LIKE '%${keyword}%'`);
```

### 안전한 코드 예시
```javascript
// Prepared Statement (mysql2)
db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

// ORM 사용 (Sequelize)
User.findOne({ where: { email, password } });

// 검색도 파라미터 바인딩
db.query('SELECT * FROM posts WHERE title LIKE ?', [`%${keyword}%`]);
```

### Command Injection (Node.js 특유)
```javascript
// 취약: 사용자 입력을 exec에 직접 전달
const { exec } = require('child_process');
exec(`convert ${req.body.filename} output.png`);

// 안전: execFile 사용 + 입력값 검증
const { execFile } = require('child_process');
execFile('convert', [sanitizedFilename, 'output.png']);
```

### 관련 CWE
- CWE-89: SQL Injection
- CWE-78: OS Command Injection
- CWE-943: NoSQL Injection

---

## A07 — Identification and Authentication Failures (인증 실패)

### 개념
로그인, 세션, 토큰 관리가 **잘못 구현**되어 공격자가 다른 사용자로 위장할 수 있는 취약점.

### 실험 서비스에서 확인할 포인트
- 세션 ID가 로그인 후 재생성되는가? (Session Fixation 방지)
- JWT 시크릿 키가 하드코딩되어 있는가? (`secret`, `1234` 등)
- JWT의 `alg: none` 공격에 취약한가?
- 로그아웃 시 서버 측 세션이 실제로 파기되는가?
- 비밀번호 재시도 제한이 있는가? (Brute Force 방지)

### JWT 취약점 정리

```javascript
// 취약 1: 하드코딩된 약한 시크릿
const token = jwt.sign({ userId: user.id }, 'secret');
const token = jwt.sign({ userId: user.id }, '1234');

// 취약 2: 만료 시간 없음
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
// exp 클레임 없으면 토큰이 영원히 유효

// 취약 3: 알고리즘 검증 안 함
jwt.verify(token, secret); // alg: none 공격 가능

// 안전
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,  // 환경변수에서 읽기
  { expiresIn: '1h', algorithm: 'HS256' }
);
jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

### 세션 관련 취약점
```javascript
// 취약: 기본 설정 그대로 사용
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// 안전
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // JS에서 쿠키 접근 차단
    secure: true,     // HTTPS에서만 전송
    sameSite: 'strict', // CSRF 방지
    maxAge: 1000 * 60 * 60 // 1시간
  }
}));
```

### 관련 CWE
- CWE-287: Improper Authentication
- CWE-384: Session Fixation
- CWE-798: Hard-coded Credentials

---

## A08 — Software and Data Integrity Failures (파일 업로드 취약점)

### 개념
업로드된 파일의 **타입·내용을 검증하지 않아** 악성 파일이 서버에 저장·실행되는 취약점.

### 실험 서비스에서 확인할 포인트
- 파일 확장자만 검사하는가? (우회 가능)
- MIME 타입(Content-Type)을 검사하는가? (클라이언트 조작 가능)
- Magic Bytes(파일 시그니처)를 검사하는가? (가장 신뢰할 수 있음)
- 업로드 경로가 웹 루트 밖에 있는가?
- 업로드된 파일이 직접 실행될 수 있는가? (`.php`, `.js` 등)
- 파일명에 `../` 같은 경로 순회 문자가 필터링되는가?

### 공격 시나리오
```
1. image.php.jpg → 서버가 확장자만 보면 jpg로 인식, 실제론 PHP 실행
2. ../../../etc/passwd → 경로 순회로 시스템 파일 덮어쓰기
3. shell.js → Node.js 서버에서 실행 가능한 파일 업로드
```

### 취약 코드 예시 (multer 기본 설정)
```javascript
const upload = multer({ dest: 'uploads/' });
// 아무 검증 없이 모든 파일 허용
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});
```

### 안전한 코드 예시
```javascript
const path = require('path');
const { Buffer } = require('buffer');

// 1. 허용할 MIME 타입 화이트리스트
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

// 2. Magic Bytes 검증 함수
function checkMagicBytes(buffer) {
  const jpegMagic = buffer.slice(0, 3).toString('hex') === 'ffd8ff';
  const pngMagic  = buffer.slice(0, 4).toString('hex') === '89504e47';
  const pdfMagic  = buffer.slice(0, 4).toString('ascii') === '%PDF';
  return jpegMagic || pngMagic || pdfMagic;
}

const storage = multer.diskStorage({
  destination: '/var/uploads',  // 웹 루트 밖
  filename: (req, file, cb) => {
    // 파일명 재생성 (원본 파일명 사용 금지)
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, safeName + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('허용되지 않는 파일 형식'));
    }
    cb(null, true);
  }
});
```

### 관련 CWE
- CWE-434: Unrestricted Upload of File with Dangerous Type
- CWE-22: Path Traversal

---

## A05 — Security Misconfiguration (보안 설정 오류)

### 실험 서비스에서 확인할 포인트
- 스택 트레이스가 에러 응답에 그대로 노출되는가?
- `X-Powered-By: Express` 헤더가 노출되는가?
- CORS가 `*`(모든 도메인)으로 열려 있는가?
- 보안 HTTP 헤더(`helmet`)가 설정되어 있는가?

### 취약/안전 비교
```javascript
// 취약: 에러 그대로 노출
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

// 취약: CORS 전체 오픈
app.use(cors()); // origin: * 가 기본값

// 안전: helmet으로 보안 헤더 일괄 설정
const helmet = require('helmet');
app.use(helmet());

// 안전: CORS 제한
app.use(cors({ origin: 'https://myapp.com' }));

// 안전: 에러 처리
app.use((err, req, res, next) => {
  console.error(err); // 서버 로그에만 기록
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});
```

---

## A06 — Vulnerable and Outdated Components (취약한 컴포넌트)

### 실험 서비스에서 확인할 포인트
- `package.json`의 의존성 버전
- `npm audit` 실행 결과

### 확인 방법
```bash
npm audit                    # 취약한 패키지 목록 출력
npm audit --json             # JSON 형식 출력 (논문 데이터로 활용)
npm outdated                 # 최신 버전과 비교
```

---

## 참고 자료
- OWASP Top 10 공식: https://owasp.org/Top10/
- PortSwigger Web Security Academy: https://portswigger.net/web-security
- CVSS Calculator: https://www.first.org/cvss/calculator/3.1
