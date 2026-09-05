const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function checkKhach1Account() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra thông tin tài khoản khach1@gmail.com...');
    
    const [userData] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash, VaiTroHoatDongID
      FROM nguoidung 
      WHERE Email = ?
    `, ['khach1@gmail.com']);

    if (userData.length === 0) {
      console.log('❌ Không tìm thấy tài khoản khach1@gmail.com');
      return;
    }

    console.log('📋 Thông tin tài khoản:');
    console.table(userData);

    const user = userData[0];
    console.log('\n📝 Chi tiết dữ liệu:');
    console.log('NguoiDungID:', user.NguoiDungID);
    console.log('TenDayDu:', user.TenDayDu);
    console.log('Email:', user.Email);
    console.log('MatKhauHash (nguyên văn):', user.MatKhauHash);
    console.log('VaiTroHoatDongID:', user.VaiTroHoatDongID);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkKhach1Account();
