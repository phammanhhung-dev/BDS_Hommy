const db = require('./config/db');

async function checkTinDangStatus() {
  try {
    console.log('=== KIỂM TRA TRẠNG THÁI TIN ĐĂNG ===\n');

    const [rows] = await db.execute(`
      SELECT TinDangID, TieuDe, LoaiGiaoDich, TrangThai, TaoLuc
      FROM tindang
      ORDER BY TinDangID DESC
      LIMIT 20
    `);

    console.log('TinDang records (latest 20):');
    console.table(rows);

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkTinDangStatus();
