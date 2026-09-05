require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== Test LIKE query with Quận 12 for rows WITH parentheses ===');
    const [likeWithParen] = await db.query(
      `SELECT c.CommuneID, c.CommuneName 
       FROM legacy_communes c 
       WHERE c.ProvinceID = 50 
         AND LOWER(c.CommuneName) LIKE CONCAT('%(', LOWER(?), ')%')`,
      ['Quận 12']
    );
    console.log('LIKE query result count:', likeWithParen.length);
    console.log('LIKE query result rows:', JSON.stringify(likeWithParen, null, 2));

    console.log('');
    console.log('=== Test for rows WITHOUT parentheses ===');
    const [noParen] = await db.query(
      `SELECT c.CommuneID, c.CommuneName 
       FROM legacy_communes c 
       WHERE c.ProvinceID = 50 
         AND c.CommuneName NOT LIKE '%(%'
       LIMIT 10`
    );
    console.log('Rows without parentheses (sample):', JSON.stringify(noParen, null, 2));

    console.log('');
    console.log('=== Test LIKE query with Quận 1 ===');
    const [likeQ1] = await db.query(
      `SELECT c.CommuneID, c.CommuneName 
       FROM legacy_communes c 
       WHERE c.ProvinceID = 50 
         AND LOWER(c.CommuneName) LIKE CONCAT('%(', LOWER(?), ')%')`,
      ['Quận 1']
    );
    console.log('LIKE query for Quận 1 count:', likeQ1.length);
    console.log('LIKE query for Quận 1 rows:', JSON.stringify(likeQ1, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
