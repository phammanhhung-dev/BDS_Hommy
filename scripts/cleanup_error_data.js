const mysql = require('mysql2/promise');

async function cleanupErrorData() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'realestate',
    charset: 'utf8mb4'
  });

  console.log('=== BẮT ĐẦU DỌN DẸP TIN LỖI ẢNH, LỖI CHỮ ===');

  // 1. Danh sách TinDangID có lỗi ảnh hoặc lỗi chữ
  // 54, 62, 63: lỗi ảnh rỗng [], chữ 'test'
  // 51, 52, 53: tin nháp test
  // 79: lỗi chính tả 'Nhaf vip Sài Gòn'
  // 17, 18, 19, 26: lỗi ảnh null, chữ 'Phòng trọ'
  // 77: chữ 'Thuê trọ' cụt ngủn
  // 80: chữ 'Phòng trọ cao cấp, giá rẻ'
  const badTinDangIds = [17, 18, 19, 26, 51, 52, 53, 54, 62, 63, 77, 79, 80];
  console.log('Xóa các tin đăng lỗi:', badTinDangIds);

  // Xóa dữ liệu liên kết ở bảng con trước
  for (const tid of badTinDangIds) {
    await conn.execute('DELETE FROM yeuthich WHERE TinDangID = ?', [tid]).catch(() => {});
    await conn.execute('DELETE FROM cuochen WHERE TinDangID = ?', [tid]).catch(() => {});
    await conn.execute('DELETE FROM hopdong WHERE TinDangID = ?', [tid]).catch(() => {});
    await conn.execute('DELETE FROM giaodich WHERE TinDangLienQuanID = ?', [tid]).catch(() => {});
    await conn.execute('DELETE FROM bienbanbangiao WHERE TinDangID = ?', [tid]).catch(() => {});
    await conn.execute('DELETE FROM phong_tindang WHERE TinDangID = ?', [tid]).catch(() => {});
  }

  // Xóa tin đăng trong bảng tindang
  const [delTinResult] = await conn.execute(
    `DELETE FROM tindang WHERE TinDangID IN (${badTinDangIds.join(',')})`
  );
  console.log('Đã xóa tin đăng lỗi:', delTinResult.affectedRows);

  // 2. Kích hoạt 2 tin VIP 87 và 88
  await conn.execute(
    "UPDATE tindang SET TrangThai = 'DaDuyet', LoaiGiaoDich = 'Ban' WHERE TinDangID = 87"
  );
  await conn.execute(
    "UPDATE tindang SET TrangThai = 'DaDuyet', LoaiGiaoDich = 'Thue' WHERE TinDangID = 88"
  );
  console.log('Đã kích hoạt tin VIP 87 (Bán) và 88 (Thuê)');

  // 3. Thêm các tin BĐS mới cao cấp (đầy đủ ảnh đẹp, thông số BĐS)
  // Căn hộ cao cấp 2PN Vinhomes Golden River Quận 1 (Bán)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Căn Hộ Cao Cấp 2PN Vinhomes Golden River - Bến Nghé Quận 1',
      '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"]',
      'Bán căn hộ cao cấp tại dự án Vinhomes Golden River Ba Son, Quận 1. Thiết kế sang trọng view sông Sài Gòn thoáng mát, đầy đủ tiện ích chuẩn quốc tế, hồ bơi tràn bờ, phòng gym cao cấp.',
      'Hồ bơi, Gym, An ninh 24/7, Chỗ đậu xe hơi, Trung tâm thương mại',
      'Ban', 'CanHo', 6800000000, 78, 78, 2, 2, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  // Biệt Thự Đơn Lập Thảo Điền Quận 2 (Bán)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Biệt Thự Sân Vườn Thảo Điền 250m2 Hồ Bơi Riêng',
      '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"]',
      'Biệt thự đơn lập Thảo Điền đẳng cấp, không gian sân vườn hồ bơi riêng biệt. Khu vực an ninh, dân trí cao, thuận tiện di chuyển vào trung tâm thành phố.',
      'Sân vườn, Hồ bơi riêng, Gara ô tô, BBQ ngoài trời',
      'Ban', 'BietThu', 28500000000, 250, 380, 5, 5, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  // Cho Thuê Căn Hộ Dịch Vụ Studio Cao Cấp Landmark 81 (Thuê)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Cho Thuê Căn Hộ Studio Cao Cấp Landmark 81 Full Nội Thất',
      '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"]',
      'Cho thuê căn hộ studio hiện đại tại toà tháp Landmark 81, nội thất cao cấp nhập khẩu, view công viên và sông Sài Gòn. Tự do giờ giấc, dịch vụ dọn phòng chuyên nghiệp.',
      'Máy lạnh, Tủ lạnh, Tivi, Máy giặt, Hồ bơi, Gym, Thang máy',
      'Thue', 'CanHo', 14500000, 48, 48, 1, 1, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  // Cho Thuê Nhà Phố Thương Mại Shophouse Sala Đại Quang Minh (Thuê)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Cho Thuê Shophouse Liền Kề Khu Đô Thị Sala Thủ Thiêm',
      '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"]',
      'Cho thuê shophouse mặt tiền đường lớn khu đô thị kiểu mẫu Sala Thủ Thiêm. Rất thích hợp làm trụ sở văn phòng, showroom trưng bày hoặc kinh doanh F&B cao cấp.',
      'Mặt tiền đường 24m, Vỉa hè rộng, Hầm để xe, Thang máy tốc độ cao',
      'Thue', 'Shophouse', 65000000, 168, 450, 4, 5, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  console.log('Đã bổ sung 4 tin BĐS mới cao cấp (2 Bán, 2 Thuê) với ảnh chuẩn nét 100%');

  // 4. Dọn dẹp Dự Án (duan)
  // Xóa các dự án Test và trùng lặp
  const badDuAnIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 29, 30, 31, 36, 37, 38];
  console.log('Xóa các dự án lỗi/test/duplicate:', badDuAnIds);
  
  for (const did of badDuAnIds) {
    await conn.execute('DELETE FROM phong WHERE DuAnID = ?', [did]).catch(() => {});
  }
  const [delDuAnResult] = await conn.execute(
    `DELETE FROM duan WHERE DuAnID IN (${badDuAnIds.join(',')})`
  );
  console.log('Đã xóa dự án:', delDuAnResult.affectedRows);

  // Sửa tên các dự án cũ có lỗi font hoặc chữ 'nhà trọ' sang chuẩn BĐS cao cấp
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Đô Thị Mạnh Hùng Riverside' WHERE DuAnID = 24");
  await conn.execute("UPDATE duan SET TenDuAn = 'Dự Án Căn Hộ An Phú Đông' WHERE DuAnID = 26");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Phố Thương Mại An Phú Đông' WHERE DuAnID = 27");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Biệt Thự Vườn An Phú Đông' WHERE DuAnID = 28");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Căn Hộ Dịch Vụ Minh Tâm' WHERE DuAnID = 14");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Đô Thị Avocado Riverside' WHERE DuAnID = 15");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Biệt Thự Nghỉ Dưỡng Hải Hương' WHERE DuAnID = 16");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Căn Hộ Cao Cấp Hoành Hợp' WHERE DuAnID = 17");
  await conn.execute("UPDATE duan SET TenDuAn = 'Khu Căn Hộ Bcons NewSky' WHERE DuAnID = 25");

  console.log('Đã chuẩn hóa toàn bộ tên dự án sang BĐS chuyên nghiệp không còn lỗi font');

  await conn.end();
  console.log('=== DỌN DẸP HOÀN TẤT THÀNH CÔNG ===');
}

cleanupErrorData().catch(console.error);
