# Day 5 - Node.js 취약 코드 패턴 (패턴 7-9)

## 패턴 7: 환경변수 관리

### 취약 코드 — 시크릿 하드코딩
```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root1234',
  database: 'myapp'
});

const JWT_SECRET = 'my-super-secret-key';
```

### 왜 위험한가
```
GitHub에 소스코드 올라감
→ 전 세계 누구나 볼 수 있음
→ DB 비밀번호 노출 → DB 직접 접속 가능
→ JWT 시크릿 노출 → 관리자 토큰 위조 가능
```
실제로 GitHub에서 매일 수천 개의 시크릿이 유출됨.

### 안전 코드 — dotenv 사용

**.env 파일** (Git에 절대 커밋 금지):
```
DB_HOST=localhost
DB_USER=appuser
DB_PASS=랜덤한_강력한_패스워드
JWT_SECRET=랜덤한_64자_이상_문자열
```

**.gitignore에 추가**:
```
.env
```

**코드에서 사용:**
```javascript
require('dotenv').config();

const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

const JWT_SECRET = process.env.JWT_SECRET;
```

---

## 패턴 8: 에러 처리 & 정보 노출

### 취약 코드
```javascript
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack   // 스택 트레이스를 클라이언트에 그대로 전달
  });
});
```

### 왜 위험한가
`err.stack` 이 이런 내용을 클라이언트에 노출:
```
Error: ER_NO_SUCH_TABLE: Table 'myapp.users' doesn't exist
    at /app/routes/auth.js:23:15
    at /app/node_modules/mysql/lib/query.js:50:12
```

공격자 입장에서:
```
→ DB 테이블 이름 파악 (myapp.users)
→ 소스코드 파일 경로 파악 (/app/routes/auth.js)
→ 사용 중인 라이브러리 파악 (mysql)
→ 이 정보로 더 정교한 공격 설계 가능
```

### 안전 코드
```javascript
app.use((err, req, res, next) => {
  // 상세 정보는 서버 로그에만 기록
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  // 클라이언트엔 일반 메시지만 전달
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});
```

---

## 패턴 9: 보안 헤더

### 보안 헤더란?
서버가 브라우저한테 "이 사이트는 이렇게 동작해" 라고 알려주는 규칙.

### 취약 코드 — 기본 Express 설정
```javascript
const express = require('express');
const app = express();
// 보안 헤더 설정 없음
// X-Powered-By: Express 헤더가 자동으로 노출됨
```

### ZAP 스캔과의 연결
Day 4 ZAP 스캔에서 나왔던 경고들이 바로 보안 헤더 부재 때문:
```
Content Security Policy Not Set       → XSS 방어 헤더 없음
Missing Anti-clickjacking Header      → 클릭재킹 방어 헤더 없음
X-Content-Type-Options Header Missing → MIME 타입 추측 방어 없음
```

### 안전 코드 — helmet 사용
```javascript
const helmet = require('helmet');

app.use(helmet());
// 위 경고들이 전부 해결됨
```

helmet이 자동으로 설정하는 헤더들:
```
X-Frame-Options: SAMEORIGIN
→ 내 사이트를 다른 사이트의 iframe에 넣지 못하게 함
→ 클릭재킹 방어

Content-Security-Policy
→ 허용된 출처의 스크립트만 실행
→ XSS 방어

X-Content-Type-Options: nosniff
→ 브라우저가 파일 타입을 마음대로 추측하지 못하게 함

X-Powered-By 헤더 제거
→ "Express 쓰고 있어요" 정보 숨김
```

---

## 9개 패턴과 OWASP Top 10 연결

우리가 본 9개 패턴은 OWASP Top 10 카테고리 안에 속하는 구체적인 구현 취약점.

| 패턴 | OWASP Top 10 분류 |
|------|-----------------|
| SQL Injection | A03: Injection |
| 비밀번호 저장 (MD5/평문) | A02: Cryptographic Failures |
| JWT 취약점 | A07: Identification & Authentication Failures |
| 파일 업로드 | A08: Software & Data Integrity Failures |
| IDOR | A01: Broken Access Control |
| XSS | A03: Injection |
| 환경변수 (하드코딩) | A02: Cryptographic Failures |
| 에러 처리 | A05: Security Misconfiguration |
| 보안 헤더 (helmet) | A05: Security Misconfiguration |

> OWASP Top 10 = "이 카테고리들이 실제로 제일 많이 터진다"는 순위표
> 우리가 배운 패턴들 = 그 카테고리가 Node.js 코드에서 어떻게 나타나는지

---

## Day 5 전체 패턴 요약

| 패턴 | 취약 | 안전 |
|------|------|------|
| SQL Injection | 쿼리에 문자열 직접 연결 | Prepared Statement |
| 비밀번호 저장 | 평문 / MD5 | bcrypt (saltRounds 12) |
| JWT | 하드코딩 시크릿, alg 미명시 | 환경변수, 알고리즘 강제 지정 |
| 파일 업로드 | 검증 없이 저장, 원본 파일명 사용 | 화이트리스트, 파일명 재생성, 웹루트 밖 저장 |
| IDOR | 로그인만 확인 | 소유권 + 역할(role) 확인 |
| XSS | innerHTML, 이스케이프 없는 출력 | textContent, 이스케이프 |
| 환경변수 | 하드코딩 | dotenv + .gitignore |
| 에러 처리 | 스택 트레이스 노출 | 서버 로그 기록, 일반 메시지만 응답 |
| 보안 헤더 | 설정 없음 | helmet() |
