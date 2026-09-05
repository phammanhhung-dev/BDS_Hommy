require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== Check HCMC rows WITH parentheses ===');
    const [hcmcParen] = await db.query(
      `SELECT CommuneID, CommuneName 
       FROM legacy_communes 
       WHERE ProvinceID = 50 
         AND CommuneName LIKE '%(%'
       LIMIT 20`
    );
    console.log('HCMC rows with parentheses count:', hcmcParen.length);
    console.log('HCMC rows with parentheses:', JSON.stringify(hcmcParen, null, 2));

    console.log('');
    console.log('=== Check ALL provinces that HAVE parentheses ===');
    const [provWithParen] = await db.query(
      `SELECT ProvinceID, COUNT(*) as cnt 
       FROM legacy_communes 
       WHERE CommuneName LIKE '%(%'
       GROUP BY ProvinceID
       ORDER BY cnt DESC`
    );
    console.log('Provinces with parentheses in CommuneName:', JSON.stringify(provWithParen, null, 2));

    console.log('');
    console.log('=== Check HCMC rows WITHOUT parentheses ===');
    const [hcmcNoParen] = await db.query(
      `SELECT COUNT(*) as cnt 
       FROM legacy_communes 
       WHERE ProvinceID = 50 
         AND CommuneName NOT LIKE '%(%'`
    );
    console.log('HCMC rows WITHOUT parentheses count:', hcmcNoParen[0].cnt);

    console.log('');
    console.log('=== Total HCMC rows ===');
    const [hcmcTotal] = await db.query(
      `SELECT COUNT(*) as cnt 
       FROM legacy_communes 
       WHERE ProvinceID = 50`
    );
    console.log('Total HCMC rows:', hcmcTotal[0].cnt);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
