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

## 취약점 발생 원인

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

### 풀이 흐름
1. Burp Suite에서 로그인 요청 캡처
2. Intruder → Sniper 모드 → username 필드에 wordlist 주입
3. 응답 본문에 "Invalid username" vs "Incorrect password" 메시지 차이 확인
4. 유효한 username 찾으면 → 이번엔 password 필드에 wordlist 주입
5. 302 Redirect 응답 = 로그인 성공

### 핵심 포인트
- 에러 메시지가 다르면 → 아이디 존재 여부 파악 가능
- Burp Intruder의 **Grep - Match** 기능으로 특정 문자열 포함 여부로 필터링 가능
