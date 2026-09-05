require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function populateHCMCDistrictID() {
  try {
    console.log('=== STEP 3: POPULATE DistrictID FOR HCMC ONLY (ProvinceID=50) ===');
    console.log('Using validated matching logic from dry-run\n');

    // Read pre_2025.json
    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));
    console.log('Loaded pre_2025.json');

    // Read legacy data
    const [legacyCommunes] = await db.query('SELECT CommuneID, ProvinceID, CommuneCode, CommuneName FROM legacy_communes WHERE ProvinceID = 50');
    const [legacyProvinces] = await db.query('SELECT ProvinceID, ProvinceCode FROM legacy_provinces');
    console.log('Loaded', legacyCommunes.length, 'HCMC legacy_communes rows');
    console.log('Loaded', legacyProvinces.length, 'legacy_provinces rows\n');

    // Build lookup maps
    const provinceMap = new Map();
    for (const lp of legacyProvinces) {
      provinceMap.set(lp.ProvinceID, lp.ProvinceCode);
    }

    const pre2025Lookup = new Map();
    for (const province of pre2025Data) {
      const provinceCode = String(province.code);
      const districts = new Map();
      
      for (const district of province.districts) {
        const districtCode = String(district.code);
        const wards = new Map();
        
        for (const ward of district.wards) {
          const wardCode = String(ward.code);
          const wardName = String(ward.name).toLowerCase().trim();
          const wardDistrictCode = String(ward.district_code);
          
          wards.set(wardCode, {
            name: ward.name,
            district_code: wardDistrictCode
          });
          
          wards.set(`name:${wardName}`, {
            name: ward.name,
            district_code: wardDistrictCode
          });
        }
        
        districts.set(districtCode, {
          name: district.name,
          code: district.code,
          wards: wards
        });
      }
      
      pre2025Lookup.set(provinceCode, {
        name: province.name,
        code: province.code,
        districts: districts
      });
    }

    console.log('Built pre_2025 lookup structure\n');

    // Match and populate
    let updatedCount = 0;
    let failedCount = 0;

    for (const lc of legacyCommunes) {
      const provinceCode = provinceMap.get(lc.ProvinceID);
      if (!provinceCode) {
        failedCount++;
        continue;
      }

      const pre2025Province = pre2025Lookup.get(provinceCode);
      if (!pre2025Province) {
        failedCount++;
        continue;
      }

      // Match to pre_2025
      let matched = false;
      let matchedDistrictCode = null;

      for (const [districtCode, district] of pre2025Province.districts) {
        const ward = district.wards.get(String(lc.CommuneCode));
        if (ward) {
          matched = true;
          matchedDistrictCode = ward.district_code;
          break;
        }
      }

      if (!matched) {
        const normalizedName = lc.CommuneName.replace(/\s*\(.*?\)\s*$/, '').toLowerCase().trim();
        
        for (const [districtCode, district] of pre2025Province.districts) {
          const ward = district.wards.get(`name:${normalizedName}`);
          if (ward) {
            matched = true;
            matchedDistrictCode = ward.district_code;
            break;
          }
        }
      }

      if (!matched) {
        failedCount++;
        continue;
      }

      // Resolve to new_districts.DistrictID using numeric DistrictCode only
      const [newDistrictRows] = await db.query(
        `SELECT DistrictID 
         FROM new_districts 
         WHERE ProvinceID = ? 
           AND DistrictCode = ? 
           AND DistrictCode REGEXP '^[0-9]+$'`,
        [lc.ProvinceID, matchedDistrictCode]
      );

      if (newDistrictRows.length === 0) {
        failedCount++;
        continue;
      }

      const resolvedDistrictID = newDistrictRows[0].DistrictID;

      // Update legacy_communes
      await db.query(
        'UPDATE legacy_communes SET DistrictID = ? WHERE CommuneID = ?',
        [resolvedDistrictID, lc.CommuneID]
      );

      updatedCount++;
    }

    console.log('Population complete:');
    console.log('Updated rows:', updatedCount);
    console.log('Failed rows:', failedCount);
    console.log('');

    // Verification queries
    console.log('=== STEP 4: VERIFICATION ===');
    
    const [hcmcNotNull] = await db.query('SELECT COUNT(*) as cnt FROM legacy_communes WHERE ProvinceID = 50 AND DistrictID IS NOT NULL');
    console.log('HCMC rows with DistrictID NOT NULL:', hcmcNotNull[0].cnt, '(expected 273)');

    const [otherNotNull] = await db.query('SELECT COUNT(*) as cnt FROM legacy_communes WHERE ProvinceID != 50 AND DistrictID IS NOT NULL');
    console.log('Other provinces with DistrictID NOT NULL:', otherNotNull[0].cnt, '(expected 0)');

    const [distinctDistricts] = await db.query('SELECT DISTINCT DistrictID FROM legacy_communes WHERE ProvinceID = 50 ORDER BY DistrictID');
    console.log('Distinct DistrictIDs used for HCMC:', JSON.stringify(distinctDistricts.map(r => r.DistrictID), null, 2));

    const [sampleRows] = await db.query('SELECT CommuneID, CommuneName, DistrictID FROM legacy_communes WHERE ProvinceID = 50 ORDER BY DistrictID LIMIT 10');
    console.log('Sample 10 rows:', JSON.stringify(sampleRows, null, 2));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error in population:', error);
    process.exit(1);
  }
}

populateHCMCDistrictID();
