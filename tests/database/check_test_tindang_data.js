const db = require('../../server/config/db');

async function checkTestTinDangData() {
  try {
    console.log('=== BƯỚC 1: Query xác định bản ghi test cần xóa ===\n');
    console.log('Query: SELECT TinDangID, TieuDe, ChuDuAnID, TaoLuc FROM tindang WHERE ChuDuAnID = 1 ORDER BY TaoLuc DESC;\n');

    const [rows] = await db.execute(`
      SELECT TinDangID, TieuDe, ChuDuAnID, TaoLuc, TrangThai, DuAnID
      FROM tindang
      WHERE ChuDuAnID = 1
      ORDER BY TaoLuc DESC
    `);

    console.log('KẾT QUẢ QUERY:');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('TinDangID | TieuDe                              | ChuDuAnID | TaoLuc                | TrangThai | DuAnID');
    console.log('──────────┼─────────────────────────────────────┼───────────┼──────────────────────┼───────────┼───────');

    rows.forEach(row => {
      const tieuDe = (row.TieuDe || '').substring(0, 35).padEnd(35);
      const taoLuc = row.TaoLuc ? row.TaoLuc.toISOString().substring(0, 19) : 'NULL';
      console.log(`${row.TinDangID.toString().padEnd(9)} | ${tieuDe} | ${row.ChuDuAnID.toString().padEnd(9)} | ${taoLuc} | ${(row.TrangThai || '').padEnd(9)} | ${row.DuAnID || 'NULL'}`);
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`\nTổng số bản ghi với ChuDuAnID = 1: ${rows.length}\n`);

    // Phân tích: nào là test rác?
    console.log('PHÂN TÍCH CÁC BẢN GHI:');
    const testRecords = [];
    const realRecords = [];

    rows.forEach(row => {
      const taoLuc = row.TaoLuc ? new Date(row.TaoLuc) : null;
      const isRecent = taoLuc && (new Date() - taoLuc) < 7 * 24 * 60 * 60 * 1000; // 7 ngày gần đây
      const hasTestKeyword = row.TieuDe && row.TieuDe.toLowerCase().includes('test');
      const isTest = hasTestKeyword || (isRecent && row.TieuDe && row.TieuDe.length < 10);

      if (isTest) {
        testRecords.push(row);
        console.log(`  [TEST RÁC?] TinDangID ${row.TinDangID}: "${row.TieuDe}" - TaoLuc: ${taoLuc ? taoLuc.toISOString() : 'NULL'}`);
      } else {
        realRecords.push(row);
        console.log(`  [CÓ THỂ THẬT] TinDangID ${row.TinDangID}: "${row.TieuDe}" - TaoLuc: ${taoLuc ? taoLuc.toISOString() : 'NULL'}`);
      }
    });

    console.log('\n─────────────────────────────────────────────────────────────────────────────');
    console.log(`\nTỔNG KẾT:`);
    console.log(`  - Bản ghi có vẻ là TEST RÁC: ${testRecords.length} bản ghi`);
    console.log(`  - Bản ghi có vẻ là THẬT: ${realRecords.length} bản ghi`);

    if (testRecords.length > 0) {
      console.log(`\nDANH SÁCH TEST RÁC ĐỀ XUẤT XÓA:`);
      testRecords.forEach(row => {
        console.log(`    - TinDangID: ${row.TinDangID}, TieuDe: "${row.TieuDe}", TaoLuc: ${row.TaoLuc}`);
      });
    }

    if (realRecords.length > 0) {
      console.log(`\nDANH SÁCH BẢN GHI THẬT (GIỮ LẠI):`);
      realRecords.forEach(row => {
        console.log(`    - TinDangID: ${row.TinDangID}, TieuDe: "${row.TieuDe}", TaoLuc: ${row.TaoLuc}`);
      });
    }

  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await db.end();
  }
}

checkTestTinDangData();
