require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function investigateDuplicates() {
  try {
    console.log('=== INVESTIGATION: new_districts Duplicate Patterns ===');
    console.log('READ-ONLY operation\n');

    // Point 1: Full row count
    console.log('=== POINT 1: Full row count of new_districts ===');
    const [countResult] = await db.query('SELECT COUNT(*) as cnt FROM new_districts');
    console.log('Total new_districts rows:', countResult[0].cnt);
    console.log('');

    // Point 2: Find duplicate district names within same province
    console.log('=== POINT 2: Duplicate district names within same province ===');
    const [duplicates] = await db.query(`
      SELECT ProvinceID, DistrictName, COUNT(*) as cnt 
      FROM new_districts 
      GROUP BY ProvinceID, DistrictName 
      HAVING cnt > 1 
      ORDER BY ProvinceID
    `);
    console.log('Duplicates found:', duplicates.length);
    console.log(JSON.stringify(duplicates, null, 2));
    console.log('');

    // Point 3: All HCMC district rows
    console.log('=== POINT 3: All HCMC (ProvinceID=50) district rows ===');
    const [hcmcDistricts] = await db.query('SELECT * FROM new_districts WHERE ProvinceID = 50 ORDER BY DistrictName');
    console.log('HCMC districts count:', hcmcDistricts.length);
    console.log(JSON.stringify(hcmcDistricts, null, 2));
    console.log('');

    // Point 4: DistrictCode patterns across provinces
    console.log('=== POINT 4: DistrictCode patterns across provinces ===');
    const [codePatterns] = await db.query(`
      SELECT ProvinceID, DistrictID, DistrictCode, DistrictName, 
             CASE 
               WHEN DistrictCode REGEXP '^[0-9]+$' THEN 'numeric'
               WHEN DistrictCode LIKE '%-%' THEN 'hyphenated'
               ELSE 'other'
             END as code_format
      FROM new_districts 
      WHERE ProvinceID IN (1, 50, 6, 16) 
      ORDER BY ProvinceID, DistrictID
      LIMIT 30
    `);
    console.log('DistrictCode patterns sample:', JSON.stringify(codePatterns, null, 2));
    console.log('');

    // Point 5: Timestamp analysis
    console.log('=== POINT 5: CreatedAt/UpdatedAt timestamps for HCMC duplicates ===');
    const [timestamps] = await db.query(`
      SELECT DistrictID, DistrictName, DistrictCode, CreatedAt, UpdatedAt
      FROM new_districts 
      WHERE ProvinceID = 50 
      ORDER BY CreatedAt
    `);
    console.log('HCMC timestamp analysis:', JSON.stringify(timestamps, null, 2));
    console.log('');

    // Point 6: pre_2025.json HCMC district codes
    console.log('=== POINT 6: pre_2025.json HCMC district codes ===');
    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));
    
    // Find HCMC (code 79 in pre_2025)
    const hcmcPre2025 = pre2025Data.find(p => p.code === 79);
    if (hcmcPre2025) {
      console.log('HCMC from pre_2025.json (code 79):');
      console.log('Province name:', hcmcPre2025.name);
      console.log('District count:', hcmcPre2025.districts.length);
      console.log('Sample districts (first 5):');
      console.log(JSON.stringify(hcmcPre2025.districts.slice(0, 5), null, 2));
    } else {
      console.log('HCMC not found in pre_2025.json with code 79');
      // Try searching for HCMC by name
      const hcmcByName = pre2025Data.find(p => p.name.includes('Hồ Chí Minh'));
      if (hcmcByName) {
        console.log('HCMC found by name:', hcmcByName.name, 'code:', hcmcByName.code);
        console.log('Sample districts (first 5):');
        console.log(JSON.stringify(hcmcByName.districts.slice(0, 5), null, 2));
      }
    }
    console.log('');

    // Point 7: Re-confirm frontend district selection logic
    console.log('=== POINT 7: Frontend district selection logic (from earlier investigation) ===');
    console.log('From AddressSyncBlock.jsx lines 420-428:');
    console.log('The selectDistrict function stores KhuVucID as legacyDistrictId');
    console.log('It uses: KhuVucID ?? DistrictID ?? nextDistrict.id');
    console.log('No additional filtering happens in the selectDistrict handler.');
    console.log('Conclusion: Frontend stores whatever KhuVucID value the districts API returns.');

    process.exit(0);
  } catch (error) {
    console.error('Error in investigation:', error);
    process.exit(1);
  }
}

investigateDuplicates();
