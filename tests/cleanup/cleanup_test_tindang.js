const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupTestTinDang() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    const testTinDangIds = [20, 21, 22, 23, 24, 25];
    
    console.log('🔍 Kiểm tra bảng phong_tindang có tham chiếu tới test TinDangIDs không...');
    
    const [phongTinDangRefs] = await connection.execute(`
      SELECT * FROM phong_tindang WHERE TinDangID IN (${testTinDangIds.join(',')})
    `);

    console.log('📋 Kết quả kiểm tra phong_tindang:');
    if (phongTinDangRefs.length === 0) {
      console.log('✅ Rỗng - không có tham chiếu');
    } else {
      console.log(`❌ Có ${phongTinDangRefs.length} bản ghi tham chiếu:`);
      console.table(phongTinDangRefs);
    }

    console.log('\n🔍 Kiểm tra các bảng khác có FK tới TinDangID...');
    
    // Kiểm tra bảng yeuthich (nếu có)
    const [yeuThichRefs] = await connection.execute(`
      SELECT * FROM yeuthich WHERE TinDangID IN (${testTinDangIds.join(',')})
    `);
    
    if (yeuThichRefs.length > 0) {
      console.log(`❌ Có ${yeuThichRefs.length} bản ghi trong yeuthich:`);
      console.table(yeuThichRefs);
    } else {
      console.log('✅ yeuthich: Rỗng');
    }

    // Kiểm tra bảng thongketindang (nếu có)
    const [thongKeRefs] = await connection.execute(`
      SELECT * FROM thongketindang WHERE TinDangID IN (${testTinDangIds.join(',')})
    `);
    
    if (thongKeRefs.length > 0) {
      console.log(`❌ Có ${thongKeRefs.length} bản ghi trong thongketindang:`);
      console.table(thongKeRefs);
    } else {
      console.log('✅ thongketindang: Rỗng');
    }

    // Nếu có tham chiếu, xóa trước
    if (phongTinDangRefs.length > 0) {
      console.log('\n🗑️  Xóa tham chiếu từ phong_tindang...');
      const [deletePhongTinDang] = await connection.execute(`
        DELETE FROM phong_tindang WHERE TinDangID IN (${testTinDangIds.join(',')})
      `);
      console.log(`✅ Đã xóa ${deletePhongTinDang.affectedRows} bản ghi từ phong_tindang`);
    }

    if (yeuThichRefs.length > 0) {
      console.log('\n🗑️  Xóa tham chiếu từ yeuthich...');
      const [deleteYeuThich] = await connection.execute(`
        DELETE FROM yeuthich WHERE TinDangID IN (${testTinDangIds.join(',')})
      `);
      console.log(`✅ Đã xóa ${deleteYeuThich.affectedRows} bản ghi từ yeuthich`);
    }

    if (thongKeRefs.length > 0) {
      console.log('\n🗑️  Xóa tham chiếu từ thongketindang...');
      const [deleteThongKe] = await connection.execute(`
        DELETE FROM thongketindang WHERE TinDangID IN (${testTinDangIds.join(',')})
      `);
      console.log(`✅ Đã xóa ${deleteThongKe.affectedRows} bản ghi từ thongketindang`);
    }

    // Xóa từ tindang
    console.log('\n🗑️  Xóa 6 bản ghi test rác khỏi tindang...');
    const [deleteResult] = await connection.execute(`
      DELETE FROM tindang WHERE TinDangID IN (${testTinDangIds.join(',')})
    `);
    console.log(`✅ Đã xóa ${deleteResult.affectedRows} bản ghi từ tindang`);

    // Kiểm tra lại
    console.log('\n🔍 Kiểm tra lại xác nhận không còn bản ghi test rác...');
    const [remaining] = await connection.execute(`
      SELECT TinDangID, TieuDe FROM tindang 
      WHERE ChuDuAnID = 1 
      AND DATE(TaoLuc) = '2026-08-18'
      ORDER BY TinDangID ASC
    `);

    console.log('📋 Bản ghi còn lại (nếu có):');
    console.table(remaining);

    if (remaining.length === 0) {
      console.log('✅ Đã dọn sạch hoàn toàn!');
    } else {
      console.log(`⚠️  Còn ${remaining.length} bản ghi (không phải test rác)`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

cleanupTestTinDang();
