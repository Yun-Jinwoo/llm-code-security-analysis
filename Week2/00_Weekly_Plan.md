# Week 2 학습 계획

> 목표: "도구를 자유자재로 쓰고, 실험에 쓸 분석 기준 초안을 완성한다"

---

## 주간 커리큘럼

| 날짜 | 주제 | 핵심 도구 |
|------|------|-----------|
| Day 1 | ZAP CLI 심화 — 커맨드라인 자동 스캔 | OWASP ZAP |
| Day 2 | Burp Suite Repeater 활용 | Burp Suite |
| Day 3 | Burp Suite Intruder — Brute Force / Fuzzing | Burp Suite |
| Day 4 | sqlmap — SQLi 자동화 테스트 | sqlmap |
| Day 5 | Semgrep 커스텀 룰 작성 | Semgrep |
| Day 6 | 분석 기준 초안 작성 (CVSS + OWASP 매핑) | 문서 작업 |
| Day 7 | Week 2 복습 + 실험 프로토콜 정리 | 전체 |

---

## Day 1 — ZAP CLI 심화

### 학습 목표
- ZAP을 GUI 없이 커맨드라인으로 실행할 수 있다
- 스캔 결과를 JSON/HTML 리포트로 저장할 수 있다
- 능동 스캔(Active Scan) vs 수동 스캔(Passive Scan) 차이를 안다

### 실습 내용
```bash
# ZAP 데몬 모드로 실행 (headless)
zap.sh -daemon -port 8090 -config api.disablekey=true

# ZAP CLI로 스캔 (zap-cli 또는 내장 API 사용)
# 기본 Spider 스캔
curl "http://localhost:8090/JSON/spider/action/scan/?url=http://localhost"

# Active Scan
curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://localhost"

# HTML 리포트 저장
curl "http://localhost:8090/OTHER/core/other/htmlreport/" > zap_report.html
```

### 핵심 개념
- **Passive Scan**: 트래픽을 관찰만 함, 서버에 무해
- **Active Scan**: 실제 페이로드를 보내 취약점 탐지, 공격적
- **Spider**: 사이트 구조를 자동으로 크롤링
- **Ajax Spider**: JS 렌더링이 필요한 SPA 크롤링용

---

## Day 2 — Burp Suite Repeater

### 학습 목표
- Repeater로 요청을 수동으로 수정·재전송할 수 있다
- SQLi, XSS 페이로드를 직접 삽입해볼 수 있다
- 응답 차이(Response diff)로 취약점을 확인할 수 있다

### 실습 내용
1. DVWA SQLi Low Level에서 정상 요청 가로채기
2. Repeater로 보내기 (Ctrl+R)
3. 파라미터에 페이로드 삽입:
   - `' OR '1'='1` → 로그인 우회
   - `' UNION SELECT 1,2,3--` → 컬럼 수 파악
   - `' UNION SELECT user(),database(),3--` → DB 정보 추출

---

## Day 3 — Burp Suite Intruder

### 학습 목표
- Intruder의 Attack Type 4가지를 이해한다
- Sniper 모드로 파라미터 Fuzzing을 할 수 있다
- 워드리스트로 Brute Force 공격을 시뮬레이션할 수 있다

### Attack Types
| 타입 | 설명 | 용도 |
|------|------|------|
| Sniper | 하나의 파라미터에 페이로드 순차 삽입 | 단일 파라미터 Fuzzing |
| Battering ram | 모든 파라미터에 동일 페이로드 | 같은 값 동시 테스트 |
| Pitchfork | 여러 파라미터에 각각 다른 목록 | 아이디+비번 조합 |
| Cluster bomb | 모든 조합 시도 | 완전 브루트포스 |

---

## Day 4 — sqlmap

### 학습 목표
- sqlmap으로 SQLi 자동 탐지·익스플로잇을 할 수 있다
- DB 덤프, 테이블 열거 등 post-exploitation을 이해한다
- 로그를 해석하고 취약점 여부를 판단할 수 있다

### 주요 명령어
```bash
# 기본 스캔
sqlmap -u "http://localhost/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="PHPSESSID=xxx; security=low"

# DB 목록 조회
sqlmap -u "..." --dbs

# 테이블 목록
sqlmap -u "..." -D dvwa --tables

# 데이터 덤프
sqlmap -u "..." -D dvwa -T users --dump

# 리스크/레벨 조정
sqlmap -u "..." --level=3 --risk=2
```

---

## Day 5 — Semgrep 커스텀 룰

### 학습 목표
- Semgrep 룰 문법(YAML)을 이해한다
- 직접 룰을 작성해서 LLM 생성 코드 패턴을 탐지할 수 있다
- 실험에 쓸 룰셋을 구성할 수 있다

### 룰 작성 예시
```yaml
rules:
  - id: nodejs-sql-injection
    patterns:
      - pattern: |
          $DB.query("..." + $INPUT, ...)
    message: "SQL Injection 가능성: 문자열 연결로 쿼리 생성"
    languages: [javascript]
    severity: ERROR
    metadata:
      cwe: CWE-89
      owasp: A03:2021
```

---

## Day 6 — 분석 기준 초안

### 목표
실험(LLM 생성 코드 비교)에 쓸 **표준화된 분석 기준표** 작성

### 구성 요소
1. 취약점 분류 기준 (OWASP CWE 번호)
2. 심각도 측정 기준 (CVSS v3.1)
3. 탐지 방법 (Semgrep / ZAP / 수동)
4. 평가 항목 정의

---

## Day 7 — 복습 & 실험 프로토콜

### 목표
- Week 2 전체 내용 복습
- Week 3 (Node.js 취약 환경 구축) 준비
- 실험 실행 순서 프로토콜 초안 작성

---

## Week 2 완료 기준

- [ ] ZAP CLI로 DVWA 스캔 후 리포트 저장
- [ ] Burp Repeater로 SQLi 페이로드 직접 삽입 성공
- [ ] Burp Intruder로 DVWA 로그인 브루트포스 시뮬레이션
- [ ] sqlmap으로 DVWA DB 덤프 성공
- [ ] Semgrep 커스텀 룰 1개 이상 직접 작성
- [ ] 분석 기준표 초안 완성
