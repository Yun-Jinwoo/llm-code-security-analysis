# Day 5 - Semgrep 커스텀 룰 실습 결과

> 대상: test_code/vuln_app.js
> 도구: Semgrep 1.156.0
> 날짜: 2026-04-02

---

## 작성한 룰 목록

### 1. sqli.yaml
쿼리를 문자열 연결로 만들어 db.query()에 넘기는 패턴 탐지
```yaml
patterns:
  - pattern: |
      const $QUERY = $A + $B;
      $DB.query($QUERY, ...);
```

### 2. weak_hash.yaml
MD5 해시 알고리즘 사용 탐지
```yaml
pattern: crypto.createHash('md5')
```

### 3. jwt_none.yaml
JWT algorithms 목록에 'none' 포함 여부 탐지
```yaml
pattern: "jwt.verify($TOKEN, $SECRET, { algorithms: [..., 'none', ...] })"
```

---

## 스캔 결과

| 룰 | 파일 | 줄 | 심각도 |
|----|------|----|--------|
| nodejs-sql-injection-concat | vuln_app.js | 11 | ERROR |
| weak-hash-md5 | vuln_app.js | 25 | ERROR |
| jwt-algorithm-none | vuln_app.js | 32 | ERROR |

---

## 핵심 배운 점

1. Semgrep은 YAML 룰에 정의된 코드 패턴을 파일에서 찾아줌
2. `$VAR` → 임의의 변수/표현식 매칭
3. `...` → 임의의 인자나 코드 블록 매칭
4. `patterns:` 아래 여러 줄 → AND 조건 (모두 만족해야 탐지)
5. SQLi 룰은 변수 할당과 db.query() 호출을 두 줄로 묶어야 정확히 탐지됨

---

## 연구에서의 활용

동일한 룰셋을 LLM별 생성 코드에 적용하면 정량적 비교 가능:
- LLM별 탐지 건수 비교
- OWASP 카테고리별 분포 확인
- 재현 가능한 측정 방법 확보

---

## Day 5 체크리스트

- [x] 취약한 Node.js 샘플 코드 작성 (5가지 취약점 포함)
- [x] SQLi 탐지 룰 작성 및 동작 확인
- [x] MD5 취약 해시 탐지 룰 작성 및 동작 확인
- [x] JWT alg:none 탐지 룰 작성 및 동작 확인
- [x] 3개 룰 모두 정상 탐지 확인
