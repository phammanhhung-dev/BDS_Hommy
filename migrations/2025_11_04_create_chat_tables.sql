-- =====================================================
-- MIGRATION: Tạo bảng hệ thống TIN NHẮN (Chat System)
-- Date: 2025-11-04
-- Author: Development Team
-- Reference: UC-PROJ-05, UC-CUST-07, UC-SALE-07
-- Description: Tạo bảng cuochoithoai, thanhviencuochoithoai, tinnhan
--              cho tính năng real-time messaging
-- =====================================================

USE thue_tro;

-- =====================================================
-- 1. Bảng CUỘC HỘI THOẠI (Conversation)
-- =====================================================
CREATE TABLE IF NOT EXISTS cuochoithoai (
  CuocHoiThoaiID INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Context (cuộc hội thoại về tin đăng, cuộc hẹn, hợp đồng, hoặc general)
  NguCanhID INT COMMENT 'ID của entity context (TinDangID, CuocHenID, HopDongID...)',
  NguCanhLoai ENUM('TinDang', 'CuocHen', 'HopDong', 'General') DEFAULT 'General' 
    COMMENT 'Loại context của cuộc hội thoại',
  
  -- Metadata
  TieuDe VARCHAR(255) COMMENT 'Tiêu đề cuộc hội thoại (auto-generated hoặc custom)',
  ThoiDiemTinNhanCuoi DATETIME COMMENT 'Thời điểm tin nhắn cuối (để sort danh sách)',
  DangHoatDong TINYINT(1) DEFAULT 1 COMMENT '1=Active, 0=Archived',
  
  -- Timestamps
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_ngucanh (NguCanhID, NguCanhLoai),
  INDEX idx_thoidiemtinnhancuoi (ThoiDiemTinNhanCuoi),
  INDEX idx_danghoatdong (DangHoatDong)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng quản lý cuộc hội thoại (conversation) giữa các user';

-- =====================================================
-- 2. Bảng THÀNH VIÊN CUỘC HỘI THOẠI (Conversation Members)
-- =====================================================
CREATE TABLE IF NOT EXISTS thanhviencuochoithoai (
  CuocHoiThoaiID INT NOT NULL,
  NguoiDungID INT NOT NULL,
  
  -- Timestamps
  ThamGiaLuc DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tham gia cuộc hội thoại',
  TinNhanCuoiDocLuc DATETIME COMMENT 'Thời điểm đọc tin nhắn cuối (cho unread badge)',
  
  -- Primary Key
  PRIMARY KEY (CuocHoiThoaiID, NguoiDungID),
  
  -- Foreign Keys
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE,
  FOREIGN KEY (NguoiDungID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_nguoidung (NguoiDungID),
  INDEX idx_tinnhancuoidocluc (TinNhanCuoiDocLuc)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng trung gian lưu thành viên của cuộc hội thoại và thời điểm đã đọc';

-- =====================================================
-- 3. Bảng TIN NHẮN (Message)
-- =====================================================
CREATE TABLE IF NOT EXISTS tinnhan (
  TinNhanID INT PRIMARY KEY AUTO_INCREMENT,
  
  -- References
  CuocHoiThoaiID INT NOT NULL COMMENT 'Cuộc hội thoại chứa tin nhắn này',
  NguoiGuiID INT NOT NULL COMMENT 'ID người gửi tin nhắn',
  
  -- Content
  NoiDung TEXT NOT NULL COMMENT 'Nội dung tin nhắn (đã sanitize XSS)',
  
  -- Metadata
  ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian gửi tin nhắn',
  DaXoa TINYINT(1) DEFAULT 0 COMMENT '1=Deleted (soft delete), 0=Normal',
  
  -- Foreign Keys
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE,
  FOREIGN KEY (NguoiGuiID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_cuochoithoai (CuocHoiThoaiID),
  INDEX idx_thoigian (ThoiGian),
  INDEX idx_nguoigui (NguoiGuiID),
  INDEX idx_daxoa (DaXoa)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lưu tin nhắn trong cuộc hội thoại';

-- =====================================================
-- 4. TRIGGER: Cập nhật ThoiDiemTinNhanCuoi
-- =====================================================
DELIMITER $$

DROP TRIGGER IF EXISTS update_conversation_timestamp$$

CREATE TRIGGER update_conversation_timestamp 
AFTER INSERT ON tinnhan
FOR EACH ROW
BEGIN
  -- Cập nhật thời điểm tin nhắn cuối khi có tin nhắn mới
  UPDATE cuochoithoai 
  SET ThoiDiemTinNhanCuoi = NEW.ThoiGian,
      CapNhatLuc = CURRENT_TIMESTAMP
  WHERE CuocHoiThoaiID = NEW.CuocHoiThoaiID;
END$$

DELIMITER ;

-- =====================================================
-- 5. SAMPLE DATA (Optional - cho testing)
-- =====================================================

-- Lấy ID của user đầu tiên (KhachHang) và user thứ 2 (ChuDuAn) để test
SET @khach_hang_id = (SELECT NguoiDungID FROM nguoidung WHERE VaiTroHoatDongID IN (SELECT VaiTroID FROM vaitro WHERE TenVaiTro = 'KhachHang') LIMIT 1);
SET @chu_du_an_id = (SELECT NguoiDungID FROM nguoidung WHERE VaiTroHoatDongID IN (SELECT VaiTroID FROM vaitro WHERE TenVaiTro = 'ChuDuAn') LIMIT 1);
SET @tin_dang_id = (SELECT TinDangID FROM tindang WHERE TrangThai = 'DaDang' LIMIT 1);

-- Tạo cuộc hội thoại mẫu (nếu có dữ liệu user)
INSERT INTO cuochoithoai (NguCanhID, NguCanhLoai, TieuDe) 
SELECT @tin_dang_id, 'TinDang', CONCAT('Trao đổi về Tin đăng #', @tin_dang_id)
WHERE @khach_hang_id IS NOT NULL 
  AND @chu_du_an_id IS NOT NULL 
  AND @tin_dang_id IS NOT NULL;

SET @cuoc_hoi_thoai_id = LAST_INSERT_ID();

-- Thêm thành viên vào cuộc hội thoại
INSERT INTO thanhviencuochoithoai (CuocHoiThoaiID, NguoiDungID)
SELECT @cuoc_hoi_thoai_id, @khach_hang_id
WHERE @cuoc_hoi_thoai_id > 0;

INSERT INTO thanhviencuochoithoai (CuocHoiThoaiID, NguoiDungID)
SELECT @cuoc_hoi_thoai_id, @chu_du_an_id
WHERE @cuoc_hoi_thoai_id > 0;

-- Thêm tin nhắn mẫu
INSERT INTO tinnhan (CuocHoiThoaiID, NguoiGuiID, NoiDung)
SELECT @cuoc_hoi_thoai_id, @khach_hang_id, 'Xin chào, tôi quan tâm đến tin đăng này. Phòng còn trống không ạ?'
WHERE @cuoc_hoi_thoai_id > 0;

INSERT INTO tinnhan (CuocHoiThoaiID, NguoiGuiID, NoiDung)
SELECT @cuoc_hoi_thoai_id, @chu_du_an_id, 'Chào bạn! Phòng vẫn còn trống. Bạn có muốn đặt lịch xem phòng không?'
WHERE @cuoc_hoi_thoai_id > 0;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Kiểm tra số bảng đã tạo
SELECT 
  'cuochoithoai' AS TableName,
  COUNT(*) AS RowCount
FROM cuochoithoai
UNION ALL
SELECT 
  'thanhviencuochoithoai' AS TableName,
  COUNT(*) AS RowCount
FROM thanhviencuochoithoai
UNION ALL
SELECT 
  'tinnhan' AS TableName,
  COUNT(*) AS RowCount
FROM tinnhan;

-- Kiểm tra trigger đã tạo
SELECT 
  TRIGGER_NAME,
  EVENT_MANIPULATION,
  EVENT_OBJECT_TABLE,
  ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'thue_tro'
  AND TRIGGER_NAME = 'update_conversation_timestamp';

-- =====================================================
-- STATUS CHECK
-- =====================================================
SELECT 
  '✅ Migration completed successfully!' AS Status,
  NOW() AS CompletedAt,
  USER() AS ExecutedBy;

-- =====================================================
-- ROLLBACK SCRIPT (Nếu cần)
-- =====================================================
/*
DROP TABLE IF EXISTS tinnhan;
DROP TABLE IF EXISTS thanhviencuochoithoai;
DROP TABLE IF EXISTS cuochoithoai;
DROP TRIGGER IF EXISTS update_conversation_timestamp;
*/


