CREATE TABLE `yeucauruttien` (
  `YeuCauID` int(11) NOT NULL AUTO_INCREMENT,
  `NguoiDungID` int(11) NOT NULL,
  `SoTien` decimal(15,2) NOT NULL COMMENT 'Số tiền muốn rút',
  `NganHang` varchar(100) NOT NULL COMMENT 'Tên ngân hàng',
  `SoTaiKhoan` varchar(50) NOT NULL COMMENT 'Số tài khoản nhận tiền',
  `TenChuTaiKhoan` varchar(100) NOT NULL COMMENT 'Tên chủ tài khoản',
  `TrangThai` enum('ChoXuLy','DaDuyet','TuChoi') DEFAULT 'ChoXuLy',
  `GhiChu` text COMMENT 'Ghi chú từ admin hoặc người dùng',
  `TaoLuc` datetime DEFAULT CURRENT_TIMESTAMP,
  `CapNhatLuc` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`YeuCauID`),
  KEY `idx_nguoidung_yeucau` (`NguoiDungID`),
  CONSTRAINT `fk_yeucauruttien_nguoidung` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
