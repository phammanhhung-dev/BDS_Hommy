const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function testNewAccount() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    // Tạo tài khoản test mới
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPass123';
    const testName = 'Test User';
    const testPhone = `0${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
    
    console.log('🔍 Tạo tài khoản test mới...');
    console.log('📝 Email:', testEmail);
    console.log('📝 Password:', testPassword);
    
    // Hash password bằng MD5 (giống logic register)
    const matKhauHash = crypto.createHash('md5').update(String(testPassword)).digest('hex');
    console.log('📝 MD5 Hash:', matKhauHash);
    
    // Insert vào DB
    const [result] = await connection.execute(`
      INSERT INTO nguoidung (TenDayDu, Email, SoDienThoai, MatKhauHash, VaiTroHoatDongID, TaoLuc, CapNhatLuc)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `, [testName, testEmail, testPhone, matKhauHash]);
    
    console.log('✅ Tài khoản tạo thành công với ID:', result.insertId);
    
    // Kiểm tra lại dữ liệu trong DB
    const [userData] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash, VaiTroHoatDongID
      FROM nguoidung 
      WHERE Email = ?
    `, [testEmail]);
    
    console.log('📋 Dữ liệu trong DB:');
    console.table(userData);
    
    // Test logic login: giả sử frontend gửi password RAW
    console.log('\n🔍 Test logic login (frontend gửi password RAW):');
    const passwordHashFromRaw = crypto.createHash('md5').update(String(testPassword)).digest('hex');
    console.log('📝 Hash từ password RAW:', passwordHashFromRaw);
    console.log('📝 Hash trong DB:', userData[0].MatKhauHash);
    console.log('📝 Kết quả so sánh:', passwordHashFromRaw === userData[0].MatKhauHash);
    
    // Test logic login: giả sử frontend gửi password đã hash MD5 (như code hiện tại)
    console.log('\n🔍 Test logic login (frontend gửi password đã hash MD5 - như code hiện tại):');
    const frontendHashedPassword = crypto.createHash('md5').update(String(testPassword)).digest('hex');
    const backendHashedAgain = crypto.createHash('md5').update(String(frontendHashedPassword)).digest('hex');
    console.log('📝 Frontend hash MD5:', frontendHashedPassword);
    console.log('📝 Backend hash lần nữa:', backendHashedAgain);
    console.log('📝 Hash trong DB:', userData[0].MatKhauHash);
    console.log('📝 Kết quả so sánh:', backendHashedAgain === userData[0].MatKhauHash);
    
    console.log('\n🐛 KẾT LUẬN:');
    if (passwordHashFromRaw === userData[0].MatKhauHash) {
      console.log('✅ Backend cần nhận password RAW để hash MD5 và so sánh');
    }
    if (backendHashedAgain !== userData[0].MatKhauHash) {
      console.log('❌ Frontend không nên hash password trước khi gửi - hiện tại code đang làm sai!');
    }
    
    // Cleanup
    await connection.execute('DELETE FROM nguoidung WHERE Email = ?', [testEmail]);
    console.log('\n🧹 Đã xóa tài khoản test');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

testNewAccount();
