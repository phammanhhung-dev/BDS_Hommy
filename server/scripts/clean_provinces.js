#!/usr/bin/env node

const db = require('../config/db');

async function main() {
  try {
    const connection = await db.getConnection();

    const [deleteResult] = await connection.query(
      `DELETE FROM new_provinces WHERE ProvinceCode NOT REGEXP '^[0-9]{1,2}$'`
    );

    console.log('Deleted invalid province rows:', deleteResult.affectedRows);

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM new_provinces`
    );

    console.log('Remaining valid provinces:', countRows[0].total);

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning provinces:', error);
    process.exit(1);
  }
}

main();
