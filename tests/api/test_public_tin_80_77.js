const db = require('../../server/config/db');

async function testPublicTin() {
  try {
    console.log('=== KIỂM TRA TIN 80 VÀ 77 TRÊN TRANG PUBLIC ===\n');

    // 1. Test query LayTatCaTinDang với filter loaiGiaoDich = 'Thue'
    console.log('1. Test LayTatCaTinDang (loaiGiaoDich = Thue):');
    const PublicTinDangModel = require('../../server/models/PublicTinDangModel');
    const tinThue = await PublicTinDangModel.layTatCaTinDang({ loaiGiaoDich: 'Thue' });

    console.log(`   Tổng số tin Thuê trả về: ${tinThue.length}`);
    const tin80 = tinThue.find(t => t.TinDangID === 80);
    const tin77 = tinThue.find(t => t.TinDangID === 77);

    if (tin80) {
      console.log('   ✅ Tin 80 xuất hiện:');
      console.log(`      - TieuDe: ${tin80.TieuDe}`);
      console.log(`      - Gia: ${tin80.Gia}`);
      console.log(`      - DienTich: ${tin80.DienTich}`);
      console.log(`      - DuAnID: ${tin80.DuAnID}`);
    } else {
      console.log('   ❌ Tin 80 KHÔNG xuất hiện');
    }

    if (tin77) {
      console.log('   ✅ Tin 77 xuất hiện:');
      console.log(`      - TieuDe: ${tin77.TieuDe}`);
      console.log(`      - Gia: ${tin77.Gia}`);
      console.log(`      - DienTich: ${tin77.DienTich}`);
      console.log(`      - DuAnID: ${tin77.DuAnID}`);
    } else {
      console.log('   ❌ Tin 77 KHÔNG xuất hiện');
    }

    // 2. Test LayChiTietTinDang cho tin 80
    console.log('\n2. Test LayChiTietTinDang cho tin 80:');
    const chiTiet80 = await PublicTinDangModel.layChiTietTinDang(80);
    if (chiTiet80) {
      console.log('   ✅ Chi tiết tin 80 trả về:');
      console.log(`      - TieuDe: ${chiTiet80.TieuDe}`);
      console.log(`      - Gia: ${chiTiet80.Gia}`);
      console.log(`      - DienTich: ${chiTiet80.DienTich}`);
      console.log(`      - DanhSachPhong: ${JSON.stringify(chiTiet80.DanhSachPhong)}`);
    } else {
      console.log('   ❌ Chi tiết tin 80 KHÔNG trả về');
    }

    // 3. Test LayChiTietTinDang cho tin 77
    console.log('\n3. Test LayChiTietTinDang cho tin 77:');
    const chiTiet77 = await PublicTinDangModel.layChiTietTinDang(77);
    if (chiTiet77) {
      console.log('   ✅ Chi tiết tin 77 trả về:');
      console.log(`      - TieuDe: ${chiTiet77.TieuDe}`);
      console.log(`      - Gia: ${chiTiet77.Gia}`);
      console.log(`      - DienTich: ${chiTiet77.DienTich}`);
      console.log(`      - DanhSachPhong: ${JSON.stringify(chiTiet77.DanhSachPhong)}`);
    } else {
      console.log('   ❌ Chi tiết tin 77 KHÔNG trả về');
    }

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

testPublicTin();
