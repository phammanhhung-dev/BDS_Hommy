-- SQL Checks for NVBH Module Data Integrity
-- Run these queries to verify database constraints and state transitions

-- ============================================
-- 1. Check cuochen state transitions
-- ============================================
-- Verify all appointments have valid status values
SELECT 
  TrangThai, 
  COUNT(*) as SoLuong 
FROM cuochen 
WHERE NhanVienBanHangID = ? -- Replace with test NVBH ID
GROUP BY TrangThai
ORDER BY SoLuong DESC;

-- Expected statuses: DaYeuCau, ChoXacNhan, DaXacNhan, DaDoiLich, 
-- HuyBoiKhach, HuyBoiHeThong, KhachKhongDen, HoanThanh

-- ============================================
-- 2. Check SoLanDoiLich constraint (should be <= 3)
-- ============================================
-- Find appointments that have exceeded reschedule limit
SELECT 
  CuocHenID, 
  SoLanDoiLich,
  TrangThai,
  ThoiGianHen
FROM cuochen 
WHERE SoLanDoiLich > 3;

-- Expected: 0 rows (no appointments should exceed 3 reschedules)

-- ============================================
-- 3. Check giaodich status consistency
-- ============================================
-- Verify transaction statuses are valid for NVBH-related transactions
SELECT 
  gd.Loai, 
  gd.TrangThai, 
  COUNT(*) as SoLuong 
FROM giaodich gd
WHERE gd.TinDangLienQuanID IN (
  SELECT DISTINCT td.TinDangID 
  FROM cuochen ch
  INNER JOIN phong p ON ch.PhongID = p.PhongID
  INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
  INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
  WHERE ch.NhanVienBanHangID = ? -- Replace with test NVBH ID
)
AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
GROUP BY gd.Loai, gd.TrangThai
ORDER BY SoLuong DESC;

-- Expected statuses: KhoiTao, DaUyQuyen, DaGhiNhan, DaHoanTien, DaDaoNguoc

-- ============================================
-- 4. Check lichlamviec overlaps (should be 0)
-- ============================================
-- Find overlapping shifts for the same NVBH
SELECT 
  llv1.LichID as LichID1, 
  llv2.LichID as LichID2,
  llv1.BatDau as BatDau1,
  llv1.KetThuc as KetThuc1,
  llv2.BatDau as BatDau2,
  llv2.KetThuc as KetThuc2
FROM lichlamviec llv1
INNER JOIN lichlamviec llv2 
  ON llv1.NhanVienBanHangID = llv2.NhanVienBanHangID
  AND llv1.LichID < llv2.LichID
WHERE (
  (llv1.BatDau < llv2.KetThuc AND llv1.KetThuc > llv2.BatDau)
);

-- Expected: 0 rows (no overlapping shifts)

-- ============================================
-- 5. Check appointments assigned to NVBH exist
-- ============================================
-- Verify all appointments have valid NVBH assignment
SELECT 
  ch.CuocHenID,
  ch.NhanVienBanHangID,
  nd.TenDayDu as TenNVBH,
  ch.TrangThai
FROM cuochen ch
LEFT JOIN nguoidung nd ON ch.NhanVienBanHangID = nd.NguoiDungID
WHERE ch.NhanVienBanHangID = ? -- Replace with test NVBH ID
AND nd.NguoiDungID IS NULL;

-- Expected: 0 rows (all appointments should have valid NVBH)

-- ============================================
-- 6. Check commission calculation consistency
-- ============================================
-- Verify commission rates are set correctly
SELECT 
  hs.NguoiDungID,
  nd.TenDayDu,
  hs.TyLeHoaHong,
  COUNT(DISTINCT gd.GiaoDichID) as SoGiaoDich,
  SUM(gd.SoTien) as TongGiaTri,
  SUM(gd.SoTien * hs.TyLeHoaHong / 100) as TongHoaHongTinhToan
FROM hosonhanvien hs
INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
LEFT JOIN cuochen ch ON ch.NhanVienBanHangID = hs.NguoiDungID
LEFT JOIN phong p ON ch.PhongID = p.PhongID
LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
LEFT JOIN giaodich gd ON gd.TinDangLienQuanID = pt.TinDangID
  AND gd.TrangThai = 'DaGhiNhan'
  AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
WHERE hs.NguoiDungID = ? -- Replace with test NVBH ID
GROUP BY hs.NguoiDungID, nd.TenDayDu, hs.TyLeHoaHong;

-- Expected: Should show consistent commission calculations

-- ============================================
-- 7. Check audit logging coverage
-- ============================================
-- Verify critical actions are logged
SELECT 
  HanhDong, 
  COUNT(*) as SoLuong,
  MAX(TaoLuc) as LanCuoiCung
FROM nhatkyhethong 
WHERE NguoiDungID = ? -- Replace with test NVBH ID
AND TaoLuc >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY HanhDong
ORDER BY SoLuong DESC;

-- Expected actions:
-- - tao_ca_lam_viec_sales
-- - cap_nhat_ca_lam_viec_sales
-- - xoa_ca_lam_viec_sales
-- - xem_chi_tiet_cuoc_hen
-- - xac_nhan_cuoc_hen
-- - doi_lich_cuoc_hen
-- - huy_cuoc_hen
-- - bao_cao_ket_qua_cuoc_hen
-- - coc_xac_nhan_boi_sales

-- ============================================
-- 8. Check future shifts only (no past shifts)
-- ============================================
-- Verify no shifts are created in the past
SELECT 
  LichID,
  NhanVienBanHangID,
  BatDau,
  KetThuc,
  DATEDIFF(NOW(), BatDau) as NgayQuaKhu
FROM lichlamviec
WHERE NhanVienBanHangID = ? -- Replace with test NVBH ID
AND BatDau < NOW()
ORDER BY BatDau DESC;

-- Expected: Only historical shifts (for reporting), no active past shifts

-- ============================================
-- 9. Check appointment-NVBH assignment consistency
-- ============================================
-- Verify appointments are only assigned to active NVBH
SELECT 
  ch.CuocHenID,
  ch.NhanVienBanHangID,
  nd.TrangThai as TrangThaiNVBH,
  ch.TrangThai as TrangThaiCuocHen
FROM cuochen ch
INNER JOIN nguoidung nd ON ch.NhanVienBanHangID = nd.NguoiDungID
WHERE ch.NhanVienBanHangID = ? -- Replace with test NVBH ID
AND nd.TrangThai != 'HoatDong';

-- Expected: 0 rows (all appointments should be assigned to active NVBH)

-- ============================================
-- 10. Check transaction-appointment relationship
-- ============================================
-- Verify transactions are linked to valid appointments
SELECT 
  gd.GiaoDichID,
  gd.TinDangLienQuanID,
  COUNT(DISTINCT ch.CuocHenID) as SoCuocHenLienQuan
FROM giaodich gd
LEFT JOIN tindang td ON gd.TinDangLienQuanID = td.TinDangID
LEFT JOIN phong_tindang pt ON td.TinDangID = pt.TinDangID
LEFT JOIN phong p ON pt.PhongID = p.PhongID
LEFT JOIN cuochen ch ON p.PhongID = ch.PhongID
WHERE gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
GROUP BY gd.GiaoDichID, gd.TinDangLienQuanID
HAVING SoCuocHenLienQuan = 0;

-- Expected: 0 rows (all transactions should be linked to appointments)







