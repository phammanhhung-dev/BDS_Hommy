require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function resolveContradiction() {
  try {
    console.log('=== CONTRADICTION RESOLUTION: DistrictID=1606 ===');
    console.log('READ-ONLY operation\n');

    // Point 1: Check DistrictID=1606
    console.log('=== POINT 1: SELECT * FROM new_districts WHERE DistrictID = 1606 ===');
    const [district1606] = await db.query('SELECT * FROM new_districts WHERE DistrictID = 1606');
    console.log('DistrictID=1606 row:', JSON.stringify(district1606, null, 2));
    console.log('');

    // Point 2: All rows for ProvinceID=1
    console.log('=== POINT 2: SELECT * FROM new_districts WHERE ProvinceID = 1 ORDER BY DistrictID ===');
    const [province1Rows] = await db.query('SELECT * FROM new_districts WHERE ProvinceID = 1 ORDER BY DistrictID');
    console.log('ProvinceID=1 rows count:', province1Rows.length);
    console.log('ProvinceID=1 rows:', JSON.stringify(province1Rows, null, 2));
    console.log('');

    // Point 3: Count for ProvinceID=1
    console.log('=== POINT 3: SELECT COUNT(*) as cnt FROM new_districts WHERE ProvinceID = 1 ===');
    const [province1Count] = await db.query('SELECT COUNT(*) as cnt FROM new_districts WHERE ProvinceID = 1');
    console.log('ProvinceID=1 total count:', province1Count[0].cnt);
    console.log('');

    // Point 4: Count numeric rows for ProvinceID=1
    console.log('=== POINT 4: SELECT COUNT(*) as cnt FROM new_districts WHERE ProvinceID = 1 AND DistrictCode REGEXP "^[0-9]+$" ===');
    const [province1NumericCount] = await db.query('SELECT COUNT(*) as cnt FROM new_districts WHERE ProvinceID = 1 AND DistrictCode REGEXP "^[0-9]+$"');
    console.log('ProvinceID=1 numeric count:', province1NumericCount[0].cnt);
    console.log('');

    // Point 5: Get DistrictCodes for ProvinceID=1
    console.log('=== POINT 5: SELECT DistrictCode, DistrictName FROM new_districts WHERE ProvinceID = 1 ORDER BY DistrictCode ===');
    const [province1Codes] = await db.query('SELECT DistrictCode, DistrictName FROM new_districts WHERE ProvinceID = 1 ORDER BY DistrictCode');
    console.log('ProvinceID=1 DistrictCodes:', JSON.stringify(province1Codes, null, 2));
    console.log('');

    // Point 5 continued: Get Hà Nội from pre_2025.json
    console.log('=== POINT 5 continued: Hà Nội district codes from pre_2025.json ===');
    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));
    
    // Find Hà Nội (province code 1)
    const hanoiPre2025 = pre2025Data.find(p => p.code === 1);
    if (hanoiPre2025) {
      console.log('Hà Nội from pre_2025.json (code 1):');
      console.log('Province name:', hanoiPre2025.name);
      console.log('District count:', hanoiPre2025.districts.length);
      console.log('Sample districts (first 5):');
      console.log(JSON.stringify(hanoiPre2025.districts.slice(0, 5), null, 2));
    } else {
      console.log('Hà Nội not found in pre_2025.json with code 1');
    }
    console.log('');

    // Additional check: What ProvinceID does DistrictID=1606 actually belong to?
    console.log('=== ADDITIONAL CHECK: Confirm ProvinceID for DistrictID=1606 ===');
    const [district1606Province] = await db.query('SELECT ProvinceID FROM new_districts WHERE DistrictID = 1606');
    console.log('DistrictID=1606 belongs to ProvinceID:', district1606Province[0].ProvinceID);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error in contradiction resolution:', error);
    process.exit(1);
  }
}

resolveContradiction();
