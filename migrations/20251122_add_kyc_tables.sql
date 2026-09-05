-- =====================================================
-- Migration: Thêm tính năng KYC CCCD
-- Date: 2025-11-22
-- Author: Development Team
-- Description: Thêm các cột và bảng cần thiết cho KYC
-- =====================================================

USE thue_tro;

-- =====================================================
-- BƯỚC 1: Thêm cột vào bảng nguoidung
-- =====================================================
-- Kiểm tra xem cột đã tồn tại chưa trước khi thêm (để tránh lỗi khi chạy lại)
SET @dbname = DATABASE();
SET @tablename = "nguoidung";
SET @columnname = "AnhCCCDMatTruoc";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE nguoidung ADD COLUMN AnhCCCDMatTruoc VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt trước' AFTER NoiCapCCCD;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "AnhCCCDMatSau";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE nguoidung ADD COLUMN AnhCCCDMatSau VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt sau' AFTER AnhCCCDMatTruoc;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "AnhSelfie";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE nguoidung ADD COLUMN AnhSelfie VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh selfie xác thực' AFTER AnhCCCDMatSau;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- BƯỚC 2: Tạo bảng lịch sử xác thực KYC
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_verification (
  KYCVerificationID BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID xác thực KYC',
  NguoiDungID INT NOT NULL COMMENT 'ID người dùng (FK)',
  
  -- Thông tin CCCD trích xuất từ OCR
  SoCCCD VARCHAR(12) DEFAULT NULL COMMENT 'Số CCCD (12 số)',
  TenDayDu VARCHAR(255) DEFAULT NULL COMMENT 'Họ tên từ CCCD',
  NgaySinh DATE DEFAULT NULL COMMENT 'Ngày sinh',
  DiaChi VARCHAR(255) DEFAULT NULL COMMENT 'Địa chỉ thường trú',
  NgayCapCCCD DATE DEFAULT NULL COMMENT 'Ngày cấp CCCD',
  NoiCapCCCD VARCHAR(255) DEFAULT NULL COMMENT 'Nơi cấp CCCD',
  
  -- Kết quả Face Matching
  FaceSimilarity DECIMAL(5,4) DEFAULT NULL COMMENT 'Độ tương đồng khuôn mặt (0.0000 - 1.0000)',
  
  -- Trạng thái xác thực
  TrangThai ENUM('ThanhCong', 'ThatBai', 'CanXemLai') NOT NULL DEFAULT 'CanXemLai' COMMENT 'Trạng thái: Thành công/Thất bại/Cần xem lại',
  LyDoThatBai TEXT DEFAULT NULL COMMENT 'Lý do thất bại (nếu có)',
  
  -- Đường dẫn ảnh
  AnhCCCDMatTruoc VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt trước',
  AnhCCCDMatSau VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt sau',
  AnhSelfie VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh selfie',
  
  -- Metadata
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  
  -- Foreign Key
  FOREIGN KEY (NguoiDungID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_nguoidung (NguoiDungID),
  INDEX idx_trangthai (TrangThai),
  INDEX idx_taoluc (TaoLuc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Bảng lưu lịch sử xác thực KYC';

-- =====================================================
-- BƯỚC 3: Insert audit log
-- =====================================================
-- Kiểm tra xem bảng nhatkyhoatdong có tồn tại không trước khi insert
SET @tablename = "nhatkyhoatdong";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
  ) > 0,
  "INSERT INTO nhatkyhoatdong (NguoiDungID, HanhDong, ChiTiet, IPAddress, UserAgent) VALUES (1, 'MIGRATION', 'Thêm tính năng KYC CCCD - Migration 20251122', '127.0.0.1', 'MySQL Migration Script');",
  "SELECT 'Table nhatkyhoatdong does not exist, skipping log';"
));
PREPARE insertLog FROM @preparedStatement;
EXECUTE insertLog;
DEALLOCATE PREPARE insertLog;

-- =====================================================
-- Hoàn thành migration
-- =====================================================
SELECT 'Migration completed successfully!' AS status;
