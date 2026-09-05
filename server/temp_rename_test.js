const db = require('./config/db');
(async () => {
  try {
    await db.query('DROP TABLE IF EXISTS tmp_legacy_communes, tmp_new_communes, tmp_new_districts, tmp_new_provinces, tmp_legacy_provinces');
    await db.query('CREATE TABLE tmp_new_provinces LIKE new_provinces');
    await db.query('CREATE TABLE tmp_new_communes LIKE new_communes');
    await db.query('CREATE TABLE tmp_new_districts LIKE new_districts');
    console.log('CREATED_TEMP_TABLES');
    await db.query('RENAME TABLE tmp_new_provinces TO tmp_legacy_provinces, tmp_new_communes TO tmp_legacy_communes');
    console.log('RENAMED_TABLES');
    const [info] = await db.query(`SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('tmp_legacy_communes', 'tmp_new_districts') ORDER BY TABLE_NAME, CONSTRAINT_NAME`);
    console.log(JSON.stringify(info, null, 2));
    const [showComm] = await db.query('SHOW CREATE TABLE tmp_legacy_communes');
    console.log('SHOW_CREATE_TMP_LEGACY_COMMUNES');
    console.log(showComm[0]['Create Table']);
    const [showDist] = await db.query('SHOW CREATE TABLE tmp_new_districts');
    console.log('SHOW_CREATE_TMP_NEW_DISTRICTS');
    console.log(showDist[0]['Create Table']);
  } catch (err) {
    console.error('ERROR', err.stack || err);
    process.exit(1);
  } finally {
    await db.query('DROP TABLE IF EXISTS tmp_legacy_communes, tmp_legacy_provinces, tmp_new_districts, tmp_new_communes, tmp_new_provinces');
    process.exit(0);
  }
})();
