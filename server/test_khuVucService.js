// Test KhuVucService.layDanhSach() thật
// Script này chỉ test API backend /api/khuvucs, không dùng frontend service

const axios = require('axios');

async function testKhuVucAPI() {
  try {
    console.log('🔍 Testing GET /api/khuvucs?parentId=root...');
    
    const response = await axios.get('http://localhost:5000/api/khuvucs?parentId=root');
    
    console.log('✅ Status:', response.status);
    console.log('📋 Response data length:', response.data.length);
    
    // Xem vài mẫu dữ liệu
    console.log('📋 Sample data (first 5):');
    console.table(response.data.slice(0, 5));
    
    // Kiểm tra cấu trúc
    if (response.data.length > 0) {
      console.log('📋 First item structure:', response.data[0]);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testKhuVucAPI();
