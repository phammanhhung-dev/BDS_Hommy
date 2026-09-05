require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./config/db');

async function test() {
  try {
    console.log('=== FINAL CHECK: Test LIKE query with OLD format from backup ===');
    // The backup shows CommuneName was like "Phường Phúc Xá (Quận Ba Đình)"
    // Test if current data has any parentheses
    const [parenCheck] = await db.query('SELECT COUNT(*) AS cnt FROM legacy_communes WHERE CommuneName LIKE "%(%"');
    console.log('legacy_communes with parentheses in CommuneName:', parenCheck[0].cnt);

    console.log('');
    console.log('=== FINAL CHECK: Sample rows that HAD parentheses in backup ===');
    // From backup: Phường Phúc Xá (Quận Ba Đình), Phường Trúc Bạch (Quận Ba Đình)
    // Check if these exist in current table without parentheses
    const [currentCheck] = await db.query('SELECT CommuneName FROM legacy_communes WHERE CommuneName LIKE "%Phúc Xá%" OR CommuneName LIKE "%Trúc Bạch%" LIMIT 5');
    console.log('Current table matches for backup samples:', JSON.stringify(currentCheck, null, 2));

    console.log('');
    console.log('=== FINAL CHECK: Check if any CommuneName contains district names ===');
    const [districtNames] = await db.query('SELECT CommuneName FROM legacy_communes WHERE ProvinceID = 50 AND (CommuneName LIKE "%Quận%" OR CommuneName LIKE "%Huyện%") LIMIT 10');
    console.log('CommuneName containing district references:', JSON.stringify(districtNames, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
test();
