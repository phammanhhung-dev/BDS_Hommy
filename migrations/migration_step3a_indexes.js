const db = require('./config/db');

async function applyIndexes() {
  try {
    console.log('=== ÁP DỤNG INDEX CHO BẢNG GIAODICH ===\n');

    // Index 1: TrangThai
    console.log('1. Tạo index idx_giaodich_trangthai...');
    try {
      await db.execute(`
        CREATE INDEX idx_giaodich_trangthai ON giaodich(TrangThai)
      `);
      console.log('   ✅ Tạo thành công');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.errno === 1061) {
        console.log('   ⚠️  Index đã tồn tại, bỏ qua');
      } else {
        throw error;
      }
    }

    // Index 2: ThoiGian
    console.log('\n2. Tạo index idx_giaodich_thoigian...');
    try {
      await db.execute(`
        CREATE INDEX idx_giaodich_thoigian ON giaodich(ThoiGian)
      `);
      console.log('   ✅ Tạo thành công');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.errno === 1061) {
        console.log('   ⚠️  Index đã tồn tại, bỏ qua');
      } else {
        throw error;
      }
    }

    // Index 3: Composite TrangThai + ThoiGian
    console.log('\n3. Tạo index idx_giaodich_trangthai_thoigian...');
    try {
      await db.execute(`
        CREATE INDEX idx_giaodich_trangthai_thoigian ON giaodich(TrangThai, ThoiGian)
      `);
      console.log('   ✅ Tạo thành công');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.errno === 1061) {
        console.log('   ⚠️  Index đã tồn tại, bỏ qua');
      } else {
        throw error;
      }
    }

    // Verify indexes
    console.log('\n=== XÁC NHẬN INDEX CÓ HIỆN LỰC ===\n');
    const [indexes] = await db.execute('SHOW INDEX FROM giaodich');
    
    console.log('Các index trên bảng giaodich:');
    const keyNames = [...new Set(indexes.map(i => i.Key_name))];
    keyNames.forEach(keyName => {
      const columns = indexes.filter(i => i.Key_name === keyName).map(i => i.Column_name).join(', ');
      console.log(`  ${keyName}: ${columns}`);
    });

    // Verify specific new indexes
    const hasTrangThai = keyNames.includes('idx_giaodich_trangthai');
    const hasThoiGian = keyNames.includes('idx_giaodich_thoigian');
    const hasComposite = keyNames.includes('idx_giaodich_trangthai_thoigian');

    console.log('\n=== KẾT QUẢ ===');
    console.log(`idx_giaodich_trangthai: ${hasTrangThai ? '✅ Đã tạo' : '❌ Chưa có'}`);
    console.log(`idx_giaodich_thoigian: ${hasThoiGian ? '✅ Đã tạo' : '❌ Chưa có'}`);
    console.log(`idx_giaodich_trangthai_thoigian: ${hasComposite ? '✅ Đã tạo' : '❌ Chưa có'}`);

    console.log('\n=== HOÀN TẤT ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

applyIndexes();
