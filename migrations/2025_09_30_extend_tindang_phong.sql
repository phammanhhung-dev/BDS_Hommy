-- ============================================================================
-- Migration: Mở rộng bảng TinDang và Phong
-- Date: 2025-09-30
-- Author: System Migration
-- Description: 
--   1. Mở rộng tindang: Thêm tiện ích, giá điện/nước/dịch vụ
--   2. Mở rộng phong: Thêm URL hình ảnh và GhiChu
--   3. Thêm trigger kiểm tra xung đột biên bản bàn giao
-- ============================================================================

-- BACKUP KHUYẾN NGHỊ TRƯỚC KHI CHẠY:
-- mysqldump -u root -p thue_tro > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

USE `thue_tro`;

-- ============================================================================
-- PHẦN 1: MỞ RỘNG BẢNG `tindang`
-- ============================================================================

-- Hiện tại bảng tindang có cấu trúc:
--   - TinDangID, DuAnID, KhuVucID, ChinhSachCocID
--   - TieuDe, URL (VARCHAR 255), MoTa, Gia, DienTich
--   - TrangThai, LyDoTuChoi, DuyetBoiNhanVienID
--   - TaoLuc, CapNhatLuc, DuyetLuc

-- Bước 1.1: Sửa cột URL từ VARCHAR(255) → TEXT để chứa JSON array nhiều URL
ALTER TABLE `tindang` 
MODIFY COLUMN `URL` TEXT NULL 
COMMENT 'JSON array URLs hình ảnh tin đăng: ["/uploads/1.jpg", "/uploads/2.jpg", ...]';

-- Bước 1.2: Thêm các cột tiện ích và giá dịch vụ
ALTER TABLE `tindang` 
ADD COLUMN `TienIch` TEXT NULL 
  COMMENT 'JSON array tiện ích: ["Wifi", "Máy lạnh", "Nóng lạnh", "Giường", "Tủ quần áo", ...]' 
  AFTER `MoTa`,
ADD COLUMN `GiaDien` DECIMAL(10,2) NULL 
  COMMENT 'Giá điện (VNĐ/kWh) - Ví dụ: 3500.00 = 3,500đ/kWh' 
  AFTER `TienIch`,
ADD COLUMN `GiaNuoc` DECIMAL(10,2) NULL 
  COMMENT 'Giá nước (VNĐ/m³) - Ví dụ: 20000.00 = 20,000đ/khối' 
  AFTER `GiaDien`,
ADD COLUMN `GiaDichVu` DECIMAL(10,2) NULL 
  COMMENT 'Phí dịch vụ (VNĐ/tháng) - Ví dụ: 150000.00 = 150,000đ/tháng' 
  AFTER `GiaNuoc`,
ADD COLUMN `MoTaGiaDichVu` VARCHAR(500) NULL 
  COMMENT 'Mô tả chi tiết phí dịch vụ bao gồm: rác, vệ sinh chung, bảo vệ, internet, ...' 
  AFTER `GiaDichVu`;

-- ============================================================================
-- PHẦN 2: MỞ RỘNG BẢNG `phong`
-- ============================================================================

-- Hiện tại bảng phong có cấu trúc:
--   - PhongID, TinDangID, TenPhong, TrangThai (Trong/GiuCho/DaThue/DonDep)
--   - Gia, DienTich, TaoLuc, CapNhatLuc

-- Bước 2.1: Thêm cột GhiChu và URL
ALTER TABLE `phong` 
ADD COLUMN `GhiChu` TEXT NULL 
  COMMENT 'Ghi chú đặc điểm riêng của phòng: hướng, tầng, view, ...' 
  AFTER `DienTich`,
ADD COLUMN `URL` VARCHAR(500) NULL 
  COMMENT 'URL hình ảnh đại diện phòng (chỉ 1 hình duy nhất) - Ví dụ: /uploads/phong/101.jpg' 
  AFTER `GhiChu`;

-- ============================================================================
-- PHẦN 3: TRIGGER KIỂM TRA XUNG ĐỘT BIÊN BẢN BÀN GIAO
-- ============================================================================

-- Bảng bienbanbangiao hiện có cấu trúc:
--   - BienBanBanGiaoID (PK), HopDongID, TinDangID, PhongID
--   - TrangThai: enum('ChuaBanGiao','DangBanGiao','DaBanGiao')
--   - ChiSoDien, ChiSoNuoc, HienTrangJSON, ChuKySo
--   - TaoLuc, CapNhatLuc

