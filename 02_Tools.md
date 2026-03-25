# 실험 도구 정리

---

## 도구 전체 목록

| 분류 | 도구 | 용도 | 우선순위 |
|------|------|------|---------|
| 정적 분석 | Semgrep | LLM 생성 코드 룰셋 스캔 | ★★★ |
| 정적 분석 | npm audit | 의존성 취약점 (CVE) | ★★★ |
| 동적 분석 | OWASP ZAP | 자동 웹 취약점 스캔 | ★★★ |
| 동적 분석 | Burp Suite CE | HTTP 요청 조작, 수동 테스트 | ★★★ |
| 동적 분석 | Nikto | 웹 서버 설정 오류 스캔 | ★★ |
| SQLi 검증 | sqlmap | SQL Injection 자동화 | ★★ |
| JWT 검증 | jwt_tool | JWT 취약점 테스트 | ★★ |
| 실습 환경 | DVWA | 취약한 실습용 웹 앱 | ★★★ |
| 점수화 | CVSS Calculator | 취약점 심각도 수치화 | ★★★ |

---

## 1. Semgrep (정적 분석)

### 개념
코드를 실행하지 않고 **소스코드의 패턴을 검사**하는 도구.
LLM이 생성한 코드를 바로 분석할 수 있어 실험에 가장 먼저 사용.

### 설치
```bash
# pip 설치 (Python 필요)
pip install semgrep

# 또는 winget (Windows)
winget install Semgrep.Semgrep
```

### 기본 사용법
```bash
# Node.js 보안 룰셋으로 스캔
semgrep --config "p/nodejs" ./target-app

# OWASP Top 10 룰셋
semgrep --config "p/owasp-top-ten" ./target-app

# 결과를 JSON으로 출력 (논문 데이터 활용)
semgrep --config "p/nodejs" --json ./target-app > semgrep_result.json

# 여러 룰셋 동시 적용
semgrep --config "p/nodejs" --config "p/jwt" --config "p/sql-injection" ./target-app
```

### 실험에서 활용 방법
```bash
# 각 LLM 생성 코드 디렉터리에 동일한 룰셋 적용
semgrep --config "p/nodejs" --json ./gpt4o-A    > results/gpt4o-A.json
semgrep --config "p/nodejs" --json ./gpt4o-B    > results/gpt4o-B.json
semgrep --config "p/nodejs" --json ./gemini-A   > results/gemini-A.json
semgrep --config "p/nodejs" --json ./gemini-B   > results/gemini-B.json
semgrep --config "p/nodejs" --json ./claude-A   > results/claude-A.json
semgrep --config "p/nodejs" --json ./claude-B   > results/claude-B.json
```

### 결과 읽는 법
```json
{
  "results": [
    {
      "check_id": "javascript.node-mysql.node-mysql-sqli",
      "path": "routes/auth.js",
      "start": { "line": 23 },
      "extra": {
        "message": "SQL Injection vulnerability detected",
        "severity": "ERROR"
      }
    }
  ],
  "stats": {
    "total_findings": 5
  }
}
```

---

## 2. npm audit (의존성 취약점 분석)

### 개념
`package.json`에 정의된 npm 패키지들의 **알려진 CVE 취약점**을 검사.

### 사용법
```bash
# 기본 실행
npm audit

# JSON 출력 (논문 데이터)
npm audit --json > npm_audit_result.json

# 심각도별 필터
npm audit --audit-level=high   # high 이상만 출력
npm audit --audit-level=critical
```

### 결과 예시
```
found 3 vulnerabilities (1 moderate, 2 high)

high    Prototype Pollution
        Package: lodash
        Patched in: >=4.17.21
        Dependency of: express-app
```

---

## 3. OWASP ZAP (동적 자동 스캔)

### 개념
실행 중인 웹 서비스를 대상으로 **자동으로 취약점을 탐지**하는 프록시 도구.
GUI와 CLI 모두 지원.

### 설치
- 공식 사이트에서 Windows 인스톨러 다운로드
- `zaproxy.org/download/`

### CLI 사용법 (실험 자동화에 유리)
```bash
# 기본 스캔 (Baseline Scan)
zap-baseline.py -t http://localhost:3000 -r zap_report.html

# 전체 스캔 (더 공격적, 시간 소요)
zap-full-scan.py -t http://localhost:3000 -r zap_full_report.html

# JSON 출력
zap-baseline.py -t http://localhost:3000 -J zap_result.json
```

### GUI 사용 순서 (초보자용)
```
1. ZAP 실행
2. [Automated Scan] 선택
3. URL 입력: http://localhost:3000
4. [Attack] 클릭
5. Alerts 탭에서 발견된 취약점 확인
```

### 주요 Alert 항목 해석
| Alert | 의미 |
|-------|------|
| SQL Injection | SQLi 가능성 발견 |
| Cross Site Scripting (Reflected) | Reflected XSS |
| Cookie Without Secure Flag | HTTPS 전용 쿠키 미설정 |
| X-Content-Type-Options Header Missing | 보안 헤더 누락 |
| Application Error Disclosure | 에러 메시지 노출 |

---

## 4. Burp Suite Community Edition (수동 테스트)

### 개념
HTTP/HTTPS 요청을 **가로채고 수정**할 수 있는 프록시 도구.
ZAP의 자동 스캔으로 못 잡는 취약점을 **수동으로 검증**할 때 사용.

### 설치
- `portswigger.net/burp/communitydownload` 에서 다운로드

### 기본 워크플로
```
브라우저 → Burp Proxy (127.0.0.1:8080) → 웹 서버
                     ↓
           Intercept 탭에서 요청 확인·수정
```

### 브라우저 프록시 설정 (Firefox 권장)
```
설정 → 네트워크 설정 → 수동 프록시 설정
HTTP 프록시: 127.0.0.1  포트: 8080
```

