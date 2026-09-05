-- Migration: Thêm column ChinhSachCocID vào bảng duan
-- Date: 2025-10-28
-- Purpose: Cho phép dự án liên kết với chính sách cọc

-- ========================================
-- THÊM COLUMN ChinhSachCocID
-- ========================================

ALTER TABLE `duan`
ADD COLUMN `ChinhSachCocID` INT(11) DEFAULT NULL COMMENT 'ID chính sách cọc áp dụng cho dự án (NULL = dùng mặc định hệ thống)' AFTER `ChuDuAnID`;

-- ========================================
-- THÊM FOREIGN KEY CONSTRAINT
-- ========================================

ALTER TABLE `duan`
ADD CONSTRAINT `fk_duan_chinhsachcoc`
FOREIGN KEY (`ChinhSachCocID`) REFERENCES `chinhsachcoc` (`ChinhSachCocID`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ========================================
-- TẠO INDEX ĐỂ TỐI ƯU QUERY
-- ========================================

ALTER TABLE `duan`
ADD INDEX `idx_duan_chinhsachcoc` (`ChinhSachCocID`);

-- ========================================
-- ROLLBACK (Nếu cần)
-- ========================================

-- DROP INDEX idx_duan_chinhsachcoc ON duan;
-- ALTER TABLE duan DROP FOREIGN KEY fk_duan_chinhsachcoc;
-- ALTER TABLE duan DROP COLUMN ChinhSachCocID;
