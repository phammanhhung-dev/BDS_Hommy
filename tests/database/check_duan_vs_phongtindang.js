const db = require('../../server/config/db');

async function checkDuAnVsPhongTinDang() {
  try {
    console.log('=== KIỂM TRA MỐI QUAN HỆ DuAnID vs phong_tindang CHO TIN THUÊ ===\n');

    // 1. Lấy tất cả tin Thuê với DuAnID
    console.log('1. Tin đăng Thuê với DuAnID:');
    const [tinThue] = await db.execute(`
      SELECT TinDangID, DuAnID, LoaiGiaoDich, TrangThai, TieuDe
      FROM tindang
      WHERE LoaiGiaoDich = 'Thue'
      ORDER BY TinDangID DESC
    `);
    console.table(tinThue);

    // 2. Lấy tất cả tin Thuê có trong phong_tindang
    console.log('\n2. Tin đăng Thuê có trong phong_tindang:');
    const [tinPhongTinDang] = await db.execute(`
      SELECT DISTINCT pt.TinDangID, td.DuAnID, td.LoaiGiaoDich, td.TrangThai, td.TieuDe
      FROM phong_tindang pt
      JOIN tindang td ON pt.TinDangID = td.TinDangID
      WHERE td.LoaiGiaoDich = 'Thue'
      ORDER BY pt.TinDangID DESC
    `);
    console.table(tinPhongTinDang);

    // 3. Lấy tất cả tin Thuê KHÔNG có trong phong_tindang
    console.log('\n3. Tin đăng Thuê KHÔNG có trong phong_tindang:');
    const [tinKhongPhongTinDang] = await db.execute(`
      SELECT td.TinDangID, td.DuAnID, td.LoaiGiaoDich, td.TrangThai, td.TieuDe
      FROM tindang td
      WHERE td.LoaiGiaoDich = 'Thue'
        AND NOT EXISTS (
          SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
        )
      ORDER BY td.TinDangID DESC
    `);
    console.table(tinKhongPhongTinDang);

    // 4. Kiểm tra ngoại lệ: Có DuAnID nhưng KHÔNG có phong_tindang?
    console.log('\n4. Kiểm tra ngoại lệ: Có DuAnID nhưng KHÔNG có phong_tindang?');
    const [ngoaiLe1] = await db.execute(`
      SELECT td.TinDangID, td.DuAnID, td.LoaiGiaoDich, td.TrangThai, td.TieuDe
      FROM tindang td
      WHERE td.LoaiGiaoDich = 'Thue'
        AND td.DuAnID IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
        )
      ORDER BY td.TinDangID DESC
    `);
    if (ngoaiLe1.length > 0) {
      console.log('❌ CÓ NGOẠI LỆ - Tin có DuAnID nhưng KHÔNG có phong_tindang:');
      console.table(ngoaiLe1);
    } else {
      console.log('✅ KHÔNG có ngoại lệ: Tất cả tin có DuAnID đều có phong_tindang');
    }

    // 5. Kiểm tra ngoại lệ: KHÔNG có DuAnID nhưng CÓ phong_tindang?
    console.log('\n5. Kiểm tra ngoại lệ: KHÔNG có DuAnID nhưng CÓ phong_tindang?');
    const [ngoaiLe2] = await db.execute(`
      SELECT td.TinDangID, td.DuAnID, td.LoaiGiaoDich, td.TrangThai, td.TieuDe
      FROM tindang td
      WHERE td.LoaiGiaoDich = 'Thue'
        AND td.DuAnID IS NULL
        AND EXISTS (
          SELECT 1 FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
        )
      ORDER BY td.TinDangID DESC
    `);
    if (ngoaiLe2.length > 0) {
      console.log('❌ CÓ NGOẠI LỆ - Tin KHÔNG có DuAnID nhưng CÓ phong_tindang:');
      console.table(ngoaiLe2);
    } else {
      console.log('✅ KHÔNG có ngoại lệ: Tất cả tin KHÔNG có DuAnID đều KHÔNG có phong_tindang');
    }

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkDuAnVsPhongTinDang();
