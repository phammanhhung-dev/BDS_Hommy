const db = require('../config/db');

async function checkMigration() {
  try {
    console.log('Kiểm tra các bảng phòng...');
    
    // Kiểm tra xem bảng phong và phong_tindang có tồn tại không
    const [tables] = await db.execute("SHOW TABLES LIKE 'phong%'");
    console.log('Các bảng phòng tìm thấy:', tables);
    
    // Kiểm tra cấu trúc bảng phong
    if (tables.some(t => Object.values(t).includes('phong'))) {
      const [phongStructure] = await db.execute("DESCRIBE phong");
      console.log('\nCấu trúc bảng phong:');
      console.table(phongStructure);
    }
    
    // Kiểm tra cấu trúc bảng phong_tindang
    if (tables.some(t => Object.values(t).includes('phong_tindang'))) {
      const [phongTindangStructure] = await db.execute("DESCRIBE phong_tindang");
      console.log('\nCấu trúc bảng phong_tindang:');
      console.table(phongTindangStructure);
    }
    
    // Kiểm tra đảm bảo không còn bảng phong_old trong kiến trúc mới
    const [oldTable] = await db.execute("SHOW TABLES LIKE 'phong_old'");
    if (oldTable.length > 0) {
      console.error('\n❌ Bảng phong_old vẫn tồn tại - vui lòng dọn dẹp migration trước khi tiếp tục');
      process.exit(1);
    }
    console.log('\n✅ Không tìm thấy bảng phong_old - Kiến trúc mới đã sạch');
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi kiểm tra migration:', error);
    process.exit(1);
  }
}

checkMigration();