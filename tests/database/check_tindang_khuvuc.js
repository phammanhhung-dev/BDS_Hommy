const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTinDangKhuVuc() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra cấu trúc bảng tindang...');
    
    // Kiểm tra cấu trúc bảng tindang
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'tindang'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng tindang:');
    console.table(columns);
    
    // Kiểm tra xem KhuVucID có NULL được không
    const khuVucColumn = columns.find(col => col.COLUMN_NAME === 'KhuVucID');
    if (khuVucColumn) {
      console.log('📝 Cột KhuVucID:', khuVucColumn);
    }
    
    // Xem mẫu dữ liệu trong tindang
    const [sampleData] = await connection.execute(`
      SELECT TinDangID, DuAnID, KhuVucID, TieuDe
      FROM tindang
      LIMIT 5
    `);
    
    console.log('📋 Mẫu dữ liệu tindang:');
    console.table(sampleData);
    
    // Kiểm tra các giá trị KhuVucID trong tindang
    const [khuVucValues] = await connection.execute(`
      SELECT DISTINCT KhuVucID, COUNT(*) as count
      FROM tindang
      WHERE KhuVucID IS NOT NULL
      GROUP BY KhuVucID
      LIMIT 10
    `);
    
    console.log('📋 Các giá trị KhuVucID trong tindang:');
    console.table(khuVucValues);
    
    // Kiểm tra xem KhuVucID trong tindang map với bảng nào
    if (khuVucValues.length > 0) {
      const testKhuVucID = khuVucValues[0].KhuVucID;
      console.log(`\n🔍 Kiểm tra KhuVucID ${testKhuVucID} map với bảng nào...`);
      
      // Check legacy_communes
      try {
        const [legacyCommune] = await connection.execute(`
          SELECT CommuneID, CommuneName, ProvinceID
          FROM legacy_communes
          WHERE CommuneID = ?
          LIMIT 1
        `, [testKhuVucID]);
        if (legacyCommune.length > 0) {
          console.log('✅ Map với legacy_communes:', legacyCommune[0]);
        }
      } catch (err) {
        console.log('❌ Không map với legacy_communes:', err.message);
      }
      
      // Check new_communes
      try {
        const [newCommune] = await connection.execute(`
          SELECT CommuneID, CommuneName, ProvinceID
          FROM new_communes
          WHERE CommuneID = ?
          LIMIT 1
        `, [testKhuVucID]);
        if (newCommune.length > 0) {
          console.log('✅ Map với new_communes:', newCommune[0]);
        }
      } catch (err) {
        console.log('❌ Không map với new_communes:', err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkTinDangKhuVuc();
