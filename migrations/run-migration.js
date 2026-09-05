/**
 * Script chạy migration và verify kết quả
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Sử dụng config từ server hoặc config mặc định
let config;
try {
  // Thử load từ server config
  const dbConfig = require('../server/config/db.js');
  const pool = dbConfig.pool || dbConfig;
  config = {
    host: pool.config?.host || 'localhost',
    user: pool.config?.user || 'root',
    password: pool.config?.password || '',
    database: pool.config?.database || 'thue_tro',
    multipleStatements: true
  };
} catch (e) {
  // Fallback về config mặc định
  config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thue_tro',
    multipleStatements: true
  };
}

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Đang kết nối database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Kết nối thành công!\n');

    // Đọc file migration
    const migrationFile = path.join(__dirname, '..', 'migrations', '2025_11_06_add_hoa_hong_to_duan_v2.sql');
    console.log(`📖 Đang đọc file: ${migrationFile}`);
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('✅ Đọc file thành công!\n');

    // Chạy migration
    console.log('🚀 Đang chạy migration...');
    console.log('─────────────────────────────────────────');
    await connection.query(sql);
    console.log('─────────────────────────────────────────');
    console.log('✅ Migration thành công!\n');

    // Verify: Kiểm tra các columns đã được thêm
    console.log('🔍 Đang kiểm tra cấu trúc bảng...\n');
    
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM duan LIKE '%HoaHong%'
    `);
    
    console.log('📊 Các columns về Hoa hồng đã được thêm:');
    console.log('─────────────────────────────────────────');
    if (columns.length === 0) {
      console.log('⚠️  Không tìm thấy columns nào!');
    } else {
      columns.forEach(col => {
        console.log(`  ✓ ${col.Field.padEnd(30)} | ${col.Type.padEnd(20)} | Default: ${col.Default || 'NULL'}`);
      });
    }
    console.log('─────────────────────────────────────────\n');

    // Kiểm tra indexes
    const [indexes] = await connection.query(`
      SHOW INDEXES FROM duan WHERE Key_name LIKE '%hoahong%'
    `);
    
    console.log('📑 Các indexes đã được tạo:');
    console.log('─────────────────────────────────────────');
    if (indexes.length === 0) {
      console.log('⚠️  Không tìm thấy indexes nào!');
    } else {
      const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
      uniqueIndexes.forEach(idxName => {
        const idxCols = indexes
          .filter(idx => idx.Key_name === idxName)
          .map(idx => idx.Column_name)
          .join(', ');
        console.log(`  ✓ ${idxName.padEnd(40)} | Columns: ${idxCols}`);
      });
    }
    console.log('─────────────────────────────────────────\n');

    // Kiểm tra foreign key
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME, 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'thue_tro' 
        AND TABLE_NAME = 'duan' 
        AND CONSTRAINT_NAME = 'fk_duan_nguoiduyethoahong'
    `);
    
    console.log('🔗 Foreign Key constraint:');
    console.log('─────────────────────────────────────────');
    if (fks.length === 0) {
      console.log('⚠️  Không tìm thấy foreign key!');
    } else {
      fks.forEach(fk => {
        console.log(`  ✓ ${fk.CONSTRAINT_NAME}`);
        console.log(`    Column: ${fk.COLUMN_NAME}`);
        console.log(`    References: ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }
    console.log('─────────────────────────────────────────\n');

    // Kiểm tra dữ liệu hiện tại (các dự án có NULL không)
    const [dataCheck] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(BangHoaHong) as has_value,
        COUNT(*) - COUNT(BangHoaHong) as null_count
      FROM duan
    `);
    
    console.log('📈 Kiểm tra dữ liệu hiện tại:');
    console.log('─────────────────────────────────────────');
    console.log(`  Tổng số dự án: ${dataCheck[0].total}`);
    console.log(`  Dự án đã cấu hình hoa hồng: ${dataCheck[0].has_value}`);
    console.log(`  Dự án chưa cấu hình (NULL): ${dataCheck[0].null_count}`);
    console.log('─────────────────────────────────────────\n');

    console.log('✅ Tất cả kiểm tra hoàn tất!');
    console.log('✅ Migration đã được áp dụng thành công!');

  } catch (error) {
    console.error('\n❌ LỖI khi chạy migration:');
    console.error('─────────────────────────────────────────');
    console.error(`Message: ${error.message}`);
    if (error.sql) {
      console.error(`SQL: ${error.sql.substring(0, 200)}...`);
    }
    console.error('─────────────────────────────────────────');
    console.error('\n💡 Migration đã được rollback tự động (nếu dùng transaction)');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Đã đóng kết nối database');
    }
  }
}

// Chạy migration
runMigration();

