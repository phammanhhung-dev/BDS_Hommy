const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'realestate'
  });

  try {
    console.log('=== Starting Seeding of Sales Test Data ===');

    // 1. Find or create a Customer (VaiTroHoatDongID = 1)
    const [customers] = await connection.execute('SELECT NguoiDungID, TenDayDu FROM nguoidung WHERE VaiTroHoatDongID = 1 LIMIT 1');
    let customerId;
    if (customers.length > 0) {
      customerId = customers[0].NguoiDungID;
      console.log('Found existing customer:', customers[0].TenDayDu, '(ID:', customerId + ')');
    } else {
      const [insertCust] = await connection.execute(
        "INSERT INTO nguoidung (TenDayDu, Email, SoDienThoai, MatKhauHash, VaiTroHoatDongID) " +
        "VALUES ('Nguyễn Khách Hàng', 'khachhang@gmail.com', '0987654321', 'e10adc3949ba59abbe56e057f20f883e', 1)"
      );
      customerId = insertCust.insertId;
      console.log('Created new customer, ID:', customerId);
    }

    // 2. Find a sales staff member (VaiTroHoatDongID = 2). We will use ID 8 (Nguyễn Văn Bán Hàng)
    const salesStaffId = 8;
    
    // Ensure hosonhanvien entry exists for ID 8
    const [profiles] = await connection.execute('SELECT NguoiDungID FROM hosonhanvien WHERE NguoiDungID = ?', [salesStaffId]);
    if (profiles.length === 0) {
      await connection.execute(
        "INSERT INTO hosonhanvien (NguoiDungID, MaNhanVien, TyLeHoaHong, TrangThaiLamViec, NgayBatDau) " +
        "VALUES (?, 'NVBH008', 5.0, 'DangLamViec', CURDATE())",
        [salesStaffId]
      );
      console.log('Created hosonhanvien profile for sales staff ID 8');
    }

    // 3. Find a valid room and listing (with non-null DuAnID) from the database
    const [listings] = await connection.execute('SELECT TinDangID, DuAnID FROM tindang WHERE DuAnID IS NOT NULL LIMIT 1');
    if (listings.length === 0) {
      throw new Error('Database is missing listings with valid DuAnID. Please seed the database first.');
    }
    const tinDangId = listings[0].TinDangID;
    const duAnId = listings[0].DuAnID;

    // Find a room belonging to the same project or any room
    const [rooms] = await connection.execute('SELECT PhongID FROM phong WHERE DuAnID = ? LIMIT 1', [duAnId]);
    let phongId;
    if (rooms.length > 0) {
      phongId = rooms[0].PhongID;
    } else {
      const [anyRooms] = await connection.execute('SELECT PhongID FROM phong LIMIT 1');
      if (anyRooms.length === 0) {
        throw new Error('Database is missing rooms. Please seed the database first.');
      }
      phongId = anyRooms[0].PhongID;
    }

    console.log('Using Room ID:', phongId, 'Listing ID:', tinDangId, 'DuAnID:', duAnId);

    // Link them in phong_tindang if not already linked
    await connection.execute(
      "INSERT IGNORE INTO phong_tindang (PhongID, TinDangID, GiaTinDang) VALUES (?, ?, 3500000)",
      [phongId, tinDangId]
    );

    // Clear existing test data in target tables to avoid duplicate key issues
    console.log('Clearing old test data...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE cuochen');
    await connection.execute('TRUNCATE TABLE coc');
    await connection.execute('TRUNCATE TABLE hopdong');
    await connection.execute('TRUNCATE TABLE giaodich');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Inserting appointments (cuochen)...');
    
    // Appointment 1: Today, completed (HoanThanh)
    const today = new Date();
    today.setHours(9, 0, 0, 0); // 9:00 AM today
    await connection.execute(
      "INSERT INTO cuochen (KhachHangID, NhanVienBanHangID, PhongID, TinDangID, ThoiGianHen, TrangThai, PheDuyetChuDuAn, TaoLuc, CapNhatLuc, ChuDuAnID) " +
      "VALUES (?, ?, ?, ?, ?, 'HoanThanh', 'DaPheDuyet', NOW(), NOW(), 7)",
      [customerId, salesStaffId, phongId, tinDangId, today]
    );

    // Appointment 2: Today, waiting confirmation (ChoXacNhan)
    const today2 = new Date();
    today2.setHours(14, 30, 0, 0); // 2:30 PM today
    await connection.execute(
      "INSERT INTO cuochen (KhachHangID, NhanVienBanHangID, PhongID, TinDangID, ThoiGianHen, TrangThai, PheDuyetChuDuAn, TaoLuc, CapNhatLuc, ChuDuAnID) " +
      "VALUES (?, ?, ?, ?, ?, 'ChoXacNhan', 'ChoPheDuyet', NOW(), NOW(), 7)",
      [customerId, salesStaffId, phongId, tinDangId, today2]
    );

    // Appointment 3: Tomorrow, confirmed (DaXacNhan)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow
    await connection.execute(
      "INSERT INTO cuochen (KhachHangID, NhanVienBanHangID, PhongID, TinDangID, ThoiGianHen, TrangThai, PheDuyetChuDuAn, TaoLuc, CapNhatLuc, ChuDuAnID) " +
      "VALUES (?, ?, ?, ?, ?, 'DaXacNhan', 'DaPheDuyet', NOW(), NOW(), 7)",
      [customerId, salesStaffId, phongId, tinDangId, tomorrow]
    );

    console.log('Inserting shifts (lichlamviec)...');
    await connection.execute('TRUNCATE TABLE lichlamviec');
    
    // Add shifts for today, tomorrow, and the day after tomorrow
    const days = [0, 1, 2];
    for (const d of days) {
      const start = new Date();
      start.setDate(start.getDate() + d);
      start.setHours(8, 0, 0, 0);
      
      const end = new Date();
      end.setDate(end.getDate() + d);
      end.setHours(12, 0, 0, 0);

      await connection.execute(
        "INSERT INTO lichlamviec (NhanVienBanHangID, BatDau, KetThuc) VALUES (?, ?, ?)",
        [salesStaffId, start, end]
      );
    }

    console.log('Inserting transactions, contracts, and deposits (giaodich, hopdong, coc)...');

    // Create a wallet (vi) for the user or get first active wallet
    let walletId;
    const [wallets] = await connection.execute('SELECT ViID FROM vi LIMIT 1');
    if (wallets.length > 0) {
      walletId = wallets[0].ViID;
    } else {
      const [insertVi] = await connection.execute(
        "INSERT INTO vi (NguoiDungID, SoDu, TrangThai) VALUES (?, 10000000.0, 'HoatDong')",
        [customerId]
      );
      walletId = insertVi.insertId;
      console.log('Created wallet ID:', walletId);
    }

    // Transaction 1: Coc Giu Cho, DaGhiNhan (used for monthly income calculation)
    const [gd1] = await connection.execute(
      "INSERT INTO giaodich (ViID, SoTien, Loai, TrangThai, KhoaDinhDanh, TinDangLienQuanID, ThoiGian, KenhThanhToan) " +
      "VALUES (?, 1000000.00, 'COC_GIU_CHO', 'DaGhiNhan', UUID(), ?, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'CHUYEN_KHOAN')",
      [walletId, tinDangId]
    );
    const gdId1 = gd1.insertId;

    // Transaction 2: Coc An Ninh, DaUyQuyen (pending verification)
    const [gd2] = await connection.execute(
      "INSERT INTO giaodich (ViID, SoTien, Loai, TrangThai, KhoaDinhDanh, TinDangLienQuanID, ThoiGian, KenhThanhToan) " +
      "VALUES (?, 2000000.00, 'COC_AN_NINH', 'DaUyQuyen', UUID(), ?, NOW(), 'CHUYEN_KHOAN')",
      [walletId, tinDangId]
    );
    const gdId2 = gd2.insertId;

    // Contract 1 (linked to gd1 / coc1)
    const [hd1] = await connection.execute(
      "INSERT INTO hopdong (TinDangID, PhongID, DuAnID, NhanVienBanHangID, KhachHangID, NgayBatDau, NgayKetThuc, GiaThueCuoiCung, SoTienCoc, TrangThai) " +
      "VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 5000000.00, 5000000.00, 'xacthuc')",
      [tinDangId, phongId, duAnId, salesStaffId, customerId]
    );
    const hdId1 = hd1.insertId;

    // Deposit 1 (DaDoiTru = DaGhiNhan)
    await connection.execute(
      "INSERT INTO coc (GiaoDichID, TinDangID, PhongID, Loai, SoTien, TTL_Gio, HetHanLuc, TrangThai, GhiChu, TaoLuc, CapNhatLuc, ChinhSachCocID, HopDongID) " +
      "VALUES (?, ?, ?, 'CocGiuCho', 1000000.00, 24, DATE_ADD(NOW(), INTERVAL 24 HOUR), 'DaDoiTru', 'Cọc giữ chỗ đã đối trừ', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), 1, ?)",
      [gdId1, tinDangId, phongId, hdId1]
    );

    // Deposit 2 (HieuLuc = DaUyQuyen, waiting sales agent confirmation)
    await connection.execute(
      "INSERT INTO coc (GiaoDichID, TinDangID, PhongID, Loai, SoTien, TTL_Gio, HetHanLuc, TrangThai, GhiChu, TaoLuc, CapNhatLuc, ChinhSachCocID, HopDongID) " +
      "VALUES (?, ?, ?, 'CocAnNinh', 2000000.00, 24, DATE_ADD(NOW(), INTERVAL 24 HOUR), 'HieuLuc', 'Cọc an ninh chờ xác nhận', NOW(), NOW(), 1, ?)",
      [gdId2, tinDangId, phongId, hdId1]
    );

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

main();
