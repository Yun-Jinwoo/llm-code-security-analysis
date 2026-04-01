# Day 1 — ZAP 스캔 결과 기록

> 대상: DVWA (`http://localhost:8081`)
> 스캔 방식: ZAP -quickurl (Passive + Active)
> 날짜: 2026-04-01

---

## 스캔 결과 요약

| 심각도 | 건수 | OWASP 연관 |
|--------|------|------------|
| 🔴 High | 1 | - |
| 🟠 Medium | 3 | A05 (보안 설정 오류) |
| 🟡 Low | 5 | A05, A07 |
| 🔵 Informational | 3 | - |

---

## 발견된 취약점 목록

### 🟠 Medium

#### 1. Content Security Policy (CSP) Header Not Set
- **의미**: 응답 헤더에 `Content-Security-Policy`가 없음
- **위험**: XSS 공격 시 브라우저 레벨의 방어막이 없음
- **OWASP**: A05:2021 – Security Misconfiguration
- **해결**: 서버 응답 헤더에 CSP 추가
  ```
  Content-Security-Policy: default-src 'self'
  ```

#### 2. Missing Anti-clickjacking Header
- **의미**: `X-Frame-Options` 또는 CSP `frame-ancestors` 없음
- **위험**: iframe에 사이트를 삽입해 클릭재킹 공격 가능
- **OWASP**: A05:2021 – Security Misconfiguration
- **해결**: 헤더 추가
  ```
  X-Frame-Options: DENY
  ```

#### 3. 디렉터리 탐색
- **의미**: 서버의 디렉터리 구조가 외부에 노출될 수 있음
- **위험**: 공격자가 파일 구조 파악 후 민감 파일 접근 시도
- **OWASP**: A05:2021 – Security Misconfiguration

---

### 🟡 Low

#### 4. Cookie No HttpOnly Flag
- **의미**: 세션 쿠키에 `HttpOnly` 속성 없음
- **위험**: XSS로 JS에서 쿠키 탈취 가능
- **해결**: `Set-Cookie: session=xxx; HttpOnly`

#### 5. Cookie without SameSite Attribute
- **의미**: 쿠키에 `SameSite` 속성 없음
- **위험**: CSRF 공격에 취약
- **해결**: `Set-Cookie: session=xxx; SameSite=Strict`

#### 6. Server Leaks Version Information
- **의미**: HTTP 응답 헤더에 서버 버전 정보 노출
- **위험**: 공격자가 특정 버전의 취약점 타겟팅 가능
- **해결**: 서버 헤더에서 버전 정보 제거

#### 7. X-Content-Type-Options Header Missing
- **의미**: `X-Content-Type-Options: nosniff` 없음
- **위험**: 브라우저가 MIME 타입을 임의로 해석 (MIME 스니핑)

#### 8. In Page Banner Information Leak
- **의미**: 페이지 내에 서버/프레임워크 정보 노출

---

## 핵심 배운 점

1. **ZAP -quickurl** 로 원라이너 스캔 가능
2. **Passive Scan** 은 자동으로 동작, **Active Scan** 은 실제 페이로드 전송
3. DVWA는 의도적으로 취약하게 만들어진 서버라 결과가 많이 나옴
4. 실제 실험에서는 동일한 명령어로 LLM별 코드를 스캔 → 결과 비교

---

## Day 1 체크리스트

- [x] ZAP 설치 확인 (v2.17.0)
- [x] DVWA Docker 실행 (포트 8081)
- [x] ZAP quickurl 스캔 실행
- [x] HTML 리포트 저장 완료
- [x] 취약점 목록 확인 및 기록
