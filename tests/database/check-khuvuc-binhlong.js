require('dotenv').config();
const db = require('../../server/config/db');

async function checkKhuVuc() {
  try {
    // Check Thị xã Bình Long (KhuVucID 150)
    const districtId = 150;
    console.log('\nChecking wards for district', districtId);
    const [wards] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [districtId]);
    console.log('Wards count:', wards.length);
    console.log('Wards:', wards);

    // Also check all districts in Bình Phước (province 14)
    const [districts] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = 14');
    for (const district of districts) {
      const [ws] = await db.execute('SELECT * FROM khuvuc WHERE ParentKhuVucID = ?', [district.KhuVucID]);
      console.log(`District ${district.TenKhuVuc} (${district.KhuVucID}) has ${ws.length} wards`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkKhuVuc();