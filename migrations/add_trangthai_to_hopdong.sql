-- Thêm trường TrangThai vào bảng hopdong
-- Trạng thái hợp đồng: xacthuc (Xác thực), xinhuy (Xin hủy), dahuy (Đã hủy)

ALTER TABLE `hopdong`
ADD COLUMN `TrangThai` ENUM('xacthuc', 'xinhuy', 'dahuy') 
    NULL 
    DEFAULT NULL 
    COMMENT 'Trạng thái hợp đồng: xacthuc (Xác thực), xinhuy (Xin hủy), dahuy (Đã hủy)'
    AFTER `noidunghopdong`;

-- Nếu muốn đặt giá trị mặc định cho các bản ghi hiện có (tùy chọn)
-- UPDATE `hopdong` SET `TrangThai` = 'xacthuc' WHERE `TrangThai` IS NULL;

