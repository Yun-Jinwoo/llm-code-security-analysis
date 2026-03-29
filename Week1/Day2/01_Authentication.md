# Authentication Vulnerabilities

## 개념

인증(Authentication)은 "당신이 누구인지" 확인하는 과정.
취약한 인증 구현은 공격자가 다른 사용자로 위장하거나 관리자 권한을 탈취하게 만든다.

OWASP Top 10 2021 기준 **A07 — Identification and Authentication Failures**.

---

## 인증 방식의 종류

| 방식 | 설명 | 예시 |
|------|------|------|
| 지식 기반 | 알고 있는 것 | 비밀번호, PIN |
| 소유 기반 | 가지고 있는 것 | OTP 기기, 스마트카드 |
| 생체 기반 | 나 자신 | 지문, 얼굴 인식 |

---

## 취약점 발생 원인 (핵심 2가지)

1. **브루트포스 방어 부족** — 시도 횟수 제한, 잠금 등 없음
2. **로직 결함** — 인증 흐름 자체를 우회 가능

### 세부 원인

### 1) 취약한 비밀번호 정책
- 짧거나 단순한 비밀번호 허용 → 브루트포스 가능
- 흔한 비밀번호(123456, password) 차단 미흡

### 2) 브루트포스 방어 부재
```
공격: 로그인 폼에 비밀번호 수천~수만 개 자동 시도
방어 없음: 계정 잠금 없음, 속도 제한 없음, CAPTCHA 없음
→ 결국 비밀번호 찾아냄
```

### 3) 계정 열거(Username Enumeration)
```
잘못된 구현:
- 존재하지 않는 아이디 → "계정이 존재하지 않습니다" (200ms)
- 틀린 비밀번호 → "비밀번호가 틀렸습니다"         (200ms)

올바른 구현:
- 둘 다 → "아이디 또는 비밀번호가 틀렸습니다"

에러 메시지나 응답 시간 차이로 아이디 목록을 수집할 수 있음
```

### 4) 불안전한 비밀번호 저장

| 방식 | 위험성 |
|------|--------|
| 평문 저장 | DB 유출 시 즉시 모든 비밀번호 노출 |
| MD5/SHA1 해시 | 레인보우 테이블로 역산 가능 |
| bcrypt (cost factor 포함) | 느리게 설계됨 → 브루트포스 어려움 |
| Argon2 | 현재 가장 권장되는 방식 |

### 5) 다단계 인증(MFA) 취약점
```
- MFA 코드 브루트포스 허용 (6자리 = 100만 가지)
- 첫 번째 단계 완료 후 두 번째 단계 URL을 직접 접근
- MFA 코드를 응답 본문에 그대로 포함시키는 버그
```

---

## 추가 공격 벡터 (나중에 다룰 것)

| 항목 | 설명 |
|------|------|
| 비밀번호 재설정 취약점 | 재설정 링크 예측 가능, 토큰 재사용 등 |
| OAuth 취약점 | 소셜 로그인 흐름의 state 파라미터 미검증 등 |
| 세션 관리 취약점 | 로그인 후 세션 ID 재발급 안 함 (Session Fixation) |

---

## 주요 공격 기법

### 비밀번호 브루트포스
```
도구: Burp Suite Intruder, Hydra
방법: 로그인 요청을 캡처 → Intruder로 비밀번호 필드에 wordlist 주입
→ 응답 상태코드/길이 차이로 성공 판별
```

### 자격증명 스터핑 (Credential Stuffing)
```
다른 사이트 유출 DB에서 가져온 [아이디:비밀번호] 쌍을 대입
→ 비밀번호 재사용자 공격
```

---

## 예방법

| 항목 | 조치 |
|------|------|
| 브루트포스 | 계정 잠금 (5회 실패 시), IP 속도 제한, CAPTCHA |
| 비밀번호 저장 | bcrypt / Argon2 사용 |
| MFA | TOTP 기반 2FA 도입, 코드 시도 횟수 제한 |
| 에러 메시지 | 아이디/비밀번호 구분 없이 동일한 메시지 |
| 세션 | 로그인 성공 시 세션 ID 재발급 (Session Fixation 방지) |

---

## PortSwigger Lab — Username enumeration via different responses

**링크**: `portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-different-responses`

### 목표
응답 메시지 차이로 유효한 아이디를 찾고, 브루트포스로 비밀번호까지 알아내기

### 사용 도구
- **Burp Suite Proxy**: 로그인 요청 가로채기
- **Burp Suite Intruder**: 자동으로 wordlist 대입

### 풀이 순서

**1단계 — 로그인 요청 캡처**
1. Burp Suite 실행 → Proxy 탭 → **Open Browser** 클릭
2. Burp 브라우저에서 랩 URL 접속
3. **Intercept is on** 상태로 전환
4. 로그인 폼에 아무 값 입력 (`username: test` / `password: test`) → 로그인 클릭
5. Burp에 요청이 멈춰서 잡힘

**2단계 — Intruder로 username 브루트포스**
1. 잡힌 요청에서 우클릭 → **Send to Intruder**
2. Intercept 탭에서 **Forward** 눌러 원래 요청 보내기
3. Intruder 탭 → **Positions 탭**
4. **Clear §** 클릭 → `username=` 뒤 값(`test`)만 선택 → **Add §**
   ```
   username=§test§&password=test
   ```
5. **Payloads 탭** → PortSwigger Candidate usernames wordlist 붙여넣기
6. **Start attack** 클릭
7. 결과 창에서 **Length 컬럼** 정렬 → 길이가 다른 항목 = 유효한 username

> 이유: 없는 아이디 → "Invalid username", 있는 아이디 → "Incorrect password"
> 메시지가 다르면 글자 수가 달라져서 Length가 달라짐

**결과**: username = `mysql`

**3단계 — password 브루트포스**
1. Intruder Positions 탭으로 돌아가서 **Clear §**
2. `password=` 뒤 값 선택 → **Add §**, username은 `mysql`로 고정
   ```
   username=mysql&password=§test§
   ```
3. Payloads 탭 → 기존 목록 지우고 Candidate passwords wordlist 붙여넣기
4. **Start attack** 클릭
5. **Status 컬럼**에서 `302` 응답 찾기 = 로그인 성공

**결과**: password = `hockey`

**4단계 — 로그인**
- Intercept off 전환 후 `mysql` / `hockey` 로 로그인 → 랩 클리어

### 핵심 포인트
- 에러 메시지가 다르면 아이디 존재 여부가 노출됨 → Username Enumeration 취약점
- Length(응답 크기) 차이로 유효한 값을 식별
- Status 302 = 리다이렉트 = 로그인 성공 신호
- Intruder = 특정 값을 wordlist로 자동 교체해서 대량 요청하는 기능
