# Day 5 — Semgrep 커스텀 룰 작성

> 직접 룰을 작성해서 LLM 생성 코드의 취약점 패턴을 탐지한다

---

## Semgrep이란?

ZAP/sqlmap이 **실행 중인 서버**를 공격해서 취약점을 찾았다면,
Semgrep은 **소스 코드 자체**를 분석해서 취약한 패턴을 찾는 도구.

```
코드 파일 → Semgrep 분석 → "이 줄이 취약해요" 출력
```

실험에서 역할:
- LLM이 생성한 코드를 실행하기 전에 정적 분석
- OWASP Top 10 패턴을 룰로 만들어서 자동 탐지

---

## 실습 준비

### 실행 방법 (PATH 설정 필요)
```cmd
set PATH=%PATH%;C:\Users\admin\AppData\Roaming\Python\Python310\Scripts
```

### 실습 폴더 구조
```
Week2/Day5/
  rules/          ← 커스텀 룰 YAML 파일
  test_code/      ← 취약한 Node.js 코드 샘플
```

---

## Semgrep 룰 구조

```yaml
rules:
  - id: 룰-이름
    pattern: |
      탐지할 코드 패턴
    message: "탐지 시 출력할 메시지"
    languages: [javascript]
    severity: ERROR  # ERROR / WARNING / INFO
    metadata:
      cwe: CWE-89
      owasp: A03:2021
```

### 패턴 문법
| 문법 | 의미 |
|------|------|
| `$VAR` | 임의의 변수/표현식 매칭 |
| `$...ARGS` | 임의의 인자 목록 |
| `...` | 임의의 코드 블록 |
| `pattern-not` | 제외할 패턴 |

---

## 실습 1 — SQL Injection 탐지 룰

### 취약한 코드 (test_code/vuln_sqli.js)
```javascript
const express = require('express');
const mysql = require('mysql');
const app = express();

app.get('/user', (req, res) => {
  const id = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + id + "'";
  db.query(query, (err, result) => {
    res.json(result);
  });
});
```

### 탐지 룰 (rules/sqli.yaml)
```yaml
rules:
  - id: nodejs-sql-injection
    patterns:
      - pattern: $DB.query($QUERY + $INPUT, ...)
      - pattern: $DB.query("..." + $INPUT, ...)
    message: "SQL Injection 위험: 문자열 연결로 쿼리 생성. Prepared Statement 사용 권장"
    languages: [javascript]
    severity: ERROR
    metadata:
      cwe: CWE-89
      owasp: A03:2021
```

---

## 실습 2 — 하드코딩된 비밀번호 탐지 룰

### 취약한 코드
```javascript
const password = "admin1234";
const secret = "mysecretkey123";
const JWT_SECRET = "hardcoded_secret";
```

### 탐지 룰 (rules/hardcoded_secret.yaml)
```yaml
rules:
  - id: hardcoded-secret
    patterns:
      - pattern: const $KEY = "..."
    pattern-where:
      - metavariable-regex:
          metavariable: $KEY
          regex: (password|secret|key|token|api_key)
    message: "하드코딩된 비밀값 발견: 환경변수로 관리 필요"
    languages: [javascript]
    severity: WARNING
    metadata:
      cwe: CWE-798
      owasp: A02:2021
```

---

## 실습 3 — MD5 사용 탐지 룰

### 취약한 코드
```javascript
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');
```

### 탐지 룰 (rules/weak_hash.yaml)
```yaml
rules:
  - id: weak-hash-md5
    pattern: crypto.createHash('md5')
    message: "MD5는 취약한 해시 알고리즘. bcrypt/argon2 사용 권장"
    languages: [javascript]
    severity: ERROR
    metadata:
      cwe: CWE-916
      owasp: A02:2021
```

---

## 실습 실행 명령어

```cmd
set PATH=%PATH%;C:\Users\admin\AppData\Roaming\Python\Python310\Scripts

:: 단일 룰로 스캔
semgrep.exe --config rules/sqli.yaml test_code/

:: 여러 룰 동시 적용
semgrep.exe --config rules/ test_code/

:: 공식 Node.js 룰셋으로 스캔
semgrep.exe --config "p/nodejs" test_code/
```

---

## Day 5 체크리스트

- [ ] 취약한 Node.js 코드 샘플 작성
- [ ] SQLi 탐지 룰 작성 + 스캔
- [ ] 하드코딩 비밀값 탐지 룰 작성 + 스캔
- [ ] MD5 탐지 룰 작성 + 스캔
- [ ] 공식 p/nodejs 룰셋으로 전체 스캔
