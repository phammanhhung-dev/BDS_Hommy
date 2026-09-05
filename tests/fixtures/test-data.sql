/**
 * Test Data for Chat Feature
 * Dành cho tài khoản: hopboy553@gmail.com (NguoiDungID = 6)
 * Run this to populate test data for testing
 */

-- ====================================
-- THÔNG TIN TÀI KHOẢN TEST
-- ====================================
-- Chủ Dự Án: hopboy553@gmail.com (ID: 6, VaiTroID: 3)
-- User này đã tồn tại trong database, có các dự án thực tế

-- ====================================
-- Tạo thêm Khách Hàng Test (để chat với Chủ Dự Án)
-- ====================================
-- Insert test users (khách hàng) nếu chưa tồn tại
INSERT IGNORE INTO nguoidung (NguoiDungID, TenDayDu, Email, KhuVucID, SoDienThoai, MatKhau, TrangThai, XacMinh, TaoLuc, CapNhatLuc)
VALUES 
  (201, 'Nguyễn Văn A', 'khachhang1.test@test.com', 944, '0912345601', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NOW(), NOW()),
  (202, 'Trần Thị B', 'khachhang2.test@test.com', 941, '0912345602', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NOW(), NOW()),
  (203, 'Lê Văn C', 'khachhang3.test@test.com', 946, '0912345603', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NOW(), NOW());

-- Gán vai trò Khách Hàng (VaiTroID = 1)
INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID)
VALUES 
  (201, 1),
  (202, 1),
  (203, 1);

