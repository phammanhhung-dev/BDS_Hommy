const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkBanhangPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra mật khẩu banhangtest@example.com...');
    
    const [userData] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash, VaiTroHoatDongID
      FROM nguoidung 
      WHERE Email = ?
    `, ['banhangtest@example.com']);

    if (userData.length === 0) {
      console.log('❌ Không tìm thấy tài khoản banhangtest@example.com');
      return;
    }

    console.log('📋 Thông tin tài khoản:');
    console.table(userData);

    const user = userData[0];
    const plainPassword = '123456';

    console.log('\n🔍 Test bcrypt.compare với password "123456":');
    const bcryptMatch = await bcrypt.compare(plainPassword, user.MatKhauHash);
    console.log('📝 Kết quả bcrypt.compare:', bcryptMatch ? '✅ Đúng' : '❌ Sai');

    console.log('\n🔍 Test các password khác phổ biến...');
    const testPasswords = ['123456', 'password', 'admin', '12345678', 'test'];
    
    for (const testPwd of testPasswords) {
      const match = await bcrypt.compare(testPwd, user.MatKhauHash);
      console.log(`📝 Password "${testPwd}": ${match ? '✅ Đúng' : '❌ Sai'}`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkBanhangPassword();
