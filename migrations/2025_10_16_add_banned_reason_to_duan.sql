-- =====================================================
-- Migration: Thêm fields quản lý trạng thái Ngưng hoạt động và Yêu cầu mở lại dự án
-- File: migrations/2025_10_16_add_banned_reason_to_duan.sql
-- Ngày tạo: 2025-10-16
-- Mô tả: Thêm các fields để lưu lý do banned, người xử lý, thời gian, và luồng yêu cầu mở lại
-- =====================================================

USE `thue_tro`;

-- =====================================================
-- BƯỚC 1: Thêm các fields quản lý trạng thái Ngưng hoạt động
-- =====================================================

ALTER TABLE `duan`
ADD COLUMN `LyDoNgungHoatDong` TEXT NULL COMMENT 'Lý do dự án bị ngưng hoạt động (banned) do vi phạm chính sách' AFTER `TrangThai`,
ADD COLUMN `NguoiNgungHoatDongID` INT(11) NULL COMMENT 'ID Operator/Admin thực hiện banned dự án' AFTER `LyDoNgungHoatDong`,
ADD COLUMN `NgungHoatDongLuc` DATETIME NULL COMMENT 'Thời điểm dự án bị ngưng hoạt động' AFTER `NguoiNgungHoatDongID`;

-- Index cho performance query
ALTER TABLE `duan`
ADD INDEX `idx_nguoi_ngung_hoat_dong` (`NguoiNgungHoatDongID`);

-- =====================================================
-- BƯỚC 2: Thêm các fields quản lý yêu cầu mở lại dự án
-- =====================================================

ALTER TABLE `duan`
ADD COLUMN `YeuCauMoLai` ENUM('ChuaGui','DangXuLy','ChapNhan','TuChoi') NULL DEFAULT NULL COMMENT 'Trạng thái yêu cầu mở lại dự án sau khi bị banned' AFTER `NgungHoatDongLuc`,
ADD COLUMN `NoiDungGiaiTrinh` TEXT NULL COMMENT 'Nội dung giải trình của Chủ dự án khi yêu cầu mở lại' AFTER `YeuCauMoLai`,
ADD COLUMN `ThoiGianGuiYeuCau` DATETIME NULL COMMENT 'Thời điểm Chủ dự án gửi yêu cầu mở lại' AFTER `NoiDungGiaiTrinh`,
ADD COLUMN `NguoiXuLyYeuCauID` INT(11) NULL COMMENT 'ID Operator/Admin xử lý yêu cầu mở lại' AFTER `ThoiGianGuiYeuCau`,
ADD COLUMN `ThoiGianXuLyYeuCau` DATETIME NULL COMMENT 'Thời điểm Operator/Admin xử lý yêu cầu' AFTER `NguoiXuLyYeuCauID`,
ADD COLUMN `LyDoTuChoiMoLai` TEXT NULL COMMENT 'Lý do từ chối yêu cầu mở lại (nếu YeuCauMoLai=TuChoi)' AFTER `ThoiGianXuLyYeuCau`;

-- Index cho performance query
ALTER TABLE `duan`
ADD INDEX `idx_nguoi_xu_ly_yeu_cau` (`NguoiXuLyYeuCauID`),
ADD INDEX `idx_yeu_cau_mo_lai_status` (`YeuCauMoLai`);

-- =====================================================
-- BƯỚC 3: Thêm Foreign Keys (nếu cần tham chiếu bảng nguoidung)
-- =====================================================

