// app.js - ไฟล์หลักของ Node.js application

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
var mysql = require("mysql");
require("dotenv").config();

var dbConn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });
  
  dbConn.connect();


// สร้าง Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // สำหรับไฟล์ static เช่น CSS, รูปภาพ

// ตั้งค่า session
app.use(session({
  secret: 'bitkub_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // ตั้งค่าเป็น true ถ้าใช้ HTTPS
}));

// ตั้งค่า view engine เป็น EJS (หรือจะใช้ template engine อื่นๆ ก็ได้)
app.set('view engine', 'ejs');

// สมมติฐานข้อมูลผู้ใช้ (ในระบบจริงคุณจะใช้ฐานข้อมูลเช่น MongoDB หรือ MySQL)
const users = [
  { id: 1, username: 'user1', email: 'user1@example.com', password: 'password1' },
  { id: 2, username: 'user2', email: 'user2@example.com', password: 'password2' }
];

// Routes
// หน้าหลัก - ส่งไฟล์ login.html
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard'); // ถ้าล็อกอินแล้วให้ไปที่ dashboard
  } else {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  }
});

// จัดการการล็อกอิน
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  
  // ตรวจสอบว่ามีการส่งข้อมูลมาครบหรือไม่
  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่าน' });
  }
  
  // ค้นหาผู้ใช้ (ใช้ username หรือ email)
  const user = users.find(u => (u.username === login || u.email === login) && u.password === password);
  
  if (user) {
    // สร้าง session (ไม่เก็บรหัสผ่านใน session)
    req.session.user = { id: user.id, username: user.username, email: user.email };
    return res.status(200).json({ success: true, message: 'ล็อกอินสำเร็จ', redirect: '/dashboard' });
  } else {
    return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
});

// หน้า Dashboard (ต้องล็อกอินก่อน)
app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    // ส่ง dashboard ให้ผู้ใช้ที่ล็อกอินแล้ว
    res.send(`<h1>ยินดีต้อนรับ, ${req.session.user.username}!</h1><a href="/logout">ออกจากระบบ</a>`);
  } else {
    // ถ้ายังไม่ได้ล็อกอิน ให้กลับไปหน้าล็อกอิน
    res.redirect('/');
  }
});

// ออกจากระบบ
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการออกจากระบบ' });
    }
    res.redirect('/');
  });
});

// จัดการลืมรหัสผ่าน
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมล' });
  }
  
  // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
  const user = users.find(u => u.email === email);
  
  if (user) {
    // ในระบบจริง คุณจะส่งอีเมลสำหรับรีเซ็ตรหัสผ่าน
    return res.status(200).json({ 
      success: true, 
      message: 'กรุณาตรวจสอบอีเมลของคุณสำหรับคำแนะนำในการรีเซ็ตรหัสผ่าน' 
    });
  } else {
    return res.status(404).json({ success: false, message: 'ไม่พบอีเมลนี้ในระบบ' });
  }
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
});