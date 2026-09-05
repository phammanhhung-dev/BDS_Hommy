const db = require('./server/config/db');

async function checkChuDuAnIDs() {
  try {
    console.log('=== Checking which ChuDuAnID has projects ===\n');

    // Check duan table
    const [duanRows] = await db.execute(`
      SELECT ChuDuAnID, COUNT(*) as count
      FROM duan
      GROUP BY ChuDuAnID
      ORDER BY count DESC
    `);
    console.log('Projects by ChuDuAnID:');
    duanRows.forEach(row => {
      console.log(`  ChuDuAnID ${row.ChuDuAnID}: ${row.count} projects`);
    });

    // Check phong table
    const [phongRows] = await db.execute(`
      SELECT da.ChuDuAnID, COUNT(p.PhongID) as count
      FROM phong p
      INNER JOIN duan da ON p.DuAnID = da.DuAnID
      GROUP BY da.ChuDuAnID
      ORDER BY count DESC
    `);
    console.log('\nRooms by ChuDuAnID:');
    phongRows.forEach(row => {
      console.log(`  ChuDuAnID ${row.ChuDuAnID}: ${row.count} rooms`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.end();
  }
}

checkChuDuAnIDs();
