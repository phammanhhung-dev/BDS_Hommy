const ChuDuAnModel = require('./server/models/ChuDuAnModel');
const BaoCaoHieuSuatModel = require('./server/models/BaoCaoHieuSuatModel');

async function testDashboardAPIs() {
  try {
    console.log('=== Testing Dashboard APIs (ChuDuAnID = 1) ===\n');

    // Test 1: layThongKePhong
    console.log('1. Testing layThongKePhong...');
    const thongKePhong = await ChuDuAnModel.layThongKePhong(1);
    console.log('✓ layThongKePhong:', thongKePhong);

    // Test 2: layDanhSachDuAn
    console.log('\n2. Testing layDanhSachDuAn...');
    const danhSachDuAn = await ChuDuAnModel.layDanhSachDuAn(1);
    console.log('✓ layDanhSachDuAn: found', danhSachDuAn.length, 'projects');

    // Test 3: layBaoCaoHieuSuat
    console.log('\n3. Testing layBaoCaoHieuSuat...');
    const baoCaoHieuSuat = await BaoCaoHieuSuatModel.layBaoCaoHieuSuat(1);
    console.log('✓ layBaoCaoHieuSuat:', baoCaoHieuSuat);

    // Test 4: layDoanhThuTheoThang
    console.log('\n4. Testing layDoanhThuTheoThang...');
    const doanhThuTheoThang = await BaoCaoHieuSuatModel.layDoanhThuTheoThang(1);
    console.log('✓ layDoanhThuTheoThang: found', doanhThuTheoThang.length, 'months');

    // Test 5: layTopTinDang
    console.log('\n5. Testing layTopTinDang...');
    const topTinDang = await BaoCaoHieuSuatModel.layTopTinDang(1);
    console.log('✓ layTopTinDang: found', topTinDang.length, 'listings');

    // Test 6: layConversionRate
    console.log('\n6. Testing layConversionRate...');
    const conversionRate = await BaoCaoHieuSuatModel.layConversionRate(1);
    console.log('✓ layConversionRate:', conversionRate);

    // Test 7: layLuotXemTheoGio
    console.log('\n7. Testing layLuotXemTheoGio...');
    const luotXemTheoGio = await BaoCaoHieuSuatModel.layLuotXemTheoGio(1);
    console.log('✓ layLuotXemTheoGio: found', luotXemTheoGio.length, 'hours');

    console.log('\n=== All Dashboard API tests passed! ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDashboardAPIs();
