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

async function testLoginBothFormats() {
  try {
    console.log('🔍 Test 1: Đăng nhập với hash MD5 (chuduantest@example.com / 123456)...');
    
    const md5Login = await makeRequest({
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

    console.log('📋 Kết quả MD5:', md5Login.status === 200 ? '✅ Thành công' : '❌ Thất bại');
    if (md5Login.status === 200) {
      console.log('📝 Token:', md5Login.data.token.substring(0, 20) + '...');
    } else {
      console.log('📝 Lỗi:', md5Login.data);
    }

    console.log('\n🔍 Test 2: Đăng nhập với hash bcrypt (banhangtest@example.com / 123456)...');
    
    const bcryptLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'banhangtest@example.com',
      password: '123456'
    });

    console.log('📋 Kết quả bcrypt:', bcryptLogin.status === 200 ? '✅ Thành công' : '❌ Thất bại');
    if (bcryptLogin.status === 200) {
      console.log('📝 Token:', bcryptLogin.data.token.substring(0, 20) + '...');
    } else {
      console.log('📝 Lỗi:', bcryptLogin.data);
    }

    console.log('\n🔍 Test 3: Đăng nhập với hash bcrypt (banhang@gmail.com / 123456)...');
    
    const bcryptLogin2 = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'banhang@gmail.com',
      password: '123456'
    });

    console.log('📋 Kết quả bcrypt (banhang@gmail.com):', bcryptLogin2.status === 200 ? '✅ Thành công' : '❌ Thất bại');
    if (bcryptLogin2.status === 200) {
      console.log('📝 Token:', bcryptLogin2.data.token.substring(0, 20) + '...');
    } else {
      console.log('📝 Lỗi:', bcryptLogin2.data);
    }

    console.log('\n✅ Test hoàn tất!');
    console.log('   - MD5 hash: ' + (md5Login.status === 200 ? '✅ Đăng nhập được' : '❌ Không đăng nhập được'));
    console.log('   - bcrypt hash: ' + (bcryptLogin.status === 200 ? '✅ Đăng nhập được' : '❌ Không đăng nhập được'));

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

testLoginBothFormats();
