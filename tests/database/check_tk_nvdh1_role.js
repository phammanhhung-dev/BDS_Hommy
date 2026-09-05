const db = require('../../server/config/db');

async function checkUserRole() {
  try {
    console.log('=== KIỂM TRA VAI TRÒ TÀI KHOẢN tk_nvdh1 ===\n');

    // Tìm user theo email (giả sử email chứa tk_nvdh1)
    const [users] = await db.execute(`
      SELECT n.NguoiDungID, n.Email, n.TenDayDu, n.VaiTroHoatDongID, v.TenVaiTro
      FROM nguoidung n
      LEFT JOIN vaitro v ON n.VaiTroHoatDongID = v.VaiTroID
      WHERE n.Email LIKE '%tk_nvdh1%' OR n.Email LIKE '%nvdh1%'
    `);

    if (users.length === 0) {
      console.log('Không tìm thấy tài khoản nào chứa "tk_nvdh1" hoặc "nvdh1"');
      
      // Hiển thị tất cả user để debug
      console.log('\n=== DANH SÁCH TẤT CẢ USER ===');
      const [allUsers] = await db.execute(`
        SELECT n.NguoiDungID, n.Email, n.TenDayDu, n.VaiTroHoatDongID, v.TenVaiTro
        FROM nguoidung n
        LEFT JOIN vaitro v ON n.VaiTroHoatDongID = v.VaiTroID
        LIMIT 20
      `);
      allUsers.forEach(u => {
        console.log(`ID: ${u.NguoiDungID}, Email: ${u.Email}, Role: ${u.TenVaiTro || 'NULL'}`);
      });
    } else {
      console.log('Tìm thấy user:');
      users.forEach(u => {
        console.log(`  NguoiDungID: ${u.NguoiDungID}`);
        console.log(`  Email: ${u.Email}`);
        console.log(`  TenDayDu: ${u.TenDayDu}`);
        console.log(`  VaiTroHoatDongID: ${u.VaiTroHoatDongID}`);
        console.log(`  TenVaiTro: ${u.TenVaiTro}`);
      });
    }

    // Kiểm tra bảng nguoidung_vaitro mapping
    console.log('\n=== KIỂM TRA MAPPING NGUOIDUNG_VAITRO ===');
    const [mapping] = await db.execute(`
      SELECT nvt.NguoiDungID, nvt.VaiTroID, vt.TenVaiTro
      FROM nguoidung_vaitro nvt
      INNER JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
      WHERE nvt.NguoiDungID IN (
        SELECT NguoiDungID FROM nguoidung WHERE Email LIKE '%tk_nvdh1%' OR Email LIKE '%nvdh1%'
      )
    `);

    if (mapping.length > 0) {
      mapping.forEach(m => {
        console.log(`  NguoiDungID: ${m.NguoiDungID}, VaiTroID: ${m.VaiTroID}, TenVaiTro: ${m.TenVaiTro}`);
      });
    } else {
      console.log('  Không có mapping trong nguoidung_vaitro');
    }

    // Hiển thị tất cả vai trò có trong hệ thống
    console.log('\n=== TẤT CẢ VAI TRÒ TRONG HỆ THỐNG ===');
    const [allRoles] = await db.execute('SELECT VaiTroID, TenVaiTro FROM vaitro');
    allRoles.forEach(r => {
      console.log(`  VaiTroID: ${r.VaiTroID}, TenVaiTro: ${r.TenVaiTro}`);
    });

    console.log('\n=== KẾT THÚC ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkUserRole();
