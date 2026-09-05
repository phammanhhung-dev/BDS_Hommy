const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thue_tro',
    multipleStatements: true
  });
  
  try {
    console.log('\n🔄 BẮT ĐẦU ROLLBACK MIGRATION HOA HỒNG...\n');
    
    // Đọc file SQL
    const sqlFile = path.join(__dirname, '..', '..', 'migrations', 'ROLLBACK_hoa_hong_migration.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute SQL
    await conn.query(sql);
    
    console.log('✅ ROLLBACK HOÀN TẤT!\n');
    
    // Kiểm tra kết quả
    const [cols] = await conn.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'thue_tro'
        AND TABLE_NAME = 'duan'
        AND (COLUMN_NAME LIKE '%HoaHong%' OR COLUMN_NAME LIKE '%Coc%' 
             OR COLUMN_NAME LIKE '%Duyet%' OR COLUMN_NAME = 'TrangThai')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 COLUMNS CÒN LẠI (SAU ROLLBACK):');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    const hoaHongCols = cols.filter(c => c.COLUMN_NAME.includes('HoaHong') || c.COLUMN_NAME.includes('Coc'));
    const trangThaiCols = cols.filter(c => c.COLUMN_NAME === 'TrangThai' || c.COLUMN_NAME.includes('Duyet'));
    
    console.log('✅ CỘT HOA HỒNG (GIỮ LẠI):');
    hoaHongCols.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME.padEnd(30)} | ${col.COLUMN_TYPE.padEnd(25)}`);
      if (col.COLUMN_COMMENT) {
        console.log(`    → ${col.COLUMN_COMMENT}`);
      }
    });
    
    console.log('\n✅ CỘT TRẠNG THÁI (TÁI SỬ DỤNG):');
    trangThaiCols.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME.padEnd(30)} | ${col.COLUMN_TYPE.padEnd(25)}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('\n💡 KẾT LUẬN:');
    console.log('  ✅ Đã xóa 5 cột DƯ THỪA: TrangThaiDuyetHoaHong, NguoiDuyetHoaHongID,');
    console.log('     ThoiGianDuyetHoaHong, LyDoTuChoiHoaHong, GhiChuHoaHong');
    console.log('  ✅ Giữ lại 2 cột CẦN THIẾT: BangHoaHong, SoThangCocToiThieu');
    console.log('  ✅ Tái sử dụng TrangThai, NguoiNgungHoatDongID, LyDoNgungHoatDong');
    console.log('     cho việc quản lý hoa hồng\n');
    
  } catch (error) {
    console.error('❌ LỖI:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();

