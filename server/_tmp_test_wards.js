require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== TEST legacy_communes DistrictID column existence ===');
    const [colRows] = await db.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
       LIMIT 1`,
      ['legacy_communes', 'DistrictID']
    );
    console.log('legacy_communes has DistrictID column?', colRows.length > 0);

    console.log('');
    console.log('=== TEST new_communes for HCMC (ProvinceID=50) ===');
    const [ncCount] = await db.query('SELECT COUNT(*) AS cnt FROM new_communes WHERE ProvinceID = 50');
    console.log('new_communes count for HCMC:', ncCount[0].cnt);
    const [ncSample] = await db.query('SELECT * FROM new_communes WHERE ProvinceID = 50 LIMIT 5');
    console.log('Sample new_communes rows (HCMC):', JSON.stringify(ncSample, null, 2));

    console.log('');
    console.log('=== TEST legacy_communes for Quận 12 (DistrictID=1607) ===');
    try {
      const [lcDistrict] = await db.query('SELECT COUNT(*) AS cnt FROM legacy_communes WHERE DistrictID = 1607');
      console.log('legacy_communes by DistrictID=1607 count:', lcDistrict[0].cnt);
    } catch (e) {
      console.log('legacy_communes DistrictID query FAILED (maybe no column):', e.message);
    }

    console.log('');
    console.log('=== TEST legacy_communes by ProvinceID=50 ===');
    const [lcProv] = await db.query('SELECT COUNT(*) AS cnt FROM legacy_communes WHERE ProvinceID = 50');
    console.log('legacy_communes ProvinceID=50 count:', lcProv[0].cnt);
    const [lcSample] = await db.query('SELECT * FROM legacy_communes WHERE ProvinceID = 50 LIMIT 3');
    console.log('Sample legacy_communes rows (HCMC):', JSON.stringify(lcSample, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
