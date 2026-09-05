require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function checkHCMCID() {
  try {
    console.log('=== CHECK HCMC ProvinceID in new_provinces ===');
    const [hcmc] = await db.query('SELECT ProvinceID, ProvinceName FROM new_provinces WHERE ProvinceName LIKE "%Hồ Chí Minh%"');
    console.log('HCMC in new_provinces:', JSON.stringify(hcmc, null, 2));
    
    const provinceId = hcmc[0].ProvinceID;
    console.log('Using ProvinceID:', provinceId);
    
    const [sample] = await db.query('SELECT * FROM new_communes WHERE ProvinceID = ? LIMIT 3', [provinceId]);
    console.log('Sample new_communes for HCMC:', JSON.stringify(sample, null, 2));
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

checkHCMCID();
