const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'realestate'
  });

  const [cuochoithoai] = await connection.query('SELECT * FROM cuochoithoai ORDER BY CuocHoiThoaiID DESC LIMIT 5');
  const [thanhvien] = await connection.query('SELECT * FROM thanhviencuochoithoai ORDER BY CuocHoiThoaiID DESC LIMIT 10');
  const [tinnhan] = await connection.query('SELECT * FROM tinnhan ORDER BY TinNhanID DESC LIMIT 10');

  const out = {
    cuochoithoai,
    thanhvien,
    tinnhan
  };

  fs.writeFileSync(path.join(process.cwd(), 'chat_debug2.json'), JSON.stringify(out, null, 2));
  console.log('Dumped chat_debug2.json');
  process.exit(0);
}

main().catch(console.error);
