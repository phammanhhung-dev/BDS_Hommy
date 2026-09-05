const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const DEFAULT_SOURCE_URL = 'https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/dvhcvn.json';
const DEFAULT_LOCAL_PATHS = [
  path.join(process.cwd(), 'data', 'dvhcvn.json'),
  path.join(process.cwd(), '..', 'data', 'dvhcvn.json'),
  path.join(__dirname, '..', 'data', 'dvhcvn.json')
];

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function getExternalId(item, fieldName) {
  const value = item?.[fieldName];
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function extractProvinces(rawData) {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && Array.isArray(rawData.data)) return rawData.data;
  if (rawData && Array.isArray(rawData.level1s)) return rawData.level1s;
  if (rawData && Array.isArray(rawData.provinces)) return rawData.provinces;
  throw new Error('Cấu trúc dữ liệu không khớp. Không tìm thấy danh sách tỉnh/thành.');
}

async function loadSourceData(sourcePath) {
  if (sourcePath) {
    const absolutePath = path.resolve(sourcePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File không tồn tại: ${absolutePath}`);
    }
    const raw = await fs.promises.readFile(absolutePath, 'utf8');
    return JSON.parse(raw);
  }

  for (const candidate of DEFAULT_LOCAL_PATHS) {
    if (fs.existsSync(candidate)) {
      const raw = await fs.promises.readFile(candidate, 'utf8');
      return JSON.parse(raw);
    }
  }

  const response = await fetch(DEFAULT_SOURCE_URL, { method: 'GET', headers: { 'Accept': 'application/json' } });
  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu từ ${DEFAULT_SOURCE_URL}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function importKhuVucData({ provinces, replace = false, verbose = false }) {
  const connection = await db.getConnection();
  try {
    if (replace) {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DELETE FROM KhuVuc');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    const [existingRows] = await connection.query('SELECT KhuVucID FROM KhuVuc');
    const existingIds = new Set(existingRows.map((row) => Number(row.KhuVucID)));
    let nextId = Math.max(0, ...Array.from(existingIds)) + 1;

    const stats = { provinceCount: 0, districtCount: 0, wardCount: 0 };

    for (const province of provinces) {
      const provinceName = normalizeName(province?.name);
      if (!provinceName) continue;

      const provinceExternalId = getExternalId(province, 'level1_id');
      const provinceId = provinceExternalId && !existingIds.has(provinceExternalId)
        ? provinceExternalId
        : nextId++;

      if (verbose) {
        console.log(`- Tỉnh/thành: ${provinceName} -> ID ${provinceId}`);
      }

      await connection.execute(
        'INSERT INTO KhuVuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
        [provinceId, provinceName, null, null, null]
      );

      existingIds.add(provinceId);
      stats.provinceCount += 1;

      const districts = Array.isArray(province?.level2s) ? province.level2s : [];
      for (const district of districts) {
        const districtName = normalizeName(district?.name);
        if (!districtName) continue;

        const districtExternalId = getExternalId(district, 'level2_id');
        const districtId = districtExternalId && !existingIds.has(districtExternalId)
          ? districtExternalId
          : nextId++;

        if (verbose) {
          console.log(`  - Quận/huyện: ${districtName} -> ID ${districtId} (cha ${provinceId})`);
        }

        await connection.execute(
          'INSERT INTO KhuVuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
          [districtId, districtName, provinceId, null, null]
        );

        existingIds.add(districtId);
        stats.districtCount += 1;

        const wards = Array.isArray(district?.level3s) ? district.level3s : [];
        for (const ward of wards) {
          const wardName = normalizeName(ward?.name);
          if (!wardName) continue;

          const wardExternalId = getExternalId(ward, 'level3_id');
          const wardId = wardExternalId && !existingIds.has(wardExternalId)
            ? wardExternalId
            : nextId++;

          if (verbose) {
            console.log(`    - Xã/phường: ${wardName} -> ID ${wardId} (cha ${districtId})`);
          }

          await connection.execute(
            'INSERT INTO KhuVuc (KhuVucID, TenKhuVuc, ParentKhuVucID, ViDo, KinhDo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE TenKhuVuc = VALUES(TenKhuVuc), ParentKhuVucID = VALUES(ParentKhuVucID), ViDo = VALUES(ViDo), KinhDo = VALUES(KinhDo)',
            [wardId, wardName, districtId, null, null]
          );

          existingIds.add(wardId);
          stats.wardCount += 1;
        }
      }
    }

    return stats;
  } finally {
    connection.release();
  }
}

exports.syncFromDvhcvn = async ({ source = null, replace = false, verbose = false } = {}) => {
  const rawData = await loadSourceData(source);
  const provinces = extractProvinces(rawData);
  return await importKhuVucData({ provinces, replace, verbose });
};

exports.DEFAULT_SOURCE_URL = DEFAULT_SOURCE_URL;
