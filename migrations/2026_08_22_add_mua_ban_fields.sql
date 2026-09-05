-- Migration: Thêm các field cho module Mua bán nhà đất
-- Date: 2026-08-22
-- Architecture: Tin bán độc lập, không bắt buộc DuAnID/PhongIDs

-- Thêm cột phân loại giao dịch (Bán/Thue)
ALTER TABLE tindang ADD COLUMN LoaiGiaoDich ENUM('Ban','Thue') NOT NULL DEFAULT 'Thue' AFTER TrangThai;

-- Thêm các field cho tin bán
ALTER TABLE tindang ADD COLUMN LoaiBDS VARCHAR(50) DEFAULT NULL AFTER LoaiGiaoDich;
ALTER TABLE tindang ADD COLUMN GiaTien DECIMAL(15,2) DEFAULT NULL AFTER LoaiBDS;
ALTER TABLE tindang ADD COLUMN DienTichDat DECIMAL(8,2) DEFAULT NULL AFTER GiaTien;
ALTER TABLE tindang ADD COLUMN DienTichSuDung DECIMAL(8,2) DEFAULT NULL AFTER DienTichDat;
ALTER TABLE tindang ADD COLUMN SoTang INT DEFAULT NULL AFTER DienTichSuDung;
ALTER TABLE tindang ADD COLUMN SoPhongNgu INT DEFAULT NULL AFTER SoTang;
ALTER TABLE tindang ADD COLUMN SoPhongTam INT DEFAULT NULL AFTER SoPhongNgu;
ALTER TABLE tindang ADD COLUMN Huong VARCHAR(20) DEFAULT NULL AFTER SoPhongTam;
ALTER TABLE tindang ADD COLUMN PhapLy VARCHAR(50) DEFAULT NULL AFTER Huong;
ALTER TABLE tindang ADD COLUMN NamXayDung YEAR DEFAULT NULL AFTER PhapLy;
ALTER TABLE tindang ADD COLUMN NoiThat VARCHAR(50) DEFAULT NULL AFTER NamXayDung;
