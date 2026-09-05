/**
 * Migration: Cập nhật schema Chat hiện tại
 * Date: 2025-11-04
 * Purpose: Thêm constraints, triggers, indexes cho messaging feature
 * 
 * NOTE: Database tables ĐÃ TỒN TẠI trong thue_tro.sql:
 * - cuochoithoai (line 303-312)
 * - thanhviencuochoithoai (line 3778-3782)  
 * - tinnhan (line 3902-3909)
 * 
 * Migration này CHẠY CÁC CÂU LỆNH ALTER để bổ sung:
 * 1. Cột TinNhanCuoiDocLuc cho bảng thanhviencuochoithoai
 * 2. PRIMARY KEY & FOREIGN KEY constraints
 * 3. Triggers cập nhật ThoiDiemTinNhanCuoi
 * 4. Indexes cho performance
 */

-- ==============================================================================
-- 1. ALTER TABLE: Thêm TinNhanCuoiDocLuc vào thanhviencuochoithoai
-- ==============================================================================
ALTER TABLE thanhviencuochoithoai 
ADD COLUMN TinNhanCuoiDocLuc DATETIME NULL COMMENT 'Thời điểm tin nhắn cuối được đọc bởi thành viên' 
AFTER ThamGiaLuc;

-- ==============================================================================
-- 2. Thêm PRIMARY KEY cho thanhviencuochoithoai (nếu chưa có)
-- ==============================================================================
-- Check xem có PRIMARY KEY chưa trước khi thêm
-- Nếu đã có, câu lệnh này sẽ fail - có thể comment lại sau khi chạy lần đầu
ALTER TABLE thanhviencuochoithoai 
ADD PRIMARY KEY (CuocHoiThoaiID, NguoiDungID);

-- ==============================================================================
-- 3. Thêm FOREIGN KEY constraints cho thanhviencuochoithoai
-- ==============================================================================
ALTER TABLE thanhviencuochoithoai 
ADD CONSTRAINT fk_thanhvien_cuochoithoai 
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE;

