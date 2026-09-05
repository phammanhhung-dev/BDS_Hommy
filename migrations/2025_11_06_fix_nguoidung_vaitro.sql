-- =====================================================
-- Migration: Fix nguoidung_vaitro for Sales Staff
-- Date: 2025-11-06
-- Problem: User has VaiTroHoatDongID=2 but no entry in nguoidung_vaitro
-- Impact: Backend middleware rejects API calls with 403 Forbidden
-- =====================================================

USE thue_tro;

-- =====================================================
-- 1. Insert missing role for banhang@gmail.com
-- =====================================================
INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
SELECT NguoiDungID, VaiTroHoatDongID
FROM nguoidung
WHERE Email = 'banhang@gmail.com'
  AND VaiTroHoatDongID = 2;

-- =====================================================
-- 2. Insert missing role for banhangtest@example.com (if exists)
-- =====================================================
INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
SELECT NguoiDungID, VaiTroHoatDongID
FROM nguoidung
WHERE Email = 'banhangtest@example.com'
  AND VaiTroHoatDongID = 2;

-- =====================================================
-- 3. Fix ALL users who have VaiTroHoatDongID but no nguoidung_vaitro entry
-- =====================================================
INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
SELECT n.NguoiDungID, n.VaiTroHoatDongID
FROM nguoidung n
LEFT JOIN nguoidung_vaitro nv ON n.NguoiDungID = nv.NguoiDungID AND n.VaiTroHoatDongID = nv.VaiTroID
WHERE n.VaiTroHoatDongID IS NOT NULL
  AND nv.NguoiDungID IS NULL;

-- =====================================================
-- 4. Verify fix
-- =====================================================
SELECT 
  n.NguoiDungID,
  n.TenDayDu,
  n.Email,
  n.VaiTroHoatDongID,
  v1.TenVaiTro AS 'VaiTroHoatDong',
  nv.VaiTroID AS 'VaiTroInNguoiDungVaiTro',
  v2.TenVaiTro AS 'TenVaiTroInNguoiDungVaiTro'
FROM nguoidung n
LEFT JOIN vaitro v1 ON n.VaiTroHoatDongID = v1.VaiTroID
LEFT JOIN nguoidung_vaitro nv ON n.NguoiDungID = nv.NguoiDungID
LEFT JOIN vaitro v2 ON nv.VaiTroID = v2.VaiTroID
WHERE n.Email IN ('banhang@gmail.com', 'banhangtest@example.com')
ORDER BY n.Email;

-- =====================================================
-- Expected Output:
-- =====================================================
-- NguoiDungID | TenDayDu               | Email                    | VaiTroHoatDongID | VaiTroHoatDong      | VaiTroInNguoiDungVaiTro | TenVaiTroInNguoiDungVaiTro
-- ------------|------------------------|--------------------------|------------------|---------------------|--------------------------|--------------------------
-- 8           | Nguyễn Văn Bán Hàng   | banhang@gmail.com        | 2                | Nhân viên Bán hàng  | 2                        | Nhân viên Bán hàng
-- 3           | Lê Văn Bán Hàng       | banhangtest@example.com  | 2                | Nhân viên Bán hàng  | 2                        | Nhân viên Bán hàng
-- =====================================================

-- =====================================================
-- 5. Create Trigger to auto-sync nguoidung_vaitro when VaiTroHoatDongID changes
-- =====================================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_sync_nguoidung_vaitro_on_insert$$
CREATE TRIGGER trg_sync_nguoidung_vaitro_on_insert
AFTER INSERT ON nguoidung
FOR EACH ROW
BEGIN
  -- Auto-insert into nguoidung_vaitro when new user created
  IF NEW.VaiTroHoatDongID IS NOT NULL THEN
    INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
    VALUES (NEW.NguoiDungID, NEW.VaiTroHoatDongID);
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_sync_nguoidung_vaitro_on_update$$
CREATE TRIGGER trg_sync_nguoidung_vaitro_on_update
AFTER UPDATE ON nguoidung
FOR EACH ROW
BEGIN
  -- Remove old role if VaiTroHoatDongID changed
  IF OLD.VaiTroHoatDongID IS NOT NULL AND OLD.VaiTroHoatDongID != NEW.VaiTroHoatDongID THEN
    DELETE FROM nguoidung_vaitro 
    WHERE NguoiDungID = NEW.NguoiDungID 
      AND VaiTroID = OLD.VaiTroHoatDongID;
  END IF;
  
  -- Insert new role
  IF NEW.VaiTroHoatDongID IS NOT NULL THEN
    INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
    VALUES (NEW.NguoiDungID, NEW.VaiTroHoatDongID);
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- 6. Test trigger
-- =====================================================
-- Update a test user's role to verify trigger works
UPDATE nguoidung 
SET VaiTroHoatDongID = 2 
WHERE Email = 'banhang@gmail.com';

-- Verify trigger inserted the role
SELECT 
  n.NguoiDungID,
  n.Email,
  n.VaiTroHoatDongID,
  COUNT(nv.VaiTroID) AS RoleCount
FROM nguoidung n
LEFT JOIN nguoidung_vaitro nv ON n.NguoiDungID = nv.NguoiDungID
WHERE n.Email = 'banhang@gmail.com'
GROUP BY n.NguoiDungID, n.Email, n.VaiTroHoatDongID;

-- Expected: RoleCount >= 1

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Fixed: Missing nguoidung_vaitro entries
-- ✅ Created: Auto-sync triggers to prevent future issues
-- ✅ Impact: Backend authorization will now work
-- 
-- Next: Restart backend server and test login
-- =====================================================






