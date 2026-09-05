-- =====================================================
-- SQL TEST DATA cho Cuộc hẹn và Hợp đồng
-- Ngày tạo: 30/10/2025
-- Cập nhật: Sử dụng dữ liệu có sẵn từ thue_tro.sql
-- Mục đích: Test trang /chu-du-an/cuoc-hen và /chu-du-an/hop-dong
-- =====================================================

-- TẮT FOREIGN KEY CHECK TẠM THỜI (để import được với phpMyAdmin)
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- =====================================================
-- BƯỚC 1: SỬ DỤNG TÀI KHOẢN ĐANG ĐĂNG NHẬP
-- =====================================================

-- Người dùng có sẵn:
-- - NguoiDungID = 6 (Võ Nguyễn Hoành Hợp) - hopboy553@gmail.com - ĐANG ĐĂNG NHẬP
-- - NguoiDungID = 2 (Trần Thị Khách Hàng) - khachhangtest@example.com

-- Chính sách Cọc có sẵn:
-- - ChinhSachCocID = 1 (Mặc định hệ thống)

-- Sẽ tạo:
-- - Dự án mới cho user 6 (dùng AUTO_INCREMENT)
-- - Tin đăng mới cho các dự án đó
-- - Phòng, Cuộc hẹn, Hợp đồng cho test

-- 1.1. Tạo thêm 3 Khách hàng mới để test (dùng AUTO_INCREMENT)
INSERT INTO `nguoidung` (`TenDayDu`, `Email`, `VaiTroHoatDongID`, `SoDienThoai`, `MatKhauHash`, `TrangThai`, `TrangThaiXacMinh`, `TaoLuc`) VALUES
('Lê Văn Khách A', 'khachtest1@test.com', 1, '0912345671', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NOW()),
('Phạm Thị Khách B', 'khachtest2@test.com', 1, '0912345672', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NOW()),
('Hoàng Văn Khách C', 'khachtest3@test.com', 1, '0912345673', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NOW());

-- Lưu ID khách hàng vừa tạo vào biến
SET @khach1_id = LAST_INSERT_ID();
SET @khach2_id = @khach1_id + 1;
SET @khach3_id = @khach1_id + 2;

-- Gán vai trò cho khách hàng mới
INSERT INTO `nguoidung_vaitro` (`NguoiDungID`, `VaiTroID`) VALUES
(@khach1_id, 1), -- Khách hàng
(@khach2_id, 1),
(@khach3_id, 1);

-- 1.2. Tạo Dự án mới cho user 6 (dùng AUTO_INCREMENT)
INSERT INTO `duan` (`ChuDuAnID`, `TenDuAn`, `DiaChi`, `ViDo`, `KinhDo`, `ChinhSachCocID`, `YeuCauPheDuyetChu`, `PhuongThucVao`, `TrangThai`, `TaoLuc`) VALUES
(6, 'Test - Chung cư Sunrise', '123 Võ Văn Tần, Phường 6, Quận 3, TP.HCM', 10.7743, 106.6897, 1, 0, 'Liên hệ BQL tòa nhà', 'HoatDong', NOW()),
(6, 'Test - Nhà trọ Bình An', '456 Nguyễn Xí, Phường 13, Bình Thạnh, TP.HCM', 10.8099, 106.7057, 1, 1, NULL, 'HoatDong', NOW()),
(6, 'Test - Căn hộ Studio Golden', '789 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', 10.7751, 106.7005, 1, 0, 'Mã cổng: 1234', 'HoatDong', NOW());

-- Lưu ID dự án vừa tạo
SET @duan1_id = LAST_INSERT_ID();
SET @duan2_id = @duan1_id + 1;
SET @duan3_id = @duan1_id + 2;

