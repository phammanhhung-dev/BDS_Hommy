const http = require('http');

// Helper function để gửi HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test tạo tin đăng không gắn dự án
async function testCreateTinDangNoProject() {
  try {
    // 1. Đăng nhập để lấy token
    console.log('🔐 Đang đăng nhập...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'chuduantest@example.com',
      password: '123456'
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Đăng nhập thất bại:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Đăng nhập thành công, token:', token.substring(0, 20) + '...');

    // 2. Tạo tin đăng không gắn dự án (DuAnID = null)
    console.log('📝 Đang tạo tin đăng không gắn dự án...');
    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chu-du-an/tin-dang',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {
      DuAnID: null, // Không gắn dự án
      KhuVucID: 1,
      TieuDe: 'Test tin đăng không gắn dự án',
      MoTa: 'Đây là tin đăng test không gắn dự án',
      URL: [],
      TienIch: [],
      GiaDien: 500000,
      GiaNuoc: 300000,
      GiaDichVu: 200000,
      MoTaGiaDichVu: 'Phí dịch vụ bao gồm vệ sinh chung',
      TrangThai: 'Nhap',
      PhongIDs: [] // Không chọn phòng
    });

    console.log('📋 Kết quả tạo tin đăng:', createResponse);

    if (createResponse.status !== 201) {
      console.error('❌ Tạo tin đăng thất bại:', createResponse.data);
      return;
    }

    console.log('✅ Tạo tin đăng thành công!');
    console.log('📋 Response data:', createResponse.data);

    const tinDangId = createResponse.data.data.tinDangId;
    console.log('🆔 ID tin đăng mới:', tinDangId);

    // 3. Kiểm tra tin đăng trong danh sách "Tin đăng của tôi"
    console.log('🔍 Kiểm tra tin đăng trong danh sách...');
    const listResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chu-du-an/tin-dang',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Danh sách tin đăng:', listResponse.data);
    
    const foundTinDang = listResponse.data.data.tinDangs.find(td => td.TinDangID === tinDangId);
    if (foundTinDang) {
      console.log('✅ Tin đăng xuất hiện trong danh sách "Tin đăng của tôi"!');
      console.log('📋 Chi tiết tin đăng:', foundTinDang);
    } else {
      console.log('❌ Tin đăng KHÔNG xuất hiện trong danh sách!');
    }

    // 4. Kiểm tra chi tiết tin đăng
    console.log('🔍 Kiểm tra chi tiết tin đăng...');
    const detailResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/chu-du-an/tin-dang/${tinDangId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📋 Chi tiết tin đăng:', detailResponse.data.data);
    console.log('✅ Chi tiết tin đăng có ChuDuAnID:', detailResponse.data.data.ChuDuAnID);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

testCreateTinDangNoProject();
