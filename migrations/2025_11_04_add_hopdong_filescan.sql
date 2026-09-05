/**
 * Migration: Thêm cột FileScanPath vào bảng hopdong
 * Date: 2025-11-04
 * Purpose: Hỗ trợ upload file scan hợp đồng (PDF/Image)
 */

-- Thêm cột FileScanPath vào bảng hopdong
ALTER TABLE hopdong 
ADD COLUMN FileScanPath VARCHAR(500) NULL COMMENT 'Đường dẫn file scan hợp đồng (PDF/Image)' 
AFTER NoiDungSnapshot;

-- Tạo thư mục upload nếu chưa tồn tại (ghi chú cho admin)
-- Cần tạo: public/uploads/hop-dong/


