const db = require('../../server/config/db');

async function checkIndexes() {
  try {
    console.log('=== KIỂM TRA INDEX CÁC BẢNG QUAN TRỌNG ===\n');

    // tindang
    const [tindangIndexes] = await db.execute('SHOW INDEX FROM tindang');
    console.log('=== INDEXES tindang ===');
    tindangIndexes.forEach(i => console.log(`  ${i.Key_name}: ${i.Column_name}`));

    // cuochen
    const [cuochenIndexes] = await db.execute('SHOW INDEX FROM cuochen');
    console.log('\n=== INDEXES cuochen ===');
    cuochenIndexes.forEach(i => console.log(`  ${i.Key_name}: ${i.Column_name}`));

    // giaodich
    const [giaodichIndexes] = await db.execute('SHOW INDEX FROM giaodich');
    console.log('\n=== INDEXES giaodich ===');
    giaodichIndexes.forEach(i => console.log(`  ${i.Key_name}: ${i.Column_name}`));

    // phong
    const [phongIndexes] = await db.execute('SHOW INDEX FROM phong');
    console.log('\n=== INDEXES phong ===');
    phongIndexes.forEach(i => console.log(`  ${i.Key_name}: ${i.Column_name}`));

    console.log('\n=== KẾT THÚC ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkIndexes();
