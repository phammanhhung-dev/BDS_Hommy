#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/db');

const createTables = [
  `CREATE TABLE IF NOT EXISTS new_provinces (
    ProvinceID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ProvinceCode VARCHAR(20) NOT NULL,
    ProvinceName VARCHAR(255) NOT NULL,
    ProvinceType VARCHAR(50) DEFAULT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ProvinceID),
    UNIQUE KEY uq_new_provinces_code (ProvinceCode),
    UNIQUE KEY uq_new_provinces_name (ProvinceName)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS new_districts (
    DistrictID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ProvinceID INT UNSIGNED NOT NULL,
    DistrictCode VARCHAR(20) NOT NULL,
    DistrictName VARCHAR(255) NOT NULL,
    DistrictType VARCHAR(50) DEFAULT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (DistrictID),
    UNIQUE KEY uq_new_districts_code (DistrictCode),
    KEY idx_new_districts_province_id (ProvinceID),
    CONSTRAINT fk_new_districts_new_provinces
      FOREIGN KEY (ProvinceID)
      REFERENCES new_provinces (ProvinceID)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS new_communes (
    CommuneID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ProvinceID INT UNSIGNED NOT NULL,
    DistrictID INT UNSIGNED DEFAULT NULL,
    CommuneCode VARCHAR(20) NOT NULL,
    CommuneName VARCHAR(255) NOT NULL,
    CommuneType VARCHAR(50) DEFAULT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (CommuneID),
    UNIQUE KEY uq_new_communes_code (CommuneCode),
    KEY idx_new_communes_province_id (ProvinceID),
    KEY idx_new_communes_district_id (DistrictID),
    CONSTRAINT fk_new_communes_new_provinces
      FOREIGN KEY (ProvinceID)
      REFERENCES new_provinces (ProvinceID)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    CONSTRAINT fk_new_communes_new_districts
      FOREIGN KEY (DistrictID)
      REFERENCES new_districts (DistrictID)
      ON UPDATE CASCADE
      ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS address_mappings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    old_ward_code VARCHAR(50) DEFAULT NULL,
    old_ward_name VARCHAR(255) DEFAULT NULL,
    old_district_code VARCHAR(50) DEFAULT NULL,
    old_district_name VARCHAR(255) DEFAULT NULL,
    new_ward_code VARCHAR(50) DEFAULT NULL,
    new_ward_name VARCHAR(255) DEFAULT NULL,
    new_district_code VARCHAR(50) DEFAULT NULL,
    new_district_name VARCHAR(255) DEFAULT NULL,
    province_code VARCHAR(20) DEFAULT NULL,
    province_name VARCHAR(255) DEFAULT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_address_mappings_old_ward_code (old_ward_code),
    UNIQUE KEY uq_address_mappings_new_ward_code (new_ward_code),
    KEY idx_address_mappings_old_district_code (old_district_code),
    KEY idx_address_mappings_new_district_code (new_district_code),
    KEY idx_address_mappings_province_code (province_code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS address_crosswalk (
    id BIGINT NOT NULL AUTO_INCREMENT,
    old_province_id INT DEFAULT NULL,
    legacy_district_id INT DEFAULT NULL,
    legacy_ward_id INT DEFAULT NULL,
    new_province_id INT DEFAULT NULL,
    new_ward_id INT DEFAULT NULL,
    street_name VARCHAR(255) DEFAULT NULL,
    confidence ENUM('exact','manual','fallback') NOT NULL DEFAULT 'exact',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_new_lookup (new_province_id, new_ward_id),
    KEY idx_old_lookup (old_province_id, legacy_district_id, legacy_ward_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  `CREATE TABLE IF NOT EXISTS address_crosswalk_pending (
    id BIGINT NOT NULL AUTO_INCREMENT,
    old_province_id INT DEFAULT NULL,
    legacy_district_id INT DEFAULT NULL,
    legacy_ward_id INT DEFAULT NULL,
    new_province_id INT DEFAULT NULL,
    new_ward_id INT DEFAULT NULL,
    street_name VARCHAR(255) DEFAULT NULL,
    confidence ENUM('exact','manual','fallback') NOT NULL DEFAULT 'exact',
    reporter_note TEXT DEFAULT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pending_new_lookup (new_province_id, new_ward_id),
    KEY idx_pending_old_lookup (old_province_id, legacy_district_id, legacy_ward_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
];

async function runMigration() {
  console.log('📦 Bắt đầu chạy migration bảng địa giới và mapping...');

  for (const sql of createTables) {
    await db.query(sql);
  }

  console.log('✅ Migration hoàn tất. Bảng mới đã được đảm bảo tồn tại.');
}

(async () => {
  try {
    await runMigration();
  } catch (err) {
    console.error('❌ Lỗi khi chạy migrate_db.js:', err.message || err);
    process.exitCode = 1;
  } finally {
    if (typeof db.end === 'function') {
      await db.end();
    }
  }
})();
