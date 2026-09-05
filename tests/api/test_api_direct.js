const axios = require('axios');
const crypto = require('crypto');

const API_BASE = 'http://localhost:5000/api';

async function testRegistrationAndLogin() {
  const testEmail = `apitest${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  const testName = 'API Test User';
  const testPhone = `0${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  
  console.log('🔍 TEST 1: Đăng ký tài khoản mới');
  console.log('📝 Email:', testEmail);
  console.log('📝 Password:', testPassword);
  console.log('📝 Phone:', testPhone);
  
  try {
    // Register - gửi password RAW (giống frontend đăng ký)
    const registerRes = await axios.post(`${API_BASE}/register`, {
      name: testName,
      email: testEmail,
      phone: testPhone,
      password: testPassword, // RAW password
      roleId: 1
    });
    
    console.log('✅ Đăng ký thành công!');
    console.log('📝 Response:', JSON.stringify(registerRes.data, null, 2));
    
    console.log('\n🔍 TEST 2: Đăng nhập với password RAW (giống backend mong muốn)');
    try {
      const loginRawRes = await axios.post(`${API_BASE}/login`, {
        email: testEmail,
        password: testPassword // RAW password
      });
      console.log('✅ Đăng nhập thành công với password RAW!');
      console.log('📝 Response:', JSON.stringify(loginRawRes.data, null, 2));
    } catch (err) {
      console.log('❌ Đăng nhập thất bại với password RAW');
      console.log('📝 Error:', err.response?.data);
    }
    
    console.log('\n🔍 TEST 3: Đăng nhập với password đã hash MD5 (giống code frontend hiện tại)');
    const hashedPassword = crypto.createHash('md5').update(String(testPassword)).digest('hex');
    console.log('📝 Hashed password:', hashedPassword);
    
    try {
      const loginHashedRes = await axios.post(`${API_BASE}/login`, {
        email: testEmail,
        password: hashedPassword // HASHED password (như code hiện tại)
      });
      console.log('✅ Đăng nhập thành công với password đã hash!');
      console.log('📝 Response:', JSON.stringify(loginHashedRes.data, null, 2));
    } catch (err) {
      console.log('❌ Đăng nhập thất bại với password đã hash');
      console.log('📝 Error:', err.response?.data);
      console.log('📝 Status:', err.response?.status);
    }
    
  } catch (err) {
    console.error('❌ Lỗi:', err.response?.data || err.message);
  }
}

testRegistrationAndLogin();
