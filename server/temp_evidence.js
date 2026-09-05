const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('./config/db');
(async () => {
  try {
    console.log('===DB20===');
    const [rows1] = await db.query('SELECT * FROM new_districts LIMIT 20');
    console.log(JSON.stringify(rows1, null, 2));

    const file = 'controllers/address.controller.js';
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    console.log('===GETDISTRICTS===');
    const startGetDistricts = 351;
    const endGetDistricts = 421;
    for (let i = startGetDistricts; i <= endGetDistricts && i <= lines.length; i++) {
      console.log(String(i).padStart(4, ' ') + ': ' + lines[i - 1]);
    }
    console.log('===GETWARDS===');
    const startGetWards = 424;
    const endGetWards = 494;
    for (let i = startGetWards; i <= endGetWards && i <= lines.length; i++) {
      console.log(String(i).padStart(4, ' ') + ': ' + lines[i - 1]);
    }

    console.log('===SEEDFILE===');
    const seedPath = 'scripts/seed-post_2025-safe.js';
    const seedText = fs.readFileSync(seedPath, 'utf8');
    process.stdout.write(seedText + '\n');

    console.log('===RGOUTPUT===');
    let rgcmd = 'rg -n "ProvinceCode" --glob "*.js" --glob "*.jsx"';
    try {
      const rg = execSync(rgcmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      process.stdout.write(rg);
    } catch (err) {
      process.stdout.write('RG_FAILED_COMMAND:' + rgcmd + '\n');
      process.stdout.write(String(err.stdout || ''));
      process.stdout.write(String(err.stderr || ''));
      process.stdout.write('===GITGREP_FALLBACK===\n');
      try {
        const gg = execSync('git grep -n "ProvinceCode" -- "*.js" "*.jsx"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        process.stdout.write(gg);
      } catch (err2) {
        process.stdout.write('GITGREP_FAILED\n');
        process.stdout.write(String(err2.stdout || ''));
        process.stdout.write(String(err2.stderr || ''));
      }
    }

    console.log('===BACKUPS_DIR===');
    const bdir = 'data/backups';
    if (fs.existsSync(bdir)) {
      const entries = fs.readdirSync(bdir).sort();
      entries.forEach(e => console.log(e));
      if (entries.length > 0) {
        const first = entries[0];
        console.log('===BACKUP_FILE===');
        console.log(first);
        const content = fs.readFileSync(path.join(bdir, first), 'utf8');
        content.split(/\r?\n/).slice(0, 20).forEach(line => console.log(line));
      }
    } else {
      console.log('NO_BACKUPS_DIR');
    }
  } catch (err) {
    console.error('ERROR', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
