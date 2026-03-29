# Day 3 — 실습 환경 설치

## 설치 목록

| 도구 | 용도 |
|------|------|
| Docker Desktop | DVWA 컨테이너 실행 |
| DVWA | 취약한 웹앱 실습 환경 |
| OWASP ZAP | 자동 취약점 스캔 |
| Burp Suite CE | HTTP 프록시, 요청 조작 |
| Semgrep | 정적 코드 분석 |

---

## 1. Docker Desktop

**다운로드**: `docs.docker.com/desktop/install/windows-install/`

설치 후 확인:
```bash
docker --version
docker ps
```

---

## 2. DVWA (Damn Vulnerable Web Application)

```bash
# 이미지 다운로드 및 실행
docker pull vulnerables/web-dvwa
docker run -d -p 80:80 vulnerables/web-dvwa
```

접속 및 초기화:
```
http://localhost 접속
ID: admin / PW: password 로그인
하단의 "Setup / Reset DB" 버튼 클릭 → DB 초기화
```

Security Level 설정 (연습용):
```
DVWA Security 탭 → Security Level: Low 선택 → Submit
```

> **Low Level**: 방어가 전혀 없는 상태. 공격 원리 이해에 최적.

---

## 3. OWASP ZAP

**다운로드**: `zaproxy.org/download/`

Windows용 설치파일 다운로드 후 실행.

첫 스캔 방법:
```
1. ZAP 실행
2. 상단 "Automated Scan" 클릭
3. URL to attack: http://localhost 입력
4. "Attack" 클릭
5. 완료 후 하단 "Alerts" 탭에서 발견된 취약점 목록 확인
```

Alert 우선순위:
- 빨간색 (High) → 즉시 확인
- 주황색 (Medium) → 중요
- 노란색 (Low) → 참고
- 파란색 (Informational) → 정보성

---

## 4. Burp Suite Community Edition

**다운로드**: `portswigger.net/burp/communitydownload`

### 프록시 설정

**Burp Suite 설정**:
```
Proxy 탭 → Options → Proxy Listeners
127.0.0.1:8080 이 활성화되어 있는지 확인
```

**Firefox 설정**:
```
설정 → 네트워크 설정 → 수동 프록시 설정
HTTP 프록시: 127.0.0.1 / 포트: 8080
```

**CA 인증서 설치** (HTTPS 트래픽 가로채기용):
```
Firefox에서 http://burpsuite 접속
CA Certificate 다운로드
Firefox 설정 → 인증서 → 인증서 가져오기
"이 CA가 웹사이트를 식별하는 것을 신뢰합니다" 체크
```

### 기본 사용법

```
Proxy 탭 → Intercept is on
→ Firefox에서 http://localhost 로그인 시도
→ Burp에 요청이 멈춤
→ 요청 내용(Headers, Body) 확인
→ Forward 버튼으로 전송
```

---

## 5. Semgrep

**설치**:
```bash
pip install semgrep
semgrep --version  # 확인
```

**첫 스캔**:
```bash
# Node.js 보안 룰셋으로 스캔
semgrep --config "p/nodejs" ./경로

# OWASP Top 10 관련 룰셋
semgrep --config "p/owasp-top-ten" ./경로
```

취약 코드 샘플 테스트:
```javascript
// test_vuln.js — 취약한 SQL 쿼리 예시
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);
```

```bash
semgrep --config "p/nodejs" test_vuln.js
# SQL injection 경고가 출력되어야 함
```

---

## 설치 완료 체크리스트

- [ ] `docker --version` 정상 출력
- [ ] `http://localhost` 에서 DVWA 로그인 성공
- [ ] DVWA DB Reset 완료
- [ ] ZAP 설치 및 실행 확인
- [ ] Burp Suite 설치 및 프록시 연결 확인
- [ ] `semgrep --version` 정상 출력
