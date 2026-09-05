const mysql = require('mysql2/promise');
require('dotenv').config();

async function getHCMCID() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Tìm ID thật của TP.HCM trong new_provinces...');
    
    const [hcmcRows] = await connection.execute(`
      SELECT ProvinceID, ProvinceCode, ProvinceName, ProvinceType
      FROM new_provinces
      WHERE ProvinceName LIKE '%Hồ Chí Minh%' OR ProvinceName LIKE '%Ho Chi Minh%'
    `);
    
    if (hcmcRows.length === 0) {
      console.log('❌ Không tìm thấy TP.HCM trong new_provinces');
      return;
    }
    
    console.log('📋 Kết quả tìm TP.HCM:');
    console.table(hcmcRows);
    
    // Tìm các xã/phường của TP.HCM trong new_communes
    if (hcmcRows.length > 0) {
      const hcmID = hcmcRows[0].ProvinceID;
      const [hcmcCommunes] = await connection.execute(`
        SELECT CommuneID, CommuneName, CommuneType
        FROM new_communes
        WHERE ProvinceID = ?
        LIMIT 5
      `, [hcmID]);
      
      console.log(`📋 5 xã/phường đầu tiên của TP.HCM (ProvinceID ${hcmID}):`);
      console.table(hcmcCommunes);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

getHCMCID();
