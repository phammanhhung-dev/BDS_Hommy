const db = require('../config/db');

async function runFix() {
  try {
    console.log('--- Bắt đầu fix DistrictID cho legacy_communes TP.HCM ---');

    const [checkBefore] = await db.query(
      'SELECT COUNT(*) as cnt FROM legacy_communes WHERE ProvinceID = 50 AND DistrictID BETWEEN 1606 AND 1627'
    );
    console.log('Số xã/phường TP.HCM đang có DistrictID 1606-1627:', checkBefore[0].cnt);

    const [updateRes] = await db.query(
      'UPDATE legacy_communes SET DistrictID = DistrictID - 1065 WHERE ProvinceID = 50 AND DistrictID BETWEEN 1606 AND 1627'
    );
    console.log('Đã cập nhật:', updateRes.affectedRows, 'xã/phường TP.HCM sang DistrictID 541-562');

    // Fix NULL districts in Sơn La (ProvinceID = 9)
    await db.query("UPDATE legacy_communes SET DistrictID = 96 WHERE ProvinceID = 9 AND CommuneCode = '03751'");
    await db.query("UPDATE legacy_communes SET DistrictID = 99 WHERE ProvinceID = 9 AND CommuneCode = '03913'");
    await db.query("UPDATE legacy_communes SET DistrictID = 100 WHERE ProvinceID = 9 AND CommuneCode = '03988'");
    await db.query("UPDATE legacy_communes SET DistrictID = 105 WHERE ProvinceID = 9 AND CommuneCode = '03991'");
    await db.query("UPDATE legacy_communes SET DistrictID = 100 WHERE ProvinceID = 9 AND CommuneCode = '04003'");
    console.log('Đã cập nhật DistrictID cho các xã thuộc Sơn La');

    // Kiểm tra lại Quận 12 (DistrictID = 542)
    const [q12Wards] = await db.query(
      'SELECT CommuneID, CommuneCode, CommuneName FROM legacy_communes WHERE DistrictID = 542 ORDER BY CommuneName ASC'
    );
    console.log(`✅ Quận 12 (DistrictID 542) hiện có ${q12Wards.length} phường:`);
    q12Wards.forEach(w => console.log(`  - [ID: ${w.CommuneID}] ${w.CommuneName} (${w.CommuneCode})`));

    // Kiểm tra Quận 1 (DistrictID = 541)
    const [q1Wards] = await db.query(
      'SELECT COUNT(*) as cnt FROM legacy_communes WHERE DistrictID = 541'
    );
    console.log(`✅ Quận 1 (DistrictID 541) hiện có ${q1Wards[0].cnt} phường`);

    // Kiểm tra Thủ Đức (DistrictID = 548)
    const [tdWards] = await db.query(
      'SELECT COUNT(*) as cnt FROM legacy_communes WHERE DistrictID = 548'
    );
    console.log(`✅ TP Thủ Đức (DistrictID 548) hiện có ${tdWards[0].cnt} phường`);

    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi fix:', err);
    process.exit(1);
  }
}

runFix();
