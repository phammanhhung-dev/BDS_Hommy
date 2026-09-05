const db = require('../../server/config/db');

async function checkIntegrity() {
  try {
    const [provinces] = await db.execute('SELECT * FROM new_provinces ORDER BY ProvinceID');
    const [legacyProvinces] = await db.execute('SELECT * FROM legacy_provinces ORDER BY ProvinceID');
    
    console.log(`Total new_provinces: ${provinces.length}`);
    console.log(`Total legacy_provinces: ${legacyProvinces.length}`);
    
    let newMissingDistricts = [];
    let newWithDistricts = 0;
    
    for (const p of provinces) {
         const [districts] = await db.execute('SELECT * FROM new_districts WHERE ProvinceID = ?', [p.ProvinceID]);
         if (districts.length === 0) {
              newMissingDistricts.push(p.ProvinceName);
         } else {
              newWithDistricts++;
         }
    }
    
    console.log(`new_provinces WITH districts: ${newWithDistricts}`);
    console.log(`new_provinces MISSING districts: ${newMissingDistricts.length} (${newMissingDistricts.join(', ')})`);
    
    // Check specific provinces from image 2: Hanoi, Da Nang, Binh Duong, Dong Nai, HCM
    const targetNames = ['Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Hồ Chí Minh'];
    console.log('\n--- Status of Target Provinces in NEW tables ---');
    for (const p of provinces) {
         if (targetNames.some(name => p.ProvinceName.includes(name))) {
              const [districts] = await db.execute('SELECT * FROM new_districts WHERE ProvinceID = ?', [p.ProvinceID]);
              console.log(`[NEW] ${p.ProvinceName}: ${districts.length} districts`);
         }
    }
    
    console.log('\n--- Status of Target Provinces in LEGACY tables ---');
    for (const p of legacyProvinces) {
         if (targetNames.some(name => p.ProvinceName.includes(name))) {
              // Wait, legacy structure: legacy_communes has ProvinceID, DistrictID
              const [communes] = await db.execute('SELECT * FROM legacy_communes WHERE ProvinceID = ?', [p.ProvinceID]);
              // legacy_communes doesn't necessarily have a legacy_districts table in this DB! Let's count unique DistrictID if it exists, or just communes
              const uniqueDistricts = new Set(communes.map(c => c.DistrictID).filter(id => id));
              console.log(`[LEGACY] ${p.ProvinceName}: ${uniqueDistricts.size} distinct districts (based on DistrictID in legacy_communes), ${communes.length} communes`);
         }
    }
    
    // Total count of new_districts and new_communes
    const [distTotal] = await db.execute('SELECT COUNT(*) as cnt FROM new_districts');
    const [commTotal] = await db.execute('SELECT COUNT(*) as cnt FROM new_communes');
    console.log(`\nTotal new_districts rows: ${distTotal[0].cnt}`);
    console.log(`Total new_communes rows: ${commTotal[0].cnt}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkIntegrity();
