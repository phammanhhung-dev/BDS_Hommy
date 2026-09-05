require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runDryRun() {
  try {
    console.log('=== DRY-RUN: DistrictID Mapping Analysis ===');
    console.log('READ-ONLY operation - no database writes\n');

    // Step 1: Read pre_2025.json
    const pre2025Path = path.join(__dirname, 'data', 'pre_2025.json');
    console.log('Reading pre_2025.json from:', pre2025Path);
    const pre2025Data = JSON.parse(fs.readFileSync(pre2025Path, 'utf8'));
    console.log('Loaded', pre2025Data.length, 'provinces from pre_2025.json\n');

    // Step 2: Read legacy_communes and legacy_provinces
    console.log('Reading legacy_communes from database...');
    const [legacyCommunes] = await db.query('SELECT CommuneID, ProvinceID, CommuneCode, CommuneName FROM legacy_communes');
    console.log('Loaded', legacyCommunes.length, 'rows from legacy_communes\n');

    console.log('Reading legacy_provinces from database...');
    const [legacyProvinces] = await db.query('SELECT ProvinceID, ProvinceCode FROM legacy_provinces');
    console.log('Loaded', legacyProvinces.length, 'rows from legacy_provinces\n');

    // Build lookup maps
    const provinceMap = new Map();
    for (const lp of legacyProvinces) {
      provinceMap.set(lp.ProvinceID, lp.ProvinceCode);
    }

    // Build pre_2025 lookup structure
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
          
          // Also index by normalized name for fallback matching
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

    // Step 3: Match each legacy_communes row
    const results = {
      total: legacyCommunes.length,
      matchedByCode: 0,
      matchedByName: 0,
      unmatched: 0,
      unmatchedByProvince: new Map(),
      hcmc: {
        total: 0,
        matchedByCode: 0,
        matchedByName: 0,
        unmatched: 0,
        unmatchedRows: []
      },
      sampleMatches: []
    };

    for (const lc of legacyCommunes) {
      const provinceCode = provinceMap.get(lc.ProvinceID);
      if (!provinceCode) {
        results.unmatched++;
        results.unmatchedByProvince.set(lc.ProvinceID, (results.unmatchedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.unmatched++;
          results.hcmc.unmatchedRows.push({ CommuneID: lc.CommuneID, CommuneName: lc.CommuneName });
        }
        continue;
      }

      const pre2025Province = pre2025Lookup.get(provinceCode);
      if (!pre2025Province) {
        results.unmatched++;
        results.unmatchedByProvince.set(lc.ProvinceID, (results.unmatchedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.unmatched++;
          results.hcmc.unmatchedRows.push({ CommuneID: lc.CommuneID, CommuneName: lc.CommuneName });
        }
        continue;
      }

      // Method (a): Try matching by CommuneCode
      let matched = false;
      let matchedDistrict = null;
      let matchMethod = null;

      for (const [districtCode, district] of pre2025Province.districts) {
        const ward = district.wards.get(String(lc.CommuneCode));
        if (ward) {
          matched = true;
          matchedDistrict = { code: districtCode, name: district.name };
          matchMethod = 'code';
          break;
        }
      }

      // Method (b): Try matching by CommuneName (with fallback)
      if (!matched) {
        const normalizedName = lc.CommuneName.replace(/\s*\(.*?\)\s*$/, '').toLowerCase().trim();
        
        for (const [districtCode, district] of pre2025Province.districts) {
          const ward = district.wards.get(`name:${normalizedName}`);
          if (ward) {
            matched = true;
            matchedDistrict = { code: districtCode, name: district.name };
            matchMethod = 'name';
            break;
          }
        }
      }

      if (matched) {
        if (matchMethod === 'code') {
          results.matchedByCode++;
          if (lc.ProvinceID === 50) results.hcmc.matchedByCode++;
        } else {
          results.matchedByName++;
          if (lc.ProvinceID === 50) results.hcmc.matchedByName++;
        }

        // Collect sample matches (max 10)
        if (results.sampleMatches.length < 10) {
          results.sampleMatches.push({
            CommuneID: lc.CommuneID,
            CommuneName: lc.CommuneName,
            ProvinceID: lc.ProvinceID,
            MatchMethod: matchMethod,
            DistrictCode: matchedDistrict.code,
            DistrictName: matchedDistrict.name
          });
        }
      } else {
        results.unmatched++;
        results.unmatchedByProvince.set(lc.ProvinceID, (results.unmatchedByProvince.get(lc.ProvinceID) || 0) + 1);
        
        if (lc.ProvinceID === 50) {
          results.hcmc.unmatched++;
          results.hcmc.unmatchedRows.push({ CommuneID: lc.CommuneID, CommuneName: lc.CommuneName });
        }
      }

      if (lc.ProvinceID === 50) {
        results.hcmc.total++;
      }
    }

    // Step 5: Output statistics
    console.log('=== MATCHING STATISTICS ===');
    console.log('Total legacy_communes rows:', results.total);
    console.log('Matched via CommuneCode (method a):', results.matchedByCode);
    console.log('Matched via CommuneName (method b):', results.matchedByName);
    console.log('UNMATCHED total:', results.unmatched);
    console.log('Match rate:', ((results.matchedByCode + results.matchedByName) / results.total * 100).toFixed(2) + '%\n');

    console.log('=== UNMATCHED BY PROVINCE ===');
    const sortedUnmatched = Array.from(results.unmatchedByProvince.entries()).sort((a, b) => b[1] - a[1]);
    for (const [provinceId, count] of sortedUnmatched) {
      console.log(`ProvinceID ${provinceId}: ${count} unmatched`);
    }
    console.log('');

    console.log('=== HCMC (ProvinceID=50) BREAKDOWN ===');
    console.log('Total HCMC rows:', results.hcmc.total);
    console.log('Matched via CommuneCode:', results.hcmc.matchedByCode);
    console.log('Matched via CommuneName:', results.hcmc.matchedByName);
    console.log('UNMATCHED:', results.hcmc.unmatched);
    console.log('HCMC match rate:', ((results.hcmc.matchedByCode + results.hcmc.matchedByName) / results.hcmc.total * 100).toFixed(2) + '%\n');

    console.log('=== 10 SAMPLE SUCCESSFUL MATCHES ===');
    console.log(JSON.stringify(results.sampleMatches, null, 2));
    console.log('');

    console.log('=== ALL UNMATCHED ROWS FOR HCMC ===');
    console.log(JSON.stringify(results.hcmc.unmatchedRows, null, 2));
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error in dry-run:', error);
    process.exit(1);
  }
}

runDryRun();
