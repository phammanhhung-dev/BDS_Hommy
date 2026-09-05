#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const db = require('../config/db');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PRE_2025_URL = 'https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist/tinh_huyen_xa.json';
const POST_2025_PROVINCES_URL = 'https://raw.githubusercontent.com/vietmap-company/vietnam_administrative_address/main/admin_new/province.json';
const POST_2025_WARDS_URL = 'https://raw.githubusercontent.com/vietmap-company/vietnam_administrative_address/main/admin_new/ward.json';
const BATCH_SIZE = 500;
const VERSION_PRE_2025 = 'PRE_2025';
const VERSION_POST_2025 = 'POST_2025';

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const padCode = (value, length) => normalizeText(String(value ?? '')).padStart(length, '0');

const extractDvhcvnProvinces = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && Array.isArray(rawData.data)) return rawData.data;
  if (rawData && Array.isArray(rawData.level1s)) return rawData.level1s;
  if (rawData && Array.isArray(rawData.provinces)) return rawData.provinces;
  throw new Error('Không tìm thấy danh sách tỉnh/thành trong dữ liệu PRE_2025.');
};

const extractVietmapProvinces = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && Array.isArray(rawData.data)) return rawData.data;
  if (rawData && Array.isArray(rawData.provinces)) return rawData.provinces;
  if (rawData && typeof rawData === 'object') return Object.values(rawData);
  throw new Error('Không tìm thấy danh sách tỉnh/thành trong dữ liệu POST_2025.');
};

const extractVietmapWards = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (rawData && typeof rawData === 'object') return Object.values(rawData);
  return [];
};

const mapDvhcvnProvince = (province) => ({
  province_code: padCode(province.ProvinceCode || province.code || province.level1_id || province.id || '', 2),
  province_name: normalizeText(province.ProvinceName || province.name || province.level1_name || province.level1_name_en || ''),
  province_type: normalizeText(province.ProvinceType || province.type || province.division_type || 'Tỉnh'),
  districts: Array.isArray(province.level2s) ? province.level2s : Array.isArray(province.districts) ? province.districts : []
});

const mapDvhcvnDistrict = (district, parentProvince) => ({
  district_code: padCode(district.DistrictCode || district.code || district.level2_id || district.id || '', 3),
  district_name: normalizeText(district.DistrictName || district.name || district.level2_name || ''),
  district_type: normalizeText(district.DistrictType || district.type || district.division_type || 'Quận'),
  province_code: parentProvince.province_code,
  communeRows: Array.isArray(district.level3s) ? district.level3s : Array.isArray(district.wards) ? district.wards : []
});

const mapDvhcvnCommune = (commune, parentProvince, parentDistrict) => ({
  commune_code: padCode(commune.CommuneCode || commune.code || commune.level3_id || commune.id || '', 5),
  commune_name: normalizeText(commune.CommuneName || commune.name || commune.level3_name || ''),
  commune_type: normalizeText(commune.CommuneType || commune.type || commune.division_type || 'Phường'),
  province_code: parentProvince.province_code,
  district_code: parentDistrict.district_code
});

const mapVietmapProvince = (province) => ({
  province_code: padCode(province.ProvinceCode || province.province_code || province.code || province.id || '', 2),
  province_name: normalizeText(province.ProvinceName || province.province_name || province.name || ''),
  province_type: normalizeText(province.ProvinceType || province.type || province.division_type || 'Tỉnh'),
  communes: Array.isArray(province.Communes) ? province.Communes
    : Array.isArray(province.communes) ? province.communes
      : Array.isArray(province.wards) ? province.wards
        : Array.isArray(province.districts) ? province.districts.flatMap((district) => Array.isArray(district.wards) ? district.wards : [])
          : []
});

const mapVietmapCommune = (commune, parentProvince) => ({
  commune_code: padCode(commune.CommuneCode || commune.commune_code || commune.code || commune.id || '', 5),
  commune_name: normalizeText(commune.CommuneName || commune.commune_name || commune.name || commune.name_with_type || ''),
  commune_type: normalizeText(commune.CommuneType || commune.type || commune.commune_type || commune.name_with_type || 'Phường'),
  province_code: parentProvince.province_code
});

const mapVietmapWardToCommune = (ward, parentProvince) => ({
  commune_code: padCode(ward.code || ward.CommuneCode || ward.commune_code || ward.id || '', 5),
  commune_name: normalizeText(ward.name || ward.CommuneName || ward.commune_name || ward.name_with_type || ''),
  commune_type: normalizeText(ward.type || ward.CommuneType || ward.commune_type || 'Phường'),
  province_code: parentProvince.province_code
});

