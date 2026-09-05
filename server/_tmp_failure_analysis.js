require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function analyzeFailures() {
  try {
    console.log('=== FAILURE ANALYSIS: Why 1566 rows failed resolution ===');
    console.log('READ-ONLY operation\n');

    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));

    const [legacyCommunes] = await db.query('SELECT CommuneID, ProvinceID, CommuneCode, CommuneName FROM legacy_communes');
    const [legacyProvinces] = await db.query('SELECT ProvinceID, ProvinceCode FROM legacy_provinces');

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

    // Collect failed resolutions with details
    const failures = [];
    const failedProvinces = new Set();

    for (const lc of legacyCommunes) {
      const provinceCode = provinceMap.get(lc.ProvinceID);
      if (!provinceCode) continue;

      const pre2025Province = pre2025Lookup.get(provinceCode);
      if (!pre2025Province) continue;

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

      if (!matched) continue;

      // Check if numeric DistrictCode exists in new_districts
      const [newDistrictRows] = await db.query(
        `SELECT DistrictID, DistrictName 
         FROM new_districts 
         WHERE ProvinceID = ? 
           AND DistrictCode = ? 
           AND DistrictCode REGEXP '^[0-9]+$'`,
        [lc.ProvinceID, matchedDistrictCode]
      );

      if (newDistrictRows.length === 0) {
        failures.push({
          ProvinceID: lc.ProvinceID,
          ProvinceCode: provinceCode,
          ProvinceName: pre2025Province.name,
          CommuneID: lc.CommuneID,
          CommuneName: lc.CommuneName,
          Pre2025DistrictCode: matchedDistrictCode,
          MatchMethod: 'code'
        });
        failedProvinces.add(lc.ProvinceID);
      }
    }

    console.log('Total failures collected:', failures.length);
    console.log('Unique failed provinces:', failedProvinces.size);
    console.log('');

    console.log('=== FAILURES BY PROVINCE ===');
    const failuresByProvince = new Map();
    for (const f of failures) {
      failuresByProvince.set(f.ProvinceID, (failuresByProvince.get(f.ProvinceID) || 0) + 1);
    }
    
    const sortedFailures = Array.from(failuresByProvince.entries()).sort((a, b) => b[1] - a[1]);
    for (const [provinceId, count] of sortedFailures) {
      console.log(`ProvinceID ${provinceId}: ${count} failures`);
    }
    console.log('');

    console.log('=== SAMPLE FAILURES FOR EACH PROVINCE (first 3 per province) ===');
    for (const provinceId of sortedFailures.map(f => f[0])) {
      const provinceFailures = failures.filter(f => f.ProvinceID === provinceId).slice(0, 3);
      console.log(`ProvinceID ${provinceId} samples:`);
      console.log(JSON.stringify(provinceFailures, null, 2));
      console.log('');
    }

    console.log('=== CHECK: Do these provinces have ANY numeric new_districts rows? ===');
    for (const provinceId of sortedFailures.map(f => f[0])) {
      const [numericRows] = await db.query(
        `SELECT COUNT(*) as cnt 
         FROM new_districts 
         WHERE ProvinceID = ? AND DistrictCode REGEXP '^[0-9]+$'`,
        [provinceId]
      );
      const [totalRows] = await db.query(
        `SELECT COUNT(*) as cnt 
         FROM new_districts 
         WHERE ProvinceID = ?`,
        [provinceId]
      );
      console.log(`ProvinceID ${provinceId}: ${numericRows[0].cnt} numeric rows out of ${totalRows[0].cnt} total`);
    }
    console.log('');

    console.log('=== CHECK: What DistrictCodes do these provinces have in new_districts? ===');
    for (const provinceId of sortedFailures.map(f => f[0]).slice(0, 3)) {
      const [districtCodes] = await db.query(
        `SELECT DistrictCode, DistrictName 
         FROM new_districts 
         WHERE ProvinceID = ? 
         ORDER BY DistrictCode`,
        [provinceId]
      );
      console.log(`ProvinceID ${provinceId} DistrictCodes:`, JSON.stringify(districtCodes, null, 2));
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error in failure analysis:', error);
    process.exit(1);
  }
}

analyzeFailures();