ALTER TABLE `duan`
ADD CONSTRAINT `fk_duan_nguoi_ngung_hoat_dong` 
  FOREIGN KEY (`NguoiNgungHoatDongID`) 
  REFERENCES `nguoidung` (`NguoiDungID`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

ALTER TABLE `duan`
ADD CONSTRAINT `fk_duan_nguoi_xu_ly_yeu_cau` 
  FOREIGN KEY (`NguoiXuLyYeuCauID`) 
  REFERENCES `nguoidung` (`NguoiDungID`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- =====================================================
-- BƯỚC 4: Update data mẫu (optional - cho testing)
-- =====================================================

-- Giả lập dự án ID 10, 11, 12 đã bị banned
UPDATE `duan`
SET 
  `LyDoNgungHoatDong` = 'Vi phạm chính sách đăng tin: Đăng tin giả mạo, thông tin sai lệch về dự án. Đã nhận 3 báo cáo từ khách hàng.',
  `NguoiNgungHoatDongID` = 4, -- ID của Phạm Thị Điều Hành (Operator)
  `NgungHoatDongLuc` = '2025-09-27 14:36:46',
  `YeuCauMoLai` = NULL -- Chưa gửi yêu cầu
WHERE `DuAnID` = 10;

UPDATE `duan`
SET 
  `LyDoNgungHoatDong` = 'Vi phạm chính sách thanh toán: Chủ dự án có hành vi lừa đảo, không hoàn tiền cọc cho khách hàng đúng hạn.',
  `NguoiNgungHoatDongID` = 5, -- ID của Hoàng Văn Admin (System Admin)
  `NgungHoatDongLuc` = '2025-09-27 14:36:52',
  `YeuCauMoLai` = 'DangXuLy', -- Đã gửi yêu cầu mở lại
  `NoiDungGiaiTrinh` = 'Tôi đã hoàn trả đầy đủ tiền cọc cho khách hàng. Xin cung cấp bằng chứng chuyển khoản đính kèm. Cam kết tuân thủ chính sách từ nay.',
  `ThoiGianGuiYeuCau` = '2025-10-01 10:30:00'
WHERE `DuAnID` = 11;

UPDATE `duan`
SET 
  `LyDoNgungHoatDong` = 'Vi phạm quy định an toàn: Dự án không đảm bảo PCCC, có nguy cơ an toàn cao sau kiểm tra của cơ quan chức năng.',
  `NguoiNgungHoatDongID` = 5, -- ID của Hoàng Văn Admin (System Admin)
  `NgungHoatDongLuc` = '2025-09-27 14:36:58',
  `YeuCauMoLai` = 'TuChoi', -- Yêu cầu mở lại bị từ chối
  `NoiDungGiaiTrinh` = 'Dự án đã khắc phục toàn bộ vấn đề PCCC, có giấy phép từ Cảnh sát PCCC.',
  `ThoiGianGuiYeuCau` = '2025-10-05 09:00:00',
  `NguoiXuLyYeuCauID` = 5, -- Admin xử lý
  `ThoiGianXuLyYeuCau` = '2025-10-08 14:30:00',
  `LyDoTuChoiMoLai` = 'Giấy phép PCCC chưa đủ điều kiện theo quy định. Cần có chứng nhận từ UBND quận/huyện.'
WHERE `DuAnID` = 12;

-- =====================================================
-- ROLLBACK (nếu cần revert migration)
-- =====================================================

/*
ALTER TABLE `duan`
DROP FOREIGN KEY `fk_duan_nguoi_ngung_hoat_dong`,
DROP FOREIGN KEY `fk_duan_nguoi_xu_ly_yeu_cau`;

ALTER TABLE `duan`
DROP INDEX `idx_nguoi_ngung_hoat_dong`,
DROP INDEX `idx_nguoi_xu_ly_yeu_cau`,
DROP INDEX `idx_yeu_cau_mo_lai_status`;

ALTER TABLE `duan`
DROP COLUMN `LyDoNgungHoatDong`,
DROP COLUMN `NguoiNgungHoatDongID`,
DROP COLUMN `NgungHoatDongLuc`,
DROP COLUMN `YeuCauMoLai`,
DROP COLUMN `NoiDungGiaiTrinh`,
DROP COLUMN `ThoiGianGuiYeuCau`,
DROP COLUMN `NguoiXuLyYeuCauID`,
DROP COLUMN `ThoiGianXuLyYeuCau`,
DROP COLUMN `LyDoTuChoiMoLai`;
*/

-- =====================================================
-- KẾT THÚC MIGRATION
-- =====================================================
