-- ====================================================
-- VERIFY & CLEANUP TEST DATA
-- Ngày: 30/10/2025
-- ====================================================

-- 1. VERIFY DATA ĐÃ TẠO
SELECT '=== VERIFY TEST DATA ===' as Info;

-- Kiểm tra khách hàng mới
SELECT 'Khách hàng mới' as Item, COUNT(*) as SoLuong
FROM nguoidung
WHERE Email LIKE '%test%' AND NguoiDungID > 6;

-- Kiểm tra dự án của user 6 (dùng DuAnID thay vì LIKE pattern)
SELECT 'Dự án user 6' as Item, COUNT(*) as SoLuong
FROM duan
WHERE ChuDuAnID = 6 
  AND TaoLuc >= DATE_SUB(NOW(), INTERVAL 1 HOUR);  -- Tạo trong 1 giờ qua

-- Hiển thị chi tiết dự án mới
SELECT 
  DuAnID,
  TenDuAn,
  TrangThai,
  TaoLuc
FROM duan
WHERE ChuDuAnID = 6
ORDER BY DuAnID DESC
LIMIT 10;

-- Kiểm tra tin đăng của user 6
SELECT 'Tin đăng user 6' as Item, COUNT(*) as SoLuong
FROM tindang
WHERE DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6);

-- Hiển thị chi tiết tin đăng mới
SELECT 
  t.TinDangID,
  t.DuAnID,
  LEFT(t.TieuDe, 50) as TieuDe,
  t.TrangThai,
  t.TaoLuc
FROM tindang t
WHERE t.DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6)
ORDER BY t.TinDangID DESC
LIMIT 10;

-- Kiểm tra phòng của user 6
SELECT 'Phòng user 6' as Item, COUNT(*) as SoLuong
FROM phong
WHERE DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6);

-- Hiển thị chi tiết phòng
SELECT 
  p.PhongID,
  p.DuAnID,
  p.TenPhong,
  p.TrangThai,
  p.TaoLuc
FROM phong p
WHERE p.DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6)
ORDER BY p.PhongID DESC
LIMIT 20;

-- Kiểm tra cuộc hẹn của user 6
SELECT 'Cuộc hẹn user 6' as Item, COUNT(*) as SoLuong
FROM cuochen c
WHERE c.PhongID IN (
  SELECT PhongID FROM phong WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Hiển thị chi tiết cuộc hẹn theo trạng thái
SELECT 
  c.TrangThai,
  COUNT(*) as SoLuong
FROM cuochen c
WHERE c.PhongID IN (
  SELECT PhongID FROM phong WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
)
GROUP BY c.TrangThai;

-- Hiểu thị cuộc hẹn chi tiết
SELECT 
  c.CuocHenID,
  p.TenPhong,
  n.TenDayDu as KhachHang,
  c.ThoiGianHen,
  c.TrangThai,
  c.TaoLuc
FROM cuochen c
JOIN phong p ON c.PhongID = p.PhongID
JOIN nguoidung n ON c.KhachHangID = n.NguoiDungID
WHERE p.DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6)
ORDER BY c.CuocHenID DESC
LIMIT 20;

-- Kiểm tra hợp đồng
SELECT 'Hợp đồng user 6' as Item, COUNT(*) as SoLuong
FROM hopdong h
WHERE h.TinDangID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Hiển thị chi tiết hợp đồng
SELECT 
  h.HopDongID,
  t.TieuDe,
  n.TenDayDu as KhachHang,
  h.NgayBatDau,
  h.NgayKetThuc,
  h.GiaThueCuoiCung,
  h.BaoCaoLuc
FROM hopdong h
JOIN tindang t ON h.TinDangID = t.TinDangID
JOIN nguoidung n ON h.KhachHangID = n.NguoiDungID
WHERE t.DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = 6)
ORDER BY h.HopDongID DESC;

-- Kiểm tra cọc
SELECT 'Cọc user 6' as Item, COUNT(*) as SoLuong
FROM coc c
WHERE c.TinDangID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Hiển thị chi tiết cọc theo trạng thái
SELECT 
  c.TrangThai,
  COUNT(*) as SoLuong,
  SUM(c.SoTien) as TongTien
FROM coc c
WHERE c.TinDangID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
)
GROUP BY c.TrangThai;

-- ====================================================
-- 2. CLEANUP TEST DATA (XÓA THEO THỨ TỰ DEPENDENCIES)
-- ====================================================

-- Uncomment các dòng dưới để xóa test data

/*
-- Bước 1: Xóa nhật ký hệ thống
DELETE FROM nhatkyhethong 
WHERE DoiTuong IN ('cuochen', 'hopdong', 'coc')
  AND DoiTuongID IN (
    SELECT CAST(CuocHenID AS CHAR) FROM cuochen WHERE PhongID IN (
      SELECT PhongID FROM phong WHERE DuAnID IN (
        SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
      )
    )
  );

-- Bước 2: Xóa cọc
DELETE FROM coc
WHERE TinDangID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Bước 3: Xóa cuộc hẹn
DELETE FROM cuochen
WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Bước 4: Xóa hợp đồng
DELETE FROM hopdong
WHERE TinDangID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Bước 5: Xóa giao dịch
DELETE FROM giaodich
WHERE TinDangLienQuanID IN (
  SELECT TinDangID FROM tindang WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Bước 6: Xóa phong_tindang
DELETE FROM phong_tindang
WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE DuAnID IN (
    SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
  )
);

-- Bước 7: Xóa phòng
DELETE FROM phong
WHERE DuAnID IN (
  SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
);

-- Bước 8: Xóa tin đăng
DELETE FROM tindang
WHERE DuAnID IN (
  SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
);

-- Bước 9: Xóa dự án
DELETE FROM duan
WHERE ChuDuAnID = 6;

-- Bước 10: Xóa ví khách hàng test
DELETE FROM vi
WHERE NguoiDungID IN (
  SELECT NguoiDungID FROM nguoidung 
  WHERE Email LIKE '%test%' AND NguoiDungID > 6
);

-- Bước 11: Xóa vai trò khách hàng test
DELETE FROM nguoidung_vaitro
WHERE NguoiDungID IN (
  SELECT NguoiDungID FROM nguoidung 
  WHERE Email LIKE '%test%' AND NguoiDungID > 6
);

-- Bước 12: Xóa khách hàng test
DELETE FROM nguoidung
WHERE Email LIKE '%test%' AND NguoiDungID > 6;

SELECT 'CLEANUP COMPLETED!' as Status;
*/

-- ====================================================
-- END OF VERIFICATION SCRIPT
-- ====================================================
