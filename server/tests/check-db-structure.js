require('dotenv').config();
const mysql = require('mysql2/promise');

// Kết nối MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thue_tro',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

async function checkDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Kết nối đến database...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Kiểm tra các bảng chính
    console.log('\n📋 Kiểm tra các bảng chính trong database:');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const requiredTables = [
      'duan', 'phong', 'tindang', 'phong_tindang', 'nguoidung', 
      'khuvuc', 'coc', 'hopdong', 'cuochen'
    ];
    
    console.log('Các bảng cần thiết:');
    requiredTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? 'Đã tồn tại' : 'Thiếu'}`);
    });
    
    // 2. Kiểm tra cấu trúc bảng duan
    console.log('\n🏢 Cấu trúc bảng duan:');
    if (tableNames.includes('duan')) {
      const [duanColumns] = await connection.execute('DESCRIBE duan');
      duanColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
    // 3. Kiểm tra cấu trúc bảng phong
    console.log('\n🏠 Cấu trúc bảng phong:');
    if (tableNames.includes('phong')) {
      const [phongColumns] = await connection.execute('DESCRIBE phong');
      phongColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
    // 4. Kiểm tra cấu trúc bảng phong_tindang
    console.log('\n🔗 Cấu trúc bảng phong_tindang:');
    if (tableNames.includes('phong_tindang')) {
      const [ptdColumns] = await connection.execute('DESCRIBE phong_tindang');
      ptdColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
    // 5. Kiểm tra cấu trúc bảng tindang
    console.log('\n📝 Cấu trúc bảng tindang:');
    if (tableNames.includes('tindang')) {
      const [tdColumns] = await connection.execute('DESCRIBE tindang');
      tdColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
    // 6. Kiểm tra dữ liệu
    console.log('\n📊 Thống kê dữ liệu:');
    
    // Đếm số lượng dự án
    if (tableNames.includes('duan')) {
      const [duanCount] = await connection.execute('SELECT COUNT(*) as count FROM duan');
      console.log(`  - Số dự án: ${duanCount[0].count}`);
    }
    
    // Đếm số lượng phòng
    if (tableNames.includes('phong')) {
      const [phongCount] = await connection.execute('SELECT COUNT(*) as count FROM phong');
      console.log(`  - Số phòng: ${phongCount[0].count}`);
    }
    
    // Đếm số lượng tin đăng theo trạng thái
    if (tableNames.includes('tindang')) {
      const [tdStatusCount] = await connection.execute('SELECT TrangThai, COUNT(*) as count FROM tindang GROUP BY TrangThai');
      console.log('  - Số tin đăng theo trạng thái:');
      tdStatusCount.forEach(row => {
        console.log(`    * ${row.TrangThai}: ${row.count}`);
      });
    }
    
    // 7. Kiểm tra một vài quan hệ mẫu
    console.log('\n🔍 Kiểm tra quan hệ dữ liệu mẫu:');
    
    if (tableNames.includes('phong') && tableNames.includes('duan')) {
      // Lấy 5 phòng đầu tiên và kiểm tra thông tin liên quan
      const [rooms] = await connection.execute(`
        SELECT p.PhongID, p.DuAnID, p.TenPhong, d.TenDuAn, 
               (SELECT COUNT(*) FROM phong_tindang WHERE PhongID = p.PhongID) as SoTinDang
        FROM phong p 
        JOIN duan d ON p.DuAnID = d.DuAnID 
        LIMIT 5
      `);
      
      rooms.forEach(room => {
        console.log(`  - Phòng ${room.TenPhong} (ID: ${room.PhongID}) thuộc dự án "${room.TenDuAn}" (ID: ${room.DuAnID})`);
        console.log(`    * Số tin đăng liên quan: ${room.SoTinDang}`);
      });
    }
    
    // 8. Kiểm tra view v_phong_full_info
    console.log('\n👁️ Kiểm tra view v_phong_full_info:');
    try {
      const [viewInfo] = await connection.execute('SHOW CREATE VIEW v_phong_full_info');
      console.log('  ✅ View đã tồn tại');
      console.log('  Câu SQL tạo view:');
      console.log(`  ${viewInfo[0]['Create View']}`);
    } catch (err) {
      console.log('  ❌ View không tồn tại hoặc có lỗi:', err.message);
    }
    
    console.log('\n✅ Kiểm tra cấu trúc database hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra cấu trúc database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Đã đóng kết nối database');
    }
  }
}

// Chạy script
checkDatabaseStructure();