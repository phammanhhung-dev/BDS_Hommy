const mysql = require('mysql2/promise');

async function addRentals() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'realestate',
    charset: 'utf8mb4'
  });

  // Căn hộ 2PN Full nội thất Vinhomes Central Park (Thuê)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Cho Thuê Căn Hộ 2 Phòng Ngủ Full Nội Thất Vinhomes Central Park',
      '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"]',
      'Cho thuê căn hộ 2 phòng ngủ tòa Park, view nội khu và công viên 14ha xanh mát. Nhà trang bị đầy đủ nội thất cao cấp: tivi, tủ lạnh, máy giặt, sofa da, giường đệm cao cấp chỉ việc xách vali vào ở.',
      'Công viên 14ha, Hồ bơi, Bến du thuyền, TTTM Vincom, Bệnh viện Vinmec, Trường học Vinschool',
      'Thue', 'CanHo', 22000000, 75, 75, 2, 2, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  // Nhà Phố Nguyên Căn Mặt Tiền Kinh Doanh Quận 1 (Thuê)
  await conn.execute(`
    INSERT INTO tindang (
      DuAnID, KhuVucID, TieuDe, URL, MoTa, TienIch, LoaiGiaoDich, LoaiBDS,
      GiaTien, DienTichDat, DienTichSuDung, SoPhongNgu, SoPhongTam, TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan
    ) VALUES (
      39, 1,
      'Cho Thuê Nhà Phố Mặt Tiền Đường Nguyễn Thị Minh Khai Quận 1',
      '["https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"]',
      'Cho thuê nhà nguyên căn mặt tiền đường lớn trung tâm Quận 1. Kết cấu 1 trệt 3 lầu sân thượng, diện tích sàn 320m2. Vị trí đắc địa, lề đường rộng đậu xe thuận tiện kinh doanh thẩm mỹ viện, nha khoa, văn phòng đại diện.',
      'Mặt tiền đường lớn, Chỗ đậu ô tô, Thang máy, Hệ thống PCCC đạt chuẩn',
      'Thue', 'NhaPho', 45000000, 80, 320, 4, 4, 'DaDuyet', 269, 'vip', 'DaThanhToan'
    )
  `);

  console.log('Đã bổ sung thêm 2 tin thuê BĐS cao cấp!');
  await conn.end();
}

addRentals().catch(console.error);