-- Logic nghiệp vụ:
--   - Một phòng CHỈ có thể có 1 biên bản ở trạng thái 'DangBanGiao'
--   - Khi biên bản chuyển sang 'DaBanGiao', phòng được giải phóng
--   - Trigger này ngăn tạo biên bản mới khi đã có biên bản đang bàn giao

DELIMITER $$

DROP TRIGGER IF EXISTS `trg_before_insert_bienbanbangiao_check_active`$$

CREATE TRIGGER `trg_before_insert_bienbanbangiao_check_active`
BEFORE INSERT ON `bienbanbangiao`
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;
    
    -- Kiểm tra xem phòng có biên bản đang bàn giao không
    SELECT COUNT(*) INTO existing_count
    FROM `bienbanbangiao`
    WHERE `PhongID` = NEW.`PhongID` 
      AND `TrangThai` = 'DangBanGiao';
    
    -- Nếu đã có biên bản đang bàn giao → báo lỗi
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phòng này đã có biên bản bàn giao đang xử lý (TrangThai=DangBanGiao). Vui lòng hoàn tất biên bản cũ trước.';
    END IF;
    
    -- Optional: Kiểm tra thêm xem phòng có trạng thái phù hợp không
    -- (Ví dụ: chỉ cho phép bàn giao phòng có TrangThai='DaThue')
END$$

DELIMITER ;

-- ============================================================================
-- PHẦN 4: CẬP NHẬT DỮ LIỆU MẪU (OPTIONAL)
-- ============================================================================

-- Cập nhật một số tin đăng mẫu với tiện ích và giá dịch vụ
UPDATE `tindang` 
SET 
    `TienIch` = '["Wifi", "Máy lạnh", "Nóng lạnh", "Giường", "Tủ quần áo"]',
    `GiaDien` = 3500.00,
    `GiaNuoc` = 20000.00,
    `GiaDichVu` = 150000.00,
    `MoTaGiaDichVu` = 'Bao gồm: Thu gom rác, vệ sinh khu vực chung, bảo vệ 24/7, internet tốc độ cao'
WHERE `TrangThai` IN ('DaDuyet', 'DaDang')
  AND `TinDangID` IN (1, 2, 3)
LIMIT 3;

-- ============================================================================
-- PHẦN 5: VERIFICATION (KIỂM TRA SAU KHI MIGRATION)
-- ============================================================================

-- Kiểm tra cấu trúc bảng tindang
DESCRIBE `tindang`;

-- Kiểm tra cấu trúc bảng phong
DESCRIBE `phong`;

-- Kiểm tra trigger đã được tạo
SHOW TRIGGERS LIKE 'bienbanbangiao';

-- Kiểm tra dữ liệu mẫu đã được cập nhật
SELECT 
    TinDangID, 
    TieuDe, 
    TienIch, 
    GiaDien, 
    GiaNuoc, 
    GiaDichVu, 
    MoTaGiaDichVu,
    TrangThai
FROM `tindang` 
WHERE `TienIch` IS NOT NULL 
LIMIT 5;

-- ============================================================================
-- PHẦN 6: ROLLBACK SCRIPT (NẾU CẦN)
-- ============================================================================

/*
-- ĐỂ ROLLBACK MIGRATION NÀY, CHẠY CÁC LỆNH SAU:

USE `thue_tro`;

-- Xóa trigger
DROP TRIGGER IF EXISTS `trg_before_insert_bienbanbangiao_check_active`;

-- Xóa các cột mới từ bảng phong
ALTER TABLE `phong` 
DROP COLUMN `URL`,
DROP COLUMN `GhiChu`;

-- Xóa các cột mới từ bảng tindang
ALTER TABLE `tindang` 
DROP COLUMN `MoTaGiaDichVu`,
DROP COLUMN `GiaDichVu`,
DROP COLUMN `GiaNuoc`,
DROP COLUMN `GiaDien`,
DROP COLUMN `TienIch`;

-- Khôi phục URL về VARCHAR(255)
ALTER TABLE `tindang` 
MODIFY COLUMN `URL` VARCHAR(255) NULL;

-- Verify rollback
DESCRIBE `tindang`;
DESCRIBE `phong`;
SHOW TRIGGERS FROM `thue_tro` WHERE `Trigger` = 'trg_before_insert_bienbanbangiao_check_active';
*/

-- ============================================================================
-- KẾT THÚC MIGRATION
-- ============================================================================

-- Success message
SELECT 'Migration completed successfully! ✅' AS Status;
SELECT 'Please run verification queries above to confirm changes.' AS NextStep;
