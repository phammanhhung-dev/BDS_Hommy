const mysql = require('mysql2/promise');
require('dotenv').config();

async function backfillChuDuAnID() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra số bản ghi ChuDuAnID NULL trước khi backfill...');

    const [nullRecords] = await connection.execute(`
      SELECT COUNT(*) as count FROM tindang WHERE ChuDuAnID IS NULL
    `);
    console.log(`📊 Số bản ghi ChuDuAnID NULL: ${nullRecords[0].count}`);

    console.log('🔍 Kiểm tra số bản ghi có DuAnID (để backfill)...');

    const [withDuAnID] = await connection.execute(`
      SELECT COUNT(*) as count FROM tindang WHERE DuAnID IS NOT NULL AND ChuDuAnID IS NULL
    `);
    console.log(`📊 Số bản ghi có DuAnID nhưng ChuDuAnID NULL: ${withDuAnID[0].count}`);

    if (withDuAnID[0].count === 0) {
      console.log('⚠️ Không có bản ghi nào cần backfill (không có DuAnID hoặc đã có ChuDuAnID)');
      return;
    }

    console.log('📝 Bắt đầu backfill: UPDATE tindang SET ChuDuAnID = duan.ChuDuAnID WHERE DuAnID IS NOT NULL...');

    const [result] = await connection.execute(`
      UPDATE tindang td
      INNER JOIN duan da ON td.DuAnID = da.DuAnID
      SET td.ChuDuAnID = da.ChuDuAnID
      WHERE td.ChuDuAnID IS NULL AND td.DuAnID IS NOT NULL
    `);

    console.log(`✅ Đã backfill ${result.affectedRows} bản ghi`);

    // Kiểm tra lại sau backfill
    const [nullAfter] = await connection.execute(`
      SELECT COUNT(*) as count FROM tindang WHERE ChuDuAnID IS NULL
    `);
    console.log(`📊 Số bản ghi ChuDuAnID NULL sau backfill: ${nullAfter[0].count}`);

    if (nullAfter[0].count > 0) {
      console.log('⚠️ CÒN BẢN GHI CHU DUANID NULL SAU BACKFILL');
      console.log('🔍 Xem chi tiết các bản ghi chưa backfill:');

      const [remaining] = await connection.execute(`
        SELECT TinDangID, DuAnID, TieuDe, TrangThai 
        FROM tindang 
        WHERE ChuDuAnID IS NULL
      `);
      console.table(remaining);
    } else {
      console.log('✅ Tất cả bản ghi đã backfill thành công. Có thể đổi cột thành NOT NULL.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi backfill:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

backfillChuDuAnID();
