#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../config/db');

const HCMC_PROVINCE_CODE = '79';
const HCMC_PROVINCE_NAME = 'Thành phố Hồ Chí Minh';
const DISTRICT_CODE = 'HCM-Q1';
const DISTRICT_NAME = 'Quận 1';
const DISTRICT_TYPE = 'Quận';

const OLD_COMMUNE_CODE = 'HCM-Q1-PBN';
const OLD_COMMUNE_NAME = 'Phường Bến Nghé';
const NEW_COMMUNE_CODE = '790111';
const NEW_COMMUNE_NAME = 'Phường Bến Nghé';
const NEW_COMMUNE_TYPE = 'Phường';

async function seedHcmcTestData() {
  console.log('📌 Seed HCMC test data bắt đầu...');

  const [provinceRows] = await db.query(
    'SELECT ProvinceID FROM new_provinces WHERE ProvinceCode = ? LIMIT 1',
    [HCMC_PROVINCE_CODE]
  );

  if (!Array.isArray(provinceRows) || provinceRows.length === 0) {
    throw new Error(`Không tìm thấy tỉnh/thành phố ${HCMC_PROVINCE_NAME} với code ${HCMC_PROVINCE_CODE}.`);
  }

  const provinceId = provinceRows[0].ProvinceID;
  console.log(`✅ Đã tìm thấy ProvinceID=${provinceId} cho ${HCMC_PROVINCE_NAME}`);

  const [districtRows] = await db.query(
    'SELECT DistrictID FROM new_districts WHERE ProvinceID = ? AND DistrictCode = ? LIMIT 1',
    [provinceId, DISTRICT_CODE]
  );

  let districtId;

  if (Array.isArray(districtRows) && districtRows.length > 0) {
    districtId = districtRows[0].DistrictID;
    console.log(`ℹ️ Quận đã tồn tại: DistrictID=${districtId}`);
  } else {
    const [districtResult] = await db.query(
      `INSERT INTO new_districts (ProvinceID, DistrictCode, DistrictName, DistrictType)
       VALUES (?, ?, ?, ?)`,
      [provinceId, DISTRICT_CODE, DISTRICT_NAME, DISTRICT_TYPE]
    );
    districtId = districtResult.insertId;
    console.log(`✅ Đã chèn Quận 1 mới với DistrictID=${districtId}`);
  }

  await db.query('START TRANSACTION');

  try {
    await db.query(
      `INSERT INTO new_communes (ProvinceID, DistrictID, CommuneCode, CommuneName, CommuneType)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE CommuneName = VALUES(CommuneName), CommuneType = VALUES(CommuneType), DistrictID = VALUES(DistrictID), ProvinceID = VALUES(ProvinceID)`,
      [provinceId, districtId, OLD_COMMUNE_CODE, OLD_COMMUNE_NAME, NEW_COMMUNE_TYPE]
    );
    console.log(`✅ Đã chèn/đã cập nhật phường cũ: ${OLD_COMMUNE_NAME} (${OLD_COMMUNE_CODE})`);

    await db.query(
      `INSERT INTO new_communes (ProvinceID, DistrictID, CommuneCode, CommuneName, CommuneType)
       VALUES (?, NULL, ?, ?, ?)
       ON DUPLICATE KEY UPDATE CommuneName = VALUES(CommuneName), CommuneType = VALUES(CommuneType), ProvinceID = VALUES(ProvinceID), DistrictID = VALUES(DistrictID)`,
      [provinceId, NEW_COMMUNE_CODE, NEW_COMMUNE_NAME, NEW_COMMUNE_TYPE]
    );
    console.log(`✅ Đã chèn/đã cập nhật phường mới: ${NEW_COMMUNE_NAME} (${NEW_COMMUNE_CODE})`);

    await db.query('COMMIT');
    console.log('🎉 Seed HCMC test data hoàn tất.');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

seedHcmcTestData().catch((error) => {
  console.error('❌ Lỗi khi chạy seed_hcmc_test_data.js:', error.message || error);
  process.exit(1);
});
