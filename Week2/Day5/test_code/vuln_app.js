const express = require('express');
const mysql = require('mysql');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();

// vuln 1: SQL Injection - string concatenation
app.get('/user', (req, res) => {
  const id = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + id + "'";
  db.query(query, (err, result) => {
    res.json(result);
  });
});

// vuln 2: hardcoded secrets
const password = "admin1234";
const JWT_SECRET = "hardcoded_secret_key";
const API_KEY = "sk-1234567890abcdef";

// vuln 3: weak hash (MD5)
app.post('/register', (req, res) => {
  const userPassword = req.body.password;
  const hash = crypto.createHash('md5').update(userPassword).digest('hex');
  db.query("INSERT INTO users (password) VALUES (?)", [hash]);
});

// vuln 4: JWT alg:none allowed
app.get('/profile', (req, res) => {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
  res.json(decoded);
});

// vuln 5: error details exposed
app.get('/data', (req, res) => {
  try {
    const result = db.query("SELECT * FROM data");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.listen(3000);
