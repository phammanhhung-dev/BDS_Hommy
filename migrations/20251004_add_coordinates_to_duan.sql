-- Migration: Add ViDo, KinhDo columns to duan table
-- Created: 2025-10-04
-- Purpose: Store geocoded latitude/longitude for projects

USE thue_tro;

-- Add ViDo (Latitude) column
ALTER TABLE `duan` 
ADD COLUMN `ViDo` DECIMAL(10, 7) DEFAULT NULL COMMENT 'Vĩ độ (Latitude) - Geocoded từ địa chỉ' 
AFTER `DiaChi`;

-- Add KinhDo (Longitude) column
ALTER TABLE `duan` 
ADD COLUMN `KinhDo` DECIMAL(10, 7) DEFAULT NULL COMMENT 'Kinh độ (Longitude) - Geocoded từ địa chỉ' 
AFTER `ViDo`;

-- Add index for geospatial queries (optional - for future "find nearby" features)
-- CREATE INDEX idx_duan_coordinates ON duan(ViDo, KinhDo);

-- Verify changes
DESC duan;

-- Expected output:
-- | Field              | Type                                           | Null | Key | Default           | Extra                         |
-- | DuAnID             | int(11)                                        | NO   | PRI | NULL              | auto_increment                |
-- | TenDuAn            | varchar(255)                                   | NO   |     | NULL              |                               |
-- | DiaChi             | varchar(255)                                   | YES  |     | NULL              |                               |
-- | ViDo               | decimal(10,7)                                  | YES  |     | NULL              |                               | <-- NEW
-- | KinhDo             | decimal(10,7)                                  | YES  |     | NULL              |                               | <-- NEW
-- | ChuDuAnID          | int(11)                                        | YES  | MUL | NULL              |                               |
-- | ...

-- Test query: Find projects with coordinates
SELECT DuAnID, TenDuAn, DiaChi, ViDo, KinhDo 
FROM duan 
WHERE ViDo IS NOT NULL AND KinhDo IS NOT NULL
LIMIT 5;
