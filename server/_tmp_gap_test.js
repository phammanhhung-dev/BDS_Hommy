require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== GAP 1: new_communes with CORRECT HCMC new_provinces ID (2) ===');
    const [ncCountNew] = await db.query('SELECT COUNT(*) AS cnt FROM new_communes WHERE ProvinceID = 2');
    console.log('new_communes count for HCMC (ProvinceID=2):', ncCountNew[0].cnt);
    const [ncSampleNew] = await db.query('SELECT * FROM new_communes WHERE ProvinceID = 2 LIMIT 5');
    console.log('Sample new_communes rows (HCMC, correct ID):', JSON.stringify(ncSampleNew, null, 2));

    console.log('');
    console.log('=== GAP 2: Get DistrictName for Quận 12 (DistrictID=1607) from new_districts ===');
    const [districtData] = await db.query('SELECT DistrictID, ProvinceID, DistrictName FROM new_districts WHERE DistrictID = 1607 LIMIT 1');
    console.log('District data for DistrictID=1607:', JSON.stringify(districtData, null, 2));

    console.log('');
    console.log('=== GAP 3: Run fallback LIKE query with actual DistrictName ===');
    if (districtData.length > 0) {
      const districtName = districtData[0].DistrictName;
      console.log('Using DistrictName:', districtName);
      const [likeResult] = await db.query(
        `SELECT c.CommuneID, c.CommuneName 
         FROM legacy_communes c 
         WHERE c.ProvinceID = 50 
           AND LOWER(c.CommuneName) LIKE CONCAT('%(', LOWER(?), ')%')`,
        [districtName]
      );
      console.log('LIKE query result count:', likeResult.length);
      console.log('LIKE query result rows:', JSON.stringify(likeResult, null, 2));
    } else {
      console.log('No district found with DistrictID=1607');
    }

    console.log('');
    console.log('=== GAP 4: Check CommuneName pattern in legacy_communes (20 samples) ===');
    const [communeNames] = await db.query('SELECT CommuneName FROM legacy_communes WHERE ProvinceID = 50 LIMIT 20');
    console.log('CommuneName samples:', JSON.stringify(communeNames, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
