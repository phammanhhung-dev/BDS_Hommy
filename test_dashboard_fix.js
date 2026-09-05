const db = require('./server/config/db');

async function testDashboardQueries() {
  try {
    console.log('=== Testing Dashboard Queries After Fix ===\n');

    // Test 1: layThongKePhong
    console.log('1. Testing layThongKePhong (ChuDuAnID = 1)...');
    const [thongKePhong] = await db.execute(`
      SELECT
        COUNT(*) as TongPhong,
        SUM(CASE WHEN p.TrangThai = 'Trong' THEN 1 ELSE 0 END) as PhongTrong,
        SUM(CASE WHEN p.TrangThai = 'GiuCho' THEN 1 ELSE 0 END) as PhongGiuCho,
        SUM(CASE WHEN p.TrangThai = 'DaThue' THEN 1 ELSE 0 END) as PhongDaThue,
        SUM(CASE WHEN p.TrangThai = 'DonDep' THEN 1 ELSE 0 END) as PhongDonDep
      FROM phong p
      INNER JOIN duan da ON p.DuAnID = da.DuAnID
      WHERE da.ChuDuAnID = ?
    `, [1]);
    console.log('✓ layThongKePhong succeeded:', thongKePhong[0]);

    // Test 2: layDanhSachDuAn (simplified)
    console.log('\n2. Testing layDanhSachDuAn (ChuDuAnID = 1)...');
    const [danhSachDuAn] = await db.execute(`
      SELECT
        da.DuAnID,
        da.TenDuAn,
        da.TrangThai,
        da.DiaChi,
        da.TaoLuc,
        da.CapNhatLuc,
        da.YeuCauPheDuyetChu,
        da.NguoiNgungHoatDongID,
        da.LyDoNgungHoatDong,
        da.NguoiXuLyYeuCauID,
        da.LyDoTuChoiMoLai
      FROM duan da
      WHERE da.ChuDuAnID = ?
      ORDER BY da.TrangThai DESC, da.CapNhatLuc DESC
      LIMIT 5
    `, [1]);
    console.log('✓ layDanhSachDuAn succeeded, found', danhSachDuAn.length, 'projects');

    console.log('\n=== All tests passed! ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
  }
}

testDashboardQueries();
