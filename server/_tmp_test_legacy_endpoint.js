require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function testLegacyEndpoint() {
  try {
    console.log('=== TEST /api/address/wards/1607 (Quận 12 legacy) ===');
    const response = await axios.get('http://localhost:5000/api/address/wards/1607');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Data count:', response.data.data.length);
    console.log('All items:', JSON.stringify(response.data.data, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testLegacyEndpoint();
