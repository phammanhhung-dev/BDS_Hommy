const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPhongTinDangTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra bảng liên kết phong_tindang...\n');

    // Kiểm tra bảng phong_tindang có tồn tại không
    const [tables] = await connection.execute("SHOW TABLES LIKE 'phong_tindang'");
    if (tables.length === 0) {
      console.log('❌ Bảng phong_tindang KHÔNG tồn tại trong database');
      return;
    }

    console.log('✅ Bảng phong_tindang tồn tại\n');

    // SHOW COLUMNS
    const [columns] = await connection.execute('SHOW COLUMNS FROM phong_tindang');
    console.log('📋 Các cột trong phong_tindang:');
    columns.forEach(col => {
      const nullable = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
      const key = col.Key || '';
      console.log(`   - ${col.Field.padEnd(20)} | ${col.Type.padEnd(20)} | ${nullable.padEnd(10)} | ${key}`);
    });

    // SHOW CREATE TABLE
    console.log('\n📝 CREATE TABLE statement:');
    const [createTable] = await connection.execute('SHOW CREATE TABLE phong_tindang');
    console.log(createTable[0]['Create Table']);

  } catch (error) {
    console.error('❌ Lỗi kiểm tra bảng phong_tindang:', error);
  } finally {
    await connection.end();
  }
}

checkPhongTinDangTable();
