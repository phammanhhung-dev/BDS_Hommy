const db = require('../../server/config/db');

async function checkGiaDienTich() {
  try {
    console.log('=== KIỂM TRA GIA/DIENTICH TIN 80/77 TRONG DB ===\n');

    // 1. Kiểm tra GiaTien và DienTich trong DB cho tin 80
    console.log('1. GiaTien và DienTich trong DB cho tin 80:');
    const [tin80DB] = await db.execute(`
      SELECT TinDangID, TieuDe, GiaTien, DienTichDat, DienTichSuDung, LoaiBDS
      FROM tindang
      WHERE TinDangID = 80
    `);
    console.table(tin80DB);

    // 2. Kiểm tra GiaTien và DienTich trong DB cho tin 77
    console.log('\n2. GiaTien và DienTich trong DB cho tin 77:');
    const [tin77DB] = await db.execute(`
      SELECT TinDangID, TieuDe, GiaTien, DienTichDat, DienTichSuDung, LoaiBDS
      FROM tindang
      WHERE TinDangID = 77
    `);
    console.table(tin77DB);

    // 3. So sánh với kết quả từ PublicTinDangModel
    console.log('\n3. So sánh với kết quả từ PublicTinDangModel:');
    const PublicTinDangModel = require('../../server/models/PublicTinDangModel');
    const tinThue = await PublicTinDangModel.layTatCaTinDang({ loaiGiaoDich: 'Thue' });

    const tin80API = tinThue.find(t => t.TinDangID === 80);
    const tin77API = tinThue.find(t => t.TinDangID === 77);

    if (tin80API) {
      console.log('   Tin 80 (API):');
      console.log(`      - Gia: ${tin80API.Gia}`);
      console.log(`      - DienTich: ${tin80API.DienTich}`);
      console.log(`      - So sánh với DB GiaTien: ${tin80DB[0].GiaTien}`);
      console.log(`      - So sánh với DB DienTichDat: ${tin80DB[0].DienTichDat}`);
      console.log(`      - So sánh với DB DienTichSuDung: ${tin80DB[0].DienTichSuDung}`);
    }

    if (tin77API) {
      console.log('\n   Tin 77 (API):');
      console.log(`      - Gia: ${tin77API.Gia}`);
      console.log(`      - DienTich: ${tin77API.DienTich}`);
      console.log(`      - So sánh với DB GiaTien: ${tin77DB[0].GiaTien}`);
      console.log(`      - So sánh với DB DienTichDat: ${tin77DB[0].DienTichDat}`);
      console.log(`      - So sánh với DB DienTichSuDung: ${tin77DB[0].DienTichSuDung}`);
    }

    console.log('\n=== KẾT THÚC KIỂM TRA ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkGiaDienTich();
