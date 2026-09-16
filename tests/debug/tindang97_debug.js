const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'realestate'
  });

  const [tindang] = await connection.query('SELECT * FROM tindang WHERE TinDangID = 97');
  
  fs.writeFileSync(path.join(process.cwd(), 'tindang97_debug.json'), JSON.stringify(tindang, null, 2));
  console.log('Dumped tindang97_debug.json');
  process.exit(0);
}

main().catch(console.error);
