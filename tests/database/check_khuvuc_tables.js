const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkKhuVucTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra các bảng khu vực trong DB realestate...');
    
    // Kiểm tra bảng KhuVuc (cũ)
    const [khuVucCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'KhuVuc'
    `);
    console.log('📋 Bảng KhuVuc:', khuVucCheck[0].total > 0 ? '✅ Tồn tại' : '❌ Không tồn tại');
    
    // Kiểm tra bảng khuvuc (thường viết thường)
    const [khuvucCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'khuvuc'
    `);
    console.log('📋 Bảng khuvuc (thường):', khuvucCheck[0].total > 0 ? '✅ Tồn tại' : '❌ Không tồn tại');
    
    // Kiểm tra bảng legacy_provinces
    const [provincesCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'legacy_provinces'
    `);
    console.log('📋 Bảng legacy_provinces:', provincesCheck[0].total > 0 ? '✅ Tồn tại' : '❌ Không tồn tại');
    
    // Kiểm tra bảng legacy_communes
    const [communesCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'legacy_communes'
    `);
    console.log('📋 Bảng legacy_communes:', communesCheck[0].total > 0 ? '✅ Tồn tại' : '❌ Không tồn tại');
    
    // Liệt kê tất cả bảng có chứa "khu" hoặc "provinces" hoặc "communes"
    const [allRelated] = await connection.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE() 
      AND (table_name LIKE '%khu%' OR table_name LIKE '%province%' OR table_name LIKE '%commune%')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tất cả bảng liên quan khu vực:');
    if (allRelated.length === 0) {
      console.log('❌ Không tìm thấy bảng nào liên quan');
    } else {
      console.table(allRelated);
    }
    
    // Thử query trực tiếp để xem lỗi thật
    console.log('\n🔍 Thử query trực tiếp...');
    try {
      const [testQuery] = await connection.execute('SELECT * FROM khuvuc LIMIT 1');
      console.log('✅ Query bảng khuvuc thành công:', testQuery.length, 'bản ghi');
    } catch (err) {
      console.log('❌ Query bảng khuvuc thất bại:', err.message);
    }
    
    try {
      const [testQuery] = await connection.execute('SELECT * FROM KhuVuc LIMIT 1');
      console.log('✅ Query bảng KhuVuc thành công:', testQuery.length, 'bản ghi');
    } catch (err) {
      console.log('❌ Query bảng KhuVuc thất bại:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkKhuVucTables();
