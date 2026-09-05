const mysql = require('mysql2/promise');
require('dotenv').config({path: '../.env'});

async function fix() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST||'localhost',
    user: process.env.DB_USER||'root',
    password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'realestate'
  });

  console.log("Updating legacy_communes DistrictID using new_communes CommuneCode...");
  const [res] = await c.query(`
    UPDATE legacy_communes c 
    JOIN new_communes n ON c.CommuneCode = n.CommuneCode 
    SET c.DistrictID = n.DistrictID 
    WHERE c.DistrictID IS NULL
  `);
  console.log('Updated rows based on CommuneCode:', res.affectedRows);

  const [res2] = await c.query('SELECT COUNT(*) as cnt FROM legacy_communes WHERE DistrictID IS NULL');
  console.log('Remaining NULLs:', res2[0].cnt);
  process.exit(0);
}
fix();
