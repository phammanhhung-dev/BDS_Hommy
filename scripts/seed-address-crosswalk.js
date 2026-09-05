#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const BATCH_SIZE = 200;
const MAX_CONCURRENCY = 5;
const MAX_RETRIES = 3;
const DEFAULT_API_URL = 'http://localhost:5000';
const rawBaseUrl = process.env.ADDRESS_API_URL || process.env.ADDRESS_API_BASE_URL || '';
if (!rawBaseUrl) {
  console.error('❌ ADDRESS_API_URL is not set. Export ADDRESS_API_URL=http://localhost:5000 or the real external conversion endpoint before running this script.');
  process.exit(1);
}

const BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'unmapped-wards.csv');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const ensureTables = async (connection) => {
  const createAddressCrosswalk = `
    CREATE TABLE IF NOT EXISTS address_crosswalk (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createAddressCrosswalkPending = `
    CREATE TABLE IF NOT EXISTS address_crosswalk_pending (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.query(createAddressCrosswalk);
  await connection.query(createAddressCrosswalkPending);
};

const getLegacyWardTable = async (connection) => {
  const candidateTables = ['wards', 'legacy_wards', 'old_wards', 'wards_legacy'];
  for (const tableName of candidateTables) {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1',
      [tableName]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return tableName;
    }
  }
  return null;
};

const fetchLegacyWards = async (connection) => {
  const tableName = await getLegacyWardTable(connection);
  if (!tableName) {
    throw new Error('❌ Legacy ward table not found. There is no real legacy wards table in this database. Seed cannot continue without a source table.');
  }

  const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
  return Array.isArray(rows) ? rows : [];
};

const callConversionApi = async (payload, attempt = 1) => {
  const url = `${BASE_URL}/api/address/convert`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.status === 429 || response.status >= 500) {
    if (attempt < MAX_RETRIES) {
      const backoffMs = 500 * (2 ** (attempt - 1));
      await delay(backoffMs);
      return callConversionApi(payload, attempt + 1);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${response.statusText})`);
  }

  const data = await response.json().catch(() => ({}));
  const newProvinceId = normalizeNumber(data.newProvinceId ?? data.new_province_id ?? data.newProvinceID ?? 0);
  const newWardId = normalizeNumber(data.newWardId ?? data.new_ward_id ?? data.newWardID ?? 0);

  if (!newProvinceId || !newWardId) {
    throw new Error('Missing mapping result');
  }

  return { newProvinceId, newWardId };
};

const writeUnmappedCsvHeader = () => {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const header = ['old_province_id', 'legacy_district_id', 'legacy_ward_id', 'reason'].join(',');
  fs.writeFileSync(LOG_FILE, header + '\n', 'utf8');
};

const appendUnmappedRow = (row, reason) => {
  const line = [
    row.old_province_id ?? '',
    row.legacy_district_id ?? '',
    row.legacy_ward_id ?? '',
    reason
  ]
    .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
    .join(',');

  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
};

const upsertCrosswalk = async (connection, row) => {
  const sql = `
    INSERT INTO address_crosswalk (
      old_province_id,
      legacy_district_id,
      legacy_ward_id,
      new_province_id,
      new_ward_id,
      street_name,
      confidence,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      old_province_id = VALUES(old_province_id),
      legacy_district_id = VALUES(legacy_district_id),
      legacy_ward_id = VALUES(legacy_ward_id),
      new_province_id = VALUES(new_province_id),
      new_ward_id = VALUES(new_ward_id),
      street_name = VALUES(street_name),
      confidence = VALUES(confidence),
      updated_at = NOW();
  `;

  await connection.execute(sql, [
    row.old_province_id ?? null,
    row.legacy_district_id ?? null,
    row.legacy_ward_id ?? null,
    row.new_province_id ?? null,
    row.new_ward_id ?? null,
    row.street_name ?? null,
    row.confidence || 'exact'
  ]);
};

const runWithConcurrency = async (items, worker, limit = MAX_CONCURRENCY) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const results = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate',
    multipleStatements: false
  });

  try {
    await ensureTables(connection);
    writeUnmappedCsvHeader();

    const legacyWards = await fetchLegacyWards(connection);

    if (!legacyWards.length) {
      console.log('✅ Không có dữ liệu legacy wards để seed.');
      return;
    }

    const summary = { total: 0, exact: 0, fallback: 0, errors: 0 };

    for (let i = 0; i < legacyWards.length; i += BATCH_SIZE) {
      const batch = legacyWards.slice(i, i + BATCH_SIZE);
      const results = await runWithConcurrency(batch, async (row) => {
        const oldProvinceId = normalizeNumber(row.old_province_id ?? row.ProvinceID ?? row.province_id ?? row.provinceId ?? row.ProvinceId ?? 0);
        const legacyDistrictId = normalizeNumber(row.legacy_district_id ?? row.DistrictID ?? row.district_id ?? row.districtId ?? row.DistrictId ?? 0);
        const legacyWardId = normalizeNumber(row.legacy_ward_id ?? row.WardID ?? row.ward_id ?? row.wardId ?? row.WardId ?? 0);
        const streetName = normalizeText(row.street_name ?? row.StreetName ?? row.streetName ?? '');

        if (!oldProvinceId || !legacyDistrictId || !legacyWardId) {
          summary.errors += 1;
          appendUnmappedRow({
            old_province_id: oldProvinceId,
            legacy_district_id: legacyDistrictId,
            legacy_ward_id: legacyWardId
          }, 'missing_required_ids');
          return { status: 'fallback' };
        }

        const payload = {
          provinceId: oldProvinceId,
          legacyDistrictId,
          legacyWardId
        };

        try {
          const mapped = await callConversionApi(payload, 1);
          const crosswalkRow = {
            old_province_id: oldProvinceId,
            legacy_district_id: legacyDistrictId,
            legacy_ward_id: legacyWardId,
            new_province_id: mapped.newProvinceId,
            new_ward_id: mapped.newWardId,
            street_name: streetName || null,
            confidence: 'exact'
          };

          await upsertCrosswalk(connection, crosswalkRow);
          summary.total += 1;
          summary.exact += 1;
          return { status: 'exact' };
        } catch (error) {
          summary.total += 1;
          summary.fallback += 1;
          summary.errors += 1;
          appendUnmappedRow({
            old_province_id: oldProvinceId,
            legacy_district_id: legacyDistrictId,
            legacy_ward_id: legacyWardId
          }, error.message || 'conversion_failed');

          await upsertCrosswalk(connection, {
            old_province_id: oldProvinceId,
            legacy_district_id: legacyDistrictId,
            legacy_ward_id: legacyWardId,
            new_province_id: null,
            new_ward_id: null,
            street_name: streetName || null,
            confidence: 'fallback'
          });
          return { status: 'fallback' };
        }
      }, MAX_CONCURRENCY);

      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${results.length} rows.`);
      if (i + BATCH_SIZE < legacyWards.length) {
        await delay(100);
      }
    }

    console.log('✅ Seed address crosswalk hoàn tất');
    console.log(`Tổng: ${summary.total} | exact: ${summary.exact} | fallback: ${summary.fallback} | errors: ${summary.errors}`);
  } catch (error) {
    console.error('❌ Lỗi khi seed address crosswalk:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
})();
