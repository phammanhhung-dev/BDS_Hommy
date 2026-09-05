const mysql = require('mysql2/promise');
const db = require('../server/config/db');

async function checkSchema() {
  try {
    const connection = await db.getConnection();
    
    const [rows] = await connection.execute('DESCRIBE tindang');
    
    console.log('=== CẤU TRÚC BẢNG TINDANG SAU MIGRATION ===');
    console.log('');
    
    rows.forEach(row => {
      console.log(`${row.Field.padEnd(25)} ${row.Type.padEnd(20)} ${row.Null.padEnd(8)} ${row.Key.padEnd(10)} ${row.Default || ''}`);
    });
    
    await connection.release();
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
}

checkSchema();
