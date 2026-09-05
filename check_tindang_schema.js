const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTinDangSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra schema bảng tindang...\n');

    // SHOW COLUMNS
    const [columns] = await connection.execute('SHOW COLUMNS FROM tindang');
    console.log('📋 Các cột trong tindang:');
    columns.forEach(col => {
      const nullable = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
      const key = col.Key || '';
      console.log(`   - ${col.Field.padEnd(20)} | ${col.Type.padEnd(20)} | ${nullable.padEnd(10)} | ${key}`);
    });

    // SHOW CREATE TABLE
    console.log('\n📝 CREATE TABLE statement:');
    const [createTable] = await connection.execute('SHOW CREATE TABLE tindang');
    console.log(createTable[0]['Create Table']);

    // Kiểm tra cột DuAnID cụ thể
    const duAnColumn = columns.find(col => col.Field === 'DuAnID');
    if (duAnColumn) {
      console.log('\n🎯 Chi tiết cột DuAnID:');
      console.log(`   - Field: ${duAnColumn.Field}`);
      console.log(`   - Type: ${duAnColumn.Type}`);
      console.log(`   - Null: ${duAnColumn.Null} (${duAnColumn.Null === 'YES' ? 'CHO PHÉP NULL' : 'KHÔNG CHO PHÉP NULL'})`);
      console.log(`   - Key: ${duAnColumn.Key}`);
      console.log(`   - Default: ${duAnColumn.Default}`);
    } else {
      console.log('\n❌ Cột DuAnID KHÔNG tồn tại trong bảng tindang');
    }

  } catch (error) {
    console.error('❌ Lỗi kiểm tra schema:', error);
  } finally {
    await connection.end();
  }
}

checkTinDangSchema();
