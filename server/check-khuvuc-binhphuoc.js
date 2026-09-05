require('dotenv').config();
const db = require('./config/db');

async function checkKhuVuc() {
  try {
    console.log('Checking khuvuc table...');
    
    // Check Bình Phước (KhuVucID 14)
    const provinceId = 14;
    console.log('\nChecking districts for province', provinceId);
    const [districts] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [provinceId]);
    console.log('Districts:', districts.map(d => ({ id: d.KhuVucID, name: d.TenKhuVuc })));

    if (districts.length > 0) {
      // Check first district in Bình Phước
      const districtId = districts[0].KhuVucID;
      console.log('\nChecking wards for district', districtId, districts[0].TenKhuVuc);
      const [wards] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [districtId]);
      console.log('Wards count:', wards.length);
      console.log('Wards:', wards);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKhuVuc();