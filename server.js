require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected...");
});







app.post('/register', (req, res) => {
    const qrCode = req.body.qr_code;
    const queryCheck = 'SELECT * FROM products WHERE qr_code = ?';
  
    db.query(queryCheck, [qrCode], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error in database query' });
      }
  
      if (result.length > 0) {
        return res.status(400).json({ message: 'QR Code นี้ถูกลงทะเบียนไปแล้ว' });
      } else {
        const queryInsert = 'INSERT INTO products (qr_code, status) VALUES (?, ?)';
        db.query(queryInsert, [qrCode, 'unused'], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error while registering QR Code' });
          }
          return res.status(200).json({ message: 'ลงทะเบียน QR Code สำเร็จ' });
        });
      }
    });
  });
  
  app.get('/verify', (req, res) => {
    const qrCode = req.query.qr;
    const query = 'SELECT * FROM products WHERE qr_code = ?';
  
    db.query(query, [qrCode], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error in database query' });
      }
  
      if (result.length > 0) {
        const product = result[0];
        if (product.status === 'unused') {
          // หากสินค้าไม่ได้ใช้ ยังสามารถลงทะเบียน
          return res.status(200).json({ message: 'สินค้าพร้อมใช้งาน', data: product });
        } else {
          // หากสินค้าถูกใช้แล้ว
          return res.status(400).json({ message: 'สินค้าถูกลงทะเบียนไปแล้ว' });
        }
      } else {
        return res.status(404).json({ message: 'ไม่พบสินค้าในระบบ' });
      }
    });
  });
  
  // API สำหรับการอัพเดตสถานะสินค้าหลังจากการใช้
  app.post('/markAsUsed', (req, res) => {
    const qrCode = req.body.qr_code;
    const query = 'UPDATE products SET status = ? WHERE qr_code = ?';
  
    db.query(query, ['used', qrCode], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error while marking QR Code as used' });
      }
      if (result.affectedRows > 0) {
        return res.status(200).json({ message: 'สินค้าถูกใช้แล้ว' });
      } else {
        return res.status(404).json({ message: 'ไม่พบสินค้าที่ต้องการอัพเดต' });
      }
    });
  });
  
// Start server
app.listen(5000, () => console.log("✅ Server running on port 5000"));
