#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const fs = require('fs');
const mysql = require('mysql2/promise');

const DEFAULT_DATA_PATHS = [
  path.resolve(__dirname, 'address-mappings.json'),
  path.resolve(__dirname, '..', 'data', 'address-mappings.json'),
  path.resolve(process.cwd(), 'data', 'address-mappings.json')
];

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const loadMappings = () => {
  let mappingPath = null;
  for (const candidate of DEFAULT_DATA_PATHS) {
    if (fs.existsSync(candidate)) {
      mappingPath = candidate;
      break;
    }
  }

  if (!mappingPath) {
    throw new Error(`Không tìm thấy file mapping địa chỉ tại: ${DEFAULT_DATA_PATHS.join(', ')}`);
  }

  const raw = fs.readFileSync(mappingPath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Dữ liệu mapping phải là một mảng JSON.');
  }

  return data.map((item, index) => ({
    old_ward_code: normalizeText(item.old_ward_code || item.oldWardCode || item.old_ward_code || ''),
    old_ward_name: normalizeText(item.old_ward_name || item.oldWardName || item.old_ward_name || ''),
    old_district_code: normalizeText(item.old_district_code || item.oldDistrictCode || item.old_district_code || ''),
    old_district_name: normalizeText(item.old_district_name || item.oldDistrictName || item.old_district_name || ''),
    new_ward_code: normalizeText(item.new_ward_code || item.newWardCode || item.new_ward_code || ''),
    new_ward_name: normalizeText(item.new_ward_name || item.newWardName || item.new_ward_name || ''),
    new_district_code: normalizeText(item.new_district_code || item.newDistrictCode || item.new_district_code || ''),
    new_district_name: normalizeText(item.new_district_name || item.newDistrictName || item.new_district_name || ''),
    province_code: normalizeText(item.province_code || item.provinceCode || item.province_code || ''),
    province_name: normalizeText(item.province_name || item.provinceName || item.province_name || ''),
    source_index: index
  }));
};

const seedMappings = async (connection, mappings) => {
  if (mappings.length === 0) {
    console.log('⚠️ Không có bản ghi mapping để ghi vào database.');
    return;
  }

  const rows = mappings.map((mapping) => [
    mapping.old_ward_code,
    mapping.old_ward_name,
    mapping.old_district_code,
    mapping.old_district_name,
    mapping.new_ward_code,
    mapping.new_ward_name,
    mapping.new_district_code,
    mapping.new_district_name,
    mapping.province_code,
    mapping.province_name
  ]);

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE address_mappings');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const batchSize = 500;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    await connection.query(
      `INSERT INTO address_mappings (
         old_ward_code,
         old_ward_name,
         old_district_code,
         old_district_name,
         new_ward_code,
         new_ward_name,
         new_district_code,
         new_district_name,
         province_code,
         province_name
       ) VALUES ?;`,
      [batch]
    );
  }
};

(async () => {
  try {
    const mappings = loadMappings();
    console.log(`📥 Đã đọc ${mappings.length} bản ghi mapping từ JSON.`);

    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'realestate',
      waitForConnections: true,
      connectionLimit: 5
    });

    const connection = await pool.getConnection();
    try {
      await seedMappings(connection, mappings);
      console.log('✅ Seed mappings vào bảng address_mappings hoàn tất.');
    } finally {
      connection.release();
      await pool.end();
    }
  } catch (err) {
    console.error('❌ Lỗi khi chạy seed_mappings.js:', err.message || err);
    process.exitCode = 1;
  }
})();
