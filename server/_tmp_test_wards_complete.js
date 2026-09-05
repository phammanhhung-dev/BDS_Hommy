require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== TEST 1: new_communes TOTAL count ===');
    const [ncTotal] = await db.query('SELECT COUNT(*) AS cnt FROM new_communes');
    console.log('new_communes total count:', ncTotal[0].cnt);

    console.log('');
    console.log('=== TEST 2: legacy_communes schema (all columns) ===');
    const [lcSchema] = await db.query('DESCRIBE legacy_communes');
    console.log('legacy_communes columns:', JSON.stringify(lcSchema, null, 2));

    console.log('');
    console.log('=== TEST 3: legacy_communes sample rows (HCMC) ===');
    const [lcSample] = await db.query('SELECT * FROM legacy_communes WHERE ProvinceID = 50 LIMIT 5');
    console.log('Sample legacy_communes rows:', JSON.stringify(lcSample, null, 2));

    console.log('');
    console.log('=== TEST 4: Test getWards fallback query manually ===');
    // Simulate what getWards would do: try new_communes by provinceId first
    const [ncByProv] = await db.query('SELECT * FROM new_communes WHERE ProvinceID = 50 LIMIT 5');
    console.log('new_communes by ProvinceID=50 count:', ncByProv.length);
    // Then fallback to legacy_communes by ProvinceID (not DistrictID)
    const [lcByProv] = await db.query('SELECT * FROM legacy_communes WHERE ProvinceID = 50 LIMIT 5');
    console.log('legacy_communes by ProvinceID=50 count:', lcByProv.length);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
