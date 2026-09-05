/**
 * Test script cho API Hợp đồng
 * @run node docs/test-hop-dong-api.js
 * 
 * HƯỚNG DẪN:
 * 1. Đảm bảo server đang chạy (npm start trong /server)
 * 2. Lấy JWT token từ login (hoặc dùng token có sẵn)
 * 3. Cập nhật TEST_TOKEN bên dưới
 * 4. Chạy: node docs/test-hop-dong-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // ⚠️ CẬP NHẬT TOKEN TẠI ĐÂY
const headers = { Authorization: `Bearer ${TEST_TOKEN}` };

async function runTests() {
  console.log('🧪 BẮT ĐẦU TEST HỢP ĐỒNG API');
  console.log('=====================================\n');

  try {
    // ============================================
    // TEST 1: Báo cáo hợp đồng
    // ============================================
    console.log('📝 TEST 1: POST /api/chu-du-an/hop-dong/bao-cao');
    console.log('Payload:');
    const baoCaoPayload = {
      TinDangID: 1,
      KhachHangID: 5,
      PhongID: 1,
      NgayBatDau: '2025-11-01',
      NgayKetThuc: '2026-10-31',
      GiaThueCuoiCung: 3000000,
      DoiTruCocVaoTienThue: false,
      NoiDungSnapshot: 'Test hợp đồng từ API test script'
    };
    console.log(JSON.stringify(baoCaoPayload, null, 2));

    try {
      const baoCaoRes = await axios.post(
        `${API_BASE}/api/chu-du-an/hop-dong/bao-cao`,
        baoCaoPayload,
        { headers }
      );
      console.log('✅ PASS - Báo cáo thành công');
      console.log('Response:', JSON.stringify(baoCaoRes.data, null, 2));
      console.log('');

      // ============================================
      // TEST 2: Lấy danh sách hợp đồng
      // ============================================
      console.log('📋 TEST 2: GET /api/chu-du-an/hop-dong');
      const listRes = await axios.get(
        `${API_BASE}/api/chu-du-an/hop-dong`,
        { headers }
      );
      console.log(`✅ PASS - Lấy được ${listRes.data.data.length} hợp đồng`);
      if (listRes.data.data.length > 0) {
        console.log('Mẫu hợp đồng đầu tiên:');
        console.log(JSON.stringify(listRes.data.data[0], null, 2));
      }
      console.log('');

      // ============================================
      // TEST 3: Lấy chi tiết hợp đồng
      // ============================================
      const hopDongId = baoCaoRes.data.data.HopDongID;
      console.log(`🔍 TEST 3: GET /api/chu-du-an/hop-dong/${hopDongId}`);
      const detailRes = await axios.get(
        `${API_BASE}/api/chu-du-an/hop-dong/${hopDongId}`,
        { headers }
      );
      console.log('✅ PASS - Chi tiết hợp đồng:');
      console.log(JSON.stringify(detailRes.data.data, null, 2));
      console.log('');

      // ============================================
      // TEST 4: Filter theo ngày
      // ============================================
      console.log('🔎 TEST 4: GET /api/chu-du-an/hop-dong?tuNgay=2025-10-01&denNgay=2025-12-31');
      const filterRes = await axios.get(
        `${API_BASE}/api/chu-du-an/hop-dong?tuNgay=2025-10-01&denNgay=2025-12-31`,
        { headers }
      );
      console.log(`✅ PASS - Lấy được ${filterRes.data.data.length} hợp đồng trong khoảng thời gian`);
      console.log('');

      console.log('=====================================');
      console.log('✅ TẤT CẢ TESTS PASSED!');
      console.log('=====================================');

    } catch (error) {
      handleError(error);
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
  }
}

function handleError(error) {
  console.error('❌ TEST FAILED');
  console.error('Status:', error.response?.status);
  console.error('Message:', error.response?.data?.message || error.message);
  if (error.response?.data) {
    console.error('Response data:', JSON.stringify(error.response.data, null, 2));
  }
  console.log('');
}

// ============================================
// RUN TESTS
// ============================================
if (TEST_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.error('⚠️ LỖI: Vui lòng cập nhật TEST_TOKEN trong file test-hop-dong-api.js');
  console.error('Cách lấy token:');
  console.error('1. Login vào hệ thống với role ChuDuAn');
  console.error('2. Mở DevTools > Application > Local Storage');
  console.error('3. Copy giá trị của key "token"');
  console.error('4. Paste vào TEST_TOKEN trong file này');
  process.exit(1);
}

runTests();