-- 1.3. Tạo Tin đăng cho dự án user 6 (dùng AUTO_INCREMENT)
--  Bảng tindang KHÔNG CÓ cột GiaChuan và DienTichChuan
-- ✅ Chỉ có: DuAnID, TieuDe, MoTa, URL, TrangThai, TienIch, GiaDien, GiaNuoc, GiaDichVu
INSERT INTO `tindang` (`DuAnID`, `TieuDe`, `MoTa`, `URL`, `TienIch`, `GiaDien`, `GiaNuoc`, `GiaDichVu`, `MoTaGiaDichVu`, `TrangThai`, `TaoLuc`, `DuyetLuc`) VALUES
(@duan1_id, 'Phòng cao cấp view thành phố - Chung cư Sunrise', 'Phòng 25m2, đầy đủ nội thất, ban công rộng, gần trung tâm', '["https://picsum.photos/600/400?random=1","https://picsum.photos/600/400?random=2"]', '["Wifi","Máy lạnh","Nóng lạnh","Giường","Tủ quần áo"]', 3500.00, 20000.00, 150000.00, 'Bao gồm: Rác, vệ sinh, bảo vệ, internet', 'DaDuyet', NOW(), NOW()),
(@duan2_id, 'Phòng trọ giá rẻ gần chợ - Nhà trọ Bình An', 'Phòng 20m2, có điều hòa, nóng lạnh, an ninh tốt', '["https://picsum.photos/600/400?random=3","https://picsum.photos/600/400?random=4"]', '["Wifi","Máy lạnh","Nóng lạnh","Chỗ để xe"]', 3000.00, 18000.00, 100000.00, 'Bao gồm: Rác, internet', 'DaDuyet', NOW(), NOW()),
(@duan3_id, 'Studio sang trọng - Căn hộ Golden', 'Studio 18m2, gần Đại học, siêu thị, công viên', '["https://picsum.photos/600/400?random=5","https://picsum.photos/600/400?random=6"]', '["Wifi","Máy lạnh","Giường","Tủ lạnh","Bếp"]', 3500.00, 20000.00, 200000.00, 'Bao gồm: Rác, internet, bảo dưỡng', 'DaDuyet', NOW(), NOW());

-- 1.3. Tạo Tin đăng cho dự án user 6 (DÙNG SUBQUERY)
-- Lấy TinDangID mới nhất
SET @latest_tindang_id = (SELECT MAX(TinDangID) FROM tindang WHERE DuAnID IN (
  SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
));
SET @tindang1_id = @latest_tindang_id - 2;
SET @tindang2_id = @latest_tindang_id - 1;
SET @tindang3_id = @latest_tindang_id;

-- DEBUG: Hiển thị TinDangID đã lấy được
SELECT 
  @tindang1_id as TinDang1,
  @tindang2_id as TinDang2,
  @tindang3_id as TinDang3,
  'DEBUG: TinDangID for next steps' as Message;

-- 1.4. Tạo Phòng (DÙNG SUBQUERY thay vì variables để tránh lỗi phpMyAdmin)
-- Lấy DuAnID mới nhất của user 6
SET @latest_duan_id = (SELECT MAX(DuAnID) FROM duan WHERE ChuDuAnID = 6);
SET @duan3_id = @latest_duan_id;
SET @duan2_id = @latest_duan_id - 1;
SET @duan1_id = @latest_duan_id - 2;

-- DEBUG: Hiển thị DuAnID đã lấy được
SELECT 
  @duan1_id as DuAn1_ChungCuSunrise,
  @duan2_id as DuAn2_NhaTroBinhAn,
  @duan3_id as DuAn3_CanHoGolden,
  'DEBUG: DuAnID for INSERT phong' as Message;

INSERT INTO `phong` (`DuAnID`, `TenPhong`, `GiaChuan`, `DienTichChuan`, `TrangThai`) VALUES
-- Phòng cho Tin đăng 1 (Dự án Test 1 - Chung cư Sunrise)
(@duan1_id, 'A101-Test', 4500000, 25, 'GiuCho'),
(@duan1_id, 'A102-Test', 4500000, 25, 'Trong'),
(@duan1_id, 'A103-Test', 4500000, 25, 'DaThue'),
(@duan1_id, 'A104-Test', 4500000, 25, 'Trong'),
(@duan1_id, 'A105-Test', 4500000, 25, 'GiuCho'),
-- Phòng cho Tin đăng 2 (Dự án Test 2 - Nhà trọ Bình An)
(@duan2_id, 'P201-Test', 2500000, 20, 'GiuCho'),
(@duan2_id, 'P202-Test', 2500000, 20, 'Trong'),
(@duan2_id, 'P203-Test', 2500000, 20, 'DaThue'),
(@duan2_id, 'P204-Test', 2500000, 20, 'Trong'),
(@duan2_id, 'P205-Test', 2500000, 20, 'Trong'),
-- Phòng cho Tin đăng 3 (Dự án Test 3 - Căn hộ Studio Golden)
(@duan3_id, 'MT01-Test', 3000000, 18, 'GiuCho'),
(@duan3_id, 'MT02-Test', 3000000, 18, 'DaThue'),
(@duan3_id, 'MT03-Test', 3000000, 18, 'Trong');

