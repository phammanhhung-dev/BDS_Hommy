const db = require('./config/db');

async function testRegressionTin18() {
  try {
    console.log('=== REGRESSION CHECK - TIN 18 (KIỂU CŨ CÓ PHONG_TINDANG) ===\n');

    // 1. Kiểm tra thông tin tin 18 trong DB
    console.log('1. Thông tin tin 18 trong DB:');
    const [tin18Info] = await db.execute(`
      SELECT TinDangID, TieuDe, LoaiGiaoDich, TrangThai, DuAnID, GiaTien, DienTichDat, DienTichSuDung
      FROM tindang
      WHERE TinDangID = 18
    `);
    console.table(tin18Info);

    // 2. Kiểm tra phong_tindang cho tin 18
    console.log('\n2. Phong_tindang cho tin 18:');
    const [phongTinDang18] = await db.execute(`
      SELECT pt.*, p.TrangThai as TrangThaiPhong, p.TenPhong
      FROM phong_tindang pt
      JOIN phong p ON pt.PhongID = p.PhongID
      WHERE pt.TinDangID = 18
    `);
    console.table(phongTinDang18);

    // 3. Test PublicTinDangModel.layTatCaTinDang
    console.log('\n3. Test LayTatCaTinDang (kiểm tra tin 18):');
    const PublicTinDangModel = require('./models/PublicTinDangModel');
    const tinThue = await PublicTinDangModel.layTatCaTinDang({ loaiGiaoDich: 'Thue' });

    const tin18 = tinThue.find(t => t.TinDangID === 18);
    if (tin18) {
      console.log('   ✅ Tin 18 xuất hiện (như kỳ vọng):');
      console.log(`      - TieuDe: ${tin18.TieuDe}`);
      console.log(`      - Gia: ${tin18.Gia}`);
      console.log(`      - DienTich: ${tin18.DienTich}`);
      console.log(`      - DuAnID: ${tin18.DuAnID}`);
      console.log(`      - TongSoPhong: ${tin18.TongSoPhong}`);
      console.log(`      - SoPhongTrong: ${tin18.SoPhongTrong}`);
    } else {
      console.log('   ❌ Tin 18 KHÔNG xuất hiện (REGRESSION BUG!)');
    }

    // 4. Test LayChiTietTinDang cho tin 18
    console.log('\n4. Test LayChiTietTinDang cho tin 18:');
    const chiTiet18 = await PublicTinDangModel.layChiTietTinDang(18);
    if (chiTiet18) {
      console.log('   ✅ Chi tiết tin 18 trả về:');
      console.log(`      - TieuDe: ${chiTiet18.TieuDe}`);
      console.log(`      - Gia: ${chiTiet18.Gia}`);
      console.log(`      - DienTich: ${chiTiet18.DienTich}`);
      console.log(`      - TongSoPhong: ${chiTiet18.TongSoPhong}`);
      console.log(`      - DanhSachPhong length: ${chiTiet18.DanhSachPhong.length}`);
      if (chiTiet18.DanhSachPhong.length > 0) {
        console.log('      - DanhSachPhong:');
        console.table(chiTiet18.DanhSachPhong);
      }
    } else {
      console.log('   ❌ Chi tiết tin 18 KHÔNG trả về (REGRESSION BUG!)');
    }

    console.log('\n=== KẾT THÚC REGRESSION CHECK ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

testRegressionTin18();
