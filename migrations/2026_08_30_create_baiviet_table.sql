-- Tạo bảng baiviet lưu trữ tin tức, cẩm nang và phân tích
CREATE TABLE IF NOT EXISTS `baiviet` (
  `BaiVietID` INT(11) NOT NULL AUTO_INCREMENT,
  `TieuDe` VARCHAR(255) NOT NULL,
  `TomTat` TEXT DEFAULT NULL,
  `NoiDung` LONGTEXT DEFAULT NULL,
  `HinhAnh` VARCHAR(255) DEFAULT NULL,
  `Loai` ENUM('TinTuc', 'Wiki', 'PhanTich') NOT NULL DEFAULT 'TinTuc',
  `DanhMuc` VARCHAR(100) DEFAULT NULL,
  `Slug` VARCHAR(255) NOT NULL,
  `LuotXem` INT(11) DEFAULT 0,
  `NguoiVietID` INT(11) DEFAULT NULL,
  `TaoLuc` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `CapNhatLuc` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`BaiVietID`),
  UNIQUE KEY `idx_slug` (`Slug`),
  KEY `idx_loai` (`Loai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Xóa dữ liệu cũ nếu trùng slug trước khi chèn mới
DELETE FROM `baiviet` WHERE `Slug` IN (
  'top-10-khu-vuc-sinh-vien-tphcm-2024',
  'meo-tim-phong-tro-gia-re',
  'luu-y-ky-hop-dong-thue-nha',
  'phan-tich-thi-truong-q2-2024',
  'cach-trang-tri-phong-tro-20m2',
  'top-5-tien-ich-can-ho',
  'cach-dang-tin-hieu-qua',
  'kinh-nghiem-mua-nha-lan-dau',
  'quy-trinh-mua-ban-nha-dat',
  'thue-mua-ban-bat-dong-san',
  'gia-bat-dong-san-thang-7',
  'xu-huong-dau-tu-2025',
  'khu-vuc-phat-trien-tiem-nang',
  'danh-gia-chi-tiet-du-an-hot'
);

-- Chèn dữ liệu mẫu cho bài viết (Seed Data)
INSERT INTO `baiviet` (`TieuDe`, `TomTat`, `NoiDung`, `HinhAnh`, `Loai`, `DanhMuc`, `Slug`) VALUES
-- 1. Tin tức
('Top 10 khu vực sinh viên tại TP.HCM năm 2024', 
 'Khám phá những khu vực lý tưởng cho sinh viên với giá cả hợp lý và tiện nghi đầy đủ...', 
 'Nội dung chi tiết về danh sách 10 khu vực trọ sinh viên lý tưởng tại TP.HCM như Làng Đại học Thủ Đức, Quận Bình Thạnh, Quận 10...', 
 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80', 
 'TinTuc', 'Khu vực', 'top-10-khu-vuc-sinh-vien-tphcm-2024'),

('Mẹo tìm phòng trọ giá rẻ nhưng chất lượng', 
 'Bạn đang tìm kiếm phòng trọ tốt với ngân sách eo hẹp? Hãy bỏ túi những bí quyết này...', 
 'Hướng dẫn cách tìm phòng trọ giá rẻ: khảo sát giá xung quanh, thương lượng giá điện nước, kiểm tra an ninh khu vực trước khi đặt cọc...', 
 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=300&q=80', 
 'TinTuc', 'Mẹo tìm phòng', 'meo-tim-phong-tro-gia-re'),

('Top 5 dịch vụ tiện ích xung quanh khu căn hộ', 
 'Những tiện ích nào bạn nên xem xét trước khi chọn thuê nhà? Hãy cùng tìm hiểu...', 
 'Top 5 tiện ích không thể thiếu gồm: Siêu thị tiện lợi 24/7, nhà thuốc, phòng gym/hồ bơi, khu vui chơi trẻ em và kết nối giao thông công cộng...', 
 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80', 
 'TinTuc', 'Tiện ích', 'top-5-tien-ich-can-ho'),

-- 2. Wiki
('Lưu ý khi ký hợp đồng thuê nhà', 
 'Những điều bạn cần kiểm tra kỹ lưỡng trước khi ký tên vào hợp đồng thuê nhà...', 
 'Cẩm nang pháp lý về hợp đồng thuê nhà: các điều khoản về đặt cọc, thời gian thuê, quy định hoàn cọc và sửa chữa trang thiết bị hư hỏng...', 
 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80', 
 'Wiki', 'Hợp đồng', 'luu-y-ky-hop-dong-thue-nha'),

('Cách trang trí phòng trọ 20m² đẹp mắt', 
 'Với diện tích nhỏ, làm thế nào để bạn có một căn phòng vừa đẹp vừa tiện nghi?...', 
 'Các giải pháp tối ưu diện tích phòng trọ nhỏ: sử dụng nội thất đa năng, tông màu sáng, tận dụng chiều cao phòng bằng kệ treo tường...', 
 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80', 
 'Wiki', 'Trang trí', 'cach-trang-tri-phong-tro-20m2'),

('Cách đăng tin bất động sản hiệu quả',
 'Hướng dẫn chi tiết cách đăng tin bất động sản thu hút và nhanh chóng bán được',
 'Bí quyết đăng tin nhanh chốt: Tiêu đề giật tít chứa từ khóa khu vực, hình ảnh thật độ phân giải cao, mô tả đầy đủ diện tích, pháp lý sổ hồng và thông tin liên hệ rõ ràng.',
 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80',
 'Wiki', 'Wiki', 'cach-dang-tin-hieu-qua'),

('Kinh nghiệm mua nhà lần đầu',
 'Những lời khuyên hữu ích cho người mua nhà lần đầu tiên',
 'Cẩm nang cho người mua nhà lần đầu: cân đối tài chính (chỉ nên vay tối đa 50% giá trị nhà), kiểm tra pháp lý quy hoạch, xem nhà vào nhiều khung giờ khác nhau để đánh giá môi trường sống.',
 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80',
 'Wiki', 'Wiki', 'kinh-nghiem-mua-nha-lan-dau'),

('Quy trình mua bán nhà đất',
 'Quy trình pháp lý khi mua bán, chuyển nhượng bất động sản',
 'Quy trình chuyển nhượng chuẩn: 1. Đặt cọc -> 2. Công chứng hợp đồng mua bán tại Văn phòng công chứng -> 3. Nộp thuế thu nhập cá nhân & lệ phí trước bạ -> 4. Đăng bộ sang tên sổ đỏ.',
 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=300&q=80',
 'Wiki', 'Wiki', 'quy-trinh-mua-ban-nha-dat'),

('Thuế khi mua bán bất động sản',
 'Các loại thuế cần biết khi tham gia giao dịch bất động sản',
 'Tổng hợp thuế phí: Thuế thu nhập cá nhân (2% giá trị chuyển nhượng, thường do bên bán nộp), Lệ phí trước bạ (0.5%, thường do bên nhận chuyển nhượng nộp), và phí công chứng.',
 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=300&q=80',
 'Wiki', 'Wiki', 'thue-mua-ban-bat-dong-san'),

-- 3. Phân tích & Đánh giá
('Phân tích thị trường nhà đất quý 2 năm 2024', 
 'Thị trường nhà đất có những biến động gì trong quý 2? Cập nhật các xu hướng mới nhất...', 
 'Báo cáo chi tiết về tình hình giao dịch bất động sản quý 2/2024: Phân khúc căn hộ chung cư trung cấp tiếp tục dẫn dắt thị trường, giá đất nền vùng ven có dấu hiệu đi ngang...', 
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80', 
 'PhanTich', 'Phân tích thị trường', 'phan-tich-thi-truong-q2-2024'),

('Giá bất động sản tháng 7',
 'Phân tích chi tiết biến động giá bất động sản tại TP. HCM trong tháng 7 năm 2025',
 'Báo cáo thống kê giá trung bình m² tại các quận trung tâm và quận vùng ven TP.HCM trong tháng 7. Sự tăng trưởng nhẹ ở khu Đông nhờ hạ tầng metro chuẩn bị đi vào vận hành.',
 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=300&q=80',
 'PhanTich', 'Phân tích', 'gia-bat-dong-san-thang-7'),

('Xu hướng đầu tư',
 'Nên đầu tư vào loại hình bất động sản nào trong giai đoạn hiện tại?',
 'Đánh giá các dòng vốn đầu tư bất động sản: căn hộ dòng tiền cho thuê sinh lời ổn định, đất nền tích sản dài hạn, nhà phố thương mại kén khách nhưng lợi nhuận đột biến.',
 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=300&q=80',
 'PhanTich', 'Phân tích', 'xu-huong-dau-tu-2025'),

('Khu vực phát triển',
 'Top 5 khu vực có tiềm năng phát triển mạnh nhất tại TP. HCM',
 'Danh sách khu vực phát triển hạ tầng trọng điểm giai đoạn 2025-2030 gồm: Thành phố Thủ Đức (khu đô thị sáng tạo), Huyện Bình Chánh (quy hoạch lên quận), Quận 12, Huyện Nhà Bè.',
 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
 'PhanTich', 'Phân tích', 'khu-vuc-phat-trien-tiem-nang'),

('Đánh giá dự án',
 'Đánh giá chi tiết các dự án bất động sản đang hot trên thị trường',
 'Bài viết phân tích chuyên sâu về pháp lý, năng lực chủ đầu tư, tiến độ thi công và tỷ suất sinh lời thực tế của các dự án đại đô thị đang mở bán lớn tại TP.HCM và vùng vệ tinh.',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80',
 'PhanTich', 'Phân tích', 'danh-gia-chi-tiet-du-an-hot');
