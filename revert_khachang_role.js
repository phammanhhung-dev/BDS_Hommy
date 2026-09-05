const mysql = require('mysql2/promise');
require('dotenv').config();

async function revertRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔄 Reverting role for khachang@gmail.com back to 1 (Khách hàng)...');
    
    const [result] = await connection.execute(`
      UPDATE nguoidung 
      SET VaiTroHoatDongID = 1 
      WHERE Email = ?
    `, ['khachang@gmail.com']);

    console.log('✅ Result:', result);
    
    const [rows] = await connection.execute(`
      SELECT NguoiDungID, Email, VaiTroHoatDongID, TenDayDu 
      FROM nguoidung 
      WHERE Email = ?
    `, ['khachang@gmail.com']);
    
    console.log('📋 Updated user record:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

revertRole();
