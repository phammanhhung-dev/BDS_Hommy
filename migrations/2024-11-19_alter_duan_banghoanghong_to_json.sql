-- Migration: Đổi BangHoaHong từ DECIMAL sang JSON TEXT
-- Date: 2024-11-19
-- Purpose: Hỗ trợ bảng hoa hồng theo mức cọc (array of {soThang, tyLe})

USE thue_tro;

-- Backup dữ liệu cũ trước khi alter
CREATE TABLE IF NOT EXISTS duan_backup_20241119 AS SELECT * FROM duan;

-- Alter column BangHoaHong từ DECIMAL(5,2) sang TEXT
ALTER TABLE duan 
  MODIFY COLUMN BangHoaHong TEXT DEFAULT NULL 
  COMMENT 'Bảng hoa hồng (JSON array): [{soThang: 6, tyLe: 30}, {soThang: 12, tyLe: 50}] - Tỷ lệ hoa hồng theo số tháng cọc';

-- Update comment cho SoThangCocToiThieu để rõ hơn
ALTER TABLE duan
  MODIFY COLUMN SoThangCocToiThieu INT(11) DEFAULT NULL
  COMMENT 'Số tháng cọc tối thiểu để được áp dụng hoa hồng (nếu có bảng hoa hồng)';

-- Test query để verify
SELECT 
  DuAnID,
  TenDuAn,
  BangHoaHong,
  SoThangCocToiThieu
FROM duan
WHERE BangHoaHong IS NOT NULL OR SoThangCocToiThieu IS NOT NULL;

-- Commit
COMMIT;
