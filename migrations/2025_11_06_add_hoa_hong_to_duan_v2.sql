-- =====================================================
-- Migration: Thêm cấu hình hoa hồng cho dự án (Version 2.0 - Tối ưu)
-- File: migrations/2025_11_06_add_hoa_hong_to_duan_v2.sql
-- Ngày tạo: 2025-11-06
-- Mô tả: Chỉ thêm 2 cột cần thiết cho hoa hồng, tận dụng lại các cột có sẵn
-- =====================================================

USE `thue_tro`;

START TRANSACTION;

-- =====================================================
-- Kiểm tra columns đã tồn tại chưa
-- =====================================================
SET @exists_BangHoaHong = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'thue_tro' 
    AND TABLE_NAME = 'duan' 
    AND COLUMN_NAME = 'BangHoaHong'
);

SET @exists_SoThangCocToiThieu = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'thue_tro' 
    AND TABLE_NAME = 'duan' 
    AND COLUMN_NAME = 'SoThangCocToiThieu'
);

-- =====================================================
-- BƯỚC 1: Thêm BangHoaHong (nếu chưa có)
-- =====================================================
SET @sql1 = IF(
  @exists_BangHoaHong = 0,
  'ALTER TABLE `duan` 
   ADD COLUMN `BangHoaHong` DECIMAL(5,2) DEFAULT NULL 
   COMMENT ''Bảng hoa hồng (%): Phần trăm hoa hồng áp dụng cho dự án (ví dụ: 5.00 = 5%)'' 
   AFTER `ChinhSachCocID`',
  'SELECT ''Column BangHoaHong đã tồn tại'' AS message'
);

PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- =====================================================
-- BƯỚC 2: Thêm SoThangCocToiThieu (nếu chưa có)
-- =====================================================
SET @sql2 = IF(
  @exists_SoThangCocToiThieu = 0,
  'ALTER TABLE `duan` 
   ADD COLUMN `SoThangCocToiThieu` INT(11) DEFAULT NULL 
   COMMENT ''Số tháng cọc tối thiểu để áp dụng hoa hồng (ví dụ: 3 = cọc 3 tháng trở lên)'' 
   AFTER `BangHoaHong`',
  'SELECT ''Column SoThangCocToiThieu đã tồn tại'' AS message'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

COMMIT;

-- =====================================================
-- Kiểm tra kết quả
-- =====================================================
SELECT 
  'Migration v2.0 hoàn tất' AS Status,
  COUNT(*) as TotalProjects,
  SUM(CASE WHEN BangHoaHong IS NOT NULL THEN 1 ELSE 0 END) as ProjectsWithCommission
FROM duan;

SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'thue_tro'
  AND TABLE_NAME = 'duan'
  AND COLUMN_NAME IN ('BangHoaHong', 'SoThangCocToiThieu')
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- GHI CHÚ
-- =====================================================
/*
THIẾT KẾ TỐI ƯU:

✅ CHỈ 2 CỘT MỚI:
- BangHoaHong: % hoa hồng (DECIMAL 5,2)
- SoThangCocToiThieu: Điều kiện áp dụng (INT)

✅ TÁI SỬ DỤNG CÁC CỘT CÓ SẴN:
- TrangThai: Trạng thái duy nhất (HoatDong/NgungHoatDong/LuuTru)
- NguoiNgungHoatDongID: Operator banned dự án (bao gồm do hoa hồng sai)
- LyDoNgungHoatDong: Lý do banned (có thể về hoa hồng)
- YeuCauMoLai: Luồng yêu cầu mở lại (sau khi sửa hoa hồng)
- NguoiXuLyYeuCauID: Operator duyệt yêu cầu mở lại
- ThoiGianXuLyYeuCau: Thời điểm duyệt

❌ KHÔNG CẦN:
- TrangThaiDuyetHoaHong (trùng với TrangThai)
- NguoiDuyetHoaHongID (trùng với NguoiNgungHoatDongID/NguoiXuLyYeuCauID)
- ThoiGianDuyetHoaHong (trùng với NgungHoatDongLuc/ThoiGianXuLyYeuCau)
- LyDoTuChoiHoaHong (trùng với LyDoNgungHoatDong/LyDoTuChoiMoLai)
- GhiChuHoaHong (dùng NhatKyHeThong)

LUỒNG NGHIỆP VỤ:
1. Chủ dự án cấu hình hoa hồng → BangHoaHong, SoThangCocToiThieu
2. Operator kiểm tra → Nếu vi phạm → ngungHoatDongDuAn(lyDo về hoa hồng)
3. Chủ dự án sửa → yêu cầu mở lại
4. Operator duyệt → xuLyYeuCauMoLai()

Xem thêm: docs/HOA_HONG_SCHEMA_ANALYSIS.md, docs/HOA_HONG_USAGE_GUIDE.md
*/

