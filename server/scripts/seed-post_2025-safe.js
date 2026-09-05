#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'post_2025.json');
const BACKUP_DIR = path.resolve(__dirname, '..', 'data', 'backups');

const COMMUNE_TYPE_MAP = {
  xa: 'Xã',
  phuong: 'Phường',
  phường: 'Phường',
  xã: 'Xã',
  thitran: 'Thị trấn',
  'thị trấn': 'Thị trấn',
  thi_tran: 'Thị trấn',
  huyen: 'Huyện',
  quan: 'Quận'
};

function printUsage() {
  console.log(`Usage: node seed-post_2025-safe.js [--ignore-districts-check] [--no-backup]\n`);
  console.log('  --ignore-districts-check   Proceed with seeding provinces/communes even if new_districts is not empty.');
  console.log('  --no-backup                Skip JSON backup export before destructive operations.');
  console.log('  --help                     Show this help message.');
}

function normalizeProvinceName(pathWithType) {
  const parts = String(pathWithType)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(pathWithType).trim();
}

function deriveProvinceType(provinceName) {
  const normalized = String(provinceName).toLowerCase();
  if (normalized.includes('thành phố') || normalized.includes('thủ đô')) {
    return 'Thành phố';
  }
  return 'Tỉnh';
}

function normalizeCommuneType(rawType) {
  if (!rawType) return '';
  const key = String(rawType).trim().toLowerCase();
  if (COMMUNE_TYPE_MAP[key]) {
    return COMMUNE_TYPE_MAP[key];
  }
  return key
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function validateNumericWardName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  const genericPattern = /^(Phuong|Phường|Xa|Xã|Thi tran|Thị trấn)\s*\d+\s*$/i;
  const numericOnlyPattern = /^\d+$/;
  return genericPattern.test(trimmed) || numericOnlyPattern.test(trimmed);
}

function parseArgs(argv) {
  return argv.reduce((opts, arg) => {
    if (arg === '--ignore-districts-check') opts.ignoreDistrictsCheck = true;
    if (arg === '--no-backup') opts.noBackup = true;
    if (arg === '--help' || arg === '-h') opts.help = true;
    return opts;
  }, { ignoreDistrictsCheck: false, noBackup: false, help: false });
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

async function dumpTable(connection, tableName, outputPath) {
  const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
  fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Backed up ${tableName} -> ${outputPath}`);
}

async function countRows(connection, tableName) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  return Number(rows[0].count || 0);
}

function loadLocalData() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Missing data file: ${DATA_FILE}`);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object') {
    throw new Error('Expected post_2025.json to contain an object keyed by ward code.');
  }

  return Object.values(data);
}

function buildProvinceAndCommuneRows(entries) {
  const provinceGroups = new Map();
  const communes = [];

  for (const entry of entries) {
    const communeName = String(entry.name_with_type || '').trim();
    if (!communeName) {
      throw new Error(`Missing name_with_type on entry ${JSON.stringify(entry)}`);
    }
    if (validateNumericWardName(communeName)) {
      throw new Error(`Numeric ward name rejected: ${communeName}`);
    }

    const parentCode = String(entry.parent_code || '').trim();
    if (!parentCode) {
      throw new Error(`Missing parent_code for commune ${communeName}`);
    }

    const provinceName = normalizeProvinceName(String(entry.path_with_type || ''));
    if (!provinceName) {
      throw new Error(`Missing path_with_type for commune ${communeName}`);
    }

    const communeType = normalizeCommuneType(entry.type) || 'Phường';

    if (!provinceGroups.has(parentCode)) {
      provinceGroups.set(parentCode, {
        ProvinceCode: parentCode.padStart(2, '0'),
        ProvinceName: provinceName,
        ProvinceType: deriveProvinceType(provinceName),
        CommuneCount: 0
      });
    }
    provinceGroups.get(parentCode).CommuneCount += 1;

    communes.push({
      CommuneCode: String(entry.code || entry.ward_code || entry.CommuneCode || '').trim() || String(entry.name_with_type).replace(/\s+/g, '-'),
      CommuneName: communeName,
      CommuneType: communeType,
      ProvinceCode: parentCode.padStart(2, '0')
    });
  }

  const provinces = Array.from(provinceGroups.values());
  provinces.sort((a, b) => a.ProvinceCode.localeCompare(b.ProvinceCode, 'en'));

  if (provinces.length === 0) {
    throw new Error('No provinces derived from post_2025 data.');
  }

  return { provinces, communes };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  console.log('Safe POST_2025 seed script starting...');
  const entries = loadLocalData();
  console.log(`Loaded ${entries.length} ward entries from ${DATA_FILE}`);

  const { provinces, communes } = buildProvinceAndCommuneRows(entries);
  console.log(`Derived ${provinces.length} provinces and ${communes.length} communes from POST_2025 data.`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    const districtCount = await countRows(connection, 'new_districts');
    console.log(`Live table counts: new_districts=${districtCount}`);

    if (districtCount > 0 && !options.ignoreDistrictsCheck) {
      throw new Error(
        `new_districts is not empty (${districtCount} rows). ` +
        'Seeding provinces/communes while new_districts exists requires confirmation. ' +
        'Run this script with --ignore-districts-check to proceed.'
      );
    }

    if (!options.noBackup) {
      ensureBackupDir();
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      await dumpTable(connection, 'new_provinces', path.join(BACKUP_DIR, `backup_new_provinces_${now}.json`));
      await dumpTable(connection, 'new_communes', path.join(BACKUP_DIR, `backup_new_communes_${now}.json`));
      if (districtCount > 0) {
        await dumpTable(connection, 'new_districts', path.join(BACKUP_DIR, `backup_new_districts_${now}.json`));
      }
    } else {
      console.log('Skipping backup export because --no-backup was provided.');
    }

    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Truncating new_communes and new_provinces...');
    await connection.query('TRUNCATE TABLE new_communes');
    await connection.query('TRUNCATE TABLE new_provinces');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    if (provinces.length > 0) {
      const provinceRows = provinces.map((province) => [province.ProvinceCode, province.ProvinceName, province.ProvinceType]);
      await connection.query(
        'INSERT INTO new_provinces (ProvinceCode, ProvinceName, ProvinceType) VALUES ?;',
        [provinceRows]
      );
    }

    const [insertedProvinceRows] = await connection.query(
      'SELECT ProvinceID, ProvinceCode FROM new_provinces WHERE ProvinceCode IN (?);',
      [provinces.map((province) => province.ProvinceCode)]
    );
    const provinceIdByCode = new Map(insertedProvinceRows.map((row) => [row.ProvinceCode, row.ProvinceID]));

    const communeRows = communes.map((commune) => [
      provinceIdByCode.get(commune.ProvinceCode),
      commune.CommuneCode,
      commune.CommuneName,
      commune.CommuneType
    ]).filter(([provinceId]) => provinceId != null);

    if (communeRows.length > 0) {
      await connection.query(
        'INSERT INTO new_communes (ProvinceID, CommuneCode, CommuneName, CommuneType) VALUES ?;',
        [communeRows]
      );
    }

    await connection.commit();
    console.log(`Seed completed. Inserted ${provinces.length} provinces and ${communeRows.length} communes.`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    try {
      await connection.rollback();
      console.log('Rolled back transaction.');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