### 실험에서 활용 방법

**1) IDOR(접근 제어) 테스트**
```
1. 사용자 A로 로그인 후 게시글 작성 (id=1)
2. Burp에서 DELETE /post/1 요청 확인
3. 사용자 B로 로그인 후 같은 요청 재전송
4. 200 응답 → 취약, 403 응답 → 안전
```

**2) SQL Injection 테스트**
```
1. 로그인 요청 Intercept
2. Body에서 email 값 수정:
   email=test@test.com' OR '1'='1
3. 응답 확인: 로그인 성공 → SQLi 취약
```

**3) XSS 테스트**
```
1. 게시글 작성 요청 Intercept
2. title 값에 스크립트 삽입:
   title=<script>alert(1)</script>
3. 해당 게시글 조회 시 alert 실행 → Stored XSS 취약
```

---

## 5. sqlmap (SQL Injection 자동화)

### 개념
SQL Injection 취약점을 **자동으로 탐지·추출**하는 도구.
ZAP이 가능성을 탐지하면, sqlmap으로 실제 데이터 추출 가능 여부를 검증.

### 설치
```bash
# Python 필요
pip install sqlmap
# 또는 GitHub에서 clone
git clone https://github.com/sqlmapproject/sqlmap
```

### 기본 사용법
```bash
# 로그인 폼 테스트 (POST)
sqlmap -u "http://localhost:3000/api/login" \
  --data "email=test@test.com&password=1234" \
  --dbs   # DB 목록 추출

# 쿠키/세션 인증 후 테스트
sqlmap -u "http://localhost:3000/api/posts?search=keyword" \
  --cookie "connect.sid=your-session-id" \
  --level=3

# 결과를 파일로 저장
sqlmap -u "http://localhost:3000/api/login" \
  --data "email=test&password=1234" \
  --output-dir ./sqlmap_results
```

> **주의**: 실험 대상 서버에만 사용. 외부 서비스에 무단으로 사용하면 불법.

---

## 6. jwt_tool (JWT 취약점 테스트)

### 개념
JWT(JSON Web Token)의 **다양한 취약점을 자동으로 테스트**하는 도구.

### 설치
```bash
git clone https://github.com/ticarpi/jwt_tool
cd jwt_tool
pip install -r requirements.txt
```

### 주요 테스트
```bash
# JWT 디코딩 & 분석
python3 jwt_tool.py <token>

# alg:none 공격 테스트
python3 jwt_tool.py <token> -X a

# 약한 시크릿 키 무차별 대입
python3 jwt_tool.py <token> -C -d /usr/share/wordlists/rockyou.txt

# 전체 취약점 자동 스캔
python3 jwt_tool.py <token> -t http://localhost:3000/api/profile \
  -rh "Authorization: Bearer JWT" -M at
```

---

## 7. DVWA (실습 환경)

### 개념
취약점 연습용으로 의도적으로 만든 **취약한 PHP 웹 앱**.
도구 사용법을 익히기 위한 연습 환경으로 사용.

### Docker로 실행
```bash
docker pull vulnerables/web-dvwa
docker run -d -p 80:80 vulnerables/web-dvwa
# 브라우저에서 http://localhost 접속
# admin / password 로 로그인
```

### 연습 순서
```
1. Security Level: Low로 시작
2. SQL Injection → Burp Suite로 요청 조작 연습
3. File Upload → 악성 파일 업로드 시도 연습
4. Security Level: Medium, High으로 올리며 우회 기법 학습
```

---

## 8. CVSS v3.1 Calculator (취약점 점수화)

### 개념
발견된 취약점의 **심각도를 0.0 ~ 10.0 점수로 정량화**.
논문에서 LLM별 비교에 필수적인 객관적 지표.

### 점수 범위
| 점수 | 등급 |
|------|------|
| 0.0 | None |
| 0.1 ~ 3.9 | Low |
| 4.0 ~ 6.9 | Medium |
| 7.0 ~ 8.9 | High |
| 9.0 ~ 10.0 | Critical |

### 주요 측정 항목 (Base Score)
| 항목 | 설명 |
|------|------|
| Attack Vector (AV) | 네트워크/물리적 접근 필요 여부 |
| Attack Complexity (AC) | 공격 복잡도 |
| Privileges Required (PR) | 사전 권한 필요 여부 |
| User Interaction (UI) | 피해자 행동 필요 여부 |
| Confidentiality (C) | 기밀성 영향 |
| Integrity (I) | 무결성 영향 |
| Availability (A) | 가용성 영향 |

### 논문 활용 예시

| LLM | 조건 | 발견 취약점 수 | 평균 CVSS | 최고 CVSS |
|-----|------|--------------|-----------|-----------|
| GPT-4o | A (보안 없음) | 8 | 7.2 | 9.8 (SQLi) |
| GPT-4o | B (보안 요청) | 3 | 4.1 | 6.5 |
| Gemini | A | 6 | 6.8 | 8.7 |
| ... | ... | ... | ... | ... |

---

## 실험 자동화 스크립트 예시

```bash
#!/bin/bash
# 6개 케이스 일괄 정적 분석

CASES=("gpt4o-A" "gpt4o-B" "gemini-A" "gemini-B" "claude-A" "claude-B")
mkdir -p results

for CASE in "${CASES[@]}"; do
  echo "Scanning $CASE ..."

  # Semgrep 정적 분석
  semgrep --config "p/nodejs" --config "p/owasp-top-ten" \
    --json ./apps/$CASE > results/${CASE}_semgrep.json

  # npm audit
  cd ./apps/$CASE
  npm audit --json > ../../results/${CASE}_npm_audit.json
  cd ../..

  echo "$CASE done."
done
```
