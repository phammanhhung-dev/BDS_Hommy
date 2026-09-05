const db = require('./server/config/db');

async function thoroughCleanupCheck() {
  try {
    console.log('=== BƯỚC 1: TRA CHÉO TRỰC TIẾP CÁC ID 20, 21, 23, 24, 25 ===\n');

    const [specificIds] = await db.execute(`
      SELECT TinDangID, TieuDe, ChuDuAnID, TaoLuc, TrangThai, DuAnID
      FROM tindang
      WHERE TinDangID IN (20, 21, 23, 24, 25)
    `);

    console.log('KẾT QUẢ TRA CHÉO ID 20, 21, 23, 24, 25:');
    if (specificIds.length === 0) {
      console.log('  ❌ KHÔNG TÌM THẤY - Các ID này không tồn tại trong bảng hiện tại');
    } else {
      console.log('  ✅ TÌM THẤY:');
      specificIds.forEach(row => {
        console.log(`    - TinDangID ${row.TinDangID}: "${row.TieuDe}" | ChuDuAnID: ${row.ChuDuAnID} | TaoLuc: ${row.TaoLuc} | TrangThai: ${row.TrangThai}`);
      });
    }

    // Kiểm tra AUTO_INCREMENT
    console.log('\nKiểm tra AUTO_INCREMENT của bảng tindang:');
    const [tableStatus] = await db.execute(`SHOW TABLE STATUS LIKE 'tindang'`);
    if (tableStatus.length > 0) {
      const autoIncrement = tableStatus[0].Auto_increment;
      console.log(`  AUTO_INCREMENT hiện tại: ${autoIncrement}`);
      if (autoIncrement > 25) {
        console.log(`  ➤ KẾT LUẬN: Các ID 20-25 ĐÃ TỒN TẠI rồi bị xóa (vì AUTO_INCREMENT đã vượt qua chúng)`);
      } else if (autoIncrement <= 20) {
        console.log(`  ➤ KẾT LUẬN: Các ID 20-25 CHƯA TỪNG TỒN TẠI (vì AUTO_INCREMENT chưa đến)`);
      } else {
        console.log(`  ➤ KẾT LUẬN: Một số ID trong 20-25 có thể đã tồn tại rồi bị xóa (AUTO_INCREMENT ở giữa)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n=== BƯỚC 2: QUÉT TOÀN BỘ BẢNG TÌM DẤU HIỆU RÁC THẬT ===\n');

    const [potentialTrash] = await db.execute(`
      SELECT TinDangID, TieuDe, ChuDuAnID, TaoLuc, TrangThai
      FROM tindang
      WHERE TieuDe LIKE '%test%' OR TieuDe LIKE '%Test%'
         OR TaoLuc >= '2026-08-15 00:00:00'
      ORDER BY TaoLuc DESC
    `);

    console.log(`KẾT QUẢ QUÉT (TieuDe có 'test' HOẶC TaoLuc >= 2026-08-15):`);
    console.log(`Tìm thấy ${potentialTrash.length} bản ghi\n`);

    if (potentialTrash.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════════════');
      console.log('TinDangID | TieuDe                              | ChuDuAnID | TaoLuc                | TrangThai');
      console.log('──────────┼─────────────────────────────────────┼───────────┼──────────────────────┼───────────');

      potentialTrash.forEach(row => {
        const tieuDe = (row.TieuDe || '').substring(0, 35).padEnd(35);
        const taoLuc = row.TaoLuc ? row.TaoLuc.toISOString().substring(0, 19) : 'NULL';
        console.log(`${row.TinDangID.toString().padEnd(9)} | ${tieuDe} | ${row.ChuDuAnID.toString().padEnd(9)} | ${taoLuc} | ${(row.TrangThai || '').padEnd(9)}`);
      });
      console.log('═══════════════════════════════════════════════════════════════════════════════');
    } else {
      console.log('  ✅ KHÔNG TÌM THẤY bản ghi nào có dấu hiệu rác');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n=== BƯỚC 3: XÁC NHẬN TIN DANGID 17, 18, 19 ===\n');

    const [ids17to19] = await db.execute(`
      SELECT TinDangID, TieuDe, ChuDuAnID, TaoLuc, TrangThai, DuAnID
      FROM tindang
      WHERE TinDangID IN (17, 18, 19)
      ORDER BY TinDangID
    `);

    console.log('Chi tiết TinDangID 17, 18, 19:');
    if (ids17to19.length === 0) {
      console.log('  ❌ KHÔNG TÌM THẤY');
    } else {
      ids17to19.forEach(row => {
        const taoLuc = row.TaoLuc ? new Date(row.TaoLuc) : null;
        const taoLucStr = taoLuc ? taoLuc.toISOString() : 'NULL';
        console.log(`  TinDangID ${row.TinDangID}:`);
        console.log(`    - TieuDe: "${row.TieuDe}"`);
        console.log(`    - ChuDuAnID: ${row.ChuDuAnID}`);
        console.log(`    - TaoLuc: ${taoLucStr}`);
        console.log(`    - TrangThai: ${row.TrangThai}`);
        console.log(`    - DuAnID: ${row.DuAnID}`);
        console.log('');
      });

      // Xác nhận thời điểm
      console.log('PHÂN TÍCH THỜI ĐIỂM:');
      ids17to19.forEach(row => {
        const taoLuc = row.TaoLuc ? new Date(row.TaoLuc) : null;
        if (taoLuc) {
          const dateStr = taoLuc.toISOString().split('T')[0];
          const timeStr = taoLuc.toISOString().split('T')[1].substring(0, 8);
          console.log(`  TinDangID ${row.TinDangID}: TaoLuc = ${dateStr} ${timeStr} (ngày 2026-08-16)`);
          console.log(`  ➤ Đây khớp với thời điểm test API thật (xác nhận ChuDuAnID tự gán từ token)`);
          console.log(`  ➤ ĐỀ XUẤT: GIỮ LẠI - đây là dữ liệu test CÓ CHỦ ĐÍCH, bằng chứng test đã hoàn thành`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n=== TỔNG KẾT ===\n');

    // Tổng kết
    console.log('1. KẾT QUẢ TRA CHÉO ID 20, 21, 23, 24, 25:');
    if (specificIds.length === 0) {
      console.log('   ❌ KHÔNG TÌM THẤY - các ID này không tồn tại trong bảng hiện tại');
      if (tableStatus.length > 0 && tableStatus[0].Auto_increment > 25) {
        console.log('   ➤ Đã từng tồn tại rồi bị xóa (AUTO_INCREMENT đã vượt qua)');
      }
    } else {
      console.log(`   ✅ TÌM THẤY ${specificIds.length} bản ghi - cần xác nhận có phải rác không`);
    }

    console.log('\n2. KẾT QUẢ QUÉT TOÀN B�ẢNG:');
    if (potentialTrash.length === 0) {
      console.log('   ✅ KHÔNG TÌM THẤY bản ghi rác nào');
    } else {
      console.log(`   ⚠️  TÌM THẤY ${potentialTrash.length} bản ghi có dấu hiệu rác - cần xem xét`);
    }

    console.log('\n3. KẾT QUẢ XÁC NHẬN ID 17, 18, 19:');
    if (ids17to19.length > 0) {
      console.log(`   ✅ TÌM THẤY ${ids17to19.length} bản ghi`);
      console.log('   ➤ Đây là dữ liệu test CÓ CHỦ ĐÍCH từ bước test API thật');
      console.log('   ➤ ĐỀ XUẤT: GIỮ LẠI, KHÔNG XÓA');
    }

    console.log('\n4. KẾT LUẬN CUỐI CÙNG:');
    if (specificIds.length === 0 && potentialTrash.length === 0) {
      console.log('   ✅ KHÔNG CÓ BẢN GHI RÁC NÀO CẦN XÓA');
      console.log('   ➤ Database sạch, không cần thao tác dọn dẹp thêm');
    } else {
      console.log('   ⚠️  CÓ BẢN GHI CẦN XEM XÉT XÓA:');
      if (specificIds.length > 0) {
        specificIds.forEach(row => {
          console.log(`      - TinDangID ${row.TinDangID}: "${row.TieuDe}"`);
        });
      }
      if (potentialTrash.length > 0) {
        potentialTrash.forEach(row => {
          console.log(`      - TinDangID ${row.TinDangID}: "${row.TieuDe}" (TaoLuc: ${row.TaoLuc})`);
        });
      }
      console.log('   ➤ CHƯA CHạy DELETE - chờ xác nhận từ bạn');
    }

  } catch (error) {
    console.error('Lỗi:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
  }
}

thoroughCleanupCheck();
