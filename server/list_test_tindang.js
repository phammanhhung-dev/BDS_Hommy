const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTestTinDang() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Liệt kê tin đăng test rác (ChuDuAnID = 1, TaoLuc = 18/8/2026)...');
    
    const [testTinDang] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai, TaoLuc
      FROM tindang 
      WHERE ChuDuAnID = 1 
      AND DATE(TaoLuc) = '2026-08-18'
      ORDER BY TinDangID ASC
    `);

    console.log('📋 Danh sách tin đăng test rác tìm thấy:');
    console.table(testTinDang);

    console.log('\n🔍 Chi tiết từng bản ghi:');
    testTinDang.forEach((td, index) => {
      console.log(`${index + 1}. TinDangID: ${td.TinDangID}`);
      console.log(`   - TieuDe: ${td.TieuDe}`);
      console.log(`   - DuAnID: ${td.DuAnID}`);
      console.log(`   - TrangThai: ${td.TrangThai}`);
      console.log(`   - TaoLuc: ${td.TaoLuc}`);
      console.log('');
    });

    console.log(`📊 Tổng số bản ghi test rác: ${testTinDang.length}`);
    console.log('⚠️  CHƯA XÓA - Đợi xác nhận từ người dùng');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

listTestTinDang();
