#!/usr/bin/env node

/**
 * Test Script: Verify Backend APIs
 * Purpose: Test tất cả 5 endpoints báo cáo trước khi integrate UI
 * Date: 2025-10-24
 * 
 * Usage: node migrations/test-backend-apis.js
 */

const API_BASE_URL = 'http://localhost:5000';
const API_PREFIX = '/api/chu-du-an';

// Mock JWT token - Replace với token thật từ login
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const endpoints = [
  {
    name: '1. Dashboard - Báo cáo tổng quan',
    method: 'GET',
    url: `${API_BASE_URL}${API_PREFIX}/bao-cao-hieu-suat`,
    description: 'Metrics nhanh cho Dashboard (tongTinDang, tinDangDangHoatDong, cuocHenSapToi, doanhThuThang)'
  },
  {
    name: '2. Báo cáo chi tiết',
    method: 'GET',
    url: `${API_BASE_URL}${API_PREFIX}/bao-cao-chi-tiet`,
    description: 'Full analytics cho trang Báo cáo (tất cả metrics + luotXemTheoGio)',
    params: { tuNgay: '2025-10-01', denNgay: '2025-10-24' }
  },
  {
    name: '3. Doanh thu theo tháng',
    method: 'GET',
    url: `${API_BASE_URL}${API_PREFIX}/bao-cao/doanh-thu-theo-thang`,
    description: '6 tháng gần nhất - Dùng cho LineChart revenue trend'
  },
  {
    name: '4. Top tin đăng',
    method: 'GET',
    url: `${API_BASE_URL}${API_PREFIX}/bao-cao/top-tin-dang`,
    description: 'Top 5 tin đăng hiệu quả nhất - Dùng cho BarChart',
    params: { tuNgay: '2025-10-01', denNgay: '2025-10-24' }
  },
  {
    name: '5. Conversion Rate',
    method: 'GET',
    url: `${API_BASE_URL}${API_PREFIX}/bao-cao/conversion-rate`,
    description: 'Tỷ lệ chuyển đổi cuộc hẹn - Dùng cho KPI card',
    params: { tuNgay: '2025-10-01', denNgay: '2025-10-24' }
  }
];

async function testEndpoint(endpoint) {
  const url = new URL(endpoint.url);
  
  if (endpoint.params) {
    Object.entries(endpoint.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${endpoint.name}`);
  console.log(`📝 Description: ${endpoint.description}`);
  console.log(`🔗 URL: ${url.toString()}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const startTime = Date.now();
    
    const response = await fetch(url.toString(), {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();

    console.log(`\n⏱️  Response Time: ${elapsed}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS`);
      console.log(`\n📦 Response Data Structure:`);
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      
      // Validate data structure
      if (endpoint.name.includes('Dashboard')) {
        const required = ['tongTinDang', 'tinDangDangHoatDong', 'cuocHenSapToi', 'doanhThuThang'];
        const missing = required.filter(key => !(key in (data.data || {})));
        if (missing.length > 0) {
          console.log(`\n⚠️  WARNING: Missing fields: ${missing.join(', ')}`);
        } else {
          console.log(`\n✅ All required fields present`);
        }
      }
      
    } else {
      console.log(`❌ FAILED`);
      console.log(`\n📦 Error Response:`);
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.log(`\n❌ NETWORK ERROR`);
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.log(`\n💡 Tip: Make sure backend server is running on ${API_BASE_URL}`);
      console.log(`   Run: cd server && npm start`);
    }
  }
}

async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                 BACKEND API TESTING - Báo cáo Module                   ║
╚════════════════════════════════════════════════════════════════════════╝
  `);

  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log(`\n⚠️  WARNING: Using mock JWT token`);
    console.log(`\n📝 To get real token:`);
    console.log(`   1. Login as ChuDuAn via /api/auth/login`);
    console.log(`   2. Copy token from response`);
    console.log(`   3. Replace JWT_TOKEN in this file\n`);
  }

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay 500ms giữa các requests
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Test suite completed`);
  console.log(`${'='.repeat(80)}\n`);
}

// Run tests
runTests().catch(console.error);
