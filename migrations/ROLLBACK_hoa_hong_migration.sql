-- =====================================================
-- ROLLBACK Migration: Loại bỏ các cột hoa hồng dư thừa
-- File: migrations/ROLLBACK_hoa_hong_migration.sql
-- Ngày tạo: 2025-11-06
-- Mô tả: Rollback migration sai về hoa hồng vì trùng với duyệt dự án
-- =====================================================

USE `thue_tro`;

START TRANSACTION;

-- =====================================================
-- BƯỚC 1: Drop Foreign Key
-- =====================================================
ALTER TABLE `duan` 
DROP FOREIGN KEY IF EXISTS `fk_duan_nguoiduyethoahong`;

-- =====================================================
-- BƯỚC 2: Drop Indexes
-- =====================================================
ALTER TABLE `duan` 
DROP INDEX IF EXISTS `idx_duan_trangthaiduyethoahong`,
DROP INDEX IF EXISTS `idx_duan_nguoiduyethoahong`,
DROP INDEX IF EXISTS `idx_duan_hoahong_filter`;

-- =====================================================
-- BƯỚC 3: Drop Columns DƯ THỪA
-- =====================================================
ALTER TABLE `duan` 
DROP COLUMN IF EXISTS `TrangThaiDuyetHoaHong`,
DROP COLUMN IF EXISTS `LyDoTuChoiHoaHong`,
DROP COLUMN IF EXISTS `GhiChuHoaHong`,
DROP COLUMN IF EXISTS `NguoiDuyetHoaHongID`,
DROP COLUMN IF EXISTS `ThoiGianDuyetHoaHong`;

-- =====================================================
-- BƯỚC 4: Kiểm tra các cột CẦN THIẾT (GIỮ LẠI)
-- =====================================================
-- ✅ BangHoaHong: Cần thiết - lưu % hoa hồng
-- ✅ SoThangCocToiThieu: Cần thiết - điều kiện áp dụng hoa hồng

SELECT 
  'Columns còn lại (GIỮ LẠI):' AS Message,
  COUNT(*) as TotalProjects,
  SUM(CASE WHEN BangHoaHong IS NOT NULL THEN 1 ELSE 0 END) as ProjectsWithCommission,
  SUM(CASE WHEN SoThangCocToiThieu IS NOT NULL THEN 1 ELSE 0 END) as ProjectsWithMinDeposit
FROM duan;

COMMIT;

-- =====================================================
-- KẾT QUẢ
-- =====================================================
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'thue_tro'
  AND TABLE_NAME = 'duan'
  AND (COLUMN_NAME LIKE '%HoaHong%' OR COLUMN_NAME LIKE '%Coc%' 
       OR COLUMN_NAME LIKE '%Duyet%' OR COLUMN_NAME = 'TrangThai')
ORDER BY ORDINAL_POSITION;

