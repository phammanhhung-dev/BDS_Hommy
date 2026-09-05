const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupTestAccounts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('🔍 Kiểm tra các tài khoản test cần xóa...');
    
    // Tìm tất cả tài khoản test
    const [testAccounts] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email 
      FROM nguoidung 
      WHERE Email LIKE '%test%' OR Email LIKE '%apitest%' OR Email LIKE '%frontendtest%'
      ORDER BY NguoiDungID
    `);
    
    if (testAccounts.length === 0) {
      console.log('✅ Không tìm thấy tài khoản test nào cần xóa');
      return;
    }
    
    console.log('📋 Danh sách tài khoản test tìm thấy:');
    console.table(testAccounts);
    
    // Xóa các tài khoản test (chỉ xóa ID 266, 267 - các ID mới tạo)
    const newTestIds = testAccounts
      .filter(acc => acc.NguoiDungID >= 265)
      .map(acc => acc.NguoiDungID);
    
    if (newTestIds.length === 0) {
      console.log('✅ Không có tài khoản test mới (ID >= 265) cần xóa');
      return;
    }
    
    console.log('📝 ID tài khoản test mới sẽ xóa:', newTestIds);
    
    // Xóa trong bảng kyc_verification trước
    const [deleteKycResult] = await connection.execute(`
      DELETE FROM kyc_verification 
      WHERE NguoiDungID IN (${newTestIds.join(',')})
    `);
    console.log(`✅ Đã xóa ${deleteKycResult.affectedRows} bản ghi trong kyc_verification`);
    
    // Sau đó mới xóa trong nguoidung
    const [deleteResult] = await connection.execute(`
      DELETE FROM nguoidung 
      WHERE NguoiDungID IN (${newTestIds.join(',')})
    `);
    
    console.log(`✅ Đã xóa ${deleteResult.affectedRows} tài khoản test`);
    
    // Kiểm tra lại các tài khoản còn lại
    const [remainingAccounts] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email 
      FROM nguoidung 
      WHERE Email LIKE '%test%' OR Email LIKE '%apitest%' OR Email LIKE '%frontendtest%'
      ORDER BY NguoiDungID
    `);
    
    if (remainingAccounts.length === 0) {
      console.log('✅ Đã xóa sạch tất cả tài khoản test');
    } else {
      console.log('⚠️ Còn lại các tài khoản test:', remainingAccounts.length);
      console.table(remainingAccounts);
    }
    
    // Kiểm tra tài khoản thật vẫn còn
    const [realAccounts] = await connection.execute(`
      SELECT NguoiDungID, TenDayDu, Email 
      FROM nguoidung 
      WHERE NguoiDungID IN (251, 260)
      ORDER BY NguoiDungID
    `);
    
    console.log('📋 Tài khoản thật vẫn còn (không bị xóa):');
    console.table(realAccounts);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await connection.end();
  }
}

cleanupTestAccounts();
