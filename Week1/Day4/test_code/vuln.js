// 취약한 코드 예시 - Semgrep 스캔 테스트용

const mysql = require('mysql');
const express = require('express');
const app = express();

// 1. SQL Injection 취약점
app.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = "SELECT * FROM users WHERE id = " + userId;
    db.query(query, (err, result) => {
        res.json(result);
    });
});

// 2. 비밀번호 평문 저장
app.post('/register', (req, res) => {
    const password = req.body.password;
    db.query(`INSERT INTO users (password) VALUES ('${password}')`);
});

// 3. 하드코딩된 시크릿
const SECRET_KEY = "supersecret1234";
const DB_PASSWORD = "admin123";
