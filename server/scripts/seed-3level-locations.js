#!/usr/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DVHCVN_URL = 'https://raw.githubusercontent.com/daohoangson/dvhcvn/master/data/dvhcvn.json';

function normalizeProvinceName(name) {
  if (!name) return '';
  return String(name).trim();
}

function normalizeProvinceType(name) {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('thành phố') || normalized.includes('thủ đô')) {
    return 'Thành phố';
  }
  return 'Tỉnh';
}

async function seedData() {
  console.log('📦 Đang tải dữ liệu chuẩn 3 cấp từ dvhcvn...');
  
  try {
    const response = await axios.get(DVHCVN_URL, { timeout: 30000, responseType: 'json' });
    const rawData = response.data;
    
    let provinces = [];
    if (Array.isArray(rawData)) provinces = rawData;
    else if (rawData && Array.isArray(rawData.data)) provinces = rawData.data;
    else if (rawData && Array.isArray(rawData.level1s)) provinces = rawData.level1s;
    
    if (provinces.length === 0) {
      throw new Error('Không tìm thấy danh sách tỉnh/thành từ nguồn dữ liệu dvhcvn.');
    }
    
    console.log(`✅ Đã lấy thành công ${provinces.length} tỉnh/thành phố.`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'realestate'
    });

    console.log('⚠️  Đang làm sạch các bảng new_provinces, new_districts, new_communes...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE new_communes');
    await connection.query('TRUNCATE TABLE new_districts');
    await connection.query('TRUNCATE TABLE new_provinces');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    let countProvinces = 0;
    let countDistricts = 0;
    let countWards = 0;

    for (const province of provinces) {
      const provinceName = normalizeProvinceName(province?.name);
      if (!provinceName) continue;
      
      const provinceType = normalizeProvinceType(provinceName);
      const provinceCode = province.level1_id || '';
      
      const [insertProvince] = await connection.execute(
        `INSERT INTO new_provinces (ProvinceCode, ProvinceName, ProvinceType) VALUES (?, ?, ?)`,
        [provinceCode, provinceName, provinceType]
      );
      
      const provinceId = insertProvince.insertId;
      countProvinces++;
      
      const districts = Array.isArray(province?.level2s) ? province.level2s : [];
      for (const district of districts) {
        const districtName = String(district?.name || '').trim();
        if (!districtName) continue;
        
        const districtCode = district.level2_id || '';
        
        const [insertDistrict] = await connection.execute(
          `INSERT INTO new_districts (ProvinceID, DistrictCode, DistrictName) VALUES (?, ?, ?)`,
          [provinceId, districtCode, districtName]
        );
        
        const districtId = insertDistrict.insertId;
        countDistricts++;
        
        const wards = Array.isArray(district?.level3s) ? district.level3s : [];
        if (wards.length > 0) {
            const wardRows = wards.map(ward => {
                const wardName = String(ward?.name || '').trim();
                const wardCode = ward.level3_id || '';
                const wardType = String(ward?.type || '').trim();
                return [provinceId, districtId, wardCode, wardName, wardType];
            }).filter(w => w[3] !== '');
            
            if (wardRows.length > 0) {
                await connection.query(
                    `INSERT INTO new_communes (ProvinceID, DistrictID, CommuneCode, CommuneName, CommuneType) VALUES ?`,
                    [wardRows]
                );
                countWards += wardRows.length;
            }
        }
      }
    }

    console.log(`🎉 Nạp dữ liệu thành công!`);
    console.log(`📊 Thống kê: ${countProvinces} Tỉnh/Thành phố, ${countDistricts} Quận/Huyện, ${countWards} Phường/Xã.`);

    await connection.end();
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

async function ensureSchema() {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'realestate'
    });
    
    const [rows] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'new_communes' 
          AND COLUMN_NAME = 'DistrictID'
    `);
    
    if (rows.length === 0) {
        console.log('⚙️ Bổ sung cột DistrictID cho bảng new_communes...');
        await connection.query('ALTER TABLE new_communes ADD COLUMN DistrictID INT AFTER ProvinceID');
    }
    
    await connection.end();
}

async function main() {
    await ensureSchema();
    await seedData();
}

main();
