-- Migration: Thêm các trường PhongID, DuAnID, SoTienCoc vào bảng hopdong
-- Ngày tạo: 2025-01-XX
-- Mô tả: Thêm các trường để lưu thông tin phòng, dự án và số tiền cọc khi đặt cọc

-- Thêm cột PhongID (ID phòng được đặt cọc)
ALTER TABLE `hopdong`
ADD COLUMN `PhongID` INT DEFAULT NULL COMMENT 'ID phòng được đặt cọc' AFTER `TinDangID`;

-- Thêm cột DuAnID (ID dự án - có thể lấy từ TinDangID nhưng lưu trực tiếp để dễ query)
ALTER TABLE `hopdong`
ADD COLUMN `DuAnID` INT DEFAULT NULL COMMENT 'ID dự án (lấy từ TinDangID)' AFTER `PhongID`;

-- Thêm cột SoTienCoc (Số tiền cọc)
ALTER TABLE `hopdong`
ADD COLUMN `SoTienCoc` DECIMAL(15,2) DEFAULT NULL COMMENT 'Số tiền cọc' AFTER `GiaThueCuoiCung`;

-- Thêm index cho PhongID để tối ưu query
ALTER TABLE `hopdong`
ADD KEY `idx_hd_phong` (`PhongID`);

-- Thêm index cho DuAnID để tối ưu query
ALTER TABLE `hopdong`
ADD KEY `idx_hd_duan` (`DuAnID`);

-- Thêm foreign key constraint cho PhongID (nếu cần)
-- ALTER TABLE `hopdong`
-- ADD CONSTRAINT `fk_hd_phong` FOREIGN KEY (`PhongID`) REFERENCES `phong` (`PhongID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Thêm foreign key constraint cho DuAnID (nếu cần)
-- ALTER TABLE `hopdong`
-- ADD CONSTRAINT `fk_hd_duan` FOREIGN KEY (`DuAnID`) REFERENCES `duan` (`DuAnID`) ON DELETE SET NULL ON UPDATE CASCADE;

