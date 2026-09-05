require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== POINT 1: legacy_communes schema ===');
    const [lcDesc] = await db.query('DESCRIBE legacy_communes');
    console.log('DESCRIBE legacy_communes:', JSON.stringify(lcDesc, null, 2));

    console.log('');
    console.log('=== POINT 1: SHOW TABLES LIKE legacy_% ===');
    const [legacyTables] = await db.query("SHOW TABLES LIKE 'legacy_%'");
    console.log('Legacy tables:', JSON.stringify(legacyTables, null, 2));

    console.log('');
    console.log('=== POINT 1: Describe each legacy table ===');
    for (const table of legacyTables) {
      const tableName = Object.values(table)[0];
      console.log(`\n--- DESCRIBE ${tableName} ---`);
      const [desc] = await db.query(`DESCRIBE ${tableName}`);
      console.log(JSON.stringify(desc, null, 2));
    }

    console.log('');
    console.log('=== POINT 5: legacy_communes CommuneCode patterns for Quận 12 vs Quận 1 ===');
    console.log('--- Sample 20 rows with CommuneCode, CommuneName (all HCMC for reference) ---');
    const [communeCodes] = await db.query('SELECT CommuneCode, CommuneName FROM legacy_communes WHERE ProvinceID = 50 ORDER BY CommuneCode LIMIT 40');
    console.log('CommuneCode, CommuneName samples:', JSON.stringify(communeCodes, null, 2));

    console.log('');
    console.log('=== POINT 6: new_districts schema ===');
    const [ndDesc] = await db.query('DESCRIBE new_districts');
    console.log('DESCRIBE new_districts:', JSON.stringify(ndDesc, null, 2));

    console.log('');
    console.log('=== POINT 6: Sample new_districts data for HCMC ===');
    const [ndSample] = await db.query('SELECT * FROM new_districts WHERE ProvinceID = 50 LIMIT 5');
    console.log('Sample new_districts rows:', JSON.stringify(ndSample, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
