#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const BATCH_SIZE = 500;

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const padCode = (value, length) => normalizeText(String(value ?? '')).padStart(length, '0');

const extractProvinceNameFromPath = (pathValue) => {
  const raw = normalizeText(pathValue || '');
  if (!raw) return '';
  const parts = raw.split(',').map((segment) => segment.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : raw;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const bulkUpsert = async ({ connection, tableName, columns, rows, uniqueUpdate }) => {
  if (rows.length === 0) return 0;

  const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
  const values = rows.flatMap((row) => columns.map((col) => row[col]));
  const updateClause = uniqueUpdate || columns.map((column) => `${column} = VALUES(${column})`).join(', ');
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${updateClause}`;
  await connection.query(sql, values);
  return rows.length;
};

const upsertProvinces = async ({ connection, provinces }) => {
  const columns = ['ProvinceCode', 'ProvinceName', 'ProvinceType'];

  const rows = provinces.map((province) => ({
    ProvinceCode: normalizeText(province.ProvinceCode || province.code || province.id || ''),
    ProvinceName: normalizeText(province.ProvinceName || province.name || province.tinh || ''),
    ProvinceType: normalizeText(province.ProvinceType || province.type || province.division_type || 'Tỉnh')
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;
  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_provinces',
      columns,
      rows: chunk,
      uniqueUpdate: 'ProvinceName = VALUES(ProvinceName), ProvinceType = VALUES(ProvinceType)'
    });
    total += chunk.length;
  }

  return total;
};

const upsertDistricts = async ({ connection, districts }) => {
  const columns = ['ProvinceID', 'DistrictCode', 'DistrictName', 'DistrictType'];

  const rows = districts.map((district) => ({
    ProvinceID: district.ProvinceID ?? district.province_id,
    DistrictCode: normalizeText(district.DistrictCode ?? district.code ?? district.id ?? ''),
    DistrictName: normalizeText(district.DistrictName ?? district.name ?? district.district_name ?? ''),
    DistrictType: normalizeText(district.DistrictType ?? district.type ?? district.division_type ?? 'Quận')
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;
  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_districts',
      columns,
      rows: chunk,
      uniqueUpdate: 'ProvinceID = VALUES(ProvinceID), DistrictName = VALUES(DistrictName), DistrictType = VALUES(DistrictType)'
    });
    total += chunk.length;
  }

  return total;
};

const upsertCommunes = async ({ connection, communes }) => {
  const columns = ['ProvinceID', 'CommuneCode', 'CommuneName', 'CommuneType'];

  const rows = communes.map((commune) => ({
    ProvinceID: commune.ProvinceID ?? commune.province_id,
    CommuneCode: normalizeText(commune.CommuneCode || commune.code || commune.id || ''),
    CommuneName: normalizeText(commune.CommuneName || commune.name || commune.commune_name || ''),
    CommuneType: normalizeText(commune.CommuneType || commune.type || commune.division_type || 'Phường')
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;
  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_communes',
      columns,
      rows: chunk,
      uniqueUpdate: 'ProvinceID = VALUES(ProvinceID), CommuneName = VALUES(CommuneName), CommuneType = VALUES(CommuneType)'
    });
    total += chunk.length;
  }

  return total;
};

const hasTableColumn = async ({ connection, tableName, columnName }) => {
  const [rows] = await connection.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
    [tableName, columnName]
  );
  return rows.length > 0;
};

const buildCodeMap = async ({ connection }) => {
  const [[provinceRows], [districtRows]] = await Promise.all([
    connection.query('SELECT ProvinceID, ProvinceCode FROM new_provinces'),
    connection.query('SELECT DistrictID, DistrictCode FROM new_districts')
  ]);

  const provinceIdByCode = new Map(provinceRows.map((row) => [row.ProvinceCode, row.ProvinceID]));
  const districtIdByCode = new Map(districtRows.map((row) => [row.DistrictCode, row.DistrictID]));
  return { provinceIdByCode, districtIdByCode };
};

const normalizePostProvince = (province) => ({
  ProvinceCode: normalizeText(province.code ?? province.ProvinceCode ?? province.id ?? ''),
  ProvinceName: normalizeText(province.name ?? province.ProvinceName ?? province.name_with_type ?? ''),
  ProvinceType: normalizeText(province.type ?? province.ProvinceType ?? 'Tỉnh')
});

const detectProvinceTypeFromName = (provinceName) => {
  const normalized = normalizeText(provinceName || '');
  if (/^Thành phố\b/i.test(normalized)) return 'Thành phố';
  if (/^Tỉnh\b/i.test(normalized)) return 'Tỉnh';
  if (/^Thị xã\b/i.test(normalized)) return 'Thị xã';
  return 'Tỉnh';
};

const isValidProvinceCode = (value) => /^[0-9]{1,2}$/.test(normalizeText(String(value ?? '')));

const normalizePostWard = (ward, province_code) => ({
  province_id: province_code,
  district_id: null,
  commune_code: normalizeText(ward.code ?? ward.CommuneCode ?? ward.id ?? ''),
  commune_name: normalizeText(ward.name ?? ward.CommuneName ?? ward.name_with_type ?? ''),
  commune_type: normalizeText(ward.type ?? ward.CommuneType ?? ward.commune_type ?? 'Phường')
});

const normalizePreProvince = (province) => ({
  ProvinceCode: normalizeText(String(province.code ?? province.ProvinceCode ?? province.id ?? '')).padStart(2, '0'),
  ProvinceName: normalizeText(province.name ?? province.ProvinceName ?? ''),
  ProvinceType: normalizeText(province.division_type ?? province.ProvinceType ?? 'Tỉnh')
});

const normalizePreDistrict = (district, province_id) => ({
  ProvinceID: province_id,
  DistrictCode: normalizeText(String(district.code ?? district.DistrictCode ?? district.id ?? '')).padStart(3, '0'),
  DistrictName: normalizeText(district.name ?? district.DistrictName ?? ''),
  DistrictType: normalizeText(district.division_type ?? district.DistrictType ?? 'Quận')
});

const normalizePreCommune = (commune, province_id, district_id) => ({
  ProvinceID: province_id,
  DistrictID: district_id,
  CommuneCode: normalizeText(String(commune.code ?? commune.CommuneCode ?? commune.id ?? '')).padStart(5, '0'),
  CommuneName: normalizeText(commune.name ?? commune.CommuneName ?? ''),
  CommuneType: normalizeText(commune.division_type ?? commune.CommuneType ?? 'Phường')
});

async function seedLocalData() {
  try {
    console.log('Đang đọc file local...');
    const preData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pre_2025.json'), 'utf-8'));
    const preProvinces = Array.isArray(preData) ? preData : preData.data || preData.level1s || preData.provinces || [];

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const preProvinceRows = preProvinces.map((province) => normalizePreProvince(province));
    await upsertProvinces({ connection, provinces: preProvinceRows });

    const { provinceIdByCode: provMap } = await buildCodeMap({ connection });

    const preDistricts = [];
    const preCommunes = [];

    for (const province of preProvinces) {
      const provinceCode = normalizeText(String(province.code ?? province.ProvinceCode ?? province.id ?? '')).padStart(2, '0');
      const provinceId = provMap.get(provinceCode);
      if (!provinceId) continue;

      const rawDistricts = Array.isArray(province.districts)
        ? province.districts
        : Array.isArray(province.level2s)
          ? province.level2s
          : [];

      for (const district of rawDistricts) {
        const normalizedDistrict = normalizePreDistrict(district, provinceId);
        preDistricts.push(normalizedDistrict);

        const rawCommunes = Array.isArray(district.wards)
          ? district.wards
          : Array.isArray(district.level3s)
            ? district.level3s
            : [];

        for (const commune of rawCommunes) {
          preCommunes.push({
            province_code: provinceCode,
            district_code: normalizedDistrict.DistrictCode,
            rawCommune: commune
          });
        }
      }
    }

    await upsertDistricts({ connection, districts: preDistricts });
    const { districtIdByCode: distMap } = await buildCodeMap({ connection });

    const preCommuneRows = preCommunes.map((entry) => {
      const provinceId = provMap.get(entry.province_code);
      const districtId = distMap.get(entry.district_code);
      return normalizePreCommune(entry.rawCommune, provinceId, districtId);
    }).filter((commune) => commune.DistrictID != null);

    await upsertCommunes({ connection, communes: preCommuneRows });

    console.log('Đang đọc file post_2025...');
    const postData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/post_2025.json'), 'utf-8'));
    const postWards = Array.isArray(postData) ? postData : Object.values(postData || {});

    const provinceMap = new Map();
    for (const ward of postWards) {
      const provinceCode = padCode(ward.parent_code ?? ward.province_code ?? ward.ProvinceCode ?? '', 2);
      if (!isValidProvinceCode(provinceCode)) continue;

      if (!provinceMap.has(provinceCode)) {
        const provinceName = extractProvinceNameFromPath(ward.path_with_type || ward.path || '');
        if (!provinceName) continue;

        provinceMap.set(provinceCode, {
          ProvinceName: provinceName,
          ProvinceType: detectProvinceTypeFromName(provinceName)
        });
      }
    }

    const postProvinceRows = Array.from(provinceMap.entries()).map(([province_code, info]) => ({
      ProvinceCode: province_code,
      ProvinceName: info.ProvinceName,
      ProvinceType: info.ProvinceType
    }));

    if (postProvinceRows.length !== 34) {
      console.warn(`⚠️ Expected 34 POST_2025 provinces from local data, but found ${postProvinceRows.length}.`);
    }

    await upsertProvinces({ connection, provinces: postProvinceRows });

    const { provinceIdByCode } = await buildCodeMap({ connection });

    const postCommuneRows = [];
    for (const ward of postWards) {
      const provinceCode = padCode(ward.parent_code ?? ward.province_code ?? ward.ProvinceCode ?? '', 2);
      const provinceId = provinceIdByCode.get(provinceCode);
      if (!provinceId) continue;
      postCommuneRows.push(normalizePostWard(ward, provinceId));
    }

    await upsertCommunes({ connection, communes: postCommuneRows });

    await connection.commit();
    connection.release();

    console.log('Nạp dữ liệu thành công!');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi nạp data:', err);
    process.exit(1);
  }
}
seedLocalData();
