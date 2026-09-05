#!/usr/bin/env node

const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../config/db');

async function resetOperatorPassword() {
  console.log('📌 Reset mật khẩu cho dieuhanhtest@example.com...');

  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Hash password mới
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      // Update password
      const [result] = await connection.query(
        'UPDATE nguoidung SET MatKhauHash = ? WHERE Email = ?',
        [hashedPassword, 'dieuhanhtest@example.com']
      );
      
      console.log(`✅ Đã reset mật khẩu thành công. Số bản ghi ảnh hưởng: ${result.affectedRows}`);
      console.log(`✅ Mật khẩu mới: 123456`);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

resetOperatorPassword()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));