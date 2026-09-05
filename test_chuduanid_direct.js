const mysql = require('mysql2/promise');
require('dotenv').config();

async function testChuDuAnIDDirect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra schema tindang hiện tại...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM tindang');
    console.log('📋 Các cột trong tindang:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('\n🔍 Kiểm tra dữ liệu mẫu...');
    const [sampleData] = await connection.execute('SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai FROM tindang LIMIT 3');
    console.log('📋 Dữ liệu mẫu:');
    console.table(sampleData);

    console.log('\n🔍 Kiểm tra query với ChuDuAnID...');
    const [filteredData] = await connection.execute('SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe FROM tindang WHERE ChuDuAnID = 1 LIMIT 3');
    console.log('📋 Tin đăng của ChuDuAnID = 1:');
    console.table(filteredData);

    console.log('\n🔍 Kiểm tra LEFT JOIN với duan...');
    const [leftJoinData] = await connection.execute(`
      SELECT td.TinDangID, td.DuAnID, td.ChuDuAnID, td.TieuDe, da.TenDuAn
      FROM tindang td
      LEFT JOIN duan da ON td.DuAnID = da.DuAnID
      WHERE td.ChuDuAnID = 1
      LIMIT 3
    `);
    console.log('📋 LEFT JOIN kết quả:');
    console.table(leftJoinData);

    console.log('\n✅ Kiểm tra hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

testChuDuAnIDDirect();
