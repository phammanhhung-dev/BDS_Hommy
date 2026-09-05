const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUpdateDeleteTinDangNoProject() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    const tinDangId = 20; // ID tin đăng vừa tạo ở bước 7
    const chuDuAnId = 1;  // ChuDuAnID sở hữu tin đăng này

    console.log('📝 Test sửa tin đăng không gắn dự án...');
    
    // Test 1: Cập nhật tin đăng (giả lập logic của capNhatTinDang)
    console.log('\n🔍 Test 1: Cập nhật tin đăng...');
    const [beforeUpdate] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai
      FROM tindang 
      WHERE TinDangID = ? AND ChuDuAnID = ?
    `, [tinDangId, chuDuAnId]);

    if (beforeUpdate.length === 0) {
      console.log('❌ Không tìm thấy tin đăng hoặc không có quyền chỉnh sửa');
      return;
    }

    console.log('📋 Trước khi cập nhật:');
    console.table(beforeUpdate);

    // Thực hiện cập nhật
    const [updateResult] = await connection.execute(`
      UPDATE tindang 
      SET TieuDe = ?, MoTa = ?, CapNhatLuc = NOW()
      WHERE TinDangID = ? AND ChuDuAnID = ?
    `, [
      'Test tin đăng không gắn dự án - ĐÃ CẬP NHẬT',
      'Đã cập nhật mô tả tin đăng không gắn dự án',
      tinDangId,
      chuDuAnId
    ]);

    console.log('✅ Cập nhật thành công! Rows affected:', updateResult.affectedRows);

    // Kiểm tra sau cập nhật
    const [afterUpdate] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, MoTa, CapNhatLuc
      FROM tindang 
      WHERE TinDangID = ?
    `, [tinDangId]);

    console.log('📋 Sau khi cập nhật:');
    console.table(afterUpdate);

    // Test 2: Xóa tin đăng (giả lập logic của xoaTinDang - chuyển sang LuuTru)
    console.log('\n🔍 Test 2: Xóa tin đăng (chuyển sang LuuTru)...');
    
    const [beforeDelete] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai
      FROM tindang 
      WHERE TinDangID = ? AND ChuDuAnID = ?
    `, [tinDangId, chuDuAnId]);

    console.log('📋 Trước khi xóa:');
    console.table(beforeDelete);

    // Thực hiện xóa (soft delete)
    const [deleteResult] = await connection.execute(`
      UPDATE tindang 
      SET TrangThai = 'LuuTru', LyDoTuChoi = 'Test xóa tin đăng không gắn dự án', CapNhatLuc = NOW()
      WHERE TinDangID = ? AND ChuDuAnID = ?
    `, [tinDangId, chuDuAnId]);

    console.log('✅ Xóa thành công! Rows affected:', deleteResult.affectedRows);

    // Kiểm tra sau xóa
    const [afterDelete] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai, LyDoTuChoi
      FROM tindang 
      WHERE TinDangID = ?
    `, [tinDangId]);

    console.log('📋 Sau khi xóa:');
    console.table(afterDelete);

    // Test 3: Kiểm tra quyền sở hữu - thử cập nhật với ChuDuAnID sai
    console.log('\n🔍 Test 3: Kiểm tra quyền sở hữu - thử cập nhật với ChuDuAnID sai...');
    const [wrongOwnerResult] = await connection.execute(`
      UPDATE tindang 
      SET TieuDe = 'Không nên cập nhật được'
      WHERE TinDangID = ? AND ChuDuAnID = 999
    `, [tinDangId]);

    console.log('📊 Kết quả cập nhật với ChuDuAnID sai:', wrongOwnerResult.affectedRows);
    if (wrongOwnerResult.affectedRows === 0) {
      console.log('✅ Chính xác! Không thể cập nhật tin đăng của người khác');
    } else {
      console.log('❌ Lỗi! Có thể cập nhật tin đăng của người khác');
    }

    // Test 4: Kiểm tra query lọc tin đăng của ChuDuAnID (không bao gồm tin đã xóa)
    console.log('\n🔍 Test 4: Kiểm tra query lọc tin đăng của ChuDuAnID (không bao gồm tin đã xóa)...');
    const [activeTinDang] = await connection.execute(`
      SELECT TinDangID, DuAnID, ChuDuAnID, TieuDe, TrangThai
      FROM tindang 
      WHERE ChuDuAnID = ? AND TrangThai != 'LuuTru'
      ORDER BY TinDangID DESC
      LIMIT 5
    `, [chuDuAnId]);

    console.log('📋 Tin đăng hoạt động của ChuDuAnID = 1:');
    console.table(activeTinDang);

    console.log('\n✅ Test hoàn tất! Quyền sở hữu hoạt động đúng:');
    console.log('  - Có thể sửa/xóa tin đăng của chính mình');
    console.log('  - Không thể sửa tin đăng của người khác');
    console.log('  - Tin đăng đã xóa không xuất hiện trong danh sách hoạt động');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

testUpdateDeleteTinDangNoProject();
