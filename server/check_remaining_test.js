const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRemainingTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra các ID cụ thể: 265, 266, 267');
    
    const [specificIds] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email 
      FROM nguoidung 
      WHERE NguoiDungID IN (265, 266, 267)
      ORDER BY NguoiDungID
    `);
    
    console.log('📋 Kết quả:');
    console.table(specificIds);
    
    console.log('\n🔍 Kiểm tra tất cả tài khoản có email chứa "test" hoặc "apitest" hoặc "frontendtest":');
    const [allTest] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email 
      FROM nguoidung 
      WHERE Email LIKE '%test%' OR Email LIKE '%apitest%' OR Email LIKE '%frontendtest%'
      ORDER BY NguoiDungID
    `);
    
    console.log('📋 Tất cả tài khoản test:');
    console.table(allTest);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkRemainingTest();
