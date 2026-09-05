const axios = require('axios');

async function testKhuVucTree() {
  try {
    console.log('🔍 Testing GET /api/khuvucs/tree...');
    
    const response = await axios.get('http://localhost:5000/api/khuvucs/tree');
    
    console.log('✅ Status:', response.status);
    console.log('📋 Response data (first 500 chars):');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
    
    console.log('\n📋 Full response structure:');
    console.log('Total root nodes:', response.data.length);
    
    if (response.data.length >= 2) {
      console.log('\n📋 Root node 1 (Legacy):');
      console.log('KhuVucID:', response.data[0].KhuVucID);
      console.log('TenKhuVuc:', response.data[0].TenKhuVuc);
      console.log('Type:', response.data[0].type);
      console.log('Children count:', response.data[0].children?.length || 0);
      
      if (response.data[0].children?.length > 0) {
        console.log('First province:', response.data[0].children[0]);
        if (response.data[0].children[0].children?.length > 0) {
          console.log('First commune:', response.data[0].children[0].children[0]);
        }
      }
      
      console.log('\n📋 Root node 2 (New):');
      console.log('KhuVucID:', response.data[1].KhuVucID);
      console.log('TenKhuVuc:', response.data[1].TenKhuVuc);
      console.log('Type:', response.data[1].type);
      console.log('Children count:', response.data[1].children?.length || 0);
      
      if (response.data[1].children?.length > 0) {
        console.log('First province:', response.data[1].children[0]);
        if (response.data[1].children[0].children?.length > 0) {
          console.log('First commune:', response.data[1].children[0].children[0]);
        }
      }
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

testKhuVucTree();