-- ====================================
-- Tạo Test Conversations
-- ====================================
-- Tạo cuộc hội thoại liên quan đến các ngữ cảnh khác nhau
INSERT IGNORE INTO cuochoithoai (CuocHoiThoaiID, NguCanhID, NguCanhLoai, TieuDe, DangHoatDong, TaoLuc, ThoiDiemTinNhanCuoi)
VALUES
  -- Conversation về Tin Đăng
  (201, 4, 'TinDang', 'Tin đăng: Phòng trọ giá rẻ cho nữ thuê - Nhà trọ Minh Tâm', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  
  -- Conversation về Cuộc Hẹn xem phòng
  (202, 1, 'CuocHen', 'Cuộc hẹn xem phòng #1 - Nhà trọ Minh Tâm', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- Conversation về Hợp Đồng
  (203, 1, 'HopDong', 'Hợp đồng thuê #1 - Nhà trọ Minh Tâm', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()),
  
  -- Conversation hỗ trợ khách hàng chung
  (204, 17, 'TinDang', 'Tin đăng: Nhà Trọ Hoành Hợp - Hỗ trợ tư vấn', 1, DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW());

-- ====================================
-- Thêm Thành Viên vào Conversations
-- ====================================
INSERT IGNORE INTO thanhviencuochoithoai (CuocHoiThoaiID, NguoiDungID, ThamGiaLuc, TinNhanCuoiDocLuc)
VALUES
  -- Conversation 201: Chủ Dự Án (6) + Khách Hàng (201)
  (201, 6, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (201, 201, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  
  -- Conversation 202: Chủ Dự Án (6) + Khách Hàng (202)
  (202, 6, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
  (202, 202, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
  
  -- Conversation 203: Chủ Dự Án (6) + Khách Hàng (201)
  (203, 6, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
  (203, 201, DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()),
  
  -- Conversation 204: Chủ Dự Án (6) + Khách Hàng (203)
  (204, 6, DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW()),
  (204, 203, DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 10 MINUTE));

-- ====================================
-- Tạo Test Messages
-- ====================================

-- === Conversation 201: Tư vấn về Tin Đăng ===
INSERT IGNORE INTO tinnhan (TinNhanID, CuocHoiThoaiID, NguoiGuiID, NoiDung, ThoiGian, DaXoa)
VALUES
  -- Khách hàng hỏi về phòng
  (2001, 201, 201, 'Xin chào anh! Em thấy tin đăng phòng trọ của anh rất phù hợp. Em muốn hỏi phòng vẫn còn trống không ạ?', 
   DATE_SUB(NOW(), INTERVAL 2 DAY), 0),
  
  -- Chủ dự án trả lời
  (2002, 201, 6, 'Chào em! Phòng vẫn còn trống em nhé. Em muốn xem phòng khi nào thì báo anh để sắp xếp.', 
   DATE_SUB(NOW(), INTERVAL 47 HOUR), 0),
  
  -- Khách hỏi thêm tiện ích
  (2003, 201, 201, 'Vâng ạ! Cho em hỏi phòng có máy lạnh không ạ? Và tiền điện nước tính như thế nào?', 
   DATE_SUB(NOW(), INTERVAL 46 HOUR), 0),
  
  -- Chủ dự án giải đáp
  (2004, 201, 6, 'Phòng có máy lạnh đầy đủ em nhé. Tiền điện 3.500đ/số, nước 20.000đ/người/tháng. Phí dịch vụ 150k/tháng bao gồm wifi, rác, và bảo dưỡng.', 
   DATE_SUB(NOW(), INTERVAL 45 HOUR), 0),
  
  -- Khách hàng hài lòng
  (2005, 201, 201, 'Dạ vậy rất tốt! Em muốn xem phòng vào chiều mai được không ạ? Khoảng 3 giờ chiều có tiện không anh?', 
   DATE_SUB(NOW(), INTERVAL 44 HOUR), 0),
  
  -- Xác nhận lịch hẹn
  (2006, 201, 6, 'OK em! 3h chiều mai được nhé. Địa chỉ là 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp. Đến gần cổng em gọi anh nhé.', 
   DATE_SUB(NOW(), INTERVAL 43 HOUR), 0),
  
  (2007, 201, 201, 'Vâng em cảm ơn anh! Em sẽ đến đúng giờ ạ.', 
   DATE_SUB(NOW(), INTERVAL 42 HOUR), 0);

-- === Conversation 202: Cuộc Hẹn Xem Phòng ===
INSERT IGNORE INTO tinnhan (TinNhanID, CuocHoiThoaiID, NguoiGuiID, NoiDung, ThoiGian, DaXoa)
VALUES
  -- Nhắc lịch hẹn
  (2010, 202, 6, 'Chào em! Anh nhắc lại lịch hẹn xem phòng hôm nay lúc 3h chiều nhé.', 
   DATE_SUB(NOW(), INTERVAL 1 DAY), 0),
  
  (2011, 202, 202, 'Vâng em nhớ rồi ạ! Em đang trên đường đến, khoảng 10 phút nữa đến nơi.', 
   DATE_SUB(NOW(), INTERVAL 23 HOUR), 0),
  
  -- Sau khi xem phòng
  (2012, 202, 202, 'Em đã xem phòng và rất thích ạ! Em muốn thuê luôn được không anh?', 
   DATE_SUB(NOW(), INTERVAL 22 HOUR), 0),
  
  (2013, 202, 6, 'Được em! Anh rất vui vì em thích. Để thuê phòng, em cần đặt cọc giữ chỗ trước nhé. Tiền cọc là 1 tháng tiền phòng.', 
   DATE_SUB(NOW(), INTERVAL 21 HOUR), 0),
  
  (2014, 202, 202, 'Vâng ạ! Em có thể chuyển khoản được không? Số tài khoản của anh là gì ạ?', 
   DATE_SUB(NOW(), INTERVAL 21 HOUR), 0),
  
  (2015, 202, 6, 'Em chuyển qua hệ thống của bên mình nhé, an toàn và có bảo vệ cho cả 2 bên. Em vào mục "Cuộc hẹn" > chọn cuộc hẹn này > click "Đặt cọc giữ chỗ".', 
   DATE_SUB(NOW(), INTERVAL 20 HOUR), 0),
  
  (2016, 202, 202, 'Vâng em hiểu rồi! Em sẽ làm ngay bây giờ ạ.', 
   DATE_SUB(NOW(), INTERVAL 20 HOUR), 0),
  
  -- Xác nhận đã cọc
  (2017, 202, 202, 'Anh ơi em đã cọc xong rồi ạ! Bây giờ em làm gì tiếp ạ?', 
   DATE_SUB(NOW(), INTERVAL 19 HOUR), 0),
  
  (2018, 202, 6, 'Anh đã nhận được tiền cọc rồi em. Tuần sau em dọn vào được luôn nhé. Anh sẽ chuẩn bị hợp đồng.', 
   DATE_SUB(NOW(), INTERVAL 18 HOUR), 0);

-- === Conversation 203: Bàn bạc về Hợp Đồng ===
INSERT IGNORE INTO tinnhan (TinNhanID, CuocHoiThoaiID, NguoiGuiID, NoiDung, ThoiGian, DaXoa)
VALUES
  (2020, 203, 6, 'Chào em! Anh đã chuẩn bị xong hợp đồng rồi. Em có thể qua ký hợp đồng được chưa?', 
   DATE_SUB(NOW(), INTERVAL 3 HOUR), 0),
  
  (2021, 203, 201, 'Vâng ạ! Em có thể qua chiều nay được anh. Khoảng 5h được không ạ?', 
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
  
  (2022, 203, 6, 'OK em! 5h chiều nay nhé. Em nhớ mang CMND/CCCD để làm hợp đồng nhé.', 
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
  
  (2023, 203, 201, 'Vâng ạ em nhớ rồi! Cho em hỏi tiền cọc an ninh và tiền kỳ đầu là bao nhiêu ạ?', 
   DATE_SUB(NOW(), INTERVAL 1 HOUR), 0),
  
  (2024, 203, 6, 'Cọc an ninh là 2 tháng tiền phòng (4.000.000đ), tiền kỳ đầu là 1 tháng (2.000.000đ). Tổng cộng em cần chuẩn bị 6 triệu để ký hợp đồng nhé.', 
   DATE_SUB(NOW(), INTERVAL 1 HOUR), 0),
  
  (2025, 203, 201, 'Dạ em hiểu rồi! Em sẽ chuẩn bị đầy đủ. Cảm ơn anh nhiều ạ!', 
   DATE_SUB(NOW(), INTERVAL 50 MINUTE), 0),
  
  (2026, 203, 6, 'Không có gì em. Hẹn gặp em chiều nay nhé!', 
   DATE_SUB(NOW(), INTERVAL 45 MINUTE), 0);

-- === Conversation 204: Hỗ trợ tư vấn chung ===
INSERT IGNORE INTO tinnhan (TinNhanID, CuocHoiThoaiID, NguoiGuiID, NoiDung, ThoiGian, DaXoa)
VALUES
  (2030, 204, 203, 'Xin chào anh! Em thấy anh có nhiều phòng cho thuê. Em muốn hỏi phòng nào phù hợp cho sinh viên ạ?', 
   DATE_SUB(NOW(), INTERVAL 5 HOUR), 0),
  
  (2031, 204, 6, 'Chào em! Tùy vào nhu cầu của em. Em muốn ở gần trường nào? Và budget của em khoảng bao nhiêu?', 
   DATE_SUB(NOW(), INTERVAL 4 HOUR), 0),
  
  (2032, 204, 203, 'Em học ở IUH anh ạ. Budget khoảng 2-2.5 triệu/tháng. Em muốn có máy lạnh và wifi.', 
   DATE_SUB(NOW(), INTERVAL 4 HOUR), 0),
  
  (2033, 204, 6, 'Vậy em xem tin đăng "Phòng trọ giá rẻ cho nữ thuê" của anh nhé. Phòng đầy đủ tiện nghi, gần IUH chỉ 3.7km. Giá 2 triệu/tháng, có máy lạnh và wifi.', 
   DATE_SUB(NOW(), INTERVAL 3 HOUR), 0),
  
  (2034, 204, 203, 'Vâng em sẽ xem! Em có thể xem phòng trực tiếp được không ạ?', 
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
  
  (2035, 204, 6, 'Được em! Em vào trang tin đăng, click "Đặt lịch xem phòng" để book lịch nhé. Anh sẽ sắp xếp thời gian phù hợp.', 
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
  
  (2036, 204, 203, 'Vâng em cảm ơn anh! Em sẽ đặt lịch ngay ạ.', 
   DATE_SUB(NOW(), INTERVAL 1 HOUR), 0);

-- === Thêm một số tin nhắn cho test pagination (Conversation 201) ===
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS insert_pagination_test_messages()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 30 DO
    INSERT INTO tinnhan (CuocHoiThoaiID, NguoiGuiID, NoiDung, ThoiGian, DaXoa)
    VALUES (
      201, 
      IF(i % 2 = 0, 6, 201),
      CONCAT('Tin nhắn test số ', i, ' - Để test pagination và scroll trong UI'),
      DATE_SUB(NOW(), INTERVAL (35 - i) HOUR),
      0
    );
    SET i = i + 1;
  END WHILE;
END//
DELIMITER ;

-- Chạy procedure để tạo messages
CALL insert_pagination_test_messages();
DROP PROCEDURE IF EXISTS insert_pagination_test_messages;

-- ====================================
-- Update ThoiDiemTinNhanCuoi cho các Conversations
-- ====================================
UPDATE cuochoithoai ch
SET ThoiDiemTinNhanCuoi = (
  SELECT MAX(ThoiGian) 
  FROM tinnhan t 
  WHERE t.CuocHoiThoaiID = ch.CuocHoiThoaiID
)
WHERE ch.CuocHoiThoaiID >= 201;

-- ====================================
-- Verify Test Data
-- ====================================
SELECT '========================================' AS '';
SELECT '=== THÔNG TIN TÀI KHOẢN CHỦ DỰ ÁN ===' AS '';
SELECT '========================================' AS '';
SELECT 
  nd.NguoiDungID, 
  nd.Email, 
  nd.TenDayDu, 
  vt.TenVaiTro 
FROM nguoidung nd
JOIN nguoidung_vaitro nvt ON nd.NguoiDungID = nvt.NguoiDungID
JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
WHERE nd.NguoiDungID = 6;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '=== KHÁCH HÀNG TEST ===' AS '';
SELECT '========================================' AS '';
SELECT 
  NguoiDungID, 
  Email, 
  TenDayDu, 
  SoDienThoai 
FROM nguoidung 
WHERE NguoiDungID >= 201;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '=== CUỘC HỘI THOẠI TEST ===' AS '';
SELECT '========================================' AS '';
SELECT 
  ch.CuocHoiThoaiID, 
  ch.NguCanhLoai, 
  ch.TieuDe, 
  ch.ThoiDiemTinNhanCuoi,
  (SELECT COUNT(*) FROM tinnhan WHERE CuocHoiThoaiID = ch.CuocHoiThoaiID) as TongTinNhan
FROM cuochoithoai ch
WHERE ch.CuocHoiThoaiID >= 201
ORDER BY ch.CuocHoiThoaiID;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '=== TIN NHẮN MỚI NHẤT (10 tin) ===' AS '';
SELECT '========================================' AS '';
SELECT 
  t.TinNhanID,
  t.CuocHoiThoaiID,
  nd.TenDayDu as NguoiGui,
  LEFT(t.NoiDung, 60) as NoiDung,
  DATE_FORMAT(t.ThoiGian, '%Y-%m-%d %H:%i') as ThoiGian
FROM tinnhan t
JOIN nguoidung nd ON t.NguoiGuiID = nd.NguoiDungID
WHERE t.CuocHoiThoaiID >= 201
ORDER BY t.ThoiGian DESC
LIMIT 10;

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '=== THỐNG KÊ ===' AS '';
SELECT '========================================' AS '';
SELECT 
  'Tổng số Conversations' as ThongKe,
  COUNT(*) as SoLuong
FROM cuochoithoai
WHERE CuocHoiThoaiID >= 201
UNION ALL
SELECT 
  'Tổng số Tin nhắn' as ThongKe,
  COUNT(*) as SoLuong
FROM tinnhan
WHERE CuocHoiThoaiID >= 201
UNION ALL
SELECT 
  'Khách hàng test' as ThongKe,
  COUNT(*) as SoLuong
FROM nguoidung
WHERE NguoiDungID >= 201;

-- ====================================
-- Hướng dẫn sử dụng
-- ====================================
SELECT '' AS '';
SELECT '========================================' AS '';
SELECT '=== HƯỚNG DẪN TEST ===' AS '';
SELECT '========================================' AS '';
SELECT '1. Login với tài khoản: hopboy553@gmail.com' AS HuongDan
UNION ALL SELECT '2. Mật khẩu: 123456 (hash MD5: e10adc3949ba59abbe56e057f20f883e)'
UNION ALL SELECT '3. Navigate đến: /chu-du-an/tin-nhan'
UNION ALL SELECT '4. Bạn sẽ thấy 4 cuộc hội thoại với khách hàng khác nhau'
UNION ALL SELECT '5. Click vào từng conversation để xem tin nhắn'
UNION ALL SELECT '6. Test gửi tin nhắn, typing indicator, real-time updates'
UNION ALL SELECT ''
UNION ALL SELECT '=== TEST SOCKET.IO ==='
UNION ALL SELECT '1. Mở file: server/tests/test-chat-quick.html'
UNION ALL SELECT '2. Paste JWT token (lấy từ localStorage)'
UNION ALL SELECT '3. Kết nối và test các tính năng real-time'
UNION ALL SELECT ''
UNION ALL SELECT '=== LOGIN KHÁCH HÀNG TEST ==='
UNION ALL SELECT 'Email: khachhang1.test@test.com | Password: 123456'
UNION ALL SELECT 'Email: khachhang2.test@test.com | Password: 123456'
UNION ALL SELECT 'Email: khachhang3.test@test.com | Password: 123456';

-- ====================================
-- Cleanup Script (Chạy để xóa test data)
-- ====================================
/*
-- XÓA TEST DATA
DELETE FROM tinnhan WHERE CuocHoiThoaiID >= 201;
DELETE FROM thanhviencuochoithoai WHERE CuocHoiThoaiID >= 201;
DELETE FROM cuochoithoai WHERE CuocHoiThoaiID >= 201;
DELETE FROM nguoidung_vaitro WHERE NguoiDungID >= 201;
DELETE FROM nguoidung WHERE NguoiDungID >= 201;

SELECT 'Test data đã được xóa!' AS Result;
*/
