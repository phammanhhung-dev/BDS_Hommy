const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'thue_tro'
    });

    console.log('=== Checking User: banhang@gmail.com ===\n');

    // Check nguoidung table
    const [users] = await conn.execute(`
      SELECT n.NguoiDungID, n.TenDayDu, n.Email, n.VaiTroHoatDongID, v.TenVaiTro 
      FROM nguoidung n
      LEFT JOIN vaitro v ON n.VaiTroHoatDongID = v.VaiTroID
      WHERE n.Email = ?
    `, ['banhang@gmail.com']);

    console.log('1. User in nguoidung table:');
    console.table(users);

    if (users.length === 0) {
      console.log('\n❌ ERROR: User not found!');
      await conn.end();
      return;
    }

    const userId = users[0].NguoiDungID;

    // Check nguoidung_vaitro table
    const [roles] = await conn.execute(`
      SELECT nv.*, v.TenVaiTro
      FROM nguoidung_vaitro nv
      LEFT JOIN vaitro v ON nv.VaiTroID = v.VaiTroID
      WHERE nv.NguoiDungID = ?
    `, [userId]);

    console.log(`\n2. Roles in nguoidung_vaitro for NguoiDungID=${userId}:`);
    if (roles.length === 0) {
      console.log('❌ NO ROLES FOUND! This is the problem!');
    } else {
      console.table(roles);
    }

    // Check all roles in vaitro table
    const [allRoles] = await conn.execute('SELECT * FROM vaitro');
    console.log('\n3. All roles in vaitro table:');
    console.table(allRoles);

    await conn.end();

    // Diagnosis
    console.log('\n=== DIAGNOSIS ===');
    if (users[0].VaiTroHoatDongID === 2) {
      console.log('✅ VaiTroHoatDongID = 2 (CORRECT)');
    } else {
      console.log(`❌ VaiTroHoatDongID = ${users[0].VaiTroHoatDongID} (WRONG)`);
    }

    if (roles.length === 0) {
      console.log('❌ NO entry in nguoidung_vaitro table');
      console.log('\n🔧 FIX: Run this SQL:');
      console.log(`INSERT INTO nguoidung_vaitro (NguoiDungID, VaiTroID) VALUES (${userId}, 2);`);
    } else {
      console.log('✅ Role exists in nguoidung_vaitro');
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();






