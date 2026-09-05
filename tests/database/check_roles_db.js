const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    console.log('--- User Roles Mapping ---');
    const [roles] = await connection.execute('SELECT * FROM vaitro');
    console.log('vaitro table:', JSON.stringify(roles, null, 2));

    const [userRoles] = await connection.execute(`
      SELECT nvt.*, vt.TenVaiTro, nd.TenDayDu 
      FROM nguoidung_vaitro nvt
      JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
      JOIN nguoidung nd ON nvt.NguoiDungID = nd.NguoiDungID
      WHERE nvt.NguoiDungID = 261
    `);
    console.log('User 261 roles in nguoidung_vaitro:', JSON.stringify(userRoles, null, 2));

    const [user] = await connection.execute('SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = 261');
    console.log('User 261 row:', JSON.stringify(user, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}
run();
