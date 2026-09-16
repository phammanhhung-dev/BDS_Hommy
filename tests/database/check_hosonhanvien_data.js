const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    const [rows] = await connection.query('SELECT * FROM hosonhanvien');
    console.log('hosonhanvien records:');
    console.table(rows);
  } catch (error) {
    console.error('Error querying hosonhanvien:', error);
  } finally {
    await connection.end();
  }
}

main();