-- Lưu ID phòng vừa tạo (DÙNG SUBQUERY)
SET @latest_phong_id = (SELECT MAX(PhongID) FROM phong WHERE DuAnID IN (
  SELECT DuAnID FROM duan WHERE ChuDuAnID = 6
));
SET @phong1_id = @latest_phong_id - 12;      -- A101-Test
SET @phong2_id = @latest_phong_id - 11;      -- A102-Test
SET @phong3_id = @latest_phong_id - 10;      -- A103-Test
SET @phong4_id = @latest_phong_id - 9;       -- A104-Test
SET @phong5_id = @latest_phong_id - 8;       -- A105-Test
SET @phong6_id = @latest_phong_id - 7;       -- P201-Test
SET @phong7_id = @latest_phong_id - 6;       -- P202-Test
SET @phong8_id = @latest_phong_id - 5;       -- P203-Test
SET @phong9_id = @latest_phong_id - 4;       -- P204-Test
SET @phong10_id = @latest_phong_id - 3;      -- P205-Test
SET @phong11_id = @latest_phong_id - 2;      -- MT01-Test
SET @phong12_id = @latest_phong_id - 1;      -- MT02-Test
SET @phong13_id = @latest_phong_id;          -- MT03-Test

-- DEBUG: Kiểm tra PhongID đã được tạo
SELECT 
  @phong1_id as PhongID_A101, 
  @phong5_id as PhongID_A105, 
  @phong6_id as PhongID_P201, 
  @phong11_id as PhongID_MT01,
  'DEBUG: Verify PhongID values' as Message;

-- 1.5. Link Phòng với Tin đăng (bảng phong_tindang)
INSERT INTO `phong_tindang` (`PhongID`, `TinDangID`, `ThuTuHienThi`) VALUES
-- Tin đăng 1 (Chung cư Sunrise)
(@phong1_id, @tindang1_id, 1),
(@phong2_id, @tindang1_id, 2),
(@phong3_id, @tindang1_id, 3),
(@phong4_id, @tindang1_id, 4),
(@phong5_id, @tindang1_id, 5),
-- Tin đăng 2 (Nhà trọ Bình An)
(@phong6_id, @tindang2_id, 1),
(@phong7_id, @tindang2_id, 2),
(@phong8_id, @tindang2_id, 3),
(@phong9_id, @tindang2_id, 4),
(@phong10_id, @tindang2_id, 5),
-- Tin đăng 3 (Căn hộ Studio Golden)
(@phong11_id, @tindang3_id, 1),
(@phong12_id, @tindang3_id, 2),
(@phong13_id, @tindang3_id, 3);

-- =====================================================
-- BƯỚC 2: TẠO VÍ ĐIỆN TỬ (để tạo giao dịch cọc)
-- =====================================================

--  Bảng `vi` KHÔNG CÓ cột `TaoLuc` - chỉ có: ViID, NguoiDungID, SoDu
-- Tạo ví cho khách hàng mới (dùng AUTO_INCREMENT)
INSERT INTO `vi` (`NguoiDungID`, `SoDu`) VALUES
(@khach1_id, 3000000), -- Khách A
(@khach2_id, 4000000), -- Khách B
(@khach3_id, 2000000); -- Khách C

-- Lưu ID ví vừa tạo
SET @vi1_id = LAST_INSERT_ID();      -- Ví của khách A
SET @vi2_id = @vi1_id + 1;           -- Ví của khách B
SET @vi3_id = @vi1_id + 2;           -- Ví của khách C

-- Lấy hoặc tạo ví cho user 2 (khách hàng có sẵn)
-- Nếu user 2 chưa có ví, tạo mới; nếu đã có thì lấy ID
INSERT INTO `vi` (`NguoiDungID`, `SoDu`) 
SELECT 2, 5000000
WHERE NOT EXISTS (SELECT 1 FROM vi WHERE NguoiDungID = 2);

SET @vi_user2 = (SELECT ViID FROM vi WHERE NguoiDungID = 2 LIMIT 1);

-- =====================================================
-- BƯỚC 3: TẠO GIAO DỊCH CỌC (link với phòng)
-- =====================================================

