require('dotenv').config();
const db = require('./config/db');

async function checkKhuVuc() {
  try {
    // Check Bình Dương (KhuVucID 13)
    const provinceId = 13;
    console.log('\nChecking districts for province', provinceId);
    const [districts] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [provinceId]);
    console.log('Districts:', districts.map(d => ({ id: d.KhuVucID, name: d.TenKhuVuc })));

    if (districts.length > 0) {
      for (const district of districts) {
        const [ws] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [district.KhuVucID]);
        console.log(`District ${district.TenKhuVuc} (${district.KhuVucID}) has ${ws.length} wards`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKhuVuc();