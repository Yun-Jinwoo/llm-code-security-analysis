# Day 1 — ZAP CLI 심화 (Headless 스캔)

> ZAP을 GUI 없이 커맨드라인으로 실행해서 스캔 결과를 리포트로 저장한다

---

## 환경 확인

- ZAP 경로: `C:\Program Files\ZAP\Zed Attack Proxy\`
- ZAP 버전: 2.17.0
- 대상: DVWA (`http://localhost`)

---

## 핵심 개념

### Passive Scan vs Active Scan

| 구분 | 방식 | 특징 |
|------|------|------|
| **Passive Scan** | 트래픽 관찰만 | 서버에 무해, 자동으로 항상 동작 |
| **Active Scan** | 페이로드 직접 전송 | 취약점 탐지 정확도 높음, 공격적 |
| **Spider** | 링크 자동 수집·크롤링 | JS 미실행, 정적 크롤링 |
| **Ajax Spider** | JS 렌더링 후 크롤링 | SPA(React/Vue) 대응 |

### ZAP 실행 모드

| 모드 | 명령어 | 설명 |
|------|--------|------|
| GUI 모드 | `zap.bat` | 기본 GUI |
| Daemon 모드 | `zap.bat -daemon` | 백그라운드, REST API로 제어 |
| CLI 리포트 | `zap.bat -cmd` | 실행 후 종료 |

---

## 실습 1 — Docker 없이 ZAP으로 DVWA 스캔

> DVWA가 Docker로 실행 중이어야 합니다.
> Docker Desktop 실행 후 아래 명령어로 DVWA 시작:

```bash
docker run -d -p 80:80 vulnerables/web-dvwa
```

---

## 실습 2 — ZAP Daemon 모드 + REST API 스캔

### Step 1. ZAP 데몬 실행

```bat
cd "C:\Program Files\ZAP\Zed Attack Proxy"

zap.bat -daemon -port 8090 -config api.disablekey=true
```

> 실행 후 `ZAP is now listening on...` 메시지 나오면 준비 완료
> (약 20~30초 소요)

### Step 2. Spider 스캔 시작

```powershell
# DVWA Spider 스캔 시작
Invoke-RestMethod "http://localhost:8090/JSON/spider/action/scan/?url=http://localhost"

# 스캔 진행률 확인 (100이 되면 완료)
Invoke-RestMethod "http://localhost:8090/JSON/spider/view/status/?scanId=0"
```

### Step 3. Active Scan 시작

```powershell
# Active Scan 시작
Invoke-RestMethod "http://localhost:8090/JSON/ascan/action/scan/?url=http://localhost"

# 진행률 확인
Invoke-RestMethod "http://localhost:8090/JSON/ascan/view/status/?scanId=0"
```

### Step 4. 결과 리포트 저장

```powershell
# HTML 리포트
Invoke-WebRequest "http://localhost:8090/OTHER/core/other/htmlreport/" -OutFile "C:\web_security\Week2\Day1\zap_report.html"

# JSON 형식 알림 목록
Invoke-RestMethod "http://localhost:8090/JSON/alert/view/alerts/" | ConvertTo-Json | Out-File "C:\web_security\Week2\Day1\zap_alerts.json"
```

---

## 실습 3 — ZAP -quickurl 원라이너 스캔

GUI도 API도 필요 없는 가장 간단한 방법:

```bat
cd "C:\Program Files\ZAP\Zed Attack Proxy"

zap.bat -cmd -quickurl http://localhost -quickout C:\web_security\Week2\Day1\zap_quick_report.html
```

- `-cmd` : 스캔 후 자동 종료
- `-quickurl` : 대상 URL
- `-quickout` : 리포트 저장 경로
- `-quickprogress` : 진행상황 출력 옵션 추가 가능

---

## 리포트 읽는 법

### Alert Risk Level
| 레벨 | 의미 | 예시 |
|------|------|------|
| 🔴 High | 즉시 조치 필요 | SQLi, RCE |
| 🟠 Medium | 우선순위 높음 | XSS, CSRF |
| 🟡 Low | 보완 권장 | 정보 노출 |
| 🔵 Informational | 참고용 | 쿠키 설정 등 |

### 주요 확인 항목
1. **Alert 이름** — 취약점 종류
2. **URL** — 취약점 발견 위치
3. **Parameter** — 취약한 파라미터명
4. **Evidence** — 실제 탐지된 페이로드/응답
5. **Solution** — 권장 조치

---

## 실습 목표 체크리스트

- [ ] ZAP 데몬 모드 실행 성공
- [ ] Spider 스캔 완료 (진행률 100%)
- [ ] Active Scan 완료
- [ ] HTML 리포트 저장 완료
- [ ] 리포트에서 취약점 3개 이상 확인 및 내용 기록

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 포트 8090 이미 사용 중 | 이전 ZAP 프로세스 | 작업관리자에서 java.exe 종료 |
| 스캔이 0%에서 안 움직임 | DVWA 미실행 | Docker Desktop 실행 확인 |
| API 키 오류 | api.disablekey 설정 누락 | `-config api.disablekey=true` 추가 |
| ZAP 실행 안됨 | Java 경로 문제 | ZAP 폴더에서 직접 실행 |
