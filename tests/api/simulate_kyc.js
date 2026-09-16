#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../config/db');

async function simulateKYC() {
  console.log('📌 Giả lập KYC cho khachang@gmail.com...');

  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update TrangThaiXacMinh thành DaXacMinh
      const [result] = await connection.query(
        'UPDATE nguoidung SET TrangThaiXacMinh = "DaXacMinh" WHERE Email = "khachang@gmail.com"'
      );
      console.log(`✅ Đã update TrangThaiXacMinh: ${result.affectedRows} bản ghi`);
      
      await connection.commit();
      console.log('🎉 Hoàn tất!');
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

simulateKYC()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));