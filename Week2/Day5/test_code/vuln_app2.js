const express = require('express');
const app = express();
app.use(express.json());

// vuln 1: hardcoded secret
const JWT_SECRET = "mysupersecretkey";
const DB_PASSWORD = "admin1234";
const API_KEY = "sk-abcdef1234567890";

// vuln 2: XSS - user input directly inserted into response
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  res.send('<h1>Search result: ' + keyword + '</h1>');
});

// vuln 3: IDOR - no ownership check
app.get('/post/:id', (req, res) => {
  const postId = req.params.id;
  db.query('SELECT * FROM posts WHERE id = ?', [postId], (err, result) => {
    res.json(result);
  });
});

app.delete('/post/:id', (req, res) => {
  const postId = req.params.id;
  db.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
    res.json({ success: true });
  });
});

// vuln 4: error stack trace exposed
app.get('/data', (req, res) => {
  try {
    const result = riskyOperation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// vuln 5: no auth middleware on protected route
app.get('/admin', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    res.json(result);
  });
});

app.get('/dashboard', (req, res) => {
  db.query('SELECT * FROM posts', (err, result) => {
    res.json(result);
  });
});

// vuln 6: file upload - no extension validation
app.post('/upload', (req, res) => {
  const filename = req.body.filename;
  const filedata = req.body.data;
  fs.writeFileSync('./uploads/' + filename, filedata);
  res.json({ success: true });
});

// vuln 7: mass assignment - req.body directly saved to DB
app.post('/register', (req, res) => {
  const userData = req.body;
  db.query('INSERT INTO users SET ?', userData, (err) => {
    res.json({ success: true });
  });
});

app.listen(3000);
