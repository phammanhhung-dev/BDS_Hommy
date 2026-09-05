#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../config/db');

async function prepareTestData() {
  console.log('📌 Tạo dự án test và phòng test...');

  try {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Tạo dự án test
      const [duAnResult] = await connection.query(
        `INSERT INTO duan (ChuDuAnID, TenDuAn, DiaChi, ChinhSachCocID, SoThangCocToiThieu, TrangThai)
         VALUES (7, 'Dự án Test UI', '123 Đường Test, Quận 1, TP.HCM', 1, 1, 'HoatDong')`
      );
      const duAnId = duAnResult.insertId;
      console.log(`✅ Đã tạo dự án ID: ${duAnId}`);
      
      // Tạo phòng test
      const [phongResult] = await connection.query(
        `INSERT INTO phong (DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan)
         VALUES (?, 'Phòng Test UI', 'Trong', 3500000, 25)`,
        [duAnId]
      );
      const phongId = phongResult.insertId;
      console.log(`✅ Đã tạo phòng ID: ${phongId}`);
      
      await connection.commit();
      console.log(`🎉 Hoàn tất! DuAnID=${duAnId}, PhongID=${phongId}`);
      
      // Lưu vào file để dùng sau
      const fs = require('fs');
      fs.writeFileSync(
        path.join(__dirname, 'test_ids.json'),
        JSON.stringify({ duAnId, phongId }, null, 2)
      );
      console.log('📝 Đã lưu IDs vào test_ids.json');
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

prepareTestData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));