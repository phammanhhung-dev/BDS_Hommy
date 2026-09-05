require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runExtendedDryRun() {
  try {
    console.log('=== EXTENDED DRY-RUN: DistrictID Resolution to new_districts ===');
    console.log('READ-ONLY operation - no database writes\n');

    // Step 1: Read pre_2025.json and build lookup structure (same as before)
    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    console.log('Reading pre_2025.json from:', pre2025Path);
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));
    console.log('Loaded', pre2025Data.length, 'provinces from pre_2025.json\n');

    const [legacyCommunes] = await db.query('SELECT CommuneID, ProvinceID, CommuneCode, CommuneName FROM legacy_communes');
    console.log('Loaded', legacyCommunes.length, 'rows from legacy_communes\n');

    const [legacyProvinces] = await db.query('SELECT ProvinceID, ProvinceCode FROM legacy_provinces');
    console.log('Loaded', legacyProvinces.length, 'rows from legacy_provinces\n');

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

    // Step 2: Match each legacy_communes row and resolve to new_districts.DistrictID
    const results = {
      total: legacyCommunes.length,
      matchedToPre2025: 0,
      resolvedToNewDistricts: 0,
      failedResolution: 0,
      failedByProvince: new Map(),
      hcmc: {
        total: 0,
        resolved: 0,
        failed: 0,
        sampleResolutions: []
      },
      uniquenessIssues: []
    };

    for (const lc of legacyCommunes) {
      const provinceCode = provinceMap.get(lc.ProvinceID);
      if (!provinceCode) {
        results.failedResolution++;
        results.failedByProvince.set(lc.ProvinceID, (results.failedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.failed++;
        }
        continue;
      }

      const pre2025Province = pre2025Lookup.get(provinceCode);
      if (!pre2025Province) {
        results.failedResolution++;
        results.failedByProvince.set(lc.ProvinceID, (results.failedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.failed++;
        }
        continue;
      }

      // Match to pre_2025
      let matched = false;
      let matchedDistrictCode = null;
      let matchMethod = null;

      for (const [districtCode, district] of pre2025Province.districts) {
        const ward = district.wards.get(String(lc.CommuneCode));
        if (ward) {
          matched = true;
          matchedDistrictCode = ward.district_code;
          matchMethod = 'code';
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
            matchMethod = 'name';
            break;
          }
        }
      }

      if (!matched) {
        results.failedResolution++;
        results.failedByProvince.set(lc.ProvinceID, (results.failedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.failed++;
        }
        continue;
      }

      results.matchedToPre2025++;

      // Step 2: Resolve to new_districts.DistrictID using numeric DistrictCode only
      const [newDistrictRows] = await db.query(
        `SELECT DistrictID, DistrictName 
         FROM new_districts 
         WHERE ProvinceID = ? 
           AND DistrictCode = ? 
           AND DistrictCode REGEXP '^[0-9]+$'`,
        [lc.ProvinceID, matchedDistrictCode]
      );

      if (newDistrictRows.length === 0) {
        results.failedResolution++;
        results.failedByProvince.set(lc.ProvinceID, (results.failedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.failed++;
        }
        continue;
      }

      if (newDistrictRows.length > 1) {
        results.uniquenessIssues.push({
          ProvinceID: lc.ProvinceID,
          DistrictCode: matchedDistrictCode,
          count: newDistrictRows.length,
          rows: newDistrictRows
        });
      }

      const resolvedDistrictID = newDistrictRows[0].DistrictID;
      const resolvedDistrictName = newDistrictRows[0].DistrictName;

      results.resolvedToNewDistricts++;

      if (lc.ProvinceID === 50) {
        results.hcmc.resolved++;
        if (results.hcmc.sampleResolutions.length < 5) {
          results.hcmc.sampleResolutions.push({
            CommuneID: lc.CommuneID,
            CommuneName: lc.CommuneName,
            ResolvedDistrictID: resolvedDistrictID,
            ResolvedDistrictName: resolvedDistrictName,
            Pre2025DistrictCode: matchedDistrictCode
          });
        }
      }

      if (lc.ProvinceID === 50) {
        results.hcmc.total++;
      }
    }

    // Step 3: Verify uniqueness
    console.log('=== STEP 3: UNIQUENESS VERIFICATION ===');
    console.log('Uniqueness issues found:', results.uniquenessIssues.length);
    if (results.uniquenessIssues.length > 0) {
      console.log('Uniqueness issues details:', JSON.stringify(results.uniquenessIssues, null, 2));
    }
    console.log('');

    // Step 4: Output final statistics
    console.log('=== STEP 4: FINAL RESOLUTION STATISTICS ===');
    console.log('Total legacy_communes rows:', results.total);
    console.log('Matched to pre_2025.json:', results.matchedToPre2025);
    console.log('Resolved to new_districts.DistrictID:', results.resolvedToNewDistricts);
    console.log('Failed resolution (no numeric DistrictCode match):', results.failedResolution);
    console.log('Final resolution rate:', (results.resolvedToNewDistricts / results.total * 100).toFixed(2) + '%\n');

    console.log('=== RESOLUTION FAILURES BY PROVINCE ===');
    const sortedFailures = Array.from(results.failedByProvince.entries()).sort((a, b) => b[1] - a[1]);
    for (const [provinceId, count] of sortedFailures) {
      console.log(`ProvinceID ${provinceId}: ${count} failed resolution`);
    }
    console.log('');

    console.log('=== HCMC (ProvinceID=50) FINAL BREAKDOWN ===');
    console.log('Total HCMC rows:', results.hcmc.total);
    console.log('Successfully resolved to numeric new_districts:', results.hcmc.resolved);
    console.log('Failed resolution:', results.hcmc.failed);
    console.log('HCMC resolution rate:', (results.hcmc.resolved / results.hcmc.total * 100).toFixed(2) + '%\n');

    console.log('=== HCMC SAMPLE RESOLUTIONS (5 rows) ===');
    console.log('Confirming none resolve to DistrictID=1 (hyphenated "HCM-Q1" row):');
    console.log(JSON.stringify(results.hcmc.sampleResolutions, null, 2));
    console.log('');

    // Additional verification: Check if DistrictID=1 is the hyphenated row
    console.log('=== ADDITIONAL VERIFICATION: DistrictID=1 details ===');
    const [district1Check] = await db.query(
      `SELECT DistrictID, DistrictCode, DistrictName 
       FROM new_districts 
       WHERE DistrictID = 1`
    );
    console.log('DistrictID=1 row:', JSON.stringify(district1Check, null, 2));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error in extended dry-run:', error);
    process.exit(1);
  }
}

runExtendedDryRun();
