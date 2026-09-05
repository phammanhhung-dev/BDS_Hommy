require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function backupLegacyCommunes() {
  try {
    console.log('=== STEP 1: BACKUP legacy_communes BEFORE schema change ===');
    console.log('READ-ONLY export\n');

    const [rows] = await db.query('SELECT * FROM legacy_communes');
    console.log('Exported', rows.length, 'rows from legacy_communes');

    if (rows.length === 0) {
      console.log('ERROR: Exported 0 rows - backup is empty!');
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'data', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, `legacy_communes_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2), 'utf8');
    
    console.log('Backup written to:', backupPath);
    console.log('Backup file size:', fs.statSync(backupPath).size, 'bytes');
    console.log('Backup confirmed non-empty - proceeding to Step 2\n');

    process.exit(0);
  } catch (error) {
    console.error('Error in backup:', error);
    process.exit(1);
  }
}

backupLegacyCommunes();
