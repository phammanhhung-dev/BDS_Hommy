const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkNewAddressStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra cấu trúc bảng new_provinces...');
    
    // Kiểm tra cấu trúc new_provinces
    const [provinceColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'new_provinces'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng new_provinces:');
    console.table(provinceColumns);
    
    // Xem mẫu dữ liệu new_provinces
    const [provinceSample] = await connection.execute(`
      SELECT * FROM new_provinces LIMIT 5
    `);
    
    console.log('📋 Mẫu dữ liệu new_provinces:');
    console.table(provinceSample);
    
    // Kiểm tra cấu trúc new_communes
    console.log('\n🔍 Kiểm tra cấu trúc bảng new_communes...');
    
    const [communeColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'new_communes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng new_communes:');
    console.table(communeColumns);
    
    // Xem mẫu dữ liệu new_communes
    const [communeSample] = await connection.execute(`
      SELECT * FROM new_communes LIMIT 5
    `);
    
    console.log('📋 Mẫu dữ liệu new_communes:');
    console.table(communeSample);
    
    // Kiểm tra xem có bảng new_districts không
    const [districtTableCheck] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'new_districts'
    `);
    
    console.log('\n📋 Bảng new_districts:', districtTableCheck[0].total > 0 ? '✅ Tồn tại' : '❌ Không tồn tại');
    
    if (districtTableCheck[0].total > 0) {
      const [districtColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'new_districts'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('📋 Cấu trúc bảng new_districts:');
      console.table(districtColumns);
      
      const [districtSample] = await connection.execute(`
        SELECT * FROM new_districts LIMIT 5
      `);
      
      console.log('📋 Mẫu dữ liệu new_districts:');
      console.table(districtSample);
    }
    
    // Kiểm tra mối quan hệ giữa new_communes và new_provinces
    console.log('\n🔍 Kiểm tra mối quan hệ new_communes -> new_provinces...');
    const [relationCheck] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT nc.ProvinceID) as distinct_provinces,
        COUNT(*) as total_communes
      FROM new_communes nc
    `);
    
    console.log('📋 Thống kê quan hệ:');
    console.table(relationCheck);
    
    // Kiểm tra xem new_communes có cột DistrictID không
    const hasDistrictColumn = communeColumns.find(col => col.COLUMN_NAME === 'DistrictID');
    console.log('📝 new_communes có cột DistrictID:', hasDistrictColumn ? '✅ Có' : '❌ Không');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkNewAddressStructure();
