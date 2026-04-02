# Day 3 — Burp Intruder 브루트포스 실습 결과

> 대상: DVWA Brute Force (`http://localhost:8081/vulnerabilities/brute/`)
> 도구: Burp Suite Intruder
> 날짜: 2026-04-02

---

## 실습 설정

- **Attack Type**: Sniper
- **공격 위치**: `password` 파라미터
- **페이로드 목록**: password, 123456, admin, letmein, abc123, charley, test, 1234, qwerty, dragon

---

## 결과

| Payload | Length | 결과 |
|---------|--------|------|
| password | 4740 | ✅ 로그인 성공 |
| 나머지 | 4702~4703 | ❌ 실패 |

**크랙된 계정**: `admin` / `password`

---

## 판별 방법

- 로그인 **실패** → 에러 페이지 → 응답 길이 동일 (4702~4703)
- 로그인 **성공** → 다른 페이지 → 응답 길이 다름 (4740)
- Length 컬럼 정렬 → 튀는 값 = 성공

---

## 핵심 배운 점

1. **Intruder Sniper** — 단일 파라미터에 페이로드 목록 자동 삽입
2. **응답 길이 차이**로 성공/실패 판별 (상태코드 200이라도 내용이 다름)
3. CE 버전은 속도 제한 있음 → 실무에선 Pro 또는 다른 도구(hydra 등) 사용
4. DVWA Brute Force는 계정 잠금(Account Lockout) 없음 → 무한 시도 가능

---

## OWASP 연결

| 취약점 | OWASP | CWE |
|--------|-------|-----|
| 브루트포스 허용 | A07:2021 – Identification and Authentication Failures | CWE-307 |
| 계정 잠금 없음 | A07:2021 – Identification and Authentication Failures | CWE-307 |

---

## Day 3 체크리스트

- [x] DVWA Brute Force 요청 가로채기 성공
- [x] Intruder로 전송 후 공격 위치 설정
- [x] 페이로드 목록 추가
- [x] 공격 실행 후 응답 길이 차이로 성공 판별
- [x] 성공한 비밀번호 확인 (`password`)
