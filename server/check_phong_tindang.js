const db = require('./config/db');

async function checkPhongTinDang() {
  try {
    console.log('=== KIỂM TRA BẢNG phong_tindang ===\n');

    // 1. Kiểm tra cấu trúc bảng phong_tindang
    console.log('1. Cấu trúc bảng phong_tindang:');
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phong_tindang'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(columns);

    // 2. Kiểm tra dữ liệu trong phong_tindang
    console.log('\n2. Dữ liệu trong phong_tindang (latest 10):');
    const [rows] = await db.execute(`
      SELECT * FROM phong_tindang
      ORDER BY PhongTinDangID DESC
      LIMIT 10
    `);
    console.table(rows);

    // 3. Kiểm tra tin đăng Thuê có trong phong_tindang không
    console.log('\n3. Tin đăng Thuê trong DB vs phong_tindang:');
    const [tinThue] = await db.execute(`
      SELECT TinDangID, TieuDe, LoaiGiaoDich, TrangThai
      FROM tindang
      WHERE LoaiGiaoDich = 'Thue'
      ORDER BY TinDangID DESC
      LIMIT 10
    `);
    console.log('   Tin đăng Thuê:');
    console.table(tinThue);

    const tinDangIds = tinThue.map(t => t.TinDangID);
    if (tinDangIds.length > 0) {
      const placeholders = tinDangIds.map(() => '?').join(',');
      const [phongTinDangRows] = await db.execute(`
        SELECT PhongTinDangID, TinDangID, PhongID, GiaTinDang, DienTichTinDang
        FROM phong_tindang
        WHERE TinDangID IN (${placeholders})
      `, tinDangIds);
      console.log('\n   phong_tindang liên quan:');
      console.table(phongTinDangRows);
    }

    // 4. Kiểm tra tin DaDuyet/DaDang có trong phong_tindang không
    console.log('\n4. Tin đăng DaDuyet/DaDang trong phong_tindang:');
    const [publicTin] = await db.execute(`
      SELECT td.TinDangID, td.TieuDe, td.LoaiGiaoDich, td.TrangThai
      FROM tindang td
      WHERE td.TrangThai IN ('DaDuyet', 'DaDang')
      ORDER BY td.TinDangID DESC
      LIMIT 10
    `);
    console.table(publicTin);

    const publicTinIds = publicTin.map(t => t.TinDangID);
    if (publicTinIds.length > 0) {
      const placeholders = publicTinIds.map(() => '?').join(',');
      const [phongTinDangRows] = await db.execute(`
        SELECT PhongTinDangID, TinDangID, PhongID, GiaTinDang, DienTichTinDang
        FROM phong_tindang
        WHERE TinDangID IN (${placeholders})
      `, publicTinIds);
      console.log('\n   phong_tindang liên quan:');
      console.table(phongTinDangRows);
    }

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkPhongTinDang();
