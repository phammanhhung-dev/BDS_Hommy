#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2/promise');

const DEFAULT_SOURCE_URL = 'https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/dvhcvn.json';
const DEFAULT_LOCAL_PATHS = [
  path.join(process.cwd(), 'data', 'dvhcvn.json'),
  path.join(process.cwd(), '..', 'data', 'dvhcvn.json'),
  path.join(__dirname, '..', 'data', 'dvhcvn.json')
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
    replace: false,
    source: null,
    verbose: false
  };

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg.startsWith('--source=')) args.source = arg.split('=')[1];
    else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/import-khuvuc-dvhcvn.js [options]\n\nOptions:\n  --dry-run          Chỉ đọc dữ liệu và in thống kê mà không ghi DB\n  --replace          Xóa toàn bộ dữ liệu cũ trong bảng khuvuc trước khi import\n  --source=/path     Đọc dữ liệu từ file JSON cục bộ thay vì fetch từ GitHub\n  --verbose          In chi tiết từng cấp dữ liệu\n  --help             Hiển thị trợ giúp`);
}

async function loadData(sourcePath) {
  if (sourcePath) {
    const absolutePath = path.resolve(sourcePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File không tồn tại: ${absolutePath}`);
    }
    const raw = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(raw);
  }

  for (const candidate of DEFAULT_LOCAL_PATHS) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8');
      return JSON.parse(raw);
    }
  }

  try {
    const response = await axios.get(DEFAULT_SOURCE_URL, { timeout: 20000, responseType: 'json' });
    return response.data;
  } catch (error) {
    throw new Error(`Không thể tải dữ liệu từ ${DEFAULT_SOURCE_URL}: ${error.message}`);
  }
}

function extractProvinces(rawData) {
  if (Array.isArray(rawData)) {
    return rawData;
  }

  if (rawData && Array.isArray(rawData.data)) {
    return rawData.data;
  }

  if (rawData && Array.isArray(rawData.level1s)) {
    return rawData.level1s;
  }

  if (rawData && Array.isArray(rawData.provinces)) {
    return rawData.provinces;
  }

  throw new Error('Cấu trúc dữ liệu không khớp. Không tìm thấy danh sách tỉnh/thành.');
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function getExternalId(item, fieldName) {
  const value = item?.[fieldName];
  if (value === undefined || value === null || value === '') return null;
  return Number(value);
}

async function importData({ connection, provinces, options }) {
  const existingRows = await connection.query('SELECT KhuVucID FROM khuvuc');
  const existingIds = new Set(existingRows[0].map((row) => Number(row.KhuVucID)));
  let nextId = Math.max(0, ...Array.from(existingIds)) + 1;

  const assignedIds = new Map();
  let provinceCount = 0;
  let districtCount = 0;
  let wardCount = 0;

  if (options.replace) {
    console.log('⚠️  Đang xóa dữ liệu cũ trong bảng khuvuc...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM khuvuc');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    existingIds.clear();
    nextId = 1;
  }

  for (const province of provinces) {
    const provinceName = normalizeName(province?.name);
    if (!provinceName) continue;

    const provinceExternalId = getExternalId(province, 'level1_id');
    const provinceId = provinceExternalId && !existingIds.has(provinceExternalId)
      ? provinceExternalId
      : nextId++;

    if (!assignedIds.has(`province:${provinceExternalId || provinceName}`)) {
      assignedIds.set(`province:${provinceExternalId || provinceName}`, provinceId);
    }

    if (options.verbose) {
      console.log(`- Tỉnh/thành: ${provinceName} -> ID ${provinceId}`);
    }

    if (!options.dryRun) {
      await connection.execute(
        'INSERT INTO khuvuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
        [provinceId, provinceName, null, null, null]
      );
    }

    existingIds.add(provinceId);
    provinceCount += 1;

    const districts = Array.isArray(province?.level2s) ? province.level2s : [];
    for (const district of districts) {
      const districtName = normalizeName(district?.name);
      if (!districtName) continue;

      const districtExternalId = getExternalId(district, 'level2_id');
      const districtId = districtExternalId && !existingIds.has(districtExternalId)
        ? districtExternalId
        : nextId++;

      if (options.verbose) {
        console.log(`  - Quận/huyện: ${districtName} -> ID ${districtId} (cha ${provinceId})`);
      }

      if (!options.dryRun) {
        await connection.execute(
          'INSERT INTO khuvuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
          [districtId, districtName, provinceId, null, null]
        );
      }

      existingIds.add(districtId);
      districtCount += 1;

      const wards = Array.isArray(district?.level3s) ? district.level3s : [];
      for (const ward of wards) {
        const wardName = normalizeName(ward?.name);
        if (!wardName) continue;

        const wardExternalId = getExternalId(ward, 'level3_id');
        const wardId = wardExternalId && !existingIds.has(wardExternalId)
          ? wardExternalId
          : nextId++;

        if (options.verbose) {
          console.log(`    - Xã/phường: ${wardName} -> ID ${wardId} (cha ${districtId})`);
        }

        if (!options.dryRun) {
          await connection.execute(
            'INSERT INTO khuvuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
            [wardId, wardName, districtId, null, null]
          );
        }

        existingIds.add(wardId);
        wardCount += 1;
      }
    }
  }

  return { provinceCount, districtCount, wardCount };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  console.log('📦 Đang chuẩn bị dữ liệu hành chính từ dvhcvn...');

  try {
    const rawData = await loadData(options.source);
    const provinces = extractProvinces(rawData);

    console.log(`✅ Đã đọc ${provinces.length} tỉnh/thành phố từ nguồn dữ liệu`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'realestate'
    });

    try {
      const stats = await importData({ connection, provinces, options });
      if (options.dryRun) {
        console.log('🧪 Dry run hoàn tất, không ghi dữ liệu vào DB.');
      } else {
        console.log('✅ Import khuvuc hoàn tất.');
      }
      console.log(`📊 Thống kê: ${stats.provinceCount} tỉnh/thành, ${stats.districtCount} quận/huyện, ${stats.wardCount} xã/phường`);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Lỗi khi import khu vực:', error.message);
    process.exitCode = 1;
  }
}

main();
