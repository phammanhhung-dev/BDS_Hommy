const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCrosswalkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra bảng address_crosswalk...');
    
    // Kiểm tra bảng có tồn tại không
    const [tableCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'address_crosswalk'
    `);
    
    if (tableCheck[0].total === 0) {
      console.log('❌ Bảng address_crosswalk không tồn tại');
      return;
    }
    
    console.log('✅ Bảng address_crosswalk tồn tại');
    
    // Kiểm tra cấu trúc bảng
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'address_crosswalk'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng address_crosswalk:');
    console.table(columns);
    
    // Kiểm tra số lượng dữ liệu
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM address_crosswalk
    `);
    
    console.log('📝 Số lượng bản ghi:', countResult[0].total);
    
    // Xem mẫu dữ liệu
    if (countResult[0].total > 0) {
      const [sampleData] = await connection.execute(`
        SELECT * FROM address_crosswalk LIMIT 5
      `);
      
      console.log('📋 Mẫu dữ liệu address_crosswalk:');
      console.table(sampleData);
      
      // Kiểm tra xem có map từ legacy sang new không
      const [mapCheck] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT old_province_id) as old_provinces,
          COUNT(DISTINCT new_province_id) as new_provinces,
          COUNT(DISTINCT legacy_ward_id) as legacy_wards,
          COUNT(DISTINCT new_ward_id) as new_wards
        FROM address_crosswalk
        WHERE old_province_id IS NOT NULL AND new_province_id IS NOT NULL
      `);
      
      console.log('📋 Thống kê mapping:');
      console.table(mapCheck);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkCrosswalkTable();
