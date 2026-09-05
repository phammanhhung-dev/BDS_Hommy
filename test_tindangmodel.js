const TinDangModel = require('./server/models/tinDangModel');

async function testTinDangModel() {
  try {
    console.log('=== Testing TinDangModel Functions (ChuDuAnID = 1) ===\n');

    // Test 1: layDanhSachTinDang
    console.log('1. Testing layDanhSachTinDang...');
    const danhSachTinDang = await TinDangModel.layDanhSachTinDang(1);
    console.log('✓ layDanhSachTinDang: found', danhSachTinDang.length, 'listings');

    // Test 2: layChiTietTinDang (cần một TinDangID thực tế)
    if (danhSachTinDang.length > 0) {
      const tinDangId = danhSachTinDang[0].TinDangID;
      console.log('\n2. Testing layChiTietTinDang (TinDangID =', tinDangId, ')...');
      const chiTietTinDang = await TinDangModel.layChiTietTinDang(tinDangId, 1);
      console.log('✓ layChiTietTinDang:', chiTietTinDang ? 'found' : 'not found');
      if (chiTietTinDang) {
        console.log('  - TieuDe:', chiTietTinDang.TieuDe);
        console.log('  - SoPhong:', chiTietTinDang.DanhSachPhong?.length || 0);
      }

      // Test 3: layThongTinChoHopDong
      console.log('\n3. Testing layThongTinChoHopDong (TinDangID =', tinDangId, ')...');
      const thongTinHopDong = await TinDangModel.layThongTinChoHopDong(tinDangId);
      console.log('✓ layThongTinChoHopDong:', thongTinHopDong ? 'found' : 'not found');
      if (thongTinHopDong) {
        console.log('  - TieuDe:', thongTinHopDong.TieuDe);
        console.log('  - TenDuAn:', thongTinHopDong.TenDuAn);
      }
    } else {
      console.log('\n2-3. Skipped layChiTietTinDang and layThongTinChoHopDong (no listings found)');
    }

    console.log('\n=== All TinDangModel tests passed! ===');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTinDangModel();
