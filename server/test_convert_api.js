// Test API convertLegacyAddress thật
const axios = require('axios');

async function testConvertAPI() {
  try {
    console.log('🔍 Testing POST /api/address/convert...');
    
    const payload = {
      provinceId: 1,
      legacyDistrictId: 2,
      legacyWardId: 1
    };
    
    console.log('📋 Payload:', payload);
    
    const response = await axios.post('http://localhost:5000/api/address/convert', payload);
    
    console.log('✅ Status:', response.status);
    console.log('📋 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testConvertAPI();
