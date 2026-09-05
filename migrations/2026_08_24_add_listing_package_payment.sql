-- Migration: Thêm cột thanh toán gói tin đăng vào bảng tindang
-- Date: 2026-08-24
-- Purpose: Mock thanh toán gói tin đăng mà không phụ thuộc vào hệ thống ví

-- Thêm cột GoiTin (enum: basic, standard, premium)
ALTER TABLE tindang 
ADD COLUMN GoiTin ENUM('basic', 'standard', 'premium') DEFAULT 'basic' 
COMMENT 'Gói tin đăng đã chọn';

-- Thêm cột TrangThaiThanhToan (enum: ChuaThanhToan, DaThanhToan)
ALTER TABLE tindang 
ADD COLUMN TrangThaiThanhToan ENUM('ChuaThanhToan', 'DaThanhToan') DEFAULT 'DaThanhToan' 
COMMENT 'Trạng thái thanh toán gói tin';

-- Thêm cột NgayHetHan (date, NULL cho tin cũ)
ALTER TABLE tindang 
ADD COLUMN NgayHetHan DATE DEFAULT NULL 
COMMENT 'Ngày hết hạn gói tin (tính từ ngày thanh toán + số ngày theo gói)';

-- Cập nhật dữ liệu cho tin cũ: coi như đã thanh toán gói basic, không ngày hết hạn
UPDATE tindang 
SET 
    GoiTin = 'basic',
    TrangThaiThanhToan = 'DaThanhToan',
    NgayHetHan = NULL
WHERE GoiTin IS NULL;

-- Lưu ý: migration này không ảnh hưởng đến các column hiện có
-- Logic tính NgayHetHan sẽ được xử lý trong backend:
-- - basic: +7 ngày
-- - standard: +30 ngày  
-- - premium: +60 ngày