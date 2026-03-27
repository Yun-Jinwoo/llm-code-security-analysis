# SQL Injection

## 개념

사용자 입력값이 SQL 쿼리에 그대로 삽입되어, 공격자가 쿼리의 논리를 조작할 수 있는 취약점.

```sql
-- 정상적인 로그인 쿼리
SELECT * FROM users WHERE username = 'alice' AND password = '1234'

-- 공격자가 입력값을 조작하면
SELECT * FROM users WHERE username = '' OR 1=1--' AND password = ''
```

---

## 공격자가 할 수 있는 것

| 행위 | 설명 |
|------|------|
| 불법 조회 | 다른 유저의 비밀번호, 개인정보 열람 |
| 데이터 변조/삭제 | DB 내용 수정, 테이블 삭제 |
| 서버 장악 | DB 서버를 발판 삼아 내부 시스템 침투 |
| 서비스 마비 | 과부하로 서비스 중단 |

---

## SQLi가 발생하는 위치

```sql
SELECT * FROM products WHERE category = '입력값'   -- 가장 흔함
UPDATE users SET email = '입력값' WHERE id = 1
INSERT INTO logs VALUES ('입력값')
SELECT * FROM 테이블명입력값                        -- 테이블/컬럼명
SELECT * FROM products ORDER BY 입력값              -- ORDER BY
```

---

## 공격 유형

### 1) 숨겨진 데이터 조회

```
정상 URL: /products?category=Gifts
정상 쿼리: SELECT * FROM products WHERE category = 'Gifts' AND released = 1

공격 URL: /products?category=Gifts'--
공격 쿼리: SELECT * FROM products WHERE category = 'Gifts'--' AND released = 1
```

`--` 는 SQL 주석 기호 → `AND released = 1` 이 무시됨 → 미출시 상품까지 전부 노출

```
공격 URL: /products?category=Gifts'+OR+1=1--
공격 쿼리: SELECT * FROM products WHERE category = 'Gifts' OR 1=1--'
```

`OR 1=1` 은 항상 참 → 카테고리 상관없이 모든 상품 노출

---

### 2) 로그인 우회

```sql
-- 정상 로그인 쿼리
SELECT * FROM users WHERE username = 'wiener' AND password = 'bluecheese'

-- 공격: username에 administrator'-- 입력, 비밀번호는 아무거나
SELECT * FROM users WHERE username = 'administrator'--' AND password = ''
```

`--` 로 비밀번호 검증 쿼리가 주석 처리됨 → 비밀번호 없이 관리자 로그인

---

### 3) 다른 테이블 데이터 추출 (UNION 공격)

```sql
-- 원래 쿼리
SELECT name, description FROM products WHERE category = 'Gifts'

-- 공격 입력값
' UNION SELECT username, password FROM users--

-- 실행되는 쿼리
SELECT name, description FROM products WHERE category = ''
UNION SELECT username, password FROM users--'
```

상품 목록 화면에 유저 비밀번호가 같이 출력됨

---

### 4) Blind SQL Injection

쿼리 결과가 화면에 보이지 않아도 가능한 공격.

| 방법 | 원리 |
|------|------|
| 조건 응답 | 참/거짓에 따라 다른 응답 → 데이터 추론 |
| 시간 지연 | 참이면 5초 딜레이 → 응답 시간으로 데이터 추론 |
| OAST | DNS 요청을 외부 서버로 보내 데이터 탈취 |

---

## 탐지 방법

### 수동 탐지

| 방법 | 입력값 | 판단 기준 |
|------|--------|-----------|
| 따옴표 테스트 | `'` | 에러 발생 시 취약 가능성 |
| 참/거짓 비교 | `OR 1=1` vs `OR 1=2` | 응답이 다르면 취약 |
| 주석 처리 | `'--` | 결과가 달라지면 취약 |
| 시간 지연 | `'; SELECT SLEEP(5)--` | 응답이 5초 늦으면 취약 |

### 자동 탐지

| 도구 | 용도 |
|------|------|
| Burp Suite Scanner | 자동으로 위 방법들을 수행 |
| sqlmap | 탐지 + 실제 데이터 추출까지 자동화 |
| OWASP ZAP | 자동 스캔으로 가능성 탐지 |

---

## 예방법

```javascript
// 취약 — 문자열 연결
db.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`)

// 안전 — Prepared Statement (파라미터 바인딩)
db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
```

입력값을 쿼리 문자열에 직접 넣지 않고, **파라미터로 분리**하면 SQL Injection이 불가능해짐.
