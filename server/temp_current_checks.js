const db = require('./config/db');
(async () => {
  try {
    console.log('===DISTRICT_PROVINCE_JOIN===');
    const [joinRows] = await db.query(`SELECT d.DistrictID, d.ProvinceID, d.DistrictCode, d.DistrictName, d.DistrictType, p.ProvinceName FROM new_districts d JOIN new_provinces p USING (ProvinceID) ORDER BY d.DistrictID LIMIT 10`);
    console.log(JSON.stringify(joinRows, null, 2));

    console.log('===NEW_PROVINCES_63===');
    const [provRows] = await db.query('SELECT ProvinceID, ProvinceCode, ProvinceName FROM new_provinces ORDER BY ProvinceID');
    console.log(JSON.stringify(provRows, null, 2));

    console.log('===FK_CONSTRAINTS===');
    const [fkRows] = await db.query(`SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('new_districts', 'new_communes') AND REFERENCED_TABLE_NAME = 'new_provinces' ORDER BY TABLE_NAME, CONSTRAINT_NAME`);
    console.log(JSON.stringify(fkRows, null, 2));

    console.log('===SHOW_CREATE_TABLE_DISTRICT===');
    const [distRows] = await db.query('SHOW CREATE TABLE new_districts');
    console.log(JSON.stringify(distRows[0], null, 2));

    console.log('===SHOW_CREATE_TABLE_COMMUNE===');
    const [commRows] = await db.query('SHOW CREATE TABLE new_communes');
    console.log(JSON.stringify(commRows[0], null, 2));
  } catch (error) {
    console.error(error.stack || error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
