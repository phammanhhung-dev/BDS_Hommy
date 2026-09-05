const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/operator/dashboard';

// Token test - bạn cần thay bằng token thật từ hệ thống
const TEST_TOKEN = 'your_test_token_here';

const axiosConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

async function testDashboardAPI() {
  try {
    console.log('=== TEST DASHBOARD API ===\n');

    // Test 1: GET /api/operator/dashboard/v2/stats
    console.log('1. Testing GET /api/operator/dashboard/v2/stats');
    try {
      const response = await axios.get(`${BASE_URL}/v2/stats`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    // Test 2: GET /api/operator/dashboard/v2/revenue-chart
    console.log('\n2. Testing GET /api/operator/dashboard/v2/revenue-chart');
    try {
      const response = await axios.get(`${BASE_URL}/v2/revenue-chart`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    // Test 3: GET /api/operator/dashboard/v2/occupancy
    console.log('\n3. Testing GET /api/operator/dashboard/v2/occupancy');
    try {
      const response = await axios.get(`${BASE_URL}/v2/occupancy`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    // Test 4: GET /api/operator/dashboard/v2/status-distribution
    console.log('\n4. Testing GET /api/operator/dashboard/v2/status-distribution');
    try {
      const response = await axios.get(`${BASE_URL}/v2/status-distribution`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    // Test 5: GET /api/operator/dashboard/v2/recent-listings?limit=5
    console.log('\n5. Testing GET /api/operator/dashboard/v2/recent-listings?limit=5');
    try {
      const response = await axios.get(`${BASE_URL}/v2/recent-listings?limit=5`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    // Test 6: GET /api/operator/dashboard/v2/upcoming-appointments
    console.log('\n6. Testing GET /api/operator/dashboard/v2/upcoming-appointments');
    try {
      const response = await axios.get(`${BASE_URL}/v2/upcoming-appointments`, axiosConfig);
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('   Error:', error.response ? error.response.data : error.message);
    }

    console.log('\n=== TEST HOÀN TẤT ===');
  } catch (error) {
    console.error('Lỗi test:', error);
  }
}

// Test trực tiếp với database mà không cần auth
async function testDirectDB() {
  const db = require('../../server/config/db');
  
  try {
    console.log('=== TEST TRỰC TIẾP DATABASE ===\n');

    // Test 1: Stats query
    console.log('1. Testing Stats Query');
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN td.TrangThai = 'Nhap' THEN 1 END) as Nhap,
        COUNT(CASE WHEN td.TrangThai = 'ChoDuyet' THEN 1 END) as ChoDuyet,
        COUNT(CASE WHEN td.TrangThai = 'DaDuyet' THEN 1 END) as DaDuyet,
        COUNT(CASE WHEN td.TrangThai = 'DaDang' THEN 1 END) as DaDang,
        COUNT(CASE WHEN td.TrangThai = 'TamNgung' THEN 1 END) as TamNgung,
        COUNT(CASE WHEN td.TrangThai = 'TuChoi' THEN 1 END) as TuChoi,
        COUNT(CASE WHEN td.TrangThai = 'LuuTru' THEN 1 END) as LuuTru,
        COUNT(*) as TongSoTinDang,
        COUNT(DISTINCT CASE 
          WHEN ch.ThoiGianHen >= CURDATE() 
          AND ch.ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          THEN ch.CuocHenID 
        END) as CuocHen7Ngay,
        COALESCE(SUM(CASE 
          WHEN gd.TrangThai = 'DaThanhToan' 
          AND MONTH(gd.ThoiGian) = MONTH(CURDATE()) 
          AND YEAR(gd.ThoiGian) = YEAR(CURDATE())
          THEN gd.SoTien 
          ELSE 0 
        END), 0) as DoanhThuThangNay
      FROM tindang td
      LEFT JOIN cuochen ch ON td.TinDangID = ch.TinDangID
      LEFT JOIN giaodich gd ON td.TinDangID = gd.TinDangLienQuanID
    `;
    const [stats] = await db.execute(statsQuery);
    console.log('   Kết quả:', stats[0]);

    // Test 2: Revenue chart query
    console.log('\n2. Testing Revenue Chart Query');
    const revenueQuery = `
      SELECT 
        DATE_FORMAT(gd.ThoiGian, '%Y-%m') as Thang,
        COALESCE(SUM(CASE 
          WHEN gd.TrangThai = 'DaThanhToan' 
          THEN gd.SoTien 
          ELSE 0 
        END), 0) as DoanhThu
      FROM giaodich gd
      WHERE gd.ThoiGian >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(gd.ThoiGian, '%Y-%m')
      ORDER BY Thang ASC
    `;
    const [revenue] = await db.execute(revenueQuery);
    console.log('   Kết quả:', revenue);

    // Test 3: Occupancy query
    console.log('\n3. Testing Occupancy Query');
    const occupancyQuery = `
      SELECT 
        d.DuAnID,
        d.TenDuAn,
        COUNT(*) as TongPhong,
        COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) as PhongDaThue,
        ROUND(
          (COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) * 100.0) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as TyLeLapDay
      FROM duan d
      LEFT JOIN phong p ON d.DuAnID = p.DuAnID
      GROUP BY d.DuAnID, d.TenDuAn
      ORDER BY TyLeLapDay DESC
    `;
    const [occupancy] = await db.execute(occupancyQuery);
    console.log('   Kết quả:', occupancy);

    // Test 4: Status distribution query
    console.log('\n4. Testing Status Distribution Query');
    const statusQuery = `
      SELECT 
        TrangThai,
        COUNT(*) as SoLuong
      FROM tindang
      GROUP BY TrangThai
      ORDER BY 
        CASE TrangThai
          WHEN 'DaDang' THEN 1
          WHEN 'ChoDuyet' THEN 2
          WHEN 'DaDuyet' THEN 3
          WHEN 'Nhap' THEN 4
          WHEN 'TamNgung' THEN 5
          WHEN 'TuChoi' THEN 6
          WHEN 'LuuTru' THEN 7
        END
    `;
    const [status] = await db.execute(statusQuery);
    console.log('   Kết quả:', status);

    // Test 5: Recent listings query
    console.log('\n5. Testing Recent Listings Query');
    const recentQuery = `
      SELECT 
        td.TinDangID,
        td.TieuDe,
        td.TrangThai,
        td.TaoLuc,
        td.DuAnID,
        d.TenDuAn
      FROM tindang td
      LEFT JOIN duan d ON td.DuAnID = d.DuAnID
      ORDER BY td.TaoLuc DESC
      LIMIT 5
    `;
    const [recent] = await db.execute(recentQuery);
    console.log('   Kết quả:', recent);

    // Test 6: Upcoming appointments query
    console.log('\n6. Testing Upcoming Appointments Query');
    const appointmentsQuery = `
      SELECT 
        ch.CuocHenID,
        ch.ThoiGianHen,
        ch.TrangThai as TrangThaiCuocHen,
        ch.PheDuyetChuDuAn,
        td.TinDangID,
        td.TieuDe as TieuDeTinDang,
        td.TrangThai as TrangThaiTinDang,
        d.TenDuAn,
        p.TenPhong,
        nd.TenDayDu as TenKhachHang,
        nv.TenDayDu as TenNhanVien
      FROM cuochen ch
      INNER JOIN tindang td ON ch.TinDangID = td.TinDangID
      LEFT JOIN duan d ON td.DuAnID = d.DuAnID
      LEFT JOIN phong p ON ch.PhongID = p.PhongID
      LEFT JOIN nguoidung nd ON ch.KhachHangID = nd.NguoiDungID
      LEFT JOIN nguoidung nv ON ch.NhanVienBanHangID = nv.NguoiDungID
      WHERE ch.ThoiGianHen >= CURDATE() 
      AND ch.ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY ch.ThoiGianHen ASC
      LIMIT 10
    `;
    const [appointments] = await db.execute(appointmentsQuery);
    console.log('   Kết quả:', appointments);

    console.log('\n=== TEST TRỰC TIẾP DATABASE HOÀN TẤT ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi test trực tiếp:', error);
    process.exit(1);
  }
}

// Chạy test trực tiếp database trước
testDirectDB();