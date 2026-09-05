require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== TEST 1: new_communes TOTAL count ===');
    const [ncTotal] = await db.query('SELECT COUNT(*) AS cnt FROM new_communes');
    console.log('new_communes total rows:', ncTotal[0].cnt);

    console.log('');
    console.log('=== TEST 2: new_districts row for DistrictID=1607 (Quận 12) ===');
    const [d12] = await db.query('SELECT * FROM new_districts WHERE DistrictID = 1607 LIMIT 1');
    console.log('new_districts Quận 12 row:', JSON.stringify(d12, null, 2));

    console.log('');
    console.log('=== TEST 3: Fallback query for legacy_communes with LIKE %(Quận 12)% ===');
    if (d12.length) {
      const district = d12[0];
      const [fallbackRows] = await db.query(
        `SELECT c.CommuneID AS KhuVucID,
                c.CommuneCode AS MaKhuVuc,
                c.CommuneName AS TenKhuVuc,
                c.ProvinceID,
                ? AS DistrictID
         FROM legacy_communes c
         WHERE c.ProvinceID = ?
           AND LOWER(c.CommuneName) LIKE CONCAT(\'%(\\'  \', LOWER(?), \')\\  \'%')
         ORDER BY c.CommuneName ASC`,
        [district.DistrictID, district.ProvinceID, district.DistrictName]
      );
      console.log('Fallback ward count for Quận 12:', fallbackRows.length);
      console.log('Fallback sample rows:', JSON.stringify(fallbackRows.slice(0,5), null, 2));
    } else {
      console.log('new_districts row NOT found for ID 1607');
    }

    console.log('');
    console.log('=== TEST 4: Get sample legacy_communes name format in HCMC ===');
    const [sampleNames] = await db.query(
      'SELECT CommuneID, CommuneName FROM legacy_communes WHERE ProvinceID = 50 ORDER BY CommuneName LIMIT 15'
    );
    console.log('HCMC legacy_communes sample:', JSON.stringify(sampleNames, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
