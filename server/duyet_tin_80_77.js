const db = require('./config/db');

async function duyetTin() {
  try {
    console.log('=== DUYỆT TIN 80 VÀ 77 ===\n');

    // 1. Duyệt tin 80
    console.log('1. Duyệt tin 80:');
    const [result80] = await db.execute(`
      UPDATE tindang
      SET TrangThai = 'DaDuyet', DuyetLuc = NOW()
      WHERE TinDangID = 80
    `);
    console.log(`   ✅ Đã duyệt tin 80 - ${result80.affectedRows} bản ghi`);

    // 2. Duyệt tin 77
    console.log('\n2. Duyệt tin 77:');
    const [result77] = await db.execute(`
      UPDATE tindang
      SET TrangThai = 'DaDuyet', DuyetLuc = NOW()
      WHERE TinDangID = 77
    `);
    console.log(`   ✅ Đã duyệt tin 77 - ${result77.affectedRows} bản ghi`);

    // 3. Kiểm tra trạng thái sau khi duyệt
    console.log('\n3. Kiểm tra trạng thái sau khi duyệt:');
    const [checkResult] = await db.execute(`
      SELECT TinDangID, TieuDe, LoaiGiaoDich, TrangThai, DuAnID, DuyetLuc
      FROM tindang
      WHERE TinDangID IN (80, 77)
    `);
    console.table(checkResult);

    console.log('\n=== KẾT THÚC DUYỆT TIN ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

duyetTin();
