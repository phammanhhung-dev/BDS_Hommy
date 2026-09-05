#!/usr/bin/env node

const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load môi trường từ server/.env để dùng chung với cấu hình hiện có của dự án
dotenv.config({ path: path.resolve(__dirname, '..', 'server', '.env') });

const API_URL = 'https://provinces.open-api.vn/api/?depth=3';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'realestate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

async function fetchAdminData() {
  const response = await fetch(API_URL, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch API thất bại: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Dữ liệu trả về không phải mảng JSON');
  }

  return data;
}

function buildSeedData(rawProvinces) {
  const provincesData = [];
  const communeRows = [];

  for (const province of rawProvinces) {
    const provinceCode = normalizeText(province.code);
    const provinceName = normalizeText(province.name);
    const provinceType = normalizeText(province.division_type || province.type || (provinceName.startsWith('Thành phố') ? 'Thành phố' : 'Tỉnh'));

    if (!provinceCode || !provinceName) {
      continue;
    }

    provincesData.push([provinceCode, provinceName, provinceType]);

    const districts = Array.isArray(province.districts) ? province.districts : [];
    for (const district of districts) {
      const districtName = normalizeText(district.name);
      const wards = Array.isArray(district.wards) ? district.wards : [];
      for (const ward of wards) {
        const communeCode = normalizeText(ward.code);
        const communeName = normalizeText(ward.name);
        const communeType = normalizeText(ward.division_type || ward.type || '');

        if (!communeCode || !communeName) continue;
        // Do NOT append district name to commune name — the authoritative dataset uses commune names as-is.
        communeRows.push({
          provinceCode,
          communeCode,
          communeName,
          communeType
        });
      }
    }
  }

  return { provincesData, communeRows };
}

async function seedDatabase(provincesData, communeRows) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE new_communes');
    await connection.query('TRUNCATE TABLE new_provinces');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    if (provincesData.length > 0) {
      await connection.query(
        'INSERT INTO new_provinces (ProvinceCode, ProvinceName, ProvinceType) VALUES ?;', 
        [provincesData]
      );
    }

    const provinceCodes = provincesData.map(([code]) => code);
    const [provinceRows] = await connection.query(
      'SELECT ProvinceID, ProvinceCode FROM new_provinces WHERE ProvinceCode IN (?);',
      [provinceCodes]
    );

    const provinceIdByCode = new Map(provinceRows.map((row) => [row.ProvinceCode, row.ProvinceID]));
    const communesData = [];

    for (const commune of communeRows) {
      const provinceId = provinceIdByCode.get(commune.provinceCode);
      if (!provinceId) continue;
      communesData.push([provinceId, commune.communeCode, commune.communeName, commune.communeType]);
    }

    if (communesData.length > 0) {
      await connection.query(
        'INSERT INTO new_communes (ProvinceID, CommuneCode, CommuneName, CommuneType) VALUES ?;', 
        [communesData]
      );
    }

    await connection.commit();

    return {
      provincesInserted: provincesData.length,
      communesInserted: communesData.length
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  try {
    console.log('📡 Bắt đầu fetch dữ liệu hành chính từ API...', API_URL);

    const rawData = await fetchAdminData();
    const { provincesData, communeRows } = buildSeedData(rawData);

    if (provincesData.length === 0) {
      throw new Error('Không tìm thấy dữ liệu tỉnh/thành hợp lệ từ API');
    }

    // Heuristic: detect numeric-only or 'Phường 1/2/3' style ward names which indicate
    // the upstream source may not be updated to the 2026 merged names.
    const numericWardPattern = /\b(Phuong|Phường|Xa|Xã)\s*\d+\b|^\d+$/i;
    const hasNumericWards = communeRows.some(c => numericWardPattern.test(c.communeName));
    if (hasNumericWards) {
      console.error('❌ CẢNH BÁO: Dữ liệu hành chính trả về chứa các phường đánh số (ví dụ "Phường 1").');
      console.error('Hệ thống yêu cầu bộ dữ liệu đã sáp nhập (2026) không chứa các phường đánh số.');
      console.error('Vui lòng dùng bộ seed chuẩn 2026 (server/scripts/seed-locations-2026.js) hoặc cập nhật nguồn dữ liệu trước khi tiếp tục.');
      process.exitCode = 2;
      await pool.end();
      return;
    }

    const result = await seedDatabase(provincesData, communeRows);

    console.log('✅ Hoàn thành seed dữ liệu địa giới mới');
    console.log('   - Tỉnh/Thành phố:', result.provincesInserted);
    console.log('   - Phường/Xã:', result.communesInserted);
  } catch (error) {
    console.error('❌ Lỗi khi chạy fetch-and-seed-locations:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