--  Bảng `giaodich` CÓ cột: ViID, SoTien, Loai, TrangThai, KhoaDinhDanh, TinDangLienQuanID, ThoiGian
--  KHÔNG CÓ cột: PhongID, MoTa, TaoLuc
INSERT INTO `giaodich` (`ViID`, `SoTien`, `Loai`, `TrangThai`, `KhoaDinhDanh`, `TinDangLienQuanID`, `ThoiGian`) VALUES
-- Cọc giữ chỗ cho phòng A101-Test (dùng ví user 2)
(@vi_user2, 500000, 'COC_GIU_CHO', 'DaGhiNhan', UUID(), @tindang1_id, DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Cọc giữ chỗ cho phòng A105-Test (dùng ví khách A)
(@vi1_id, 500000, 'COC_GIU_CHO', 'DaGhiNhan', UUID(), @tindang1_id, DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Cọc an ninh cho phòng P201-Test - sẽ ký hợp đồng (dùng ví khách B)
(@vi2_id, 1000000, 'COC_AN_NINH', 'DaGhiNhan', UUID(), @tindang2_id, DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Cọc giữ chỗ cho phòng MT01-Test (dùng ví khách C)
(@vi3_id, 300000, 'COC_GIU_CHO', 'DaGhiNhan', UUID(), @tindang3_id, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Lưu ID giao dịch vừa tạo
SET @giaodich1_id = LAST_INSERT_ID();
SET @giaodich2_id = @giaodich1_id + 1;
SET @giaodich3_id = @giaodich1_id + 2;
SET @giaodich4_id = @giaodich1_id + 3;

-- =====================================================
-- BƯỚC 4: TẠO CỌC (bảng coc)
-- =====================================================

-- DEBUG: Verify phòng đã tồn tại trước khi tạo cọc
SELECT 
  PhongID, 
  TenPhong, 
  TrangThai,
  'DEBUG: Phòng đã được tạo' as Message
FROM phong 
WHERE TenPhong IN ('A101-Test', 'A105-Test', 'P201-Test', 'MT01-Test')
ORDER BY PhongID;

-- ⚠ Bảng `coc` CÓ cột: GiaoDichID, TinDangID, PhongID, Loai, SoTien, TTL_Gio, HetHanLuc, TrangThai, ChinhSachCocID, QuyTacGiaiToaSnapshot, TaoLuc
INSERT INTO `coc` (`GiaoDichID`, `TinDangID`, `PhongID`, `Loai`, `SoTien`, `TTL_Gio`, `HetHanLuc`, `TrangThai`, `ChinhSachCocID`, `QuyTacGiaiToaSnapshot`, `TaoLuc`) VALUES
-- Cọc cho phòng A101-Test - Đang hiệu lực
(@giaodich1_id, @tindang1_id, @phong1_id, 'CocGiuCho', 500000, 48, DATE_ADD(NOW(), INTERVAL 46 HOUR), 'HieuLuc', 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Cọc cho phòng A105-Test - Đang hiệu lực
(@giaodich2_id, @tindang1_id, @phong5_id, 'CocGiuCho', 500000, 48, DATE_ADD(NOW(), INTERVAL 47 HOUR), 'HieuLuc', 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Cọc cho phòng P201-Test - Đang hiệu lực, sẽ ký hợp đồng
(@giaodich3_id, @tindang2_id, @phong6_id, 'CocAnNinh', 1000000, NULL, NULL, 'HieuLuc', 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Cọc cho phòng MT01-Test - Đang hiệu lực
(@giaodich4_id, @tindang3_id, @phong11_id, 'CocGiuCho', 300000, 48, DATE_ADD(NOW(), INTERVAL 47 HOUR), 'HieuLuc', 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Lưu ID cọc vừa tạo
SET @coc1_id = LAST_INSERT_ID();
SET @coc2_id = @coc1_id + 1;
SET @coc3_id = @coc1_id + 2;
SET @coc4_id = @coc1_id + 3;

-- =====================================================
-- BƯỚC 5: TẠO CUỘC HẸN (UC-PROJ-02)
-- =====================================================

--  Bảng `cuochen` KHÔNG CÓ cột `TinDangID`, chỉ có: PhongID, KhachHangID, ThoiGianHen, TrangThai, TaoLuc, CapNhatLuc
--  TrangThai có giá trị: 'DaYeuCau','ChoXacNhan','DaXacNhan','DaDoiLich','HuyBoiKhach','HuyBoiHeThong','KhachKhongDen','HoanThanh'
--  Có thêm cột: GhiChuKetQua thay vì GhiChu
INSERT INTO `cuochen` (`PhongID`, `KhachHangID`, `ThoiGianHen`, `GhiChuKetQua`, `TrangThai`, `TaoLuc`, `CapNhatLuc`) VALUES
-- Cuộc hẹn CHỜ XÁC NHẬN (mới tạo hôm nay)
(@phong2_id, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Muốn xem phòng vào buổi chiều', 'ChoXacNhan', NOW(), NOW()),
(@phong7_id, @khach1_id, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Xem phòng vào 14h', 'ChoXacNhan', NOW(), NOW()),

-- Cuộc hẹn ĐÃ XÁC NHẬN (sắp diễn ra)
(@phong4_id, @khach2_id, DATE_ADD(NOW(), INTERVAL 3 HOUR), 'Đã xác nhận, sẽ đến đúng giờ', 'DaXacNhan', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(@phong9_id, @khach3_id, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Khách VIP, chuẩn bị kỹ', 'DaXacNhan', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(@phong13_id, 2, DATE_ADD(NOW(), INTERVAL 5 HOUR), 'Xem phòng MT03-Test', 'DaXacNhan', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

-- Cuộc hẹn HOÀN THÀNH (đã xem xong)
(@phong3_id, @khach1_id, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Khách đã xem, rất hài lòng', 'HoanThanh', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@phong8_id, @khach2_id, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Đã xem, khách đang suy nghĩ', 'HoanThanh', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Cuộc hẹn BỊ HỦY BỞI KHÁCH (khách không đến)
(@phong5_id, @khach3_id, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Khách hủy vào phút chót', 'HuyBoiKhach', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Cuộc hẹn KHÁCH KHÔNG ĐẾN (không xác nhận)
(@phong10_id, 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Khách không trả lời', 'KhachKhongDen', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Lưu ID cuộc hẹn (để log audit)
SET @cuochen1_id = LAST_INSERT_ID();
SET @cuochen2_id = @cuochen1_id + 1;
SET @cuochen3_id = @cuochen1_id + 2;
SET @cuochen4_id = @cuochen1_id + 3;
SET @cuochen5_id = @cuochen1_id + 4;
SET @cuochen6_id = @cuochen1_id + 5;
SET @cuochen7_id = @cuochen1_id + 6;
SET @cuochen8_id = @cuochen1_id + 7;
SET @cuochen9_id = @cuochen1_id + 8;

-- =====================================================
-- BƯỚC 6: TẠO HỢP ĐỒNG (UC-PROJ-04)
-- =====================================================

--  Bảng `hopdong` KHÔNG CÓ cột `PhongID` - chỉ có: TinDangID, KhachHangID, NgayBatDau, NgayKetThuc, GiaThueCuoiCung, BaoCaoLuc, NoiDungSnapshot
-- Hợp đồng đã ký (Phòng A103-Test, P203-Test, MT02-Test - ĐÃ THUÊ)
INSERT INTO `hopdong` (`TinDangID`, `KhachHangID`, `NgayBatDau`, `NgayKetThuc`, `GiaThueCuoiCung`, `BaoCaoLuc`, `NoiDungSnapshot`) VALUES
(@tindang1_id, 2, '2025-10-01', '2026-09-30', 4500000, DATE_SUB(NOW(), INTERVAL 29 DAY), 'Hợp đồng thuê phòng A103-Test - Chung cư Sunrise. Khách hàng: Trần Thị Khách Hàng. Thời hạn 12 tháng.'),
(@tindang2_id, @khach1_id, '2025-09-15', '2026-09-14', 2500000, DATE_SUB(NOW(), INTERVAL 45 DAY), 'Hợp đồng thuê phòng P203-Test - Nhà trọ Bình An. Khách hàng: Lê Văn Khách A. Thời hạn 12 tháng.'),
(@tindang3_id, @khach2_id, '2025-09-01', '2026-08-31', 3000000, DATE_SUB(NOW(), INTERVAL 59 DAY), 'Hợp đồng thuê phòng MT02-Test - Căn hộ Golden. Khách hàng: Phạm Thị Khách B. Thời hạn 12 tháng.');

-- Lưu ID hợp đồng
SET @hopdong1_id = LAST_INSERT_ID();
SET @hopdong2_id = @hopdong1_id + 1;
SET @hopdong3_id = @hopdong1_id + 2;

-- Tạo giao dịch cọc an ninh cho các hợp đồng đã ký
INSERT INTO `giaodich` (`ViID`, `SoTien`, `Loai`, `TrangThai`, `KhoaDinhDanh`, `TinDangLienQuanID`, `ThoiGian`) VALUES
(@vi_user2, 1000000, 'COC_AN_NINH', 'DaGhiNhan', UUID(), @tindang1_id, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@vi1_id, 500000, 'COC_AN_NINH', 'DaGhiNhan', UUID(), @tindang2_id, DATE_SUB(NOW(), INTERVAL 46 DAY)),
(@vi2_id, 500000, 'COC_AN_NINH', 'DaGhiNhan', UUID(), @tindang3_id, DATE_SUB(NOW(), INTERVAL 60 DAY));

-- Lưu ID giao dịch cọc hợp đồng
SET @giaodich_hd1 = LAST_INSERT_ID();
SET @giaodich_hd2 = @giaodich_hd1 + 1;
SET @giaodich_hd3 = @giaodich_hd1 + 2;

-- Tạo cọc đã giải tỏa/đối trừ
INSERT INTO `coc` (`GiaoDichID`, `TinDangID`, `PhongID`, `Loai`, `SoTien`, `TrangThai`, `HopDongID`, `LyDoKhauTru`, `LyDoGiaiToa`, `ChinhSachCocID`, `QuyTacGiaiToaSnapshot`, `TaoLuc`) VALUES
(@giaodich_hd1, @tindang1_id, @phong3_id, 'CocAnNinh', 1000000, 'DaDoiTru', @hopdong1_id, 'Đối trừ vào tiền thuê tháng đầu', NULL, 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@giaodich_hd2, @tindang2_id, @phong8_id, 'CocAnNinh', 500000, 'DaGiaiToa', @hopdong2_id, NULL, 'Hợp đồng đã được ký, giải tỏa cọc theo quy tắc', 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 46 DAY)),
(@giaodich_hd3, @tindang3_id, @phong12_id, 'CocAnNinh', 500000, 'DaDoiTru', @hopdong3_id, 'Đối trừ vào tiền thuê tháng đầu', NULL, 1, 'BanGiao', DATE_SUB(NOW(), INTERVAL 60 DAY));

-- =====================================================
-- BƯỚC 7: TẠO NHẬT KÝ HỆ THỐNG (audit log)
-- =====================================================

INSERT INTO `nhatkyhethong` (`NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `ThoiGian`) VALUES
-- Log cuộc hẹn
(1, 'xac_nhan_cuoc_hen', 'cuochen', CAST(@cuochen3_id AS CHAR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'xac_nhan_cuoc_hen', 'cuochen', CAST(@cuochen4_id AS CHAR), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'hoan_thanh_cuoc_hen', 'cuochen', CAST(@cuochen6_id AS CHAR), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'huy_cuoc_hen', 'cuochen', CAST(@cuochen8_id AS CHAR), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Log hợp đồng
(1, 'bao_cao_hop_dong_thue', 'hopdong', CAST(@hopdong1_id AS CHAR), DATE_SUB(NOW(), INTERVAL 29 DAY)),
(1, 'bao_cao_hop_dong_thue', 'hopdong', CAST(@hopdong2_id AS CHAR), DATE_SUB(NOW(), INTERVAL 45 DAY)),
(1, 'bao_cao_hop_dong_thue', 'hopdong', CAST(@hopdong3_id AS CHAR), DATE_SUB(NOW(), INTERVAL 59 DAY));

-- =====================================================
-- VERIFICATION QUERIES (để kiểm tra data đã import đúng)
-- =====================================================

-- Kiểm tra Người dùng test
SELECT 'Người dùng test' as TableName, COUNT(*) as RecordCount 
FROM nguoidung 
WHERE Email LIKE '%test%' AND NguoiDungID > 6;

-- Kiểm tra Tin đăng test  
SELECT 'Tin đăng test' as TableName, COUNT(*) as RecordCount 
FROM tindang 
WHERE TieuDe LIKE '%Test%' OR TieuDe LIKE '%ABC%' OR TieuDe LIKE '%XYZ%' OR TieuDe LIKE '%Minh Tâm%';

-- Kiểm tra Phòng test
SELECT 'Phòng test' as TableName, COUNT(*) as RecordCount 
FROM phong 
WHERE TenPhong LIKE '%-Test';

-- Kiểm tra Cuộc hẹn test
SELECT 
  'Cuộc hẹn' as Category,
  TrangThai, 
  COUNT(*) as SoLuong 
FROM cuochen 
WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test'
)
GROUP BY TrangThai;

-- Kiểm tra Hợp đồng test
SELECT 'Hợp đồng test' as TableName, COUNT(*) as RecordCount 
FROM hopdong 
WHERE NoiDungSnapshot LIKE '%-Test%';

-- Kiểm tra Cọc test
SELECT 
  'Cọc' as Category,
  TrangThai, 
  COUNT(*) as SoLuong 
FROM coc 
WHERE TinDangID IN (
  SELECT TinDangID FROM tindang 
  WHERE TieuDe LIKE '%Test%' OR TieuDe LIKE '%ABC%' OR TieuDe LIKE '%XYZ%' OR TieuDe LIKE '%Minh Tâm%'
)
GROUP BY TrangThai;

-- =====================================================
-- SUMMARY DATA FOR TESTING
-- =====================================================

SELECT '=== DATA TEST SUMMARY ===' as Info;

SELECT 
  'Tổng quan' as Category,
  (SELECT COUNT(*) FROM nguoidung WHERE Email LIKE '%test%' AND NguoiDungID > 6) as KhachHangMoi,
  (SELECT COUNT(*) FROM tindang WHERE TieuDe LIKE '%Test%' OR TieuDe LIKE '%ABC%' OR TieuDe LIKE '%XYZ%' OR TieuDe LIKE '%Minh Tâm%') as TinDangTest,
  (SELECT COUNT(*) FROM phong WHERE TenPhong LIKE '%-Test') as PhongTest,
  (SELECT COUNT(*) FROM cuochen WHERE PhongID IN (
    SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test'
  )) as CuocHenTest,
  (SELECT COUNT(*) FROM hopdong WHERE NoiDungSnapshot LIKE '%-Test%') as HopDongTest;

-- =====================================================
-- CREDENTIALS FOR TESTING
-- =====================================================

SELECT '=== LOGIN CREDENTIALS ===' as Info;
SELECT 'Email: chuduantest@example.com | Password: 123456 (hash có sẵn) | Role: Chủ dự án (ID: 1)' as Credentials
UNION ALL
SELECT 'Email: khachhangtest@example.com | Password: 123456 | Role: Khách hàng (ID: 2)'
UNION ALL
SELECT 'Email: khachtest1@test.com | Password: 123456 | Role: Khách hàng (auto ID)'
UNION ALL
SELECT 'Email: khachtest2@test.com | Password: 123456 | Role: Khách hàng (auto ID)';

-- =====================================================
-- NOTES
-- =====================================================
-- ✅ SỬ DỤNG AUTO_INCREMENT - KHÔNG LÀM HỎNG DATABASE
-- 
-- 1. Import file này vào database thue_tro
-- 2. Đăng nhập bằng: chuduantest@example.com / 123456
-- 3. Navigate to:
--    - /chu-du-an/cuoc-hen (xem 9 cuộc hẹn với đủ trạng thái)
--    - /chu-du-an/hop-dong (xem 3 hợp đồng đã báo cáo)
-- 4. Test workflows:
--    - Xác nhận cuộc hẹn (ChoXacNhan → DaXacNhan)
--    - Báo cáo hợp đồng cho phòng đang GiuCho
-- 5. Dữ liệu sử dụng:
--    - Dự án có sẵn: ID 1, 2, 14 (thuộc ChuDuAnID = 1)
--    - Khách hàng có sẵn: ID 2, 6
--    - Khách hàng mới: AUTO_INCREMENT (3 người)
--    - Chính sách cọc: ID 1 (mặc định hệ thống)
-- 6. Dễ dàng xóa test data:
--    - Tìm theo tên phòng: LIKE '%-Test'
--    - Tìm theo email: LIKE '%test%'
--    - Tìm theo tiêu đề: LIKE '%ABC%' OR '%XYZ%' OR '%Minh Tâm%'
-- =====================================================

-- BẬT LẠI FOREIGN KEY CHECK VÀ COMMIT TRANSACTION
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- END OF SQL SCRIPT
