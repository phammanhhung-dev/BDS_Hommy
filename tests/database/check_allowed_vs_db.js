const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllowedVsDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra khớp giữa ALLOWED_PROVINCES và new_provinces...');
    
    // Lấy danh sách new_provinces
    const [newProvinces] = await connection.execute(`
      SELECT ProvinceID, ProvinceName
      FROM new_provinces
      ORDER BY ProvinceID
    `);
    
    console.log('📋 new_provinces trong DB (34 tỉnh):');
    console.table(newProvinces);
    
    // ALLOWED_PROVINCES từ file config
    const ALLOWED_PROVINCES = [
      'Hà Nội', 'Huế', 'Lai Châu', 'Điện Biên', 'Sơn La', 'Lạng Sơn', 'Quảng Ninh',
      'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Cao Bằng', 'Hồ Chí Minh', 'Hải Phòng',
      'Đà Nẵng', 'Cần Thơ', 'Đồng Nai', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên',
      'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi',
      'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Tây Ninh', 'Vĩnh Long',
      'Đồng Tháp', 'Cà Mau', 'An Giang'
    ];
    
    console.log('📋 ALLOWED_PROVINCES từ config (34 tỉnh):');
    console.table(ALLOWED_PROVINCES.map((name, idx) => ({ idx, name })));
    
    // Kiểm tra khớp
    const dbProvinceNames = newProvinces.map(p => p.ProvinceName.trim());
    const configProvinceNames = ALLOWED_PROVINCES.map(name => name.trim());
    
    const matchingNames = dbProvinceNames.filter(name => configProvinceNames.includes(name));
    const missingInConfig = dbProvinceNames.filter(name => !configProvinceNames.includes(name));
    const missingInDB = configProvinceNames.filter(name => !dbProvinceNames.includes(name));
    
    console.log('📋 Kết quả khớp:');
    console.log('✅ Số tỉnh khớp:', matchingNames.length);
    console.log('❌ Có trong DB nhưng không trong config:', missingInConfig);
    console.log('❌ Có trong config nhưng không trong DB:', missingInDB);
    
    if (missingInConfig.length > 0) {
      console.log('📝 Chi tiết DB nhưng không config:', missingInConfig);
    }
    
    if (missingInDB.length > 0) {
      console.log('📝 Chi tiết config nhưng không DB:', missingInDB);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkAllowedVsDB();
