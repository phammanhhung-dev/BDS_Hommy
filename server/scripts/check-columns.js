const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thue_tro'
  });
  
  console.log('\n📋 PHÂN TÍCH CẤU TRÚC BẢNG DUAN:');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  const [allCols] = await conn.query(`SHOW COLUMNS FROM duan`);
  
  // Nhóm 1: Quản lý Dự án
  console.log('1️⃣ QUẢN LÝ DỰ ÁN:');
  const duAnCols = allCols.filter(col => 
    ['DuAnID', 'TenDuAn', 'DiaChi', 'ViDo', 'KinhDo', 'ChuDuAnID', 
     'YeuCauPheDuyetChu', 'PhuongThucVao', 'TaoLuc', 'CapNhatLuc'].includes(col.Field)
  );
  duAnCols.forEach(col => {
    console.log(`  ✓ ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)}`);
  });
  
  // Nhóm 2: Trạng thái & Duyệt
  console.log('\n2️⃣ TRẠNG THÁI & DUYỆT DỰ ÁN (Operator):');
  const trangThaiCols = allCols.filter(col => 
    ['TrangThai', 'LyDoNgungHoatDong', 'NguoiNgungHoatDongID', 'NgungHoatDongLuc',
     'YeuCauMoLai', 'NoiDungGiaiTrinh', 'ThoiGianGuiYeuCau', 
     'NguoiXuLyYeuCauID', 'ThoiGianXuLyYeuCau', 'LyDoTuChoiMoLai'].includes(col.Field)
  );
  trangThaiCols.forEach(col => {
    console.log(`  ✓ ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)}`);
  });
  
  // Nhóm 3: Chính sách Cọc & Hoa hồng
  console.log('\n3️⃣ CHÍNH SÁCH CỌC & HOA HỒNG:');
  const chinhSachCols = allCols.filter(col => 
    col.Field.includes('Coc') || col.Field.includes('HoaHong')
  );
  chinhSachCols.forEach(col => {
    console.log(`  ✓ ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | Default: ${col.Default || 'NULL'}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('\n💡 PHÂN TÍCH:');
  console.log('─────────────────────────────────────────');
  console.log('❓ NguoiNgungHoatDongID = Người duyệt/banned dự án');
  console.log('❓ NguoiXuLyYeuCauID = Người xử lý yêu cầu mở lại');
  console.log('❓ TrangThai = enum(HoatDong, NgungHoatDong, LuuTru)');
  console.log('');
  console.log('🤔 CÂU HỎI:');
  console.log('  1. Dự án có cần "duyệt" trước khi HoatDong không?');
  console.log('  2. Hay dự án tự động HoatDong và Operator chỉ Banned (NgungHoatDong)?');
  console.log('  3. Hoa hồng có cần duyệt riêng hay duyệt cùng dự án?');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  await conn.end();
})();

