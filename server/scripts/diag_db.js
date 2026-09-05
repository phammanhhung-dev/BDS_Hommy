#!/usr/bin/env node
const db = require('../config/db');

(async () => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT ProvinceName FROM new_provinces LIMIT 15;');
    console.log('Province rows:');
    console.dir(rows, { depth: null });
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error running diag_db:', error);
    process.exit(1);
  }
})();
