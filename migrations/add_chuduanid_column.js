const mysql = require('mysql2/promise');
require('dotenv').config();

async function addChuDuAnIDColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra cột ChuDuAnID hiện có trong tindang không...');

    // Kiểm tra cột đã tồn tại chưa
    const [columns] = await connection.execute('SHOW COLUMNS FROM tindang LIKE "ChuDuAnID"');
    
    if (columns.length > 0) {
      console.log('⚠️ Cột ChuDuAnID đã tồn tại. Hủy bỏ thêm cột.');
      console.log('📋 Thông tin cột hiện tại:', columns[0]);
      return;
    }

    console.log('✅ Cột ChuDuAnID chưa tồn tại, bắt đầu thêm...');

    // Thêm cột ChuDuAnID (cho phép NULL trước để backfill)
    console.log('📝 ALTER TABLE tindang ADD COLUMN ChuDuAnID INT(11) NULL AFTER DuyetLuc');
    await connection.execute(`
      ALTER TABLE tindang 
      ADD COLUMN ChuDuAnID INT(11) NULL AFTER DuyetLuc
    `);

    console.log('✅ Đã thêm cột ChuDuAnID (NULL) thành công');

    // Kiểm tra lại
    const [newColumns] = await connection.execute('SHOW COLUMNS FROM tindang LIKE "ChuDuAnID"');
    console.log('📋 Thông tin cột mới:', newColumns[0]);

  } catch (error) {
    console.error('❌ Lỗi khi thêm cột:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addChuDuAnIDColumn();
