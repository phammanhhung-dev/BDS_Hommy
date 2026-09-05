const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsertTinDangNoProject() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('📝 Đang tạo tin đăng không gắn dự án trực tiếp trong database...');
    
    const [result] = await connection.execute(`
      INSERT INTO tindang (
        DuAnID, ChuDuAnID, KhuVucID, ChinhSachCocID, TieuDe, URL, MoTa, 
        TienIch, GiaDien, GiaNuoc, GiaDichVu, MoTaGiaDichVu, TrangThai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      null, // DuAnID = NULL (không gắn dự án)
      1,    // ChuDuAnID = 1 (chủ dự án ID 1)
      1,    // KhuVucID
      1,    // ChinhSachCocID
      'Test tin đăng không gắn dự án - Direct DB Insert',
      JSON.stringify([]), // URL
      'Đây là tin đăng test không gắn dự án, insert trực tiếp vào DB',
      JSON.stringify([]), // TienIch
      500000, // GiaDien
      300000, // GiaNuoc
      200000, // GiaDichVu
      'Phí dịch vụ bao gồm vệ sinh chung', // MoTaGiaDichVu
      'Nhap' // TrangThai
    ]);

    console.log('✅ Insert thành công!');
    console.log('🆔 ID tin đăng mới:', result.insertId);

    // Kiểm tra tin đăng vừa tạo
    console.log('\n🔍 Kiểm tra tin đăng vừa tạo...');
    const [newTinDang] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai, TaoLuc
      FROM tindang 
      WHERE TinDangID = ?
    `, [result.insertId]);

    console.log('📋 Tin đăng vừa tạo:');
    console.table(newTinDang);

    // Kiểm tra query lọc theo ChuDuAnID
    console.log('\n🔍 Kiểm tra query lọc theo ChuDuAnID...');
    const [filteredTinDang] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai
      FROM tindang 
      WHERE ChuDuAnID = 1
      ORDER BY TinDangID DESC
      LIMIT 5
    `);

    console.log('📋 5 tin đăng gần nhất của ChuDuAnID = 1:');
    console.table(filteredTinDang);

    // Kiểm tra LEFT JOIN với duan
    console.log('\n🔍 Kiểm tra LEFT JOIN với duan (tìm tin đăng không gắn dự án)...');
    const [leftJoinResult] = await connection.execute(`
      SELECT td.TinDangID, td.DuAnID, td.ChuDuAnID, td.TieuDe, da.TenDuAn
      FROM tindang td
      LEFT JOIN duan da ON td.DuAnID = da.DuAnID
      WHERE td.ChuDuAnID = 1 AND td.DuAnID IS NULL
    `);

    console.log('📋 Tin đăng không gắn dự án (DuAnID = NULL):');
    console.table(leftJoinResult);

    console.log('\n✅ Test hoàn tất! Tin đăng không gắn dự án đã được tạo và xuất hiện trong query lọc theo ChuDuAnID.');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

testInsertTinDangNoProject();
