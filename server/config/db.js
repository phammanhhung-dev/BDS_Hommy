const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'realestate',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection khi khởi động
async function testConnection() {
  try {
    const connection = await pool.promise().getConnection();
    console.log('✅ Kết nối database thành công -', process.env.DB_NAME || 'realestate');

    // Test query đơn giản cho mô hình địa giới mới (2 cấp)
    const [tableRows] = await connection.execute(
      `SELECT COUNT(*) as total
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = 'new_provinces'`
    );

    if (tableRows[0].total > 0) {
      const [rows] = await connection.execute('SELECT COUNT(*) as total FROM new_provinces');
      console.log('📊 Database có', rows[0].total, 'tỉnh/thành phố (new_provinces)');
    } else {
      console.log('ℹ️ Chưa tìm thấy bảng new_provinces. Bỏ qua thống kê địa giới khi khởi động.');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error.message);
    console.error('🔧 Kiểm tra XAMPP MySQL đã khởi động chưa');
  }
}

// Test ngay khi load module
testConnection();

// Dùng .promise() để query bằng async/await
module.exports = pool.promise();







// 

/*

POST http://localhost:5000/api/cuoc-hen
{
"TinDangID": 5,
"KhachHangID": 15,
"NhanVienBanHangID": 13,
"ThoiGianHen": "2025-11-10T15:30:00+07:00",
"GhiChu": "Xem phòng buổi chiều"
}

*/
