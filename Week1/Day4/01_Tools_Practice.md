# Day 4 - Tools Practice

## 오늘 한 것
1. ZAP으로 DVWA 자동 스캔
2. Semgrep으로 취약한 코드 스캔

---

## 1. ZAP 스캔

### DVWA 실행
```bash
docker start $(docker ps -aq --filter ancestor=vulnerables/web-dvwa)
```
접속: `http://localhost:8081`

### Automated Scan (로그인 없이)
1. ZAP 실행
2. 메인 화면 **Automated Scan** 클릭
3. URL: `http://localhost:8081` 입력 → **Attack**
4. 완료 후 하단 **경고(Alerts)** 탭 확인

결과: 11개 발견 (빨간색 없음)

| 항목 | 의미 |
|------|------|
| Content Security Policy Not Set | XSS 방어 헤더 없음 |
| Missing Anti-clickjacking Header | 클릭재킹 공격 가능 |
| Cookie No HttpOnly Flag | JS로 쿠키 탈취 가능 |
| Cookie without SameSite Attribute | CSRF 공격 가능 |
| Server Leaks Version Information | 서버 버전 노출 |
| 디렉토리 탐색 | 서버 디렉토리 구조 노출 |

> 로그인 없이 스캔하면 겉만 보여서 실제 취약점은 못 찾음

### Manual Explore (로그인 후 스캔)
1. ZAP 메인 화면 **Manual Explore** 클릭
2. URL: `http://localhost:8081` → **Launch Browser**
3. ZAP 브라우저에서 DVWA 로그인 (admin / password)
4. 여러 페이지 둘러보기 → ZAP 왼쪽 Sites 탭에 구조 쌓임
5. Sites 탭에서 `http://localhost:8081` 우클릭 → **Attack → Active Scan** → **Start Scan**
6. 완료 후 **경고(Alerts)** 탭 확인

결과: 24개 발견 (빨간색 2개)

| 항목 | 심각도 |
|------|--------|
| SQL Injection | High |
| 경로 추적 (Path Traversal) | High |

> 로그인 후 스캔하면 실제 기능까지 테스트해서 더 많이 찾음

---

## 2. Semgrep 코드 스캔

### PATH 설정 (터미널 새로 열 때마다 필요)
```bash
set PATH=%PATH%;C:\Users\admin\AppData\Roaming\Python\Python310\Scripts
```

### 테스트용 취약 코드
`Week1/Day4/test_code/vuln.js` — SQL Injection, 하드코딩된 시크릿 포함

### 커스텀 규칙으로 스캔
```bash
semgrep --config C:/web_security/Week1/Day4/test_code/rules.yaml --no-git-ignore C:/web_security/Week1/Day4/test_code/vuln.js
```

결과: 3개 발견

| 줄 | 규칙 | 내용 |
|----|------|------|
| 10 | sql-injection-string-concat | 사용자 입력을 쿼리에 직접 연결 |
| 23 | hardcoded-secret | SECRET_KEY 하드코딩 |
| 24 | hardcoded-secret | DB_PASSWORD 하드코딩 |

### 핵심
```
규칙(rule) 작성 → 취약한 코드 패턴 정의
→ 코드베이스 스캔
→ 패턴 일치하는 줄 경고
```

---

## ZAP vs Burp vs Semgrep 비교

| 도구 | 방식 | 용도 |
|------|------|------|
| ZAP | 동적 (실행 중인 앱 공격) | 자동 취약점 스캔 |
| Burp Suite | 동적 (수동 요청 조작) | 직접 취약점 테스트 |
| Semgrep | 정적 (코드 분석) | 배포 전 코드 취약점 탐지 |
