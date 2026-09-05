const db = require('./config/db');

async function checkOperatorAccount() {
  try {
    console.log('=== KIỂM TRA TÀI KHOẢN OPERATOR ===\n');

    // Kiểm tra các vai trò có sẵn
    console.log('1. Các vai trò trong hệ thống:');
    const [vaiTro] = await db.execute(`
      SELECT VaiTroID, TenVaiTro FROM vaitro
    `);
    console.log('   Vai trò:', vaiTro);

    // Kiểm tra người dùng có vai trò Operator
    console.log('\n2. Người dùng có vai trò Operator:');
    const [operatorUsers] = await db.execute(`
      SELECT nd.NguoiDungID, nd.TenDayDu, nd.Email, nd.TrangThai, vt.TenVaiTro
      FROM nguoidung nd
      INNER JOIN vaitro vt ON nd.VaiTroHoatDongID = vt.VaiTroID
      WHERE vt.TenVaiTro LIKE '%Operator%' OR vt.TenVaiTro LIKE '%Điều hành%'
    `);
    console.log('   Người dùng:', operatorUsers);

    // Kiểm tra người dùng có vai trò Admin (quyền cao nhất)
    console.log('\n3. Người dùng có vai trò Admin:');
    const [adminUsers] = await db.execute(`
      SELECT nd.NguoiDungID, nd.TenDayDu, nd.Email, nd.TrangThai, vt.TenVaiTro
      FROM nguoidung nd
      INNER JOIN vaitro vt ON nd.VaiTroHoatDongID = vt.VaiTroID
      WHERE vt.TenVaiTro LIKE '%Admin%' OR vt.TenVaiTro LIKE '%Quản trị%'
    `);
    console.log('   Người dùng:', adminUsers);

    // Kiểm tra tất cả người dùng
    console.log('\n4. Tất cả người dùng (để tìm tài khoản test):');
    const [allUsers] = await db.execute(`
      SELECT NguoiDungID, TenDayDu, Email, TrangThai, VaiTroHoatDongID
      FROM nguoidung
      LIMIT 10
    `);
    console.log('   Người dùng:', allUsers);

    console.log('\n=== KẾT THÚC ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkOperatorAccount();