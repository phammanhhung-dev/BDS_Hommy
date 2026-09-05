-- ============================================================================
-- MIGRATION: Đồng bộ trạng thái phòng giữa các tin đăng
-- Ngày: 09/10/2025
-- Mục đích: Fix vấn đề phòng trùng lặp giữa các tin đăng cùng dự án
-- ============================================================================

-- Bước 1: Chuẩn hóa tên phòng hiện tại (loại bỏ khoảng trắng thừa)
UPDATE phong 
SET TenPhong = TRIM(TenPhong)
WHERE TenPhong != TRIM(TenPhong);

-- Bước 2: Thêm constraint để ngăn tạo phòng trùng trong cùng tin đăng
ALTER TABLE phong 
ADD UNIQUE KEY IF NOT EXISTS unique_phong_tindang (TinDangID, TenPhong);

-- Bước 3: Tạo trigger đồng bộ trạng thái khi UPDATE
DROP TRIGGER IF EXISTS trg_phong_sync_status_update;

DELIMITER $$

CREATE TRIGGER trg_phong_sync_status_update
AFTER UPDATE ON phong
FOR EACH ROW
BEGIN
  DECLARE v_du_an_id INT;
  
  -- Chỉ chạy khi TrangThai thay đổi
  IF NEW.TrangThai != OLD.TrangThai THEN
    
    -- Lấy DuAnID của phòng hiện tại
    SELECT DuAnID INTO v_du_an_id
    FROM tindang
    WHERE TinDangID = NEW.TinDangID;
    
    -- Cập nhật tất cả phòng cùng tên trong cùng dự án
    -- (trừ phòng hiện tại đang được update)
    UPDATE phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    SET p.TrangThai = NEW.TrangThai,
        p.CapNhatLuc = CURRENT_TIMESTAMP
    WHERE td.DuAnID = v_du_an_id
      AND p.TenPhong = NEW.TenPhong
      AND p.PhongID != NEW.PhongID
      AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang'); -- Chỉ sync tin đăng đang active
      
  END IF;
END$$

DELIMITER ;

-- Bước 4: Tạo trigger đồng bộ khi INSERT (phòng mới tạo)
DROP TRIGGER IF EXISTS trg_phong_sync_status_insert;

DELIMITER $$

CREATE TRIGGER trg_phong_sync_status_insert
AFTER INSERT ON phong
FOR EACH ROW
BEGIN
  DECLARE v_du_an_id INT;
  DECLARE v_trang_thai_existing VARCHAR(20);
  
  -- Lấy DuAnID của phòng mới
  SELECT DuAnID INTO v_du_an_id
  FROM tindang
  WHERE TinDangID = NEW.TinDangID;
  
  -- Kiểm tra xem có phòng cùng tên trong dự án không
  SELECT p.TrangThai INTO v_trang_thai_existing
  FROM phong p
  JOIN tindang td ON p.TinDangID = td.TinDangID
  WHERE td.DuAnID = v_du_an_id
    AND p.TenPhong = NEW.TenPhong
    AND p.PhongID != NEW.PhongID
    AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
  ORDER BY 
    CASE p.TrangThai
      WHEN 'DaThue' THEN 1
      WHEN 'GiuCho' THEN 2
      WHEN 'DonDep' THEN 3
      WHEN 'Trong' THEN 4
    END
  LIMIT 1;
  
  -- Nếu tìm thấy phòng cùng tên, đồng bộ trạng thái "ưu tiên cao hơn"
  IF v_trang_thai_existing IS NOT NULL AND v_trang_thai_existing != 'Trong' THEN
    UPDATE phong 
    SET TrangThai = v_trang_thai_existing,
        CapNhatLuc = CURRENT_TIMESTAMP
    WHERE PhongID = NEW.PhongID;
  END IF;
END$$

DELIMITER ;

-- Bước 5: Tạo stored procedure để đồng bộ thủ công tất cả phòng
DROP PROCEDURE IF EXISTS sp_sync_all_phong_status;

DELIMITER $$

CREATE PROCEDURE sp_sync_all_phong_status()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_phong_id INT;
  DECLARE v_ten_phong VARCHAR(100);
  DECLARE v_trang_thai VARCHAR(20);
  DECLARE v_du_an_id INT;
  
  DECLARE phong_cursor CURSOR FOR
    SELECT p.PhongID, p.TenPhong, p.TrangThai, td.DuAnID
    FROM phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    WHERE td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
    ORDER BY 
      td.DuAnID,
      p.TenPhong,
      CASE p.TrangThai
        WHEN 'DaThue' THEN 1
        WHEN 'GiuCho' THEN 2
        WHEN 'DonDep' THEN 3
        WHEN 'Trong' THEN 4
      END;
      
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN phong_cursor;
  
  read_loop: LOOP
    FETCH phong_cursor INTO v_phong_id, v_ten_phong, v_trang_thai, v_du_an_id;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Cập nhật tất cả phòng cùng tên trong dự án
    UPDATE phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    SET p.TrangThai = v_trang_thai,
        p.CapNhatLuc = CURRENT_TIMESTAMP
    WHERE td.DuAnID = v_du_an_id
      AND p.TenPhong = v_ten_phong
      AND p.PhongID != v_phong_id
      AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang');
      
  END LOOP;
  
  CLOSE phong_cursor;
  
  SELECT 'Đồng bộ trạng thái phòng hoàn tất!' AS Message;
END$$

DELIMITER ;

-- Bước 6: Tạo view để kiểm tra phòng trùng lặp
CREATE OR REPLACE VIEW v_phong_trung_lap AS
SELECT 
  td.DuAnID,
  d.TenDuAn,
  p.TenPhong,
  COUNT(DISTINCT p.PhongID) as SoLuongBanGhi,
  COUNT(DISTINCT p.TrangThai) as SoTrangThaiKhacNhau,
  GROUP_CONCAT(
    CONCAT(
      'TinDang ', td.TinDangID, ': ', p.TrangThai, ' (PhongID: ', p.PhongID, ')'
    ) 
    SEPARATOR ' | '
  ) as ChiTiet
FROM phong p
JOIN tindang td ON p.TinDangID = td.TinDangID
JOIN duan d ON td.DuAnID = d.DuAnID
WHERE td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
GROUP BY td.DuAnID, d.TenDuAn, p.TenPhong
HAVING SoLuongBanGhi > 1
ORDER BY td.DuAnID, p.TenPhong;

-- ============================================================================
-- CÁCH SỬ DỤNG
-- ============================================================================

-- 1. Chạy đồng bộ thủ công lần đầu:
-- CALL sp_sync_all_phong_status();

-- 2. Kiểm tra phòng trùng lặp:
-- SELECT * FROM v_phong_trung_lap;

-- 3. Kiểm tra log trigger (nếu có lỗi):
-- SHOW TRIGGERS LIKE 'phong';

-- ============================================================================
-- ROLLBACK (nếu cần)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trg_phong_sync_status_update;
-- DROP TRIGGER IF EXISTS trg_phong_sync_status_insert;
-- DROP PROCEDURE IF EXISTS sp_sync_all_phong_status;
-- DROP VIEW IF EXISTS v_phong_trung_lap;
-- ALTER TABLE phong DROP INDEX unique_phong_tindang;

