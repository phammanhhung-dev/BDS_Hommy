-- Migration: Thêm cột NhanVienBanHangID vào bảng hopdong
-- Mục đích: Ghi nhận nhân viên bán hàng phụ trách hợp đồng để tính hoa hồng
-- Ngày tạo: 2025-01-XX
-- Author: System

-- Bước 1: Thêm cột NhanVienBanHangID vào bảng hopdong
ALTER TABLE `hopdong` 
ADD COLUMN `NhanVienBanHangID` INT(11) NULL 
COMMENT 'ID nhân viên bán hàng phụ trách hợp đồng này' 
AFTER `DuAnID`;

-- Bước 2: Thêm foreign key constraint
ALTER TABLE `hopdong` 
ADD CONSTRAINT `fk_hopdong_nhanvien` 
FOREIGN KEY (`NhanVienBanHangID`) 
REFERENCES `nguoidung`(`NguoiDungID`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Bước 3: Thêm index cho performance
ALTER TABLE `hopdong` 
ADD INDEX `idx_hopdong_nhanvien` (`NhanVienBanHangID`);

-- Bước 4: Cập nhật dữ liệu hiện có (optional - gán NVBH mặc định nếu có)
-- Nếu hệ thống có NVBH với ID = 2 (hoặc lấy từ cuochen), có thể update:
-- UPDATE hopdong h
-- LEFT JOIN cuochen ch ON h.TinDangID = ch.TinDangID AND h.KhachHangID = ch.KhachHangID
-- SET h.NhanVienBanHangID = COALESCE(ch.NhanVienBanHangID, 2)
-- WHERE h.NhanVienBanHangID IS NULL;

-- Rollback (nếu cần):
-- ALTER TABLE `hopdong` DROP FOREIGN KEY `fk_hopdong_nhanvien`;
-- ALTER TABLE `hopdong` DROP INDEX `idx_hopdong_nhanvien`;
-- ALTER TABLE `hopdong` DROP COLUMN `NhanVienBanHangID`;
