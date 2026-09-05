const mysql = require('mysql2/promise');
require('dotenv').config({path: '../.env'});

async function clean() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST||'localhost',
    user: process.env.DB_USER||'root',
    password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'realestate'
  });

  console.log("Fetching legacy_communes to clean suffixes...");
  const [rows] = await c.query("SELECT CommuneID, CommuneName FROM legacy_communes WHERE CommuneName LIKE '%(%)'");
  
  console.log(`Found ${rows.length} communes with parentheses in their name.`);
  
  let updateCount = 0;
  
  // Clean names by removing the trailing parenthesized part
  for (const row of rows) {
    const cleaned = row.CommuneName.replace(/\s*\([^)]+\)$/, '');
    
    if (cleaned !== row.CommuneName) {
      await c.query("UPDATE legacy_communes SET CommuneName = ? WHERE CommuneID = ?", [cleaned, row.CommuneID]);
      updateCount++;
    }
  }

  console.log(`Successfully cleaned ${updateCount} commune names.`);
  process.exit(0);
}
clean();
