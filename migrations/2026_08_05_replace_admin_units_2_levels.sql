-- Migration: Replace old 3-level administrative units with new 2-level model
-- WARNING: This script drops old location catalog tables. Run in a controlled environment.

SET FOREIGN_KEY_CHECKS = 0;

-- Drop old catalog tables (if they exist)
DROP TABLE IF EXISTS wards;
DROP TABLE IF EXISTS districts;
DROP TABLE IF EXISTS provinces;
DROP TABLE IF EXISTS khuvuc;

SET FOREIGN_KEY_CHECKS = 1;

-- Create new provinces table (34 province/city records in production data)
CREATE TABLE IF NOT EXISTS new_provinces (
  ProvinceID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ProvinceCode VARCHAR(20) NOT NULL,
  ProvinceName VARCHAR(255) NOT NULL,
  ProvinceType VARCHAR(50) DEFAULT NULL,
  CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ProvinceID),
  UNIQUE KEY uq_new_provinces_code (ProvinceCode),
  UNIQUE KEY uq_new_provinces_name (ProvinceName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create new communes table (3,321 commune/ward records in production data)
CREATE TABLE IF NOT EXISTS new_communes (
  CommuneID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ProvinceID INT UNSIGNED NOT NULL,
  CommuneCode VARCHAR(20) NOT NULL,
  CommuneName VARCHAR(255) NOT NULL,
  CommuneType VARCHAR(50) DEFAULT NULL,
  CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (CommuneID),
  UNIQUE KEY uq_new_communes_code (CommuneCode),
  KEY idx_new_communes_province_id (ProvinceID),
  CONSTRAINT fk_new_communes_new_provinces
    FOREIGN KEY (ProvinceID)
    REFERENCES new_provinces (ProvinceID)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
