const db = require('./config/db');

async function checkDashboardStructure() {
  try {
    console.log('=== KIỂM TRA CẤU TRÚC BẢNG CHO DASHBOARD ===\n');

    // 1. Kiểm tra enum TrangThai của giaodich
    console.log('1. Kiểm tra enum TrangThai của giaodich');
    const [gdEnum] = await db.execute(`
      SELECT COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'giaodich' 
      AND COLUMN_NAME = 'TrangThai'
    `);
    console.log('   Enum TrangThai giaodich:', gdEnum[0].COLUMN_TYPE);

    // 2. Kiểm tra cấu trúc bảng cuochen để xác định cột ngày hẹn
    console.log('\n2. Kiểm tra cấu trúc bảng cuochen');
    const [cuochenColumns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cuochen'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('   Các cột trong cuochen:');
    cuochenColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 3. Kiểm tra cấu trúc bảng tindang để xác định cột ngày tạo
    console.log('\n3. Kiểm tra cấu trúc bảng tindang');
    const [tindangColumns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tindang'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('   Các cột trong tindang:');
    tindangColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 4. Kiểm tra dữ liệu mẫu hiện có
    console.log('\n4. Kiểm tra dữ liệu mẫu hiện có');
    
    const [tindangSample] = await db.execute(`
      SELECT TinDangID, TieuDe, TrangThai, TaoLuc, DuAnID 
      FROM tindang 
      ORDER BY TinDangID DESC LIMIT 5
    `);
    console.log('   Tin đăng mẫu:', tindangSample);

    const [cuochenSample] = await db.execute(`
      SELECT CuocHenID, TinDangID, ThoiGianHen, TrangThai 
      FROM cuochen 
      ORDER BY CuocHenID DESC LIMIT 3
    `);
    console.log('   Cuộc hẹn mẫu:', cuochenSample);

    const [giaodichSample] = await db.execute(`
      SELECT GiaoDichID, TinDangLienQuanID, SoTien, TrangThai, ThoiGian 
      FROM giaodich 
      LIMIT 3
    `);
    console.log('   Giao dịch mẫu:', giaodichSample);

    const [phongSample] = await db.execute(`
      SELECT PhongID, DuAnID, TenPhong, TrangThai 
      FROM phong 
      LIMIT 5
    `);
    console.log('   Phòng mẫu:', phongSample);

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkDashboardStructure();