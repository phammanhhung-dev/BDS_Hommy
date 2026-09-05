require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function testCurrentEndpoint() {
  try {
    console.log('=== TEST /api/address/wards/current/2 (HCMC) ===');
    const response = await axios.get('http://localhost:5000/api/address/wards/current/2');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Data count:', response.data.data.length);
    console.log('First 3 items:', JSON.stringify(response.data.data.slice(0, 3), null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

testCurrentEndpoint();
