const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000/api/operator/dashboard';
const AUTH_URL = 'http://localhost:5000/api';

async function testDashboardHTTP() {
  try {
    console.log('=== TEST DASHBOARD API (HTTP) ===\n');

    // Step 1: Login to get token
    console.log('Step 1: Login với tài khoản Admin');
    try {
      // Tạo MD5 hash của password "123456"
      const password = '123456';
      const passwordHash = crypto.createHash('md5').update(password).digest('hex');
      
      console.log(`   Password: ${password}`);
      console.log(`   MD5 Hash: ${passwordHash}`);
      
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: 'hethong@gmail.com',
        password: passwordHash // Sử dụng MD5 hash thay vì plain text
      });
      
      console.log('   Login Status:', loginResponse.status);
      console.log('   Login Response:', JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.data.success && loginResponse.data.token) {
        const token = loginResponse.data.token;
        console.log('   ✅ Đã lấy token thành công');
        
        const axiosConfig = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        // Test 1: GET /api/operator/dashboard/stats
        console.log('\n1. Testing GET /api/operator/dashboard/stats');
        try {
          const response = await axios.get(`${BASE_URL}/stats`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }

        // Test 2: GET /api/operator/dashboard/revenue-chart
        console.log('\n2. Testing GET /api/operator/dashboard/revenue-chart');
        try {
          const response = await axios.get(`${BASE_URL}/revenue-chart`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }

        // Test 3: GET /api/operator/dashboard/occupancy
        console.log('\n3. Testing GET /api/operator/dashboard/occupancy');
        try {
          const response = await axios.get(`${BASE_URL}/occupancy`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }

        // Test 4: GET /api/operator/dashboard/status-distribution
        console.log('\n4. Testing GET /api/operator/dashboard/status-distribution');
        try {
          const response = await axios.get(`${BASE_URL}/status-distribution`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }

        // Test 5: GET /api/operator/dashboard/recent-listings?limit=5
        console.log('\n5. Testing GET /api/operator/dashboard/recent-listings?limit=5');
        try {
          const response = await axios.get(`${BASE_URL}/recent-listings?limit=5`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }

        // Test 6: GET /api/operator/dashboard/upcoming-appointments
        console.log('\n6. Testing GET /api/operator/dashboard/upcoming-appointments');
        try {
          const response = await axios.get(`${BASE_URL}/upcoming-appointments`, axiosConfig);
          console.log('   Status:', response.status);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
          console.log('   Error:', error.response ? error.response.data : error.message);
        }
      } else {
        console.log('   ❌ Login thất bại, không thể lấy token');
      }
    } catch (error) {
      console.log('   Login Error:', error.response ? error.response.data : error.message);
    }

    console.log('\n=== TEST HTTP HOÀN TẤT ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi test HTTP:', error);
    process.exit(1);
  }
}

testDashboardHTTP();