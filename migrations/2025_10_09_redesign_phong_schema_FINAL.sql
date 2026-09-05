-- ============================================================================
-- MIGRATION: Tái cấu trúc bảng PHONG (Phòng gắn với Dự án)
-- Ngày: 09/10/2025
-- Ý tưởng: Kết hợp đề xuất Chủ dự án + Best practices
-- ============================================================================
-- 
-- TRƯỚC KHI CHẠY:
--   1. ✅ Backup database: mysqldump -u root -p thue_tro > backup_$(date +%Y%m%d).sql
--   2. ✅ Test trên staging trước
--   3. ✅ Chạy trong giờ thấp điểm
--   4. ✅ Thông báo downtime (ước tính: 5-10 phút)
--
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ============================================================================
-- BƯỚC 1: TẠO BẢNG MỚI
-- ============================================================================

-- 1.1. Rename bảng cũ để backup
RENAME TABLE phong TO phong_old;

-- 1.2. Tạo bảng PHONG mới (gắn với DuAn)
CREATE TABLE phong (
  PhongID INT NOT NULL AUTO_INCREMENT,
  DuAnID INT NOT NULL COMMENT 'Phòng thuộc dự án nào',
  TenPhong VARCHAR(100) NOT NULL COMMENT 'Tên/Số phòng (VD: 101, A01, ...)',
  TrangThai ENUM('Trong','GiuCho','DaThue','DonDep') NOT NULL DEFAULT 'Trong' COMMENT 'Trạng thái duy nhất của phòng',
  
  -- Thông tin chuẩn (có thể override ở tin đăng)
  GiaChuan DECIMAL(15,2) DEFAULT NULL COMMENT 'Giá chuẩn (VNĐ/tháng)',
  DienTichChuan DECIMAL(5,2) DEFAULT NULL COMMENT 'Diện tích chuẩn (m²)',
  MoTaPhong TEXT DEFAULT NULL COMMENT 'Đặc điểm: tầng, hướng, view, nội thất...',
  HinhAnhPhong VARCHAR(500) DEFAULT NULL COMMENT 'Hình đại diện phòng (1 hình)',
  
  -- Metadata
  TaoLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (PhongID),
  FOREIGN KEY (DuAnID) REFERENCES duan(DuAnID) ON DELETE CASCADE,
  UNIQUE KEY unique_phong_duan (DuAnID, TenPhong),
  INDEX idx_phong_duan_trangthai (DuAnID, TrangThai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Bảng phòng Master - Thuộc Dự án (1 phòng vật lý = 1 bản ghi)';

-- 1.3. Tạo bảng PHONG_TINDANG (Mapping N-N)
CREATE TABLE phong_tindang (
  PhongTinDangID INT NOT NULL AUTO_INCREMENT,
  PhongID INT NOT NULL COMMENT 'FK đến bảng phong',
  TinDangID INT NOT NULL COMMENT 'FK đến bảng tindang',
  
  -- Metadata riêng cho từng tin đăng (override giá trị chuẩn)
  GiaTinDang DECIMAL(15,2) DEFAULT NULL COMMENT 'Giá riêng cho tin này (NULL = dùng GiaChuan)',
  DienTichTinDang DECIMAL(5,2) DEFAULT NULL COMMENT 'Diện tích riêng (NULL = dùng DienTichChuan)',
  MoTaTinDang TEXT DEFAULT NULL COMMENT 'Mô tả marketing riêng (VD: "Ưu đãi SV", "Tặng 1 tháng")',
  HinhAnhTinDang VARCHAR(500) DEFAULT NULL COMMENT 'Hình riêng (NULL = dùng HinhAnhPhong)',
  ThuTuHienThi INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trong tin đăng',
  
  -- Metadata
  TaoLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (PhongTinDangID),
  FOREIGN KEY (PhongID) REFERENCES phong(PhongID) ON DELETE CASCADE,
  FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID) ON DELETE CASCADE,
  UNIQUE KEY unique_phong_per_tindang (TinDangID, PhongID),
  INDEX idx_phong_tindang_phong (PhongID),
  INDEX idx_phong_tindang_tindang (TinDangID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Mapping N-N giữa Phòng và Tin đăng (lưu metadata riêng cho mỗi tin)';

-- ============================================================================
-- BƯỚC 2: MIGRATE DỮ LIỆU
-- ============================================================================

-- 2.1. Tạo phòng Master (loại bỏ duplicate, giữ trạng thái ưu tiên)
INSERT INTO phong (DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan, HinhAnhPhong, TaoLuc)
SELECT 
  td.DuAnID,
  TRIM(UPPER(po.TenPhong)) as TenPhong,
  
  -- Lấy trạng thái "ưu tiên" nhất (DaThue > GiuCho > DonDep > Trong)
  (SELECT p2.TrangThai 
   FROM phong_old p2
   JOIN tindang t2 ON p2.TinDangID = t2.TinDangID
   WHERE t2.DuAnID = td.DuAnID 
     AND TRIM(UPPER(p2.TenPhong)) = TRIM(UPPER(po.TenPhong))
   ORDER BY 
     CASE p2.TrangThai
       WHEN 'DaThue' THEN 1
       WHEN 'GiuCho' THEN 2
       WHEN 'DonDep' THEN 3
       WHEN 'Trong' THEN 4
     END
   LIMIT 1
  ) as TrangThai,
  
  -- Lấy giá trung bình (hoặc giá đầu tiên)
  AVG(po.Gia) as GiaChuan,
  AVG(po.DienTich) as DienTichChuan,
  
  -- Lấy hình đầu tiên
  (SELECT p3.URL 
   FROM phong_old p3
   JOIN tindang t3 ON p3.TinDangID = t3.TinDangID
   WHERE t3.DuAnID = td.DuAnID 
     AND TRIM(UPPER(p3.TenPhong)) = TRIM(UPPER(po.TenPhong))
     AND p3.URL IS NOT NULL
   LIMIT 1
  ) as HinhAnhPhong,
  
  MIN(po.TaoLuc) as TaoLuc
  
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
GROUP BY td.DuAnID, TRIM(UPPER(po.TenPhong))
ON DUPLICATE KEY UPDATE 
  TrangThai = VALUES(TrangThai),
  GiaChuan = VALUES(GiaChuan),
  DienTichChuan = VALUES(DienTichChuan);

-- 2.2. Tạo mapping phong_tindang
INSERT INTO phong_tindang (PhongID, TinDangID, GiaTinDang, DienTichTinDang, HinhAnhTinDang, ThuTuHienThi, TaoLuc)
SELECT 
  p.PhongID,
  po.TinDangID,
  
  -- Nếu giá khác GiaChuan → Lưu override, nếu giống → NULL
  IF(ABS(po.Gia - p.GiaChuan) > 0.01, po.Gia, NULL) as GiaTinDang,
  IF(ABS(po.DienTich - p.DienTichChuan) > 0.01, po.DienTich, NULL) as DienTichTinDang,
  IF(po.URL != p.HinhAnhPhong, po.URL, NULL) as HinhAnhTinDang,
  
  0 as ThuTuHienThi,
  po.TaoLuc
  
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
JOIN phong p ON p.DuAnID = td.DuAnID AND TRIM(UPPER(p.TenPhong)) = TRIM(UPPER(po.TenPhong))
ON DUPLICATE KEY UPDATE
  GiaTinDang = VALUES(GiaTinDang);

-- ============================================================================
-- BƯỚC 3: CẬP NHẬT FOREIGN KEYS
-- ============================================================================

-- 3.1. Bảng COC
-- Tạo bảng mapping tạm để convert PhongID cũ → PhongID mới
CREATE TEMPORARY TABLE temp_phong_mapping AS
SELECT 
  po.PhongID as PhongID_old,
  p.PhongID as PhongID_new
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
JOIN phong p ON p.DuAnID = td.DuAnID AND TRIM(UPPER(p.TenPhong)) = TRIM(UPPER(po.TenPhong));

-- Drop FK cũ
ALTER TABLE coc DROP FOREIGN KEY IF EXISTS coc_ibfk_1;
ALTER TABLE coc DROP FOREIGN KEY IF EXISTS coc_ibfk_phong;

-- Update PhongID
UPDATE coc c
JOIN temp_phong_mapping tm ON c.PhongID = tm.PhongID_old
SET c.PhongID = tm.PhongID_new;

-- Add FK mới
ALTER TABLE coc
ADD CONSTRAINT coc_ibfk_phong 
FOREIGN KEY (PhongID) REFERENCES phong(PhongID);

-- 3.2. Bảng CUOCHEN
ALTER TABLE cuochen DROP FOREIGN KEY IF EXISTS cuochen_ibfk_1;
ALTER TABLE cuochen DROP FOREIGN KEY IF EXISTS cuochen_ibfk_phong;

UPDATE cuochen ch
JOIN temp_phong_mapping tm ON ch.PhongID = tm.PhongID_old
SET ch.PhongID = tm.PhongID_new;

ALTER TABLE cuochen
ADD CONSTRAINT cuochen_ibfk_phong
FOREIGN KEY (PhongID) REFERENCES phong(PhongID);

-- Drop temp table
DROP TEMPORARY TABLE temp_phong_mapping;

-- ============================================================================
-- BƯỚC 4: TẠO VIEWS & PROCEDURES HỖ TRỢ
-- ============================================================================

-- 4.1. View: Hiển thị phòng với thông tin tin đăng
CREATE OR REPLACE VIEW v_phong_full_info AS
SELECT 
  p.PhongID,
  p.DuAnID,
  d.TenDuAn,
  p.TenPhong,
  p.TrangThai,
  p.GiaChuan,
  p.DienTichChuan,
  
  -- Đếm số tin đăng đang sử dụng phòng này
  COUNT(pt.TinDangID) as SoTinDangDangDung,
  
  -- Danh sách tin đăng
  GROUP_CONCAT(
    CONCAT('TinDang #', pt.TinDangID, ': ', COALESCE(pt.GiaTinDang, p.GiaChuan), 'đ')
    SEPARATOR ' | '
  ) as ChiTietTinDang
  
FROM phong p
JOIN duan d ON p.DuAnID = d.DuAnID
LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
GROUP BY p.PhongID, p.DuAnID, d.TenDuAn, p.TenPhong, p.TrangThai, p.GiaChuan, p.DienTichChuan;

-- 4.2. Stored Procedure: Lấy danh sách phòng có sẵn cho dự án
DROP PROCEDURE IF EXISTS sp_get_phong_by_duan;

DELIMITER $$
CREATE PROCEDURE sp_get_phong_by_duan(IN p_duan_id INT)
BEGIN
  SELECT 
    p.PhongID,
    p.TenPhong,
    p.TrangThai,
    p.GiaChuan,
    p.DienTichChuan,
    p.MoTaPhong,
    p.HinhAnhPhong,
    COUNT(pt.TinDangID) as SoTinDangDangDung,
    p.TaoLuc
  FROM phong p
  LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
  LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID 
    AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
  WHERE p.DuAnID = p_duan_id
  GROUP BY p.PhongID
  ORDER BY p.TenPhong;
END$$
DELIMITER ;

-- 4.3. Stored Procedure: Lấy phòng của tin đăng (với override)
DROP PROCEDURE IF EXISTS sp_get_phong_by_tindang;

DELIMITER $$
CREATE PROCEDURE sp_get_phong_by_tindang(IN p_tindang_id INT)
BEGIN
  SELECT 
    p.PhongID,
    p.TenPhong,
    p.TrangThai,
    
    -- Giá hiển thị: Ưu tiên GiaTinDang, fallback GiaChuan
    COALESCE(pt.GiaTinDang, p.GiaChuan) as GiaHienThi,
    COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTichHienThi,
    COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTaHienThi,
    COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as HinhAnhHienThi,
    
    -- Thông tin gốc
    p.GiaChuan,
    p.DienTichChuan,
    p.MoTaPhong,
    
    -- Metadata
    pt.ThuTuHienThi
    
  FROM phong_tindang pt
  JOIN phong p ON pt.PhongID = p.PhongID
  WHERE pt.TinDangID = p_tindang_id
  ORDER BY pt.ThuTuHienThi, p.TenPhong;
END$$
DELIMITER ;

-- ============================================================================
-- BƯỚC 5: VERIFY DATA
-- ============================================================================

-- Kiểm tra số lượng phòng
SELECT 
  'Số phòng cũ (unique)' as Description,
  COUNT(DISTINCT CONCAT(td.DuAnID, '-', UPPER(TRIM(po.TenPhong)))) as Count
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID

UNION ALL

SELECT 
  'Số phòng mới' as Description,
  COUNT(*) as Count
FROM phong;

-- Kiểm tra mapping
SELECT 
  'Số phòng-tin đăng cũ' as Description,
  COUNT(*) as Count
FROM phong_old

UNION ALL

SELECT 
  'Số phong_tindang mới' as Description,
  COUNT(*) as Count
FROM phong_tindang;

-- Kiểm tra phòng không migrate được
SELECT 
  po.PhongID as PhongID_old,
  po.TenPhong,
  po.TinDangID,
  td.DuAnID,
  'Không tìm thấy PhongID mới' as Error
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
LEFT JOIN phong p ON p.DuAnID = td.DuAnID AND TRIM(UPPER(p.TenPhong)) = TRIM(UPPER(po.TenPhong))
WHERE p.PhongID IS NULL;

-- ============================================================================
-- COMMIT HOẶC ROLLBACK
-- ============================================================================

-- Nếu tất cả OK:
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- Bảng phong_old không còn được sử dụng trong kiến trúc mới
DROP TABLE IF EXISTS phong_old;

-- ============================================================================
-- ROLLBACK (Nếu có lỗi)
-- ============================================================================
-- ROLLBACK;
-- RENAME TABLE phong_old TO phong;
-- DROP TABLE IF EXISTS phong_tindang;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- CÁCH SỬ DỤNG SAU KHI MIGRATE
-- ============================================================================

-- 1. Lấy danh sách phòng của dự án:
-- CALL sp_get_phong_by_duan(14);

-- 2. Lấy phòng của tin đăng (với giá override):
-- CALL sp_get_phong_by_tindang(4);

-- 3. Xem thông tin đầy đủ:
-- SELECT * FROM v_phong_full_info WHERE DuAnID = 14;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

