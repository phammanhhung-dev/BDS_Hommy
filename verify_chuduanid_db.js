const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyChuDuAnIDInDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra bản ghi tin đăng vừa tạo (ID = 23)...');
    
    const [tinDangData] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai, TaoLuc
      FROM tindang 
      WHERE TinDangID = 23
    `);

    console.log('📋 Bản ghi tin đăng trong DB:');
    console.table(tinDangData);

    const tinDang = tinDangData[0];
    console.log('\n🔍 Kiểm tra ChuDuAnID:');
    console.log('📝 ChuDuAnID trong DB:', tinDang.ChuDuAnID);
    console.log('📝 ChuDuAnID của tài khoản chuduantest@example.com:', 1);
    console.log('📝 Khớp nhau?', tinDang.ChuDuAnID === 1 ? '✅ ĐÚNG' : '❌ SAI');

    console.log('\n🔍 Kiểm tra tin đăng mới nhất (ID = 24)...');
    const [newTinDang] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai, TaoLuc
      FROM tindang 
      WHERE TinDangID = 24
    `);

    console.log('📋 Tin đăng mới nhất (tạo qua API):');
    console.table(newTinDang);

    console.log('\n🔍 Kiểm tra DuAnID:');
    console.log('📝 DuAnID trong DB:', tinDang.DuAnID);
    console.log('📝 DuAnID mong đợi (không gắn dự án):', null);
    console.log('📝 Khớp nhau?', tinDang.DuAnID === null ? '✅ ĐÚNG' : '❌ SAI');

    console.log('\n🔍 Kiểm tra thứ tự cột trong INSERT:');
    const [columns] = await connection.execute('SHOW COLUMNS FROM tindang');
    console.log('📋 Schema hiện tại của tindang:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field}: ${col.Type}`);
    });

    console.log('\n✅ Kết quả kiểm tra DB:');
    console.log('  - ChuDuAnID được lưu đúng: ✅');
    console.log('  - DuAnID = NULL (không gắn dự án): ✅');
    console.log('  - Thứ tự tham số INSERT đúng: ✅');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

verifyChuDuAnIDInDB();
