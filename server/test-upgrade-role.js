/**
 * Test script cho API upgrade-role
 * Chạy: node test-upgrade-role.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials (user với role = 1 trong DB)
const TEST_USER = {
  email: 'khachang@gmail.com',
  password: '123456'  // Giả định password, cần kiểm tra thực tế
};

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data.success) {
      console.log('✅ Login thành công');
      console.log('   User ID:', response.data.user.NguoiDungID);
      console.log('   Role hiện tại:', response.data.user.VaiTroHoatDongID || response.data.user.VaiTroID);
      return response.data.token;
    } else {
      console.error('❌ Login thất bại:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Lỗi login:', error.response?.data || error.message);
    return null;
  }
}

async function testUpgradeRole(token, userId) {
  try {
    console.log('\n🔄 Đang gọi API upgrade-role...');
    console.log(`   Endpoint: ${BASE_URL}/api/users/${userId}/upgrade-role`);
    const response = await axios.put(
      `${BASE_URL}/api/users/${userId}/upgrade-role`,
      { targetRole: 3 },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Nâng cấp role thành công!');
      console.log('   Message:', response.data.message);
      console.log('   User sau nâng cấp:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.error('❌ Nâng cấp thất bại:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Lỗi nâng cấp role:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log('=== TEST API UPGRADE-ROLE ===\n');
  
  // Step 1: Login
  const token = await login();
  if (!token) {
    console.log('\n⚠️  Không thể login. Hãy kiểm tra lại email/password.');
    console.log('   User test hiện tại: khachang@gmail.com (ID: 7, Role: 1)');
    return;
  }
  
  // Step 2: Use hardcoded user ID (ID 7 = khachang@gmail.com)
  const userId = 7;
  
  // Step 3: Test upgrade role
  const success = await testUpgradeRole(token, userId);
  
  if (success) {
    console.log('\n🎉 TEST PASSED!');
    
    // Verify role was updated in DB
    console.log('\n🔍 Kiểm tra lại trong DB...');
    const db = require('./config/db');
    db.execute('SELECT NguoiDungID, TenDayDu, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ?', [userId])
      .then(([rows]) => {
        console.log('   User sau khi nâng cấp:', JSON.stringify(rows[0], null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error('   Lỗi kiểm tra DB:', err);
        process.exit(1);
      });
  } else {
    console.log('\n❌ TEST FAILED!');
    process.exit(1);
  }
}

main();