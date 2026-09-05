const db = require('../../server/config/db');

async function checkOrphanData() {
  try {
    console.log('=== KIỂM TRA DỮ LIỆU MỒ CÔI ===\n');

    // 1. Kiểm tra phong.DuAnID trỏ đến duan không tồn tại
    console.log('1. Kiểm tra phong.DuAnID → duan.DuAnID');
    const [orphanPhong] = await db.execute(`
      SELECT p.PhongID, p.DuAnID, p.TenPhong
      FROM phong p
      LEFT JOIN duan d ON p.DuAnID = d.DuAnID
      WHERE d.DuAnID IS NULL AND p.DuAnID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanPhong.length}`);
    if (orphanPhong.length > 0) {
      console.log('   Chi tiết:', orphanPhong);
    }

    // 2. Kiểm tra tindang.DuAnID trỏ đến duan không tồn tại
    console.log('\n2. Kiểm tra tindang.DuAnID → duan.DuAnID');
    const [orphanTinDang] = await db.execute(`
      SELECT td.TinDangID, td.DuAnID, td.TieuDe
      FROM tindang td
      LEFT JOIN duan d ON td.DuAnID = d.DuAnID
      WHERE d.DuAnID IS NULL AND td.DuAnID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanTinDang.length}`);
    if (orphanTinDang.length > 0) {
      console.log('   Chi tiết:', orphanTinDang);
    }

    // 3. Kiểm tra cuochen.TinDangID trỏ đến tindang không tồn tại
    console.log('\n3. Kiểm tra cuochen.TinDangID → tindang.TinDangID');
    const [orphanCuocHen] = await db.execute(`
      SELECT ch.CuocHenID, ch.TinDangID, ch.ThoiGianHen
      FROM cuochen ch
      LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanCuocHen.length}`);
    if (orphanCuocHen.length > 0) {
      console.log('   Chi tiết:', orphanCuocHen);
    }

    // 4. Kiểm tra hopdong.TinDangID trỏ đến tindang không tồn tại
    console.log('\n4. Kiểm tra hopdong.TinDangID → tindang.TinDangID');
    const [orphanHopDong] = await db.execute(`
      SELECT hd.HopDongID, hd.TinDangID, hd.NgayBatDau
      FROM hopdong hd
      LEFT JOIN tindang td ON hd.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL AND hd.TinDangID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanHopDong.length}`);
    if (orphanHopDong.length > 0) {
      console.log('   Chi tiết:', orphanHopDong);
    }

    // 5. Kiểm tra coc.HopDongID trỏ đến hopdong không tồn tại
    console.log('\n5. Kiểm tra coc.HopDongID → hopdong.HopDongID');
    const [orphanCoc] = await db.execute(`
      SELECT c.CocID, c.HopDongID, c.Loai, c.TrangThai
      FROM coc c
      LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID
      WHERE hd.HopDongID IS NULL AND c.HopDongID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanCoc.length}`);
    if (orphanCoc.length > 0) {
      console.log('   Chi tiết:', orphanCoc);
    }

    // 6. Kiểm tra yeuthich.TinDangID trỏ đến tindang không tồn tại
    console.log('\n6. Kiểm tra yeuthich.TinDangID → tindang.TinDangID');
    const [orphanYeuThich] = await db.execute(`
      SELECT yt.NguoiDungID, yt.TinDangID
      FROM yeuthich yt
      LEFT JOIN tindang td ON yt.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${orphanYeuThich.length}`);
    if (orphanYeuThich.length > 0) {
      console.log('   Chi tiết:', orphanYeuThich);
    }

    // 7. Kiểm tra cấu trúc bảng giaodich
    console.log('\n7. Kiểm tra cấu trúc bảng giaodich');
    const [giaodichColumns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'giaodich'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('   Các cột trong bảng giaodich:');
    giaodichColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 8. Kiểm tra dữ liệu trong giaodich để xác định cột liên kết đến tindang
    console.log('\n8. Kiểm tra dữ liệu mẫu trong giaodich');
    const [giaodichSample] = await db.execute(`
      SELECT * FROM giaodich LIMIT 3
    `);
    console.log('   Dữ liệu mẫu:', giaodichSample);

    // 9. Kiểm tra cấu trúc bảng hopdong để xác định cột trạng thái thanh toán
    console.log('\n9. Kiểm tra cấu trúc bảng hopdong');
    const [hopdongColumns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hopdong'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('   Các cột trong bảng hopdong:');
    hopdongColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 10. Kiểm tra dữ liệu mẫu trong hopdong
    console.log('\n10. Kiểm tra dữ liệu mẫu trong hopdong');
    const [hopdongSample] = await db.execute(`
      SELECT * FROM hopdong LIMIT 3
    `);
    console.log('   Dữ liệu mẫu:', hopdongSample);

    // 11. Kiểm tra xem có giao dịch nào liên kết đến hopdong không
    console.log('\n11. Kiểm tra mối quan hệ giaodich → hopdong');
    console.log('   Lưu ý: Bảng giaodich KHÔNG có cột HopDongID');
    console.log('   Thay vào đó dùng GiaoDichThamChieuID để tham chiếu giao dịch khác');

    // 12. Kiểm tra TrangThai enum trong hopdong
    console.log('\n12. Kiểm tra các giá trị TrangThai trong hopdong');
    const [hopdongStatus] = await db.execute(`
      SELECT DISTINCT TrangThai, COUNT(*) as count
      FROM hopdong
      GROUP BY TrangThai
    `);
    console.log('   Các trạng thái:', hopdongStatus);

    // 13. Kiểm tra TrangThai enum trong giaodich
    console.log('\n13. Kiểm tra các giá trị TrangThai trong giaodich');
    const [gdStatus] = await db.execute(`
      SELECT DISTINCT TrangThai, COUNT(*) as count
      FROM giaodich
      GROUP BY TrangThai
    `);
    console.log('   Các trạng thái:', gdStatus);

    // 14. Kiểm tra tin đăng hiện có để so sánh với dữ liệu mồ côi
    console.log('\n14. Kiểm tra các tin đăng hiện có trong database');
    const [existingTinDang] = await db.execute(`
      SELECT TinDangID, TieuDe, TrangThai
      FROM tindang
      ORDER BY TinDangID
    `);
    console.log('   Tổng số tin đăng:', existingTinDang.length);
    console.log('   Chi tiết:', existingTinDang);

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkOrphanData();