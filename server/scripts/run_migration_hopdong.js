/**
 * Script chạy migration thêm các trường PhongID, DuAnID, SoTienCoc vào bảng hopdong
 */

const db = require('../config/db');

async function runMigration() {
  try {
    console.log('🚀 Bắt đầu migration...\n');

    // 1. Thêm PhongID
    try {
      console.log('1. Đang thêm PhongID...');
      await db.execute(`
        ALTER TABLE hopdong 
        ADD COLUMN PhongID INT DEFAULT NULL COMMENT 'ID phòng được đặt cọc' 
        AFTER TinDangID
      `);
      console.log('   ✅ Đã thêm PhongID\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELD_NAME') {
        console.log('   ⚠️  PhongID đã tồn tại, bỏ qua...\n');
      } else {
        throw err;
      }
    }

    // 2. Thêm DuAnID
    try {
      console.log('2. Đang thêm DuAnID...');
      await db.execute(`
        ALTER TABLE hopdong 
        ADD COLUMN DuAnID INT DEFAULT NULL COMMENT 'ID dự án' 
        AFTER PhongID
      `);
      console.log('   ✅ Đã thêm DuAnID\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELD_NAME') {
        console.log('   ⚠️  DuAnID đã tồn tại, bỏ qua...\n');
      } else {
        throw err;
      }
    }

    // 3. Thêm SoTienCoc
    try {
      console.log('3. Đang thêm SoTienCoc...');
      await db.execute(`
        ALTER TABLE hopdong 
        ADD COLUMN SoTienCoc DECIMAL(15,2) DEFAULT NULL COMMENT 'Số tiền cọc' 
        AFTER GiaThueCuoiCung
      `);
      console.log('   ✅ Đã thêm SoTienCoc\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELD_NAME') {
        console.log('   ⚠️  SoTienCoc đã tồn tại, bỏ qua...\n');
      } else {
        throw err;
      }
    }

    // 4. Thêm index cho PhongID
    try {
      console.log('4. Đang thêm index idx_hd_phong...');
      await db.execute(`
        ALTER TABLE hopdong 
        ADD KEY idx_hd_phong (PhongID)
      `);
      console.log('   ✅ Đã thêm index idx_hd_phong\n');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('   ⚠️  Index idx_hd_phong đã tồn tại, bỏ qua...\n');
      } else {
        throw err;
      }
    }

    // 5. Thêm index cho DuAnID
    try {
      console.log('5. Đang thêm index idx_hd_duan...');
      await db.execute(`
        ALTER TABLE hopdong 
        ADD KEY idx_hd_duan (DuAnID)
      `);
      console.log('   ✅ Đã thêm index idx_hd_duan\n');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('   ⚠️  Index idx_hd_duan đã tồn tại, bỏ qua...\n');
      } else {
        throw err;
      }
    }

    // Kiểm tra lại
    console.log('📋 Kiểm tra lại các trường...');
    const [rows] = await db.execute('DESCRIBE hopdong');
    const fields = rows.map(r => r.Field);
    
    console.log('\n✅ Kết quả:');
    console.log('   PhongID:', fields.includes('PhongID') ? '✅ CÓ' : '❌ CHƯA CÓ');
    console.log('   DuAnID:', fields.includes('DuAnID') ? '✅ CÓ' : '❌ CHƯA CÓ');
    console.log('   SoTienCoc:', fields.includes('SoTienCoc') ? '✅ CÓ' : '❌ CHƯA CÓ');
    
    console.log('\n🎉 Migration hoàn tất!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

