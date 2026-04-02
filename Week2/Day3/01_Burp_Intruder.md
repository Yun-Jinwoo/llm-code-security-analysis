# Day 3 — Burp Suite Intruder 활용

> Intruder로 DVWA 로그인 페이지에 브루트포스 공격을 시뮬레이션한다

---

## Intruder란?

Repeater가 **수동으로** 페이로드를 하나씩 바꿔가며 테스트했다면,
Intruder는 **자동으로** 페이로드 목록을 순차 삽입해 대량 테스트하는 도구.

```
요청 가로채기 → Intruder로 전송
       ↓
공격 위치(§) 지정
       ↓
페이로드 목록 설정
       ↓
자동 공격 → 응답 길이/상태코드로 성공 판별
```

---

## Attack Type 4가지

| 타입 | 설명 | 용도 |
|------|------|------|
| **Sniper** | 하나의 위치에 페이로드 순차 삽입 | 단일 파라미터 Fuzzing |
| **Battering ram** | 모든 위치에 동일 페이로드 | 같은 값 동시 테스트 |
| **Pitchfork** | 각 위치에 각각 다른 목록 | ID + PW 조합 테스트 |
| **Cluster bomb** | 모든 위치의 모든 조합 시도 | 완전 브루트포스 |

---

## 실습 — DVWA 로그인 브루트포스

### Step 1. 로그인 요청 가로채기
- Burp Proxy → Intercept ON
- `http://localhost:8081/vulnerabilities/brute/` 접속
- username: `admin`, password: `test` 입력 → Login

### Step 2. Intruder로 전송
- 가로챈 요청 우클릭 → **Send to Intruder** (Ctrl+I)
- Intercept OFF

### Step 3. 공격 위치 설정
- Intruder → **Positions** 탭
- Attack Type: **Sniper**
- **Clear §** 클릭 (기존 위치 초기화)
- `password=test` 에서 `test` 부분만 드래그 → **Add §**
  ```
  password=§test§
  ```

### Step 4. 페이로드 설정
- **Payloads** 탭
- Payload type: **Simple list**
- 아래 목록 **Add** 버튼으로 하나씩 추가:
  ```
  password
  123456
  admin
  letmein
  abc123
  charley
  test
  1234
  qwerty
  dragon
  ```

### Step 5. 공격 시작
- **Start Attack** 클릭
- 결과 창에서 **Length** 컬럼 기준 정렬
- 다른 항목과 **길이가 다른 응답** = 로그인 성공!

---

## 결과 판별법

| 항목 | 실패 응답 | 성공 응답 |
|------|-----------|-----------|
| Status | 200 | 200 |
| Length | 동일 | **다름** (페이지 내용이 다름) |
| 응답 내용 | "Username and/or password incorrect" | 다른 페이지 |

→ CE(Community Edition)는 속도 제한 있음. 실무에선 Pro 버전 사용.

---

## 핵심 개념

### 왜 응답 길이로 판별?
- 로그인 실패: 항상 같은 에러 페이지 → **길이 동일**
- 로그인 성공: 다른 페이지로 이동 → **길이 다름**

### Pitchfork vs Cluster bomb
```
Pitchfork:
  ID 목록: [admin, user, test]
  PW 목록: [password, 123456, abc123]
  → admin:password / user:123456 / test:abc123 (3번 시도)

Cluster bomb:
  ID 목록: [admin, user]
  PW 목록: [password, 123456]
  → admin:password / admin:123456 / user:password / user:123456 (4번 시도)
```

---

## Day 3 체크리스트

- [ ] DVWA Brute Force 요청 가로채기 성공
- [ ] Intruder로 전송 후 공격 위치 설정
- [ ] 페이로드 목록 추가
- [ ] 공격 실행 후 응답 길이 차이로 성공 판별
- [ ] 성공한 비밀번호 확인
