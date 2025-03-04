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
app.use(express.static(path.join(__dirname, 'public')));
// ตั้งค่า session
app.use(session({
  secret: 'bitkub_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // ตั้งค่าเป็น true ถ้าใช้ HTTPS
}));

// ตั้งค่า view engine เป็น EJS (หรือจะใช้ template engine อื่นๆ ก็ได้)
app.set('view engine', 'ejs');
// Routes
// หน้าหลัก - ส่งไฟล์ login.html
app.get('/', (req, res) => {
  if (req.session.user) {
    console.log('req.session.user', req.session.user);
    console.log('login');
    res.redirect('/download.html'); // ถ้าล็อกอินแล้วให้ไปที่ dashboard
  } else {
    // res.sendFile(path.join(__dirname, 'public', 'login.html'));
    console.log('not login');
    res.redirect('/login.html');
  }
});

// เพิ่ม GET route สำหรับหน้าลงทะเบียน
app.get('/register', (req, res) => {
  if (req.session.user) {
    res.redirect('/download.html'); // ถ้าล็อกอินแล้วให้ไปที่ dashboard
  } else {
    res.redirect('/register.html');
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
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  dbConn.query(query, [login, password], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }

    if (results.length > 0) {
      // สร้าง session (ไม่เก็บรหัสผ่านใน session)
      const user = results[0];
      req.session.user = { id: user.id, email: user.email };
      return res.status(200).json({ success: true, message: 'ล็อกอินสำเร็จ', redirect: 'download.html' });
    } else {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
  });
});

// หน้า Dashboard (ต้องล็อกอินก่อน)
app.get('/index.html', (req, res) => {
  if (req.session.user) {
    // ส่ง dashboard ให้ผู้ใช้ที่ล็อกอินแล้ว
    // res.send(`<h1>ยินดีต้อนรับ, ${req.session.user.email}!</h1><a href="/logout">ออกจากระบบ</a>`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  const query = 'SELECT * FROM users WHERE email = ?';
  dbConn.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }

    if (results.length > 0) {
      // ในระบบจริง คุณจะส่งอีเมลสำหรับรีเซ็ตรหัสผ่าน
      return res.status(200).json({ 
        success: true, 
        message: 'กรุณาตรวจสอบอีเมลของคุณสำหรับคำแนะนำในการรีเซ็ตรหัสผ่าน' 
      });
    } else {
      return res.status(404).json({ success: false, message: 'ไม่พบอีเมลนี้ในระบบ' });
    }
  });
});

app.get('/download.html', (req, res) => {
  if (req.session.user) {
    console.log(session.user);
    console.log('in download');
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
  } else {
    res.redirect('/');
  }
});

app.post('/register', (req, res) => {
  const { name, telephone,email, password, confirmPassword } = req.body;
  console.log(req.body);

  // ตรวจสอบว่าได้กรอกข้อมูลครบถ้วน
  if (!name||!telephone||!email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // ตรวจสอบว่ารหัสผ่านและยืนยันรหัสผ่านตรงกันหรือไม่
  if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' });
  }

  // ตรวจสอบว่ามีผู้ใช้อีเมลเดียวกันอยู่แล้วหรือไม่
  const query = 'SELECT * FROM users WHERE email = ?';
  dbConn.query(query, [email], (err, results) => {
      if (err) {
          return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
      }

      if (results.length > 0) {
          return res.status(400).json({ success: false, message: 'อีเมลนี้มีผู้ใช้งานแล้ว' });
      }

      // ถ้าไม่มี ให้สร้างผู้ใช้ใหม่
      const insertQuery = 'INSERT INTO users (name, tell,email, password) VALUES (?, ?, ?, ?)';
      dbConn.query(insertQuery, [name, telephone,email, password], (err, result) => {
          if (err) {
              return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
          }
          console.log('result', result);

          // การสมัครสมาชิกเสร็จสิ้น นำผู้ใช้ไปยังหน้าล็อกอิน
          return res.status(200).json({ success: true, message: 'สมัครสมาชิกสำเร็จ', redirect: '/' });
      });
  });
});
// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`);
});