/**
 * Script kiểm tra nhanh API endpoints của Phòng Redesign
 * Chạy: node docs/test-phong-endpoints.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-test-token-here'; // Thay bằng token thực từ localStorage

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function test() {
  log('\n🧪 BẮT ĐẦU TEST PHÒNG REDESIGN API\n', 'blue');
  
  const testDuAnID = 1; // Thay bằng ID dự án test thực tế
  let testPhongID = null;
  let testTinDangID = null;
  
  try {
    // ========== TEST 1: Lấy danh sách phòng ==========
    log('TEST 1: GET /api/chu-du-an/du-an/:duAnID/phong', 'yellow');
    try {
      const response = await api.get(`/api/chu-du-an/du-an/${testDuAnID}/phong`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        log(`✅ PASS - Lấy được ${response.data.data.length} phòng`, 'green');
        log(`   Phòng đầu tiên: ${JSON.stringify(response.data.data[0], null, 2)}`, 'reset');
        
        if (response.data.data.length > 0) {
          testPhongID = response.data.data[0].PhongID;
          
          // Verify fields
          const phong = response.data.data[0];
          const requiredFields = ['PhongID', 'TenPhong', 'TrangThai', 'GiaChuan', 'DienTichChuan', 'SoTinDangDangDung'];
          const missingFields = requiredFields.filter(f => !(f in phong));
          
          if (missingFields.length === 0) {
            log('   ✓ Tất cả fields bắt buộc đều có', 'green');
          } else {
            log(`   ⚠ Thiếu fields: ${missingFields.join(', ')}`, 'red');
          }
        }
      } else {
        log('❌ FAIL - Response không đúng format', 'red');
      }
    } catch (error) {
      log(`❌ FAIL - ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`, 'red');
        log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
      }
    }
    
    // ========== TEST 2: Tạo phòng mới ==========
    log('\nTEST 2: POST /api/chu-du-an/du-an/:duAnID/phong', 'yellow');
    try {
      const newPhongData = {
        TenPhong: `Test-${Date.now()}`,
        GiaChuan: 3000000,
        DienTichChuan: 25,
        MoTaPhong: 'Phòng test tự động',
        TrangThai: 'Trong'
      };
      
      const response = await api.post(`/api/chu-du-an/du-an/${testDuAnID}/phong`, newPhongData);
      
      if (response.data.success && response.data.data?.PhongID) {
        testPhongID = response.data.data.PhongID;
        log(`✅ PASS - Tạo phòng thành công, PhongID: ${testPhongID}`, 'green');
      } else {
        log('❌ FAIL - Không tạo được phòng', 'red');
      }
    } catch (error) {
      log(`❌ FAIL - ${error.message}`, 'red');
      if (error.response) {
        log(`   ${JSON.stringify(error.response.data)}`, 'red');
      }
    }
    
    // ========== TEST 3: Lấy chi tiết phòng ==========
    if (testPhongID) {
      log('\nTEST 3: GET /api/chu-du-an/phong/:phongID', 'yellow');
      try {
        const response = await api.get(`/api/chu-du-an/phong/${testPhongID}`);
        
        if (response.data.success && response.data.data) {
          log('✅ PASS - Lấy chi tiết phòng thành công', 'green');
          log(`   Phòng: ${response.data.data.TenPhong}`, 'reset');
          log(`   Tin đăng đang dùng: ${response.data.data.DanhSachTinDang?.length || 0}`, 'reset');
        } else {
          log('❌ FAIL - Không lấy được chi tiết', 'red');
        }
      } catch (error) {
        log(`❌ FAIL - ${error.message}`, 'red');
      }
    }
    
    // ========== TEST 4: Tạo tin đăng với PhongIDs ==========
    if (testPhongID) {
      log('\nTEST 4: POST /api/chu-du-an/tin-dang (với PhongIDs)', 'yellow');
      try {
        const tinDangData = {
          DuAnID: testDuAnID,
          TieuDe: `Test tin đăng ${Date.now()}`,
          MoTa: 'Tin đăng test tự động',
          KhuVucID: 1,
          ChinhSachCocID: 1,
          URL: [],
          TienIch: ['WiFi', 'Máy lạnh'],
          TrangThai: 'Nhap',
          PhongIDs: [
            {
              PhongID: testPhongID,
              GiaTinDang: 2800000,
              MoTaTinDang: 'Ưu đãi test'
            }
          ]
        };
        
        const response = await api.post('/api/chu-du-an/tin-dang', tinDangData);
        
        if (response.data.success && response.data.data?.TinDangID) {
          testTinDangID = response.data.data.TinDangID;
          log(`✅ PASS - Tạo tin đăng thành công, TinDangID: ${testTinDangID}`, 'green');
        } else {
          log('❌ FAIL - Không tạo được tin đăng', 'red');
        }
      } catch (error) {
        log(`❌ FAIL - ${error.message}`, 'red');
        if (error.response) {
          log(`   ${JSON.stringify(error.response.data)}`, 'red');
        }
      }
    }
    
    // ========== TEST 5: Verify phong_tindang ==========
    if (testTinDangID && testPhongID) {
      log('\nTEST 5: Verify phong_tindang mapping', 'yellow');
      try {
        const response = await api.get(`/api/chu-du-an/tin-dang/${testTinDangID}`);
        
        if (response.data.success && response.data.data?.DanhSachPhong) {
          const phongTrongTin = response.data.data.DanhSachPhong.find(p => p.PhongID === testPhongID);
          
          if (phongTrongTin) {
            log('✅ PASS - Phòng đã được map vào tin đăng', 'green');
            log(`   Giá override: ${phongTrongTin.Gia?.toLocaleString()}đ`, 'reset');
            log(`   Mô tả override: ${phongTrongTin.MoTa || '(dùng mặc định)'}`, 'reset');
            
            // Verify override value
            if (phongTrongTin.Gia === 2800000) {
              log('   ✓ GiaTinDang override đúng', 'green');
            } else {
              log(`   ⚠ GiaTinDang không đúng (expect 2800000, got ${phongTrongTin.Gia})`, 'red');
            }
          } else {
            log('❌ FAIL - Không tìm thấy phòng trong tin đăng', 'red');
          }
        } else {
          log('❌ FAIL - Không lấy được chi tiết tin đăng', 'red');
        }
      } catch (error) {
        log(`❌ FAIL - ${error.message}`, 'red');
      }
    }
    
    // ========== TEST 6: Cập nhật phòng ==========
    if (testPhongID) {
      log('\nTEST 6: PUT /api/chu-du-an/phong/:phongID', 'yellow');
      try {
        const updateData = {
          GiaChuan: 3200000,
          MoTaPhong: 'Đã cập nhật qua test'
        };
        
        const response = await api.put(`/api/chu-du-an/phong/${testPhongID}`, updateData);
        
        if (response.data.success) {
          log('✅ PASS - Cập nhật phòng thành công', 'green');
        } else {
          log('❌ FAIL - Không cập nhật được', 'red');
        }
      } catch (error) {
        log(`❌ FAIL - ${error.message}`, 'red');
      }
    }
    
    // ========== TEST 7: Xóa phòng (nếu chưa có tin đăng) ==========
    // Skip test này vì đã có tin đăng sử dụng phòng
    log('\nTEST 7: DELETE /api/chu-du-an/phong/:phongID', 'yellow');
    log('⏭️  SKIP - Phòng đang được sử dụng bởi tin đăng, không thể xóa', 'magenta');
    
  } catch (error) {
    log(`\n❌ LỖI CHUNG: ${error.message}`, 'red');
  }
  
  log('\n✅ HOÀN THÀNH TẤT CẢ TESTS\n', 'blue');
  log('📝 Ghi chú:', 'yellow');
  log('   - Phòng test và tin đăng test vẫn còn trong DB', 'reset');
  log('   - Có thể xóa thủ công qua SQL hoặc UI', 'reset');
  log('   - Để test lại, thay đổi TEST_TOKEN và testDuAnID', 'reset');
}

// Check xem có token không
if (TEST_TOKEN === 'your-test-token-here') {
  log('\n⚠️  CẢNH BÁO: Vui lòng thay TEST_TOKEN bằng token thực tế', 'red');
  log('   1. Login vào hệ thống', 'yellow');
  log('   2. Mở DevTools > Application > Local Storage', 'yellow');
  log('   3. Copy giá trị của key "token"', 'yellow');
  log('   4. Paste vào biến TEST_TOKEN ở đầu file này\n', 'yellow');
  process.exit(1);
}

// Chạy test
test().catch(error => {
  log(`\n❌ CRITICAL ERROR: ${error.message}`, 'red');
  process.exit(1);
});
