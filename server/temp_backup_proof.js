const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BACKUP_DIR = path.resolve(__dirname, 'data', 'backups');

const TABLES = ['new_provinces', 'new_communes', 'new_districts'];

(async () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'realestate'
    });
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    for (const table of TABLES) {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\` LIMIT 5`);
      const outPath = path.join(BACKUP_DIR, `proof_backup_${table}_${now}.json`);
      fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
      console.log(outPath);
    }
    await connection.end();
  } catch (error) {
    console.error('ERROR', error.stack || error);
    process.exit(1);
  }
})();
