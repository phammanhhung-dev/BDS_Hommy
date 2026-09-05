require('dotenv').config();
const mysql = require('mysql2/promise');

// Kết nối MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quanlytro',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

async function testPhongDuAnEndpoint() {
  let connection;
  
  try {
    console.log('🔍 Kết nối đến database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Test query trực tiếp để kiểm tra
    console.log('\n📋 Test query trực tiếp lấy phòng của dự án ID 17:');
    const [rows] = await connection.execute(`
      SELECT 
        p.PhongID,
        p.TenPhong,
        p.TrangThai,
        p.GiaChuan,
        p.DienTichChuan,
        p.MoTaPhong,
        p.HinhAnhPhong,
        p.TaoLuc,
        p.CapNhatLuc,
        COUNT(pt.TinDangID) as SoTinDangDangDung
      FROM phong p
      LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
      LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID 
        AND td.TrangThai IN ('Nhap', 'ChoDuyet', 'DaDuyet', 'DaDang')
      WHERE p.DuAnID = 17
      GROUP BY p.PhongID, p.TenPhong, p.TrangThai, p.GiaChuan, p.DienTichChuan, 
               p.MoTaPhong, p.HinhAnhPhong, p.TaoLuc, p.CapNhatLuc
      ORDER BY p.TenPhong
    `);
    
    console.log(`✅ Thành công! Số lượng phòng: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('   Phòng đầu tiên:', rows[0]);
    } else {
      console.log('   Không có phòng nào trong dự án ID 17');
    }
    
    // Kiểm tra thông tin dự án 17
    console.log('\n🏢 Kiểm tra thông tin dự án ID 17:');
    const [duAnRows] = await connection.execute(
      'SELECT * FROM duan WHERE DuAnID = 17',
      []
    );
    
    if (duAnRows.length > 0) {
      console.log('   Thông tin dự án:', duAnRows[0]);
    } else {
      console.log('   ❌ Không tìm thấy dự án ID 17');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Đã đóng kết nối database');
    }
  }
}

// Chạy script
testPhongDuAnEndpoint();