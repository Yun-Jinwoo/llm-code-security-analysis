# 이번 주 학습 계획

> 목표: "OWASP Top 10을 이해하고, 실험에서 뭘 찾아야 하는지 감을 잡는다"

---

## 일별 계획

### Day 1-2 — OWASP 개념 + PortSwigger 랩

**학습 목표**: 실험 서비스와 연관된 5개 취약점의 개념과 공격 원리를 이해한다.

#### 학습 방법
PortSwigger Web Security Academy (`portswigger.net/web-security`) 에서 개념 읽고 랩 실습.
공식 OWASP 문서보다 훨씬 직관적이고 실습 중심.

#### Day 1 할 것
- [ ] SQL Injection 개념 읽기 (`/web-security/sql-injection`)
- [ ] SQL Injection 기초 랩 2개 풀기
  - "SQL injection vulnerability in WHERE clause allowing retrieval of hidden data"
  - "SQL injection vulnerability allowing login bypass"
- [ ] `01_OWASP_Top10.md` — A03 항목 다시 읽으며 정리

#### Day 2 할 것
- [ ] Authentication vulnerabilities 개념 읽기 (`/web-security/authentication`)
- [ ] File Upload Vulnerabilities 개념 읽기 (`/web-security/file-upload`)
- [ ] 각 랩 1개씩 풀기
- [ ] `01_OWASP_Top10.md` — A07, A08 항목 읽으며 정리

---

### Day 3-4 — 도구 설치 & 첫 실습

**학습 목표**: DVWA에 ZAP 스캔을 돌려보고, 결과를 읽는 법을 익힌다.

#### Day 3 할 것 — 환경 설치
- [ ] Docker Desktop 설치 (없는 경우)
- [ ] DVWA 실행
  ```bash
  docker pull vulnerables/web-dvwa
  docker run -d -p 80:80 vulnerables/web-dvwa
  # http://localhost 접속 후 admin / password 로그인
  # Setup / Reset DB 클릭
  ```
- [ ] OWASP ZAP 설치 (`zaproxy.org`)
- [ ] Burp Suite CE 설치 (`portswigger.net/burp/communitydownload`)
- [ ] Semgrep 설치
  ```bash
  pip install semgrep
  semgrep --version  # 설치 확인
  ```

#### Day 4 할 것 — 도구 첫 실습
- [ ] ZAP으로 DVWA 자동 스캔
  ```
  ZAP 실행 → Automated Scan → URL: http://localhost → Attack
  Alerts 탭에서 발견된 취약점 목록 확인
  ```
- [ ] Burp Suite 프록시 설정 후 DVWA 로그인 요청 가로채기
  ```
  Firefox 프록시: 127.0.0.1:8080 설정
  Burp → Proxy → Intercept ON
  DVWA 로그인 시도 → 요청 내용 확인
  ```
- [ ] Semgrep으로 샘플 코드 스캔 (아래 명령어 실행)
  ```bash
  # 테스트용 취약 코드 파일 만들어서 스캔해보기
  semgrep --config "p/nodejs" ./test_code
  ```

---

### Day 5-7 — Node.js 취약 코드 패턴 학습

**학습 목표**: `03_Nodejs_Patterns.md`의 패턴들을 코드로 이해하고,
LLM 생성 코드에서 어떻게 찾을지 감을 잡는다.

#### Day 5 할 것
- [ ] `03_Nodejs_Patterns.md` 전체 읽기
- [ ] 패턴 1 (SQL Injection), 패턴 2 (비밀번호 저장) 직접 파일로 작성해보기
- [ ] Semgrep으로 직접 작성한 취약 코드 스캔해서 탐지 확인

#### Day 6 할 것
- [ ] 패턴 3 (JWT), 패턴 5 (접근 제어 IDOR), 패턴 7 (환경변수) 이해
- [ ] DVWA의 SQL Injection Low Level에서 Burp Suite로 직접 공격 시도

#### Day 7 할 것
- [ ] 파일 업로드 취약점 — DVWA File Upload 랩 실습
- [ ] `03_Nodejs_Patterns.md` 하단의 **체크리스트** 보며 항목 의미 이해
- [ ] 이번 주 학습 내용 복습 및 모르는 개념 정리

---

## 이번 주 완료 기준 (체크리스트)

### 개념 이해
- [ ] SQL Injection 공격 원리를 설명할 수 있다
- [ ] Prepared Statement가 왜 안전한지 설명할 수 있다
- [ ] bcrypt가 MD5보다 안전한 이유를 설명할 수 있다
- [ ] JWT의 `alg:none` 공격이 어떻게 동작하는지 설명할 수 있다
- [ ] IDOR(Insecure Direct Object Reference)가 무엇인지 설명할 수 있다
- [ ] 파일 업로드 취약점의 공격 시나리오를 설명할 수 있다

### 실습 완료
- [ ] PortSwigger SQLi 기초 랩 2개 이상 풀었다
- [ ] PortSwigger Authentication 랩 1개 이상 풀었다
- [ ] DVWA + ZAP 스캔을 실행하고 결과를 읽었다
- [ ] Burp Suite로 HTTP 요청을 가로채고 수정해봤다
- [ ] Semgrep으로 코드를 스캔해봤다

### 코드 패턴
- [ ] 취약/안전 코드 패턴 5개 이상 구분할 수 있다
- [ ] 체크리스트의 항목들이 무엇을 의미하는지 안다

---

## 다음 주 예고 (Week 2)

- OWASP ZAP CLI 사용법 심화
- Burp Suite Repeater / Intruder 활용
- sqlmap으로 SQLi 자동화 테스트
- 실험에서 사용할 분석 기준 초안 작성

---

## 참고 링크

| 자료 | 링크 |
|------|------|
| PortSwigger Web Security Academy | `portswigger.net/web-security` |
| OWASP Top 10 (2021) | `owasp.org/Top10/` |
| CVSS v3.1 Calculator | `first.org/cvss/calculator/3.1` |
| Semgrep 룰셋 검색 | `semgrep.dev/explore` |
| DVWA Docker 이미지 | `hub.docker.com/r/vulnerables/web-dvwa` |
