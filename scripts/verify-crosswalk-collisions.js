#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realestate'
  });

  try {
    const sql = `
      SELECT new_province_id, new_ward_id, COUNT(*) AS candidate_count
      FROM address_crosswalk
      GROUP BY new_province_id, new_ward_id
      HAVING candidate_count > 1;
    `;

    const [rows] = await connection.query(sql);
    console.log('Collision groups with multiple legacy candidates:', rows.length);
    if (rows.length > 0) {
      console.log(JSON.stringify(rows.slice(0, 10), null, 2));
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra collision crosswalk:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
})();
