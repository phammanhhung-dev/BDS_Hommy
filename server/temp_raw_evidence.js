const db = require('./config/db');

(async () => {
  try {
    console.log('===DISTRICT_PROVINCE_JOIN===');
    const [rows1] = await db.query(
      `SELECT d.DistrictID, d.ProvinceID, d.DistrictCode, d.DistrictName, d.DistrictType, p.ProvinceName
       FROM new_districts d
       JOIN new_provinces p USING (ProvinceID)
       ORDER BY d.DistrictID
       LIMIT 10`);
    console.log(JSON.stringify(rows1, null, 2));

    console.log('===DISTRICT_PROVINCE_JOIN_11_20===');
    const [rows2] = await db.query(
      `SELECT d.DistrictID, d.ProvinceID, d.DistrictCode, d.DistrictName, d.DistrictType, p.ProvinceName
       FROM new_districts d
       JOIN new_provinces p USING (ProvinceID)
       ORDER BY d.DistrictID
       LIMIT 10 OFFSET 10`);
    console.log(JSON.stringify(rows2, null, 2));

    console.log('===FK_INFO===');
    const [fkRows] = await db.query(
      `SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('new_districts', 'new_communes')
         AND REFERENCED_TABLE_NAME = 'new_provinces'
       ORDER BY TABLE_NAME, CONSTRAINT_NAME`);
    console.log(JSON.stringify(fkRows, null, 2));

    console.log('===SHOW_CREATE===');
    const [showDist] = await db.query('SHOW CREATE TABLE new_districts');
    const [showComm] = await db.query('SHOW CREATE TABLE new_communes');
    const [showProv] = await db.query('SHOW CREATE TABLE new_provinces');
    console.log(showDist[0]['Create Table']);
    console.log('---');
    console.log(showComm[0]['Create Table']);
    console.log('---');
    console.log(showProv[0]['Create Table']);
  } catch (err) {
    console.error(err.stack || err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
