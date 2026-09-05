const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function checkLoginIssue() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra thông tin tài khoản chuduantest@example.com...');
    
    const [userData] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash, VaiTroHoatDongID
      FROM nguoidung 
      WHERE Email = ?
    `, ['chuduantest@example.com']);

    if (userData.length === 0) {
      console.log('❌ Không tìm thấy tài khoản chuduantest@example.com');
      return;
    }

    console.log('📋 Thông tin tài khoản:');
    console.table(userData);

    const user = userData[0];
    const plainPassword = '123456';
    const md5Hash = crypto.createHash('md5').update(String(plainPassword)).digest('hex');

    console.log('\n🔍 Kiểm tra logic so sánh mật khẩu:');
    console.log('📝 Password plain text:', plainPassword);
    console.log('📝 MD5 hash của "123456":', md5Hash);
    console.log('📝 MatKhauHash trong DB:', user.MatKhauHash);
    console.log('📝 So sánh direct (plain === hash):', plainPassword === user.MatKhauHash);
    console.log('📝 So sánh MD5 (hash === hash):', md5Hash === user.MatKhauHash);

    console.log('\n🐛 KẾT LUẬN VẤN ĐỀ:');
    if (md5Hash === user.MatKhauHash) {
      console.log('✅ DB lưu MD5 hash, nhưng login lại so sánh plain text với hash → BUG!');
      console.log('💡 Cần sửa authController.login để hash password bằng MD5 trước khi so sánh');
    } else if (plainPassword === user.MatKhauHash) {
      console.log('✅ DB lưu plain text, login so sánh plain text → đúng logic');
      console.log('💡 Vậy tại sao đăng nhập thất bại? Có thể tài khoản khác hoặc mật khẩu khác');
    } else {
      console.log('❌ Cả 2 cách so sánh đều sai → mật khẩu trong DB không khớp với "123456"');
      console.log('💡 Tài khoản này có thể có mật khẩu khác hoặc đã bị đổi');
    }

    // Kiểm tra tất cả tài khoản ChuDuAn
    console.log('\n🔍 Kiểm tra tất cả tài khoản ChuDuAn...');
    const [allChuDuAn] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash
      FROM nguoidung 
      WHERE VaiTroHoatDongID = 3
      LIMIT 5
    `);

    console.log('📋 Danh sách tài khoản ChuDuAn:');
    console.table(allChuDuAn);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkLoginIssue();
