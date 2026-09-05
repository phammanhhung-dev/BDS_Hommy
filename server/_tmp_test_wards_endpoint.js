require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function testWardsEndpoint() {
  try {
    console.log('=== STEP 5: BACKEND VERIFICATION ===');
    console.log('Testing GET /api/address/wards/1607 (Quận 12)\n');

    const response = await axios.get('http://localhost:5000/api/address/wards/1607');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Data count:', response.data.data.length);
    console.log('');

    // Test control case with Hà Nội (should still be empty)
    console.log('=== CONTROL CASE: Hà Nội (should still be empty) ===');
    try {
      const hanoiResponse = await axios.get('http://localhost:5000/api/address/wards/1');
      console.log('Hà Nội response:', JSON.stringify(hanoiResponse.data, null, 2));
    } catch (e) {
      console.log('Hà Nội endpoint returned:', e.response ? e.response.status : 'error');
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    process.exit(1);
  }
}

testWardsEndpoint();
