const db = require('../../server/config/db');

async function checkNguoiDungStructure() {
  try {
    console.log('=== KIỂM TRA CẤU TRÚC BẢNG NGUOIDUNG ===\n');

    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nguoidung'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('Các cột trong nguoidung:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    console.log('\n=== KẾT THÚC ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkNguoiDungStructure();