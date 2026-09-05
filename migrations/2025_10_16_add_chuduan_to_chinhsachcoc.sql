-- =====================================================
-- Migration: Thêm field ChuDuAnID vào bảng chinhsachcoc
-- File: migrations/2025_10_16_add_chuduan_to_chinhsachcoc.sql
-- Ngày tạo: 2025-10-16
-- Mô tả: Liên kết chính sách cọc với Chủ dự án để quản lý ownership
-- =====================================================

USE `thue_tro`;

-- =====================================================
-- BƯỚC 1: Thêm field ChuDuAnID
-- =====================================================

ALTER TABLE `chinhsachcoc`
ADD COLUMN `ChuDuAnID` INT(11) NULL COMMENT 'ID Chủ dự án sở hữu chính sách (NULL = hệ thống)' AFTER `ChinhSachCocID`;

-- Index cho performance query
ALTER TABLE `chinhsachcoc`
ADD INDEX `idx_chu_du_an` (`ChuDuAnID`);

-- =====================================================
-- BƯỚC 2: Thêm Foreign Key
-- =====================================================

ALTER TABLE `chinhsachcoc`
ADD CONSTRAINT `fk_chinhsachcoc_chuduan` 
  FOREIGN KEY (`ChuDuAnID`) 
  REFERENCES `nguoidung` (`NguoiDungID`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- =====================================================
-- BƯỚC 3: Update data hiện có
-- =====================================================

-- Chính sách mặc định (ID = 1) thuộc hệ thống, ChuDuAnID = NULL
UPDATE `chinhsachcoc`
SET `ChuDuAnID` = NULL
WHERE `ChinhSachCocID` = 1;

-- =====================================================
-- ROLLBACK (nếu cần revert migration)
-- =====================================================

/*
ALTER TABLE `chinhsachcoc`
DROP FOREIGN KEY `fk_chinhsachcoc_chuduan`;

ALTER TABLE `chinhsachcoc`
DROP INDEX `idx_chu_du_an`;

ALTER TABLE `chinhsachcoc`
DROP COLUMN `ChuDuAnID`;
*/

-- =====================================================
-- KẾT THÚC MIGRATION
-- =====================================================