const fetchJson = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 120000,
      responseType: 'json',
      headers: { Accept: 'application/json' }
    });

    if (response.status !== 200) {
      throw new Error(`Fetch thất bại ${url}: ${response.status} ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const fetchError = new Error(`RAW_JSON_404: ${url}`);
      fetchError.isNotFound = true;
      throw fetchError;
    }
    throw error;
  }
};

const loadRemoteJson = async (url, description) => {
  try {
    return await fetchJson(url);
  } catch (error) {
    if (error.isNotFound || (error.message && error.message.startsWith('RAW_JSON_404:'))) {
      console.error(`❌ ${description} không thể tải từ ${url}`);
      console.error('Please download the JSON files manually, place them in server/data/, and run again.');
      process.exit(1);
    }
    throw error;
  }
};

const detectVersionColumns = async (connection) => {
  const [rows] = await connection.query(
    `SELECT table_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name IN ('new_provinces', 'new_districts', 'new_communes')
       AND column_name = 'Version'`
  );
  return rows.map((row) => row.table_name);
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

const upsertProvinces = async ({ connection, provinces, version, hasVersion }) => {
  const columns = ['ProvinceCode', 'ProvinceName', 'ProvinceType'];
  if (hasVersion) columns.push('Version');

  const rows = provinces.map((province) => ({
    ProvinceCode: province.province_code,
    ProvinceName: province.province_name,
    ProvinceType: province.province_type || 'Tỉnh',
    Version: hasVersion ? version : undefined
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;

  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_provinces',
      columns,
      rows: chunk,
      uniqueUpdate: hasVersion
        ? 'ProvinceName = VALUES(ProvinceName), ProvinceType = VALUES(ProvinceType), Version = VALUES(Version)'
        : 'ProvinceName = VALUES(ProvinceName), ProvinceType = VALUES(ProvinceType)'
    });
    total += chunk.length;
  }

  return total;
};

const upsertDistricts = async ({ connection, districts, version, hasVersion }) => {
  const columns = ['ProvinceID', 'DistrictCode', 'DistrictName', 'DistrictType'];
  if (hasVersion) columns.push('Version');

  const rows = districts.map((district) => ({
    ProvinceID: district.province_id,
    DistrictCode: district.district_code,
    DistrictName: district.district_name,
    DistrictType: district.district_type || 'Quận',
    Version: hasVersion ? version : undefined
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;

  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_districts',
      columns,
      rows: chunk,
      uniqueUpdate: hasVersion
        ? 'ProvinceID = VALUES(ProvinceID), DistrictName = VALUES(DistrictName), DistrictType = VALUES(DistrictType), Version = VALUES(Version)'
        : 'ProvinceID = VALUES(ProvinceID), DistrictName = VALUES(DistrictName), DistrictType = VALUES(DistrictType)'
    });
    total += chunk.length;
  }

  return total;
};

const upsertCommunes = async ({ connection, communes, version, hasVersion }) => {
  const columns = ['ProvinceID', 'CommuneCode', 'CommuneName', 'CommuneType'];
  if (hasVersion) columns.push('Version');

  const rows = communes.map((commune) => ({
    ProvinceID: commune.province_id,
    CommuneCode: commune.commune_code,
    CommuneName: commune.commune_name,
    CommuneType: commune.commune_type || 'Phường',
    Version: hasVersion ? version : undefined
  }));

  const chunks = chunkArray(rows, BATCH_SIZE);
  let total = 0;

  for (const chunk of chunks) {
    await bulkUpsert({
      connection,
      tableName: 'new_communes',
      columns,
      rows: chunk,
      uniqueUpdate: hasVersion
        ? 'ProvinceID = VALUES(ProvinceID), CommuneName = VALUES(CommuneName), CommuneType = VALUES(CommuneType), Version = VALUES(Version)'
        : 'ProvinceID = VALUES(ProvinceID), CommuneName = VALUES(CommuneName), CommuneType = VALUES(CommuneType)'
    });
    total += chunk.length;
  }

  return total;
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

const prepareDvhcvnRows = async ({ connection, provinces }) => {
  const provinceItems = provinces.map(mapDvhcvnProvince);

  const districtItems = [];
  const communeItems = [];

  for (const province of provinceItems) {
    for (const district of province.districts) {
      const normalizedDistrict = mapDvhcvnDistrict(district, province);
      if (!normalizedDistrict.district_code) continue;
      districtItems.push(normalizedDistrict);

      for (const commune of normalizedDistrict.communeRows) {
        const normalizedCommune = mapDvhcvnCommune(commune, province, normalizedDistrict);
        if (!normalizedCommune.commune_code) continue;
        communeItems.push(normalizedCommune);
      }
    }
  }

  const { provinceIdByCode, districtIdByCode } = await buildCodeMap({ connection });

  for (const districtItem of districtItems) {
    districtItem.province_id = provinceIdByCode.get(districtItem.province_code) || null;
  }

  for (const communeItem of communeItems) {
    communeItem.province_id = provinceIdByCode.get(communeItem.province_code) || null;
  }

  return { provinceItems, districtItems, communeItems };
};

const prepareVietmapRows = async ({ connection, provinces }) => {
  const provinceItems = provinces.map(mapVietmapProvince);
  const communeItems = [];

  for (const province of provinceItems) {
    for (const commune of Array.isArray(province.communes) ? province.communes : []) {
      const normalizedCommune = mapVietmapCommune(commune, province);
      if (!normalizedCommune.commune_code) continue;
      communeItems.push(normalizedCommune);
    }
  }

  const { provinceIdByCode } = await buildCodeMap({ connection });
  for (const communeItem of communeItems) {
    communeItem.province_id = provinceIdByCode.get(communeItem.province_code) || null;
    communeItem.district_id = null;
  }

  return { provinceItems, communeItems };
};

const seed = async () => {
  const connection = await db.getConnection();
  await connection.query('SET SESSION sql_mode = CONCAT(@@sql_mode, ",NO_AUTO_VALUE_ON_ZERO")');

  try {
    const versionColumns = await detectVersionColumns(connection);
    const hasVersion = versionColumns.length > 0;

    console.log('📥 Fetching PRE_2025 data from hanhchinhvn...');
    const rawPre = await loadRemoteJson(PRE_2025_URL, 'PRE_2025 data');
    const preProvinces = extractDvhcvnProvinces(rawPre);
    const preProvinceRows = preProvinces.map(mapDvhcvnProvince);

    console.log('📥 Fetching POST_2025 province data from vietmap-company...');
    const rawPostProvinces = await loadRemoteJson(POST_2025_PROVINCES_URL, 'POST_2025 province data');
    const postProvinces = extractVietmapProvinces(rawPostProvinces);
    const postProvinceRows = postProvinces.map(mapVietmapProvince);

    console.log('📥 Fetching POST_2025 ward data from vietmap-company...');
    const rawPostWards = await loadRemoteJson(POST_2025_WARDS_URL, 'POST_2025 ward data');
    const postWards = extractVietmapWards(rawPostWards);

    await connection.beginTransaction();

    console.log(`🗺️ Seeding ${preProvinceRows.length} PRE_2025 provinces...`);
    await upsertProvinces({ connection, provinces: preProvinceRows, version: VERSION_PRE_2025, hasVersion });
    console.log(`🗺️ Seeding ${postProvinceRows.length} POST_2025 provinces...`);
    await upsertProvinces({ connection, provinces: postProvinceRows, version: VERSION_POST_2025, hasVersion });

    const { provinceIdByCode } = await buildCodeMap({ connection });
    if (provinceIdByCode.size === 0) {
      throw new Error('Không có tỉnh/thành nào sau khi seed provinces. Kiểm tra dữ liệu đầu vào.');
    }

    const preDistricts = [];
    const preCommunes = [];
    for (const province of preProvinceRows) {
      const provinceId = provinceIdByCode.get(province.province_code);
      if (!provinceId) continue;
      const rawProvince = preProvinces.find((item) => normalizeText(item.ProvinceCode || item.code || item.level1_id || item.id || '') === province.province_code);
      const districts = Array.isArray(rawProvince.level2s) ? rawProvince.level2s : Array.isArray(rawProvince.districts) ? rawProvince.districts : [];
      for (const district of districts) {
        const mappedDistrict = mapDvhcvnDistrict(district, province);
        mappedDistrict.province_id = provinceId;
        preDistricts.push(mappedDistrict);
        for (const commune of Array.isArray(mappedDistrict.communeRows) ? mappedDistrict.communeRows : []) {
          const mappedCommune = mapDvhcvnCommune(commune, province, mappedDistrict);
          mappedCommune.province_id = provinceId;
          preCommunes.push(mappedCommune);
        }
      }
    }

    console.log(`📍 Seeding ${preDistricts.length} PRE_2025 districts...`);
    await upsertDistricts({ connection, districts: preDistricts, version: VERSION_PRE_2025, hasVersion });

    const { provinceIdByCode: refreshedProvinceMap, districtIdByCode: refreshedDistrictMap } = await buildCodeMap({ connection });
    const preCommuneRows = preCommunes.map((commune) => ({
      ...commune,
      province_id: refreshedProvinceMap.get(commune.province_code) || null
    }));

    console.log(`📍 Seeding ${preCommuneRows.length} PRE_2025 communes...`);
    await upsertCommunes({ connection, communes: preCommuneRows, version: VERSION_PRE_2025, hasVersion });

    const postCommuneRows = [];
    for (const ward of postWards) {
      const provinceCode = padCode(ward.parent_code || ward.province_code || ward.ProvinceCode || '', 2);
      const provinceId = refreshedProvinceMap.get(provinceCode);
      if (!provinceId) continue;

      const normalizedCommune = mapVietmapWardToCommune(ward, { province_code: provinceCode });
      normalizedCommune.province_id = provinceId;
      postCommuneRows.push(normalizedCommune);
    }

    console.log(`📍 Seeding ${postCommuneRows.length} POST_2025 communes...`);
    await upsertCommunes({ connection, communes: postCommuneRows, version: VERSION_POST_2025, hasVersion });

    await connection.commit();
    console.log('✅ Seed full real data completed successfully.');
    console.log('ℹ️ address_mappings remains unchanged to preserve Dual Address UI behavior.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

seed().catch((error) => {
  console.error('❌ Lỗi khi chạy seed_full_real_data.js:', error.message || error);
  process.exit(1);
});
