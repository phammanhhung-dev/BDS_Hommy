const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeChuDuAnIDNotNull() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra lần cuối xem còn bản ghi ChuDuAnID NULL không...');

    const [nullRecords] = await connection.execute(`
      SELECT COUNT(*) as count FROM tindang WHERE ChuDuAnID IS NULL
    `);

    if (nullRecords[0].count > 0) {
      console.log(`❌ KHÔNG THỂ ĐỔI CỘT THÀNH NOT NULL - CÒN ${nullRecords[0].count} BẢN GHI NULL`);
      const [remaining] = await connection.execute(`
        SELECT TinDangID, DuAnID, TieuDe, TrangThai 
        FROM tindang 
        WHERE ChuDuAnID IS NULL
      `);
      console.table(remaining);
      throw new Error('Vẫn còn bản ghi ChuDuAnID NULL, không thể đổi thành NOT NULL');
    }

    console.log('✅ Không còn bản ghi ChuDuAnID NULL, an toàn đổi thành NOT NULL');

    console.log('📝 ALTER TABLE tindang MODIFY COLUMN ChuDuAnID INT(11) NOT NULL');
    await connection.execute(`
      ALTER TABLE tindang 
      MODIFY COLUMN ChuDuAnID INT(11) NOT NULL
    `);

    console.log('✅ Đã đổi cột ChuDuAnID thành NOT NULL thành công');

    // Kiểm tra lại
    const [newColumns] = await connection.execute('SHOW COLUMNS FROM tindang LIKE "ChuDuAnID"');
    console.log('📋 Thông tin cột sau khi sửa:', newColumns[0]);

  } catch (error) {
    console.error('❌ Lỗi khi đổi cột thành NOT NULL:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

makeChuDuAnIDNotNull();
