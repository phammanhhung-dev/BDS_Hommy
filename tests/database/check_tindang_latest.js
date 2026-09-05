const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLatestTinDang() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Lấy schema bảng tindang...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM tindang
    `);
    console.log('📋 Các cột trong tindang:');
    columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));

    console.log('\n🔍 Query 5 tin đăng mới nhất từ tindang...');
    const [rows] = await connection.execute(`
      SELECT TinDangID, DuAnID, TieuDe, TrangThai, TaoLuc, CapNhatLuc
      FROM tindang
      ORDER BY TaoLuc DESC
      LIMIT 5
    `);

    console.log(`\n📊 Kết quả (${rows.length} bản ghi):`);
    console.log('─'.repeat(110));
    console.log('TinDangID | DuAnID | TieuDe | TrangThai | TaoLuc | CapNhatLuc');
    console.log('─'.repeat(110));

    rows.forEach(row => {
      console.log(
        `${String(row.TinDangID).padEnd(9)} | ` +
        `${String(row.DuAnID || 'NULL').padEnd(6)} | ` +
        `${(row.TieuDe || 'NULL').substring(0, 30).padEnd(30)} | ` +
        `${String(row.TrangThai || 'NULL').padEnd(10)} | ` +
        `${row.TaoLuc.toISOString()} | ` +
        `${row.CapNhatLuc ? row.CapNhatLuc.toISOString() : 'NULL'}`
      );
    });

    console.log('─'.repeat(120));

    // Kiểm tra xem có bản ghi nào được tạo trong 10 phút gần đây không
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentRows = rows.filter(row => row.TaoLuc >= tenMinutesAgo);

    if (recentRows.length > 0) {
      console.log(`\n✅ CÓ ${recentRows.length} bản ghi được tạo trong 10 phút gần đây (có thể là tin vừa đăng)`);
      recentRows.forEach(row => {
        console.log(`   - TinDangID ${row.TinDangID}: TieuDe="${row.TieuDe}", TrangThai="${row.TrangThai}"`);
      });
    } else {
      console.log('\n❌ KHÔNG có bản ghi nào được tạo trong 10 phút gần đây');
      console.log('   Tin đăng mới nhất trong DB được tạo lúc:', rows[0]?.TaoLuc?.toISOString() || 'N/A');
    }

  } catch (error) {
    console.error('❌ Lỗi query:', error);
  } finally {
    await connection.end();
  }
}

checkLatestTinDang();
