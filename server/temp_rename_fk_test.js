const db = require('./config/db');

(async () => {
  try {
    console.log('===START===');
    const [countRows] = await db.query('SELECT COUNT(*) AS count FROM new_districts');
    console.log('new_districts count =', countRows[0].count);

    const [sampleRows] = await db.query(
      `SELECT d.DistrictID, d.ProvinceID, d.DistrictCode, d.DistrictName, p.ProvinceName
       FROM new_districts d
       JOIN new_provinces p USING (ProvinceID)
       ORDER BY d.DistrictID
       LIMIT 10`);
    console.log('===DISTRICT_JOIN_SAMPLE===');
    console.log(JSON.stringify(sampleRows, null, 2));

    const [fkRows] = await db.query(
      `SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('new_districts', 'new_communes')
         AND REFERENCED_TABLE_NAME = 'new_provinces'
       ORDER BY TABLE_NAME, CONSTRAINT_NAME`);
    console.log('===FK_META===');
    console.log(JSON.stringify(fkRows, null, 2));

    const [showDist] = await db.query('SHOW CREATE TABLE new_districts');
    const [showComm] = await db.query('SHOW CREATE TABLE new_communes');
    const [showProv] = await db.query('SHOW CREATE TABLE new_provinces');
    console.log('===SHOW_CREATE_new_districts===');
    console.log(showDist[0]['Create Table']);
    console.log('===SHOW_CREATE_new_communes===');
    console.log(showComm[0]['Create Table']);
    console.log('===SHOW_CREATE_new_provinces===');
    console.log(showProv[0]['Create Table']);

    console.log('===RENAME_FK_TEST===');
    await db.query('DROP TABLE IF EXISTS tmp_child, tmp_parent_old, tmp_parent_new');
    await db.query('CREATE TABLE tmp_parent_new (id INT PRIMARY KEY) ENGINE=InnoDB');
    await db.query('CREATE TABLE tmp_child (id INT PRIMARY KEY, parent_id INT, INDEX idx_parent_id (parent_id), CONSTRAINT fk_tmp_child_tmp_parent_new FOREIGN KEY (parent_id) REFERENCES tmp_parent_new(id) ON UPDATE CASCADE) ENGINE=InnoDB');
    const [before] = await db.query('SHOW CREATE TABLE tmp_child');
    console.log('BEFORE CREATE tmp_child');
    console.log(before[0]['Create Table']);
    await db.query('RENAME TABLE tmp_parent_new TO tmp_parent_old');
    const [after] = await db.query('SHOW CREATE TABLE tmp_child');
    console.log('AFTER CREATE tmp_child');
    console.log(after[0]['Create Table']);

    console.log('===TEST_QUERY_AFTER_RENAME===');
    try {
      await db.query('SELECT * FROM tmp_child LIMIT 1');
      console.log('tmp_child query succeeded after parent rename');
    } catch (err) {
      console.error('tmp_child query failed after parent rename', err.message);
    }
  } catch (err) {
    console.error(err.stack || err);
  } finally {
    await db.query('DROP TABLE IF EXISTS tmp_child, tmp_parent_old');
    process.exit(0);
  }
})();
