const db = require('./config/db');

async function testRegressionTin17() {
  try {
    console.log('=== REGRESSION CHECK - TIN 17 (KIỂU CŨ CÓ PHÒNG TRONG) ===\n');

    // 1. Test PublicTinDangModel.layTatCaTinDang
    console.log('1. Test LayTatCaTinDang (kiểm tra tin 17):');
    const PublicTinDangModel = require('./models/PublicTinDangModel');
    const tinThue = await PublicTinDangModel.layTatCaTinDang({ loaiGiaoDich: 'Thue' });

    const tin17 = tinThue.find(t => t.TinDangID === 17);
    if (tin17) {
      console.log('   ✅ Tin 17 xuất hiện (như kỳ vọng):');
      console.log(`      - TieuDe: ${tin17.TieuDe}`);
      console.log(`      - Gia: ${tin17.Gia}`);
      console.log(`      - DienTich: ${tin17.DienTich}`);
      console.log(`      - DuAnID: ${tin17.DuAnID}`);
      console.log(`      - TongSoPhong: ${tin17.TongSoPhong}`);
      console.log(`      - SoPhongTrong: ${tin17.SoPhongTrong}`);
    } else {
      console.log('   ❌ Tin 17 KHÔNG xuất hiện (REGRESSION BUG!)');
    }

    // 2. Test LayChiTietTinDang cho tin 17
    console.log('\n2. Test LayChiTietTinDang cho tin 17:');
    const chiTiet17 = await PublicTinDangModel.layChiTietTinDang(17);
    if (chiTiet17) {
      console.log('   ✅ Chi tiết tin 17 trả về:');
      console.log(`      - TieuDe: ${chiTiet17.TieuDe}`);
      console.log(`      - Gia: ${chiTiet17.Gia}`);
      console.log(`      - DienTich: ${chiTiet17.DienTich}`);
      console.log(`      - TongSoPhong: ${chiTiet17.TongSoPhong}`);
      console.log(`      - DanhSachPhong length: ${chiTiet17.DanhSachPhong.length}`);
      if (chiTiet17.DanhSachPhong.length > 0) {
        console.log('      - DanhSachPhong:');
        console.table(chiTiet17.DanhSachPhong);
      }
    } else {
      console.log('   ❌ Chi tiết tin 17 KHÔNG trả về (REGRESSION BUG!)');
    }

    console.log('\n=== KẾT THÚC REGRESSION CHECK ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

testRegressionTin17();
