const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({path: '../.env'});

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'post_2025.json');

const COMMUNE_TYPE_MAP = {
  xa: 'Xã',
  phuong: 'Phường',
  phường: 'Phường',
  xã: 'Xã',
  thitran: 'Thị trấn',
  'thị trấn': 'Thị trấn',
  thi_tran: 'Thị trấn',
  huyen: 'Huyện',
  quan: 'Quận'
};

function normalizeProvinceName(pathWithType) {
  const parts = String(pathWithType)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(pathWithType).trim();
}

function normalizeCommuneType(rawType) {
  if (!rawType) return '';
  const key = String(rawType).trim().toLowerCase();
  if (COMMUNE_TYPE_MAP[key]) {
    return COMMUNE_TYPE_MAP[key];
  }
  return key
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

async function fix() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST||'localhost',
    user: process.env.DB_USER||'root',
    password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'realestate'
  });

  console.log("Loading post_2025.json...");
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);
  const entries = Object.values(data);

  // Fetch current provinces
  const [dbProvinces] = await c.query('SELECT ProvinceID, ProvinceName FROM new_provinces');
  
  // Normalize db province names for robust matching
  const provMap = new Map();
  for (const p of dbProvinces) {
    const cleanName = p.ProvinceName.toLowerCase()
      .replace('thành phố ', '')
      .replace('tỉnh ', '')
      .trim();
    provMap.set(cleanName, p.ProvinceID);
  }

  const communesToInsert = [];
  let matchCount = 0;
  let unmatchCount = 0;

  for (const entry of entries) {
    const rawProvName = normalizeProvinceName(entry.path_with_type);
    const cleanProvName = rawProvName.toLowerCase()
      .replace('thành phố ', '')
      .replace('thủ đô ', '')
      .replace('tỉnh ', '')
      .trim();
    
    const provId = provMap.get(cleanProvName);
    
    if (provId) {
      matchCount++;
      const communeName = String(entry.name_with_type || '').trim();
      const communeCode = String(entry.code || entry.ward_code || entry.CommuneCode || '').trim() || String(entry.name_with_type).replace(/\s+/g, '-');
      const communeType = normalizeCommuneType(entry.type) || 'Phường';
      
      communesToInsert.push([provId, communeCode, communeName, communeType]);
    } else {
      unmatchCount++;
      console.log('Unmatched province:', rawProvName);
    }
  }

  console.log(`Matched ${matchCount} communes to provinces. Unmatched: ${unmatchCount}`);

  await c.query('SET FOREIGN_KEY_CHECKS = 0');
  console.log('Truncating new_communes...');
  await c.query('TRUNCATE TABLE new_communes');
  
  if (communesToInsert.length > 0) {
    console.log(`Inserting ${communesToInsert.length} 2-level communes into new_communes...`);
    // insert in chunks of 1000
    for(let i=0; i<communesToInsert.length; i+=1000) {
        const chunk = communesToInsert.slice(i, i+1000);
        await c.query('INSERT INTO new_communes (ProvinceID, CommuneCode, CommuneName, CommuneType) VALUES ?', [chunk]);
    }
  }
  
  await c.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Done mapping 2-level addresses.');
  process.exit(0);
}
fix();