ALTER TABLE thanhviencuochoithoai
ADD CONSTRAINT fk_thanhvien_nguoidung 
  FOREIGN KEY (NguoiDungID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE;

-- ==============================================================================
-- 4. Thêm FOREIGN KEY constraints cho tinnhan
-- ==============================================================================
ALTER TABLE tinnhan
ADD CONSTRAINT fk_tinnhan_cuochoithoai 
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE;

ALTER TABLE tinnhan
ADD CONSTRAINT fk_tinnhan_nguoigui 
  FOREIGN KEY (NguoiGuiID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE;

-- ==============================================================================
-- 5. Thêm PRIMARY KEY cho cuochoithoai (nếu chưa có)
-- ==============================================================================
-- Check xem có PRIMARY KEY chưa trước khi thêm
ALTER TABLE cuochoithoai 
ADD PRIMARY KEY (CuocHoiThoaiID);

-- ==============================================================================
-- 6. Thêm PRIMARY KEY cho tinnhan (nếu chưa có)
-- ==============================================================================
ALTER TABLE tinnhan 
ADD PRIMARY KEY (TinNhanID);

-- ==============================================================================
-- 7. AUTO_INCREMENT cho các PRIMARY KEY
-- ==============================================================================
ALTER TABLE cuochoithoai 
MODIFY CuocHoiThoaiID INT AUTO_INCREMENT;

ALTER TABLE tinnhan 
MODIFY TinNhanID INT AUTO_INCREMENT;

-- ==============================================================================
-- 8. Trigger: Cập nhật ThoiDiemTinNhanCuoi khi có tin nhắn mới
-- ==============================================================================
-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS trg_after_insert_tinnhan;

DELIMITER //
CREATE TRIGGER trg_after_insert_tinnhan
AFTER INSERT ON tinnhan
FOR EACH ROW
BEGIN
  UPDATE cuochoithoai 
  SET ThoiDiemTinNhanCuoi = NEW.ThoiGian 
  WHERE CuocHoiThoaiID = NEW.CuocHoiThoaiID;
END;
//
DELIMITER ;

-- ==============================================================================
-- 9. Indexes cho Performance Optimization
-- ==============================================================================

-- Index cho tìm kiếm cuộc hội thoại theo ngữ cảnh (TinDang, CuocHen, HopDong)
CREATE INDEX idx_cuochoithoai_ngucanh 
ON cuochoithoai(NguCanhID, NguCanhLoai);

-- Index cho sắp xếp cuộc hội thoại theo tin nhắn cuối
CREATE INDEX idx_cuochoithoai_thoidiemtinnhan 
ON cuochoithoai(ThoiDiemTinNhanCuoi DESC);

-- Index cho tìm kiếm tin nhắn trong một cuộc hội thoại (pagination)
CREATE INDEX idx_tinnhan_cuochoithoai 
ON tinnhan(CuocHoiThoaiID, ThoiGian DESC);

-- Index cho tìm kiếm tin nhắn của một người gửi
CREATE INDEX idx_tinnhan_nguoigui 
ON tinnhan(NguoiGuiID, ThoiGian DESC);

-- Index cho tìm kiếm tin nhắn chưa xóa
CREATE INDEX idx_tinnhan_daxoa 
ON tinnhan(DaXoa, CuocHoiThoaiID);

-- Index cho tìm cuộc hội thoại của một người dùng
CREATE INDEX idx_thanhvien_nguoidung 
ON thanhviencuochoithoai(NguoiDungID, ThamGiaLuc DESC);

-- ==============================================================================
-- 10. ENUM constraint cho NguCanhLoai (nếu chưa có)
-- ==============================================================================
-- Kiểm tra và cập nhật ENUM values
ALTER TABLE cuochoithoai 
MODIFY NguCanhLoai ENUM('TinDang', 'CuocHen', 'HopDong', 'HeThong') NOT NULL 
COMMENT 'Loại ngữ cảnh của cuộc hội thoại';

-- ==============================================================================
-- TESTING QUERIES - Chạy để verify migration thành công
-- ==============================================================================

-- Kiểm tra cấu trúc bảng
-- SHOW CREATE TABLE cuochoithoai;
-- SHOW CREATE TABLE thanhviencuochoithoai;
-- SHOW CREATE TABLE tinnhan;

-- Kiểm tra indexes
-- SHOW INDEX FROM cuochoithoai;
-- SHOW INDEX FROM thanhviencuochoithoai;
-- SHOW INDEX FROM tinnhan;

-- Kiểm tra triggers
-- SHOW TRIGGERS LIKE 'tinnhan';

-- ==============================================================================
-- ROLLBACK SCRIPT (nếu cần revert)
-- ==============================================================================
/*
-- Drop triggers
DROP TRIGGER IF EXISTS trg_after_insert_tinnhan;

-- Drop indexes
DROP INDEX idx_cuochoithoai_ngucanh ON cuochoithoai;
DROP INDEX idx_cuochoithoai_thoidiemtinnhan ON cuochoithoai;
DROP INDEX idx_tinnhan_cuochoithoai ON tinnhan;
DROP INDEX idx_tinnhan_nguoigui ON tinnhan;
DROP INDEX idx_tinnhan_daxoa ON tinnhan;
DROP INDEX idx_thanhvien_nguoidung ON thanhviencuochoithoai;

-- Drop foreign keys
ALTER TABLE thanhviencuochoithoai DROP FOREIGN KEY fk_thanhvien_cuochoithoai;
ALTER TABLE thanhviencuochoithoai DROP FOREIGN KEY fk_thanhvien_nguoidung;
ALTER TABLE tinnhan DROP FOREIGN KEY fk_tinnhan_cuochoithoai;
ALTER TABLE tinnhan DROP FOREIGN KEY fk_tinnhan_nguoigui;

-- Drop column
ALTER TABLE thanhviencuochoithoai DROP COLUMN TinNhanCuoiDocLuc;
*/

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================


