const axios = require('axios');
const crypto = require('crypto');

const API_BASE = 'http://localhost:5000/api';

async function simulateFrontendFlow() {
  const testEmail = `frontendtest${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  const testName = 'Frontend Test User';
  const testPhone = `0${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  
  console.log('🔍 MÔ PHỎNG FLOW FRONTEND HIỆN TẠI');
  console.log('=====================================\n');
  
  // STEP 1: Đăng ký (frontend gửi password RAW)
  console.log('STEP 1: ĐĂNG KÝ TÀI KHOẢN');
  console.log('📝 Email:', testEmail);
  console.log('📝 Password:', testPassword);
  console.log('📝 Request Body:', JSON.stringify({
    name: testName,
    email: testEmail,
    phone: testPhone,
    password: testPassword, // RAW
    roleId: 1
  }, null, 2));
  
  try {
    const registerRes = await axios.post(`${API_BASE}/register`, {
      name: testName,
      email: testEmail,
      phone: testPhone,
      password: testPassword, // RAW
      roleId: 1
    });
    
    console.log('✅ Đăng ký thành công!');
    console.log('📝 Response Status:', registerRes.status);
    console.log('📝 Response Body:', JSON.stringify(registerRes.data, null, 2));
    
    // STEP 2: Đăng nhập (frontend hash password trước khi gửi - BUG!)
    console.log('\n\nSTEP 2: ĐĂNG NHẬP (FRONTEND HASH PASSWORD TRƯỚC KHI GỬI - BUG!)');
    console.log('📝 Email:', testEmail);
    console.log('📝 Password gốc:', testPassword);
    
    // Frontend hash password (như code hiện tại trong login/index.jsx line 24)
    const hashedPassword = crypto.createHash('md5').update(String(testPassword)).digest('hex');
    console.log('📝 Password sau khi hash MD5:', hashedPassword);
    
    console.log('📝 Request Body:', JSON.stringify({
      email: testEmail,
      password: hashedPassword // HASHED (BUG!)
    }, null, 2));
    
    try {
      const loginRes = await axios.post(`${API_BASE}/login`, {
        email: testEmail,
        password: hashedPassword // HASHED (BUG!)
      });
      
      console.log('✅ Đăng nhập thành công!');
      console.log('📝 Response Status:', loginRes.status);
      console.log('📝 Response Body:', JSON.stringify(loginRes.data, null, 2));
    } catch (err) {
      console.log('❌ Đăng nhập thất bại!');
      console.log('📝 Response Status:', err.response?.status);
      console.log('📝 Response Body:', JSON.stringify(err.response?.data, null, 2));
      console.log('📝 Error Message:', err.response?.data?.error);
    }
    
    // STEP 3: Đăng nhập đúng cách (gửi password RAW)
    console.log('\n\nSTEP 3: ĐĂNG NHẬP ĐÚNG CÁCH (GỬI PASSWORD RAW)');
    console.log('📝 Email:', testEmail);
    console.log('📝 Password:', testPassword);
    
    console.log('📝 Request Body:', JSON.stringify({
      email: testEmail,
      password: testPassword // RAW (ĐÚNG!)
    }, null, 2));
    
    try {
      const loginRes = await axios.post(`${API_BASE}/login`, {
        email: testEmail,
        password: testPassword // RAW (ĐÚNG!)
      });
      
      console.log('✅ Đăng nhập thành công!');
      console.log('📝 Response Status:', loginRes.status);
      console.log('📝 Response Body:', JSON.stringify(loginRes.data, null, 2));
    } catch (err) {
      console.log('❌ Đăng nhập thất bại!');
      console.log('📝 Response Status:', err.response?.status);
      console.log('📝 Response Body:', JSON.stringify(err.response?.data, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Lỗi:', err.response?.data || err.message);
  }
}

simulateFrontendFlow();
