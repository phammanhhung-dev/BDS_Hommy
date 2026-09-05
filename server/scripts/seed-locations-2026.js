#!/usr/bin/env node

const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SAMPLE_FILE = path.resolve(__dirname, 'locations-2026-sample.json');

async function main() {
  if (!fs.existsSync(SAMPLE_FILE)) {
    console.error('Không tìm thấy file mẫu:', SAMPLE_FILE);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8'));

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
    await connection.beginTransaction();

    // Truncate target tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE new_communes');
    await connection.query('TRUNCATE TABLE new_provinces');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Insert provinces
    const provinces = raw.map(p => [p.ProvinceCode, p.ProvinceName, p.ProvinceType || 'Tỉnh']);
    if (provinces.length > 0) {
      await connection.query('INSERT INTO new_provinces (ProvinceCode, ProvinceName, ProvinceType) VALUES ?;', [provinces]);
    }

    const [rows] = await connection.query('SELECT ProvinceID, ProvinceCode FROM new_provinces WHERE ProvinceCode IN (?);', [raw.map(p => p.ProvinceCode)]);
    const provinceIdByCode = new Map(rows.map(r => [r.ProvinceCode, r.ProvinceID]));

    const communes = [];
    for (const p of raw) {
      const provinceId = provinceIdByCode.get(p.ProvinceCode);
      if (!provinceId) continue;
      for (const c of (p.Communes || [])) {
        // Basic validation: reject numeric-only ward names
        if (/\b(Phuong|Phường|Xa|Xã)\s*\d+\b|^\d+$/i.test(c.CommuneName)) {
          throw new Error(`Tìm thấy tên phường đánh số trong dữ liệu mẫu: ${c.CommuneName}`);
        }
        communes.push([provinceId, c.CommuneCode, c.CommuneName, c.CommuneType || 'Phường']);
      }
    }

    if (communes.length > 0) {
      await connection.query('INSERT INTO new_communes (ProvinceID, CommuneCode, CommuneName, CommuneType) VALUES ?;', [communes]);
    }

    await connection.commit();
    console.log('✅ Seed dữ liệu địa giới 2026 hoàn tất. Tỉnh:', provinces.length, 'Phường/Xã:', communes.length);
  } catch (err) {
    await connection.rollback();
    console.error('❌ Lỗi khi seed dữ liệu 2026:', err.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
