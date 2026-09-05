const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'realestate'
});

(async () => {
  const [rows] = await db.execute(
    'SELECT NguoiDungID, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID IN (2, 4, 5, 7, 251) ORDER BY NguoiDungID'
  );

  console.log('Tài khoản test hiện tại:');
  rows.forEach(r => {
    console.log(`ID ${r.NguoiDungID} (${r.Email}): Role ${r.VaiTroHoatDongID}`);
  });

  await db.end();
})();
