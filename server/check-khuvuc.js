require('dotenv').config();
const db = require('./config/db');

async function checkKhuVuc() {
  try {
    console.log('Checking khuvuc table...');
    
    // Get all provinces
    const [provinces] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID IS NULL');
    console.log('Provinces (ParentKhuVucID IS NULL):', provinces);

    if (provinces.length > 0) {
      const provinceId = provinces[0].KhuVucID;
      console.log('\nChecking districts for province', provinceId);
      const [districts] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [provinceId]);
      console.log('Districts:', districts);

      if (districts.length > 0) {
        const districtId = districts[0].KhuVucID;
        console.log('\nChecking wards for district', districtId);
        const [wards] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [districtId]);
        console.log('Wards:', wards);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKhuVuc();