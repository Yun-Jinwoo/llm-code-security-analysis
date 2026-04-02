# Day 5 - Semgrep Custom Rules Results

> Target: test_code/vuln_app.js
> Tool: Semgrep 1.156.0
> Date: 2026-04-02

---

## Rules Written

### 1. sqli.yaml
Pattern: query variable built with string concatenation passed to db.query()
```yaml
patterns:
  - pattern: |
      const $QUERY = $A + $B;
      $DB.query($QUERY, ...);
```

### 2. weak_hash.yaml
Pattern: crypto.createHash('md5')

### 3. jwt_none.yaml
Pattern: jwt.verify() with 'none' in algorithms list

---

## Scan Results

| Rule | File | Line | Severity |
|------|------|------|----------|
| nodejs-sql-injection-concat | vuln_app.js | 11 | ERROR |
| weak-hash-md5 | vuln_app.js | 25 | ERROR |
| jwt-algorithm-none | vuln_app.js | 32 | ERROR |

---

## Key Learnings

1. Semgrep matches code patterns defined in YAML rules
2. `$VAR` matches any variable/expression
3. `...` matches any arguments or code
4. Multiple `patterns:` entries = AND condition
5. SQLi pattern needed two-line match: assignment + db.query() call

## Research Application

Same ruleset applied to LLM-generated code enables quantitative comparison:
- Count findings per LLM per OWASP category
- Severity breakdown (ERROR / WARNING)
- Consistent, reproducible measurement

---

## Day 5 Checklist

- [x] vuln_app.js test code written (5 vulnerabilities)
- [x] SQLi detection rule written and working
- [x] MD5 weak hash rule written and working
- [x] JWT alg:none rule written and working
- [x] All 3 rules successfully detect target patterns
