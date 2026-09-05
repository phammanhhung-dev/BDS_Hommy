-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 10, 2025 at 01:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thue_tro`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_phong_by_duan` (IN `p_duan_id` INT)   BEGIN
  SELECT 
    p.PhongID,
    p.TenPhong,
    p.TrangThai,
    p.GiaChuan,
    p.DienTichChuan,
    p.MoTaPhong,
    p.HinhAnhPhong,
    COUNT(pt.TinDangID) as SoTinDangDangDung,
    p.TaoLuc
  FROM phong p
  LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
  LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID 
    AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
  WHERE p.DuAnID = p_duan_id
  GROUP BY p.PhongID
  ORDER BY p.TenPhong;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_phong_by_tindang` (IN `p_tindang_id` INT)   BEGIN
  SELECT 
    p.PhongID,
    p.TenPhong,
    p.TrangThai,
    
    -- Giá hiển thị: Ưu tiên GiaTinDang, fallback GiaChuan
    COALESCE(pt.GiaTinDang, p.GiaChuan) as GiaHienThi,
    COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTichHienThi,
    COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTaHienThi,
    COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as HinhAnhHienThi,
    
    -- Thông tin gốc
    p.GiaChuan,
    p.DienTichChuan,
    p.MoTaPhong,
    
    -- Metadata
    pt.ThuTuHienThi
    
  FROM phong_tindang pt
  JOIN phong p ON pt.PhongID = p.PhongID
  WHERE pt.TinDangID = p_tindang_id
  ORDER BY pt.ThuTuHienThi, p.TenPhong;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `bienbanbangiao`
--

CREATE TABLE `bienbanbangiao` (
  `BienBanBanGiaoID` bigint(20) NOT NULL,
  `HopDongID` int(11) NOT NULL,
  `TinDangID` int(11) NOT NULL,
  `PhongID` int(11) NOT NULL,
  `TrangThai` enum('ChuaBanGiao','DangBanGiao','DaBanGiao') NOT NULL DEFAULT 'ChuaBanGiao',
  `ChiSoDien` int(11) DEFAULT NULL,
  `ChiSoNuoc` int(11) DEFAULT NULL,
  `HienTrangJSON` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ChuKySo` varchar(255) DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `bienbanbangiao`
--
DELIMITER $$
CREATE TRIGGER `trg_before_insert_bienbanbangiao_check_active` BEFORE INSERT ON `bienbanbangiao` FOR EACH ROW BEGIN
    DECLARE existing_count INT;
    
    -- Kiểm tra xem phòng có biên bản đang bàn giao không
    SELECT COUNT(*) INTO existing_count
    FROM `bienbanbangiao`
    WHERE `PhongID` = NEW.`PhongID` 
      AND `TrangThai` = 'DangBanGiao';
    
    -- Nếu đã có biên bản đang bàn giao → báo lỗi
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phòng này đã có biên bản bàn giao đang xử lý (TrangThai=DangBanGiao). Vui lòng hoàn tất biên bản cũ trước.';
    END IF;
    
    -- Optional: Kiểm tra thêm xem phòng có trạng thái phù hợp không
    -- (Ví dụ: chỉ cho phép bàn giao phòng có TrangThai='DaThue')
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `buttoansocai`
--

CREATE TABLE `buttoansocai` (
  `ButToanID` bigint(20) NOT NULL,
  `GiaoDichID` int(11) NOT NULL,
  `ViID` int(11) NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `LoaiButToan` enum('ghi_no','ghi_co') NOT NULL,
  `ThoiGian` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `buttoansocai`
--
DELIMITER $$
CREATE TRIGGER `trg_buttoan_no_delete` BEFORE DELETE ON `buttoansocai` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'buttoansocai is append-only';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_buttoan_no_update` BEFORE UPDATE ON `buttoansocai` FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'buttoansocai is append-only';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chinhsachcoc`
--

CREATE TABLE `chinhsachcoc` (
  `ChinhSachCocID` int(11) NOT NULL,
  `ChuDuAnID` int(11) DEFAULT NULL COMMENT 'ID Chủ dự án sở hữu chính sách (NULL = hệ thống)',
  `TenChinhSach` varchar(255) NOT NULL,
  `MoTa` text DEFAULT NULL,
  `ChoPhepCocGiuCho` tinyint(1) NOT NULL DEFAULT 1,
  `TTL_CocGiuCho_Gio` int(11) NOT NULL DEFAULT 48,
  `TyLePhat_CocGiuCho` tinyint(3) UNSIGNED DEFAULT NULL,
  `ChoPhepCocAnNinh` tinyint(1) NOT NULL DEFAULT 1,
  `SoTienCocAnNinhMacDinh` decimal(15,2) DEFAULT NULL,
  `QuyTacGiaiToa` enum('BanGiao','TheoNgay','Khac') NOT NULL DEFAULT 'BanGiao',
  `SoNgayGiaiToa` int(11) DEFAULT NULL,
  `HieuLuc` tinyint(1) NOT NULL DEFAULT 1,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chinhsachcoc`
--

INSERT INTO `chinhsachcoc` (`ChinhSachCocID`, `ChuDuAnID`, `TenChinhSach`, `MoTa`, `ChoPhepCocGiuCho`, `TTL_CocGiuCho_Gio`, `TyLePhat_CocGiuCho`, `ChoPhepCocAnNinh`, `SoTienCocAnNinhMacDinh`, `QuyTacGiaiToa`, `SoNgayGiaiToa`, `HieuLuc`, `TaoLuc`, `CapNhatLuc`) VALUES
(1, NULL, 'Mặc định', 'Policy mặc định hệ thống', 1, 48, 0, 1, NULL, 'BanGiao', NULL, 1, '2025-09-27 14:59:04', '2025-09-27 14:59:04');

--
-- Triggers `chinhsachcoc`
--
DELIMITER $$
CREATE TRIGGER `trg_chk_tyle_policy_ins` BEFORE INSERT ON `chinhsachcoc` FOR EACH ROW BEGIN
  IF NEW.TyLePhat_CocGiuCho IS NOT NULL AND (NEW.TyLePhat_CocGiuCho < 0 OR NEW.TyLePhat_CocGiuCho > 100) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TyLePhat_CocGiuCho must be integer 0..100';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_chk_tyle_policy_upd` BEFORE UPDATE ON `chinhsachcoc` FOR EACH ROW BEGIN
  IF NEW.TyLePhat_CocGiuCho IS NOT NULL AND (NEW.TyLePhat_CocGiuCho < 0 OR NEW.TyLePhat_CocGiuCho > 100) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TyLePhat_CocGiuCho must be integer 0..100';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `coc`
--

CREATE TABLE `coc` (
  `CocID` bigint(20) NOT NULL,
  `GiaoDichID` int(11) NOT NULL,
  `TinDangID` int(11) NOT NULL,
  `PhongID` int(11) NOT NULL,
  `Loai` enum('CocGiuCho','CocAnNinh') NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `TTL_Gio` int(11) DEFAULT NULL,
  `HetHanLuc` datetime DEFAULT NULL,
  `TrangThai` enum('HieuLuc','HetHan','DaGiaiToa','DaDoiTru') NOT NULL DEFAULT 'HieuLuc',
  `BienBanBanGiaoID` bigint(20) DEFAULT NULL,
  `GhiChu` text DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ChinhSachCocID` int(11) DEFAULT NULL,
  `QuyTacGiaiToaSnapshot` enum('BanGiao','TheoNgay','Khac') DEFAULT NULL,
  `TyLePhatCocGiuChoSnapshot` tinyint(3) UNSIGNED DEFAULT NULL,
  `SoNgayGiaiToaSnapshot` int(11) DEFAULT NULL,
  `HopDongID` int(11) DEFAULT NULL,
  `LyDoGiaiToa` text DEFAULT NULL,
  `LyDoKhauTru` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `coc`
--
DELIMITER $$
CREATE TRIGGER `trg_chk_tyle_snapshot_ins` BEFORE INSERT ON `coc` FOR EACH ROW BEGIN
  IF NEW.TyLePhatCocGiuChoSnapshot IS NOT NULL AND (NEW.TyLePhatCocGiuChoSnapshot < 0 OR NEW.TyLePhatCocGiuChoSnapshot > 100) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TyLePhatCocGiuChoSnapshot must be integer 0..100';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_chk_tyle_snapshot_upd` BEFORE UPDATE ON `coc` FOR EACH ROW BEGIN
  IF NEW.TyLePhatCocGiuChoSnapshot IS NOT NULL AND (NEW.TyLePhatCocGiuChoSnapshot < 0 OR NEW.TyLePhatCocGiuChoSnapshot > 100) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TyLePhatCocGiuChoSnapshot must be integer 0..100';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_coc_one_active_per_room_ins` BEFORE INSERT ON `coc` FOR EACH ROW BEGIN
  IF NEW.TrangThai = 'HieuLuc' THEN
    IF EXISTS (SELECT 1 FROM coc WHERE PhongID = NEW.PhongID AND TrangThai = 'HieuLuc') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phong da co coc hieu luc', MYSQL_ERRNO = 1644;
    END IF;
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_coc_one_active_per_room_upd` BEFORE UPDATE ON `coc` FOR EACH ROW BEGIN
  IF NEW.TrangThai = 'HieuLuc' THEN
    IF EXISTS (SELECT 1 FROM coc
               WHERE PhongID = NEW.PhongID
                 AND TrangThai = 'HieuLuc'
                 AND CocID <> OLD.CocID) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phong da co coc hieu luc', MYSQL_ERRNO = 1644;
    END IF;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cuochen`
--

CREATE TABLE `cuochen` (
  `CuocHenID` int(11) NOT NULL,
  `KhachHangID` int(11) DEFAULT NULL,
  `NhanVienBanHangID` int(11) DEFAULT NULL,
  `PhongID` int(11) NOT NULL,
  `TinDangID` int(11) NOT NULL,
  `ThoiGianHen` datetime DEFAULT NULL,
  `TrangThai` enum('DaYeuCau','ChoXacNhan','DaXacNhan','DaDoiLich','HuyBoiKhach','HuyBoiHeThong','KhachKhongDen','HoanThanh') DEFAULT NULL,
  `PheDuyetChuDuAn` enum('ChoPheDuyet','DaPheDuyet','TuChoi') DEFAULT NULL COMMENT 'Trạng thái phê duyệt từ chủ dự án (NULL nếu dự án không yêu cầu phê duyệt)',
  `LyDoTuChoi` text DEFAULT NULL COMMENT 'Lý do từ chối cuộc hẹn (nếu PheDuyetChuDuAn = TuChoi)',
  `PhuongThucVao` text DEFAULT NULL COMMENT 'Phương thức vào dự án cho cuộc hẹn này (ghi đè PhuongThucVao của duan nếu có)',
  `ThoiGianPheDuyet` datetime DEFAULT NULL COMMENT 'Thời điểm chủ dự án phê duyệt/từ chối cuộc hẹn',
  `SoLanDoiLich` int(11) NOT NULL DEFAULT 0,
  `GhiChuKetQua` text DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `GhiChu` text NOT NULL,
  `ChuDuAnID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cuochen`
--

INSERT INTO `cuochen` (`CuocHenID`, `KhachHangID`, `NhanVienBanHangID`, `PhongID`, `TinDangID`, `ThoiGianHen`, `TrangThai`, `PheDuyetChuDuAn`, `LyDoTuChoi`, `PhuongThucVao`, `ThoiGianPheDuyet`, `SoLanDoiLich`, `GhiChuKetQua`, `TaoLuc`, `CapNhatLuc`, `GhiChu`, `ChuDuAnID`) VALUES
(8, 7, 8, 3, 5, '2025-11-10 07:30:00', 'ChoXacNhan', 'DaPheDuyet', NULL, NULL, NULL, 0, NULL, '2025-11-09 16:11:17', '2025-11-19 05:38:47', '0', 0),
(9, 7, 8, 3, 5, '2025-11-10 07:30:00', 'ChoXacNhan', 'DaPheDuyet', NULL, NULL, NULL, 0, NULL, '2025-11-09 16:12:05', '2025-11-19 05:38:53', '0', 0),
(11, 7, 8, 5, 8, '2025-11-09 10:07:00', 'ChoXacNhan', 'DaPheDuyet', NULL, NULL, NULL, 0, NULL, '2025-11-09 16:37:21', '2025-11-19 05:39:13', '0', 0),
(17, 7, 8, 7, 9, '2025-11-09 17:33:00', 'ChoXacNhan', 'DaPheDuyet', NULL, NULL, NULL, 0, NULL, '2025-11-09 17:03:06', '2025-11-19 05:39:20', '3432324', 0),
(18, 7, 8, 4, 6, '2025-11-09 17:37:00', 'ChoXacNhan', 'ChoPheDuyet', NULL, NULL, NULL, 0, NULL, '2025-11-09 17:07:39', '2025-11-19 05:39:29', '0', 0),
(19, 7, 8, 4, 6, '2025-11-20 15:31:00', 'DaDoiLich', 'DaPheDuyet', NULL, NULL, NULL, 1, '{\"activities\":[{\"timestamp\":\"2025-11-19T08:31:26.812Z\",\"action\":\"xac_nhan\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"\"},{\"timestamp\":\"2025-11-19T08:31:40.342Z\",\"action\":\"doi_lich\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"Theo yêu cầu\",\"oldTime\":\"2025-11-10T15:35:00.000Z\",\"newTime\":\"2025-11-20T15:31\"}]}', '2025-11-10 22:05:57', '2025-11-19 15:31:40', '0', 1),
(20, 7, 8, 1, 4, '2025-11-10 22:36:00', 'HoanThanh', 'DaPheDuyet', NULL, NULL, NULL, 0, '{\"activities\":[{\"timestamp\":\"2025-11-20T05:34:22.840Z\",\"action\":\"bao_cao\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"Kết quả: thanh_cong\",\"ketQua\":\"thanh_cong\"}],\"oldNote\":\"\\n[2025-11-18 22:53:15] Xác nhận bởi NVBH: \",\"thoiGianBaoCao\":\"2025-11-20T05:34:22.840Z\",\"ketQua\":\"thanh_cong\",\"khachQuanTam\":true,\"lyDoThatBai\":null,\"keHoachFollowUp\":\"Khả năng chốt: Cao\",\"ghiChu\":\"hihi\",\"slaWarning\":\"Báo cáo muộn 229 giờ\"}', '2025-11-10 22:06:32', '2025-11-20 12:34:22', '0', 1),
(21, 7, 8, 7, 9, '2025-11-20 13:39:00', 'DaDoiLich', 'DaPheDuyet', NULL, NULL, NULL, 1, '\n[2025-11-19 13:38:08] Xác nhận bởi NVBH: \n[2025-11-19 13:40:00] Đổi lịch bởi NVBH: Theo yêu cầu', '2025-11-10 22:06:43', '2025-11-19 13:40:00', '0', 1),
(22, 7, 8, 5, 8, '2025-11-10 22:36:00', 'HoanThanh', 'DaPheDuyet', NULL, NULL, NULL, 0, '{\"activities\":[{\"timestamp\":\"2025-11-19T06:52:43.449Z\",\"action\":\"xac_nhan\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"\"},{\"timestamp\":\"2025-11-19T06:53:03.138Z\",\"action\":\"bao_cao\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"Kết quả: HoanThanh\",\"ketQua\":\"HoanThanh\"}],\"thoiGianBaoCao\":\"2025-11-19T06:53:03.138Z\",\"ketQua\":\"HoanThanh\",\"khachQuanTam\":true,\"lyDoThatBai\":null,\"keHoachFollowUp\":\"Khả năng chốt: Cao\",\"ghiChu\":\"Chắc chắn chốt\\n\",\"slaWarning\":\"Báo cáo muộn 207 giờ\"}', '2025-11-10 22:06:49', '2025-11-19 13:53:03', '0', 1),
(25, 7, 8, 4, 5, '2025-11-20 13:52:00', 'DaDoiLich', 'ChoPheDuyet', NULL, NULL, NULL, 1, '{\"activities\":[{\"timestamp\":\"2025-11-19T06:52:05.652Z\",\"action\":\"xac_nhan\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"\"},{\"timestamp\":\"2025-11-19T06:52:12.552Z\",\"action\":\"doi_lich\",\"actor\":\"NVBH\",\"nhanVienId\":8,\"note\":\"Theo yêu cầu\",\"oldTime\":\"2025-11-18T17:12:00.000Z\",\"newTime\":\"2025-11-20T13:52\"}]}', '2025-11-18 23:43:00', '2025-11-19 13:52:12', '0', 0),
(26, 7, 8, 3, 6, '2025-11-19 00:23:00', 'HoanThanh', 'ChoPheDuyet', NULL, NULL, NULL, 0, '{\"thoiGianBaoCao\":\"2025-11-19T06:37:28.455Z\",\"ketQua\":\"HoanThanh\",\"khachQuanTam\":true,\"lyDoThatBai\":null,\"keHoachFollowUp\":\"Khả năng chốt: Cao\",\"ghiChu\":\"Tiềm năng\",\"slaWarning\":null}', '2025-11-18 23:56:55', '2025-11-19 13:37:28', '0', 0),
(52, 7, 8, 2, 4, '2025-11-25 08:36:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-11-23 13:06:18', '2025-11-23 13:06:18', 'ádaDSAd', 1),
(53, 7, 1, 3, 6, '2025-11-23 13:37:00', 'ChoXacNhan', 'ChoPheDuyet', NULL, '', NULL, 0, '', '2025-11-23 13:07:28', '2025-11-23 13:07:28', 'dádasd', 1),
(54, 7, 1, 4, 6, '2025-11-23 22:12:00', 'ChoXacNhan', 'ChoPheDuyet', NULL, '', NULL, 0, '', '2025-11-23 21:42:21', '2025-11-23 21:42:21', 'dsadadas', 1),
(55, 245, 1, 5, 8, '2025-11-28 22:36:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'Mật khẩu cổng là 6824', NULL, 0, '', '2025-11-28 22:07:00', '2025-11-28 22:07:00', 'đasadsa', 1),
(56, 245, 1, 1, 4, '2025-11-30 09:46:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-11-29 09:16:52', '2025-11-29 09:16:52', 'abc', 1),
(57, 245, 1, 1, 4, '2025-12-02 09:53:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-11-29 09:23:23', '2025-11-29 09:23:23', 'abcd', 1),
(58, 245, 1, 5, 8, '2025-12-02 10:00:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'Mật khẩu cổng là 6824', NULL, 0, '', '2025-11-29 09:31:05', '2025-11-29 09:31:05', 'muốn xem phòng', 1),
(59, 245, 8, 5, 8, '2025-11-29 10:32:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'Mật khẩu cổng là 6824', NULL, 0, '', '2025-11-29 10:02:11', '2025-11-29 10:02:11', 'rtgrẻ', 1),
(60, 7, 8, 1, 4, '2025-11-30 03:45:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-11-29 11:15:56', '2025-11-29 11:15:56', 'muoosn xem', 1),
(61, 245, 8, 2, 4, '2025-12-09 23:59:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-12-09 23:29:28', '2025-12-09 23:29:28', 'xfdfsafasdfds', 1),
(62, 245, 8, 3, 6, '2025-12-10 01:39:00', 'ChoXacNhan', 'ChoPheDuyet', NULL, '', NULL, 0, '', '2025-12-10 01:09:32', '2025-12-10 01:09:32', 'sdfdsfsd', 1),
(63, 245, 8, 3, 6, '2025-12-10 10:42:00', 'ChoXacNhan', 'DaPheDuyet', NULL, 'Đến gọi anh', '2025-12-10 06:26:00', 0, '\n[Phê duyệt bởi chủ dự án lúc 2025-12-10 06:26:00]', '2025-12-10 01:12:46', '2025-12-10 06:26:00', 'chungptro', 1),
(64, 245, 8, 1, 4, '2025-12-17 07:48:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-12-10 01:18:31', '2025-12-10 01:18:31', 'fdfgdsgfdgdfsgdsf', 1),
(65, 245, 8, 2, 4, '2025-12-10 02:02:00', 'DaXacNhan', 'DaPheDuyet', NULL, 'mật khẩu cổng là 1234', NULL, 0, '', '2025-12-10 01:32:17', '2025-12-10 01:32:17', 'sdsds', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cuochoithoai`
--

CREATE TABLE `cuochoithoai` (
  `CuocHoiThoaiID` int(11) NOT NULL,
  `NguCanhID` int(11) DEFAULT NULL,
  `NguCanhLoai` enum('TinDang','CuocHen','HopDong','HeThong') NOT NULL COMMENT 'Loại ngữ cảnh của cuộc hội thoại',
  `TieuDe` varchar(255) DEFAULT NULL,
  `ThoiDiemTinNhanCuoi` datetime DEFAULT NULL,
  `DangHoatDong` tinyint(1) DEFAULT 1,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cuochoithoai`
--

INSERT INTO `cuochoithoai` (`CuocHoiThoaiID`, `NguCanhID`, `NguCanhLoai`, `TieuDe`, `ThoiDiemTinNhanCuoi`, `DangHoatDong`, `TaoLuc`, `CapNhatLuc`) VALUES
(201, 4, 'TinDang', 'Tin đăng: Phòng trọ giá rẻ cho nữ thuê - Nhà trọ Minh Tâm', '2025-11-04 17:05:27', 1, '2025-11-02 22:05:27', '2025-11-04 22:05:27'),
(202, 1, 'CuocHen', 'Cuộc hẹn xem phòng #1 - Nhà trọ Minh Tâm', '2025-11-04 04:05:27', 1, '2025-11-03 22:05:27', '2025-11-04 22:05:27'),
(203, 1, 'HopDong', 'Hợp đồng thuê #1 - Nhà trọ Minh Tâm', '2025-11-04 22:51:51', 1, '2025-11-04 19:05:27', '2025-11-04 22:51:51'),
(204, 17, 'TinDang', 'Tin đăng: Nhà Trọ Hoành Hợp - Hỗ trợ tư vấn', '2025-11-04 21:05:27', 1, '2025-11-04 17:05:27', '2025-11-04 22:05:27'),
(219, 29, 'CuocHen', 'Cuộc hẹn #29 - 102', '2025-12-08 22:36:05', 1, '2025-11-19 00:16:56', '2025-12-08 22:36:05'),
(220, 20, 'CuocHen', 'Cuộc hẹn #20 - Lam Ngoc Giang', NULL, 1, '2025-11-19 06:27:41', '2025-11-19 06:27:41'),
(221, 21, 'CuocHen', 'Cuộc hẹn #21 - Lam Ngoc Giang', NULL, 1, '2025-11-19 13:42:47', '2025-11-19 13:42:47'),
(224, 19, 'CuocHen', 'Cuộc hẹn #19 - Lam Ngoc Giang', NULL, 1, '2025-11-20 12:31:06', '2025-11-20 12:31:06'),
(225, 60, 'CuocHen', 'Cuộc hẹn #60 - Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10', '2025-11-29 11:19:55', 1, '2025-11-29 11:19:38', '2025-11-29 11:19:55'),
(226, 63, 'CuocHen', 'Cuộc hẹn #63 - Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên', '2025-12-10 01:15:16', 1, '2025-12-10 01:13:18', '2025-12-10 01:15:16'),
(227, 64, 'CuocHen', 'Cuộc hẹn #64 - Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10', '2025-12-10 01:33:59', 1, '2025-12-10 01:20:35', '2025-12-10 01:33:59'),
(228, 61, 'CuocHen', 'Cuộc hẹn #61 - 1006', NULL, 1, '2025-12-10 06:25:15', '2025-12-10 06:25:15');

-- --------------------------------------------------------

--
-- Table structure for table `duan`
--

CREATE TABLE `duan` (
  `DuAnID` int(11) NOT NULL,
  `TenDuAn` varchar(255) NOT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `ViDo` decimal(10,7) DEFAULT NULL COMMENT 'Vĩ độ (Latitude) - Geocoded từ địa chỉ',
  `KinhDo` decimal(10,7) DEFAULT NULL COMMENT 'Kinh độ (Longitude) - Geocoded từ địa chỉ',
  `ChuDuAnID` int(11) DEFAULT NULL,
  `ChinhSachCocID` int(11) DEFAULT NULL COMMENT 'ID chính sách cọc áp dụng cho dự án (NULL = dùng mặc định hệ thống)',
  `BangHoaHong` text DEFAULT NULL COMMENT 'Bảng hoa hồng (JSON array): [{soThang: 6, tyLe: 30}, {soThang: 12, tyLe: 50}] - Tỷ lệ hoa hồng theo số tháng cọc',
  `SoThangCocToiThieu` int(11) DEFAULT NULL COMMENT 'Số tháng cọc tối thiểu để được áp dụng hoa hồng (nếu có bảng hoa hồng)',
  `YeuCauPheDuyetChu` tinyint(1) DEFAULT 0,
  `PhuongThucVao` text DEFAULT NULL COMMENT 'Phương thức vào dự án khi không cần phê duyệt (mật khẩu cửa, vị trí lấy chìa khóa, v.v.)',
  `TrangThai` enum('HoatDong','NgungHoatDong','LuuTru') DEFAULT 'HoatDong',
  `LyDoNgungHoatDong` text DEFAULT NULL COMMENT 'Lý do dự án bị ngưng hoạt động (banned) do vi phạm chính sách',
  `NguoiNgungHoatDongID` int(11) DEFAULT NULL COMMENT 'ID Operator/Admin thực hiện banned dự án',
  `NgungHoatDongLuc` datetime DEFAULT NULL COMMENT 'Thời điểm dự án bị ngưng hoạt động',
  `YeuCauMoLai` enum('ChuaGui','DangXuLy','ChapNhan','TuChoi') DEFAULT NULL COMMENT 'Trạng thái yêu cầu mở lại dự án sau khi bị banned',
  `NoiDungGiaiTrinh` text DEFAULT NULL COMMENT 'Nội dung giải trình của Chủ dự án khi yêu cầu mở lại',
  `ThoiGianGuiYeuCau` datetime DEFAULT NULL COMMENT 'Thời điểm Chủ dự án gửi yêu cầu mở lại',
  `NguoiXuLyYeuCauID` int(11) DEFAULT NULL COMMENT 'ID Operator/Admin xử lý yêu cầu mở lại',
  `ThoiGianXuLyYeuCau` datetime DEFAULT NULL COMMENT 'Thời điểm Operator/Admin xử lý yêu cầu',
  `LyDoTuChoiMoLai` text DEFAULT NULL COMMENT 'Lý do từ chối yêu cầu mở lại (nếu YeuCauMoLai=TuChoi)',
  `TaoLuc` datetime NOT NULL DEFAULT current_timestamp(),
  `CapNhatLuc` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `TrangThaiDuyetHoaHong` enum('ChoDuyet','DaDuyet','TuChoi') DEFAULT 'ChoDuyet' COMMENT 'Trạng thái duyệt hoa hồng',
  `NguoiDuyetHoaHongID` int(11) DEFAULT NULL COMMENT 'ID Operator duyệt hoa hồng',
  `ThoiGianDuyetHoaHong` datetime DEFAULT NULL COMMENT 'Thời điểm duyệt hoa hồng',
  `LyDoTuChoiHoaHong` text DEFAULT NULL COMMENT 'Lý do từ chối hoa hồng'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `duan`
--

INSERT INTO `duan` (`DuAnID`, `TenDuAn`, `DiaChi`, `ViDo`, `KinhDo`, `ChuDuAnID`, `ChinhSachCocID`, `BangHoaHong`, `SoThangCocToiThieu`, `YeuCauPheDuyetChu`, `PhuongThucVao`, `TrangThai`, `LyDoNgungHoatDong`, `NguoiNgungHoatDongID`, `NgungHoatDongLuc`, `YeuCauMoLai`, `NoiDungGiaiTrinh`, `ThoiGianGuiYeuCau`, `NguoiXuLyYeuCauID`, `ThoiGianXuLyYeuCau`, `LyDoTuChoiMoLai`, `TaoLuc`, `CapNhatLuc`, `TrangThaiDuyetHoaHong`, `NguoiDuyetHoaHongID`, `ThoiGianDuyetHoaHong`, `LyDoTuChoiHoaHong`) VALUES
(1, 'Dự án Test - Chung cư ABC', '123 Đường Test, Phường 1, Quận 1, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":31},{\"soThang\":12,\"tyLe\":100}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-27 16:55:01', 'ChoDuyet', NULL, NULL, NULL),
(2, 'Dự án Test - Nhà trọ XYZ', '456 Đường Test 2, Phường 2, Quận 2, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":7,\"tyLe\":40}]', 1, 1, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-28 22:46:57', 'DaDuyet', 9, '2025-11-28 20:04:22', NULL),
(3, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:38', 'ChoDuyet', NULL, NULL, NULL),
(4, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:36', 'ChoDuyet', NULL, NULL, NULL),
(5, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:32', 'ChoDuyet', NULL, NULL, NULL),
(6, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:29', 'ChoDuyet', NULL, NULL, NULL),
(7, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:25', 'ChoDuyet', NULL, NULL, NULL),
(8, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:24', 'ChoDuyet', NULL, NULL, NULL),
(9, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'LuuTru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:19', 'ChoDuyet', NULL, NULL, NULL),
(10, 'Dream House 1', '147 Đường số 59, Phường 14, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'NgungHoatDong', 'Vi phạm chính sách đăng tin: Đăng tin giả mạo, thông tin sai lệch về dự án. Đã nhận 3 báo cáo từ khách hàng.', 4, '2025-09-27 14:36:46', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:15', 'ChoDuyet', NULL, NULL, NULL),
(11, 'Dream House 1', '147 Đường số 59, Phường 15, Quận Gò Vấp, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'NgungHoatDong', 'Vi phạm chính sách thanh toán: Chủ dự án có hành vi lừa đảo, không hoàn tiền cọc cho khách hàng đúng hạn.', 5, '2025-09-27 14:36:52', 'DangXuLy', 'Tôi đã hoàn trả đầy đủ tiền cọc cho khách hàng. Xin cung cấp bằng chứng chuyển khoản đính kèm. Cam kết tuân thủ chính sách từ nay.', '2025-10-01 10:30:00', NULL, NULL, NULL, '2025-09-24 11:38:43', '2025-11-20 12:25:12', 'ChoDuyet', NULL, NULL, NULL),
(12, 'Dream House 1', '147 Đường số 59, Phường Tân Tạo A, Quận Bình Tân, TP. Hồ Chí Minh', NULL, NULL, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, NULL, 'NgungHoatDong', 'Vi phạm quy định an toàn: Dự án không đảm bảo PCCC, có nguy cơ an toàn cao sau kiểm tra của cơ quan chức năng.', 5, '2025-09-27 14:36:58', 'TuChoi', 'Dự án đã khắc phục toàn bộ vấn đề PCCC, có giấy phép từ Cảnh sát PCCC.', '2025-10-05 09:00:00', 5, '2025-10-08 14:30:00', 'Giấy phép PCCC chưa đủ điều kiện theo quy định. Cần có chứng nhận từ UBND quận/huyện.', '2025-09-24 11:38:43', '2025-11-20 12:25:07', 'ChoDuyet', NULL, NULL, NULL),
(14, 'Nhà trọ Minh Tâm', '40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', 10.8379251, 106.6581163, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 0, 'mật khẩu cổng là 1234', 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-01 16:17:33', '2025-11-20 12:25:04', 'ChoDuyet', NULL, NULL, NULL),
(15, 'Nhà Trọ Cheap Avocado', '27 Nguyễn Như Hạnh, Phường Hòa Minh, Quận Liên Chiểu, Đà Nẵng', 16.0626020, 108.1760841, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 1, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-03 21:00:41', '2025-11-20 12:25:00', 'ChoDuyet', NULL, NULL, NULL),
(16, 'Nhà trọ Hải Hương', '15 Hà Huy Tập, Thị trấn Chợ Lầu, Huyện Bắc Bình, Bình Thuận', 11.2239833, 108.5011375, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', NULL, 1, NULL, 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-04 03:02:48', '2025-11-20 12:24:58', 'ChoDuyet', NULL, NULL, NULL),
(17, 'Nhà Trọ Hoành Hợp', '350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh', 10.8385462, 106.6744701, 1, 1, '[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}]', 1, 0, 'Mật khẩu cổng là 6824', 'HoatDong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 17:05:39', '2025-11-19 15:09:04', 'ChoDuyet', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `giaodich`
--

CREATE TABLE `giaodich` (
  `GiaoDichID` int(11) NOT NULL,
  `ViID` int(11) DEFAULT NULL,
  `SoTien` decimal(15,2) DEFAULT NULL,
  `Loai` enum('NAP_TIEN','COC_GIU_CHO','COC_AN_NINH','THANH_TOAN_KY_DAU','PHI_NEN_TANG','HOAN_COC_GIU_CHO','HOAN_COC_AN_NINH','GIAI_TOA_COC_AN_NINH','RUT_TIEN') NOT NULL,
  `TrangThai` enum('KhoiTao','DaUyQuyen','DaGhiNhan','DaThanhToan','DaHoanTien','DaDaoNguoc') DEFAULT NULL,
  `KhoaDinhDanh` char(36) NOT NULL,
  `TinDangLienQuanID` int(11) DEFAULT NULL,
  `GiaoDichThamChieuID` int(11) DEFAULT NULL,
  `ThoiGian` datetime DEFAULT current_timestamp(),
  `KenhThanhToan` enum('CHUYEN_KHOAN','VI_DIEN_TU','TIEN_MAT') DEFAULT NULL,
  `MaGiaoDichNCC` varchar(128) DEFAULT NULL,
  `ChungTuDinhKemURL` text DEFAULT NULL,
  `HoaDonDT_ID` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `giaodich`
--
DELIMITER $$
CREATE TRIGGER `trg_validate_ledger_on_giaodich` AFTER UPDATE ON `giaodich` FOR EACH ROW BEGIN
  -- Khai báo biến phải ở đầu BEGIN...END
  DECLARE tong_no DECIMAL(18,2) DEFAULT 0.00;
  DECLARE tong_co DECIMAL(18,2) DEFAULT 0.00;

  -- Chỉ kiểm tra khi trạng thái vừa chuyển sang 'DaGhiNhan'
  IF NEW.TrangThai = 'DaGhiNhan' AND COALESCE(OLD.TrangThai,'') <> 'DaGhiNhan' THEN
    SELECT COALESCE(SUM(CASE WHEN LoaiButToan='ghi_no' THEN SoTien ELSE 0 END),0),
           COALESCE(SUM(CASE WHEN LoaiButToan='ghi_co' THEN SoTien ELSE 0 END),0)
      INTO tong_no, tong_co
      FROM buttoansocai
     WHERE GiaoDichID = NEW.GiaoDichID;

    IF tong_no <> tong_co THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ledger not balanced for this transaction',
            MYSQL_ERRNO  = 1644;
    END IF;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `hopdong`
--

CREATE TABLE `hopdong` (
  `HopDongID` int(11) NOT NULL,
  `TinDangID` int(11) DEFAULT NULL,
  `PhongID` int(11) DEFAULT NULL COMMENT 'ID phòng được đặt cọc',
  `DuAnID` int(11) DEFAULT NULL COMMENT 'ID dự án',
  `NhanVienBanHangID` int(11) DEFAULT NULL COMMENT 'ID nhân viên bán hàng phụ trách hợp đồng này',
  `KhachHangID` int(11) DEFAULT NULL,
  `NgayBatDau` date DEFAULT NULL,
  `NgayKetThuc` date DEFAULT NULL,
  `GiaThueCuoiCung` decimal(15,2) DEFAULT NULL,
  `SoTienCoc` decimal(15,2) DEFAULT NULL COMMENT 'Số tiền cọc',
  `BaoCaoLuc` datetime DEFAULT NULL,
  `MauHopDongID` int(11) DEFAULT NULL,
  `NoiDungSnapshot` text DEFAULT NULL,
  `FileScanPath` varchar(500) DEFAULT NULL COMMENT 'Đường dẫn file scan hợp đồng (PDF/Image)',
  `noidunghopdong` text NOT NULL,
  `TrangThai` enum('xacthuc','xinhuy','dahuy') DEFAULT NULL COMMENT 'Trạng thái hợp đồng: xacthuc (Xác thực), xinhuy (Xin hủy), dahuy (Đã hủy)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hopdong`
--

INSERT INTO `hopdong` (`HopDongID`, `TinDangID`, `PhongID`, `DuAnID`, `NhanVienBanHangID`, `KhachHangID`, `NgayBatDau`, `NgayKetThuc`, `GiaThueCuoiCung`, `SoTienCoc`, `BaoCaoLuc`, `MauHopDongID`, `NoiDungSnapshot`, `FileScanPath`, `noidunghopdong`, `TrangThai`) VALUES
(7, 8, 5, 17, NULL, 245, '2025-11-30', '2026-05-30', 3000000.00, 3000000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>30 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.000.000 VNĐ/tháng</strong> (bằng chữ: 3.000.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.000.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.000 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(8, 9, 7, 14, NULL, 245, '2025-11-30', '2026-05-30', 7700000.00, 7700000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>202</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>55 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>7.700.000 VNĐ/tháng</strong> (bằng chữ: 7.700.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>7.700.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(10, 4, 1, 14, NULL, 245, '2025-11-30', '2026-05-30', 3500000.00, 3500000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: 3.500.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc');
INSERT INTO `hopdong` (`HopDongID`, `TinDangID`, `PhongID`, `DuAnID`, `NhanVienBanHangID`, `KhachHangID`, `NgayBatDau`, `NgayKetThuc`, `GiaThueCuoiCung`, `SoTienCoc`, `BaoCaoLuc`, `MauHopDongID`, `NoiDungSnapshot`, `FileScanPath`, `noidunghopdong`, `TrangThai`) VALUES
(11, 4, 1, 14, NULL, 7, '2025-11-30', '2026-05-30', 3500000.00, 3500000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>Lam Ngoc Giang</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>1111111</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>nghean</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0911576455</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: 3.500.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Văn Chủ Dự Án</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>Lam Ngoc Giang</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(12, 4, 2, 14, NULL, 245, '2025-12-10', '2026-06-10', 4000000.00, 4000000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Hữu Anh Khoa</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>27/7/2004</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>060204002386</strong> Ngày cấp: <strong>12/4/2021</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>80, Nguyễn Tất Thành, Chợ Lầu, Bắc Bình, Bình Thuận</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>1006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>4.000.000 VNĐ/tháng</strong> (bằng chữ: 4.000.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>4.000.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Hữu Anh Khoa</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(13, 5, 3, 15, NULL, 245, '2025-12-10', '2026-06-10', 3000000.00, 3000000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Hữu Anh Khoa</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>27/7/2004</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>060204002386</strong> Ngày cấp: <strong>12/4/2021</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>80, Nguyễn Tất Thành, Chợ Lầu, Bắc Bình, Bình Thuận</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>27 Nguyễn Như Hạnh, Phường Hòa Minh, Quận Liên Chiểu, Đà Nẵng</strong> / số phòng: <strong>101</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.000.000 VNĐ/tháng</strong> (bằng chữ: 3.000.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.000.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.000 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>18.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>200.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Hữu Anh Khoa</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc');
INSERT INTO `hopdong` (`HopDongID`, `TinDangID`, `PhongID`, `DuAnID`, `NhanVienBanHangID`, `KhachHangID`, `NgayBatDau`, `NgayKetThuc`, `GiaThueCuoiCung`, `SoTienCoc`, `BaoCaoLuc`, `MauHopDongID`, `NoiDungSnapshot`, `FileScanPath`, `noidunghopdong`, `TrangThai`) VALUES
(14, 4, 1, 14, NULL, 245, '2025-12-10', '2026-06-10', 3500000.00, 3500000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Hữu Anh Khoa</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>27/7/2004</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>060204002386</strong> Ngày cấp: <strong>12/4/2021</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>80, Nguyễn Tất Thành, Chợ Lầu, Bắc Bình, Bình Thuận</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: 3.500.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Hữu Anh Khoa</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(15, 4, 1, 14, NULL, 245, '2025-12-10', '2026-06-10', 3500000.00, 3500000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Nguyễn Hữu Anh Khoa</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>27/7/2004</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>060204002386</strong> Ngày cấp: <strong>12/4/2021</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>80, Nguyễn Tất Thành, Chợ Lầu, Bắc Bình, Bình Thuận</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: 3.500.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>3.500.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Nguyễn Hữu Anh Khoa</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc'),
(16, 4, 2, 14, NULL, 245, '2025-12-11', '2026-06-11', 4000000.00, 4000000.00, NULL, NULL, NULL, NULL, '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): <strong>Võ Nguyễn Hoành Hợp</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>11/11/2003</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>060203002124</strong> Ngày cấp: <strong>19/4/2021</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>15, Đường Hà Huy Tập, Chợ Lầu, Bắc Bình, Bình Thuận</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0901234567</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: <strong>kiên mặt lợn</strong></p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: <strong>Đang cập nhật</strong> Ngày cấp: <strong>Đang cập nhật</strong> Nơi cấp: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: <strong>Đang cập nhật</strong></p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: <strong>0908878473</strong></p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: <strong>40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh</strong> / số phòng: <strong>1006</strong></p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: <strong>25 m²</strong></p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>4.000.000 VNĐ/tháng</strong> (bằng chữ: 4.000.000 đồng) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>4.000.000 VNĐ/tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: <strong>3.500 VNĐ/kWh</strong> (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: <strong>20.000 VNĐ/m³</strong> (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>150.000 VNĐ/tháng</strong></p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\"><strong>Võ Nguyễn Hoành Hợp</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\"><strong>kiên mặt lợn</strong></p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', 'xacthuc');

-- --------------------------------------------------------

--
-- Table structure for table `hosonhanvien`
--

CREATE TABLE `hosonhanvien` (
  `HoSoID` int(11) NOT NULL,
  `NguoiDungID` int(11) DEFAULT NULL,
  `QuanLyID` int(11) DEFAULT NULL,
  `MaNhanVien` varchar(100) DEFAULT NULL,
  `KhuVucChinhID` int(11) DEFAULT NULL,
  `KhuVucPhuTrachID` int(11) DEFAULT NULL,
  `TyLeHoaHong` decimal(5,2) DEFAULT NULL,
  `NgayBatDau` date DEFAULT NULL,
  `NgayKetThuc` date DEFAULT NULL,
  `GhiChu` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hosonhanvien`
--

INSERT INTO `hosonhanvien` (`HoSoID`, `NguoiDungID`, `QuanLyID`, `MaNhanVien`, `KhuVucChinhID`, `KhuVucPhuTrachID`, `TyLeHoaHong`, `NgayBatDau`, `NgayKetThuc`, `GhiChu`) VALUES
(7, 8, 9, 'NV0001', 62, 720, 50.00, '2025-11-17', NULL, NULL),
(11, 230, NULL, '230', 720, NULL, 10.00, '2025-11-01', '2029-11-15', NULL),
(12, 9, NULL, 'NV0002', 62, 720, 10.00, '2025-11-28', NULL, NULL),
(13, 247, 9, 'NV0003', 62, 720, 50.00, '2025-11-29', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `khuvuc`
--

CREATE TABLE `khuvuc` (
  `KhuVucID` int(11) NOT NULL,
  `TenKhuVuc` varchar(255) NOT NULL,
  `ParentKhuVucID` int(11) DEFAULT NULL,
  `ViDo` decimal(10,6) DEFAULT NULL,
  `KinhDo` decimal(10,6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `khuvuc`
--

INSERT INTO `khuvuc` (`KhuVucID`, `TenKhuVuc`, `ParentKhuVucID`, `ViDo`, `KinhDo`) VALUES
(5, 'An Giang', NULL, NULL, NULL),
(6, 'Bà Rịa - Vũng Tàu', NULL, NULL, NULL),
(7, 'Bắc Giang', NULL, NULL, NULL),
(8, 'Bắc Kạn', NULL, NULL, NULL),
(9, 'Bạc Liêu', NULL, NULL, NULL),
(10, 'Bắc Ninh', NULL, NULL, NULL),
(11, 'Bến Tre', NULL, NULL, NULL),
(12, 'Bình Định', NULL, NULL, NULL),
(13, 'Bình Dương', NULL, NULL, NULL),
(14, 'Bình Phước', NULL, NULL, NULL),
(15, 'Bình Thuận', NULL, NULL, NULL),
(16, 'Cà Mau', NULL, NULL, NULL),
(17, 'Cần Thơ', NULL, NULL, NULL),
(18, 'Cao Bằng', NULL, NULL, NULL),
(19, 'Đà Nẵng', NULL, NULL, NULL),
(20, 'Đắk Lắk', NULL, NULL, NULL),
(21, 'Đắk Nông', NULL, NULL, NULL),
(22, 'Điện Biên', NULL, NULL, NULL),
(23, 'Đồng Nai', NULL, NULL, NULL),
(24, 'Đồng Tháp', NULL, NULL, NULL),
(25, 'Gia Lai', NULL, NULL, NULL),
(26, 'Hà Giang', NULL, NULL, NULL),
(27, 'Hà Nam', NULL, NULL, NULL),
(28, 'Hà Nội', NULL, NULL, NULL),
(29, 'Hà Tĩnh', NULL, NULL, NULL),
(30, 'Hải Dương', NULL, NULL, NULL),
(31, 'Hải Phòng', NULL, NULL, NULL),
(32, 'Hậu Giang', NULL, NULL, NULL),
(33, 'Hòa Bình', NULL, NULL, NULL),
(34, 'Hưng Yên', NULL, NULL, NULL),
(35, 'Khánh Hòa', NULL, NULL, NULL),
(36, 'Kiên Giang', NULL, NULL, NULL),
(37, 'Kon Tum', NULL, NULL, NULL),
(38, 'Lai Châu', NULL, NULL, NULL),
(39, 'Lâm Đồng', NULL, NULL, NULL),
(40, 'Lạng Sơn', NULL, NULL, NULL),
(41, 'Lào Cai', NULL, NULL, NULL),
(42, 'Long An', NULL, NULL, NULL),
(43, 'Nam Định', NULL, NULL, NULL),
(44, 'Nghệ An', NULL, NULL, NULL),
(45, 'Ninh Bình', NULL, NULL, NULL),
(46, 'Ninh Thuận', NULL, NULL, NULL),
(47, 'Phú Thọ', NULL, NULL, NULL),
(48, 'Phú Yên', NULL, NULL, NULL),
(49, 'Quảng Bình', NULL, NULL, NULL),
(50, 'Quảng Nam', NULL, NULL, NULL),
(51, 'Quảng Ngãi', NULL, NULL, NULL),
(52, 'Quảng Ninh', NULL, NULL, NULL),
(53, 'Quảng Trị', NULL, NULL, NULL),
(54, 'Sóc Trăng', NULL, NULL, NULL),
(55, 'Sơn La', NULL, NULL, NULL),
(56, 'Tây Ninh', NULL, NULL, NULL),
(57, 'Thái Bình', NULL, NULL, NULL),
(58, 'Thái Nguyên', NULL, NULL, NULL),
(59, 'Thanh Hóa', NULL, NULL, NULL),
(60, 'Thừa Thiên Huế', NULL, NULL, NULL),
(61, 'Tiền Giang', NULL, NULL, NULL),
(62, 'TP. Hồ Chí Minh', NULL, NULL, NULL),
(63, 'Trà Vinh', NULL, NULL, NULL),
(64, 'Tuyên Quang', NULL, NULL, NULL),
(65, 'Vĩnh Long', NULL, NULL, NULL),
(66, 'Vĩnh Phúc', NULL, NULL, NULL),
(67, 'Yên Bái', NULL, NULL, NULL),
(68, 'Thành phố Long Xuyên', 5, NULL, NULL),
(69, 'Thành phố Châu Đốc', 5, NULL, NULL),
(70, 'Thị xã Tân Châu', 5, NULL, NULL),
(71, 'Huyện An Phú', 5, NULL, NULL),
(72, 'Huyện Châu Phú', 5, NULL, NULL),
(73, 'Huyện Châu Thành', 5, NULL, NULL),
(74, 'Huyện Chợ Mới', 5, NULL, NULL),
(75, 'Huyện Phú Tân', 5, NULL, NULL),
(76, 'Huyện Thoại Sơn', 5, NULL, NULL),
(77, 'Huyện Tịnh Biên', 5, NULL, NULL),
(78, 'Huyện Tri Tôn', 5, NULL, NULL),
(79, 'Thành phố Vũng Tàu', 6, NULL, NULL),
(80, 'Thành phố Bà Rịa', 6, NULL, NULL),
(81, 'Thị xã Phú Mỹ', 6, NULL, NULL),
(82, 'Huyện Châu Đức', 6, NULL, NULL),
(83, 'Huyện Côn Đảo', 6, NULL, NULL),
(84, 'Huyện Đất Đỏ', 6, NULL, NULL),
(85, 'Huyện Long Điền', 6, NULL, NULL),
(86, 'Huyện Xuyên Mộc', 6, NULL, NULL),
(87, 'Thành phố Bắc Giang', 7, NULL, NULL),
(88, 'Huyện Hiệp Hòa', 7, NULL, NULL),
(89, 'Huyện Lạng Giang', 7, NULL, NULL),
(90, 'Huyện Lục Nam', 7, NULL, NULL),
(91, 'Huyện Lục Ngạn', 7, NULL, NULL),
(92, 'Huyện Sơn Động', 7, NULL, NULL),
(93, 'Huyện Tân Yên', 7, NULL, NULL),
(94, 'Huyện Việt Yên', 7, NULL, NULL),
(95, 'Huyện Yên Dũng', 7, NULL, NULL),
(96, 'Huyện Yên Thế', 7, NULL, NULL),
(97, 'Thành phố Bắc Kạn', 8, NULL, NULL),
(98, 'Huyện Ba Bể', 8, NULL, NULL),
(99, 'Huyện Bạch Thông', 8, NULL, NULL),
(100, 'Huyện Chợ Đồn', 8, NULL, NULL),
(101, 'Huyện Chợ Mới', 8, NULL, NULL),
(102, 'Huyện Na Rì', 8, NULL, NULL),
(103, 'Huyện Ngân Sơn', 8, NULL, NULL),
(104, 'Huyện Pác Nặm', 8, NULL, NULL),
(105, 'Thành phố Bạc Liêu', 9, NULL, NULL),
(106, 'Thị xã Giá Rai', 9, NULL, NULL),
(107, 'Huyện Đông Hải', 9, NULL, NULL),
(108, 'Huyện Hoà Bình', 9, NULL, NULL),
(109, 'Huyện Hồng Dân', 9, NULL, NULL),
(110, 'Huyện Phước Long', 9, NULL, NULL),
(111, 'Huyện Vĩnh Lợi', 9, NULL, NULL),
(112, 'Thành phố Bắc Ninh', 10, NULL, NULL),
(113, 'Thành phố Từ Sơn', 10, NULL, NULL),
(114, 'Huyện Gia Bình', 10, NULL, NULL),
(115, 'Huyện Lương Tài', 10, NULL, NULL),
(116, 'Huyện Quế Võ', 10, NULL, NULL),
(117, 'Huyện Thuận Thành', 10, NULL, NULL),
(118, 'Huyện Tiên Du', 10, NULL, NULL),
(119, 'Huyện Yên Phong', 10, NULL, NULL),
(120, 'Thành phố Bến Tre', 11, NULL, NULL),
(121, 'Huyện Ba Tri', 11, NULL, NULL),
(122, 'Huyện Bình Đại', 11, NULL, NULL),
(123, 'Huyện Châu Thành', 11, NULL, NULL),
(124, 'Huyện Chợ Lách', 11, NULL, NULL),
(125, 'Huyện Giồng Trôm', 11, NULL, NULL),
(126, 'Huyện Mỏ Cày Bắc', 11, NULL, NULL),
(127, 'Huyện Mỏ Cày Nam', 11, NULL, NULL),
(128, 'Huyện Thạnh Phú', 11, NULL, NULL),
(129, 'Thành phố Quy Nhơn', 12, NULL, NULL),
(130, 'Thị xã An Nhơn', 12, NULL, NULL),
(131, 'Thị xã Hoài Nhơn', 12, NULL, NULL),
(132, 'Huyện An Lão', 12, NULL, NULL),
(133, 'Huyện Hoài Ân', 12, NULL, NULL),
(134, 'Huyện Phù Cát', 12, NULL, NULL),
(135, 'Huyện Phù Mỹ', 12, NULL, NULL),
(136, 'Huyện Tây Sơn', 12, NULL, NULL),
(137, 'Huyện Tuy Phước', 12, NULL, NULL),
(138, 'Huyện Vân Canh', 12, NULL, NULL),
(139, 'Huyện Vĩnh Thạnh', 12, NULL, NULL),
(140, 'Thành phố Thủ Dầu Một', 13, NULL, NULL),
(141, 'Thành phố Dĩ An', 13, NULL, NULL),
(142, 'Thành phố Thuận An', 13, NULL, NULL),
(143, 'Thị xã Tân Uyên', 13, NULL, NULL),
(144, 'Thị xã Bến Cát', 13, NULL, NULL),
(145, 'Huyện Bàu Bàng', 13, NULL, NULL),
(146, 'Huyện Bắc Tân Uyên', 13, NULL, NULL),
(147, 'Huyện Dầu Tiếng', 13, NULL, NULL),
(148, 'Huyện Phú Giáo', 13, NULL, NULL),
(149, 'Thành phố Đồng Xoài', 14, NULL, NULL),
(150, 'Thị xã Bình Long', 14, NULL, NULL),
(151, 'Thị xã Phước Long', 14, NULL, NULL),
(152, 'Huyện Bù Đăng', 14, NULL, NULL),
(153, 'Huyện Bù Đốp', 14, NULL, NULL),
(154, 'Huyện Bù Gia Mập', 14, NULL, NULL),
(155, 'Huyện Chơn Thành', 14, NULL, NULL),
(156, 'Huyện Đồng Phú', 14, NULL, NULL),
(157, 'Huyện Hớn Quản', 14, NULL, NULL),
(158, 'Huyện Lộc Ninh', 14, NULL, NULL),
(159, 'Huyện Phú Riềng', 14, NULL, NULL),
(160, 'Thành phố Phan Thiết', 15, NULL, NULL),
(161, 'Thị xã La Gi', 15, NULL, NULL),
(162, 'Huyện Bắc Bình', 15, NULL, NULL),
(163, 'Huyện Đức Linh', 15, NULL, NULL),
(164, 'Huyện Hàm Tân', 15, NULL, NULL),
(165, 'Huyện Hàm Thuận Bắc', 15, NULL, NULL),
(166, 'Huyện Hàm Thuận Nam', 15, NULL, NULL),
(167, 'Huyện Phú Quý', 15, NULL, NULL),
(168, 'Huyện Tánh Linh', 15, NULL, NULL),
(169, 'Huyện Tuy Phong', 15, NULL, NULL),
(170, 'Thành phố Cà Mau', 16, NULL, NULL),
(171, 'Huyện Cái Nước', 16, NULL, NULL),
(172, 'Huyện Đầm Dơi', 16, NULL, NULL),
(173, 'Huyện Năm Căn', 16, NULL, NULL),
(174, 'Huyện Ngọc Hiển', 16, NULL, NULL),
(175, 'Huyện Phú Tân', 16, NULL, NULL),
(176, 'Huyện Thới Bình', 16, NULL, NULL),
(177, 'Huyện Trần Văn Thời', 16, NULL, NULL),
(178, 'Huyện U Minh', 16, NULL, NULL),
(179, 'Quận Ninh Kiều', 17, NULL, NULL),
(180, 'Quận Bình Thủy', 17, NULL, NULL),
(181, 'Quận Cái Răng', 17, NULL, NULL),
(182, 'Quận Ô Môn', 17, NULL, NULL),
(183, 'Quận Thốt Nốt', 17, NULL, NULL),
(184, 'Huyện Cờ Đỏ', 17, NULL, NULL),
(185, 'Huyện Phong Điền', 17, NULL, NULL),
(186, 'Huyện Thới Lai', 17, NULL, NULL),
(187, 'Huyện Vĩnh Thạnh', 17, NULL, NULL),
(188, 'Thành phố Cao Bằng', 18, NULL, NULL),
(189, 'Huyện Bảo Lạc', 18, NULL, NULL),
(190, 'Huyện Bảo Lâm', 18, NULL, NULL),
(191, 'Huyện Hạ Lang', 18, NULL, NULL),
(192, 'Huyện Hà Quảng', 18, NULL, NULL),
(193, 'Huyện Hòa An', 18, NULL, NULL),
(194, 'Huyện Nguyên Bình', 18, NULL, NULL),
(195, 'Huyện Quảng Hòa', 18, NULL, NULL),
(196, 'Huyện Thạch An', 18, NULL, NULL),
(197, 'Huyện Trùng Khánh', 18, NULL, NULL),
(198, 'Quận Cẩm Lệ', 19, NULL, NULL),
(199, 'Quận Hải Châu', 19, NULL, NULL),
(200, 'Quận Liên Chiểu', 19, NULL, NULL),
(201, 'Quận Ngũ Hành Sơn', 19, NULL, NULL),
(202, 'Quận Sơn Trà', 19, NULL, NULL),
(203, 'Quận Thanh Khê', 19, NULL, NULL),
(204, 'Huyện Hòa Vang', 19, NULL, NULL),
(205, 'Huyện Hoàng Sa', 19, NULL, NULL),
(206, 'Thành phố Buôn Ma Thuột', 20, NULL, NULL),
(207, 'Thị xã Buôn Hồ', 20, NULL, NULL),
(208, 'Huyện Buôn Đôn', 20, NULL, NULL),
(209, 'Huyện Cư Kuin', 20, NULL, NULL),
(210, 'Huyện Cư M\'gar', 20, NULL, NULL),
(211, 'Huyện Ea H\'leo', 20, NULL, NULL),
(212, 'Huyện Ea Kar', 20, NULL, NULL),
(213, 'Huyện Ea Súp', 20, NULL, NULL),
(214, 'Huyện Krông Ana', 20, NULL, NULL),
(215, 'Huyện Krông Bông', 20, NULL, NULL),
(216, 'Huyện Krông Búk', 20, NULL, NULL),
(217, 'Huyện Krông Năng', 20, NULL, NULL),
(218, 'Huyện Krông Pắc', 20, NULL, NULL),
(219, 'Huyện Lắk', 20, NULL, NULL),
(220, 'Huyện M\'Đrắk', 20, NULL, NULL),
(221, 'Thành phố Gia Nghĩa', 21, NULL, NULL),
(222, 'Huyện Cư Jút', 21, NULL, NULL),
(223, 'Huyện Đắk Glong', 21, NULL, NULL),
(224, 'Huyện Đắk Mil', 21, NULL, NULL),
(225, 'Huyện Đắk R\'lấp', 21, NULL, NULL),
(226, 'Huyện Đắk Song', 21, NULL, NULL),
(227, 'Huyện Krông Nô', 21, NULL, NULL),
(228, 'Huyện Tuy Đức', 21, NULL, NULL),
(229, 'Thành phố Điện Biên Phủ', 22, NULL, NULL),
(230, 'Thị xã Mường Lay', 22, NULL, NULL),
(231, 'Huyện Mường Nhé', 22, NULL, NULL),
(232, 'Huyện Mường Chà', 22, NULL, NULL),
(233, 'Huyện Tủa Chùa', 22, NULL, NULL),
(234, 'Huyện Tuần Giáo', 22, NULL, NULL),
(235, 'Huyện Điện Biên', 22, NULL, NULL),
(236, 'Huyện Điện Biên Đông', 22, NULL, NULL),
(237, 'Huyện Mường Ảng', 22, NULL, NULL),
(238, 'Huyện Nậm Pồ', 22, NULL, NULL),
(239, 'Thành phố Biên Hòa', 23, NULL, NULL),
(240, 'Thành phố Long Khánh', 23, NULL, NULL),
(241, 'Huyện Tân Phú', 23, NULL, NULL),
(242, 'Huyện Vĩnh Cửu', 23, NULL, NULL),
(243, 'Huyện Định Quán', 23, NULL, NULL),
(244, 'Huyện Trảng Bom', 23, NULL, NULL),
(245, 'Huyện Thống Nhất', 23, NULL, NULL),
(246, 'Huyện Cẩm Mỹ', 23, NULL, NULL),
(247, 'Huyện Long Thành', 23, NULL, NULL),
(248, 'Huyện Xuân Lộc', 23, NULL, NULL),
(249, 'Huyện Nhơn Trạch', 23, NULL, NULL),
(250, 'Thành phố Cao Lãnh', 24, NULL, NULL),
(251, 'Thành phố Sa Đéc', 24, NULL, NULL),
(252, 'Thành phố Hồng Ngự', 24, NULL, NULL),
(253, 'Huyện Tân Hồng', 24, NULL, NULL),
(254, 'Huyện Hồng Ngự', 24, NULL, NULL),
(255, 'Huyện Tam Nông', 24, NULL, NULL),
(256, 'Huyện Thanh Bình', 24, NULL, NULL),
(257, 'Huyện Cao Lãnh', 24, NULL, NULL),
(258, 'Huyện Lấp Vò', 24, NULL, NULL),
(259, 'Huyện Lai Vung', 24, NULL, NULL),
(260, 'Huyện Châu Thành', 24, NULL, NULL),
(261, 'Huyện Tháp Mười', 24, NULL, NULL),
(262, 'Thành phố Pleiku', 25, NULL, NULL),
(263, 'Thị xã An Khê', 25, NULL, NULL),
(264, 'Thị xã Ayun Pa', 25, NULL, NULL),
(265, 'Huyện Chư Păh', 25, NULL, NULL),
(266, 'Huyện Chư Prông', 25, NULL, NULL),
(267, 'Huyện Chư Sê', 25, NULL, NULL),
(268, 'Huyện Đak Đoa', 25, NULL, NULL),
(269, 'Huyện Đak Pơ', 25, NULL, NULL),
(270, 'Huyện Đức Cơ', 25, NULL, NULL),
(271, 'Huyện Ia Grai', 25, NULL, NULL),
(272, 'Huyện Ia Pa', 25, NULL, NULL),
(273, 'Huyện K\'Bang', 25, NULL, NULL),
(274, 'Huyện Kông Chro', 25, NULL, NULL),
(275, 'Huyện Krông Pa', 25, NULL, NULL),
(276, 'Huyện Mang Yang', 25, NULL, NULL),
(277, 'Huyện Phú Thiện', 25, NULL, NULL),
(278, 'Thành phố Hà Giang', 26, NULL, NULL),
(279, 'Huyện Bắc Mê', 26, NULL, NULL),
(280, 'Huyện Bắc Quang', 26, NULL, NULL),
(281, 'Huyện Đồng Văn', 26, NULL, NULL),
(282, 'Huyện Hoàng Su Phì', 26, NULL, NULL),
(283, 'Huyện Mèo Vạc', 26, NULL, NULL),
(284, 'Huyện Quản Bạ', 26, NULL, NULL),
(285, 'Huyện Quang Bình', 26, NULL, NULL),
(286, 'Huyện Vị Xuyên', 26, NULL, NULL),
(287, 'Huyện Xín Mần', 26, NULL, NULL),
(288, 'Huyện Yên Minh', 26, NULL, NULL),
(289, 'Thành phố Phủ Lý', 27, NULL, NULL),
(290, 'Thị xã Duy Tiên', 27, NULL, NULL),
(291, 'Huyện Bình Lục', 27, NULL, NULL),
(292, 'Huyện Kim Bảng', 27, NULL, NULL),
(293, 'Huyện Lý Nhân', 27, NULL, NULL),
(294, 'Huyện Thanh Liêm', 27, NULL, NULL),
(295, 'Quận Ba Đình', 28, NULL, NULL),
(296, 'Quận Hoàn Kiếm', 28, NULL, NULL),
(297, 'Quận Tây Hồ', 28, NULL, NULL),
(298, 'Quận Long Biên', 28, NULL, NULL),
(299, 'Quận Cầu Giấy', 28, NULL, NULL),
(300, 'Quận Đống Đa', 28, NULL, NULL),
(301, 'Quận Hai Bà Trưng', 28, NULL, NULL),
(302, 'Quận Hoàng Mai', 28, NULL, NULL),
(303, 'Quận Hà Đông', 28, NULL, NULL),
(304, 'Quận Thanh Xuân', 28, NULL, NULL),
(305, 'Quận Nam Từ Liêm', 28, NULL, NULL),
(306, 'Quận Bắc Từ Liêm', 28, NULL, NULL),
(307, 'Thị xã Sơn Tây', 28, NULL, NULL),
(308, 'Huyện Ba Vì', 28, NULL, NULL),
(309, 'Huyện Chương Mỹ', 28, NULL, NULL),
(310, 'Huyện Đan Phượng', 28, NULL, NULL),
(311, 'Huyện Đông Anh', 28, NULL, NULL),
(312, 'Huyện Gia Lâm', 28, NULL, NULL),
(313, 'Huyện Hoài Đức', 28, NULL, NULL),
(314, 'Huyện Mê Linh', 28, NULL, NULL),
(315, 'Huyện Mỹ Đức', 28, NULL, NULL),
(316, 'Huyện Phú Xuyên', 28, NULL, NULL),
(317, 'Huyện Phúc Thọ', 28, NULL, NULL),
(318, 'Huyện Quốc Oai', 28, NULL, NULL),
(319, 'Huyện Sóc Sơn', 28, NULL, NULL),
(320, 'Huyện Thạch Thất', 28, NULL, NULL),
(321, 'Huyện Thanh Oai', 28, NULL, NULL),
(322, 'Huyện Thanh Trì', 28, NULL, NULL),
(323, 'Huyện Thường Tín', 28, NULL, NULL),
(324, 'Huyện Ứng Hòa', 28, NULL, NULL),
(325, 'Thành phố Hà Tĩnh', 29, NULL, NULL),
(326, 'Thị xã Hồng Lĩnh', 29, NULL, NULL),
(327, 'Thị xã Kỳ Anh', 29, NULL, NULL),
(328, 'Huyện Cẩm Xuyên', 29, NULL, NULL),
(329, 'Huyện Can Lộc', 29, NULL, NULL),
(330, 'Huyện Đức Thọ', 29, NULL, NULL),
(331, 'Huyện Hương Khê', 29, NULL, NULL),
(332, 'Huyện Hương Sơn', 29, NULL, NULL),
(333, 'Huyện Kỳ Anh', 29, NULL, NULL),
(334, 'Huyện Lộc Hà', 29, NULL, NULL),
(335, 'Huyện Nghi Xuân', 29, NULL, NULL),
(336, 'Huyện Thạch Hà', 29, NULL, NULL),
(337, 'Huyện Vũ Quang', 29, NULL, NULL),
(338, 'Thành phố Hải Dương', 30, NULL, NULL),
(339, 'Thành phố Chí Linh', 30, NULL, NULL),
(340, 'Thị xã Kinh Môn', 30, NULL, NULL),
(341, 'Huyện Bình Giang', 30, NULL, NULL),
(342, 'Huyện Cẩm Giàng', 30, NULL, NULL),
(343, 'Huyện Gia Lộc', 30, NULL, NULL),
(344, 'Huyện Kim Thành', 30, NULL, NULL),
(345, 'Huyện Nam Sách', 30, NULL, NULL),
(346, 'Huyện Ninh Giang', 30, NULL, NULL),
(347, 'Huyện Thanh Hà', 30, NULL, NULL),
(348, 'Huyện Thanh Miện', 30, NULL, NULL),
(349, 'Huyện Tứ Kỳ', 30, NULL, NULL),
(350, 'Quận Đồ Sơn', 31, NULL, NULL),
(351, 'Quận Dương Kinh', 31, NULL, NULL),
(352, 'Quận Hải An', 31, NULL, NULL),
(353, 'Quận Hồng Bàng', 31, NULL, NULL),
(354, 'Quận Kiến An', 31, NULL, NULL),
(355, 'Quận Lê Chân', 31, NULL, NULL),
(356, 'Quận Ngô Quyền', 31, NULL, NULL),
(357, 'Huyện An Dương', 31, NULL, NULL),
(358, 'Huyện An Lão', 31, NULL, NULL),
(359, 'Huyện Bạch Long Vĩ', 31, NULL, NULL),
(360, 'Huyện Cát Hải', 31, NULL, NULL),
(361, 'Huyện Kiến Thụy', 31, NULL, NULL),
(362, 'Huyện Thủy Nguyên', 31, NULL, NULL),
(363, 'Huyện Tiên Lãng', 31, NULL, NULL),
(364, 'Huyện Vĩnh Bảo', 31, NULL, NULL),
(365, 'Thành phố Vị Thanh', 32, NULL, NULL),
(366, 'Thành phố Ngã Bảy', 32, NULL, NULL),
(367, 'Thị xã Long Mỹ', 32, NULL, NULL),
(368, 'Huyện Châu Thành', 32, NULL, NULL),
(369, 'Huyện Châu Thành A', 32, NULL, NULL),
(370, 'Huyện Long Mỹ', 32, NULL, NULL),
(371, 'Huyện Phụng Hiệp', 32, NULL, NULL),
(372, 'Huyện Vị Thủy', 32, NULL, NULL),
(373, 'Thành phố Hòa Bình', 33, NULL, NULL),
(374, 'Huyện Cao Phong', 33, NULL, NULL),
(375, 'Huyện Đà Bắc', 33, NULL, NULL),
(376, 'Huyện Kim Bôi', 33, NULL, NULL),
(377, 'Huyện Lạc Sơn', 33, NULL, NULL),
(378, 'Huyện Lạc Thủy', 33, NULL, NULL),
(379, 'Huyện Lương Sơn', 33, NULL, NULL),
(380, 'Huyện Mai Châu', 33, NULL, NULL),
(381, 'Huyện Tân Lạc', 33, NULL, NULL),
(382, 'Huyện Yên Thủy', 33, NULL, NULL),
(383, 'Thành phố Hưng Yên', 34, NULL, NULL),
(384, 'Thị xã Mỹ Hào', 34, NULL, NULL),
(385, 'Huyện Ân Thi', 34, NULL, NULL),
(386, 'Huyện Khoái Châu', 34, NULL, NULL),
(387, 'Huyện Kim Động', 34, NULL, NULL),
(388, 'Huyện Phù Cừ', 34, NULL, NULL),
(389, 'Huyện Tiên Lữ', 34, NULL, NULL),
(390, 'Huyện Văn Giang', 34, NULL, NULL),
(391, 'Huyện Văn Lâm', 34, NULL, NULL),
(392, 'Huyện Yên Mỹ', 34, NULL, NULL),
(393, 'Thành phố Nha Trang', 35, NULL, NULL),
(394, 'Thành phố Cam Ranh', 35, NULL, NULL),
(395, 'Thị xã Ninh Hòa', 35, NULL, NULL),
(396, 'Huyện Cam Lâm', 35, NULL, NULL),
(397, 'Huyện Diên Khánh', 35, NULL, NULL),
(398, 'Huyện Khánh Sơn', 35, NULL, NULL),
(399, 'Huyện Khánh Vĩnh', 35, NULL, NULL),
(400, 'Huyện Trường Sa', 35, NULL, NULL),
(401, 'Huyện Vạn Ninh', 35, NULL, NULL),
(402, 'Thành phố Rạch Giá', 36, NULL, NULL),
(403, 'Thành phố Hà Tiên', 36, NULL, NULL),
(404, 'Thành phố Phú Quốc', 36, NULL, NULL),
(405, 'Huyện An Biên', 36, NULL, NULL),
(406, 'Huyện An Minh', 36, NULL, NULL),
(407, 'Huyện Châu Thành', 36, NULL, NULL),
(408, 'Huyện Giang Thành', 36, NULL, NULL),
(409, 'Huyện Giồng Riềng', 36, NULL, NULL),
(410, 'Huyện Gò Quao', 36, NULL, NULL),
(411, 'Huyện Hòn Đất', 36, NULL, NULL),
(412, 'Huyện Kiên Hải', 36, NULL, NULL),
(413, 'Huyện Kiên Lương', 36, NULL, NULL),
(414, 'Huyện Tân Hiệp', 36, NULL, NULL),
(415, 'Huyện U Minh Thượng', 36, NULL, NULL),
(416, 'Huyện Vĩnh Thuận', 36, NULL, NULL),
(417, 'Thành phố Kon Tum', 37, NULL, NULL),
(418, 'Huyện Đắk Glei', 37, NULL, NULL),
(419, 'Huyện Đắk Hà', 37, NULL, NULL),
(420, 'Huyện Đắk Tô', 37, NULL, NULL),
(421, 'Huyện Ia H\'Drai', 37, NULL, NULL),
(422, 'Huyện Kon Plông', 37, NULL, NULL),
(423, 'Huyện Kon Rẫy', 37, NULL, NULL),
(424, 'Huyện Ngọc Hồi', 37, NULL, NULL),
(425, 'Huyện Sa Thầy', 37, NULL, NULL),
(426, 'Huyện Tu Mơ Rông', 37, NULL, NULL),
(427, 'Thành phố Lai Châu', 38, NULL, NULL),
(428, 'Huyện Mường Tè', 38, NULL, NULL),
(429, 'Huyện Nậm Nhùn', 38, NULL, NULL),
(430, 'Huyện Phong Thổ', 38, NULL, NULL),
(431, 'Huyện Sìn Hồ', 38, NULL, NULL),
(432, 'Huyện Tam Đường', 38, NULL, NULL),
(433, 'Huyện Tân Uyên', 38, NULL, NULL),
(434, 'Huyện Than Uyên', 38, NULL, NULL),
(435, 'Thành phố Đà Lạt', 39, NULL, NULL),
(436, 'Thành phố Bảo Lộc', 39, NULL, NULL),
(437, 'Huyện Bảo Lâm', 39, NULL, NULL),
(438, 'Huyện Cát Tiên', 39, NULL, NULL),
(439, 'Huyện Đạ Huoai', 39, NULL, NULL),
(440, 'Huyện Đạ Tẻh', 39, NULL, NULL),
(441, 'Huyện Đam Rông', 39, NULL, NULL),
(442, 'Huyện Di Linh', 39, NULL, NULL),
(443, 'Huyện Đơn Dương', 39, NULL, NULL),
(444, 'Huyện Đức Trọng', 39, NULL, NULL),
(445, 'Huyện Lạc Dương', 39, NULL, NULL),
(446, 'Huyện Lâm Hà', 39, NULL, NULL),
(447, 'Thành phố Lạng Sơn', 40, NULL, NULL),
(448, 'Huyện Bắc Sơn', 40, NULL, NULL),
(449, 'Huyện Bình Gia', 40, NULL, NULL),
(450, 'Huyện Cao Lộc', 40, NULL, NULL),
(451, 'Huyện Chi Lăng', 40, NULL, NULL),
(452, 'Huyện Đình Lập', 40, NULL, NULL),
(453, 'Huyện Hữu Lũng', 40, NULL, NULL),
(454, 'Huyện Lộc Bình', 40, NULL, NULL),
(455, 'Huyện Tràng Định', 40, NULL, NULL),
(456, 'Huyện Văn Lãng', 40, NULL, NULL),
(457, 'Huyện Văn Quan', 40, NULL, NULL),
(458, 'Thành phố Lào Cai', 41, NULL, NULL),
(459, 'Thị xã Sa Pa', 41, NULL, NULL),
(460, 'Huyện Bắc Hà', 41, NULL, NULL),
(461, 'Huyện Bảo Thắng', 41, NULL, NULL),
(462, 'Huyện Bảo Yên', 41, NULL, NULL),
(463, 'Huyện Bát Xát', 41, NULL, NULL),
(464, 'Huyện Mường Khương', 41, NULL, NULL),
(465, 'Huyện Si Ma Cai', 41, NULL, NULL),
(466, 'Huyện Văn Bàn', 41, NULL, NULL),
(467, 'Thành phố Tân An', 42, NULL, NULL),
(468, 'Thị xã Kiến Tường', 42, NULL, NULL),
(469, 'Huyện Bến Lức', 42, NULL, NULL),
(470, 'Huyện Cần Đước', 42, NULL, NULL),
(471, 'Huyện Cần Giuộc', 42, NULL, NULL),
(472, 'Huyện Châu Thành', 42, NULL, NULL),
(473, 'Huyện Đức Hòa', 42, NULL, NULL),
(474, 'Huyện Đức Huệ', 42, NULL, NULL),
(475, 'Huyện Mộc Hóa', 42, NULL, NULL),
(476, 'Huyện Tân Hưng', 42, NULL, NULL),
(477, 'Huyện Tân Thạnh', 42, NULL, NULL),
(478, 'Huyện Tân Trụ', 42, NULL, NULL),
(479, 'Huyện Thạnh Hóa', 42, NULL, NULL),
(480, 'Huyện Thủ Thừa', 42, NULL, NULL),
(481, 'Huyện Vĩnh Hưng', 42, NULL, NULL),
(482, 'Thành phố Nam Định', 43, NULL, NULL),
(483, 'Huyện Giao Thủy', 43, NULL, NULL),
(484, 'Huyện Hải Hậu', 43, NULL, NULL),
(485, 'Huyện Mỹ Lộc', 43, NULL, NULL),
(486, 'Huyện Nam Trực', 43, NULL, NULL),
(487, 'Huyện Nghĩa Hưng', 43, NULL, NULL),
(488, 'Huyện Trực Ninh', 43, NULL, NULL),
(489, 'Huyện Vụ Bản', 43, NULL, NULL),
(490, 'Huyện Xuân Trường', 43, NULL, NULL),
(491, 'Huyện Ý Yên', 43, NULL, NULL),
(492, 'Thành phố Vinh', 44, NULL, NULL),
(493, 'Thị xã Cửa Lò', 44, NULL, NULL),
(494, 'Thị xã Hoàng Mai', 44, NULL, NULL),
(495, 'Thị xã Thái Hòa', 44, NULL, NULL),
(496, 'Huyện Anh Sơn', 44, NULL, NULL),
(497, 'Huyện Con Cuông', 44, NULL, NULL),
(498, 'Huyện Diễn Châu', 44, NULL, NULL),
(499, 'Huyện Đô Lương', 44, NULL, NULL),
(500, 'Huyện Hưng Nguyên', 44, NULL, NULL),
(501, 'Huyện Kỳ Sơn', 44, NULL, NULL),
(502, 'Huyện Nam Đàn', 44, NULL, NULL),
(503, 'Huyện Nghi Lộc', 44, NULL, NULL),
(504, 'Huyện Nghĩa Đàn', 44, NULL, NULL),
(505, 'Huyện Quế Phong', 44, NULL, NULL),
(506, 'Huyện Quỳ Châu', 44, NULL, NULL),
(507, 'Huyện Quỳ Hợp', 44, NULL, NULL),
(508, 'Huyện Quỳnh Lưu', 44, NULL, NULL),
(509, 'Huyện Tân Kỳ', 44, NULL, NULL),
(510, 'Huyện Thanh Chương', 44, NULL, NULL),
(511, 'Huyện Tương Dương', 44, NULL, NULL),
(512, 'Huyện Yên Thành', 44, NULL, NULL),
(513, 'Thành phố Ninh Bình', 45, NULL, NULL),
(514, 'Thành phố Tam Điệp', 45, NULL, NULL),
(515, 'Huyện Gia Viễn', 45, NULL, NULL),
(516, 'Huyện Hoa Lư', 45, NULL, NULL),
(517, 'Huyện Kim Sơn', 45, NULL, NULL),
(518, 'Huyện Nho Quan', 45, NULL, NULL),
(519, 'Huyện Yên Khánh', 45, NULL, NULL),
(520, 'Huyện Yên Mô', 45, NULL, NULL),
(521, 'Thành phố Phan Rang-Tháp Chàm', 46, NULL, NULL),
(522, 'Huyện Bác Ái', 46, NULL, NULL),
(523, 'Huyện Ninh Hải', 46, NULL, NULL),
(524, 'Huyện Ninh Phước', 46, NULL, NULL),
(525, 'Huyện Ninh Sơn', 46, NULL, NULL),
(526, 'Huyện Thuận Bắc', 46, NULL, NULL),
(527, 'Huyện Thuận Nam', 46, NULL, NULL),
(528, 'Thành phố Việt Trì', 47, NULL, NULL),
(529, 'Thị xã Phú Thọ', 47, NULL, NULL),
(530, 'Huyện Cẩm Khê', 47, NULL, NULL),
(531, 'Huyện Đoan Hùng', 47, NULL, NULL),
(532, 'Huyện Hạ Hòa', 47, NULL, NULL),
(533, 'Huyện Lâm Thao', 47, NULL, NULL),
(534, 'Huyện Phù Ninh', 47, NULL, NULL),
(535, 'Huyện Tam Nông', 47, NULL, NULL),
(536, 'Huyện Tân Sơn', 47, NULL, NULL),
(537, 'Huyện Thanh Ba', 47, NULL, NULL),
(538, 'Huyện Thanh Sơn', 47, NULL, NULL),
(539, 'Huyện Thanh Thủy', 47, NULL, NULL),
(540, 'Huyện Yên Lập', 47, NULL, NULL),
(541, 'Thành phố Tuy Hòa', 48, NULL, NULL),
(542, 'Thị xã Đông Hòa', 48, NULL, NULL),
(543, 'Thị xã Sông Cầu', 48, NULL, NULL),
(544, 'Huyện Đồng Xuân', 48, NULL, NULL),
(545, 'Huyện Phú Hòa', 48, NULL, NULL),
(546, 'Huyện Sơn Hòa', 48, NULL, NULL),
(547, 'Huyện Sông Hinh', 48, NULL, NULL),
(548, 'Huyện Tây Hòa', 48, NULL, NULL),
(549, 'Huyện Tuy An', 48, NULL, NULL),
(550, 'Thành phố Đồng Hới', 49, NULL, NULL),
(551, 'Thị xã Ba Đồn', 49, NULL, NULL),
(552, 'Huyện Bố Trạch', 49, NULL, NULL),
(553, 'Huyện Lệ Thủy', 49, NULL, NULL),
(554, 'Huyện Minh Hóa', 49, NULL, NULL),
(555, 'Huyện Quảng Ninh', 49, NULL, NULL),
(556, 'Huyện Quảng Trạch', 49, NULL, NULL),
(557, 'Huyện Tuyên Hóa', 49, NULL, NULL),
(558, 'Thành phố Tam Kỳ', 50, NULL, NULL),
(559, 'Thành phố Hội An', 50, NULL, NULL),
(560, 'Thị xã Điện Bàn', 50, NULL, NULL),
(561, 'Huyện Bắc Trà My', 50, NULL, NULL),
(562, 'Huyện Duy Xuyên', 50, NULL, NULL),
(563, 'Huyện Đại Lộc', 50, NULL, NULL),
(564, 'Huyện Đông Giang', 50, NULL, NULL),
(565, 'Huyện Hiệp Đức', 50, NULL, NULL),
(566, 'Huyện Nam Giang', 50, NULL, NULL),
(567, 'Huyện Nam Trà My', 50, NULL, NULL),
(568, 'Huyện Nông Sơn', 50, NULL, NULL),
(569, 'Huyện Núi Thành', 50, NULL, NULL),
(570, 'Huyện Phú Ninh', 50, NULL, NULL),
(571, 'Huyện Phước Sơn', 50, NULL, NULL),
(572, 'Huyện Quế Sơn', 50, NULL, NULL),
(573, 'Huyện Tây Giang', 50, NULL, NULL),
(574, 'Huyện Thăng Bình', 50, NULL, NULL),
(575, 'Huyện Tiên Phước', 50, NULL, NULL),
(576, 'Thành phố Quảng Ngãi', 51, NULL, NULL),
(577, 'Thị xã Đức Phổ', 51, NULL, NULL),
(578, 'Huyện Ba Tơ', 51, NULL, NULL),
(579, 'Huyện Bình Sơn', 51, NULL, NULL),
(580, 'Huyện Lý Sơn', 51, NULL, NULL),
(581, 'Huyện Minh Long', 51, NULL, NULL),
(582, 'Huyện Mộ Đức', 51, NULL, NULL),
(583, 'Huyện Nghĩa Hành', 51, NULL, NULL),
(584, 'Huyện Sơn Hà', 51, NULL, NULL),
(585, 'Huyện Sơn Tây', 51, NULL, NULL),
(586, 'Huyện Sơn Tịnh', 51, NULL, NULL),
(587, 'Huyện Trà Bồng', 51, NULL, NULL),
(588, 'Huyện Tư Nghĩa', 51, NULL, NULL),
(589, 'Thành phố Hạ Long', 52, NULL, NULL),
(590, 'Thành phố Móng Cái', 52, NULL, NULL),
(591, 'Thành phố Cẩm Phả', 52, NULL, NULL),
(592, 'Thành phố Uông Bí', 52, NULL, NULL),
(593, 'Thị xã Quảng Yên', 52, NULL, NULL),
(594, 'Thị xã Đông Triều', 52, NULL, NULL),
(595, 'Huyện Ba Chẽ', 52, NULL, NULL),
(596, 'Huyện Bình Liêu', 52, NULL, NULL),
(597, 'Huyện Cô Tô', 52, NULL, NULL),
(598, 'Huyện Đầm Hà', 52, NULL, NULL),
(599, 'Huyện Hải Hà', 52, NULL, NULL),
(600, 'Huyện Tiên Yên', 52, NULL, NULL),
(601, 'Huyện Vân Đồn', 52, NULL, NULL),
(602, 'Thành phố Đông Hà', 53, NULL, NULL),
(603, 'Thị xã Quảng Trị', 53, NULL, NULL),
(604, 'Huyện Cam Lộ', 53, NULL, NULL),
(605, 'Huyện Cồn Cỏ', 53, NULL, NULL),
(606, 'Huyện Đa Krông', 53, NULL, NULL),
(607, 'Huyện Gio Linh', 53, NULL, NULL),
(608, 'Huyện Hải Lăng', 53, NULL, NULL),
(609, 'Huyện Hướng Hóa', 53, NULL, NULL),
(610, 'Huyện Triệu Phong', 53, NULL, NULL),
(611, 'Huyện Vĩnh Linh', 53, NULL, NULL),
(612, 'Thành phố Sóc Trăng', 54, NULL, NULL),
(613, 'Thị xã Vĩnh Châu', 54, NULL, NULL),
(614, 'Thị xã Ngã Năm', 54, NULL, NULL),
(615, 'Huyện Châu Thành', 54, NULL, NULL),
(616, 'Huyện Cù Lao Dung', 54, NULL, NULL),
(617, 'Huyện Kế Sách', 54, NULL, NULL),
(618, 'Huyện Long Phú', 54, NULL, NULL),
(619, 'Huyện Mỹ Tú', 54, NULL, NULL),
(620, 'Huyện Mỹ Xuyên', 54, NULL, NULL),
(621, 'Huyện Thạnh Trị', 54, NULL, NULL),
(622, 'Huyện Trần Đề', 54, NULL, NULL),
(623, 'Thành phố Sơn La', 55, NULL, NULL),
(624, 'Huyện Bắc Yên', 55, NULL, NULL),
(625, 'Huyện Mai Sơn', 55, NULL, NULL),
(626, 'Huyện Mộc Châu', 55, NULL, NULL),
(627, 'Huyện Mường La', 55, NULL, NULL),
(628, 'Huyện Phù Yên', 55, NULL, NULL),
(629, 'Huyện Quỳnh Nhai', 55, NULL, NULL),
(630, 'Huyện Sông Mã', 55, NULL, NULL),
(631, 'Huyện Sốp Cộp', 55, NULL, NULL),
(632, 'Huyện Thuận Châu', 55, NULL, NULL),
(633, 'Huyện Vân Hồ', 55, NULL, NULL),
(634, 'Huyện Yên Châu', 55, NULL, NULL),
(635, 'Thành phố Tây Ninh', 56, NULL, NULL),
(636, 'Thị xã Hòa Thành', 56, NULL, NULL),
(637, 'Thị xã Trảng Bàng', 56, NULL, NULL),
(638, 'Huyện Bến Cầu', 56, NULL, NULL),
(639, 'Huyện Châu Thành', 56, NULL, NULL),
(640, 'Huyện Dương Minh Châu', 56, NULL, NULL),
(641, 'Huyện Gò Dầu', 56, NULL, NULL),
(642, 'Huyện Tân Biên', 56, NULL, NULL),
(643, 'Huyện Tân Châu', 56, NULL, NULL),
(644, 'Thành phố Thái Bình', 57, NULL, NULL),
(645, 'Huyện Đông Hưng', 57, NULL, NULL),
(646, 'Huyện Hưng Hà', 57, NULL, NULL),
(647, 'Huyện Kiến Xương', 57, NULL, NULL),
(648, 'Huyện Quỳnh Phụ', 57, NULL, NULL),
(649, 'Huyện Thái Thụy', 57, NULL, NULL),
(650, 'Huyện Tiền Hải', 57, NULL, NULL),
(651, 'Huyện Vũ Thư', 57, NULL, NULL),
(652, 'Thành phố Thái Nguyên', 58, NULL, NULL),
(653, 'Thành phố Sông Công', 58, NULL, NULL),
(654, 'Thị xã Phổ Yên', 58, NULL, NULL),
(655, 'Huyện Đại Từ', 58, NULL, NULL),
(656, 'Huyện Định Hóa', 58, NULL, NULL),
(657, 'Huyện Đồng Hỷ', 58, NULL, NULL),
(658, 'Huyện Phú Bình', 58, NULL, NULL),
(659, 'Huyện Phú Lương', 58, NULL, NULL),
(660, 'Huyện Võ Nhai', 58, NULL, NULL),
(661, 'Thành phố Thanh Hóa', 59, NULL, NULL),
(662, 'Thành phố Sầm Sơn', 59, NULL, NULL),
(663, 'Thị xã Bỉm Sơn', 59, NULL, NULL),
(664, 'Thị xã Nghi Sơn', 59, NULL, NULL),
(665, 'Huyện Bá Thước', 59, NULL, NULL),
(666, 'Huyện Cẩm Thủy', 59, NULL, NULL),
(667, 'Huyện Đông Sơn', 59, NULL, NULL),
(668, 'Huyện Hà Trung', 59, NULL, NULL),
(669, 'Huyện Hậu Lộc', 59, NULL, NULL),
(670, 'Huyện Hoằng Hóa', 59, NULL, NULL),
(671, 'Huyện Lang Chánh', 59, NULL, NULL),
(672, 'Huyện Mường Lát', 59, NULL, NULL),
(673, 'Huyện Nga Sơn', 59, NULL, NULL),
(674, 'Huyện Ngọc Lặc', 59, NULL, NULL),
(675, 'Huyện Như Thanh', 59, NULL, NULL),
(676, 'Huyện Như Xuân', 59, NULL, NULL),
(677, 'Huyện Nông Cống', 59, NULL, NULL),
(678, 'Huyện Quan Hóa', 59, NULL, NULL),
(679, 'Huyện Quan Sơn', 59, NULL, NULL),
(680, 'Huyện Quảng Xương', 59, NULL, NULL),
(681, 'Huyện Thạch Thành', 59, NULL, NULL),
(682, 'Huyện Thiệu Hóa', 59, NULL, NULL),
(683, 'Huyện Thọ Xuân', 59, NULL, NULL),
(684, 'Huyện Thường Xuân', 59, NULL, NULL),
(685, 'Huyện Triệu Sơn', 59, NULL, NULL),
(686, 'Huyện Vĩnh Lộc', 59, NULL, NULL),
(687, 'Huyện Yên Định', 59, NULL, NULL),
(688, 'Thành phố Huế', 60, NULL, NULL),
(689, 'Thị xã Hương Thủy', 60, NULL, NULL),
(690, 'Thị xã Hương Trà', 60, NULL, NULL),
(691, 'Huyện A Lưới', 60, NULL, NULL),
(692, 'Huyện Nam Đông', 60, NULL, NULL),
(693, 'Huyện Phong Điền', 60, NULL, NULL),
(694, 'Huyện Phú Lộc', 60, NULL, NULL),
(695, 'Huyện Phú Vang', 60, NULL, NULL),
(696, 'Huyện Quảng Điền', 60, NULL, NULL),
(697, 'Thành phố Mỹ Tho', 61, NULL, NULL),
(698, 'Thị xã Cai Lậy', 61, NULL, NULL),
(699, 'Thị xã Gò Công', 61, NULL, NULL),
(700, 'Huyện Cái Bè', 61, NULL, NULL),
(701, 'Huyện Cai Lậy', 61, NULL, NULL),
(702, 'Huyện Châu Thành', 61, NULL, NULL),
(703, 'Huyện Chợ Gạo', 61, NULL, NULL),
(704, 'Huyện Gò Công Đông', 61, NULL, NULL),
(705, 'Huyện Gò Công Tây', 61, NULL, NULL),
(706, 'Huyện Tân Phước', 61, NULL, NULL),
(707, 'Huyện Tân Phú Đông', 61, NULL, NULL),
(708, 'Quận 1', 62, NULL, NULL),
(709, 'Quận 3', 62, NULL, NULL),
(710, 'Quận 4', 62, NULL, NULL),
(711, 'Quận 5', 62, NULL, NULL),
(712, 'Quận 6', 62, NULL, NULL),
(713, 'Quận 7', 62, NULL, NULL),
(714, 'Quận 8', 62, NULL, NULL),
(715, 'Quận 10', 62, NULL, NULL),
(716, 'Quận 11', 62, NULL, NULL),
(717, 'Quận 12', 62, NULL, NULL),
(718, 'Quận Bình Thạnh', 62, NULL, NULL),
(719, 'Quận Bình Tân', 62, NULL, NULL),
(720, 'Quận Gò Vấp', 62, NULL, NULL),
(721, 'Quận Phú Nhuận', 62, NULL, NULL),
(722, 'Quận Tân Bình', 62, NULL, NULL),
(723, 'Quận Tân Phú', 62, NULL, NULL),
(724, 'Thành phố Thủ Đức', 62, NULL, NULL),
(725, 'Huyện Bình Chánh', 62, NULL, NULL),
(726, 'Huyện Cần Giờ', 62, NULL, NULL),
(727, 'Huyện Củ Chi', 62, NULL, NULL),
(728, 'Huyện Hóc Môn', 62, NULL, NULL),
(729, 'Huyện Nhà Bè', 62, NULL, NULL),
(730, 'Thành phố Trà Vinh', 63, NULL, NULL),
(731, 'Thị xã Duyên Hải', 63, NULL, NULL),
(732, 'Huyện Càng Long', 63, NULL, NULL),
(733, 'Huyện Cầu Kè', 63, NULL, NULL),
(734, 'Huyện Cầu Ngang', 63, NULL, NULL),
(735, 'Huyện Châu Thành', 63, NULL, NULL),
(736, 'Huyện Duyên Hải', 63, NULL, NULL),
(737, 'Huyện Tiểu Cần', 63, NULL, NULL),
(738, 'Huyện Trà Cú', 63, NULL, NULL),
(739, 'Thành phố Tuyên Quang', 64, NULL, NULL),
(740, 'Huyện Chiêm Hóa', 64, NULL, NULL),
(741, 'Huyện Hàm Yên', 64, NULL, NULL),
(742, 'Huyện Lâm Bình', 64, NULL, NULL),
(743, 'Huyện Na Hang', 64, NULL, NULL),
(744, 'Huyện Sơn Dương', 64, NULL, NULL),
(745, 'Huyện Yên Sơn', 64, NULL, NULL),
(746, 'Thành phố Vĩnh Long', 65, NULL, NULL),
(747, 'Thị xã Bình Minh', 65, NULL, NULL),
(748, 'Huyện Bình Tân', 65, NULL, NULL),
(749, 'Huyện Long Hồ', 65, NULL, NULL),
(750, 'Huyện Mang Thít', 65, NULL, NULL),
(751, 'Huyện Tam Bình', 65, NULL, NULL),
(752, 'Huyện Trà Ôn', 65, NULL, NULL),
(753, 'Huyện Vũng Liêm', 65, NULL, NULL),
(754, 'Thành phố Vĩnh Yên', 66, NULL, NULL),
(755, 'Thành phố Phúc Yên', 66, NULL, NULL),
(756, 'Huyện Bình Xuyên', 66, NULL, NULL),
(757, 'Huyện Lập Thạch', 66, NULL, NULL),
(758, 'Huyện Sông Lô', 66, NULL, NULL),
(759, 'Huyện Tam Đảo', 66, NULL, NULL),
(760, 'Huyện Tam Dương', 66, NULL, NULL),
(761, 'Huyện Vĩnh Tường', 66, NULL, NULL),
(762, 'Huyện Yên Lạc', 66, NULL, NULL),
(763, 'Thành phố Yên Bái', 67, NULL, NULL),
(764, 'Thị xã Nghĩa Lộ', 67, NULL, NULL),
(765, 'Huyện Lục Yên', 67, NULL, NULL),
(766, 'Huyện Mù Cang Chải', 67, NULL, NULL),
(767, 'Huyện Trạm Tấu', 67, NULL, NULL),
(768, 'Huyện Trấn Yên', 67, NULL, NULL),
(769, 'Huyện Văn Chấn', 67, NULL, NULL),
(770, 'Huyện Văn Yên', 67, NULL, NULL),
(771, 'Huyện Yên Bình', 67, NULL, NULL),
(772, 'Phường Bến Nghé', 708, NULL, NULL),
(773, 'Phường Bến Thành', 708, NULL, NULL),
(774, 'Phường Cầu Kho', 708, NULL, NULL),
(775, 'Phường Cầu Ông Lãnh', 708, NULL, NULL),
(776, 'Phường Cô Giang', 708, NULL, NULL),
(777, 'Phường Đa Kao', 708, NULL, NULL),
(778, 'Phường Nguyễn Cư Trinh', 708, NULL, NULL),
(779, 'Phường Nguyễn Thái Bình', 708, NULL, NULL),
(780, 'Phường Phạm Ngũ Lão', 708, NULL, NULL),
(781, 'Phường Tân Định', 708, NULL, NULL),
(782, 'Phường 01', 709, NULL, NULL),
(783, 'Phường 02', 709, NULL, NULL),
(784, 'Phường 03', 709, NULL, NULL),
(785, 'Phường 04', 709, NULL, NULL),
(786, 'Phường 05', 709, NULL, NULL),
(787, 'Phường Võ Thị Sáu', 709, NULL, NULL),
(788, 'Phường 09', 709, NULL, NULL),
(789, 'Phường 10', 709, NULL, NULL),
(790, 'Phường 11', 709, NULL, NULL),
(791, 'Phường 12', 709, NULL, NULL),
(792, 'Phường 13', 709, NULL, NULL),
(793, 'Phường 14', 709, NULL, NULL),
(794, 'Phường 01', 710, NULL, NULL),
(795, 'Phường 02', 710, NULL, NULL),
(796, 'Phường 03', 710, NULL, NULL),
(797, 'Phường 04', 710, NULL, NULL),
(798, 'Phường 06', 710, NULL, NULL),
(799, 'Phường 08', 710, NULL, NULL),
(800, 'Phường 09', 710, NULL, NULL),
(801, 'Phường 10', 710, NULL, NULL),
(802, 'Phường 13', 710, NULL, NULL),
(803, 'Phường 14', 710, NULL, NULL),
(804, 'Phường 15', 710, NULL, NULL),
(805, 'Phường 16', 710, NULL, NULL),
(806, 'Phường 18', 710, NULL, NULL),
(807, 'Phường 01', 711, NULL, NULL),
(808, 'Phường 02', 711, NULL, NULL),
(809, 'Phường 03', 711, NULL, NULL),
(810, 'Phường 04', 711, NULL, NULL),
(811, 'Phường 05', 711, NULL, NULL),
(812, 'Phường 06', 711, NULL, NULL),
(813, 'Phường 07', 711, NULL, NULL),
(814, 'Phường 08', 711, NULL, NULL),
(815, 'Phường 09', 711, NULL, NULL),
(816, 'Phường 10', 711, NULL, NULL),
(817, 'Phường 11', 711, NULL, NULL),
(818, 'Phường 12', 711, NULL, NULL),
(819, 'Phường 13', 711, NULL, NULL),
(820, 'Phường 14', 711, NULL, NULL),
(821, 'Phường 01', 712, NULL, NULL),
(822, 'Phường 02', 712, NULL, NULL),
(823, 'Phường 03', 712, NULL, NULL),
(824, 'Phường 04', 712, NULL, NULL),
(825, 'Phường 05', 712, NULL, NULL),
(826, 'Phường 06', 712, NULL, NULL),
(827, 'Phường 07', 712, NULL, NULL),
(828, 'Phường 08', 712, NULL, NULL),
(829, 'Phường 09', 712, NULL, NULL),
(830, 'Phường 10', 712, NULL, NULL),
(831, 'Phường 11', 712, NULL, NULL),
(832, 'Phường 12', 712, NULL, NULL),
(833, 'Phường 13', 712, NULL, NULL),
(834, 'Phường 14', 712, NULL, NULL),
(835, 'Phường Bình Thuận', 713, NULL, NULL),
(836, 'Phường Phú Mỹ', 713, NULL, NULL),
(837, 'Phường Phú Thuận', 713, NULL, NULL),
(838, 'Phường Tân Hưng', 713, NULL, NULL),
(839, 'Phường Tân Kiểng', 713, NULL, NULL),
(840, 'Phường Tân Phong', 713, NULL, NULL),
(841, 'Phường Tân Phú', 713, NULL, NULL),
(842, 'Phường Tân Quy', 713, NULL, NULL),
(843, 'Phường Tân Thuận Đông', 713, NULL, NULL),
(844, 'Phường Tân Thuận Tây', 713, NULL, NULL),
(845, 'Phường 01', 714, NULL, NULL),
(846, 'Phường 02', 714, NULL, NULL),
(847, 'Phường 03', 714, NULL, NULL),
(848, 'Phường 04', 714, NULL, NULL),
(849, 'Phường 05', 714, NULL, NULL),
(850, 'Phường 06', 714, NULL, NULL),
(851, 'Phường 07', 714, NULL, NULL),
(852, 'Phường 08', 714, NULL, NULL),
(853, 'Phường 09', 714, NULL, NULL),
(854, 'Phường 10', 714, NULL, NULL),
(855, 'Phường 11', 714, NULL, NULL),
(856, 'Phường 12', 714, NULL, NULL),
(857, 'Phường 13', 714, NULL, NULL),
(858, 'Phường 14', 714, NULL, NULL),
(859, 'Phường 15', 714, NULL, NULL),
(860, 'Phường 16', 714, NULL, NULL),
(861, 'Phường 01', 715, NULL, NULL),
(862, 'Phường 02', 715, NULL, NULL),
(863, 'Phường 04', 715, NULL, NULL),
(864, 'Phường 05', 715, NULL, NULL),
(865, 'Phường 06', 715, NULL, NULL),
(866, 'Phường 07', 715, NULL, NULL),
(867, 'Phường 08', 715, NULL, NULL),
(868, 'Phường 09', 715, NULL, NULL),
(869, 'Phường 10', 715, NULL, NULL),
(870, 'Phường 11', 715, NULL, NULL),
(871, 'Phường 12', 715, NULL, NULL),
(872, 'Phường 13', 715, NULL, NULL),
(873, 'Phường 14', 715, NULL, NULL),
(874, 'Phường 15', 715, NULL, NULL),
(875, 'Phường 01', 716, NULL, NULL),
(876, 'Phường 02', 716, NULL, NULL),
(877, 'Phường 03', 716, NULL, NULL),
(878, 'Phường 04', 716, NULL, NULL),
(879, 'Phường 05', 716, NULL, NULL),
(880, 'Phường 06', 716, NULL, NULL),
(881, 'Phường 07', 716, NULL, NULL),
(882, 'Phường 08', 716, NULL, NULL),
(883, 'Phường 09', 716, NULL, NULL),
(884, 'Phường 10', 716, NULL, NULL),
(885, 'Phường 11', 716, NULL, NULL),
(886, 'Phường 12', 716, NULL, NULL),
(887, 'Phường 13', 716, NULL, NULL),
(888, 'Phường 14', 716, NULL, NULL),
(889, 'Phường 15', 716, NULL, NULL),
(890, 'Phường 16', 716, NULL, NULL),
(891, 'Phường An Phú Đông', 717, NULL, NULL),
(892, 'Phường Đông Hưng Thuận', 717, NULL, NULL),
(893, 'Phường Hiệp Thành', 717, NULL, NULL),
(894, 'Phường Tân Chánh Hiệp', 717, NULL, NULL),
(895, 'Phường Tân Hưng Thuận', 717, NULL, NULL),
(896, 'Phường Tân Thới Hiệp', 717, NULL, NULL),
(897, 'Phường Tân Thới Nhất', 717, NULL, NULL),
(898, 'Phường Thạnh Lộc', 717, NULL, NULL),
(899, 'Phường Thạnh Xuân', 717, NULL, NULL),
(900, 'Phường Thới An', 717, NULL, NULL),
(901, 'Phường Trung Mỹ Tây', 717, NULL, NULL),
(902, 'Phường 01', 718, NULL, NULL),
(903, 'Phường 02', 718, NULL, NULL),
(904, 'Phường 03', 718, NULL, NULL),
(905, 'Phường 05', 718, NULL, NULL),
(906, 'Phường 06', 718, NULL, NULL),
(907, 'Phường 07', 718, NULL, NULL),
(908, 'Phường 11', 718, NULL, NULL),
(909, 'Phường 12', 718, NULL, NULL),
(910, 'Phường 13', 718, NULL, NULL),
(911, 'Phường 14', 718, NULL, NULL),
(912, 'Phường 15', 718, NULL, NULL),
(913, 'Phường 17', 718, NULL, NULL),
(914, 'Phường 19', 718, NULL, NULL),
(915, 'Phường 21', 718, NULL, NULL),
(916, 'Phường 22', 718, NULL, NULL),
(917, 'Phường 24', 718, NULL, NULL),
(918, 'Phường 25', 718, NULL, NULL),
(919, 'Phường 26', 718, NULL, NULL),
(920, 'Phường 27', 718, NULL, NULL),
(921, 'Phường 28', 718, NULL, NULL),
(922, 'Phường An Lạc', 719, NULL, NULL),
(923, 'Phường An Lạc A', 719, NULL, NULL),
(924, 'Phường Bình Hưng Hòa', 719, NULL, NULL),
(925, 'Phường Bình Hưng Hòa A', 719, NULL, NULL),
(926, 'Phường Bình Hưng Hòa B', 719, NULL, NULL),
(927, 'Phường Bình Trị Đông', 719, NULL, NULL),
(928, 'Phường Bình Trị Đông A', 719, NULL, NULL),
(929, 'Phường Bình Trị Đông B', 719, NULL, NULL),
(930, 'Phường Tân Tạo', 719, NULL, NULL),
(931, 'Phường Tân Tạo A', 719, NULL, NULL),
(932, 'Phường 01', 720, NULL, NULL),
(933, 'Phường 03', 720, NULL, NULL),
(934, 'Phường 04', 720, NULL, NULL),
(935, 'Phường 05', 720, NULL, NULL),
(936, 'Phường 06', 720, NULL, NULL),
(937, 'Phường 07', 720, NULL, NULL),
(938, 'Phường 08', 720, NULL, NULL),
(939, 'Phường 09', 720, NULL, NULL),
(940, 'Phường 10', 720, NULL, NULL),
(941, 'Phường 11', 720, NULL, NULL),
(942, 'Phường 12', 720, NULL, NULL),
(943, 'Phường 13', 720, NULL, NULL),
(944, 'Phường 14', 720, NULL, NULL),
(945, 'Phường 15', 720, NULL, NULL),
(946, 'Phường 16', 720, NULL, NULL),
(947, 'Phường 17', 720, NULL, NULL),
(948, 'Phường 01', 721, NULL, NULL),
(949, 'Phường 02', 721, NULL, NULL),
(950, 'Phường 03', 721, NULL, NULL),
(951, 'Phường 04', 721, NULL, NULL),
(952, 'Phường 05', 721, NULL, NULL),
(953, 'Phường 07', 721, NULL, NULL),
(954, 'Phường 08', 721, NULL, NULL),
(955, 'Phường 09', 721, NULL, NULL),
(956, 'Phường 10', 721, NULL, NULL),
(957, 'Phường 11', 721, NULL, NULL),
(958, 'Phường 12', 721, NULL, NULL),
(959, 'Phường 13', 721, NULL, NULL),
(960, 'Phường 14', 721, NULL, NULL),
(961, 'Phường 15', 721, NULL, NULL),
(962, 'Phường 17', 721, NULL, NULL),
(963, 'Phường 01', 722, NULL, NULL),
(964, 'Phường 02', 722, NULL, NULL),
(965, 'Phường 03', 722, NULL, NULL),
(966, 'Phường 04', 722, NULL, NULL),
(967, 'Phường 05', 722, NULL, NULL),
(968, 'Phường 06', 722, NULL, NULL),
(969, 'Phường 07', 722, NULL, NULL),
(970, 'Phường 08', 722, NULL, NULL),
(971, 'Phường 09', 722, NULL, NULL),
(972, 'Phường 10', 722, NULL, NULL),
(973, 'Phường 11', 722, NULL, NULL),
(974, 'Phường 12', 722, NULL, NULL),
(975, 'Phường 13', 722, NULL, NULL),
(976, 'Phường 14', 722, NULL, NULL),
(977, 'Phường 15', 722, NULL, NULL),
(978, 'Phường Hiệp Tân', 723, NULL, NULL),
(979, 'Phường Hòa Thạnh', 723, NULL, NULL),
(980, 'Phường Phú Thạnh', 723, NULL, NULL),
(981, 'Phường Phú Thọ Hòa', 723, NULL, NULL),
(982, 'Phường Phú Trung', 723, NULL, NULL),
(983, 'Phường Sơn Kỳ', 723, NULL, NULL),
(984, 'Phường Tân Quý', 723, NULL, NULL),
(985, 'Phường Tân Sơn Nhì', 723, NULL, NULL),
(986, 'Phường Tân Thành', 723, NULL, NULL),
(987, 'Phường Tân Thới Hòa', 723, NULL, NULL),
(988, 'Phường Tây Thạnh', 723, NULL, NULL),
(989, 'Phường An Khánh', 724, NULL, NULL),
(990, 'Phường An Lợi Đông', 724, NULL, NULL),
(991, 'Phường An Phú', 724, NULL, NULL),
(992, 'Phường Bình Chiểu', 724, NULL, NULL),
(993, 'Phường Bình Thọ', 724, NULL, NULL),
(994, 'Phường Bình Trưng Đông', 724, NULL, NULL),
(995, 'Phường Bình Trưng Tây', 724, NULL, NULL),
(996, 'Phường Cát Lái', 724, NULL, NULL),
(997, 'Phường Hiệp Bình Chánh', 724, NULL, NULL),
(998, 'Phường Hiệp Bình Phước', 724, NULL, NULL),
(999, 'Phường Hiệp Phú', 724, NULL, NULL),
(1000, 'Phường Linh Chiểu', 724, NULL, NULL),
(1001, 'Phường Linh Đông', 724, NULL, NULL),
(1002, 'Phường Linh Tây', 724, NULL, NULL),
(1003, 'Phường Linh Trung', 724, NULL, NULL),
(1004, 'Phường Linh Xuân', 724, NULL, NULL),
(1005, 'Phường Long Bình', 724, NULL, NULL),
(1006, 'Phường Long Phước', 724, NULL, NULL),
(1007, 'Phường Long Thạnh Mỹ', 724, NULL, NULL),
(1008, 'Phường Long Trường', 724, NULL, NULL),
(1009, 'Phường Phú Hữu', 724, NULL, NULL),
(1010, 'Phường Phước Bình', 724, NULL, NULL),
(1011, 'Phường Phước Long A', 724, NULL, NULL),
(1012, 'Phường Phước Long B', 724, NULL, NULL),
(1013, 'Phường Tam Bình', 724, NULL, NULL),
(1014, 'Phường Tam Phú', 724, NULL, NULL),
(1015, 'Phường Tân Phú', 724, NULL, NULL),
(1016, 'Phường Tăng Nhơn Phú A', 724, NULL, NULL),
(1017, 'Phường Tăng Nhơn Phú B', 724, NULL, NULL),
(1018, 'Phường Thạnh Mỹ Lợi', 724, NULL, NULL),
(1019, 'Phường Thảo Điền', 724, NULL, NULL),
(1020, 'Phường Thủ Thiêm', 724, NULL, NULL),
(1021, 'Phường Trường Thạnh', 724, NULL, NULL),
(1022, 'Phường Trường Thọ', 724, NULL, NULL),
(1023, 'Thị trấn Tân Túc', 725, NULL, NULL),
(1024, 'Xã An Phú Tây', 725, NULL, NULL),
(1025, 'Xã Bình Chánh', 725, NULL, NULL),
(1026, 'Xã Bình Hưng', 725, NULL, NULL),
(1027, 'Xã Bình Lợi', 725, NULL, NULL),
(1028, 'Xã Đa Phước', 725, NULL, NULL),
(1029, 'Xã Hưng Long', 725, NULL, NULL),
(1030, 'Xã Lê Minh Xuân', 725, NULL, NULL),
(1031, 'Xã Phạm Văn Hai', 725, NULL, NULL),
(1032, 'Xã Phong Phú', 725, NULL, NULL),
(1033, 'Xã Quy Đức', 725, NULL, NULL),
(1034, 'Xã Tân Kiên', 725, NULL, NULL),
(1035, 'Xã Tân Nhựt', 725, NULL, NULL),
(1036, 'Xã Tân Quý Tây', 725, NULL, NULL),
(1037, 'Xã Vĩnh Lộc A', 725, NULL, NULL),
(1038, 'Xã Vĩnh Lộc B', 725, NULL, NULL),
(1039, 'Thị trấn Cần Thạnh', 726, NULL, NULL),
(1040, 'Xã An Thới Đông', 726, NULL, NULL),
(1041, 'Xã Bình Khánh', 726, NULL, NULL),
(1042, 'Xã Long Hòa', 726, NULL, NULL),
(1043, 'Xã Lý Nhơn', 726, NULL, NULL),
(1044, 'Xã Tam Thôn Hiệp', 726, NULL, NULL),
(1045, 'Xã Thạnh An', 726, NULL, NULL),
(1046, 'Thị trấn Củ Chi', 727, NULL, NULL),
(1047, 'Xã An Nhơn Tây', 727, NULL, NULL),
(1048, 'Xã An Phú', 727, NULL, NULL),
(1049, 'Xã Bình Mỹ', 727, NULL, NULL),
(1050, 'Xã Hòa Phú', 727, NULL, NULL),
(1051, 'Xã Nhuận Đức', 727, NULL, NULL),
(1052, 'Xã Phạm Văn Cội', 727, NULL, NULL),
(1053, 'Xã Phú Hòa Đông', 727, NULL, NULL),
(1054, 'Xã Phú Mỹ Hưng', 727, NULL, NULL),
(1055, 'Xã Phước Hiệp', 727, NULL, NULL),
(1056, 'Xã Phước Thạnh', 727, NULL, NULL),
(1057, 'Xã Phước Vĩnh An', 727, NULL, NULL),
(1058, 'Xã Tân An Hội', 727, NULL, NULL),
(1059, 'Xã Tân Phú Trung', 727, NULL, NULL),
(1060, 'Xã Tân Thạnh Đông', 727, NULL, NULL),
(1061, 'Xã Tân Thạnh Tây', 727, NULL, NULL),
(1062, 'Xã Tân Thông Hội', 727, NULL, NULL),
(1063, 'Xã Thái Mỹ', 727, NULL, NULL),
(1064, 'Xã Trung An', 727, NULL, NULL),
(1065, 'Xã Trung Lập Hạ', 727, NULL, NULL),
(1066, 'Xã Trung Lập Thượng', 727, NULL, NULL),
(1067, 'Thị trấn Hóc Môn', 728, NULL, NULL),
(1068, 'Xã Bà Điểm', 728, NULL, NULL),
(1069, 'Xã Đông Thạnh', 728, NULL, NULL),
(1070, 'Xã Nhị Bình', 728, NULL, NULL),
(1071, 'Xã Tân Hiệp', 728, NULL, NULL),
(1072, 'Xã Tân Thới Nhì', 728, NULL, NULL),
(1073, 'Xã Tân Xuân', 728, NULL, NULL),
(1074, 'Xã Thới Tam Thôn', 728, NULL, NULL),
(1075, 'Xã Trung Chánh', 728, NULL, NULL),
(1076, 'Xã Xuân Thới Đông', 728, NULL, NULL),
(1077, 'Xã Xuân Thới Sơn', 728, NULL, NULL),
(1078, 'Xã Xuân Thới Thượng', 728, NULL, NULL),
(1079, 'Thị trấn Nhà Bè', 729, NULL, NULL),
(1080, 'Xã Hiệp Phước', 729, NULL, NULL),
(1081, 'Xã Long Thới', 729, NULL, NULL),
(1082, 'Xã Nhơn Đức', 729, NULL, NULL),
(1083, 'Xã Phú Xuân', 729, NULL, NULL),
(1084, 'Xã Phước Kiển', 729, NULL, NULL),
(1085, 'Xã Phước Lộc', 729, NULL, NULL),
(1086, 'Phường Cống Vị', 295, NULL, NULL),
(1087, 'Phường Điện Biên', 295, NULL, NULL),
(1088, 'Phường Đội Cấn', 295, NULL, NULL),
(1089, 'Phường Giảng Võ', 295, NULL, NULL),
(1090, 'Phường Kim Mã', 295, NULL, NULL),
(1091, 'Phường Liễu Giai', 295, NULL, NULL),
(1092, 'Phường Ngọc Hà', 295, NULL, NULL),
(1093, 'Phường Ngọc Khánh', 295, NULL, NULL),
(1094, 'Phường Nguyễn Trung Trực', 295, NULL, NULL),
(1095, 'Phường Phúc Xá', 295, NULL, NULL),
(1096, 'Phường Quán Thánh', 295, NULL, NULL),
(1097, 'Phường Thành Công', 295, NULL, NULL),
(1098, 'Phường Trúc Bạch', 295, NULL, NULL),
(1099, 'Phường Vĩnh Phúc', 295, NULL, NULL),
(1100, 'Phường Chương Dương', 296, NULL, NULL),
(1101, 'Phường Cửa Đông', 296, NULL, NULL),
(1102, 'Phường Cửa Nam', 296, NULL, NULL),
(1103, 'Phường Đồng Xuân', 296, NULL, NULL),
(1104, 'Phường Hàng Bạc', 296, NULL, NULL),
(1105, 'Phường Hàng Bài', 296, NULL, NULL),
(1106, 'Phường Hàng Bồ', 296, NULL, NULL),
(1107, 'Phường Hàng Bông', 296, NULL, NULL),
(1108, 'Phường Hàng Buồm', 296, NULL, NULL),
(1109, 'Phường Hàng Đào', 296, NULL, NULL),
(1110, 'Phường Hàng Gai', 296, NULL, NULL),
(1111, 'Phường Hàng Mã', 296, NULL, NULL),
(1112, 'Phường Hàng Trống', 296, NULL, NULL),
(1113, 'Phường Lý Thái Tổ', 296, NULL, NULL),
(1114, 'Phường Phan Chu Trinh', 296, NULL, NULL),
(1115, 'Phường Phúc Tân', 296, NULL, NULL),
(1116, 'Phường Trần Hưng Đạo', 296, NULL, NULL),
(1117, 'Phường Tràng Tiền', 296, NULL, NULL),
(1118, 'Phường Bưởi', 297, NULL, NULL),
(1119, 'Phường Nhật Tân', 297, NULL, NULL),
(1120, 'Phường Phú Thượng', 297, NULL, NULL),
(1121, 'Phường Quảng An', 297, NULL, NULL),
(1122, 'Phường Thụy Khuê', 297, NULL, NULL),
(1123, 'Phường Tứ Liên', 297, NULL, NULL),
(1124, 'Phường Xuân La', 297, NULL, NULL),
(1125, 'Phường Yên Phụ', 297, NULL, NULL),
(1126, 'Phường Bồ Đề', 298, NULL, NULL),
(1127, 'Phường Cự Khối', 298, NULL, NULL),
(1128, 'Phường Đức Giang', 298, NULL, NULL),
(1129, 'Phường Gia Thụy', 298, NULL, NULL),
(1130, 'Phường Giang Biên', 298, NULL, NULL),
(1131, 'Phường Long Biên', 298, NULL, NULL),
(1132, 'Phường Ngọc Lâm', 298, NULL, NULL),
(1133, 'Phường Ngọc Thụy', 298, NULL, NULL),
(1134, 'Phường Phúc Đồng', 298, NULL, NULL),
(1135, 'Phường Phúc Lợi', 298, NULL, NULL),
(1136, 'Phường Sài Đồng', 298, NULL, NULL),
(1137, 'Phường Thạch Bàn', 298, NULL, NULL),
(1138, 'Phường Thượng Thanh', 298, NULL, NULL),
(1139, 'Phường Việt Hưng', 298, NULL, NULL),
(1140, 'Phường Dịch Vọng', 299, NULL, NULL),
(1141, 'Phường Dịch Vọng Hậu', 299, NULL, NULL),
(1142, 'Phường Mai Dịch', 299, NULL, NULL),
(1143, 'Phường Nghĩa Đô', 299, NULL, NULL),
(1144, 'Phường Nghĩa Tân', 299, NULL, NULL),
(1145, 'Phường Quan Hoa', 299, NULL, NULL),
(1146, 'Phường Trung Hòa', 299, NULL, NULL),
(1147, 'Phường Yên Hòa', 299, NULL, NULL),
(1148, 'Phường Cát Linh', 300, NULL, NULL),
(1149, 'Phường Hàng Bột', 300, NULL, NULL),
(1150, 'Phường Khâm Thiên', 300, NULL, NULL),
(1151, 'Phường Khương Thượng', 300, NULL, NULL),
(1152, 'Phường Kim Liên', 300, NULL, NULL),
(1153, 'Phường Láng Hạ', 300, NULL, NULL),
(1154, 'Phường Láng Thượng', 300, NULL, NULL),
(1155, 'Phường Nam Đồng', 300, NULL, NULL),
(1156, 'Phường Ngã Tư Sở', 300, NULL, NULL),
(1157, 'Phường Ô Chợ Dừa', 300, NULL, NULL),
(1158, 'Phường Phương Liên', 300, NULL, NULL),
(1159, 'Phường Phương Mai', 300, NULL, NULL),
(1160, 'Phường Quang Trung', 300, NULL, NULL),
(1161, 'Phường Quốc Tử Giám', 300, NULL, NULL),
(1162, 'Phường Thịnh Quang', 300, NULL, NULL),
(1163, 'Phường Thổ Quan', 300, NULL, NULL),
(1164, 'Phường Trung Liệt', 300, NULL, NULL),
(1165, 'Phường Trung Phụng', 300, NULL, NULL),
(1166, 'Phường Trung Tự', 300, NULL, NULL),
(1167, 'Phường Văn Chương', 300, NULL, NULL),
(1168, 'Phường Văn Miếu', 300, NULL, NULL),
(1169, 'Phường Bạch Đằng', 301, NULL, NULL),
(1170, 'Phường Bách Khoa', 301, NULL, NULL),
(1171, 'Phường Bạch Mai', 301, NULL, NULL),
(1172, 'Phường Bùi Thị Xuân', 301, NULL, NULL),
(1173, 'Phường Cầu Dền', 301, NULL, NULL),
(1174, 'Phường Đống Mác', 301, NULL, NULL),
(1175, 'Phường Đồng Nhân', 301, NULL, NULL),
(1176, 'Phường Đồng Tâm', 301, NULL, NULL),
(1177, 'Phường Lê Đại Hành', 301, NULL, NULL),
(1178, 'Phường Minh Khai', 301, NULL, NULL),
(1179, 'Phường Nguyễn Du', 301, NULL, NULL),
(1180, 'Phường Phạm Đình Hổ', 301, NULL, NULL),
(1181, 'Phường Phố Huế', 301, NULL, NULL),
(1182, 'Phường Quỳnh Lôi', 301, NULL, NULL),
(1183, 'Phường Quỳnh Mai', 301, NULL, NULL),
(1184, 'Phường Thanh Lương', 301, NULL, NULL),
(1185, 'Phường Thanh Nhàn', 301, NULL, NULL),
(1186, 'Phường Trương Định', 301, NULL, NULL),
(1187, 'Phường Đại Kim', 302, NULL, NULL),
(1188, 'Phường Định Công', 302, NULL, NULL),
(1189, 'Phường Giáp Bát', 302, NULL, NULL),
(1190, 'Phường Hoàng Liệt', 302, NULL, NULL),
(1191, 'Phường Hoàng Văn Thụ', 302, NULL, NULL),
(1192, 'Phường Lĩnh Nam', 302, NULL, NULL),
(1193, 'Phường Mai Động', 302, NULL, NULL),
(1194, 'Phường Tân Mai', 302, NULL, NULL),
(1195, 'Phường Thanh Trì', 302, NULL, NULL),
(1196, 'Phường Thịnh Liệt', 302, NULL, NULL),
(1197, 'Phường Trần Phú', 302, NULL, NULL),
(1198, 'Phường Tương Mai', 302, NULL, NULL),
(1199, 'Phường Vĩnh Hưng', 302, NULL, NULL),
(1200, 'Phường Yên Sở', 302, NULL, NULL),
(1201, 'Phường Biên Giang', 303, NULL, NULL),
(1202, 'Phường Đồng Mai', 303, NULL, NULL),
(1203, 'Phường Dương Nội', 303, NULL, NULL),
(1204, 'Phường Hà Cầu', 303, NULL, NULL),
(1205, 'Phường Kiến Hưng', 303, NULL, NULL),
(1206, 'Phường La Khê', 303, NULL, NULL),
(1207, 'Phường Mộ Lao', 303, NULL, NULL),
(1208, 'Phường Nguyễn Trãi', 303, NULL, NULL),
(1209, 'Phường Phú La', 303, NULL, NULL),
(1210, 'Phường Phú Lãm', 303, NULL, NULL),
(1211, 'Phường Phú Lương', 303, NULL, NULL),
(1212, 'Phường Phúc La', 303, NULL, NULL),
(1213, 'Phường Quang Trung', 303, NULL, NULL),
(1214, 'Phường Vạn Phúc', 303, NULL, NULL),
(1215, 'Phường Văn Quán', 303, NULL, NULL),
(1216, 'Phường Yên Nghĩa', 303, NULL, NULL),
(1217, 'Phường Yết Kiêu', 303, NULL, NULL),
(1218, 'Phường Hạ Đình', 304, NULL, NULL),
(1219, 'Phường Khương Đình', 304, NULL, NULL),
(1220, 'Phường Khương Mai', 304, NULL, NULL),
(1221, 'Phường Khương Trung', 304, NULL, NULL),
(1222, 'Phường Kim Giang', 304, NULL, NULL),
(1223, 'Phường Nhân Chính', 304, NULL, NULL),
(1224, 'Phường Phương Liệt', 304, NULL, NULL),
(1225, 'Phường Thanh Xuân Bắc', 304, NULL, NULL),
(1226, 'Phường Thanh Xuân Nam', 304, NULL, NULL),
(1227, 'Phường Thanh Xuân Trung', 304, NULL, NULL),
(1228, 'Phường Thượng Đình', 304, NULL, NULL),
(1229, 'Phường Cầu Diễn', 305, NULL, NULL),
(1230, 'Phường Đại Mỗ', 305, NULL, NULL),
(1231, 'Phường Mễ Trì', 305, NULL, NULL),
(1232, 'Phường Mỹ Đình 1', 305, NULL, NULL),
(1233, 'Phường Mỹ Đình 2', 305, NULL, NULL),
(1234, 'Phường Phú Đô', 305, NULL, NULL),
(1235, 'Phường Phương Canh', 305, NULL, NULL),
(1236, 'Phường Tây Mỗ', 305, NULL, NULL),
(1237, 'Phường Trung Văn', 305, NULL, NULL),
(1238, 'Phường Xuân Phương', 305, NULL, NULL),
(1239, 'Phường Cổ Nhuế 1', 306, NULL, NULL),
(1240, 'Phường Cổ Nhuế 2', 306, NULL, NULL),
(1241, 'Phường Đông Ngạc', 306, NULL, NULL),
(1242, 'Phường Đức Thắng', 306, NULL, NULL),
(1243, 'Phường Liên Mạc', 306, NULL, NULL),
(1244, 'Phường Minh Khai', 306, NULL, NULL),
(1245, 'Phường Phú Diễn', 306, NULL, NULL),
(1246, 'Phường Phúc Diễn', 306, NULL, NULL),
(1247, 'Phường Tây Tựu', 306, NULL, NULL),
(1248, 'Phường Thượng Cát', 306, NULL, NULL),
(1249, 'Phường Thụy Phương', 306, NULL, NULL),
(1250, 'Phường Xuân Đỉnh', 306, NULL, NULL),
(1251, 'Phường Xuân Tảo', 306, NULL, NULL),
(1252, 'Phường Lê Lợi', 307, NULL, NULL),
(1253, 'Phường Ngô Quyền', 307, NULL, NULL),
(1254, 'Phường Phú Thịnh', 307, NULL, NULL),
(1255, 'Phường Quang Trung', 307, NULL, NULL),
(1256, 'Phường Sơn Lộc', 307, NULL, NULL),
(1257, 'Phường Trung Hưng', 307, NULL, NULL),
(1258, 'Phường Trung Sơn Trầm', 307, NULL, NULL),
(1259, 'Phường Viên Sơn', 307, NULL, NULL),
(1260, 'Phường Xuân Khanh', 307, NULL, NULL),
(1261, 'Xã Cổ Đông', 307, NULL, NULL),
(1262, 'Xã Đường Lâm', 307, NULL, NULL),
(1263, 'Xã Kim Sơn', 307, NULL, NULL),
(1264, 'Xã Sơn Đông', 307, NULL, NULL),
(1265, 'Xã Thanh Mỹ', 307, NULL, NULL),
(1266, 'Xã Xuân Sơn', 307, NULL, NULL),
(1267, 'Thị trấn Tây Đằng', 308, NULL, NULL),
(1268, 'Xã Ba Trại', 308, NULL, NULL),
(1269, 'Xã Ba Vì', 308, NULL, NULL),
(1270, 'Xã Cẩm Lĩnh', 308, NULL, NULL);
INSERT INTO `khuvuc` (`KhuVucID`, `TenKhuVuc`, `ParentKhuVucID`, `ViDo`, `KinhDo`) VALUES
(1271, 'Xã Cam Thượng', 308, NULL, NULL),
(1272, 'Xã Châu Sơn', 308, NULL, NULL),
(1273, 'Xã Chu Minh', 308, NULL, NULL),
(1274, 'Xã Cổ Đô', 308, NULL, NULL),
(1275, 'Xã Đông Quang', 308, NULL, NULL),
(1276, 'Xã Đồng Thái', 308, NULL, NULL),
(1277, 'Xã Khánh Thượng', 308, NULL, NULL),
(1278, 'Xã Minh Châu', 308, NULL, NULL),
(1279, 'Xã Minh Quang', 308, NULL, NULL),
(1280, 'Xã Phong Vân', 308, NULL, NULL),
(1281, 'Xã Phú Châu', 308, NULL, NULL),
(1282, 'Xã Phú Cường', 308, NULL, NULL),
(1283, 'Xã Phú Đông', 308, NULL, NULL),
(1284, 'Xã Phú Phương', 308, NULL, NULL),
(1285, 'Xã Phú Sơn', 308, NULL, NULL),
(1286, 'Xã Sơn Đà', 308, NULL, NULL),
(1287, 'Xã Tản Hồng', 308, NULL, NULL),
(1288, 'Xã Tản Lĩnh', 308, NULL, NULL),
(1289, 'Xã Thái Hòa', 308, NULL, NULL),
(1290, 'Xã Thuần Mỹ', 308, NULL, NULL),
(1291, 'Xã Thụy An', 308, NULL, NULL),
(1292, 'Xã Tiên Phong', 308, NULL, NULL),
(1293, 'Xã Tòng Bạt', 308, NULL, NULL),
(1294, 'Xã Vân Hòa', 308, NULL, NULL),
(1295, 'Xã Vạn Thắng', 308, NULL, NULL),
(1296, 'Xã Vật Lại', 308, NULL, NULL),
(1297, 'Xã Yên Bài', 308, NULL, NULL),
(1298, 'Thị trấn Chúc Sơn', 309, NULL, NULL),
(1299, 'Thị trấn Xuân Mai', 309, NULL, NULL),
(1300, 'Xã Đại Yên', 309, NULL, NULL),
(1301, 'Xã Đồng Lạc', 309, NULL, NULL),
(1302, 'Xã Đồng Phú', 309, NULL, NULL),
(1303, 'Xã Đông Phương Yên', 309, NULL, NULL),
(1304, 'Xã Đông Sơn', 309, NULL, NULL),
(1305, 'Xã Hòa Chính', 309, NULL, NULL),
(1306, 'Xã Hoàng Diệu', 309, NULL, NULL),
(1307, 'Xã Hoàng Văn Thụ', 309, NULL, NULL),
(1308, 'Xã Hồng Phong', 309, NULL, NULL),
(1309, 'Xã Hợp Đồng', 309, NULL, NULL),
(1310, 'Xã Hữu Văn', 309, NULL, NULL),
(1311, 'Xã Lam Điền', 309, NULL, NULL),
(1312, 'Xã Mỹ Lương', 309, NULL, NULL),
(1313, 'Xã Nam Phương Tiến', 309, NULL, NULL),
(1314, 'Xã Ngọc Hòa', 309, NULL, NULL),
(1315, 'Xã Phú Nam An', 309, NULL, NULL),
(1316, 'Xã Phú Nghĩa', 309, NULL, NULL),
(1317, 'Xã Phụng Châu', 309, NULL, NULL),
(1318, 'Xã Quảng Bị', 309, NULL, NULL),
(1319, 'Xã Tân Tiến', 309, NULL, NULL),
(1320, 'Xã Thanh Bình', 309, NULL, NULL),
(1321, 'Xã Thượng Vực', 309, NULL, NULL),
(1322, 'Xã Thụy Hương', 309, NULL, NULL),
(1323, 'Xã Tiên Phương', 309, NULL, NULL),
(1324, 'Xã Tốt Động', 309, NULL, NULL),
(1325, 'Xã Trần Phú', 309, NULL, NULL),
(1326, 'Xã Trung Hòa', 309, NULL, NULL),
(1327, 'Xã Trường Yên', 309, NULL, NULL),
(1328, 'Xã Văn Võ', 309, NULL, NULL),
(1329, 'Xã Yên Trung', 309, NULL, NULL),
(1330, 'Thị trấn Phùng', 310, NULL, NULL),
(1331, 'Xã Đan Phượng', 310, NULL, NULL),
(1332, 'Xã Đồng Tháp', 310, NULL, NULL),
(1333, 'Xã Hạ Mỗ', 310, NULL, NULL),
(1334, 'Xã Hồng Hà', 310, NULL, NULL),
(1335, 'Xã Liên Hà', 310, NULL, NULL),
(1336, 'Xã Liên Hồng', 310, NULL, NULL),
(1337, 'Xã Liên Trung', 310, NULL, NULL),
(1338, 'Xã Phương Đình', 310, NULL, NULL),
(1339, 'Xã Song Phượng', 310, NULL, NULL),
(1340, 'Xã Tân Hội', 310, NULL, NULL),
(1341, 'Xã Tân Lập', 310, NULL, NULL),
(1342, 'Xã Thọ An', 310, NULL, NULL),
(1343, 'Xã Thọ Xuân', 310, NULL, NULL),
(1344, 'Xã Thượng Mỗ', 310, NULL, NULL),
(1345, 'Xã Trung Châu', 310, NULL, NULL),
(1346, 'Thị trấn Đông Anh', 311, NULL, NULL),
(1347, 'Xã Bắc Hồng', 311, NULL, NULL),
(1348, 'Xã Cổ Loa', 311, NULL, NULL),
(1349, 'Xã Dục Tú', 311, NULL, NULL),
(1350, 'Xã Đại Mạch', 311, NULL, NULL),
(1351, 'Xã Đông Hội', 311, NULL, NULL),
(1352, 'Xã Hải Bối', 311, NULL, NULL),
(1353, 'Xã Kim Chung', 311, NULL, NULL),
(1354, 'Xã Kim Nỗ', 311, NULL, NULL),
(1355, 'Xã Liên Hà', 311, NULL, NULL),
(1356, 'Xã Mai Lâm', 311, NULL, NULL),
(1357, 'Xã Nam Hồng', 311, NULL, NULL),
(1358, 'Xã Nguyên Khê', 311, NULL, NULL),
(1359, 'Xã Tàm Xá', 311, NULL, NULL),
(1360, 'Xã Thụy Lâm', 311, NULL, NULL),
(1361, 'Xã Tiên Dương', 311, NULL, NULL),
(1362, 'Xã Uy Nỗ', 311, NULL, NULL),
(1363, 'Xã Vân Hà', 311, NULL, NULL),
(1364, 'Xã Vân Nội', 311, NULL, NULL),
(1365, 'Xã Việt Hùng', 311, NULL, NULL),
(1366, 'Xã Vĩnh Ngọc', 311, NULL, NULL),
(1367, 'Xã Võng La', 311, NULL, NULL),
(1368, 'Xã Xuân Canh', 311, NULL, NULL),
(1369, 'Xã Xuân Nộn', 311, NULL, NULL),
(1370, 'Thị trấn Trâu Quỳ', 312, NULL, NULL),
(1371, 'Thị trấn Yên Viên', 312, NULL, NULL),
(1372, 'Xã Bát Tràng', 312, NULL, NULL),
(1373, 'Xã Cổ Bi', 312, NULL, NULL),
(1374, 'Xã Đa Tốn', 312, NULL, NULL),
(1375, 'Xã Đặng Xá', 312, NULL, NULL),
(1376, 'Xã Đình Xuyên', 312, NULL, NULL),
(1377, 'Xã Đông Dư', 312, NULL, NULL),
(1378, 'Xã Dương Hà', 312, NULL, NULL),
(1379, 'Xã Dương Quang', 312, NULL, NULL),
(1380, 'Xã Dương Xá', 312, NULL, NULL),
(1381, 'Xã Kiêu Kỵ', 312, NULL, NULL),
(1382, 'Xã Kim Lan', 312, NULL, NULL),
(1383, 'Xã Kim Sơn', 312, NULL, NULL),
(1384, 'Xã Lệ Chi', 312, NULL, NULL),
(1385, 'Xã Ninh Hiệp', 312, NULL, NULL),
(1386, 'Xã Phù Đổng', 312, NULL, NULL),
(1387, 'Xã Phú Thị', 312, NULL, NULL),
(1388, 'Xã Trung Mầu', 312, NULL, NULL),
(1389, 'Xã Văn Đức', 312, NULL, NULL),
(1390, 'Xã Yên Thường', 312, NULL, NULL),
(1391, 'Xã Yên Viên', 312, NULL, NULL),
(1392, 'Thị trấn Trạm Trôi', 313, NULL, NULL),
(1393, 'Xã An Khánh', 313, NULL, NULL),
(1394, 'Xã An Thượng', 313, NULL, NULL),
(1395, 'Xã Cát Quế', 313, NULL, NULL),
(1396, 'Xã Đắc Sở', 313, NULL, NULL),
(1397, 'Xã Di Trạch', 313, NULL, NULL),
(1398, 'Xã Đông La', 313, NULL, NULL),
(1399, 'Xã Đức Giang', 313, NULL, NULL),
(1400, 'Xã Đức Thượng', 313, NULL, NULL),
(1401, 'Xã Dương Liễu', 313, NULL, NULL),
(1402, 'Xã Kim Chung', 313, NULL, NULL),
(1403, 'Xã La Phù', 313, NULL, NULL),
(1404, 'Xã Lại Yên', 313, NULL, NULL),
(1405, 'Xã Minh Khai', 313, NULL, NULL),
(1406, 'Xã Sơn Đồng', 313, NULL, NULL),
(1407, 'Xã Song Phương', 313, NULL, NULL),
(1408, 'Xã Tiền Yên', 313, NULL, NULL),
(1409, 'Xã Vân Canh', 313, NULL, NULL),
(1410, 'Xã Vân Côn', 313, NULL, NULL),
(1411, 'Xã Yên Sở', 313, NULL, NULL),
(1412, 'Thị trấn Chi Đông', 314, NULL, NULL),
(1413, 'Thị trấn Quang Minh', 314, NULL, NULL),
(1414, 'Xã Chu Phan', 314, NULL, NULL),
(1415, 'Xã Đại Thịnh', 314, NULL, NULL),
(1416, 'Xã Hoàng Kim', 314, NULL, NULL),
(1417, 'Xã Kim Hoa', 314, NULL, NULL),
(1418, 'Xã Liên Mạc', 314, NULL, NULL),
(1419, 'Xã Mê Linh', 314, NULL, NULL),
(1420, 'Xã Tam Đồng', 314, NULL, NULL),
(1421, 'Xã Thạch Đà', 314, NULL, NULL),
(1422, 'Xã Thanh Lâm', 314, NULL, NULL),
(1423, 'Xã Tiền Phong', 314, NULL, NULL),
(1424, 'Xã Tiền Thắng', 314, NULL, NULL),
(1425, 'Xã Tiến Thịnh', 314, NULL, NULL),
(1426, 'Xã Tráng Việt', 314, NULL, NULL),
(1427, 'Xã Tự Lập', 314, NULL, NULL),
(1428, 'Xã Vạn Yên', 314, NULL, NULL),
(1429, 'Xã Văn Khê', 314, NULL, NULL),
(1430, 'Thị trấn Đại Nghĩa', 315, NULL, NULL),
(1431, 'Xã An Mỹ', 315, NULL, NULL),
(1432, 'Xã An Phú', 315, NULL, NULL),
(1433, 'Xã An Tiến', 315, NULL, NULL),
(1434, 'Xã Bột Xuyên', 315, NULL, NULL),
(1435, 'Xã Đại Hưng', 315, NULL, NULL),
(1436, 'Xã Đốc Tín', 315, NULL, NULL),
(1437, 'Xã Đồng Tâm', 315, NULL, NULL),
(1438, 'Xã Hồng Sơn', 315, NULL, NULL),
(1439, 'Xã Hợp Thanh', 315, NULL, NULL),
(1440, 'Xã Hợp Tiến', 315, NULL, NULL),
(1441, 'Xã Hùng Tiến', 315, NULL, NULL),
(1442, 'Xã Hương Sơn', 315, NULL, NULL),
(1443, 'Xã Lê Thanh', 315, NULL, NULL),
(1444, 'Xã Mỹ Thành', 315, NULL, NULL),
(1445, 'Xã Phù Lưu Tế', 315, NULL, NULL),
(1446, 'Xã Phúc Lâm', 315, NULL, NULL),
(1447, 'Xã Phùng Xá', 315, NULL, NULL),
(1448, 'Xã Thượng Lâm', 315, NULL, NULL),
(1449, 'Xã Tuy Lai', 315, NULL, NULL),
(1450, 'Xã Vạn Kim', 315, NULL, NULL),
(1451, 'Xã Xuy Xá', 315, NULL, NULL),
(1452, 'Thị trấn Phú Minh', 316, NULL, NULL),
(1453, 'Thị trấn Phú Xuyên', 316, NULL, NULL),
(1454, 'Xã Bạch Hạ', 316, NULL, NULL),
(1455, 'Xã Châu Can', 316, NULL, NULL),
(1456, 'Xã Chuyên Mỹ', 316, NULL, NULL),
(1457, 'Xã Đại Thắng', 316, NULL, NULL),
(1458, 'Xã Đại Xuyên', 316, NULL, NULL),
(1459, 'Xã Hoàng Long', 316, NULL, NULL),
(1460, 'Xã Hồng Minh', 316, NULL, NULL),
(1461, 'Xã Hồng Thái', 316, NULL, NULL),
(1462, 'Xã Khai Thái', 316, NULL, NULL),
(1463, 'Xã Minh Tân', 316, NULL, NULL),
(1464, 'Xã Nam Phong', 316, NULL, NULL),
(1465, 'Xã Nam Tiến', 316, NULL, NULL),
(1466, 'Xã Nam Triều', 316, NULL, NULL),
(1467, 'Xã Phú Túc', 316, NULL, NULL),
(1468, 'Xã Phú Yên', 316, NULL, NULL),
(1469, 'Xã Phúc Tiến', 316, NULL, NULL),
(1470, 'Xã Phượng Dực', 316, NULL, NULL),
(1471, 'Xã Quang Lãng', 316, NULL, NULL),
(1472, 'Xã Quang Trung', 316, NULL, NULL),
(1473, 'Xã Sơn Hà', 316, NULL, NULL),
(1474, 'Xã Tân Dân', 316, NULL, NULL),
(1475, 'Xã Tri Thủy', 316, NULL, NULL),
(1476, 'Xã Tri Trung', 316, NULL, NULL),
(1477, 'Xã Văn Hoàng', 316, NULL, NULL),
(1478, 'Xã Vân Từ', 316, NULL, NULL),
(1479, 'Thị trấn Phúc Thọ', 317, NULL, NULL),
(1480, 'Xã Cẩm Đình', 317, NULL, NULL),
(1481, 'Xã Hát Môn', 317, NULL, NULL),
(1482, 'Xã Hiệp Thuận', 317, NULL, NULL),
(1483, 'Xã Hoa Sơn', 317, NULL, NULL),
(1484, 'Xã Liên Hiệp', 317, NULL, NULL),
(1485, 'Xã Long Xuyên', 317, NULL, NULL),
(1486, 'Xã Ngọc Tảo', 317, NULL, NULL),
(1487, 'Xã Phúc Hòa', 317, NULL, NULL),
(1488, 'Xã Phụng Thượng', 317, NULL, NULL),
(1489, 'Xã Phương Độ', 317, NULL, NULL),
(1490, 'Xã Sen Chiểu', 317, NULL, NULL),
(1491, 'Xã Tam Hiệp', 317, NULL, NULL),
(1492, 'Xã Tam Thuấn', 317, NULL, NULL),
(1493, 'Xã Thanh Đa', 317, NULL, NULL),
(1494, 'Xã Thọ Lộc', 317, NULL, NULL),
(1495, 'Xã Thượng Cốc', 317, NULL, NULL),
(1496, 'Xã Tích Giang', 317, NULL, NULL),
(1497, 'Xã Trạch Mỹ Lộc', 317, NULL, NULL),
(1498, 'Xã Vân Hà', 317, NULL, NULL),
(1499, 'Xã Vân Nam', 317, NULL, NULL),
(1500, 'Xã Vân Phúc', 317, NULL, NULL),
(1501, 'Xã Võng Xuyên', 317, NULL, NULL),
(1502, 'Xã Xuân Đình', 317, NULL, NULL),
(1503, 'Thị trấn Quốc Oai', 318, NULL, NULL),
(1504, 'Xã Cấn Hữu', 318, NULL, NULL),
(1505, 'Xã Cộng Hòa', 318, NULL, NULL),
(1506, 'Xã Đại Thành', 318, NULL, NULL),
(1507, 'Xã Đồng Quang', 318, NULL, NULL),
(1508, 'Xã Đông Xuân', 318, NULL, NULL),
(1509, 'Xã Đông Yên', 318, NULL, NULL),
(1510, 'Xã Hòa Thạch', 318, NULL, NULL),
(1511, 'Xã Liệp Tuyết', 318, NULL, NULL),
(1512, 'Xã Nghĩa Hương', 318, NULL, NULL),
(1513, 'Xã Ngọc Liệp', 318, NULL, NULL),
(1514, 'Xã Ngọc Mỹ', 318, NULL, NULL),
(1515, 'Xã Phú Cát', 318, NULL, NULL),
(1516, 'Xã Phú Mãn', 318, NULL, NULL),
(1517, 'Xã Phượng Cách', 318, NULL, NULL),
(1518, 'Xã Sài Sơn', 318, NULL, NULL),
(1519, 'Xã Tân Hòa', 318, NULL, NULL),
(1520, 'Xã Tân Phú', 318, NULL, NULL),
(1521, 'Xã Thạch Thán', 318, NULL, NULL),
(1522, 'Xã Tuyết Nghĩa', 318, NULL, NULL),
(1523, 'Xã Yên Sơn', 318, NULL, NULL),
(1524, 'Thị trấn Sóc Sơn', 319, NULL, NULL),
(1525, 'Xã Bắc Phú', 319, NULL, NULL),
(1526, 'Xã Bắc Sơn', 319, NULL, NULL),
(1527, 'Xã Đông Xuân', 319, NULL, NULL),
(1528, 'Xã Đức Hòa', 319, NULL, NULL),
(1529, 'Xã Hiền Ninh', 319, NULL, NULL),
(1530, 'Xã Hồng Kỳ', 319, NULL, NULL),
(1531, 'Xã Kim Lũ', 319, NULL, NULL),
(1532, 'Xã Mai Đình', 319, NULL, NULL),
(1533, 'Xã Minh Phú', 319, NULL, NULL),
(1534, 'Xã Minh Trí', 319, NULL, NULL),
(1535, 'Xã Nam Sơn', 319, NULL, NULL),
(1536, 'Xã Phú Cường', 319, NULL, NULL),
(1537, 'Xã Phù Linh', 319, NULL, NULL),
(1538, 'Xã Phù Lỗ', 319, NULL, NULL),
(1539, 'Xã Phú Minh', 319, NULL, NULL),
(1540, 'Xã Quang Tiến', 319, NULL, NULL),
(1541, 'Xã Tân Dân', 319, NULL, NULL),
(1542, 'Xã Tân Hưng', 319, NULL, NULL),
(1543, 'Xã Tân Minh', 319, NULL, NULL),
(1544, 'Xã Thanh Xuân', 319, NULL, NULL),
(1545, 'Xã Tiên Dược', 319, NULL, NULL),
(1546, 'Xã Trung Giã', 319, NULL, NULL),
(1547, 'Xã Việt Long', 319, NULL, NULL),
(1548, 'Xã Xuân Giang', 319, NULL, NULL),
(1549, 'Xã Xuân Thu', 319, NULL, NULL),
(1550, 'Thị trấn Liên Quan', 320, NULL, NULL),
(1551, 'Xã Bình Phú', 320, NULL, NULL),
(1552, 'Xã Bình Yên', 320, NULL, NULL),
(1553, 'Xã Canh Nậu', 320, NULL, NULL),
(1554, 'Xã Cần Kiệm', 320, NULL, NULL),
(1555, 'Xã Chàng Sơn', 320, NULL, NULL),
(1556, 'Xã Đại Đồng', 320, NULL, NULL),
(1557, 'Xã Dị Nậu', 320, NULL, NULL),
(1558, 'Xã Đồng Trúc', 320, NULL, NULL),
(1559, 'Xã Hạ Bằng', 320, NULL, NULL),
(1560, 'Xã Hương Ngải', 320, NULL, NULL),
(1561, 'Xã Hữu Bằng', 320, NULL, NULL),
(1562, 'Xã Kim Quan', 320, NULL, NULL),
(1563, 'Xã Lại Thượng', 320, NULL, NULL),
(1564, 'Xã Phùng Xá', 320, NULL, NULL),
(1565, 'Xã Phú Kim', 320, NULL, NULL),
(1566, 'Xã Tân Xã', 320, NULL, NULL),
(1567, 'Xã Thạch Hòa', 320, NULL, NULL),
(1568, 'Xã Thạch Xá', 320, NULL, NULL),
(1569, 'Xã Tiến Xuân', 320, NULL, NULL),
(1570, 'Xã Yên Bình', 320, NULL, NULL),
(1571, 'Xã Yên Trung', 320, NULL, NULL),
(1572, 'Thị trấn Kim Bài', 321, NULL, NULL),
(1573, 'Xã Bích Hòa', 321, NULL, NULL),
(1574, 'Xã Bình Minh', 321, NULL, NULL),
(1575, 'Xã Cao Dương', 321, NULL, NULL),
(1576, 'Xã Cao Viên', 321, NULL, NULL),
(1577, 'Xã Cự Khê', 321, NULL, NULL),
(1578, 'Xã Dân Hòa', 321, NULL, NULL),
(1579, 'Xã Đỗ Động', 321, NULL, NULL),
(1580, 'Xã Hồng Dương', 321, NULL, NULL),
(1581, 'Xã Kim An', 321, NULL, NULL),
(1582, 'Xã Kim Thư', 321, NULL, NULL),
(1583, 'Xã Liên Châu', 321, NULL, NULL),
(1584, 'Xã Mỹ Hưng', 321, NULL, NULL),
(1585, 'Xã Phương Trung', 321, NULL, NULL),
(1586, 'Xã Tam Hưng', 321, NULL, NULL),
(1587, 'Xã Tân Ước', 321, NULL, NULL),
(1588, 'Xã Thanh An', 321, NULL, NULL),
(1589, 'Xã Thanh Cao', 321, NULL, NULL),
(1590, 'Xã Thanh Mai', 321, NULL, NULL),
(1591, 'Xã Thanh Thùy', 321, NULL, NULL),
(1592, 'Xã Thanh Văn', 321, NULL, NULL),
(1593, 'Xã Xuân Dương', 321, NULL, NULL),
(1594, 'Thị trấn Văn Điển', 322, NULL, NULL),
(1595, 'Xã Đại Áng', 322, NULL, NULL),
(1596, 'Xã Đông Mỹ', 322, NULL, NULL),
(1597, 'Xã Duyên Hà', 322, NULL, NULL),
(1598, 'Xã Hữu Hòa', 322, NULL, NULL),
(1599, 'Xã Liên Ninh', 322, NULL, NULL),
(1600, 'Xã Ngọc Hồi', 322, NULL, NULL),
(1601, 'Xã Ngũ Hiệp', 322, NULL, NULL),
(1602, 'Xã Tả Thanh Oai', 322, NULL, NULL),
(1603, 'Xã Tam Hiệp', 322, NULL, NULL),
(1604, 'Xã Tân Triều', 322, NULL, NULL),
(1605, 'Xã Thanh Liệt', 322, NULL, NULL),
(1606, 'Xã Tứ Hiệp', 322, NULL, NULL),
(1607, 'Xã Vạn Phúc', 322, NULL, NULL),
(1608, 'Xã Vĩnh Quỳnh', 322, NULL, NULL),
(1609, 'Xã Yên Mỹ', 322, NULL, NULL),
(1610, 'Thị trấn Thường Tín', 323, NULL, NULL),
(1611, 'Xã Chương Dương', 323, NULL, NULL),
(1612, 'Xã Dũng Tiến', 323, NULL, NULL),
(1613, 'Xã Duyên Thái', 323, NULL, NULL),
(1614, 'Xã Hà Hồi', 323, NULL, NULL),
(1615, 'Xã Hiền Giang', 323, NULL, NULL),
(1616, 'Xã Hòa Bình', 323, NULL, NULL),
(1617, 'Xã Hồng Vân', 323, NULL, NULL),
(1618, 'Xã Khánh Hà', 323, NULL, NULL),
(1619, 'Xã Lê Lợi', 323, NULL, NULL),
(1620, 'Xã Liên Phương', 323, NULL, NULL),
(1621, 'Xã Minh Cường', 323, NULL, NULL),
(1622, 'Xã Nghiêm Xuyên', 323, NULL, NULL),
(1623, 'Xã Nguyễn Trãi', 323, NULL, NULL),
(1624, 'Xã Nhị Khê', 323, NULL, NULL),
(1625, 'Xã Ninh Sở', 323, NULL, NULL),
(1626, 'Xã Quất Động', 323, NULL, NULL),
(1627, 'Xã Tân Minh', 323, NULL, NULL),
(1628, 'Xã Thắng Lợi', 323, NULL, NULL),
(1629, 'Xã Thống Nhất', 323, NULL, NULL),
(1630, 'Xã Thư Phú', 323, NULL, NULL),
(1631, 'Xã Tiền Phong', 323, NULL, NULL),
(1632, 'Xã Tô Hiệu', 323, NULL, NULL),
(1633, 'Xã Tự Nhiên', 323, NULL, NULL),
(1634, 'Xã Vạn Điểm', 323, NULL, NULL),
(1635, 'Xã Văn Bình', 323, NULL, NULL),
(1636, 'Xã Văn Phú', 323, NULL, NULL),
(1637, 'Xã Văn Tự', 323, NULL, NULL),
(1638, 'Xã Vân Tảo', 323, NULL, NULL),
(1639, 'Thị trấn Vân Đình', 324, NULL, NULL),
(1640, 'Xã Cao Thành', 324, NULL, NULL),
(1641, 'Xã Đại Cường', 324, NULL, NULL),
(1642, 'Xã Đại Hùng', 324, NULL, NULL),
(1643, 'Xã Đội Bình', 324, NULL, NULL),
(1644, 'Xã Đông Lỗ', 324, NULL, NULL),
(1645, 'Xã Đồng Tân', 324, NULL, NULL),
(1646, 'Xã Đồng Tiến', 324, NULL, NULL),
(1647, 'Xã Hòa Lâm', 324, NULL, NULL),
(1648, 'Xã Hòa Nam', 324, NULL, NULL),
(1649, 'Xã Hòa Phú', 324, NULL, NULL),
(1650, 'Xã Hoa Sơn', 324, NULL, NULL),
(1651, 'Xã Hòa Xá', 324, NULL, NULL),
(1652, 'Xã Hồng Quang', 324, NULL, NULL),
(1653, 'Xã Kim Đường', 324, NULL, NULL),
(1654, 'Xã Liên Bạt', 324, NULL, NULL),
(1655, 'Xã Lưu Hoàng', 324, NULL, NULL),
(1656, 'Xã Minh Đức', 324, NULL, NULL),
(1657, 'Xã Phù Lưu', 324, NULL, NULL),
(1658, 'Xã Phương Tú', 324, NULL, NULL),
(1659, 'Xã Quảng Phú Cầu', 324, NULL, NULL),
(1660, 'Xã Sơn Công', 324, NULL, NULL),
(1661, 'Xã Tảo Dương Văn', 324, NULL, NULL),
(1662, 'Xã Trầm Lộng', 324, NULL, NULL),
(1663, 'Xã Trung Tú', 324, NULL, NULL),
(1664, 'Xã Trường Thịnh', 324, NULL, NULL),
(1665, 'Xã Vạn Thái', 324, NULL, NULL),
(1666, 'Xã Viên An', 324, NULL, NULL),
(1667, 'Xã Viên Nội', 324, NULL, NULL),
(1668, 'Phường Hòa An', 198, NULL, NULL),
(1669, 'Phường Hòa Phát', 198, NULL, NULL),
(1670, 'Phường Hòa Thọ Đông', 198, NULL, NULL),
(1671, 'Phường Hòa Thọ Tây', 198, NULL, NULL),
(1672, 'Phường Hòa Xuân', 198, NULL, NULL),
(1673, 'Phường Khuê Trung', 198, NULL, NULL),
(1674, 'Phường Bình Hiên', 199, NULL, NULL),
(1675, 'Phường Bình Thuận', 199, NULL, NULL),
(1676, 'Phường Hải Châu I', 199, NULL, NULL),
(1677, 'Phường Hải Châu II', 199, NULL, NULL),
(1678, 'Phường Hòa Cường Bắc', 199, NULL, NULL),
(1679, 'Phường Hòa Cường Nam', 199, NULL, NULL),
(1680, 'Phường Hòa Thuận Đông', 199, NULL, NULL),
(1681, 'Phường Hòa Thuận Tây', 199, NULL, NULL),
(1682, 'Phường Nam Dương', 199, NULL, NULL),
(1683, 'Phường Phước Ninh', 199, NULL, NULL),
(1684, 'Phường Thạch Thang', 199, NULL, NULL),
(1685, 'Phường Thanh Bình', 199, NULL, NULL),
(1686, 'Phường Thuận Phước', 199, NULL, NULL),
(1687, 'Phường Hòa Hiệp Bắc', 200, NULL, NULL),
(1688, 'Phường Hòa Hiệp Nam', 200, NULL, NULL),
(1689, 'Phường Hòa Khánh Bắc', 200, NULL, NULL),
(1690, 'Phường Hòa Khánh Nam', 200, NULL, NULL),
(1691, 'Phường Hòa Minh', 200, NULL, NULL),
(1692, 'Phường Hoà Hải', 201, NULL, NULL),
(1693, 'Phường Hoà Quý', 201, NULL, NULL),
(1694, 'Phường Khuê Mỹ', 201, NULL, NULL),
(1695, 'Phường Mỹ An', 201, NULL, NULL),
(1696, 'Phường An Hải Bắc', 202, NULL, NULL),
(1697, 'Phường An Hải Đông', 202, NULL, NULL),
(1698, 'Phường An Hải Tây', 202, NULL, NULL),
(1699, 'Phường Mân Thái', 202, NULL, NULL),
(1700, 'Phường Nại Hiên Đông', 202, NULL, NULL),
(1701, 'Phường Phước Mỹ', 202, NULL, NULL),
(1702, 'Phường Thọ Quang', 202, NULL, NULL),
(1703, 'Phường An Khê', 203, NULL, NULL),
(1704, 'Phường Chính Gián', 203, NULL, NULL),
(1705, 'Phường Hòa Khê', 203, NULL, NULL),
(1706, 'Phường Tam Thuận', 203, NULL, NULL),
(1707, 'Phường Tân Chính', 203, NULL, NULL),
(1708, 'Phường Thạc Gián', 203, NULL, NULL),
(1709, 'Phường Thanh Khê Đông', 203, NULL, NULL),
(1710, 'Phường Thanh Khê Tây', 203, NULL, NULL),
(1711, 'Phường Vĩnh Trung', 203, NULL, NULL),
(1712, 'Phường Xuân Hà', 203, NULL, NULL),
(1713, 'Xã Hòa Bắc', 204, NULL, NULL),
(1714, 'Xã Hòa Châu', 204, NULL, NULL),
(1715, 'Xã Hòa Khương', 204, NULL, NULL),
(1716, 'Xã Hòa Liên', 204, NULL, NULL),
(1717, 'Xã Hòa Nhơn', 204, NULL, NULL),
(1718, 'Xã Hòa Ninh', 204, NULL, NULL),
(1719, 'Xã Hòa Phong', 204, NULL, NULL),
(1720, 'Xã Hòa Phú', 204, NULL, NULL),
(1721, 'Xã Hòa Phước', 204, NULL, NULL),
(1722, 'Xã Hòa Sơn', 204, NULL, NULL),
(1723, 'Xã Hòa Tiến', 204, NULL, NULL),
(1724, 'Phường Bình Hưng', 160, NULL, NULL),
(1725, 'Phường Đức Long', 160, NULL, NULL),
(1726, 'Phường Đức Nghĩa', 160, NULL, NULL),
(1727, 'Phường Đức Thắng', 160, NULL, NULL),
(1728, 'Phường Hàm Tiến', 160, NULL, NULL),
(1729, 'Phường Hưng Long', 160, NULL, NULL),
(1730, 'Phường Lạc Đạo', 160, NULL, NULL),
(1731, 'Phường Mũi Né', 160, NULL, NULL),
(1732, 'Phường Phú Hài', 160, NULL, NULL),
(1733, 'Phường Phú Tài', 160, NULL, NULL),
(1734, 'Phường Phú Thủy', 160, NULL, NULL),
(1735, 'Phường Phú Trinh', 160, NULL, NULL),
(1736, 'Phường Thanh Hải', 160, NULL, NULL),
(1737, 'Phường Xuân An', 160, NULL, NULL),
(1738, 'Xã Phong Nẫm', 160, NULL, NULL),
(1739, 'Xã Thiện Nghiệp', 160, NULL, NULL),
(1740, 'Xã Tiến Lợi', 160, NULL, NULL),
(1741, 'Xã Tiến Thành', 160, NULL, NULL),
(1742, 'Phường Bình Tân', 161, NULL, NULL),
(1743, 'Phường Phước Hội', 161, NULL, NULL),
(1744, 'Phường Phước Lộc', 161, NULL, NULL),
(1745, 'Phường Tân An', 161, NULL, NULL),
(1746, 'Phường Tân Thiện', 161, NULL, NULL),
(1747, 'Xã Tân Bình', 161, NULL, NULL),
(1748, 'Xã Tân Hải', 161, NULL, NULL),
(1749, 'Xã Tân Phước', 161, NULL, NULL),
(1750, 'Xã Tân Tiến', 161, NULL, NULL),
(1751, 'Thị trấn Chợ Lầu', 162, NULL, NULL),
(1752, 'Thị trấn Lương Sơn', 162, NULL, NULL),
(1753, 'Xã Bình An', 162, NULL, NULL),
(1754, 'Xã Bình Tân', 162, NULL, NULL),
(1755, 'Xã Hải Ninh', 162, NULL, NULL),
(1756, 'Xã Hòa Thắng', 162, NULL, NULL),
(1757, 'Xã Hồng Phong', 162, NULL, NULL),
(1758, 'Xã Hồng Thái', 162, NULL, NULL),
(1759, 'Xã Phan Điền', 162, NULL, NULL),
(1760, 'Xã Phan Hiệp', 162, NULL, NULL),
(1761, 'Xã Phan Hòa', 162, NULL, NULL),
(1762, 'Xã Phan Lâm', 162, NULL, NULL),
(1763, 'Xã Phan Rí Thành', 162, NULL, NULL),
(1764, 'Xã Phan Sơn', 162, NULL, NULL),
(1765, 'Xã Phan Thanh', 162, NULL, NULL),
(1766, 'Xã Phan Tiến', 162, NULL, NULL),
(1767, 'Xã Sông Bình', 162, NULL, NULL),
(1768, 'Xã Sông Lũy', 162, NULL, NULL),
(1769, 'Thị trấn Võ Xu', 163, NULL, NULL),
(1770, 'Thị trấn Đức Tài', 163, NULL, NULL),
(1771, 'Xã Đa Kai', 163, NULL, NULL),
(1772, 'Xã Đông Hà', 163, NULL, NULL),
(1773, 'Xã Đức Hạnh', 163, NULL, NULL),
(1774, 'Xã Đức Tín', 163, NULL, NULL),
(1775, 'Xã Mê Pu', 163, NULL, NULL),
(1776, 'Xã Nam Chính', 163, NULL, NULL),
(1777, 'Xã Sùng Nhơn', 163, NULL, NULL),
(1778, 'Xã Tân Hà', 163, NULL, NULL),
(1779, 'Xã Trà Tân', 163, NULL, NULL),
(1780, 'Xã Vũ Hòa', 163, NULL, NULL),
(1781, 'Thị trấn Tân Minh', 164, NULL, NULL),
(1782, 'Thị trấn Tân Nghĩa', 164, NULL, NULL),
(1783, 'Xã Sông Phan', 164, NULL, NULL),
(1784, 'Xã Sơn Mỹ', 164, NULL, NULL),
(1785, 'Xã Tân Đức', 164, NULL, NULL),
(1786, 'Xã Tân Hà', 164, NULL, NULL),
(1787, 'Xã Tân Phúc', 164, NULL, NULL),
(1788, 'Xã Tân Thắng', 164, NULL, NULL),
(1789, 'Xã Thắng Hải', 164, NULL, NULL),
(1790, 'Thị trấn Ma Lâm', 165, NULL, NULL),
(1791, 'Thị trấn Phú Long', 165, NULL, NULL),
(1792, 'Xã Đa Mi', 165, NULL, NULL),
(1793, 'Xã Đông Giang', 165, NULL, NULL),
(1794, 'Xã Đông Tiến', 165, NULL, NULL),
(1795, 'Xã Hàm Chính', 165, NULL, NULL),
(1796, 'Xã Hàm Đức', 165, NULL, NULL),
(1797, 'Xã Hàm Hiệp', 165, NULL, NULL),
(1798, 'Xã Hàm Liêm', 165, NULL, NULL),
(1799, 'Xã Hàm Phú', 165, NULL, NULL),
(1800, 'Xã Hàm Thắng', 165, NULL, NULL),
(1801, 'Xã Hàm Trí', 165, NULL, NULL),
(1802, 'Xã Hồng Liêm', 165, NULL, NULL),
(1803, 'Xã Hồng Sơn', 165, NULL, NULL),
(1804, 'Xã La Dạ', 165, NULL, NULL),
(1805, 'Xã Thuận Hòa', 165, NULL, NULL),
(1806, 'Xã Thuận Minh', 165, NULL, NULL),
(1807, 'Thị trấn Thuận Nam', 166, NULL, NULL),
(1808, 'Xã Hàm Cần', 166, NULL, NULL),
(1809, 'Xã Hàm Cường', 166, NULL, NULL),
(1810, 'Xã Hàm Kiệm', 166, NULL, NULL),
(1811, 'Xã Hàm Minh', 166, NULL, NULL),
(1812, 'Xã Hàm Mỹ', 166, NULL, NULL),
(1813, 'Xã Hàm Thạnh', 166, NULL, NULL),
(1814, 'Xã Mương Mán', 166, NULL, NULL),
(1815, 'Xã Mỹ Thạnh', 166, NULL, NULL),
(1816, 'Xã Tân Lập', 166, NULL, NULL),
(1817, 'Xã Tân Thành', 166, NULL, NULL),
(1818, 'Xã Thuận Quý', 166, NULL, NULL),
(1819, 'Xã Long Hải', 167, NULL, NULL),
(1820, 'Xã Ngũ Phụng', 167, NULL, NULL),
(1821, 'Xã Tam Thanh', 167, NULL, NULL),
(1822, 'Thị trấn Lạc Tánh', 168, NULL, NULL),
(1823, 'Xã Bắc Ruộng', 168, NULL, NULL),
(1824, 'Xã Đồng Kho', 168, NULL, NULL),
(1825, 'Xã Đức Bình', 168, NULL, NULL),
(1826, 'Xã Đức Phú', 168, NULL, NULL),
(1827, 'Xã Đức Thuận', 168, NULL, NULL),
(1828, 'Xã Gia An', 168, NULL, NULL),
(1829, 'Xã Gia Huynh', 168, NULL, NULL),
(1830, 'Xã Huy Khiêm', 168, NULL, NULL),
(1831, 'Xã La Ngâu', 168, NULL, NULL),
(1832, 'Xã Măng Tố', 168, NULL, NULL),
(1833, 'Xã Nghị Đức', 168, NULL, NULL),
(1834, 'Xã Suối Kiết', 168, NULL, NULL),
(1835, 'Thị trấn Liên Hương', 169, NULL, NULL),
(1836, 'Thị trấn Phan Rí Cửa', 169, NULL, NULL),
(1837, 'Xã Bình Thạnh', 169, NULL, NULL),
(1838, 'Xã Chí Công', 169, NULL, NULL),
(1839, 'Xã Hòa Minh', 169, NULL, NULL),
(1840, 'Xã Phan Dũng', 169, NULL, NULL),
(1841, 'Xã Phong Phú', 169, NULL, NULL),
(1842, 'Xã Phú Lạc', 169, NULL, NULL),
(1843, 'Xã Phước Thể', 169, NULL, NULL),
(1844, 'Xã Vĩnh Hảo', 169, NULL, NULL),
(1845, 'Xã Vĩnh Tân', 169, NULL, NULL),
(1846, 'Phường 1', 635, NULL, NULL),
(1847, 'Phường 2', 635, NULL, NULL),
(1848, 'Phường 3', 635, NULL, NULL),
(1849, 'Phường IV', 635, NULL, NULL),
(1850, 'Phường Hiệp Ninh', 635, NULL, NULL),
(1851, 'Phường Ninh Sơn', 635, NULL, NULL),
(1852, 'Phường Ninh Thạnh', 635, NULL, NULL),
(1853, 'Xã Bình Minh', 635, NULL, NULL),
(1854, 'Xã Tân Bình', 635, NULL, NULL),
(1855, 'Xã Thạnh Tân', 635, NULL, NULL),
(1856, 'Phường Hiệp Tân', 636, NULL, NULL),
(1857, 'Phường Long Hoa', 636, NULL, NULL),
(1858, 'Phường Long Thành Bắc', 636, NULL, NULL),
(1859, 'Phường Long Thành Trung', 636, NULL, NULL),
(1860, 'Xã Hiệp Thạnh', 636, NULL, NULL),
(1861, 'Xã Long Thành Nam', 636, NULL, NULL),
(1862, 'Xã Trường Đông', 636, NULL, NULL),
(1863, 'Xã Trường Hòa', 636, NULL, NULL),
(1864, 'Xã Trường Tây', 636, NULL, NULL),
(1865, 'Phường An Hòa', 637, NULL, NULL),
(1866, 'Phường An Tịnh', 637, NULL, NULL),
(1867, 'Phường Gia Bình', 637, NULL, NULL),
(1868, 'Phường Gia Lộc', 637, NULL, NULL),
(1869, 'Phường Lộc Hưng', 637, NULL, NULL),
(1870, 'Phường Trảng Bàng', 637, NULL, NULL),
(1871, 'Xã Đôn Thuận', 637, NULL, NULL),
(1872, 'Xã Hưng Thuận', 637, NULL, NULL),
(1873, 'Xã Phước Bình', 637, NULL, NULL),
(1874, 'Xã Phước Chỉ', 637, NULL, NULL),
(1875, 'Thị trấn Bến Cầu', 638, NULL, NULL),
(1876, 'Xã An Thạnh', 638, NULL, NULL),
(1877, 'Xã Lợi Thuận', 638, NULL, NULL),
(1878, 'Xã Long Chữ', 638, NULL, NULL),
(1879, 'Xã Long Giang', 638, NULL, NULL),
(1880, 'Xã Long Khánh', 638, NULL, NULL),
(1881, 'Xã Long Phước', 638, NULL, NULL),
(1882, 'Xã Long Thuận', 638, NULL, NULL),
(1883, 'Xã Tiên Thuận', 638, NULL, NULL),
(1884, 'Thị trấn Châu Thành', 639, NULL, NULL),
(1885, 'Xã An Bình', 639, NULL, NULL),
(1886, 'Xã An Cơ', 639, NULL, NULL),
(1887, 'Xã Biên Giới', 639, NULL, NULL),
(1888, 'Xã Đồng Khởi', 639, NULL, NULL),
(1889, 'Xã Hảo Đước', 639, NULL, NULL),
(1890, 'Xã Hòa Hội', 639, NULL, NULL),
(1891, 'Xã Hòa Thạnh', 639, NULL, NULL),
(1892, 'Xã Long Vĩnh', 639, NULL, NULL),
(1893, 'Xã Ninh Điền', 639, NULL, NULL),
(1894, 'Xã Phước Vinh', 639, NULL, NULL),
(1895, 'Xã Thái Bình', 639, NULL, NULL),
(1896, 'Xã Thanh Điền', 639, NULL, NULL),
(1897, 'Xã Thành Long', 639, NULL, NULL),
(1898, 'Xã Trí Bình', 639, NULL, NULL),
(1899, 'Thị trấn Dương Minh Châu', 640, NULL, NULL),
(1900, 'Xã Bàu Năng', 640, NULL, NULL),
(1901, 'Xã Bến Củi', 640, NULL, NULL),
(1902, 'Xã Cầu Khởi', 640, NULL, NULL),
(1903, 'Xã Chà Là', 640, NULL, NULL),
(1904, 'Xã Lộc Ninh', 640, NULL, NULL),
(1905, 'Xã Phan', 640, NULL, NULL),
(1906, 'Xã Phước Minh', 640, NULL, NULL),
(1907, 'Xã Phước Ninh', 640, NULL, NULL),
(1908, 'Xã Suối Đá', 640, NULL, NULL),
(1909, 'Xã Truông Mít', 640, NULL, NULL),
(1910, 'Thị trấn Gò Dầu', 641, NULL, NULL),
(1911, 'Xã Bàu Đồn', 641, NULL, NULL),
(1912, 'Xã Cẩm Giang', 641, NULL, NULL),
(1913, 'Xã Hiệp Thạnh', 641, NULL, NULL),
(1914, 'Xã Phước Đông', 641, NULL, NULL),
(1915, 'Xã Phước Thạnh', 641, NULL, NULL),
(1916, 'Xã Phước Trạch', 641, NULL, NULL),
(1917, 'Xã Thạnh Đức', 641, NULL, NULL),
(1918, 'Xã Thanh Phước', 641, NULL, NULL),
(1919, 'Thị trấn Tân Biên', 642, NULL, NULL),
(1920, 'Xã Hòa Hiệp', 642, NULL, NULL),
(1921, 'Xã Mỏ Công', 642, NULL, NULL),
(1922, 'Xã Tân Bình', 642, NULL, NULL),
(1923, 'Xã Tân Lập', 642, NULL, NULL),
(1924, 'Xã Tân Phong', 642, NULL, NULL),
(1925, 'Xã Thạnh Bắc', 642, NULL, NULL),
(1926, 'Xã Thạnh Bình', 642, NULL, NULL),
(1927, 'Xã Thạnh Tây', 642, NULL, NULL),
(1928, 'Xã Trà Vong', 642, NULL, NULL),
(1929, 'Thị trấn Tân Châu', 643, NULL, NULL),
(1930, 'Xã Suối Dây', 643, NULL, NULL),
(1931, 'Xã Suối Ngô', 643, NULL, NULL),
(1932, 'Xã Tân Đông', 643, NULL, NULL),
(1933, 'Xã Tân Hà', 643, NULL, NULL),
(1934, 'Xã Tân Hiệp', 643, NULL, NULL),
(1935, 'Xã Tân Hòa', 643, NULL, NULL),
(1936, 'Xã Tân Hội', 643, NULL, NULL),
(1937, 'Xã Tân Hưng', 643, NULL, NULL),
(1938, 'Xã Tân Phú', 643, NULL, NULL),
(1939, 'Xã Tân Thành', 643, NULL, NULL),
(1940, 'Xã Thạnh Đông', 643, NULL, NULL),
(1941, 'Phường Lộc Thọ', 393, NULL, NULL),
(1942, 'Phường Ngọc Hiệp', 393, NULL, NULL),
(1943, 'Phường Phước Hải', 393, NULL, NULL),
(1944, 'Phường Phước Hòa', 393, NULL, NULL),
(1945, 'Phường Phước Long', 393, NULL, NULL),
(1946, 'Phường Phước Tân', 393, NULL, NULL),
(1947, 'Phường Phước Tiến', 393, NULL, NULL),
(1948, 'Phường Phương Sài', 393, NULL, NULL),
(1949, 'Phường Phương Sơn', 393, NULL, NULL),
(1950, 'Phường Tân Lập', 393, NULL, NULL),
(1951, 'Phường Vạn Thắng', 393, NULL, NULL),
(1952, 'Phường Vạn Thạnh', 393, NULL, NULL),
(1953, 'Phường Vĩnh Hải', 393, NULL, NULL),
(1954, 'Phường Vĩnh Hòa', 393, NULL, NULL),
(1955, 'Phường Vĩnh Nguyên', 393, NULL, NULL),
(1956, 'Phường Vĩnh Phước', 393, NULL, NULL),
(1957, 'Phường Vĩnh Thọ', 393, NULL, NULL),
(1958, 'Phường Vĩnh Trường', 393, NULL, NULL),
(1959, 'Phường Xương Huân', 393, NULL, NULL),
(1960, 'Xã Phước Đồng', 393, NULL, NULL),
(1961, 'Xã Vĩnh Hiệp', 393, NULL, NULL),
(1962, 'Xã Vĩnh Lương', 393, NULL, NULL),
(1963, 'Xã Vĩnh Ngọc', 393, NULL, NULL),
(1964, 'Xã Vĩnh Phương', 393, NULL, NULL),
(1965, 'Xã Vĩnh Thạnh', 393, NULL, NULL),
(1966, 'Xã Vĩnh Trung', 393, NULL, NULL),
(1967, 'Phường Ba Ngòi', 394, NULL, NULL),
(1968, 'Phường Cam Lộc', 394, NULL, NULL),
(1969, 'Phường Cam Lợi', 394, NULL, NULL),
(1970, 'Phường Cam Linh', 394, NULL, NULL),
(1971, 'Phường Cam Nghĩa', 394, NULL, NULL),
(1972, 'Phường Cam Phú', 394, NULL, NULL),
(1973, 'Phường Cam Phúc Bắc', 394, NULL, NULL),
(1974, 'Phường Cam Phúc Nam', 394, NULL, NULL),
(1975, 'Phường Cam Thuận', 394, NULL, NULL),
(1976, 'Xã Cam Bình', 394, NULL, NULL),
(1977, 'Xã Cam Lập', 394, NULL, NULL),
(1978, 'Xã Cam Phước Đông', 394, NULL, NULL),
(1979, 'Xã Cam Thành Nam', 394, NULL, NULL),
(1980, 'Xã Cam Thịnh Đông', 394, NULL, NULL),
(1981, 'Xã Cam Thịnh Tây', 394, NULL, NULL),
(1982, 'Phường Ninh Diêm', 395, NULL, NULL),
(1983, 'Phường Ninh Đa', 395, NULL, NULL),
(1984, 'Phường Ninh Giang', 395, NULL, NULL),
(1985, 'Phường Ninh Hà', 395, NULL, NULL),
(1986, 'Phường Ninh Hải', 395, NULL, NULL),
(1987, 'Phường Ninh Hiệp', 395, NULL, NULL),
(1988, 'Phường Ninh Thủy', 395, NULL, NULL),
(1989, 'Xã Ninh An', 395, NULL, NULL),
(1990, 'Xã Ninh Bình', 395, NULL, NULL),
(1991, 'Xã Ninh Đông', 395, NULL, NULL),
(1992, 'Xã Ninh Hưng', 395, NULL, NULL),
(1993, 'Xã Ninh Ích', 395, NULL, NULL),
(1994, 'Xã Ninh Lộc', 395, NULL, NULL),
(1995, 'Xã Ninh Phú', 395, NULL, NULL),
(1996, 'Xã Ninh Phụng', 395, NULL, NULL),
(1997, 'Xã Ninh Phước', 395, NULL, NULL),
(1998, 'Xã Ninh Quang', 395, NULL, NULL),
(1999, 'Xã Ninh Sim', 395, NULL, NULL),
(2000, 'Xã Ninh Sơn', 395, NULL, NULL),
(2001, 'Xã Ninh Tân', 395, NULL, NULL),
(2002, 'Xã Ninh Tây', 395, NULL, NULL),
(2003, 'Xã Ninh Thân', 395, NULL, NULL),
(2004, 'Xã Ninh Thọ', 395, NULL, NULL),
(2005, 'Xã Ninh Thượng', 395, NULL, NULL),
(2006, 'Xã Ninh Vân', 395, NULL, NULL),
(2007, 'Thị trấn Cam Đức', 396, NULL, NULL),
(2008, 'Xã Cam An Bắc', 396, NULL, NULL),
(2009, 'Xã Cam An Nam', 396, NULL, NULL),
(2010, 'Xã Cam Hải Đông', 396, NULL, NULL),
(2011, 'Xã Cam Hải Tây', 396, NULL, NULL),
(2012, 'Xã Cam Hiệp Bắc', 396, NULL, NULL),
(2013, 'Xã Cam Hiệp Nam', 396, NULL, NULL),
(2014, 'Xã Cam Hòa', 396, NULL, NULL),
(2015, 'Xã Cam Phước Tây', 396, NULL, NULL),
(2016, 'Xã Cam Tân', 396, NULL, NULL),
(2017, 'Xã Cam Thành Bắc', 396, NULL, NULL),
(2018, 'Xã Sơn Tân', 396, NULL, NULL),
(2019, 'Xã Suối Cát', 396, NULL, NULL),
(2020, 'Xã Suối Tân', 396, NULL, NULL),
(2021, 'Thị trấn Diên Khánh', 397, NULL, NULL),
(2022, 'Xã Bình Lộc', 397, NULL, NULL),
(2023, 'Xã Diên An', 397, NULL, NULL),
(2024, 'Xã Diên Điền', 397, NULL, NULL),
(2025, 'Xã Diên Đồng', 397, NULL, NULL),
(2026, 'Xã Diên Hòa', 397, NULL, NULL),
(2027, 'Xã Diên Lạc', 397, NULL, NULL),
(2028, 'Xã Diên Lâm', 397, NULL, NULL),
(2029, 'Xã Diên Lộc', 397, NULL, NULL),
(2030, 'Xã Diên Phú', 397, NULL, NULL),
(2031, 'Xã Diên Phước', 397, NULL, NULL),
(2032, 'Xã Diên Sơn', 397, NULL, NULL),
(2033, 'Xã Diên Tân', 397, NULL, NULL),
(2034, 'Xã Diên Thạnh', 397, NULL, NULL),
(2035, 'Xã Diên Thọ', 397, NULL, NULL),
(2036, 'Xã Diên Toàn', 397, NULL, NULL),
(2037, 'Xã Suối Hiệp', 397, NULL, NULL),
(2038, 'Xã Suối Tiên', 397, NULL, NULL),
(2039, 'Thị trấn Tô Hạp', 398, NULL, NULL),
(2040, 'Xã Ba Cụm Bắc', 398, NULL, NULL),
(2041, 'Xã Ba Cụm Nam', 398, NULL, NULL),
(2042, 'Xã Sơn Bình', 398, NULL, NULL),
(2043, 'Xã Sơn Hiệp', 398, NULL, NULL),
(2044, 'Xã Sơn Lâm', 398, NULL, NULL),
(2045, 'Xã Sơn Trung', 398, NULL, NULL),
(2046, 'Xã Thành Sơn', 398, NULL, NULL),
(2047, 'Thị trấn Khánh Vĩnh', 399, NULL, NULL),
(2048, 'Xã Cầu Bà', 399, NULL, NULL),
(2049, 'Xã Giang Ly', 399, NULL, NULL),
(2050, 'Xã Khánh Bình', 399, NULL, NULL),
(2051, 'Xã Khánh Đông', 399, NULL, NULL),
(2052, 'Xã Khánh Hiệp', 399, NULL, NULL),
(2053, 'Xã Khánh Nam', 399, NULL, NULL),
(2054, 'Xã Khánh Phú', 399, NULL, NULL),
(2055, 'Xã Khánh Thành', 399, NULL, NULL),
(2056, 'Xã Khánh Thượng', 399, NULL, NULL),
(2057, 'Xã Liên Sang', 399, NULL, NULL),
(2058, 'Xã Sông Cầu', 399, NULL, NULL),
(2059, 'Xã Sơn Thái', 399, NULL, NULL),
(2060, 'Thị trấn Trường Sa', 400, NULL, NULL),
(2061, 'Xã Sinh Tồn', 400, NULL, NULL),
(2062, 'Xã Song Tử Tây', 400, NULL, NULL),
(2063, 'Thị trấn Vạn Giã', 401, NULL, NULL),
(2064, 'Xã Đại Lãnh', 401, NULL, NULL),
(2065, 'Xã Vạn Bình', 401, NULL, NULL),
(2066, 'Xã Vạn Hưng', 401, NULL, NULL),
(2067, 'Xã Vạn Khánh', 401, NULL, NULL),
(2068, 'Xã Vạn Long', 401, NULL, NULL),
(2069, 'Xã Vạn Lương', 401, NULL, NULL),
(2070, 'Xã Vạn Phú', 401, NULL, NULL),
(2071, 'Xã Vạn Phước', 401, NULL, NULL),
(2072, 'Xã Vạn Thạnh', 401, NULL, NULL),
(2073, 'Xã Vạn Thắng', 401, NULL, NULL),
(2074, 'Xã Xuân Sơn', 401, NULL, NULL),
(2075, 'Phường 1', 435, NULL, NULL),
(2076, 'Phường 2', 435, NULL, NULL),
(2077, 'Phường 3', 435, NULL, NULL),
(2078, 'Phường 4', 435, NULL, NULL),
(2079, 'Phường 5', 435, NULL, NULL),
(2080, 'Phường 6', 435, NULL, NULL),
(2081, 'Phường 7', 435, NULL, NULL),
(2082, 'Phường 8', 435, NULL, NULL),
(2083, 'Phường 9', 435, NULL, NULL),
(2084, 'Phường 10', 435, NULL, NULL),
(2085, 'Phường 11', 435, NULL, NULL),
(2086, 'Phường 12', 435, NULL, NULL),
(2087, 'Xã Tà Nung', 435, NULL, NULL),
(2088, 'Xã Trạm Hành', 435, NULL, NULL),
(2089, 'Xã Xuân Thọ', 435, NULL, NULL),
(2090, 'Xã Xuân Trường', 435, NULL, NULL),
(2091, 'Phường 1', 436, NULL, NULL),
(2092, 'Phường 2', 436, NULL, NULL),
(2093, 'Phường B\'Lao', 436, NULL, NULL),
(2094, 'Phường Lộc Phát', 436, NULL, NULL),
(2095, 'Phường Lộc Sơn', 436, NULL, NULL),
(2096, 'Phường Lộc Tiến', 436, NULL, NULL),
(2097, 'Xã Đại Lào', 436, NULL, NULL),
(2098, 'Xã Đam Bri', 436, NULL, NULL),
(2099, 'Xã Lộc Châu', 436, NULL, NULL),
(2100, 'Xã Lộc Nga', 436, NULL, NULL),
(2101, 'Xã Lộc Thanh', 436, NULL, NULL),
(2102, 'Thị trấn Lộc Thắng', 437, NULL, NULL),
(2103, 'Xã B\'Lá', 437, NULL, NULL),
(2104, 'Xã Lộc An', 437, NULL, NULL),
(2105, 'Xã Lộc Bắc', 437, NULL, NULL),
(2106, 'Xã Lộc Bảo', 437, NULL, NULL),
(2107, 'Xã Lộc Đức', 437, NULL, NULL),
(2108, 'Xã Lộc Lâm', 437, NULL, NULL),
(2109, 'Xã Lộc Nam', 437, NULL, NULL),
(2110, 'Xã Lộc Ngãi', 437, NULL, NULL),
(2111, 'Xã Lộc Phú', 437, NULL, NULL),
(2112, 'Xã Lộc Quảng', 437, NULL, NULL),
(2113, 'Xã Lộc Tân', 437, NULL, NULL),
(2114, 'Xã Lộc Thành', 437, NULL, NULL),
(2115, 'Thị trấn Cát Tiên', 438, NULL, NULL),
(2116, 'Xã Đồng Nai Thượng', 438, NULL, NULL),
(2117, 'Xã Đức Phổ', 438, NULL, NULL),
(2118, 'Xã Gia Viễn', 438, NULL, NULL),
(2119, 'Xã Mỹ Lâm', 438, NULL, NULL),
(2120, 'Xã Nam Ninh', 438, NULL, NULL),
(2121, 'Xã Phước Cát 1', 438, NULL, NULL),
(2122, 'Xã Phước Cát 2', 438, NULL, NULL),
(2123, 'Xã Quảng Ngãi', 438, NULL, NULL),
(2124, 'Xã Tiên Hoàng', 438, NULL, NULL),
(2125, 'Thị trấn Đạ M\'ri', 439, NULL, NULL),
(2126, 'Thị trấn Mađaguôi', 439, NULL, NULL),
(2127, 'Xã Đạ Oai', 439, NULL, NULL),
(2128, 'Xã Đạ Ploa', 439, NULL, NULL),
(2129, 'Xã Đạ Tồn', 439, NULL, NULL),
(2130, 'Xã Đoàn Kết', 439, NULL, NULL),
(2131, 'Xã Hà Lâm', 439, NULL, NULL),
(2132, 'Xã Mađaguôi', 439, NULL, NULL),
(2133, 'Xã Phước Lộc', 439, NULL, NULL),
(2134, 'Thị trấn Đạ Tẻh', 440, NULL, NULL),
(2135, 'Xã An Nhơn', 440, NULL, NULL),
(2136, 'Xã Đạ Kho', 440, NULL, NULL),
(2137, 'Xã Đạ Lây', 440, NULL, NULL),
(2138, 'Xã Hương Lâm', 440, NULL, NULL),
(2139, 'Xã Mỹ Đức', 440, NULL, NULL),
(2140, 'Xã Quảng Trị', 440, NULL, NULL),
(2141, 'Xã Quốc Oai', 440, NULL, NULL),
(2142, 'Xã Triệu Hải', 440, NULL, NULL),
(2143, 'Xã Đạ K\'Nàng', 441, NULL, NULL),
(2144, 'Xã Đạ Long', 441, NULL, NULL),
(2145, 'Xã Đạ M\'Rông', 441, NULL, NULL),
(2146, 'Xã Đạ Rsal', 441, NULL, NULL),
(2147, 'Xã Đạ Tông', 441, NULL, NULL),
(2148, 'Xã Liêng Srônh', 441, NULL, NULL),
(2149, 'Xã Phi Liêng', 441, NULL, NULL),
(2150, 'Xã Rô Men', 441, NULL, NULL),
(2151, 'Thị trấn Di Linh', 442, NULL, NULL),
(2152, 'Xã Bảo Thuận', 442, NULL, NULL),
(2153, 'Xã Đinh Lạc', 442, NULL, NULL),
(2154, 'Xã Đinh Trang Hòa', 442, NULL, NULL),
(2155, 'Xã Đinh Trang Thượng', 442, NULL, NULL),
(2156, 'Xã Gia Bắc', 442, NULL, NULL),
(2157, 'Xã Gia Hiệp', 442, NULL, NULL),
(2158, 'Xã Gung Ré', 442, NULL, NULL),
(2159, 'Xã Hòa Bắc', 442, NULL, NULL),
(2160, 'Xã Hòa Nam', 442, NULL, NULL),
(2161, 'Xã Hòa Ninh', 442, NULL, NULL),
(2162, 'Xã Hòa Trung', 442, NULL, NULL),
(2163, 'Xã Liên Đầm', 442, NULL, NULL),
(2164, 'Xã Sơn Điền', 442, NULL, NULL),
(2165, 'Xã Tam Bố', 442, NULL, NULL),
(2166, 'Xã Tân Châu', 442, NULL, NULL),
(2167, 'Xã Tân Lâm', 442, NULL, NULL),
(2168, 'Xã Tân Nghĩa', 442, NULL, NULL),
(2169, 'Xã Tân Thượng', 442, NULL, NULL),
(2170, 'Thị trấn D\'ran', 443, NULL, NULL),
(2171, 'Thị trấn Thạnh Mỹ', 443, NULL, NULL),
(2172, 'Xã Đạ Ròn', 443, NULL, NULL),
(2173, 'Xã Ka Đô', 443, NULL, NULL),
(2174, 'Xã Ka Đơn', 443, NULL, NULL),
(2175, 'Xã Lạc Lâm', 443, NULL, NULL),
(2176, 'Xã Lạc Xuân', 443, NULL, NULL),
(2177, 'Xã Pró', 443, NULL, NULL),
(2178, 'Xã Quảng Lập', 443, NULL, NULL),
(2179, 'Xã Tu Tra', 443, NULL, NULL),
(2180, 'Thị trấn Liên Nghĩa', 444, NULL, NULL),
(2181, 'Xã Bình Thạnh', 444, NULL, NULL),
(2182, 'Xã Đà Loan', 444, NULL, NULL),
(2183, 'Xã Đa Quyn', 444, NULL, NULL),
(2184, 'Xã Hiệp An', 444, NULL, NULL),
(2185, 'Xã Hiệp Thạnh', 444, NULL, NULL),
(2186, 'Xã Liên Hiệp', 444, NULL, NULL),
(2187, 'Xã N\'Thol Hạ', 444, NULL, NULL),
(2188, 'Xã Ninh Gia', 444, NULL, NULL),
(2189, 'Xã Ninh Loan', 444, NULL, NULL),
(2190, 'Xã Phú Hội', 444, NULL, NULL),
(2191, 'Xã Tà Hine', 444, NULL, NULL),
(2192, 'Xã Tà Năng', 444, NULL, NULL),
(2193, 'Xã Tân Hội', 444, NULL, NULL),
(2194, 'Xã Tân Thành', 444, NULL, NULL),
(2195, 'Thị trấn Lạc Dương', 445, NULL, NULL),
(2196, 'Xã Đạ Chais', 445, NULL, NULL),
(2197, 'Xã Đạ Nhim', 445, NULL, NULL),
(2198, 'Xã Đạ Sar', 445, NULL, NULL),
(2199, 'Xã Đưng KNớ', 445, NULL, NULL),
(2200, 'Xã Lát', 445, NULL, NULL),
(2201, 'Thị trấn Đinh Văn', 446, NULL, NULL),
(2202, 'Thị trấn Nam Ban', 446, NULL, NULL),
(2203, 'Xã Đạ Đờn', 446, NULL, NULL),
(2204, 'Xã Đan Phượng', 446, NULL, NULL),
(2205, 'Xã Đông Thanh', 446, NULL, NULL),
(2206, 'Xã Gia Lâm', 446, NULL, NULL),
(2207, 'Xã Hoài Đức', 446, NULL, NULL),
(2208, 'Xã Liên Hà', 446, NULL, NULL),
(2209, 'Xã Mê Linh', 446, NULL, NULL),
(2210, 'Xã Nam Hà', 446, NULL, NULL),
(2211, 'Xã Phi Tô', 446, NULL, NULL),
(2212, 'Xã Phú Sơn', 446, NULL, NULL),
(2213, 'Xã Phúc Thọ', 446, NULL, NULL),
(2214, 'Xã Tân Hà', 446, NULL, NULL),
(2215, 'Xã Tân Thanh', 446, NULL, NULL),
(2216, 'Xã Tân Văn', 446, NULL, NULL),
(2217, 'Phường Bàng La', 350, NULL, NULL),
(2218, 'Phường Hợp Đức', 350, NULL, NULL),
(2219, 'Phường Minh Đức', 350, NULL, NULL),
(2220, 'Phường Ngọc Xuyên', 350, NULL, NULL),
(2221, 'Phường Vạn Hương', 350, NULL, NULL),
(2222, 'Phường Vạn Sơn', 350, NULL, NULL),
(2223, 'Phường Anh Dũng', 351, NULL, NULL),
(2224, 'Phường Đa Phúc', 351, NULL, NULL),
(2225, 'Phường Hải Thành', 351, NULL, NULL),
(2226, 'Phường Hòa Nghĩa', 351, NULL, NULL),
(2227, 'Phường Hưng Đạo', 351, NULL, NULL),
(2228, 'Phường Tân Thành', 351, NULL, NULL),
(2229, 'Phường Cát Bi', 352, NULL, NULL),
(2230, 'Phường Đằng Hải', 352, NULL, NULL),
(2231, 'Phường Đằng Lâm', 352, NULL, NULL),
(2232, 'Phường Đông Hải 1', 352, NULL, NULL),
(2233, 'Phường Đông Hải 2', 352, NULL, NULL),
(2234, 'Phường Nam Hải', 352, NULL, NULL),
(2235, 'Phường Thành Tô', 352, NULL, NULL),
(2236, 'Phường Tràng Cát', 352, NULL, NULL),
(2237, 'Phường Hạ Lý', 353, NULL, NULL),
(2238, 'Phường Hoàng Văn Thụ', 353, NULL, NULL),
(2239, 'Phường Hùng Vương', 353, NULL, NULL),
(2240, 'Phường Minh Khai', 353, NULL, NULL),
(2241, 'Phường Phan Bội Châu', 353, NULL, NULL),
(2242, 'Phường Phạm Hồng Thái', 353, NULL, NULL),
(2243, 'Phường Quán Toan', 353, NULL, NULL),
(2244, 'Phường Quang Trung', 353, NULL, NULL),
(2245, 'Phường Sở Dầu', 353, NULL, NULL),
(2246, 'Phường Thượng Lý', 353, NULL, NULL),
(2247, 'Phường Trại Chuối', 353, NULL, NULL),
(2248, 'Phường Bắc Sơn', 354, NULL, NULL),
(2249, 'Phường Đồng Hòa', 354, NULL, NULL),
(2250, 'Phường Lãm Hà', 354, NULL, NULL),
(2251, 'Phường Nam Sơn', 354, NULL, NULL),
(2252, 'Phường Ngọc Sơn', 354, NULL, NULL),
(2253, 'Phường Phù Liễn', 354, NULL, NULL),
(2254, 'Phường Quán Trữ', 354, NULL, NULL),
(2255, 'Phường Trần Thành Ngọ', 354, NULL, NULL),
(2256, 'Phường Tràng Minh', 354, NULL, NULL),
(2257, 'Phường Văn Đẩu', 354, NULL, NULL),
(2258, 'Phường An Biên', 355, NULL, NULL),
(2259, 'Phường An Dương', 355, NULL, NULL),
(2260, 'Phường Cát Dài', 355, NULL, NULL),
(2261, 'Phường Dư Hàng', 355, NULL, NULL),
(2262, 'Phường Dư Hàng Kênh', 355, NULL, NULL),
(2263, 'Phường Đông Hải', 355, NULL, NULL),
(2264, 'Phường Hàng Kênh', 355, NULL, NULL),
(2265, 'Phường Hồ Nam', 355, NULL, NULL),
(2266, 'Phường Kênh Dương', 355, NULL, NULL),
(2267, 'Phường Lam Sơn', 355, NULL, NULL),
(2268, 'Phường Nghĩa Xá', 355, NULL, NULL),
(2269, 'Phường Niệm Nghĩa', 355, NULL, NULL),
(2270, 'Phường Trại Cau', 355, NULL, NULL),
(2271, 'Phường Trần Nguyên Hãn', 355, NULL, NULL),
(2272, 'Phường Vĩnh Niệm', 355, NULL, NULL),
(2273, 'Phường Cầu Đất', 356, NULL, NULL),
(2274, 'Phường Cầu Tre', 356, NULL, NULL),
(2275, 'Phường Đằng Giang', 356, NULL, NULL),
(2276, 'Phường Đông Khê', 356, NULL, NULL),
(2277, 'Phường Đồng Quốc Bình', 356, NULL, NULL),
(2278, 'Phường Gia Viên', 356, NULL, NULL),
(2279, 'Phường Lạc Viên', 356, NULL, NULL),
(2280, 'Phường Lạch Tray', 356, NULL, NULL),
(2281, 'Phường Lê Lợi', 356, NULL, NULL),
(2282, 'Phường Lương Khánh Thiện', 356, NULL, NULL),
(2283, 'Phường Máy Chai', 356, NULL, NULL),
(2284, 'Phường Máy Tơ', 356, NULL, NULL),
(2285, 'Phường Vạn Mỹ', 356, NULL, NULL),
(2286, 'Thị trấn An Dương', 357, NULL, NULL),
(2287, 'Xã An Đồng', 357, NULL, NULL),
(2288, 'Xã An Hòa', 357, NULL, NULL),
(2289, 'Xã An Hồng', 357, NULL, NULL),
(2290, 'Xã Bắc Sơn', 357, NULL, NULL),
(2291, 'Xã Đại Bản', 357, NULL, NULL),
(2292, 'Xã Đặng Cương', 357, NULL, NULL),
(2293, 'Xã Đồng Thái', 357, NULL, NULL),
(2294, 'Xã Hồng Phong', 357, NULL, NULL),
(2295, 'Xã Hồng Thái', 357, NULL, NULL),
(2296, 'Xã Lê Lợi', 357, NULL, NULL),
(2297, 'Xã Lê Thiện', 357, NULL, NULL),
(2298, 'Xã Nam Sơn', 357, NULL, NULL),
(2299, 'Xã Quốc Tuấn', 357, NULL, NULL),
(2300, 'Xã Tân Tiến', 357, NULL, NULL),
(2301, 'Thị trấn An Lão', 358, NULL, NULL),
(2302, 'Thị trấn Trường Sơn', 358, NULL, NULL),
(2303, 'Xã An Thái', 358, NULL, NULL),
(2304, 'Xã An Thắng', 358, NULL, NULL),
(2305, 'Xã An Thọ', 358, NULL, NULL),
(2306, 'Xã An Tiến', 358, NULL, NULL),
(2307, 'Xã Bát Trang', 358, NULL, NULL),
(2308, 'Xã Chiến Thắng', 358, NULL, NULL),
(2309, 'Xã Mỹ Đức', 358, NULL, NULL),
(2310, 'Xã Quang Hưng', 358, NULL, NULL),
(2311, 'Xã Quang Trung', 358, NULL, NULL),
(2312, 'Xã Quốc Tuấn', 358, NULL, NULL),
(2313, 'Xã Tân Dân', 358, NULL, NULL),
(2314, 'Xã Tân Viên', 358, NULL, NULL),
(2315, 'Xã Thái Sơn', 358, NULL, NULL),
(2316, 'Xã Trường Thọ', 358, NULL, NULL),
(2317, 'Xã Trường Thành', 358, NULL, NULL),
(2318, 'Thị trấn Cát Bà', 360, NULL, NULL),
(2319, 'Thị trấn Cát Hải', 360, NULL, NULL),
(2320, 'Xã Đồng Bài', 360, NULL, NULL),
(2321, 'Xã Gia Luận', 360, NULL, NULL),
(2322, 'Xã Hiền Hào', 360, NULL, NULL),
(2323, 'Xã Hoàng Châu', 360, NULL, NULL),
(2324, 'Xã Nghĩa Lộ', 360, NULL, NULL),
(2325, 'Xã Phù Long', 360, NULL, NULL),
(2326, 'Xã Trân Châu', 360, NULL, NULL),
(2327, 'Xã Văn Phong', 360, NULL, NULL),
(2328, 'Xã Việt Hải', 360, NULL, NULL),
(2329, 'Xã Xuân Đám', 360, NULL, NULL),
(2330, 'Thị trấn Núi Đối', 361, NULL, NULL),
(2331, 'Xã Du Lễ', 361, NULL, NULL),
(2332, 'Xã Đại Đồng', 361, NULL, NULL),
(2333, 'Xã Đại Hà', 361, NULL, NULL),
(2334, 'Xã Đại Hợp', 361, NULL, NULL),
(2335, 'Xã Đoàn Xá', 361, NULL, NULL),
(2336, 'Xã Đông Phương', 361, NULL, NULL),
(2337, 'Xã Hữu Bằng', 361, NULL, NULL),
(2338, 'Xã Kiến Quốc', 361, NULL, NULL),
(2339, 'Xã Minh Tân', 361, NULL, NULL),
(2340, 'Xã Ngũ Đoan', 361, NULL, NULL),
(2341, 'Xã Ngũ Phúc', 361, NULL, NULL),
(2342, 'Xã Tân Phong', 361, NULL, NULL),
(2343, 'Xã Tân Trào', 361, NULL, NULL),
(2344, 'Xã Thanh Sơn', 361, NULL, NULL),
(2345, 'Xã Thuận Thiên', 361, NULL, NULL),
(2346, 'Xã Thụy Hương', 361, NULL, NULL),
(2347, 'Xã Tú Sơn', 361, NULL, NULL),
(2348, 'Thị trấn Núi Đèo', 362, NULL, NULL),
(2349, 'Thị trấn Minh Đức', 362, NULL, NULL),
(2350, 'Xã An Lư', 362, NULL, NULL),
(2351, 'Xã An Sơn', 362, NULL, NULL),
(2352, 'Xã Cao Nhân', 362, NULL, NULL),
(2353, 'Xã Chính Mỹ', 362, NULL, NULL),
(2354, 'Xã Đông Sơn', 362, NULL, NULL),
(2355, 'Xã Dương Quan', 362, NULL, NULL),
(2356, 'Xã Gia Đức', 362, NULL, NULL),
(2357, 'Xã Gia Minh', 362, NULL, NULL),
(2358, 'Xã Hòa Bình', 362, NULL, NULL),
(2359, 'Xã Hoa Động', 362, NULL, NULL),
(2360, 'Xã Hoàng Động', 362, NULL, NULL),
(2361, 'Xã Hợp Thành', 362, NULL, NULL),
(2362, 'Xã Kênh Giang', 362, NULL, NULL),
(2363, 'Xã Kiền Bái', 362, NULL, NULL),
(2364, 'Xã Kỳ Sơn', 362, NULL, NULL),
(2365, 'Xã Lại Xuân', 362, NULL, NULL),
(2366, 'Xã Lâm Động', 362, NULL, NULL),
(2367, 'Xã Lập Lễ', 362, NULL, NULL),
(2368, 'Xã Liên Khê', 362, NULL, NULL),
(2369, 'Xã Lưu Kiếm', 362, NULL, NULL),
(2370, 'Xã Lưu Kỳ', 362, NULL, NULL),
(2371, 'Xã Minh Tân', 362, NULL, NULL),
(2372, 'Xã Mỹ Đồng', 362, NULL, NULL),
(2373, 'Xã Ngũ Lão', 362, NULL, NULL),
(2374, 'Xã Phả Lễ', 362, NULL, NULL),
(2375, 'Xã Phù Ninh', 362, NULL, NULL),
(2376, 'Xã Phục Lễ', 362, NULL, NULL),
(2377, 'Xã Quảng Thanh', 362, NULL, NULL),
(2378, 'Xã Tam Hưng', 362, NULL, NULL),
(2379, 'Xã Tân Dương', 362, NULL, NULL),
(2380, 'Xã Thiên Hương', 362, NULL, NULL),
(2381, 'Xã Thủy Đường', 362, NULL, NULL),
(2382, 'Xã Thủy Sơn', 362, NULL, NULL),
(2383, 'Xã Thủy Triều', 362, NULL, NULL),
(2384, 'Xã Trung Hà', 362, NULL, NULL),
(2385, 'Thị trấn Tiên Lãng', 363, NULL, NULL),
(2386, 'Xã Bạch Đằng', 363, NULL, NULL),
(2387, 'Xã Bắc Hưng', 363, NULL, NULL),
(2388, 'Xã Cấp Tiến', 363, NULL, NULL),
(2389, 'Xã Đại Thắng', 363, NULL, NULL),
(2390, 'Xã Đoàn Lập', 363, NULL, NULL),
(2391, 'Xã Đông Hưng', 363, NULL, NULL),
(2392, 'Xã Hùng Thắng', 363, NULL, NULL),
(2393, 'Xã Khởi Nghĩa', 363, NULL, NULL),
(2394, 'Xã Kiến Thiết', 363, NULL, NULL),
(2395, 'Xã Nam Hưng', 363, NULL, NULL),
(2396, 'Xã Quang Phục', 363, NULL, NULL),
(2397, 'Xã Quyết Tiến', 363, NULL, NULL),
(2398, 'Xã Tân Hưng', 363, NULL, NULL),
(2399, 'Xã Tây Hưng', 363, NULL, NULL),
(2400, 'Xã Tiên Cường', 363, NULL, NULL),
(2401, 'Xã Tiên Minh', 363, NULL, NULL),
(2402, 'Xã Toàn Thắng', 363, NULL, NULL),
(2403, 'Xã Tự Cường', 363, NULL, NULL),
(2404, 'Xã Vinh Quang', 363, NULL, NULL),
(2405, 'Xã Vĩnh An', 363, NULL, NULL),
(2406, 'Thị trấn Vĩnh Bảo', 364, NULL, NULL),
(2407, 'Xã An Hòa', 364, NULL, NULL),
(2408, 'Xã Cổ Am', 364, NULL, NULL),
(2409, 'Xã Cao Minh', 364, NULL, NULL),
(2410, 'Xã Dũng Tiến', 364, NULL, NULL),
(2411, 'Xã Đồng Minh', 364, NULL, NULL),
(2412, 'Xã Giang Biên', 364, NULL, NULL),
(2413, 'Xã Hiệp Hòa', 364, NULL, NULL),
(2414, 'Xã Hòa Bình', 364, NULL, NULL),
(2415, 'Xã Hùng Tiến', 364, NULL, NULL),
(2416, 'Xã Hưng Nhân', 364, NULL, NULL),
(2417, 'Xã Nhân Hòa', 364, NULL, NULL),
(2418, 'Xã Liên Am', 364, NULL, NULL),
(2419, 'Xã Lý Học', 364, NULL, NULL),
(2420, 'Xã Tam Cường', 364, NULL, NULL),
(2421, 'Xã Tam Đa', 364, NULL, NULL),
(2422, 'Xã Tân Hưng', 364, NULL, NULL),
(2423, 'Xã Tân Liên', 364, NULL, NULL),
(2424, 'Xã Thanh Lương', 364, NULL, NULL),
(2425, 'Xã Thắng Thủy', 364, NULL, NULL),
(2426, 'Xã Tiền Phong', 364, NULL, NULL),
(2427, 'Xã Trấn Dương', 364, NULL, NULL),
(2428, 'Xã Trung Lập', 364, NULL, NULL),
(2429, 'Xã Việt Tiến', 364, NULL, NULL),
(2430, 'Xã Vĩnh An', 364, NULL, NULL),
(2431, 'Xã Vĩnh Long', 364, NULL, NULL),
(2432, 'Xã Vĩnh Phong', 364, NULL, NULL),
(2433, 'Xã Vinh Quang', 364, NULL, NULL),
(2434, 'Xã Vĩnh Tiến', 364, NULL, NULL),
(2435, 'Phường An Bình', 179, NULL, NULL),
(2436, 'Phường An Cư', 179, NULL, NULL),
(2437, 'Phường An Hoà', 179, NULL, NULL),
(2438, 'Phường An Hội', 179, NULL, NULL),
(2439, 'Phường An Khánh', 179, NULL, NULL),
(2440, 'Phường An Lạc', 179, NULL, NULL),
(2441, 'Phường An Nghiệp', 179, NULL, NULL),
(2442, 'Phường An Phú', 179, NULL, NULL),
(2443, 'Phường Cái Khế', 179, NULL, NULL),
(2444, 'Phường Hưng Lợi', 179, NULL, NULL),
(2445, 'Phường Tân An', 179, NULL, NULL),
(2446, 'Phường Thới Bình', 179, NULL, NULL),
(2447, 'Phường Xuân Khánh', 179, NULL, NULL),
(2448, 'Phường An Thới', 180, NULL, NULL),
(2449, 'Phường Bình Thủy', 180, NULL, NULL),
(2450, 'Phường Bùi Hữu Nghĩa', 180, NULL, NULL),
(2451, 'Phường Long Hòa', 180, NULL, NULL),
(2452, 'Phường Long Tuyền', 180, NULL, NULL),
(2453, 'Phường Thới An Đông', 180, NULL, NULL),
(2454, 'Phường Trà An', 180, NULL, NULL),
(2455, 'Phường Trà Nóc', 180, NULL, NULL),
(2456, 'Phường Ba Láng', 181, NULL, NULL),
(2457, 'Phường Hưng Phú', 181, NULL, NULL),
(2458, 'Phường Hưng Thạnh', 181, NULL, NULL),
(2459, 'Phường Lê Bình', 181, NULL, NULL),
(2460, 'Phường Phú Thứ', 181, NULL, NULL),
(2461, 'Phường Tân Phú', 181, NULL, NULL),
(2462, 'Phường Thường Thạnh', 181, NULL, NULL),
(2463, 'Phường Châu Văn Liêm', 182, NULL, NULL),
(2464, 'Phường Long Hưng', 182, NULL, NULL),
(2465, 'Phường Phước Thới', 182, NULL, NULL),
(2466, 'Phường Thới An', 182, NULL, NULL),
(2467, 'Phường Thới Hoà', 182, NULL, NULL),
(2468, 'Phường Thới Long', 182, NULL, NULL),
(2469, 'Phường Trường Lạc', 182, NULL, NULL),
(2470, 'Phường Tân Hưng', 183, NULL, NULL),
(2471, 'Phường Tân Lộc', 183, NULL, NULL),
(2472, 'Phường Thạnh Hoà', 183, NULL, NULL),
(2473, 'Phường Thốt Nốt', 183, NULL, NULL),
(2474, 'Phường Thới Thuận', 183, NULL, NULL),
(2475, 'Phường Thuận An', 183, NULL, NULL),
(2476, 'Phường Thuận Hưng', 183, NULL, NULL),
(2477, 'Phường Trung Kiên', 183, NULL, NULL),
(2478, 'Phường Trung Nhứt', 183, NULL, NULL),
(2479, 'Thị trấn Cờ Đỏ', 184, NULL, NULL),
(2480, 'Xã Đông Hiệp', 184, NULL, NULL),
(2481, 'Xã Đông Thắng', 184, NULL, NULL),
(2482, 'Xã Thạnh Phú', 184, NULL, NULL),
(2483, 'Xã Thới Đông', 184, NULL, NULL),
(2484, 'Xã Thới Hưng', 184, NULL, NULL),
(2485, 'Xã Thới Xuân', 184, NULL, NULL),
(2486, 'Xã Trung An', 184, NULL, NULL),
(2487, 'Xã Trung Hưng', 184, NULL, NULL),
(2488, 'Xã Trung Thạnh', 184, NULL, NULL),
(2489, 'Thị trấn Phong Điền', 185, NULL, NULL),
(2490, 'Xã Giai Xuân', 185, NULL, NULL),
(2491, 'Xã Mỹ Khánh', 185, NULL, NULL),
(2492, 'Xã Nhơn Ái', 185, NULL, NULL),
(2493, 'Xã Nhơn Nghĩa', 185, NULL, NULL),
(2494, 'Xã Tân Thới', 185, NULL, NULL),
(2495, 'Xã Trường Long', 185, NULL, NULL),
(2496, 'Thị trấn Thới Lai', 186, NULL, NULL),
(2497, 'Xã Định Môn', 186, NULL, NULL),
(2498, 'Xã Đông Bình', 186, NULL, NULL),
(2499, 'Xã Đông Thuận', 186, NULL, NULL),
(2500, 'Xã Tân Thạnh', 186, NULL, NULL),
(2501, 'Xã Thới Tân', 186, NULL, NULL),
(2502, 'Xã Thới Thạnh', 186, NULL, NULL),
(2503, 'Xã Trường Thắng', 186, NULL, NULL),
(2504, 'Xã Trường Thành', 186, NULL, NULL),
(2505, 'Xã Trường Xuân', 186, NULL, NULL),
(2506, 'Xã Trường Xuân A', 186, NULL, NULL),
(2507, 'Xã Trường Xuân B', 186, NULL, NULL),
(2508, 'Xã Xuân Thắng', 186, NULL, NULL),
(2509, 'Thị trấn Vĩnh Thạnh', 187, NULL, NULL),
(2510, 'Thị trấn Thạnh An', 187, NULL, NULL),
(2511, 'Xã Thạnh An', 187, NULL, NULL),
(2512, 'Xã Thạnh Lộc', 187, NULL, NULL),
(2513, 'Xã Thạnh Lợi', 187, NULL, NULL),
(2514, 'Xã Thạnh Mỹ', 187, NULL, NULL),
(2515, 'Xã Thạnh Quới', 187, NULL, NULL),
(2516, 'Xã Thạnh Thắng', 187, NULL, NULL),
(2517, 'Xã Thạnh Tiến', 187, NULL, NULL),
(2518, 'Xã Vĩnh Bình', 187, NULL, NULL),
(2519, 'Xã Vĩnh Trinh', 187, NULL, NULL),
(2520, 'Phường An Bình', 239, NULL, NULL),
(2521, 'Phường An Hòa', 239, NULL, NULL),
(2522, 'Phường Bình Đa', 239, NULL, NULL),
(2523, 'Phường Bửu Hòa', 239, NULL, NULL),
(2524, 'Phường Bửu Long', 239, NULL, NULL),
(2525, 'Phường Hiệp Hòa', 239, NULL, NULL),
(2526, 'Phường Hóa An', 239, NULL, NULL),
(2527, 'Phường Hòa Bình', 239, NULL, NULL),
(2528, 'Phường Hố Nai', 239, NULL, NULL),
(2529, 'Phường Long Bình', 239, NULL, NULL),
(2530, 'Phường Long Bình Tân', 239, NULL, NULL),
(2531, 'Phường Phước Tân', 239, NULL, NULL),
(2532, 'Phường Quang Vinh', 239, NULL, NULL);
INSERT INTO `khuvuc` (`KhuVucID`, `TenKhuVuc`, `ParentKhuVucID`, `ViDo`, `KinhDo`) VALUES
(2533, 'Phường Quyết Thắng', 239, NULL, NULL),
(2534, 'Phường Tam Hiệp', 239, NULL, NULL),
(2535, 'Phường Tam Hòa', 239, NULL, NULL),
(2536, 'Phường Tam Phước', 239, NULL, NULL),
(2537, 'Phường Tân Biên', 239, NULL, NULL),
(2538, 'Phường Tân Hạnh', 239, NULL, NULL),
(2539, 'Phường Tân Hiệp', 239, NULL, NULL),
(2540, 'Phường Tân Hòa', 239, NULL, NULL),
(2541, 'Phường Tân Mai', 239, NULL, NULL),
(2542, 'Phường Tân Phong', 239, NULL, NULL),
(2543, 'Phường Tân Tiến', 239, NULL, NULL),
(2544, 'Phường Tân Vạn', 239, NULL, NULL),
(2545, 'Phường Thanh Bình', 239, NULL, NULL),
(2546, 'Phường Thống Nhất', 239, NULL, NULL),
(2547, 'Phường Trảng Dài', 239, NULL, NULL),
(2548, 'Phường Trung Dũng', 239, NULL, NULL),
(2549, 'Xã Long Hưng', 239, NULL, NULL),
(2550, 'Phường Bảo Vinh', 240, NULL, NULL),
(2551, 'Phường Bàu Sen', 240, NULL, NULL),
(2552, 'Phường Phú Bình', 240, NULL, NULL),
(2553, 'Phường Suối Tre', 240, NULL, NULL),
(2554, 'Phường Xuân An', 240, NULL, NULL),
(2555, 'Phường Xuân Bình', 240, NULL, NULL),
(2556, 'Phường Xuân Hòa', 240, NULL, NULL),
(2557, 'Phường Xuân Lập', 240, NULL, NULL),
(2558, 'Phường Xuân Tân', 240, NULL, NULL),
(2559, 'Phường Xuân Thanh', 240, NULL, NULL),
(2560, 'Phường Xuân Trung', 240, NULL, NULL),
(2561, 'Xã Bảo Quang', 240, NULL, NULL),
(2562, 'Xã Bàu Trâm', 240, NULL, NULL),
(2563, 'Xã Bình Lộc', 240, NULL, NULL),
(2564, 'Xã Hàng Gòn', 240, NULL, NULL),
(2565, 'Thị trấn Tân Phú', 241, NULL, NULL),
(2566, 'Xã Đắc Lua', 241, NULL, NULL),
(2567, 'Xã Nam Cát Tiên', 241, NULL, NULL),
(2568, 'Xã Núi Tượng', 241, NULL, NULL),
(2569, 'Xã Phú An', 241, NULL, NULL),
(2570, 'Xã Phú Bình', 241, NULL, NULL),
(2571, 'Xã Phú Điền', 241, NULL, NULL),
(2572, 'Xã Phú Lập', 241, NULL, NULL),
(2573, 'Xã Phú Lộc', 241, NULL, NULL),
(2574, 'Xã Phú Sơn', 241, NULL, NULL),
(2575, 'Xã Phú Thanh', 241, NULL, NULL),
(2576, 'Xã Phú Thịnh', 241, NULL, NULL),
(2577, 'Xã Phú Trung', 241, NULL, NULL),
(2578, 'Xã Phú Xuân', 241, NULL, NULL),
(2579, 'Xã Tà Lài', 241, NULL, NULL),
(2580, 'Xã Thanh Sơn', 241, NULL, NULL),
(2581, 'Xã Trà Cổ', 241, NULL, NULL),
(2582, 'Thị trấn Vĩnh An', 242, NULL, NULL),
(2583, 'Xã Bình Hòa', 242, NULL, NULL),
(2584, 'Xã Bình Lợi', 242, NULL, NULL),
(2585, 'Xã Hiếu Liêm', 242, NULL, NULL),
(2586, 'Xã Mã Đà', 242, NULL, NULL),
(2587, 'Xã Phú Lý', 242, NULL, NULL),
(2588, 'Xã Tân An', 242, NULL, NULL),
(2589, 'Xã Tân Bình', 242, NULL, NULL),
(2590, 'Xã Thạnh Phú', 242, NULL, NULL),
(2591, 'Xã Thiện Tân', 242, NULL, NULL),
(2592, 'Xã Trị An', 242, NULL, NULL),
(2593, 'Xã Vĩnh Tân', 242, NULL, NULL),
(2594, 'Thị trấn Định Quán', 243, NULL, NULL),
(2595, 'Xã Gia Canh', 243, NULL, NULL),
(2596, 'Xã La Ngà', 243, NULL, NULL),
(2597, 'Xã Ngọc Định', 243, NULL, NULL),
(2598, 'Xã Phú Cường', 243, NULL, NULL),
(2599, 'Xã Phú Hòa', 243, NULL, NULL),
(2600, 'Xã Phú Lợi', 243, NULL, NULL),
(2601, 'Xã Phú Ngọc', 243, NULL, NULL),
(2602, 'Xã Phú Tân', 243, NULL, NULL),
(2603, 'Xã Phú Túc', 243, NULL, NULL),
(2604, 'Xã Phú Vinh', 243, NULL, NULL),
(2605, 'Xã Suối Nho', 243, NULL, NULL),
(2606, 'Xã Túc Trưng', 243, NULL, NULL),
(2607, 'Xã Thanh Sơn', 243, NULL, NULL),
(2608, 'Thị trấn Trảng Bom', 244, NULL, NULL),
(2609, 'Xã An Viễn', 244, NULL, NULL),
(2610, 'Xã Bàu Hàm', 244, NULL, NULL),
(2611, 'Xã Bình Minh', 244, NULL, NULL),
(2612, 'Xã Cây Gáo', 244, NULL, NULL),
(2613, 'Xã Đồi 61', 244, NULL, NULL),
(2614, 'Xã Đông Hòa', 244, NULL, NULL),
(2615, 'Xã Giang Điền', 244, NULL, NULL),
(2616, 'Xã Hố Nai 3', 244, NULL, NULL),
(2617, 'Xã Hưng Thịnh', 244, NULL, NULL),
(2618, 'Xã Quảng Tiến', 244, NULL, NULL),
(2619, 'Xã Sông Thao', 244, NULL, NULL),
(2620, 'Xã Sông Trầu', 244, NULL, NULL),
(2621, 'Xã Tây Hòa', 244, NULL, NULL),
(2622, 'Xã Thanh Bình', 244, NULL, NULL),
(2623, 'Xã Trung Hòa', 244, NULL, NULL),
(2624, 'Thị trấn Dầu Giây', 245, NULL, NULL),
(2625, 'Xã Bàu Hàm 2', 245, NULL, NULL),
(2626, 'Xã Gia Kiệm', 245, NULL, NULL),
(2627, 'Xã Gia Tân 1', 245, NULL, NULL),
(2628, 'Xã Gia Tân 2', 245, NULL, NULL),
(2629, 'Xã Gia Tân 3', 245, NULL, NULL),
(2630, 'Xã Hưng Lộc', 245, NULL, NULL),
(2631, 'Xã Lộ 25', 245, NULL, NULL),
(2632, 'Xã Quang Trung', 245, NULL, NULL),
(2633, 'Xã Xuân Thiện', 245, NULL, NULL),
(2634, 'Thị trấn Long Giao', 246, NULL, NULL),
(2635, 'Xã Bảo Bình', 246, NULL, NULL),
(2636, 'Xã Lâm San', 246, NULL, NULL),
(2637, 'Xã Nhân Nghĩa', 246, NULL, NULL),
(2638, 'Xã Sông Nhạn', 246, NULL, NULL),
(2639, 'Xã Sông Ray', 246, NULL, NULL),
(2640, 'Xã Thừa Đức', 246, NULL, NULL),
(2641, 'Xã Xuân Bảo', 246, NULL, NULL),
(2642, 'Xã Xuân Đông', 246, NULL, NULL),
(2643, 'Xã Xuân Đường', 246, NULL, NULL),
(2644, 'Xã Xuân Mỹ', 246, NULL, NULL),
(2645, 'Xã Xuân Quế', 246, NULL, NULL),
(2646, 'Xã Xuân Tây', 246, NULL, NULL),
(2647, 'Thị trấn Long Thành', 247, NULL, NULL),
(2648, 'Xã An Phước', 247, NULL, NULL),
(2649, 'Xã Bàu Cạn', 247, NULL, NULL),
(2650, 'Xã Bình An', 247, NULL, NULL),
(2651, 'Xã Bình Sơn', 247, NULL, NULL),
(2652, 'Xã Cẩm Đường', 247, NULL, NULL),
(2653, 'Xã Long An', 247, NULL, NULL),
(2654, 'Xã Long Đức', 247, NULL, NULL),
(2655, 'Xã Long Phước', 247, NULL, NULL),
(2656, 'Xã Phước Bình', 247, NULL, NULL),
(2657, 'Xã Phước Thái', 247, NULL, NULL),
(2658, 'Xã Tam An', 247, NULL, NULL),
(2659, 'Xã Tân Hiệp', 247, NULL, NULL),
(2660, 'Thị trấn Gia Ray', 248, NULL, NULL),
(2661, 'Xã Bảo Hòa', 248, NULL, NULL),
(2662, 'Xã Lang Minh', 248, NULL, NULL),
(2663, 'Xã Suối Cao', 248, NULL, NULL),
(2664, 'Xã Suối Cát', 248, NULL, NULL),
(2665, 'Xã Xuân Bắc', 248, NULL, NULL),
(2666, 'Xã Xuân Định', 248, NULL, NULL),
(2667, 'Xã Xuân Hiệp', 248, NULL, NULL),
(2668, 'Xã Xuân Hòa', 248, NULL, NULL),
(2669, 'Xã Xuân Hưng', 248, NULL, NULL),
(2670, 'Xã Xuân Phú', 248, NULL, NULL),
(2671, 'Xã Xuân Tâm', 248, NULL, NULL),
(2672, 'Xã Xuân Thành', 248, NULL, NULL),
(2673, 'Xã Xuân Thọ', 248, NULL, NULL),
(2674, 'Xã Xuân Trường', 248, NULL, NULL),
(2675, 'Thị trấn Hiệp Phước', 249, NULL, NULL),
(2676, 'Xã Đại Phước', 249, NULL, NULL),
(2677, 'Xã Long Tân', 249, NULL, NULL),
(2678, 'Xã Long Thọ', 249, NULL, NULL),
(2679, 'Xã Phú Đông', 249, NULL, NULL),
(2680, 'Xã Phú Hội', 249, NULL, NULL),
(2681, 'Xã Phú Thạnh', 249, NULL, NULL),
(2682, 'Xã Phú Hữu', 249, NULL, NULL),
(2683, 'Xã Phước An', 249, NULL, NULL),
(2684, 'Xã Phước Khánh', 249, NULL, NULL),
(2685, 'Xã Phước Thiền', 249, NULL, NULL),
(2686, 'Xã Vĩnh Thanh', 249, NULL, NULL),
(2687, 'Phường Chánh Mỹ', 140, NULL, NULL),
(2688, 'Phường Chánh Nghĩa', 140, NULL, NULL),
(2689, 'Phường Định Hòa', 140, NULL, NULL),
(2690, 'Phường Hiệp An', 140, NULL, NULL),
(2691, 'Phường Hiệp Thành', 140, NULL, NULL),
(2692, 'Phường Hòa Phú', 140, NULL, NULL),
(2693, 'Phường Phú Cường', 140, NULL, NULL),
(2694, 'Phường Phú Hòa', 140, NULL, NULL),
(2695, 'Phường Phú Lợi', 140, NULL, NULL),
(2696, 'Phường Phú Mỹ', 140, NULL, NULL),
(2697, 'Phường Phú Tân', 140, NULL, NULL),
(2698, 'Phường Phú Thọ', 140, NULL, NULL),
(2699, 'Phường Tân An', 140, NULL, NULL),
(2700, 'Phường Tương Bình Hiệp', 140, NULL, NULL),
(2701, 'Phường An Bình', 141, NULL, NULL),
(2702, 'Phường Bình An', 141, NULL, NULL),
(2703, 'Phường Bình Thắng', 141, NULL, NULL),
(2704, 'Phường Dĩ An', 141, NULL, NULL),
(2705, 'Phường Đông Hòa', 141, NULL, NULL),
(2706, 'Phường Tân Bình', 141, NULL, NULL),
(2707, 'Phường Tân Đông Hiệp', 141, NULL, NULL),
(2708, 'Phường An Phú', 142, NULL, NULL),
(2709, 'Phường An Thạnh', 142, NULL, NULL),
(2710, 'Phường Bình Chuẩn', 142, NULL, NULL),
(2711, 'Phường Bình Hòa', 142, NULL, NULL),
(2712, 'Phường Bình Nhâm', 142, NULL, NULL),
(2713, 'Phường Hưng Định', 142, NULL, NULL),
(2714, 'Phường Lái Thiêu', 142, NULL, NULL),
(2715, 'Phường Thuận Giao', 142, NULL, NULL),
(2716, 'Phường Vĩnh Phú', 142, NULL, NULL),
(2717, 'Xã An Sơn', 142, NULL, NULL),
(2718, 'Phường Hội Nghĩa', 143, NULL, NULL),
(2719, 'Phường Khánh Bình', 143, NULL, NULL),
(2720, 'Phường Phú Chánh', 143, NULL, NULL),
(2721, 'Phường Tân Hiệp', 143, NULL, NULL),
(2722, 'Phường Tân Phước Khánh', 143, NULL, NULL),
(2723, 'Phường Thái Hòa', 143, NULL, NULL),
(2724, 'Phường Thạnh Phước', 143, NULL, NULL),
(2725, 'Phường Uyên Hưng', 143, NULL, NULL),
(2726, 'Phường Vĩnh Tân', 143, NULL, NULL),
(2727, 'Phường Thạnh Hội', 143, NULL, NULL),
(2728, 'Xã Bạch Đằng', 143, NULL, NULL),
(2729, 'Xã Tân Vĩnh Hiệp', 143, NULL, NULL),
(2730, 'Phường An Điền', 144, NULL, NULL),
(2731, 'Phường An Tây', 144, NULL, NULL),
(2732, 'Phường Chánh Phú Hòa', 144, NULL, NULL),
(2733, 'Phường Hòa Lợi', 144, NULL, NULL),
(2734, 'Phường Mỹ Phước', 144, NULL, NULL),
(2735, 'Phường Tân Định', 144, NULL, NULL),
(2736, 'Phường Thới Hòa', 144, NULL, NULL),
(2737, 'Xã Phú An', 144, NULL, NULL),
(2738, 'Thị trấn Lai Uyên', 145, NULL, NULL),
(2739, 'Xã Cây Trường II', 145, NULL, NULL),
(2740, 'Xã Hưng Hòa', 145, NULL, NULL),
(2741, 'Xã Lai Hưng', 145, NULL, NULL),
(2742, 'Xã Long Nguyên', 145, NULL, NULL),
(2743, 'Xã Tân Hưng', 145, NULL, NULL),
(2744, 'Xã Trừ Văn Thố', 145, NULL, NULL),
(2745, 'Thị trấn Tân Thành', 146, NULL, NULL),
(2746, 'Xã Bình Mỹ', 146, NULL, NULL),
(2747, 'Xã Đất Cuốc', 146, NULL, NULL),
(2748, 'Xã Hiếu Liêm', 146, NULL, NULL),
(2749, 'Xã Lạc An', 146, NULL, NULL),
(2750, 'Xã Tân Bình', 146, NULL, NULL),
(2751, 'Xã Tân Định', 146, NULL, NULL),
(2752, 'Xã Tân Lập', 146, NULL, NULL),
(2753, 'Xã Tân Mỹ', 146, NULL, NULL),
(2754, 'Xã Thường Tân', 146, NULL, NULL),
(2755, 'Thị trấn Dầu Tiếng', 147, NULL, NULL),
(2756, 'Xã An Lập', 147, NULL, NULL),
(2757, 'Xã Định An', 147, NULL, NULL),
(2758, 'Xã Định Hiệp', 147, NULL, NULL),
(2759, 'Xã Định Thành', 147, NULL, NULL),
(2760, 'Xã Long Hòa', 147, NULL, NULL),
(2761, 'Xã Long Tân', 147, NULL, NULL),
(2762, 'Xã Minh Hòa', 147, NULL, NULL),
(2763, 'Xã Minh Tân', 147, NULL, NULL),
(2764, 'Xã Minh Thạnh', 147, NULL, NULL),
(2765, 'Xã Thanh An', 147, NULL, NULL),
(2766, 'Xã Thanh Tuyền', 147, NULL, NULL),
(2767, 'Thị trấn Phước Vĩnh', 148, NULL, NULL),
(2768, 'Xã An Bình', 148, NULL, NULL),
(2769, 'Xã An Linh', 148, NULL, NULL),
(2770, 'Xã An Long', 148, NULL, NULL),
(2771, 'Xã An Thái', 148, NULL, NULL),
(2772, 'Xã Phước Hòa', 148, NULL, NULL),
(2773, 'Xã Phước Sang', 148, NULL, NULL),
(2774, 'Xã Tam Lập', 148, NULL, NULL),
(2775, 'Xã Tân Hiệp', 148, NULL, NULL),
(2776, 'Xã Tân Long', 148, NULL, NULL),
(2777, 'Xã Vĩnh Hòa', 148, NULL, NULL),
(2778, 'phường tối thượng', 720, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kyc_verification`
--

CREATE TABLE `kyc_verification` (
  `KYCVerificationID` bigint(20) NOT NULL,
  `NguoiDungID` int(11) NOT NULL,
  `SoCCCD` varchar(12) DEFAULT NULL,
  `TenDayDu` varchar(255) DEFAULT NULL,
  `NgaySinh` date DEFAULT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `NgayCapCCCD` date DEFAULT NULL,
  `FaceSimilarity` decimal(5,4) DEFAULT NULL COMMENT 'Độ tương đồng khuôn mặt (0-1)',
  `TrangThai` enum('ThanhCong','ThatBai','CanXemLai') DEFAULT 'CanXemLai',
  `LyDoThatBai` text DEFAULT NULL,
  `AnhCCCDMatTruoc` varchar(255) DEFAULT NULL,
  `AnhCCCDMatSau` varchar(255) DEFAULT NULL,
  `AnhSelfie` varchar(255) DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kyc_verification`
--

INSERT INTO `kyc_verification` (`KYCVerificationID`, `NguoiDungID`, `SoCCCD`, `TenDayDu`, `NgaySinh`, `DiaChi`, `NgayCapCCCD`, `FaceSimilarity`, `TrangThai`, `LyDoThatBai`, `AnhCCCDMatTruoc`, `AnhCCCDMatSau`, `AnhSelfie`, `TaoLuc`) VALUES
(4, 1, '060203002124', 'Võ Nguyễn Hoành Hợp', '2003-11-11', '15, Đường Hà Huy Tập, Chợ Lầu, Bắc Bình, Bình Thuận', '2021-04-19', 0.5342, 'ThanhCong', NULL, 'uploads/kyc/cccd_front/cccdFront-1765321411252-802351615.jpg', 'uploads/kyc/cccd_back/cccdBack-1765321411516-913353662.jpg', 'uploads/kyc/selfie/selfie-1765321411647-785567275.jpg', '2025-12-10 06:03:31');

-- --------------------------------------------------------

--
-- Table structure for table `lichlamviec`
--

CREATE TABLE `lichlamviec` (
  `LichID` int(11) NOT NULL,
  `NhanVienBanHangID` int(11) DEFAULT NULL,
  `BatDau` datetime DEFAULT NULL,
  `KetThuc` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lichlamviec`
--

INSERT INTO `lichlamviec` (`LichID`, `NhanVienBanHangID`, `BatDau`, `KetThuc`) VALUES
(11, 8, '2025-11-18 07:00:00', '2025-11-18 15:00:00'),
(14, 8, '2025-11-21 12:00:00', '2025-11-21 20:00:00'),
(15, 8, '2025-11-25 07:00:00', '2025-11-25 15:00:00'),
(16, 230, '2025-11-28 07:00:00', '2025-11-28 15:00:00'),
(17, 230, '2025-11-26 07:00:00', '2025-11-26 15:00:00'),
(18, 8, '2025-11-30 07:00:00', '2025-11-30 15:00:00'),
(19, 8, '2025-12-01 07:00:00', '2025-12-01 15:00:00'),
(20, 8, '2025-12-06 07:00:00', '2025-12-06 15:00:00'),
(21, 8, '2025-12-02 07:00:00', '2025-12-02 15:00:00'),
(22, 8, '2025-12-02 15:00:00', '2025-12-02 23:00:00'),
(23, 8, '2025-12-10 07:00:00', '2025-12-10 15:00:00'),
(24, 8, '2025-12-10 15:00:00', '2025-12-10 23:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `lich_su_vi`
--

CREATE TABLE `lich_su_vi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `ma_giao_dich` varchar(50) NOT NULL,
  `so_tien` decimal(18,2) NOT NULL,
  `trang_thai` enum('THANH_CONG','CHO_XU_LY') NOT NULL DEFAULT 'CHO_XU_LY',
  `thoi_gian` timestamp NULL DEFAULT current_timestamp(),
  `LoaiGiaoDich` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `lich_su_vi`
--

INSERT INTO `lich_su_vi` (`id`, `user_id`, `ma_giao_dich`, `so_tien`, `trang_thai`, `thoi_gian`, `LoaiGiaoDich`) VALUES
(4, 1, 'GD1234567', 100000.00, 'THANH_CONG', '2025-11-23 12:18:11', 'nap'),
(5, 1, 'GD12345678', 50000.00, 'THANH_CONG', '2025-11-23 12:26:09', 'nap'),
(7, 1, 'GD123456789', 50000.00, 'THANH_CONG', '2025-11-23 12:27:33', 'nap'),
(8, 1, 'GD1234567899', 50000.00, 'THANH_CONG', '2025-11-23 12:29:13', 'nap'),
(9, 1, 'GD12345628', 50000.00, 'THANH_CONG', '2025-11-23 12:30:44', 'nap'),
(10, 1, 'GD123445628', 50000.00, 'THANH_CONG', '2025-11-23 12:31:58', 'rut'),
(11, 7, 'NAP_7_1764161436846', 10000.00, 'THANH_CONG', '2025-11-26 12:50:37', 'nap'),
(12, 7, 'COC_6_4_1764162117665', 10000.00, 'THANH_CONG', '2025-11-26 13:01:57', 'rut'),
(13, 7, 'COC_6_4_1764165433619', 10000.00, 'THANH_CONG', '2025-11-26 13:57:13', 'rut'),
(14, 7, 'COC_6_4_1764167149181', 10000.00, 'THANH_CONG', '2025-11-26 14:25:49', 'rut'),
(15, 7, 'HOAN_COC_HD_6_1764317500702', 10000.00, 'THANH_CONG', '2025-11-28 08:11:40', 'hoan_coc'),
(16, 7, 'RUT_1_1764318779765', 10000.00, 'THANH_CONG', '2025-11-28 08:32:59', 'rut_tien'),
(17, 245, 'NAP_245_1764319172821', 3000000000.00, 'THANH_CONG', '2025-11-28 08:39:32', 'nap'),
(18, 245, 'COC_8_5_1764319343156', 3000000.00, 'THANH_CONG', '2025-11-28 08:42:23', 'rut'),
(19, 245, 'COC_9_7_1764319972798', 7700000.00, 'THANH_CONG', '2025-11-28 08:52:52', 'rut'),
(20, 7, 'NAP_7_1764340927092', 10000.00, 'THANH_CONG', '2025-11-28 14:42:07', 'nap'),
(21, 7, 'RUT_2_1764340960572', 10000.00, 'THANH_CONG', '2025-11-28 14:42:40', 'rut_tien'),
(22, 7, 'COC_5_4_1764341359998', 10000.00, 'THANH_CONG', '2025-11-28 14:49:20', 'rut'),
(23, 7, 'HOAN_COC_HD_9_1764342018899', 10000.00, 'THANH_CONG', '2025-11-28 15:00:18', 'hoan_coc'),
(24, 7, 'NAP_7_1764383135693', 10000.00, 'THANH_CONG', '2025-11-29 02:25:37', 'nap'),
(25, 7, 'RUT_3_1764383187748', 10000.00, 'THANH_CONG', '2025-11-29 02:26:27', 'rut_tien'),
(26, 245, 'COC_4_1_1764383310990', 3500000.00, 'THANH_CONG', '2025-11-29 02:28:31', 'rut'),
(27, 245, 'NAP_245_1764384148889', 10000.00, 'THANH_CONG', '2025-11-29 02:42:30', 'nap'),
(28, 245, 'RUT_4_1764384178589', 10000.00, 'CHO_XU_LY', '2025-11-29 02:42:58', 'rut_tien'),
(29, 7, 'NAP_7_1764389825871', 10000.00, 'THANH_CONG', '2025-11-29 04:17:06', 'nap'),
(30, 7, 'COC_4_1_1764389925281', 3500000.00, 'THANH_CONG', '2025-11-29 04:18:46', 'rut'),
(31, 7, 'COC_4_1_1764389926865', 3500000.00, 'THANH_CONG', '2025-11-29 04:18:47', 'rut'),
(32, 245, 'COC_4_2_1765297821251', 4000000.00, 'THANH_CONG', '2025-12-09 16:30:19', 'rut'),
(33, 245, 'NAP_245_1765297850591', 10000.00, 'THANH_CONG', '2025-12-09 16:30:49', 'nap'),
(34, 245, 'NAP_245_1765298729079', 11000.00, 'THANH_CONG', '2025-12-09 16:45:27', 'nap'),
(35, 245, 'COC_5_3_1765303791024', 3000000.00, 'THANH_CONG', '2025-12-09 18:09:51', 'rut'),
(36, 245, 'COC_4_1_1765304349181', 3500000.00, 'THANH_CONG', '2025-12-09 18:19:09', 'rut'),
(37, 245, 'NAP_245_1765304380502', 10000.00, 'CHO_XU_LY', '2025-12-09 18:19:40', 'nap'),
(38, 245, 'NAP_245_1765304900508', 11000.00, 'CHO_XU_LY', '2025-12-09 18:28:21', 'nap'),
(39, 245, 'COC_4_1_1765305116024', 3500000.00, 'THANH_CONG', '2025-12-09 18:31:57', 'rut'),
(40, 245, 'COC_4_1_1765305117471', 3500000.00, 'THANH_CONG', '2025-12-09 18:31:57', 'rut'),
(41, 245, 'NAP_245_1765305291135', 10000.00, 'CHO_XU_LY', '2025-12-09 18:34:51', 'nap'),
(42, 245, 'NAP_245_1765305457088', 10000.00, 'CHO_XU_LY', '2025-12-09 18:37:38', 'nap'),
(43, 245, 'NAP_245_1765305576011', 10000.00, 'CHO_XU_LY', '2025-12-09 18:39:36', 'nap'),
(44, 245, 'NAP_245_1765305745318', 20000.00, 'CHO_XU_LY', '2025-12-09 18:42:26', 'nap'),
(45, 245, 'NAP_245_1765307040619', 10000.00, 'CHO_XU_LY', '2025-12-09 19:04:01', 'nap'),
(46, 245, 'COC_4_2_1765327370143', 4000000.00, 'THANH_CONG', '2025-12-10 00:42:50', 'rut');

-- --------------------------------------------------------

--
-- Table structure for table `mauhopdong`
--

CREATE TABLE `mauhopdong` (
  `MauHopDongID` int(11) NOT NULL,
  `TieuDe` varchar(255) DEFAULT NULL,
  `NoiDungMau` text DEFAULT NULL,
  `FileURL` varchar(255) DEFAULT NULL,
  `PhienBan` varchar(50) DEFAULT NULL,
  `TrangThai` varchar(50) DEFAULT NULL,
  `TaoBoiAdminID` int(11) DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mauhopdong`
--

INSERT INTO `mauhopdong` (`MauHopDongID`, `TieuDe`, `NoiDungMau`, `FileURL`, `PhienBan`, `TrangThai`, `TaoBoiAdminID`, `TaoLuc`, `CapNhatLuc`) VALUES
(1, 'Hợp đồng cọc', '<div style=\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\">\n\n    <div style=\"text-align: center; margin-bottom: 20px;\">\n        <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\n        <p style=\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\">Độc lập - Tự do - Hạnh phúc</p>\n    </div>\n\n    <p style=\"text-align: right; margin-bottom: 30px; font-style: italic;\">\n        .........., ngày .... tháng .... năm ....\n    </p>\n\n    <h1 style=\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\">\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\n    </h1>\n\n    <div style=\"margin-bottom: 20px; font-style: italic;\">\n        <p style=\"margin: 5px 0;\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức Sở Hữu Trí Tuệ Thế Giới+1</p>\n        <p style=\"margin: 5px 0;\">Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;</p>\n        <p style=\"margin: 5px 0;\">Căn cứ vào nhu cầu và sự thỏa thuận của các bên tham gia Hợp đồng;</p>\n    </div>\n\n    <p style=\"margin-bottom: 20px;\">Hôm nay, ngày ……. tháng ……. năm ……, các Bên gồm:</p>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN CHO THUÊ (Bên A):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên (chủ trọ): ………………………………………</p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: …../…../….</p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: ………………… Ngày cấp: ……… Nơi cấp: ……………</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN THUÊ (Bên B):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Họ và tên: ………………………………………</p>\n            <p style=\"margin: 5px 0;\">Ngày sinh: …../…../….</p>\n            <p style=\"margin: 5px 0;\">CCCD / CMND số: ………………… Ngày cấp: ……… Nơi cấp: …………</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ thường trú: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <strong style=\"text-transform: uppercase;\">BÊN GIỮ CỌC (Bên C – Hommy):</strong>\n        <div style=\"margin-left: 20px;\">\n            <p style=\"margin: 5px 0;\">Tên công ty: <strong>Hommy</strong></p>\n            <p style=\"margin: 5px 0;\">Mã số doanh nghiệp: ………………………………</p>\n            <p style=\"margin: 5px 0;\">Đại diện: ………………………….. (tên + chức vụ)</p>\n            <p style=\"margin: 5px 0;\">Địa chỉ trụ sở: …………………………………………………</p>\n            <p style=\"margin: 5px 0;\">Số điện thoại: ……………………………</p>\n            <p style=\"margin: 5px 0; font-style: italic; text-decoration: underline;\">Tài khoản ngân hàng để nhận cọc:</p>\n            <ul style=\"margin: 5px 0 0 20px; list-style-type: none; padding: 0;\">\n                <li>Ngân hàng: ………………………………</li>\n                <li>Số tài khoản: …………………………</li>\n                <li>Chủ tài khoản: …………………………</li>\n            </ul>\n        </div>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 1. Nhà ở & Tài sản kèm theo</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A đồng ý cho Bên B thuê và Bên B thuê quyền sử dụng một căn nhà / phòng tại địa chỉ: …………………………….. / số phòng: .....</p>\n        <p style=\"margin: 5px 0;\">Diện tích nhà / phòng: ……… m²</p>\n        <p style=\"margin: 5px 0;\">Nội thất, trang thiết bị và đồ đạc bàn giao kèm (nếu có):</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc;\">\n            <li>Giường: ………</li>\n            <li>Tủ quần áo: ………</li>\n            <li>Bàn ghế: ………</li>\n            <li>Máy lạnh / quạt: ………</li>\n            <li>Khác (liệt kê): ………………………</li>\n        </ul>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên A cam kết quyền sở hữu / quyền sử dụng hợp pháp căn nhà / phòng cho thuê.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 2. Bàn giao & sử dụng</p>\n        <p style=\"margin: 5px 0;\">Thời điểm bàn giao tài sản cho Bên B: ngày ……. tháng ……. năm …….</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Kể từ khi bàn giao, Bên B được sử dụng toàn quyền phần tài sản thuê theo mục đích thỏa thuận (chỉ để ở, v.v.).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 3. Thời hạn thuê</p>\n        <p style=\"margin: 5px 0;\">Thời hạn thuê: ……… năm / ……. tháng kể từ ngày bàn giao.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Khi hết hạn thuê nếu Bên B muốn tiếp tục, Bên A có trách nhiệm ưu tiên cho Bên B thuê lại nếu thỏa thuận được hai bên chấp nhận.</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 4. Đặt cọc an ninh</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>…….. VNĐ</strong> (bằng chữ: …………………………) ngay khi ký hợp đồng này.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Mục đích đặt cọc: đảm bảo việc Bên B thực hiện hợp đồng thuê (trả tiền thuê, chi phí điện nước, giữ gìn tài sản, trả phòng đúng điều kiện khi kết thúc).</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nếu Bên B đơn phương chấm dứt mà không báo trước: Bên A có thể giữ toàn bộ / một phần cọc (theo thỏa thuận) để bù đắp thiệt hại.</li>\n            <li>Nếu Bên A đơn phương chấm dứt mà không báo trước: Bên A hoàn trả cọc + bồi thường bằng số tiền đặt cọc (theo thỏa thuận hai bên).</li>\n            <li>Nếu có thiệt hại (nội thất, đồ đạc …) sau khi Bên B sử dụng: Bên A được quyền khấu trừ chi phí sửa chữa từ cọc, theo biên bản kiểm kê do các bên lập khi bàn giao / trả phòng.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 5. Giá thuê & Chi phí điện – nước – Phụ phí</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà: <strong>…….. VNĐ / tháng</strong> (bằng chữ: …………………………)</p>\n        <p style=\"margin: 5px 0;\">Chi phí điện: …….. VNĐ / kWh (hoặc theo thỏa thuận / bảng bậc).</p>\n        <p style=\"margin: 5px 0;\">Chi phí nước: …….. VNĐ / m³ (hoặc theo thỏa thuận).</p>\n        <p style=\"margin: 5px 0;\">Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: …….. VNĐ / tháng</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Bên B thanh toán các chi phí điện, nước, phụ phí theo mức sử dụng thực tế hàng tháng (hoặc theo hóa đơn / phiếu chi phí do Bên A / đơn vị quản lý cung cấp).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 6. Thanh toán</p>\n        <p style=\"margin: 5px 0;\">Tiền thuê nhà được thanh toán mỗi tháng, vào ngày … hàng tháng.</p>\n        <p style=\"margin: 5px 0;\">Hình thức thanh toán: Tiền mặt / Chuyển khoản đến tài khoản Bên A / tài khoản do Bên A chỉ định.</p>\n        <p style=\"margin: 5px 0; text-align: justify;\">Chi phí điện, nước, phụ phí sẽ được Bên B thanh toán trực tiếp cho đơn vị cung cấp (nếu Bên A ủy quyền) hoặc thanh toán cho Bên A (nếu thỏa thuận).</p>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 7. Quyền & Nghĩa vụ của Bên A (Chủ trọ)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Bàn giao nhà / phòng, đồ đạc, nội thất đúng như mô tả.</li>\n            <li>Đảm bảo quyền sở hữu / quyền cho thuê hợp pháp.</li>\n            <li>Sửa chữa các hỏng hóc do lỗi của Bên A hoặc lỗi hệ thống (theo thỏa thuận).</li>\n            <li>Không xâm phạm vào tài sản của Bên B trong thời gian thuê nếu không có lý do hợp pháp.</li>\n            <li>Bồi thường nếu vi phạm hợp đồng hoặc gây thiệt hại cho Bên B.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 8. Quyền & Nghĩa vụ của Bên B (Người thuê)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Sử dụng tài sản thuê đúng mục đích (ở, không làm điều trái phép).</li>\n            <li>Trả tiền thuê, điện, nước, phụ phí đúng hạn và đầy đủ.</li>\n            <li>Giữ gìn đồ đạc, nội thất, báo cáo hỏng hóc kịp thời nếu có.</li>\n            <li>Khi muốn chấm dứt hợp đồng trước hạn: thông báo bằng văn bản cho Bên A tối thiểu 30 ngày trước (hoặc theo thỏa thuận).</li>\n            <li>Khi hết thời hạn thuê hoặc chấm dứt: trả lại phòng / nhà, nội thất ở trạng thái thỏa thuận (cho phép hao mòn hợp lý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 9. Vai trò & Nghĩa vụ của Bên C (Hommy)</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Nhận và giữ cọc từ Bên B như là bên trung gian trung thực (depositary) theo quy định của Bộ luật Dân sự 2015 (Điều 328).</li>\n            <li>Khi nhận cọc, Bên C lập biên nhận / biên lai, gửi cho Bên B và Bên A.</li>\n            <li>Khi chấm dứt hoặc khi có điều kiện trả cọc, Bên C lập biên bản trừ hoặc trả cọc rõ lý do, số tiền, ký xác nhận giữa các bên.</li>\n            <li>Nếu có chi phí quản lý cọc (nếu thỏa thuận): Bên C được trừ chi phí từ số tiền cọc trước khi trả phần còn lại, và thông báo rõ cho Bên A và Bên B.</li>\n            <li>Lưu trữ hồ sơ liên quan: biên nhận cọc, biên bản trừ / trả cọc tối thiểu … năm (theo thỏa thuận) để đảm bảo minh bạch và giải quyết tranh chấp nếu có.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 10. Chấm dứt hợp đồng & Trả cọc</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Khi hợp đồng thuê kết thúc theo thời hạn hoặc bởi chấm dứt trước hạn: các bên thực hiện bàn giao tài sản, kiểm kê đồ đạc, nội thất, chi phí điện / nước chưa thanh toán.</li>\n            <li>Sau khi bàn giao, Bên C sẽ thực hiện trả cọc hoặc trừ cọc theo biên bản kiểm kê (nếu có).</li>\n            <li>Thời gian trả cọc hoặc trừ cọc: trong vòng … ngày kể từ khi bên A, B và C ký biên bản bàn giao / trừ cọc.</li>\n            <li>Nếu có tranh chấp về số tiền trừ hoặc việc trả cọc: trước tiên các bên hòa giải; nếu không được, các bên có thể khởi kiện tại Tòa án nhân dân có thẩm quyền hoặc theo cơ chế trọng tài nếu thỏa thuận.</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 15px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 11. Hiệu lực & Điều khoản chung</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Hợp đồng có hiệu lực kể từ ngày ký.</li>\n            <li>Mọi sửa đổi, bổ sung hợp đồng phải được lập bằng văn bản và ký bởi cả Ba Bên.</li>\n            <li>Hợp đồng lập thành 03 bản, mỗi bên giữ 1 bản: Bên A, Bên B, Bên C; đều có giá trị pháp lý như nhau.</li>\n            <li>Mọi thông báo, thư từ liên quan Hợp đồng: gửi bằng văn bản (có thể email nếu các bên đồng ý).</li>\n        </ul>\n    </div>\n\n    <div style=\"margin-bottom: 30px;\">\n        <p style=\"font-weight: bold; margin-bottom: 5px;\">Điều 12. Cam kết</p>\n        <ul style=\"margin: 5px 0 10px 40px; list-style-type: disc; text-align: justify;\">\n            <li>Ba bên cam kết cung cấp thông tin trung thực (họ tên, ngày sinh, CCCD, …).</li>\n            <li>Ba bên cam kết thực hiện đúng các điều khoản của hợp đồng.</li>\n            <li>Khi ký, cả ba bên đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng này.</li>\n        </ul>\n    </div>\n\n    <table style=\"width: 100%; margin-top: 50px; border-collapse: collapse;\">\n        <tr>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN A</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Chủ trọ)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukichutro\">.......................................</p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN B</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Người thuê)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p id=\"chukibenb\">.......................................</p>\n            </td>\n            <td style=\"width: 33%; text-align: center; vertical-align: top;\">\n                <p style=\"margin: 0; font-weight: bold; text-transform: uppercase;\">ĐẠI DIỆN BÊN C</p>\n                <p style=\"margin: 5px 0; font-style: italic;\">(Hommy)</p>\n                <br><br><br><br><br>\n                <p style=\"margin: 0;\">(Ký và ghi rõ họ tên)</p>\n                <p>Nguyễn Tiến Chung</p>\n            </td>\n        </tr>\n    </table>\n\n</div>', NULL, '1', 'xacthuc', 225, '2025-11-25 15:59:00', '2025-11-25 17:47:36');

-- --------------------------------------------------------

--
-- Table structure for table `nguoidung`
--

CREATE TABLE `nguoidung` (
  `NguoiDungID` int(11) NOT NULL,
  `TenDayDu` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `VaiTroHoatDongID` int(11) DEFAULT NULL,
  `SoDienThoai` varchar(20) DEFAULT NULL,
  `MatKhauHash` varchar(255) NOT NULL,
  `TrangThai` enum('HoatDong','TamKhoa','VoHieuHoa','XoaMem') NOT NULL DEFAULT 'HoatDong' COMMENT 'Trạng thái tài khoản: Hoạt động/Tạm khóa/Vô hiệu hóa/Xóa mềm',
  `TrangThaiXacMinh` enum('ChuaXacMinh','ChoDuyet','DaXacMinh','TuChoi') NOT NULL DEFAULT 'ChuaXacMinh',
  `NgaySinh` date DEFAULT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `SoCCCD` varchar(12) DEFAULT NULL,
  `NgayCapCCCD` date DEFAULT NULL,
  `AnhCCCDMatTruoc` varchar(255) DEFAULT NULL,
  `AnhCCCDMatSau` varchar(255) DEFAULT NULL,
  `AnhSelfie` varchar(255) DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nguoidung`
--

INSERT INTO `nguoidung` (`NguoiDungID`, `TenDayDu`, `Email`, `VaiTroHoatDongID`, `SoDienThoai`, `MatKhauHash`, `TrangThai`, `TrangThaiXacMinh`, `NgaySinh`, `DiaChi`, `SoCCCD`, `NgayCapCCCD`, `AnhCCCDMatTruoc`, `AnhCCCDMatSau`, `AnhSelfie`, `TaoLuc`, `CapNhatLuc`) VALUES
(1, 'Võ Nguyễn Hoành Hợp', 'chuduantest@example.com', 3, '0901234567', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'DaXacMinh', '2003-11-11', '15, Đường Hà Huy Tập, Chợ Lầu, Bắc Bình, Bình Thuận', '060203002124', '2021-04-19', 'uploads/kyc/cccd_front/cccdFront-1765321411252-802351615.jpg', 'uploads/kyc/cccd_back/cccdBack-1765321411516-913353662.jpg', 'uploads/kyc/selfie/selfie-1765321411647-785567275.jpg', '2025-09-20 03:28:26', '2025-12-10 06:03:31'),
(2, 'Trần Thị Khách Hàng', 'khachhangtest@example.com', NULL, '0901234568', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:28:26', '2025-09-27 14:33:47'),
(3, 'Lê Văn Bán Hàng', 'banhangtest@example.com', 3, '0901234569', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:28:26', '2025-11-06 20:24:36'),
(4, 'Phạm Thị Điều Hành', 'dieuhanhtest@example.com', NULL, '0901234570', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:28:26', '2025-09-27 14:33:58'),
(5, 'Hoàng Văn Admin', 'admintest@example.com', NULL, '0901234571', '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:28:26', '2025-09-27 14:34:02'),
(6, 'Võ Nguyễn Hoành Hợp', 'hopboy553@gmail.com', 3, '0911576456', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-21 13:14:40', '2025-10-21 13:14:40'),
(7, 'Lam Ngoc Giang', 'khachang@gmail.com', 1, '0911576455', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, 'nghean', '1111111', NULL, NULL, NULL, NULL, '2025-11-04 21:51:51', '2025-11-25 17:01:26'),
(8, 'Nguyễn Văn Bán Hàng', 'banhang@gmail.com', 2, '0901234123', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-06 14:20:42', '2025-11-06 14:20:42'),
(9, 'Nguyễn Thị Điều Hành', 'dieuhanh@gmail.com', 4, '0901236486', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-06 14:38:39', '2025-11-06 14:38:39'),
(225, 'Nguyễn Văn Hệ Thống', 'hethong@gmail.com', 5, '0901234271', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-18 21:30:34', '2025-11-18 21:30:53'),
(226, 'Võ Hoành Chung', 'test@gmail.com', 2, '09289739877', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-18 23:51:58', '2025-11-18 23:51:58'),
(229, 'Võ Hoành Chung', 'dieuhanh1@gmail.com', 1, '0349195618', 'c4ca4238a0b923820dcc509a6f75849b', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 15:36:35', '2025-11-19 15:36:35'),
(230, 'bán hàng 2', 'banhang2@gmail.com', 2, '0349195611', 'c4ca4238a0b923820dcc509a6f75849b', 'HoatDong', 'DaXacMinh', '2018-11-09', 'sdaddasdasd', '454354343', NULL, 'sfđsfds', 'sdffds', 'sfsdfdfs', '2025-11-23 11:20:02', '2025-11-23 11:20:02'),
(242, 'Nguyễn Văn d', 'nguyenvanb@exampl13.com', 2, '0987654324', '1a24b2c4b17016486c67773b974181bc', 'TamKhoa', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-23 17:12:25', '2025-11-23 17:28:09'),
(245, 'kiên mặt lợn', 'kienml@gmail.com', 1, '0908878473', 'e10adc3949ba59abbe56e057f20f883e', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-28 15:39:06', '2025-11-28 15:39:06'),
(247, 'Nguyễn Tiến Chung', 'tienchung@gmail.com', 2, '0928773764', 'effa1800f95aaad8f28d138968ad2f32', 'HoatDong', 'ChuaXacMinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-29 04:43:58', '2025-11-29 04:43:58');

-- --------------------------------------------------------

--
-- Table structure for table `nhatkyhethong`
--

CREATE TABLE `nhatkyhethong` (
  `NhatKyID` bigint(20) NOT NULL,
  `NguoiDungID` int(11) DEFAULT NULL,
  `HanhDong` varchar(100) NOT NULL,
  `DoiTuong` varchar(100) DEFAULT NULL,
  `DoiTuongID` varchar(255) DEFAULT NULL,
  `GiaTriTruoc` text DEFAULT NULL,
  `GiaTriSau` text DEFAULT NULL,
  `DiaChiIP` varchar(45) DEFAULT NULL,
  `TrinhDuyet` text DEFAULT NULL,
  `ThoiGian` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ChuKy` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nhatkyhethong`
--

INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(1, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:12:29.191', NULL),
(2, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:12:31.388', NULL),
(3, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:16:49.825', NULL),
(4, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:16:58.875', NULL),
(5, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:22:38.274', NULL),
(6, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:22:44.809', NULL),
(7, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:31:54.844', NULL),
(8, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:31:58.562', NULL),
(9, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:33:14.880', NULL),
(10, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 15:46:27.673', NULL),
(11, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:14.505', NULL),
(12, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-19\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:21.318', NULL),
(13, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:25.304', NULL),
(14, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-30\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:31.329', NULL),
(15, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-10-01\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:35.152', NULL),
(16, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:41.621', NULL),
(17, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-07-02\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:42.490', NULL),
(18, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-07-02\",\"denNgay\":\"2025-08-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:48.537', NULL),
(19, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-07-02\",\"denNgay\":\"2025-07-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 16:02:51.636', NULL),
(20, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 17:57:55.724', NULL),
(21, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:08.415', NULL),
(22, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-07-02\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:21.920', NULL),
(23, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-07-02\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:22.720', NULL),
(24, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:23.364', NULL),
(25, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-23\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:25.074', NULL),
(26, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-23\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:12:26.655', NULL),
(27, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:19:17.928', NULL),
(28, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-08-31\",\"denNgay\":\"2025-09-30\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-09-30 18:27:13.699', NULL),
(29, 1, 'tao_nhanh_du_an', 'DuAn', '14', NULL, '{\"tenDuAn\":\"Nhà trọ Minh Tâm\",\"diaChi\":\"40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-01 16:17:33.743', NULL),
(30, 1, 'tao_tin_dang', 'TinDang', '4', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 16:23:07.326', NULL),
(31, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:39:25.234', NULL),
(32, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 19:39:29.203', NULL),
(33, 1, 'gui_tin_dang_de_duyet', 'TinDang', '4', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:06:59.916', NULL),
(34, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:40:57.231', NULL),
(35, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:41:03.053', NULL),
(36, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:41:12.388', NULL),
(37, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:41:31.452', NULL),
(38, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:41:52.375', NULL),
(39, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:42:18.579', NULL),
(40, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:42:37.041', NULL),
(41, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:43:40.711', NULL),
(42, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:47:23.993', NULL),
(43, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:48:06.307', NULL),
(44, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 20:48:20.207', NULL),
(45, 1, 'tao_nhanh_du_an', 'DuAn', '15', NULL, '{\"tenDuAn\":\"Nhà Trọ Cheap Avocado\",\"diaChi\":\"27 Nguyễn Như Hạnh, Phường Hòa Khánh Bắc, Quận Liên Chiểu, Đà Nẵng\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 21:00:41.630', NULL),
(46, 1, 'tao_tin_dang', 'TinDang', '5', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 21:03:18.943', NULL),
(47, 1, 'tao_tin_dang', 'TinDang', '6', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 21:30:59.592', NULL),
(48, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-03\",\"denNgay\":\"2025-10-03\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-03 21:41:01.621', NULL),
(49, 1, 'tao_nhanh_du_an', 'DuAn', '16', NULL, '{\"tenDuAn\":\"Nhà trọ Hải Hương\",\"diaChi\":\"15 Hà Huy Tập, Thị trấn Chợ Lầu, Huyện Bắc Bình, Bình Thuận\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 03:02:48.333', NULL),
(50, 1, 'tao_tin_dang', 'TinDang', '7', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Phòng trọ cho cán bộ công tác ngắn hạn dưới 3 tháng\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 03:30:05.984', NULL),
(51, 1, 'gui_tin_dang_de_duyet', 'TinDang', '5', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 04:32:35.812', NULL),
(52, 1, 'gui_tin_dang_de_duyet', 'TinDang', '7', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 04:32:48.941', NULL),
(53, 1, 'gui_tin_dang_de_duyet', 'TinDang', '6', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 04:37:53.440', NULL),
(54, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-04\",\"denNgay\":\"2025-10-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:45:46.483', NULL),
(55, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-04\",\"denNgay\":\"2025-10-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:45:53.085', NULL),
(56, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:48:37.945', NULL),
(57, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:49:55.442', NULL),
(58, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:50:54.603', NULL),
(59, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:50:58.232', NULL),
(60, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 09:51:13.187', NULL),
(61, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:00:28.159', NULL),
(62, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:01:59.312', NULL),
(63, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:02:12.151', NULL),
(64, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:02:20.386', NULL),
(65, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:02:23.844', NULL),
(66, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:05:32.937', NULL),
(67, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:05:41.346', NULL),
(68, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:05:46.536', NULL),
(69, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:05:55.801', NULL),
(70, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:06:02.942', NULL),
(71, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:06:26.715', NULL),
(72, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:06:30.378', NULL),
(73, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:06:52.066', NULL),
(74, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:11:52.220', NULL),
(75, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:12:57.057', NULL),
(76, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:13:44.541', NULL),
(77, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:14:27.504', NULL),
(78, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:14:46.835', NULL),
(79, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:15:13.522', NULL),
(80, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:17:42.786', NULL),
(81, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:18:44.931', NULL),
(82, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:19:15.343', NULL),
(83, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:21:17.436', NULL),
(84, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:21:28.999', NULL),
(85, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:21:32.095', NULL),
(86, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:25:02.215', NULL),
(87, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:25:34.278', NULL),
(88, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:32:38.586', NULL),
(89, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":350000,\"GiaNuoc\":2000000,\"GiaDichVu\":15000000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:33:49.406', NULL),
(90, 1, 'gui_duyet_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":350000,\"GiaNuoc\":2000000,\"GiaDichVu\":15000000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"send_review\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:37:25.671', NULL),
(91, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:40:17.837', NULL),
(92, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":35000000,\"GiaNuoc\":200000000,\"GiaDichVu\":1500000000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:40:25.092', NULL),
(93, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:40:36.618', NULL),
(94, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:41:22.279', NULL),
(95, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":3500,\"GiaNuoc\":20000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:42:48.086', NULL),
(96, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:42:50.169', NULL),
(97, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:45:04.265', NULL),
(98, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:45:23.692', NULL),
(99, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":3500,\"GiaNuoc\":20000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:45:44.128', NULL),
(100, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:45:46.233', NULL),
(101, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 10:46:05.333', NULL),
(102, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:00:09.030', NULL),
(103, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":3500,\"GiaNuoc\":20000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":350000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":400000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:00:17.803', NULL),
(104, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:00:19.524', NULL),
(105, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:02:48.434', NULL),
(106, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:03:20.605', NULL),
(107, 1, 'luu_nhap_tin_dang', 'TinDang', '4', NULL, '{\"DuAnID\":14,\"TieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\",\"MoTa\":\"Chỉ cho nữ thuê\",\"Gia\":null,\"DienTich\":null,\"KhuVucID\":941,\"URL\":[\"http://localhost:5000/uploads/1759483386941.jpg\",\"http://localhost:5000/uploads/1759483386953.jpg\",\"http://localhost:5000/uploads/1759483386973.jpg\",\"http://localhost:5000/uploads/1759483387011.jpg\",\"http://localhost:5000/uploads/1759483387065.jpg\",\"http://localhost:5000/uploads/1759483387091.jpg\",\"http://localhost:5000/uploads/1759483387125.jpg\",\"http://localhost:5000/uploads/1759483387180.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"],\"GiaDien\":3500,\"GiaNuoc\":20000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Bảo dưỡng + rác\",\"DiaChi\":\"40/6 Lê Văn Thọ\",\"ViDo\":10.8379251,\"KinhDo\":106.6581163,\"Phongs\":[{\"PhongID\":1,\"tenPhong\":\"006\",\"gia\":3500000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387245.jpg\"},{\"PhongID\":2,\"tenPhong\":\"1006\",\"gia\":4000000,\"dienTich\":25,\"ghiChu\":null,\"url\":\"http://localhost:5000/uploads/1759483387258.jpg\"}],\"PhongsDaXoa\":[],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:03:30.663', NULL),
(108, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '4', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:03:32.368', NULL),
(109, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '2', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:03:53.348', NULL),
(110, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '2', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:09:30.461', NULL),
(111, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '2', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:09:55.393', NULL),
(112, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '2', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:10:20.562', NULL),
(113, 1, 'xoa_tin_dang', 'TinDang', '2', NULL, '{\"TrangThai\":\"LuuTru\",\"LyDoXoa\":\"Chủ dự án tự xóa\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:11:36.088', NULL),
(114, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-04\",\"denNgay\":\"2025-10-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0', '2025-10-04 11:15:40.897', NULL),
(115, 1, 'gui_tin_dang_de_duyet', 'TinDang', '4', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-05 17:03:42.151', NULL),
(116, 1, 'tao_nhanh_du_an', 'DuAn', '17', NULL, '{\"tenDuAn\":\"Nhà Trọ Hoành Hợp\",\"diaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-05 17:05:39.466', NULL),
(117, 1, 'tao_tin_dang', 'TinDang', '8', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-05 17:07:37.327', NULL),
(118, 1, 'gui_tin_dang_de_duyet', 'TinDang', '8', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-05 17:07:57.795', NULL),
(119, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-05 17:08:06.349', NULL),
(120, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-07 21:03:17.999', NULL),
(121, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-07 21:42:29.636', NULL),
(122, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-07 21:48:31.243', NULL),
(123, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-07 22:07:52.506', NULL),
(124, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:13:27.671', NULL),
(125, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:17:17.580', NULL),
(126, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:17:22.312', NULL),
(127, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:18:41.221', NULL),
(128, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:18:51.362', NULL),
(129, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:18:56.770', NULL),
(130, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:19:13.914', NULL),
(131, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:19:26.668', NULL),
(132, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:19:48.481', NULL),
(133, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:19:51.543', NULL),
(134, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:19:56.525', NULL),
(135, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 00:20:03.127', NULL),
(136, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:07:03.708', NULL),
(137, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:08:03.018', NULL),
(138, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:09:04.829', NULL),
(139, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:10:04.038', NULL),
(140, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:11:04.598', NULL),
(141, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:12:35.737', NULL),
(142, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:14:03.198', NULL),
(143, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:15:02.880', NULL),
(144, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:16:04.920', NULL),
(145, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:17:34.742', NULL),
(146, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:19:03.387', NULL),
(147, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:20:03.357', NULL),
(148, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:21:08.064', NULL),
(149, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:22:33.216', NULL);
INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(150, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:23:33.419', NULL),
(151, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:24:33.411', NULL),
(152, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:25:33.487', NULL),
(153, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:26:33.458', NULL),
(154, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:27:33.118', NULL),
(155, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:28:38.981', NULL),
(156, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:30:07.090', NULL),
(157, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:31:33.418', NULL),
(158, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:32:32.986', NULL),
(159, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:33:34.368', NULL),
(160, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:34:33.082', NULL),
(161, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:35:33.434', NULL),
(162, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:36:34.936', NULL),
(163, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:37:37.992', NULL),
(164, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:39:02.829', NULL),
(165, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:40:17.177', NULL),
(166, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:41:37.446', NULL),
(167, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:43:07.011', NULL),
(168, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 01:44:40.671', NULL),
(169, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-07\",\"denNgay\":\"2025-10-07\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-08 02:01:13.588', NULL),
(170, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-09\",\"denNgay\":\"2025-10-09\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-09 23:16:10.887', NULL),
(171, 1, 'tao_tin_dang', 'TinDang', '9', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Cuối tháng 10 trống duy nhất 1 căn 2 phòng ngủ cao cấp ở tối đa 4 người\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:22:46.523', NULL),
(172, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:23:22.348', NULL),
(173, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:48:08.676', NULL),
(174, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:48:16.019', NULL),
(175, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:48:57.645', NULL),
(176, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:49:23.158', NULL),
(177, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:50:21.429', NULL),
(178, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:50:24.949', NULL),
(179, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:50:29.279', NULL),
(180, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:50:39.071', NULL),
(181, 1, 'gui_tin_dang_de_duyet', 'TinDang', '9', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:51:22.325', NULL),
(182, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:51:58.044', NULL),
(183, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:52:27.820', NULL),
(184, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:55:18.250', NULL),
(185, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:57:12.003', NULL),
(186, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:57:15.251', NULL),
(187, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:57:26.490', NULL),
(188, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:57:56.739', NULL),
(189, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:04.205', NULL),
(190, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:22.679', NULL),
(191, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:25.941', NULL),
(192, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:30.700', NULL),
(193, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:45.258', NULL),
(194, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:58:53.247', NULL),
(195, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 20:59:03.795', NULL),
(196, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:00:31.020', NULL),
(197, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:00:44.380', NULL),
(198, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-10\",\"denNgay\":\"2025-10-10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:03:22.638', NULL),
(199, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:09:15.251', NULL),
(200, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:11:10.235', NULL),
(201, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:13:04.214', NULL),
(202, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:13:18.112', NULL),
(203, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:13:58.167', NULL),
(204, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:14:48.424', NULL),
(205, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:20:43.679', NULL),
(206, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:20:58.063', NULL),
(207, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:21:18.428', NULL),
(208, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:22:08.216', NULL),
(209, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:22:13.738', NULL),
(210, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:26:44.634', NULL),
(211, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:27:04.991', NULL),
(212, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '9', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:30:29.760', NULL),
(213, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:30:43.351', NULL),
(214, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '8', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:33:58.153', NULL),
(215, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:34:03.156', NULL),
(216, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:37:58.248', NULL),
(217, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:43:35.347', NULL),
(218, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:43:39.799', NULL),
(219, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:44:01.145', NULL),
(220, 1, 'gui_duyet_tin_dang', 'TinDang', '7', NULL, '{\"DuAnID\":16,\"TieuDe\":\"Phòng trọ cho cán bộ công tác ngắn hạn dưới 3 tháng\",\"MoTa\":\"Vì tính chất đặc thù của gia đình nên ưu tiên những hoàn cảnh trên. Mong mọi người cảm thông.\",\"KhuVucID\":1751,\"URL\":[\"http://localhost:5000/uploads/1759523405890.jpg\",\"http://localhost:5000/uploads/1759523405900.jpg\",\"http://localhost:5000/uploads/1759523405909.jpg\",\"http://localhost:5000/uploads/1759523405923.jpg\",\"http://localhost:5000/uploads/1759523405939.jpg\",\"http://localhost:5000/uploads/1759523405943.jpg\"],\"TienIch\":[\"Wifi\",\"Tủ lạnh\",\"Máy giặt\",\"Máy lạnh\",\"Nóng lạnh\",\"Chỗ để xe\",\"Bếp\",\"Giường\"],\"GiaDien\":3000,\"GiaNuoc\":18000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Phí điện, nước sinh hoạt chung + rác + wifi + giặt sấy\",\"DiaChi\":\"15 Hà Huy Tập\",\"ViDo\":11.2239833,\"KinhDo\":108.5011375,\"PhongIDs\":[{\"PhongID\":8,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":\"/uploads/1760107455301.jpg\",\"ThuTuHienThi\":0}],\"action\":\"send_review\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:44:15.414', NULL),
(221, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:44:24.197', NULL),
(222, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:44:35.780', NULL),
(223, 1, 'gui_duyet_tin_dang', 'TinDang', '5', NULL, '{\"DuAnID\":15,\"TieuDe\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\",\"MoTa\":\"Chỉ nhận nữ\",\"KhuVucID\":1689,\"URL\":[\"http://localhost:5000/uploads/1759500198783.jpg\",\"http://localhost:5000/uploads/1759500198803.jpg\",\"http://localhost:5000/uploads/1759500198838.jpg\",\"http://localhost:5000/uploads/1759500198843.jpg\",\"http://localhost:5000/uploads/1759500198858.jpg\",\"http://localhost:5000/uploads/1759500198873.jpg\",\"http://localhost:5000/uploads/1759500198896.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Giường\",\"Tủ lạnh\",\"Bếp\",\"Chỗ để xe\"],\"GiaDien\":3000,\"GiaNuoc\":18000,\"GiaDichVu\":200000,\"MoTaGiaDichVu\":\"Bao gồm phí bảo dưỡng + giặt sấy + wifi + rác sinh hoạt\",\"DiaChi\":\"27 Nguyễn Như Hạnh\",\"ViDo\":16.062602,\"KinhDo\":108.1760841,\"PhongIDs\":[{\"PhongID\":4,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":0},{\"PhongID\":3,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":1}],\"action\":\"send_review\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:44:52.565', NULL),
(224, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-10\",\"denNgay\":\"2025-10-10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:46:05.575', NULL),
(225, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:47:18.433', NULL),
(226, 1, 'gui_duyet_tin_dang', 'TinDang', '7', NULL, '{\"DuAnID\":16,\"TieuDe\":\"Phòng trọ cho cán bộ công tác ngắn hạn dưới 3 tháng\",\"MoTa\":\"Vì tính chất đặc thù của gia đình nên ưu tiên những hoàn cảnh trên. Mong mọi người cảm thông.\",\"KhuVucID\":1751,\"URL\":[\"http://localhost:5000/uploads/1759523405890.jpg\",\"http://localhost:5000/uploads/1759523405900.jpg\",\"http://localhost:5000/uploads/1759523405909.jpg\",\"http://localhost:5000/uploads/1759523405923.jpg\",\"http://localhost:5000/uploads/1759523405939.jpg\",\"http://localhost:5000/uploads/1759523405943.jpg\"],\"TienIch\":[\"Wifi\",\"Tủ lạnh\",\"Máy giặt\",\"Máy lạnh\",\"Nóng lạnh\",\"Chỗ để xe\",\"Bếp\",\"Giường\"],\"GiaDien\":3000,\"GiaNuoc\":18000,\"GiaDichVu\":150000,\"MoTaGiaDichVu\":\"Phí điện, nước sinh hoạt chung + rác + wifi + giặt sấy\",\"DiaChi\":\"15 Hà Huy Tập\",\"ViDo\":11.2239833,\"KinhDo\":108.5011375,\"PhongIDs\":[{\"PhongID\":8,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":\"/uploads/1760107658795.jpg\",\"ThuTuHienThi\":0}],\"action\":\"send_review\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:47:38.881', NULL),
(227, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '7', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-10 21:47:44.710', NULL),
(228, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-10\",\"denNgay\":\"2025-10-10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:01:43.595', NULL),
(229, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-10\",\"denNgay\":\"2025-10-10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:01:47.011', NULL),
(230, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:03:04.938', NULL),
(231, 1, 'luu_nhap_tin_dang', 'TinDang', '5', NULL, '{\"DuAnID\":15,\"TieuDe\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\",\"MoTa\":\"Chỉ nhận nữ\",\"KhuVucID\":1689,\"URL\":[\"http://localhost:5000/uploads/1759500198783.jpg\",\"http://localhost:5000/uploads/1759500198803.jpg\",\"http://localhost:5000/uploads/1759500198838.jpg\",\"http://localhost:5000/uploads/1759500198843.jpg\",\"http://localhost:5000/uploads/1759500198858.jpg\",\"http://localhost:5000/uploads/1759500198873.jpg\",\"http://localhost:5000/uploads/1759500198896.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Giường\",\"Tủ lạnh\",\"Bếp\",\"Chỗ để xe\"],\"GiaDien\":3000,\"GiaNuoc\":18000,\"GiaDichVu\":200000,\"MoTaGiaDichVu\":\"Bao gồm phí bảo dưỡng + giặt sấy + wifi + rác sinh hoạt\",\"DiaChi\":\"27 Nguyễn Như Hạnh\",\"ViDo\":16.062602,\"KinhDo\":108.1760841,\"PhongIDs\":[{\"PhongID\":4,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":0},{\"PhongID\":3,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":1}],\"action\":\"save_draft\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:03:20.075', NULL),
(232, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:03:21.557', NULL),
(233, 1, 'gui_tin_dang_de_duyet', 'TinDang', '5', '{\"trangThai\":\"Nhap\"}', '{\"trangThai\":\"ChoDuyet\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:03:30.335', NULL),
(234, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:16:09.842', NULL),
(235, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-10\",\"denNgay\":\"2025-10-10\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 00:21:34.720', NULL),
(236, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-11 01:02:25.043', NULL),
(237, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-16\",\"denNgay\":\"2025-10-16\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-16 16:47:32.853', NULL),
(238, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-16\",\"denNgay\":\"2025-10-16\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-16 16:50:19.294', NULL),
(239, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-16\",\"denNgay\":\"2025-10-16\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-16 16:50:28.434', NULL),
(240, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '3', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-16 16:55:01.965', NULL),
(241, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 13:14:49.039', NULL),
(242, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 13:34:53.559', NULL),
(243, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 13:35:48.094', NULL),
(244, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 13:37:09.455', NULL),
(245, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:13:37.310', NULL),
(246, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:13:47.681', NULL),
(247, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:13:57.678', NULL),
(248, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:15:33.888', NULL),
(249, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:17:11.052', NULL),
(250, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:17:17.019', NULL),
(251, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:17:19.763', NULL),
(252, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:17:42.358', NULL),
(253, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:19:43.419', NULL),
(254, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:24:00.286', NULL),
(255, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:24:04.320', NULL),
(256, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:24:28.672', NULL),
(257, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:26:57.581', NULL),
(258, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-21\",\"denNgay\":\"2025-10-21\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-21 14:27:11.183', NULL),
(259, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-23\",\"denNgay\":\"2025-10-23\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-23 21:51:29.229', NULL),
(260, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 12:50:21.727', NULL),
(261, 1, 'chu_du_an_xem_bao_cao', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"HieuSuat\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 13:07:58.719', NULL),
(262, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 13:28:08.595', NULL),
(263, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 13:29:15.264', NULL),
(264, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 14:04:13.200', NULL),
(265, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 14:06:31.586', NULL),
(266, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 14:22:25.705', NULL),
(267, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:49:15.838', NULL),
(268, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:50:34.524', NULL),
(269, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:50:49.973', NULL),
(270, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:51:12.254', NULL),
(271, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:54:30.138', NULL),
(272, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:54:32.389', NULL),
(273, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:54:48.442', NULL),
(274, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:55:03.026', NULL),
(275, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:55:19.412', NULL),
(276, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:55:32.905', NULL),
(277, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:55:46.924', NULL),
(278, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:56:19.505', NULL),
(279, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 18:59:36.071', NULL),
(280, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 19:14:34.552', NULL),
(281, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 19:17:52.308', NULL),
(282, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-24 19:18:06.535', NULL),
(283, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-24\",\"denNgay\":\"2025-10-24\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Edg/141.0.0.0', '2025-10-24 19:28:35.501', NULL),
(284, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-26\",\"denNgay\":\"2025-10-26\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-26 12:29:18.293', NULL),
(285, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-28\",\"denNgay\":\"2025-10-28\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-28 17:30:50.005', NULL),
(286, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-28\",\"denNgay\":\"2025-10-28\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-28 17:35:14.938', NULL),
(287, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-09-28\",\"denNgay\":\"2025-10-28\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', '2025-10-28 22:44:07.911', NULL),
(288, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-05\",\"denNgay\":\"2025-11-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-04 20:16:05.364', NULL),
(289, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-05\",\"denNgay\":\"2025-11-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-04 20:17:59.988', NULL),
(290, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-04 20:41:27.838', NULL),
(291, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-05\",\"denNgay\":\"2025-11-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-04 20:42:13.014', NULL),
(292, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-05\",\"denNgay\":\"2025-11-04\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-04 21:37:55.032', NULL),
(293, 6, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-07\",\"denNgay\":\"2025-11-06\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-06 11:41:40.547', NULL),
(294, 6, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-07\",\"denNgay\":\"2025-11-06\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-06 11:42:56.103', NULL),
(295, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-07\",\"denNgay\":\"2025-11-06\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-06 12:07:05.561', NULL),
(296, 210, 'tao_ca_lam_viec_sales', 'LichLamViec', '1', NULL, '{\"batDau\":\"2025-11-07T02:00:00.000Z\",\"ketThuc\":\"2025-11-07T06:00:00.000Z\"}', '::ffff:127.0.0.1', '', '2025-11-06 19:51:51.539', NULL),
(297, 210, 'cap_nhat_ca_lam_viec_sales', 'LichLamViec', '1', NULL, '{\"batDau\":\"2025-11-08T03:00:00.000Z\",\"ketThuc\":\"2025-11-08T07:00:00.000Z\"}', '::ffff:127.0.0.1', '', '2025-11-06 19:51:51.617', NULL),
(298, 210, 'tao_ca_lam_viec_sales', 'LichLamViec', '2', NULL, '{\"batDau\":\"2025-11-09T08:00:00.000Z\",\"ketThuc\":\"2025-11-09T12:00:00.000Z\"}', '::ffff:127.0.0.1', '', '2025-11-06 19:51:51.626', NULL),
(299, 210, 'xoa_ca_lam_viec_sales', 'LichLamViec', '2', '{\"deleted\":false}', '{\"deleted\":true}', '::ffff:127.0.0.1', '', '2025-11-06 19:51:51.639', NULL),
(300, 210, 'coc_xac_nhan_boi_sales', 'GiaoDich', '1', '{\"trangThai\":\"DaUyQuyen\"}', '{\"trangThai\":\"DaGhiNhan\"}', '::ffff:127.0.0.1', '', '2025-11-06 19:51:51.673', NULL),
(332, 6, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-07\",\"denNgay\":\"2025-11-06\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-06 20:09:26.607', NULL),
(333, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '9', NULL, '{\"batDau\":\"2025-11-18T00:00:00.000Z\",\"ketThuc\":\"2025-11-18T08:00:00.000Z\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.64 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-17 14:27:47.094', NULL),
(334, 8, 'xoa_ca_lam_viec_sales', 'LichLamViec', '9', '{\"deleted\":false}', '{\"deleted\":true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.64 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-17 14:38:19.194', NULL),
(335, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '10', NULL, '{\"batDau\":\"2025-11-18 07:00:00\",\"ketThuc\":\"2025-11-18 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.64 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-17 14:38:30.929', NULL),
(336, 8, 'xoa_ca_lam_viec_sales', 'LichLamViec', '10', '{\"deleted\":false}', '{\"deleted\":true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.64 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-17 14:38:45.409', NULL),
(337, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '11', NULL, '{\"batDau\":\"2025-11-18 07:00:00\",\"ketThuc\":\"2025-11-18 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.64 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-17 14:42:41.178', NULL),
(353, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-19\",\"denNgay\":\"2025-11-18\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 20:16:33.976', NULL),
(354, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-19\",\"denNgay\":\"2025-11-18\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 22:36:06.193', NULL),
(355, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '20', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 22:53:15.018', NULL),
(356, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '20', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 22:53:17.038', NULL),
(357, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '20', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 22:54:11.278', NULL),
(358, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '20', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 23:18:09.323', NULL),
(359, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 23:18:15.955', NULL),
(360, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 23:38:26.720', NULL),
(361, 7, 'tao_cuoc_hen', 'CuocHen', '25', NULL, '{\"PhongID\":4,\"ThoiGianHen\":\"2025-11-19 00:12:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 23:43:00.103', NULL);
INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(362, 7, 'tao_cuoc_hen', 'CuocHen', '26', NULL, '{\"PhongID\":3,\"ThoiGianHen\":\"2025-11-19 00:23:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-18 23:56:55.927', NULL),
(363, 7, 'tao_cuoc_hen', 'CuocHen', '27', NULL, '{\"PhongID\":3,\"ThoiGianHen\":\"2025-11-20 00:32:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 00:02:48.416', NULL),
(364, 7, 'tao_cuoc_hen', 'CuocHen', '28', NULL, '{\"PhongID\":4,\"ThoiGianHen\":\"2025-11-21 00:42:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 00:08:31.217', NULL),
(365, 7, 'tao_cuoc_hen', 'CuocHen', '29', NULL, '{\"PhongID\":4,\"ThoiGianHen\":\"2025-11-21 00:41:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 00:11:41.114', NULL),
(366, 1, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '219', '\"{\\\"NguCanhID\\\":29,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[1,8]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 00:40:05.073', NULL),
(367, 1, 'gui_tin_nhan_socket', 'tinnhan', '2068', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:40:19.943', NULL),
(368, 1, 'gui_tin_nhan_socket', 'tinnhan', '2069', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:40:30.589', NULL),
(369, 8, 'gui_tin_nhan_socket', 'tinnhan', '2070', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:41:12.545', NULL),
(370, 1, 'gui_tin_nhan_socket', 'tinnhan', '2071', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:43:26.806', NULL),
(371, 8, 'gui_tin_nhan_socket', 'tinnhan', '2072', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:43:34.253', NULL),
(372, 1, 'gui_tin_nhan_socket', 'tinnhan', '2073', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:54:58.288', NULL),
(373, 1, 'gui_tin_nhan_socket', 'tinnhan', '2074', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 00:58:04.980', NULL),
(374, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-20\",\"denNgay\":\"2025-11-19\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 00:59:58.126', NULL),
(375, 1, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '219', '\"{\\\"NguCanhID\\\":29,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[1,8]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:04:28.935', NULL),
(376, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:04:57.823', NULL),
(377, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:08:50.153', NULL),
(378, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:09:03.395', NULL),
(379, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:09:24.192', NULL),
(380, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:10:33.562', NULL),
(381, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:10:48.733', NULL),
(382, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:11:06.735', NULL),
(383, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:11:33.126', NULL),
(384, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:12:30.610', NULL),
(385, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 02:13:30.609', NULL),
(386, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '5', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 02:18:28.381', NULL),
(387, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-20\",\"denNgay\":\"2025-11-19\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 05:10:22.754', NULL),
(388, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 05:10:49.679', NULL),
(389, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 05:11:52.040', NULL),
(390, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '20', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:27:27.656', NULL),
(391, 8, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '220', '\"{\\\"NguCanhID\\\":20,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[8,7]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:27:41.072', NULL),
(392, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:28:17.898', NULL),
(393, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:29:22.877', NULL),
(394, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '29', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:34:36.335', NULL),
(395, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:34:37.489', NULL),
(396, 8, 'bao_cao_ket_qua_cuoc_hen', 'CuocHen', '29', NULL, '{\"ketQua\":\"HoanThanh\",\"khachQuanTam\":true,\"slaWarning\":false}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:40:04.649', NULL),
(397, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:43:24.747', NULL),
(398, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 06:46:19.512', NULL),
(399, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:27:44.528', NULL),
(400, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '20', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:27:56.933', NULL),
(401, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:30:29.293', NULL),
(402, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:30:33.000', NULL),
(403, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '26', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:31:05.093', NULL),
(404, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '26', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:31:08.481', NULL),
(405, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:31:38.571', NULL),
(406, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:33:04.181', NULL),
(407, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '26', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:36:55.919', NULL),
(408, 8, 'bao_cao_ket_qua_cuoc_hen', 'CuocHen', '26', NULL, '{\"ketQua\":\"HoanThanh\",\"khachQuanTam\":true,\"slaWarning\":false}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:37:28.459', NULL),
(409, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '26', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:37:30.787', NULL),
(410, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:38:00.095', NULL),
(411, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '21', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:38:08.310', NULL),
(412, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:38:10.862', NULL),
(413, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '25', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:39:37.363', NULL),
(414, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:39:56.356', NULL),
(415, 8, 'doi_lich_cuoc_hen', 'CuocHen', '21', NULL, '{\"thoiGianHenMoi\":\"2025-11-20T13:39\",\"lyDo\":\"Theo yêu cầu\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:40:00.916', NULL),
(416, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:40:02.294', NULL),
(417, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:40:24.458', NULL),
(418, 8, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '221', '\"{\\\"NguCanhID\\\":21,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[8,7]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 13:42:47.149', NULL),
(419, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:51:39.720', NULL),
(420, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '25', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:05.658', NULL),
(421, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '25', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:07.555', NULL),
(422, 8, 'doi_lich_cuoc_hen', 'CuocHen', '25', NULL, '{\"thoiGianHenMoi\":\"2025-11-20T13:52\",\"lyDo\":\"Theo yêu cầu\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:12.557', NULL),
(423, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '25', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:14.051', NULL),
(424, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:37.374', NULL),
(425, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '22', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:43.454', NULL),
(426, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '22', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:52:46.038', NULL),
(427, 8, 'bao_cao_ket_qua_cuoc_hen', 'CuocHen', '22', NULL, '{\"ketQua\":\"HoanThanh\",\"khachQuanTam\":true,\"slaWarning\":true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:53:03.146', NULL),
(428, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '22', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 13:53:04.753', NULL),
(429, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '22', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-19 14:13:56.773', NULL),
(430, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 14:44:44.540', NULL),
(431, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 14:48:51.666', NULL),
(432, 1, 'gui_duyet_tin_dang', 'TinDang', '6', NULL, '{\"DuAnID\":15,\"TieuDe\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\",\"MoTa\":\"Chỉ cho nam thuê\",\"KhuVucID\":1689,\"URL\":[\"http://localhost:5000/uploads/1759501859354.jpg\",\"http://localhost:5000/uploads/1759501859374.jpg\",\"http://localhost:5000/uploads/1759501859408.jpg\",\"http://localhost:5000/uploads/1759501859434.jpg\",\"http://localhost:5000/uploads/1759501859459.jpg\",\"http://localhost:5000/uploads/1759501859470.jpg\"],\"TienIch\":[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\",\"Giường\",\"Tủ lạnh\",\"Máy giặt\",\"Bếp\",\"Chỗ để xe\"],\"GiaDien\":3500,\"GiaNuoc\":20000,\"GiaDichVu\":200000,\"MoTaGiaDichVu\":\"Tiền điện + nước sinh hoạt chung\\nRác\",\"DiaChi\":\"27 Nguyễn Như Hạnh\",\"ViDo\":16.062602,\"KinhDo\":108.1760841,\"PhongIDs\":[{\"PhongID\":3,\"GiaTinDang\":null,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":0},{\"PhongID\":4,\"GiaTinDang\":10000,\"DienTichTinDang\":null,\"MoTaTinDang\":null,\"HinhAnhTinDang\":null,\"ThuTuHienThi\":1}],\"action\":\"send_review\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 14:49:08.769', NULL),
(433, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 14:58:49.523', NULL),
(434, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:00:44.392', NULL),
(435, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\",\"BangHoaHong\":[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}],\"SoThangCocToiThieu\":1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:02:55.691', NULL),
(436, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\",\"BangHoaHong\":[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}],\"SoThangCocToiThieu\":1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:04:50.140', NULL),
(437, 1, 'cap_nhat_du_an', 'DuAn', '17', NULL, '{\"TenDuAn\":\"Nhà Trọ Hoành Hợp\",\"DiaChi\":\"350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":0,\"PhuongThucVao\":\"Mật khẩu cổng là 6824\",\"TrangThai\":\"HoatDong\",\"BangHoaHong\":[{\"soThang\":6,\"tyLe\":30},{\"soThang\":12,\"tyLe\":70}],\"SoThangCocToiThieu\":1}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:09:04.122', NULL),
(438, 1, 'phe_duyet_cuoc_hen', 'CuocHen', '29', '{\"pheDuyetChuDuAn\":\"ChoPheDuyet\"}', '{\"pheDuyetChuDuAn\":\"DaPheDuyet\",\"phuongThucVao\":\"1234\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:26:25.304', NULL),
(439, 1, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '219', '\"{\\\"NguCanhID\\\":29,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[1,8]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:26:37.555', NULL),
(440, 1, 'gui_tin_nhan_socket', 'tinnhan', '2075', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 15:26:55.379', NULL),
(441, 1, 'gui_tin_nhan_socket', 'tinnhan', '2076', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-19 15:27:11.597', NULL),
(442, 1, 'xem_tin_dang_de_chinh_sua', 'TinDang', '6', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:28:27.822', NULL),
(443, 8, 'xac_nhan_cuoc_hen', 'CuocHen', '19', '{\"trangThai\":\"ChoXacNhan\"}', '{\"trangThai\":\"DaXacNhan\",\"ghiChu\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:31:26.817', NULL),
(444, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '19', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:31:32.688', NULL),
(445, 8, 'doi_lich_cuoc_hen', 'CuocHen', '19', NULL, '{\"thoiGianHenMoi\":\"2025-11-20T15:31\",\"lyDo\":\"Theo yêu cầu\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:31:40.349', NULL),
(446, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '19', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:31:41.496', NULL),
(447, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:32:03.236', NULL),
(448, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '26', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:32:08.616', NULL),
(449, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '29', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:32:19.343', NULL),
(450, 8, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '219', '\"{\\\"NguCanhID\\\":29,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[8,15]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-19 15:32:20.885', NULL),
(451, 1, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '219', '\"{\\\"NguCanhID\\\":29,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[1,8]}\"', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-20 10:29:47.871', NULL),
(452, 1, 'gui_tin_nhan_socket', 'tinnhan', '2077', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-20 10:29:51.869', NULL),
(453, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-20 11:02:42.155', NULL),
(454, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '19', NULL, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.163 Mobile Safari/537.36', '2025-11-20 11:06:13.800', NULL),
(455, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '21', NULL, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-20 11:15:45.875', NULL),
(456, 8, 'gui_tin_nhan_socket', 'tinnhan', '2078', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-20 11:16:05.001', NULL),
(457, 8, 'gui_tin_nhan_socket', 'tinnhan', '2079', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-20 11:16:34.067', NULL),
(458, 1, 'gui_tin_nhan_socket', 'tinnhan', '2080', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:39.800', NULL),
(459, 1, 'gui_tin_nhan_socket', 'tinnhan', '2081', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:42.768', NULL),
(460, 1, 'gui_tin_nhan_socket', 'tinnhan', '2082', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:44.447', NULL),
(461, 1, 'gui_tin_nhan_socket', 'tinnhan', '2083', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:49.823', NULL),
(462, 8, 'gui_tin_nhan_socket', 'tinnhan', '2084', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:52.975', NULL),
(463, 1, 'gui_tin_nhan_socket', 'tinnhan', '2085', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:53.966', NULL),
(464, 1, 'gui_tin_nhan_socket', 'tinnhan', '2086', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:41:59.976', NULL),
(465, 8, 'gui_tin_nhan_socket', 'tinnhan', '2087', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-22 20:42:24.916', NULL),
(466, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-23\",\"denNgay\":\"2025-11-22\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-22 20:47:59.042', NULL),
(467, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-23\",\"denNgay\":\"2025-11-22\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-22 20:52:40.965', NULL),
(468, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '15', NULL, '{\"batDau\":\"2025-11-25 07:00:00\",\"ketThuc\":\"2025-11-25 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 11:15:21.401', NULL),
(469, 230, 'tao_ca_lam_viec_sales', 'LichLamViec', '16', NULL, '{\"batDau\":\"2025-11-28 07:00:00\",\"ketThuc\":\"2025-11-28 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 11:21:09.179', NULL),
(470, 230, 'tao_ca_lam_viec_sales', 'LichLamViec', '17', NULL, '{\"batDau\":\"2025-11-26 07:00:00\",\"ketThuc\":\"2025-11-26 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 11:21:16.538', NULL),
(471, 7, 'tao_cuoc_hen', 'CuocHen', '33', NULL, '{\"PhongID\":8,\"ThoiGianHen\":\"2025-11-23 12:38:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:08:27.284', NULL),
(472, 7, 'tao_cuoc_hen', 'CuocHen', '34', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 09:39:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:09:44.504', NULL),
(473, 7, 'tao_cuoc_hen', 'CuocHen', '35', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 12:40:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:11:16.993', NULL),
(474, 7, 'tao_cuoc_hen', 'CuocHen', '36', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 12:43:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:13:13.565', NULL),
(475, 7, 'tao_cuoc_hen', 'CuocHen', '37', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 21:48:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:19:22.091', NULL),
(476, 7, 'tao_cuoc_hen', 'CuocHen', '38', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 21:50:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:21:03.623', NULL),
(477, 7, 'tao_cuoc_hen', 'CuocHen', '39', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 09:52:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:22:51.497', NULL),
(478, 7, 'tao_cuoc_hen', 'CuocHen', '40', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 09:54:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:24:47.293', NULL),
(479, 7, 'tao_cuoc_hen', 'CuocHen', '41', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 09:57:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:27:52.091', NULL),
(480, 7, 'tao_cuoc_hen', 'CuocHen', '42', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 09:08:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:38:36.522', NULL),
(481, 7, 'tao_cuoc_hen', 'CuocHen', '43', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 09:10:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:40:59.713', NULL),
(482, 7, 'tao_cuoc_hen', 'CuocHen', '44', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 08:14:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:44:18.684', NULL),
(483, 7, 'tao_cuoc_hen', 'CuocHen', '45', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 09:14:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:45:01.304', NULL),
(484, 7, 'tao_cuoc_hen', 'CuocHen', '46', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 09:17:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:47:25.386', NULL),
(485, 7, 'tao_cuoc_hen', 'CuocHen', '47', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-23 13:22:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:52:52.920', NULL),
(486, 7, 'tao_cuoc_hen', 'CuocHen', '48', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 08:23:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:53:59.374', NULL),
(487, 7, 'tao_cuoc_hen', 'CuocHen', '49', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 08:26:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:56:22.740', NULL),
(488, 7, 'tao_cuoc_hen', 'CuocHen', '50', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 08:29:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 12:59:18.257', NULL),
(489, 7, 'tao_cuoc_hen', 'CuocHen', '51', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-25 08:33:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 13:04:11.757', NULL),
(490, 7, 'tao_cuoc_hen', 'CuocHen', '52', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-11-25 08:36:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 13:06:19.400', NULL),
(491, 7, 'tao_cuoc_hen', 'CuocHen', '53', NULL, '{\"PhongID\":3,\"ThoiGianHen\":\"2025-11-23 13:37:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-23 13:07:29.182', NULL),
(492, 7, 'tao_cuoc_hen', 'CuocHen', '54', NULL, '{\"PhongID\":4,\"ThoiGianHen\":\"2025-11-23 22:12:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-23 21:42:21.073', NULL),
(493, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764066656350\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-25 17:30:56.384', NULL),
(494, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764067682873\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-25 17:48:02.926', NULL),
(495, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764067838042\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\r\\n\\r\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\r\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\r\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\r\\n    </div>\\r\\n\\r\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\r\\n        .........., ngày .... tháng .... năm ....\\r\\n    </p>\\r\\n\\r\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\r\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\r\\n    </h1>\\r\\n\\r\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\r\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11\"}', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-25 17:50:38.122', NULL),
(496, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764067885791\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-25 17:51:25.808', NULL),
(497, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764068564586\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-25 18:02:44.624', NULL),
(498, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764162117686\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-26 20:01:57.720', NULL),
(499, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-27\",\"denNgay\":\"2025-11-26\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-26 20:10:30.956', NULL),
(500, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764165433643\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-26 20:57:13.685', NULL),
(501, 7, 'dat_coc_giu_cho', 'TinDang', '6', '{\"giaoDichId\":\"tmp-1764167149206\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-26 21:25:49.247', NULL),
(502, 225, 'cap_nhat_noi_dung_he_thong', 'NoiDungHeThong', '1', '\"{\\\"LoaiNoiDung\\\":\\\"POLICY_PRIVACY\\\",\\\"TieuDe\\\":\\\"Chính sách bảo mật thông tin\\\",\\\"NoiDung\\\":\\\"Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của người dùng. Dữ liệu chỉ được sử dụng cho mục đích xác thực danh tính và giao dịch thuê phòng.\\\",\\\"PhienBan\\\":\\\"1.0\\\"}\"', '\"{\\\"LoaiNoiDung\\\":\\\"POLICY_PRIVACY\\\",\\\"TieuDe\\\":\\\"Chính sách bảo mật thông tin\\\",\\\"NoiDung\\\":\\\"Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của người dùng. Dữ liệu chỉ được sử dụng cho mục đích xác thực danh tính và giao dịch thuê phòng.1\\\",\\\"PhienBan\\\":\\\"1.0\\\"}\"', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-27 22:33:36.207', NULL),
(503, 225, 'tao_noi_dung_he_thong', 'NoiDungHeThong', '5', NULL, '\"{\\\"LoaiNoiDung\\\":\\\"POLICY_PRIVACY\\\",\\\"TieuDe\\\":\\\"dsdad\\\"}\"', '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0', '2025-11-27 22:33:50.397', NULL),
(504, 7, 'xin_huy_hop_dong', 'HopDong', '6', '\"{\\\"hopDongID\\\":6}\"', NULL, '', '', '2025-11-28 15:06:38.689', NULL),
(505, 225, 'xac_nhan_huy_hop_dong', 'HopDong', '6', '\"{\\\"hopDongID\\\":6}\"', NULL, '', '', '2025-11-28 15:11:40.720', NULL),
(506, 245, 'dat_coc_giu_cho', 'TinDang', '8', '{\"giaoDichId\":\"tmp-1764319343193\",\"soTien\":\"3000000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-28 15:42:23.247', NULL);
INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(507, 245, 'dat_coc_giu_cho', 'TinDang', '9', '{\"giaoDichId\":\"tmp-1764319972825\",\"soTien\":\"7700000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-28 15:52:52.866', NULL),
(508, 9, 'DUYET_HOA_HONG_DU_AN', 'DuAn', '2', '\"{\\\"TenDuAn\\\":\\\"Dự án Test - Nhà trọ XYZ\\\",\\\"BangHoaHong\\\":\\\"[{\\\\\\\"soThang\\\\\\\":6,\\\\\\\"tyLe\\\\\\\":30},{\\\\\\\"soThang\\\\\\\":12,\\\\\\\"tyLe\\\\\\\":70}]\\\"}\"', NULL, '', '', '2025-11-28 20:04:22.747', NULL),
(509, 9, 'DUYET_TIN_DANG', 'TinDang', '5', '\"{\\\"TieuDe\\\":\\\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\\\",\\\"ChuDuAnID\\\":1,\\\"TrangThaiCu\\\":\\\"ChoDuyet\\\",\\\"TrangThaiMoi\\\":\\\"DaDuyet\\\"}\"', NULL, '', '', '2025-11-28 20:09:11.925', NULL),
(510, 7, 'dat_coc_giu_cho', 'TinDang', '5', '{\"giaoDichId\":\"tmp-1764341360577\",\"soTien\":\"10000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-28 21:49:20.865', NULL),
(511, 7, 'xin_huy_hop_dong', 'HopDong', '9', '\"{\\\"hopDongID\\\":9}\"', NULL, '', '', '2025-11-28 21:50:37.047', NULL),
(512, 225, 'xac_nhan_huy_hop_dong', 'HopDong', '9', '\"{\\\"hopDongID\\\":9}\"', NULL, '', '', '2025-11-28 22:00:19.308', NULL),
(513, 245, 'tao_cuoc_hen', 'CuocHen', '55', NULL, '{\"PhongID\":5,\"ThoiGianHen\":\"2025-11-28 22:36:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-28 22:07:00.459', NULL),
(514, 1, 'gui_tin_nhan_socket', 'tinnhan', '2088', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-28 22:18:58.374', NULL),
(515, 1, 'gui_tin_nhan_socket', 'tinnhan', '2089', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-28 22:18:58.384', NULL),
(516, 1, 'gui_tin_nhan_socket', 'tinnhan', '2090', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-28 22:19:02.957', NULL),
(517, 1, 'gui_tin_nhan_socket', 'tinnhan', '2091', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-28 22:19:08.202', NULL),
(518, 1, 'gui_tin_nhan_socket', 'tinnhan', '2092', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-11-28 22:19:20.792', NULL),
(519, 1, 'cap_nhat_du_an', 'DuAn', '2', NULL, '{\"TenDuAn\":\"Dự án Test - Nhà trọ XYZ\",\"DiaChi\":\"456 Đường Test 2, Phường 2, Quận 2, TP. Hồ Chí Minh\",\"YeuCauPheDuyetChu\":1,\"PhuongThucVao\":null,\"TrangThai\":\"HoatDong\",\"BangHoaHong\":[{\"soThang\":7,\"tyLe\":40}],\"SoThangCocToiThieu\":1}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-28 22:46:57.461', NULL),
(520, 9, 'TAO_TAI_KHOAN_NHAN_VIEN', 'NguoiDung', '247', '\"{\\\"Email\\\":\\\"tienchung@gmail.com\\\",\\\"TenDayDu\\\":\\\"Nguyễn Tiến Chung\\\",\\\"MaNhanVien\\\":\\\"NV0003\\\",\\\"KhuVucChinhID\\\":62}\"', NULL, '', '', '2025-11-29 04:43:58.432', NULL),
(521, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '18', NULL, '{\"batDau\":\"2025-11-30 07:00:00\",\"ketThuc\":\"2025-11-30 15:00:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 04:51:36.617', NULL),
(522, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '52', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 04:51:41.935', NULL),
(523, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-10-30\",\"denNgay\":\"2025-11-29\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-29 05:01:58.353', NULL),
(524, 245, 'tao_cuoc_hen', 'CuocHen', '56', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-30 09:46:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:16:52.364', NULL),
(525, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '19', NULL, '{\"batDau\":\"2025-12-01 07:00:00\",\"ketThuc\":\"2025-12-01 15:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:21:05.869', NULL),
(526, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '20', NULL, '{\"batDau\":\"2025-12-06 07:00:00\",\"ketThuc\":\"2025-12-06 15:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:21:22.403', NULL),
(527, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '21', NULL, '{\"batDau\":\"2025-12-02 07:00:00\",\"ketThuc\":\"2025-12-02 15:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:22:04.458', NULL),
(528, 245, 'tao_cuoc_hen', 'CuocHen', '57', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-12-02 09:53:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:23:23.312', NULL),
(529, 245, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1764383311792\",\"soTien\":\"3500000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:28:32.471', NULL),
(530, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '22', NULL, '{\"batDau\":\"2025-12-02 15:00:00\",\"ketThuc\":\"2025-12-02 23:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-29 09:30:09.371', NULL),
(531, 245, 'tao_cuoc_hen', 'CuocHen', '58', NULL, '{\"PhongID\":5,\"ThoiGianHen\":\"2025-12-02 10:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo iOS/684 ZaloTheme/light ZaloLanguage/vn', '2025-11-29 09:31:05.458', NULL),
(532, 245, 'tao_cuoc_hen', 'CuocHen', '59', NULL, '{\"PhongID\":5,\"ThoiGianHen\":\"2025-11-29 10:32:00\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 10:02:11.377', NULL),
(533, 1, 'tao_tin_dang', 'TinDang', '15', NULL, '{\"trangThai\":\"Nhap\",\"tieuDe\":\"Cuối tháng 12 trống duy nhất 1 căn 2 phòng ngủ cao cấp ở tối đa 4 người\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 10:21:26.975', NULL),
(534, 7, 'tao_cuoc_hen', 'CuocHen', '60', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-11-30 03:45:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 11:15:56.645', NULL),
(535, 7, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1764389927384\",\"soTien\":\"3500000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 11:18:48.544', NULL),
(536, 7, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '225', '\"{\\\"NguCanhID\\\":60,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[7,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', '2025-11-29 11:19:38.758', NULL),
(537, 7, 'gui_tin_nhan_socket', 'tinnhan', '2093', '\"{\\\"CuocHoiThoaiID\\\":225}\"', NULL, '', '', '2025-11-29 11:19:55.305', NULL),
(538, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '60', NULL, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-29 11:22:10.385', NULL),
(539, 8, 'xem_chi_tiet_cuoc_hen', 'CuocHen', '60', NULL, NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-11-29 11:24:49.997', NULL),
(540, 1, 'gui_tin_nhan_socket', 'tinnhan', '2094', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-06 19:15:41.529', NULL),
(541, 1, 'gui_tin_nhan_socket', 'tinnhan', '2095', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-06 20:54:34.565', NULL),
(542, 1, 'gui_tin_nhan_socket', 'tinnhan', '2096', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-06 20:54:50.325', NULL),
(543, 1, 'gui_tin_nhan_socket', 'tinnhan', '2097', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-06 20:54:53.311', NULL),
(544, 1, 'gui_tin_nhan_socket', 'tinnhan', '2098', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 14:23:30.821', NULL),
(545, 1, 'gui_tin_nhan_socket', 'tinnhan', '2099', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 14:23:47.534', NULL),
(546, 1, 'gui_tin_nhan_socket', 'tinnhan', '2100', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:04:15.434', NULL),
(547, 1, 'gui_tin_nhan_socket', 'tinnhan', '2101', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:04:20.657', NULL),
(548, 1, 'gui_tin_nhan_socket', 'tinnhan', '2102', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:35:45.869', NULL),
(549, 1, 'gui_tin_nhan_socket', 'tinnhan', '2103', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:35:55.109', NULL),
(550, 1, 'gui_tin_nhan_socket', 'tinnhan', '2104', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:30.742', NULL),
(551, 1, 'gui_tin_nhan_socket', 'tinnhan', '2105', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:32.800', NULL),
(552, 1, 'gui_tin_nhan_socket', 'tinnhan', '2106', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:35.346', NULL),
(553, 1, 'gui_tin_nhan_socket', 'tinnhan', '2107', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:39.398', NULL),
(554, 1, 'gui_tin_nhan_socket', 'tinnhan', '2108', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:41.290', NULL),
(555, 1, 'gui_tin_nhan_socket', 'tinnhan', '2109', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:49.072', NULL),
(556, 1, 'gui_tin_nhan_socket', 'tinnhan', '2110', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:51.527', NULL),
(557, 1, 'gui_tin_nhan_socket', 'tinnhan', '2111', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:36:59.577', NULL),
(558, 1, 'gui_tin_nhan_socket', 'tinnhan', '2112', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:37:22.411', NULL),
(559, 1, 'gui_tin_nhan_socket', 'tinnhan', '2113', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:38:39.517', NULL),
(560, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/dt-kt2p1jtQ:APA91bGiA_08bmcKDOwYC9lT17MjYXWOm-ZEQBmdZrxYn9qfBBsuUS7pvm_fXU741JYiZI7nPhixVRYxwsWQnKS-OYeEwKQbSg-Vaya0nRKLeWf1wpbBLktYdgeWJroafGCnd539HkB3', 'expired', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/dt-kt2p1jtQ:APA91bGiA_08bmcKDOwYC9lT17MjYXWOm-ZEQBmdZrxYn9qfBBsuUS7pvm_fXU741JYiZI7nPhixVRYxwsWQnKS-OYeEwKQbSg-Vaya0nRKLeWf1wpbBLktYdgeWJroafGCnd539HkB3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BCNJ2M2M2cfFQfbhzfn9nbBTwnJMDYxoGgtOovXgK0uGCa_KP2ejXbutVpU_V7-3bLb4neRmJaDkejJIMCuk6EQ\",\"auth\":\"JneJrH69-aIbmNARMNsOrA\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 15:41:01.607', NULL),
(561, 1, 'gui_tin_nhan_socket', 'tinnhan', '2114', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:41:34.525', NULL),
(562, 1, 'gui_tin_nhan_socket', 'tinnhan', '2115', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:42:34.847', NULL),
(563, 1, 'gui_tin_nhan_socket', 'tinnhan', '2116', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:42:39.485', NULL),
(564, 1, 'gui_tin_nhan_socket', 'tinnhan', '2117', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:43:08.230', NULL),
(565, 1, 'gui_tin_nhan_socket', 'tinnhan', '2118', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:45:11.139', NULL),
(566, 1, 'gui_tin_nhan_socket', 'tinnhan', '2119', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:45:48.509', NULL),
(567, 1, 'gui_tin_nhan_socket', 'tinnhan', '2120', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:45:52.404', NULL),
(568, 1, 'gui_tin_nhan_socket', 'tinnhan', '2121', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:45:55.325', NULL),
(569, 1, 'gui_tin_nhan_socket', 'tinnhan', '2122', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:06.185', NULL),
(570, 1, 'gui_tin_nhan_socket', 'tinnhan', '2123', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:12.015', NULL),
(571, 1, 'gui_tin_nhan_socket', 'tinnhan', '2124', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:22.465', NULL),
(572, 1, 'gui_tin_nhan_socket', 'tinnhan', '2125', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:25.026', NULL),
(573, 1, 'gui_tin_nhan_socket', 'tinnhan', '2126', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:42.126', NULL),
(574, 1, 'gui_tin_nhan_socket', 'tinnhan', '2127', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:46:53.283', NULL),
(575, 1, 'gui_tin_nhan_socket', 'tinnhan', '2128', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:15.548', NULL),
(576, 1, 'gui_tin_nhan_socket', 'tinnhan', '2129', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:28.712', NULL),
(577, 1, 'gui_tin_nhan_socket', 'tinnhan', '2130', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:38.552', NULL),
(578, 1, 'gui_tin_nhan_socket', 'tinnhan', '2131', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:40.494', NULL),
(579, 1, 'gui_tin_nhan_socket', 'tinnhan', '2132', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:43.975', NULL),
(580, 1, 'gui_tin_nhan_socket', 'tinnhan', '2133', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:50.055', NULL),
(581, 1, 'gui_tin_nhan_socket', 'tinnhan', '2134', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:52.889', NULL),
(582, 1, 'gui_tin_nhan_socket', 'tinnhan', '2135', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:47:55.791', NULL),
(583, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 15:57:14.869', NULL),
(584, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 15:57:51.136', NULL),
(585, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 15:58:11.160', NULL),
(586, 1, 'gui_tin_nhan_socket', 'tinnhan', '2136', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:58:22.738', NULL),
(587, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 15:58:47.071', NULL),
(588, 1, 'gui_tin_nhan_socket', 'tinnhan', '2137', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 15:59:04.344', NULL),
(589, 1, 'gui_tin_nhan_socket', 'tinnhan', '2138', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:00:08.562', NULL),
(590, 1, 'gui_tin_nhan_socket', 'tinnhan', '2139', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:00:15.585', NULL),
(591, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:00:22.032', NULL),
(592, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:00:23.511', NULL),
(593, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:03:58.755', NULL),
(594, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/eN9VC4gIkX0:APA91bE0Uim2OZBpJhPZOh_u-RHk5lKwTfQsSNxtRaC8Dx5xUQdR0P6gmcqteE-paFp75TrRWu3Zv2ClLyY0ssNVrp114GVrLZan0v39Llpty895mn6jqV_F4vVcxs69HxPyjSVhHpb8', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/eN9VC4gIkX0:APA91bE0Uim2OZBpJhPZOh_u-RHk5lKwTfQsSNxtRaC8Dx5xUQdR0P6gmcqteE-paFp75TrRWu3Zv2ClLyY0ssNVrp114GVrLZan0v39Llpty895mn6jqV_F4vVcxs69HxPyjSVhHpb8\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BG-QEti_9iWmiUqfhWeV9_M1UC77c9U_QVgz1i8SB6jtwSbz9-kld751clt5-PM-aVc98dbFEWOx1C1fvoK8Zs4\",\"auth\":\"gz1Li1hLvNnbynPPUTN6TQ\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-12-08 16:04:28.094', NULL),
(595, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/eN9VC4gIkX0:APA91bE0Uim2OZBpJhPZOh_u-RHk5lKwTfQsSNxtRaC8Dx5xUQdR0P6gmcqteE-paFp75TrRWu3Zv2ClLyY0ssNVrp114GVrLZan0v39Llpty895mn6jqV_F4vVcxs69HxPyjSVhHpb8', NULL, '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/eN9VC4gIkX0:APA91bE0Uim2OZBpJhPZOh_u-RHk5lKwTfQsSNxtRaC8Dx5xUQdR0P6gmcqteE-paFp75TrRWu3Zv2ClLyY0ssNVrp114GVrLZan0v39Llpty895mn6jqV_F4vVcxs69HxPyjSVhHpb8\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BG-QEti_9iWmiUqfhWeV9_M1UC77c9U_QVgz1i8SB6jtwSbz9-kld751clt5-PM-aVc98dbFEWOx1C1fvoK8Zs4\",\"auth\":\"gz1Li1hLvNnbynPPUTN6TQ\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-12-08 16:04:42.632', NULL),
(596, 1, 'gui_tin_nhan_socket', 'tinnhan', '2140', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:05:03.213', NULL),
(597, 1, 'gui_tin_nhan_socket', 'tinnhan', '2141', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:05:11.105', NULL),
(598, 1, 'gui_tin_nhan_socket', 'tinnhan', '2142', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:05:33.472', NULL),
(599, 1, 'gui_tin_nhan_socket', 'tinnhan', '2143', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:05:45.865', NULL),
(600, 1, 'gui_tin_nhan_socket', 'tinnhan', '2144', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:06:53.195', NULL),
(601, 1, 'gui_tin_nhan_socket', 'tinnhan', '2145', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:06:55.901', NULL),
(602, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:07:07.531', NULL),
(603, 1, 'gui_tin_nhan_socket', 'tinnhan', '2146', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 16:29:35.252', NULL),
(604, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:29:45.742', NULL),
(605, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:29:47.991', NULL),
(606, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:30:28.239', NULL),
(607, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:30:35.649', NULL),
(608, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:30:45.687', NULL),
(609, 1, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-08 16:41:26.854', NULL),
(610, 1, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-08 16:41:38.061', NULL),
(611, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:48:35.019', NULL),
(612, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:48:50.742', NULL),
(613, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-11-08\",\"denNgay\":\"2025-12-08\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-08 16:49:48.055', NULL),
(614, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 16:50:20.754', NULL),
(615, 1, 'gui_tin_nhan_socket', 'tinnhan', '2147', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 22:32:16.194', NULL),
(616, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:32:32.714', NULL),
(617, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:32:40.017', NULL),
(618, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:32:42.881', NULL),
(619, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:32:46.107', NULL),
(620, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:32:58.700', NULL),
(621, 1, 'gui_tin_nhan_socket', 'tinnhan', '2148', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 22:33:09.717', NULL),
(622, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:33:15.958', NULL),
(623, 1, 'gui_tin_nhan_socket', 'tinnhan', '2149', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 22:33:22.411', NULL),
(624, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:33:28.799', NULL),
(625, 1, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-08 22:35:31.669', NULL),
(626, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:35:47.295', NULL),
(627, 1, 'gui_tin_nhan_socket', 'tinnhan', '2150', '\"{\\\"CuocHoiThoaiID\\\":219}\"', NULL, '', '', '2025-12-08 22:36:05.879', NULL),
(628, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:36:18.680', NULL),
(629, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:36:23.592', NULL),
(630, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:36:33.476', NULL);
INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(631, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 22:36:52.063', NULL),
(632, 1, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-08 22:37:42.784', NULL),
(633, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 23:12:16.852', NULL),
(634, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-08 23:38:25.504', NULL),
(635, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 00:13:45.817', NULL),
(636, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 00:16:00.913', NULL),
(637, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:26:56.240', NULL),
(638, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:26:59.613', NULL),
(639, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:27:08.912', NULL),
(640, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:27:21.876', NULL),
(641, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:29:25.158', NULL),
(642, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:29:28.426', NULL),
(643, 245, 'tao_cuoc_hen', 'CuocHen', '61', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-12-09 23:59:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-09 23:29:28.690', NULL),
(644, 245, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1765297821673\",\"soTien\":\"4000000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-09 23:30:20.339', NULL),
(645, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-09 23:45:26.533', NULL),
(646, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:06:51.121', NULL),
(647, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:06:57.784', NULL),
(648, NULL, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:07:57.236', NULL),
(649, NULL, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:08:05.255', NULL),
(650, 245, 'tao_cuoc_hen', 'CuocHen', '62', NULL, '{\"PhongID\":3,\"ThoiGianHen\":\"2025-12-10 01:39:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:09:32.095', NULL),
(651, 245, 'dat_coc_giu_cho', 'TinDang', '5', '{\"giaoDichId\":\"tmp-1765303791529\",\"soTien\":\"3000000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:09:52.224', NULL),
(652, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:10:06.501', NULL),
(653, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:10:13.567', NULL),
(654, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '23', NULL, '{\"batDau\":\"2025-12-10 07:00:00\",\"ketThuc\":\"2025-12-10 15:00:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:10:42.309', NULL),
(655, 8, 'tao_ca_lam_viec_sales', 'LichLamViec', '24', NULL, '{\"batDau\":\"2025-12-10 15:00:00\",\"ketThuc\":\"2025-12-10 23:00:00\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:10:58.676', NULL),
(656, 245, 'tao_cuoc_hen', 'CuocHen', '63', NULL, '{\"PhongID\":3,\"ThoiGianHen\":\"2025-12-10 10:42:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:12:46.913', NULL),
(657, 245, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '226', '\"{\\\"NguCanhID\\\":63,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[245,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:13:18.052', NULL),
(658, 245, 'gui_tin_nhan_socket', 'tinnhan', '2151', '\"{\\\"CuocHoiThoaiID\\\":226}\"', NULL, '', '', '2025-12-10 01:13:27.918', NULL),
(659, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 01:13:52.586', NULL),
(660, 245, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '226', '\"{\\\"NguCanhID\\\":63,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[245,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:15:14.065', NULL),
(661, 245, 'gui_tin_nhan_socket', 'tinnhan', '2152', '\"{\\\"CuocHoiThoaiID\\\":226}\"', NULL, '', '', '2025-12-10 01:15:16.862', NULL),
(662, 245, 'tao_cuoc_hen', 'CuocHen', '64', NULL, '{\"PhongID\":1,\"ThoiGianHen\":\"2025-12-17 07:48:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:18:31.776', NULL),
(663, 245, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1765304349998\",\"soTien\":\"3500000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:19:10.942', NULL),
(664, 245, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '227', '\"{\\\"NguCanhID\\\":64,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[245,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:20:35.527', NULL),
(665, 245, 'gui_tin_nhan_socket', 'tinnhan', '2153', '\"{\\\"CuocHoiThoaiID\\\":227}\"', NULL, '', '', '2025-12-10 01:20:40.397', NULL),
(666, 245, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1765305117360\",\"soTien\":\"3500000.00\",\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:31:58.000', NULL),
(667, 245, 'tao_cuoc_hen', 'CuocHen', '65', NULL, '{\"PhongID\":2,\"ThoiGianHen\":\"2025-12-10 02:02:00\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:32:17.447', NULL),
(668, 245, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '227', '\"{\\\"NguCanhID\\\":64,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[245,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:33:08.401', NULL),
(669, 245, 'gui_tin_nhan_socket', 'tinnhan', '2154', '\"{\\\"CuocHoiThoaiID\\\":227}\"', NULL, '', '', '2025-12-10 01:33:12.190', NULL),
(670, 245, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '227', '\"{\\\"NguCanhID\\\":64,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[245,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:33:55.342', NULL),
(671, 245, 'gui_tin_nhan_socket', 'tinnhan', '2155', '\"{\\\"CuocHoiThoaiID\\\":227}\"', NULL, '', '', '2025-12-10 01:33:59.594', NULL),
(672, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:39:16.318', NULL),
(673, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:42:07.250', NULL),
(674, NULL, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 01:43:12.471', NULL),
(675, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 04:38:46.539', NULL),
(676, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 04:38:54.619', NULL),
(677, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 04:40:59.951', NULL),
(678, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 05:11:14.074', NULL),
(679, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 05:11:20.582', NULL),
(680, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 05:12:00.108', NULL),
(681, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:22:41.496', NULL),
(682, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:24:15.211', NULL),
(683, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:24:28.932', NULL),
(684, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:33:11.363', NULL),
(685, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:37:07.379', NULL),
(686, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:38:01.035', NULL),
(687, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:38:18.727', NULL),
(688, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 05:38:36.468', NULL),
(689, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:02:02.756', NULL),
(690, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:03:57.015', NULL),
(691, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:04:02.130', NULL),
(692, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:06:44.765', NULL),
(693, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:09:52.743', NULL),
(694, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:10:02.976', NULL),
(695, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:10:09.666', NULL);
INSERT INTO `nhatkyhethong` (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`) VALUES
(696, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:10:27.757', NULL),
(697, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:11:25.407', NULL),
(698, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:13:41.184', NULL),
(699, 1, 'tao_cuoc_hoi_thoai', 'cuochoithoai', '228', '\"{\\\"NguCanhID\\\":61,\\\"NguCanhLoai\\\":\\\"CuocHen\\\",\\\"ThanhVienIDs\\\":[1,8]}\"', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:25:15.027', NULL),
(700, 1, 'phe_duyet_cuoc_hen', 'CuocHen', '63', '{\"pheDuyetChuDuAn\":\"ChoPheDuyet\"}', '{\"pheDuyetChuDuAn\":\"DaPheDuyet\",\"phuongThucVao\":\"Đến gọi anh\",\"ghiChu\":\"\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:26:00.689', NULL),
(701, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:43:58.008', NULL),
(702, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:47:03.505', NULL),
(703, 1, 'chu_du_an_xem_bao_cao_chi_tiet', 'BaoCao', NULL, NULL, '{\"loaiBaoCao\":\"ChiTiet\",\"tuNgay\":\"2025-11-10\",\"denNgay\":\"2025-12-10\"}', '::ffff:127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 06:47:34.163', NULL),
(704, 1, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 06:54:39.355', NULL),
(705, NULL, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:07:21.947', NULL),
(706, 7, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:07:52.264', NULL),
(707, 7, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:08:16.674', NULL),
(708, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 07:11:17.664', NULL),
(709, 8, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 07:11:31.946', NULL),
(710, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:16:08.575', NULL),
(711, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:17:14.821', NULL),
(712, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:17:33.810', NULL),
(713, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:17:54.141', NULL),
(714, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:18:31.584', NULL),
(715, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:26:51.527', NULL),
(716, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:27:12.105', NULL),
(717, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:29:41.522', NULL),
(718, NULL, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', 'unsubscribed', '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 07:34:52.170', NULL),
(719, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:40:03.984', NULL),
(720, 245, 'push_subscribe', 'PushSubscription', 'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfd', NULL, '{\"endpoint\":\"https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAA2qwsAdfS0eHc5j7L280ZeSEcOLT5v0IuK73BPixOBEN50Ph6NQFZemrFLe20msIAB%2bjQQoi6Wo%2fhILYCUeS%2f1grZn8Jmt387rP2EIwMV0UUgVfeZiOzd%2b7gOtkaF2REbw1iiqe%2fPgtYe%2bb0OmpY4aJP87oJTW2%2f836SAJa0b4bhpdgRCX%2bFjZz9mfdcI58mjwiH0n%2bTcEmGCQ29XXO%2fKVLp8uiUGjf7QDyml%2fyJHnhySRBsz6ilMbl0WvtwTlbnl5zQFRNddeq4RTWr0F4GHH5NF0Tk3r6q9byD6AUQ5jbdtciHKFwGbHF1azqZT95DtDPQYcHoyMW2LI92ljcKtuG9%2fePgKkvzXHvnH0gogtXQ%3d%3d\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BNGBitDVurUJicjo4STso6VhhEyEbN61YC6BJEQLcG1E02meunSVba67mdwpUTlK5bHBLSRJIZSKm3f-JvhE008\",\"auth\":\"4jIl7NpffhYWVoGLZgIHUA\"},\"platform\":\"Win32\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:42:28.451', NULL),
(721, 245, 'dat_coc_giu_cho', 'TinDang', '4', '{\"giaoDichId\":\"tmp-1765327370482\",\"soTien\":4000000,\"soThangKy\":6,\"noiDungSnapshotPreview\":\"<div style=\\\"max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px 50px; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: \'Times New Roman\', Times, serif; font-size: 13pt; line-height: 1.5; color: #000;\\\">\\n\\n    <div style=\\\"text-align: center; margin-bottom: 20px;\\\">\\n        <p style=\\\"margin: 0; font-weight: bold; text-transform: uppercase;\\\">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>\\n        <p style=\\\"margin: 5px 0 0 0; font-weight: bold; text-decoration: underline;\\\">Độc lập - Tự do - Hạnh phúc</p>\\n    </div>\\n\\n    <p style=\\\"text-align: right; margin-bottom: 30px; font-style: italic;\\\">\\n        .........., ngày .... tháng .... năm ....\\n    </p>\\n\\n    <h1 style=\\\"text-align: center; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px;\\\">\\n        HỢP ĐỒNG THUÊ NHÀ & ĐẶT CỌC AN NINH\\n    </h1>\\n\\n    <div style=\\\"margin-bottom: 20px; font-style: italic;\\\">\\n        <p style=\\\"margin: 5px 0;\\\">Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Tổ Chức S\"}', NULL, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2025-12-10 07:42:50.808', NULL),
(722, 1, 'push_subscribe', 'PushSubscription', 'https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3', NULL, '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/euA065eI9ic:APA91bELLr6b0EpmvIgcRF7ZSNke-i4LIWGPgRsVsLrMBTzndELX5TduOsOdXbPs53SdrKLloFf8l7NuKDMoM65xQT-E3-AJUNnuy2_O3k1zua5W2UnHelv8uOdNn3HbyuJlmz1xkEI3\",\"expirationTime\":null,\"keys\":{\"p256dh\":\"BGAFr-vpl7KTrBlALg6jyj8EgtUxIjx8VodlP6MHFVXCrdC8af4S55fJUt9sr3-EmtJ3OYAw-5U5ex6MpvOJuG0\",\"auth\":\"Qxvil9HMRtykvRf0cD03Rg\"},\"platform\":\"Linux armv81\"}', '::1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', '2025-12-10 07:43:21.528', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `noidunghethong`
--

CREATE TABLE `noidunghethong` (
  `NoiDungID` int(11) NOT NULL,
  `LoaiNoiDung` varchar(50) DEFAULT NULL,
  `TieuDe` varchar(255) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `PhienBan` varchar(50) DEFAULT NULL,
  `CapNhatBoiID` int(11) DEFAULT NULL,
  `CapNhatLuc` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `noidunghethong`
--

INSERT INTO `noidunghethong` (`NoiDungID`, `LoaiNoiDung`, `TieuDe`, `NoiDung`, `PhienBan`, `CapNhatBoiID`, `CapNhatLuc`) VALUES
(1, 'POLICY_PRIVACY', 'Chính sách bảo mật thông tin', 'Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của người dùng. Dữ liệu chỉ được sử dụng cho mục đích xác thực danh tính và giao dịch thuê phòng.1', '1.0', 225, '2025-11-27 22:33:36'),
(2, 'TERMS_USAGE', 'Điều khoản sử dụng dịch vụ', 'Người dùng cam kết cung cấp thông tin trung thực. Nghiêm cấm đăng tin sai sự thật, lừa đảo. Tài khoản vi phạm sẽ bị khóa.', '1.0', 1, '2025-11-27 22:08:34'),
(3, 'POLICY_PAYMENT', 'Chính sách Đặt cọc và Hoàn tiền', 'Tiền cọc được giữ bởi hệ thống/chủ trọ. Hủy trước 7 ngày hoàn 50%, hủy sau đó không hoàn lại. Chủ nhà hủy hoàn 100%.', '1.1', 1, '2025-11-27 22:08:34'),
(4, 'GUIDE_BOOKING', 'Hướng dẫn quy trình thuê phòng', 'Bước 1: Tìm phòng và xem chi tiết. Bước 2: Liên hệ chủ trọ hoặc đặt lịch xem. Bước 3: Đặt cọc online để giữ chỗ. Bước 4: Ký hợp đồng và nhận phòng.', '1.0', 1, '2025-11-27 22:08:34'),
(5, 'POLICY_PRIVACY', 'dsdad', 'dấdas', '1.0', 225, '2025-11-27 22:33:50');

-- --------------------------------------------------------

--
-- Table structure for table `phong`
--

CREATE TABLE `phong` (
  `PhongID` int(11) NOT NULL,
  `DuAnID` int(11) NOT NULL COMMENT 'Phòng thuộc dự án nào',
  `TenPhong` varchar(100) NOT NULL COMMENT 'Tên/Số phòng (VD: 101, A01, ...)',
  `TrangThai` enum('Trong','GiuCho','DaThue','DonDep') NOT NULL DEFAULT 'Trong' COMMENT 'Trạng thái duy nhất của phòng',
  `GiaChuan` decimal(15,2) DEFAULT NULL COMMENT 'Giá chuẩn (VNĐ/tháng)',
  `DienTichChuan` decimal(5,2) DEFAULT NULL COMMENT 'Diện tích chuẩn (m²)',
  `MoTaPhong` text DEFAULT NULL COMMENT 'Đặc điểm: tầng, hướng, view, nội thất...',
  `HinhAnhPhong` varchar(500) DEFAULT NULL COMMENT 'Hình đại diện phòng (1 hình)',
  `TaoLuc` datetime NOT NULL DEFAULT current_timestamp(),
  `CapNhatLuc` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Bảng phòng Master - Thuộc Dự án (1 phòng vật lý = 1 bản ghi)';

--
-- Dumping data for table `phong`
--

INSERT INTO `phong` (`PhongID`, `DuAnID`, `TenPhong`, `TrangThai`, `GiaChuan`, `DienTichChuan`, `MoTaPhong`, `HinhAnhPhong`, `TaoLuc`, `CapNhatLuc`) VALUES
(1, 14, '006', 'GiuCho', 3500000.00, 25.00, NULL, '/uploads/1759483387245.jpg', '2025-10-03 16:23:07', '2025-12-10 01:31:57'),
(2, 14, '1006', 'GiuCho', 4000000.00, 25.00, NULL, '/uploads/1759483387258.jpg', '2025-10-03 16:23:07', '2025-12-10 07:42:50'),
(3, 15, '101', 'Trong', 3000000.00, 25.00, NULL, '/uploads/1759501859518.jpg', '2025-10-03 21:30:59', '2025-12-10 01:11:48'),
(4, 15, '102', 'Trong', 10000.00, 50.00, NULL, '/uploads/1759501859521.jpg', '2025-10-03 21:30:59', '2025-11-28 22:00:18'),
(5, 17, '006', 'Trong', 3000000.00, 30.00, NULL, '/uploads/1759658857264.jpg', '2025-10-05 17:07:37', '2025-11-28 15:47:26'),
(6, 17, '006A', 'Trong', 3500000.00, 30.00, NULL, '/uploads/1759658857272.jpg', '2025-10-05 17:07:37', '2025-10-09 17:12:35'),
(7, 14, '202', 'Trong', 7700000.00, 55.00, 'Đây là căn 2 phòng ngủ full nội thất', NULL, '2025-10-10 18:52:58', '2025-11-29 10:02:51'),
(8, 16, '101', 'Trong', 4000000.00, 25.00, 'Phòng có đầy đủ nội thất cơ bản nhưng không có bếp\n', NULL, '2025-10-10 21:34:35', '2025-10-10 21:34:35');

-- --------------------------------------------------------

--
-- Table structure for table `phong_tindang`
--

CREATE TABLE `phong_tindang` (
  `PhongTinDangID` int(11) NOT NULL,
  `PhongID` int(11) NOT NULL COMMENT 'FK đến bảng phong',
  `TinDangID` int(11) NOT NULL COMMENT 'FK đến bảng tindang',
  `GiaTinDang` decimal(15,2) DEFAULT NULL COMMENT 'Giá riêng cho tin này (NULL = dùng GiaChuan)',
  `DienTichTinDang` decimal(5,2) DEFAULT NULL COMMENT 'Diện tích riêng (NULL = dùng DienTichChuan)',
  `MoTaTinDang` text DEFAULT NULL COMMENT 'Mô tả marketing riêng (VD: "Ưu đãi SV", "Tặng 1 tháng")',
  `HinhAnhTinDang` varchar(500) DEFAULT NULL COMMENT 'Hình riêng (NULL = dùng HinhAnhPhong)',
  `ThuTuHienThi` int(11) NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị trong tin đăng',
  `TaoLuc` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Mapping N-N giữa Phòng và Tin đăng (lưu metadata riêng cho mỗi tin)';

--
-- Dumping data for table `phong_tindang`
--

INSERT INTO `phong_tindang` (`PhongTinDangID`, `PhongID`, `TinDangID`, `GiaTinDang`, `DienTichTinDang`, `MoTaTinDang`, `HinhAnhTinDang`, `ThuTuHienThi`, `TaoLuc`) VALUES
(1, 1, 4, NULL, NULL, NULL, NULL, 0, '2025-10-03 16:23:07'),
(2, 2, 4, NULL, NULL, NULL, NULL, 0, '2025-10-03 16:23:07'),
(3, 3, 6, NULL, NULL, NULL, NULL, 0, '2025-10-03 21:30:59'),
(4, 4, 6, 10000.00, NULL, NULL, NULL, 1, '2025-10-03 21:30:59'),
(5, 5, 8, NULL, NULL, NULL, NULL, 0, '2025-10-05 17:07:37'),
(6, 6, 8, NULL, NULL, NULL, NULL, 0, '2025-10-05 17:07:37'),
(7, 7, 9, NULL, NULL, NULL, '/uploads/1760102566463.jpg', 0, '2025-10-10 20:22:46'),
(8, 8, 7, NULL, NULL, NULL, '/uploads/1760107658795.jpg', 0, '2025-10-10 21:44:15'),
(9, 4, 5, NULL, NULL, NULL, NULL, 0, '2025-10-10 21:44:52'),
(10, 3, 5, NULL, NULL, NULL, NULL, 1, '2025-10-10 21:44:52'),
(21, 6, 15, 2000000.00, NULL, NULL, NULL, 0, '2025-11-29 10:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `quyen`
--

CREATE TABLE `quyen` (
  `QuyenID` int(11) NOT NULL,
  `MaQuyen` varchar(100) NOT NULL,
  `MoTa` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanhviencuochoithoai`
--

CREATE TABLE `thanhviencuochoithoai` (
  `CuocHoiThoaiID` int(11) NOT NULL,
  `NguoiDungID` int(11) NOT NULL,
  `ThamGiaLuc` datetime DEFAULT current_timestamp(),
  `TinNhanCuoiDocLuc` datetime DEFAULT NULL COMMENT 'Thời điểm tin nhắn cuối được đọc bởi thành viên'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `thanhviencuochoithoai`
--

INSERT INTO `thanhviencuochoithoai` (`CuocHoiThoaiID`, `NguoiDungID`, `ThamGiaLuc`, `TinNhanCuoiDocLuc`) VALUES
(201, 6, '2025-11-02 22:05:27', '2025-11-06 20:09:34'),
(201, 201, '2025-11-02 22:05:27', '2025-11-04 22:05:27'),
(202, 6, '2025-11-03 22:05:27', '2025-11-06 20:09:38'),
(202, 202, '2025-11-03 22:05:27', '2025-11-04 22:05:27'),
(203, 6, '2025-11-04 19:05:27', '2025-11-06 20:09:30'),
(203, 201, '2025-11-04 19:05:27', '2025-11-04 22:05:27'),
(204, 6, '2025-11-04 17:05:27', '2025-11-06 20:09:33'),
(204, 203, '2025-11-04 17:05:27', '2025-11-04 21:55:27'),
(219, 1, '2025-11-19 00:40:05', '2025-12-08 22:36:03'),
(219, 8, '2025-11-19 00:16:56', '2025-12-08 22:36:19'),
(220, 7, '2025-11-19 06:27:41', NULL),
(220, 8, '2025-11-19 06:27:41', '2025-11-22 20:42:44'),
(221, 7, '2025-11-19 13:42:47', NULL),
(221, 8, '2025-11-19 13:42:47', '2025-11-19 13:44:38'),
(224, 7, '2025-11-20 12:31:06', NULL),
(224, 8, '2025-11-20 12:31:06', '2025-11-20 12:31:06'),
(225, 7, '2025-11-29 11:19:38', '2025-11-29 11:19:47'),
(225, 8, '2025-11-29 11:19:38', NULL),
(226, 8, '2025-12-10 01:13:18', NULL),
(226, 245, '2025-12-10 01:13:18', '2025-12-10 01:15:14'),
(227, 8, '2025-12-10 01:20:35', NULL),
(227, 245, '2025-12-10 01:20:35', '2025-12-10 01:33:56'),
(228, 1, '2025-12-10 06:25:15', '2025-12-10 06:25:16'),
(228, 8, '2025-12-10 06:25:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `thongbao`
--

CREATE TABLE `thongbao` (
  `ThongBaoID` int(11) NOT NULL,
  `NguoiNhanID` int(11) DEFAULT NULL,
  `Kenh` varchar(50) DEFAULT NULL,
  `TieuDe` varchar(255) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `Payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `TrangThai` varchar(50) DEFAULT NULL,
  `SoLanThu` int(11) DEFAULT 0,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `GuiLuc` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `thongbao`
--

INSERT INTO `thongbao` (`ThongBaoID`, `NguoiNhanID`, `Kenh`, `TieuDe`, `NoiDung`, `Payload`, `TrangThai`, `SoLanThu`, `TaoLuc`, `GuiLuc`) VALUES
(1, 1, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 22:36:00 28/11/2025 tại 350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":55,\"ThoiGianHen\":\"2025-11-28T15:36:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-11-28 22:07:00', '2025-11-28 22:07:00'),
(2, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Ali', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2088,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Ali\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-28 22:18:58', '2025-11-28 22:18:58'),
(3, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2089,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-28 22:18:58', '2025-11-28 22:18:58'),
(4, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2090,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-28 22:19:02', '2025-11-28 22:19:02'),
(5, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2091,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-28 22:19:08', '2025-11-28 22:19:08'),
(6, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2092,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-28 22:19:20', '2025-11-28 22:19:20'),
(7, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NDM0MzE2NDc5MH0=\"}', 'DaDoc', 0, '2025-11-28 22:19:24', '2025-11-28 22:19:24'),
(8, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NDM0MzE5MjkzMn0=\"}', 'DaDoc', 0, '2025-11-28 22:19:53', '2025-11-28 22:19:53'),
(9, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NDM0MzMxOTUzM30=\"}', 'DaDoc', 0, '2025-11-28 22:21:59', '2025-11-28 22:21:59'),
(10, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NDM0MzQ1NTUxMX0=\"}', 'DaDoc', 0, '2025-11-28 22:24:15', '2025-11-28 22:24:15'),
(11, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NDM0MzQ4NDc1Nn0=\"}', 'DaDoc', 0, '2025-11-28 22:24:44', '2025-11-28 22:24:44'),
(12, 1, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 09:46:00 30/11/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":56,\"ThoiGianHen\":\"2025-11-30T02:46:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-11-29 09:16:52', '2025-11-29 09:16:52'),
(13, 1, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 09:53:00 2/12/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":57,\"ThoiGianHen\":\"2025-12-02T02:53:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-11-29 09:23:23', '2025-11-29 09:23:23'),
(14, 1, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 10:00:00 2/12/2025 tại 350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":58,\"ThoiGianHen\":\"2025-12-02T03:00:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-11-29 09:31:05', '2025-11-29 09:31:05'),
(15, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 10:32:00 29/11/2025 tại 350 Nguyễn Văn Lượng, Phường 16, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":59,\"ThoiGianHen\":\"2025-11-29T03:32:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'DaDoc', 0, '2025-11-29 10:02:11', '2025-11-29 10:02:11'),
(16, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với Lam Ngoc Giang vào 03:45:00 30/11/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":60,\"ThoiGianHen\":\"2025-11-29T20:45:00.000Z\",\"TenKhachHang\":\"Lam Ngoc Giang\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'DaDoc', 0, '2025-11-29 11:15:56', '2025-11-29 11:15:56'),
(17, 8, 'in-app', 'Tin nhắn mới', 'Lam Ngoc Giang: chaof ban', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":225,\"TinNhanID\":2093,\"NguoiGuiTen\":\"Lam Ngoc Giang\",\"NoiDung\":\"chaof ban\",\"NguCanhID\":60,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-11-29 11:19:55', '2025-11-29 11:19:55'),
(18, 8, 'in-app', 'Cuộc gọi video đến', 'Lam Ngoc Giang đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":225,\"NguoiGoiID\":7,\"NguoiGoiTen\":\"Lam Ngoc Giang\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIyNQ?data=eyJ1c2VybmFtZSI6IkxhbSBOZ29jIEdpYW5nIiwidXNlcmlkIjo3LCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjQzOTAwMDY3NTJ9\"}', 'DaDoc', 0, '2025-11-29 11:20:06', '2025-11-29 11:20:06'),
(19, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Văn Chủ Dự Án: Alo aaalo lo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2094,\"NguoiGuiTen\":\"Nguyễn Văn Chủ Dự Án\",\"NoiDung\":\"Alo aaalo lo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-06 19:15:41', '2025-12-06 19:15:41'),
(20, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Văn Chủ Dự Án đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Văn Chủ Dự Án\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIFbEg24gQ2jhu6cgROG7sSDDgW4iLCJ1c2VyaWQiOjEsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NTAyMzM4MDY1M30=\"}', 'DaDoc', 0, '2025-12-06 19:16:21', '2025-12-06 19:16:21'),
(21, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUwMjkyNTI3ODh9\"}', 'DaDoc', 0, '2025-12-06 20:54:12', '2025-12-06 20:54:12'),
(22, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2095,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-06 20:54:34', '2025-12-06 20:54:34'),
(23, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2096,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-06 20:54:50', '2025-12-06 20:54:50'),
(24, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2097,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-06 20:54:53', '2025-12-06 20:54:53'),
(25, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUwMjkzMDM0MjN9\"}', 'DaDoc', 0, '2025-12-06 20:55:03', '2025-12-06 20:55:03'),
(26, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2098,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 14:23:30', '2025-12-08 14:23:30'),
(27, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2099,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 14:23:47', '2025-12-08 14:23:47'),
(28, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2100,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:04:15', '2025-12-08 15:04:15'),
(29, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2101,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:04:20', '2025-12-08 15:04:20'),
(30, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2102,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:35:45', '2025-12-08 15:35:45'),
(31, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: hello', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2103,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"hello\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:35:55', '2025-12-08 15:35:55'),
(32, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUxODI5Njc3Nzl9\"}', 'DaDoc', 0, '2025-12-08 15:36:07', '2025-12-08 15:36:07'),
(33, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2104,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:30', '2025-12-08 15:36:30'),
(34, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2105,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:32', '2025-12-08 15:36:32'),
(35, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2106,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:35', '2025-12-08 15:36:35'),
(36, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2107,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:39', '2025-12-08 15:36:39'),
(37, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2108,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:41', '2025-12-08 15:36:41'),
(38, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2109,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:49', '2025-12-08 15:36:49'),
(39, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2110,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:51', '2025-12-08 15:36:51'),
(40, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2111,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:36:59', '2025-12-08 15:36:59'),
(41, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2112,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:37:22', '2025-12-08 15:37:22'),
(42, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: bạn ey', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2113,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"bạn ey\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:38:39', '2025-12-08 15:38:39'),
(43, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2114,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:41:34', '2025-12-08 15:41:34'),
(44, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2115,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:42:34', '2025-12-08 15:42:34'),
(45, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: Alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2116,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"Alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:42:39', '2025-12-08 15:42:39'),
(46, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: Ali', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2117,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"Ali\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:43:08', '2025-12-08 15:43:08'),
(47, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUxODMzOTE1Mjh9\"}', 'DaDoc', 0, '2025-12-08 15:43:11', '2025-12-08 15:43:11'),
(48, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUxODM0MTE2NjJ9\"}', 'DaDoc', 0, '2025-12-08 15:43:31', '2025-12-08 15:43:31'),
(49, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2118,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:45:11', '2025-12-08 15:45:11'),
(50, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2119,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:45:48', '2025-12-08 15:45:48'),
(51, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2120,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:45:52', '2025-12-08 15:45:52'),
(52, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2121,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:45:55', '2025-12-08 15:45:55'),
(53, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2122,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:06', '2025-12-08 15:46:06'),
(54, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2123,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:12', '2025-12-08 15:46:12'),
(55, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2124,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:22', '2025-12-08 15:46:22'),
(56, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2125,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:25', '2025-12-08 15:46:25'),
(57, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2126,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:42', '2025-12-08 15:46:42'),
(58, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2127,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:46:53', '2025-12-08 15:46:53'),
(59, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2128,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:15', '2025-12-08 15:47:15'),
(60, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2129,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:28', '2025-12-08 15:47:28'),
(61, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2130,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:38', '2025-12-08 15:47:38'),
(62, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2131,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:40', '2025-12-08 15:47:40'),
(63, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2132,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:43', '2025-12-08 15:47:43'),
(64, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2133,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:50', '2025-12-08 15:47:50'),
(65, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2134,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:52', '2025-12-08 15:47:52'),
(66, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: alo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2135,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"alo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:47:55', '2025-12-08 15:47:55'),
(67, 8, 'in-app', 'Cuộc gọi video đến', 'Nguyễn Hữu Anh Khoa đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":219,\"NguoiGoiID\":1,\"NguoiGoiTen\":\"Nguyễn Hữu Anh Khoa\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIxOQ?data=eyJ1c2VybmFtZSI6Ik5ndXnhu4VuIEjhu691IEFuaCBLaG9hIiwidXNlcmlkIjoxLCJwYXJ0bmVyX25hbWUiOiJOZ3V54buFbiBWxINuIELDoW4gSMOgbmciLCJ0aW1lc3RhbXAiOjE3NjUxODM3NTExMDJ9\"}', 'DaDoc', 0, '2025-12-08 15:49:11', '2025-12-08 15:49:11'),
(68, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: hello', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2136,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"hello\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:58:22', '2025-12-08 15:58:22'),
(69, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: hello', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2137,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"hello\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 15:59:04', '2025-12-08 15:59:04'),
(70, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2138,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:00:08', '2025-12-08 16:00:08'),
(71, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: hello', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2139,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"hello\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:00:15', '2025-12-08 16:00:15'),
(72, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2140,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:05:03', '2025-12-08 16:05:03'),
(73, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2141,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:05:11', '2025-12-08 16:05:11'),
(74, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2142,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:05:33', '2025-12-08 16:05:33'),
(75, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2143,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:05:45', '2025-12-08 16:05:45'),
(76, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2144,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:06:53', '2025-12-08 16:06:53'),
(77, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: allo', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2145,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\"allo\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:06:55', '2025-12-08 16:06:55'),
(78, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: .', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2146,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\".\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 16:29:35', '2025-12-08 16:29:35'),
(79, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: .', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2147,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\".\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 22:32:16', '2025-12-08 22:32:16'),
(80, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: .', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2148,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\".\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 22:33:09', '2025-12-08 22:33:09'),
(81, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: .', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2149,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\".\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 22:33:22', '2025-12-08 22:33:22'),
(82, 8, 'in-app', 'Tin nhắn mới', 'Nguyễn Hữu Anh Khoa: .', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":219,\"TinNhanID\":2150,\"NguoiGuiTen\":\"Nguyễn Hữu Anh Khoa\",\"NoiDung\":\".\",\"NguCanhID\":29,\"NguCanhLoai\":\"CuocHen\"}', 'DaDoc', 0, '2025-12-08 22:36:05', '2025-12-08 22:36:05'),
(83, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 23:59:00 9/12/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":61,\"ThoiGianHen\":\"2025-12-09T16:59:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"1006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-12-09 23:29:28', '2025-12-09 23:29:28'),
(84, 8, 'in-app', 'Cuộc hẹn chờ phê duyệt', 'Cuộc hẹn với kiên mặt lợn vào 01:39:00 10/12/2025 đang chờ Chủ dự án phê duyệt', '{\"type\":\"cuoc_hen_cho_phe_duyet\",\"CuocHenID\":62,\"ThoiGianHen\":\"2025-12-09T18:39:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\"}', 'ChuaDoc', 0, '2025-12-10 01:09:32', '2025-12-10 01:09:32'),
(85, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 01:39:00 10/12/2025 tại 27 Nguyễn Như Hạnh, Phường Hòa Minh, Quận Liên Chiểu, Đà Nẵng', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":62,\"ThoiGianHen\":\"2025-12-09T18:39:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"101\",\"TieuDeTinDang\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\"}', 'ChuaDoc', 0, '2025-12-10 01:09:32', '2025-12-10 01:09:32'),
(86, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 10:42:00 10/12/2025 tại 27 Nguyễn Như Hạnh, Phường Hòa Minh, Quận Liên Chiểu, Đà Nẵng', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":63,\"ThoiGianHen\":\"2025-12-10T03:42:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"101\",\"TieuDeTinDang\":\"Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên\"}', 'ChuaDoc', 0, '2025-12-10 01:12:46', '2025-12-10 01:12:46'),
(87, 8, 'in-app', 'Cuộc hẹn chờ phê duyệt', 'Cuộc hẹn với kiên mặt lợn vào 10:42:00 10/12/2025 đang chờ Chủ dự án phê duyệt', '{\"type\":\"cuoc_hen_cho_phe_duyet\",\"CuocHenID\":63,\"ThoiGianHen\":\"2025-12-10T03:42:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\"}', 'ChuaDoc', 0, '2025-12-10 01:12:46', '2025-12-10 01:12:46'),
(88, 8, 'in-app', 'Tin nhắn mới', 'kiên mặt lợn: test', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":226,\"TinNhanID\":2151,\"NguoiGuiTen\":\"kiên mặt lợn\",\"NoiDung\":\"test\",\"NguCanhID\":63,\"NguCanhLoai\":\"CuocHen\"}', 'ChuaDoc', 0, '2025-12-10 01:13:27', '2025-12-10 01:13:27'),
(89, 8, 'in-app', 'Tin nhắn mới', 'kiên mặt lợn: dskfhdsfdjksfsd', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":226,\"TinNhanID\":2152,\"NguoiGuiTen\":\"kiên mặt lợn\",\"NoiDung\":\"dskfhdsfdjksfsd\",\"NguCanhID\":63,\"NguCanhLoai\":\"CuocHen\"}', 'ChuaDoc', 0, '2025-12-10 01:15:16', '2025-12-10 01:15:16'),
(90, 8, 'in-app', 'Cuộc gọi video đến', 'kiên mặt lợn đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":226,\"NguoiGoiID\":245,\"NguoiGoiTen\":\"kiên mặt lợn\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIyNg?data=eyJ1c2VybmFtZSI6Imtpw6puIG3hurd0IGzhu6NuIiwidXNlcmlkIjoyNDUsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NTMwNDEyODI4MH0=\"}', 'ChuaDoc', 0, '2025-12-10 01:15:28', '2025-12-10 01:15:28'),
(91, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 07:48:00 17/12/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":64,\"ThoiGianHen\":\"2025-12-17T00:48:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-12-10 01:18:31', '2025-12-10 01:18:31'),
(92, 8, 'in-app', 'Tin nhắn mới', 'kiên mặt lợn: bshdshdshdhsd', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":227,\"TinNhanID\":2153,\"NguoiGuiTen\":\"kiên mặt lợn\",\"NoiDung\":\"bshdshdshdhsd\",\"NguCanhID\":64,\"NguCanhLoai\":\"CuocHen\"}', 'ChuaDoc', 0, '2025-12-10 01:20:40', '2025-12-10 01:20:40'),
(93, 8, 'in-app', 'Cuộc hẹn mới được phân công', 'Bạn có cuộc hẹn mới với kiên mặt lợn vào 02:02:00 10/12/2025 tại 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp, TP. Hồ Chí Minh', '{\"type\":\"cuoc_hen_moi\",\"CuocHenID\":65,\"ThoiGianHen\":\"2025-12-09T19:02:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\",\"TenPhong\":\"1006\",\"TieuDeTinDang\":\"Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10\"}', 'ChuaDoc', 0, '2025-12-10 01:32:17', '2025-12-10 01:32:17'),
(94, 8, 'in-app', 'Tin nhắn mới', 'kiên mặt lợn: hjkdhádskhạdsakjsa', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":227,\"TinNhanID\":2154,\"NguoiGuiTen\":\"kiên mặt lợn\",\"NoiDung\":\"hjkdhádskhạdsakjsa\",\"NguCanhID\":64,\"NguCanhLoai\":\"CuocHen\"}', 'ChuaDoc', 0, '2025-12-10 01:33:12', '2025-12-10 01:33:12'),
(95, 8, 'in-app', 'Cuộc gọi video đến', 'kiên mặt lợn đang gọi video cho bạn', '{\"type\":\"video_call\",\"CuocHoiThoaiID\":227,\"NguoiGoiID\":245,\"NguoiGoiTen\":\"kiên mặt lợn\",\"RoomUrl\":\"https://jbcalling.site/room/ZGFwaG9uZ3Ryb19jaGF0XzIyNw?data=eyJ1c2VybmFtZSI6Imtpw6puIG3hurd0IGzhu6NuIiwidXNlcmlkIjoyNDUsInBhcnRuZXJfbmFtZSI6Ik5ndXnhu4VuIFbEg24gQsOhbiBIw6BuZyIsInRpbWVzdGFtcCI6MTc2NTMwNTE5OTg4N30=\"}', 'ChuaDoc', 0, '2025-12-10 01:33:19', '2025-12-10 01:33:19'),
(96, 8, 'in-app', 'Tin nhắn mới', 'kiên mặt lợn: kjgkg', '{\"type\":\"tro_chuyen_moi\",\"CuocHoiThoaiID\":227,\"TinNhanID\":2155,\"NguoiGuiTen\":\"kiên mặt lợn\",\"NoiDung\":\"kjgkg\",\"NguCanhID\":64,\"NguCanhLoai\":\"CuocHen\"}', 'ChuaDoc', 0, '2025-12-10 01:33:59', '2025-12-10 01:33:59'),
(97, 8, 'in-app', 'Cuộc hẹn đã được phê duyệt', 'Cuộc hẹn với kiên mặt lợn vào 10:42:00 10/12/2025 đã được Chủ dự án phê duyệt', '{\"type\":\"cuoc_hen_da_phe_duyet\",\"CuocHenID\":63,\"ThoiGianHen\":\"2025-12-10T03:42:00.000Z\",\"TenKhachHang\":\"kiên mặt lợn\"}', 'ChuaDoc', 0, '2025-12-10 06:26:00', '2025-12-10 06:26:00');

-- --------------------------------------------------------

--
-- Table structure for table `thongketindang`
--

CREATE TABLE `thongketindang` (
  `ThongKeID` int(11) NOT NULL,
  `TinDangID` int(11) DEFAULT NULL,
  `Ky` date DEFAULT NULL,
  `SoLuotXem` int(11) DEFAULT 0,
  `SoYeuThich` int(11) DEFAULT 0,
  `SoCuocHen` int(11) DEFAULT 0,
  `SoHopDong` int(11) DEFAULT 0,
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tindang`
--

CREATE TABLE `tindang` (
  `TinDangID` int(11) NOT NULL,
  `DuAnID` int(11) DEFAULT NULL,
  `KhuVucID` int(11) DEFAULT NULL,
  `ChinhSachCocID` int(11) DEFAULT NULL,
  `TieuDe` varchar(255) DEFAULT NULL,
  `URL` text DEFAULT NULL COMMENT 'JSON array URLs hình ảnh tin đăng: ["/uploads/1.jpg", "/uploads/2.jpg", ...]',
  `MoTa` text DEFAULT NULL,
  `TienIch` text DEFAULT NULL COMMENT 'JSON array tiện ích: ["Wifi", "Máy lạnh", "Nóng lạnh", "Giường", "Tủ quần áo", ...]',
  `GiaDien` decimal(10,2) DEFAULT NULL COMMENT 'Giá điện (VNĐ/kWh) - Ví dụ: 3500.00 = 3,500đ/kWh',
  `GiaNuoc` decimal(10,2) DEFAULT NULL COMMENT 'Giá nước (VNĐ/m³) - Ví dụ: 20000.00 = 20,000đ/khối',
  `GiaDichVu` decimal(10,2) DEFAULT NULL COMMENT 'Phí dịch vụ (VNĐ/tháng) - Ví dụ: 150000.00 = 150,000đ/tháng',
  `MoTaGiaDichVu` varchar(500) DEFAULT NULL COMMENT 'Mô tả chi tiết phí dịch vụ bao gồm: rác, vệ sinh chung, bảo vệ, internet, ...',
  `TrangThai` enum('Nhap','ChoDuyet','DaDuyet','DaDang','TamNgung','TuChoi','LuuTru') NOT NULL DEFAULT 'Nhap',
  `LyDoTuChoi` text DEFAULT NULL,
  `DuyetBoiNhanVienID` int(11) DEFAULT NULL,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `DuyetLuc` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tindang`
--

INSERT INTO `tindang` (`TinDangID`, `DuAnID`, `KhuVucID`, `ChinhSachCocID`, `TieuDe`, `URL`, `MoTa`, `TienIch`, `GiaDien`, `GiaNuoc`, `GiaDichVu`, `MoTaGiaDichVu`, `TrangThai`, `LyDoTuChoi`, `DuyetBoiNhanVienID`, `TaoLuc`, `CapNhatLuc`, `DuyetLuc`) VALUES
(1, 5, 944, 1, 'Khuyến mãi cực sốc, Hợp đồng 6 tháng tặng ngay 500k', '[\"/uploads/1759658857045.jpg\",\"/uploads/1759658857116.jpg\",\"/uploads/1759658857163.jpg\",\"/uploads/1759658857213.jpg\"]', 'Báo Cáo Phân Tích Chuyên Sâu: 3 Mô Hình Kinh Doanh Tối Ưu Cho Mặt Bằng Thị Trấn Bình Thuận\n\n\nLời Mở Đầu: Bối Cảnh và Phương Pháp Luận', '[\"Wifi\", \"Máy lạnh\", \"Nóng lạnh\", \"Giường\", \"Tủ quần áo\"]', 3500.00, 20000.00, 150000.00, 'Bao gồm: Thu gom rác, vệ sinh khu vực chung, bảo vệ 24/7, internet tốc độ cao', 'DaDuyet', NULL, NULL, '2025-09-20 06:29:59', '2025-11-28 22:42:36', NULL),
(2, 6, 944, 1, 'Khuyến mãi cực sốc, Hợp đồng 6 tháng tặng ngay 500k', '[\"/uploads/1759658857045.jpg\",\"/uploads/1759658857116.jpg\",\"/uploads/1759658857163.jpg\",\"/uploads/1759658857213.jpg\"]', 'vhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhvvhụkjjjjjjjvjhkvjhv', '[\"Wifi\", \"Máy lạnh\", \"Nóng lạnh\", \"Giường\", \"Tủ quần áo\"]', 3500.00, 20000.00, 150000.00, 'Bao gồm: Thu gom rác, vệ sinh khu vực chung, bảo vệ 24/7, internet tốc độ cao', 'LuuTru', 'Chủ dự án tự xóa', NULL, '2025-09-20 22:31:23', '2025-11-28 22:42:36', NULL),
(3, 4, 944, 1, 'Khuyến mãi cực sốc, Hợp đồng 6 tháng tặng ngay 500k', '[\"/uploads/1759483386941.jpg\",\"/uploads/1759483386953.jpg\",\"/uploads/1759483386973.jpg\",\"/uploads/1759483387011.jpg\",\"/uploads/1759483387065.jpg\",\"/uploads/1759483387091.jpg\",\"/uploads/1759483387125.jpg\",\"/uploads/1759483387180.jpg\"]', 'fdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsa', NULL, NULL, NULL, NULL, NULL, 'DaDuyet', NULL, NULL, '2025-09-20 22:32:57', '2025-11-28 22:42:36', NULL),
(4, 14, 941, 1, 'Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10', '[\"/uploads/1759483386941.jpg\",\"/uploads/1759483386953.jpg\",\"/uploads/1759483386973.jpg\",\"/uploads/1759483387011.jpg\",\"/uploads/1759483387065.jpg\",\"/uploads/1759483387091.jpg\",\"/uploads/1759483387125.jpg\",\"/uploads/1759483387180.jpg\"]', 'Chỉ cho nữ thuê', '[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\"]', 3500.00, 20000.00, 150000.00, 'Bảo dưỡng + rác', 'DaDuyet', NULL, NULL, '2025-10-03 16:23:07', '2025-11-28 22:42:36', NULL),
(5, 15, 1689, 1, 'Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên', '[\"/uploads/1759500198783.jpg\",\"/uploads/1759500198803.jpg\",\"/uploads/1759500198838.jpg\",\"/uploads/1759500198843.jpg\",\"/uploads/1759500198858.jpg\",\"/uploads/1759500198873.jpg\",\"/uploads/1759500198896.jpg\"]', 'Chỉ nhận nữ', '[\"Wifi\",\"Máy lạnh\",\"Giường\",\"Tủ lạnh\",\"Bếp\",\"Chỗ để xe\"]', 3000.00, 18000.00, 200000.00, 'Bao gồm phí bảo dưỡng + giặt sấy + wifi + rác sinh hoạt', 'DaDuyet', NULL, 9, '2025-10-03 21:03:18', '2025-11-28 22:42:36', '2025-11-28 20:09:11'),
(6, 15, 1689, 1, 'Phòng trọ cao cấp giá rẻ, Ưu đãi tốt cho sinh viên', '[\"/uploads/1759501859354.jpg\",\"/uploads/1759501859374.jpg\",\"/uploads/1759501859408.jpg\",\"/uploads/1759501859434.jpg\",\"/uploads/1759501859459.jpg\",\"/uploads/1759501859470.jpg\"]', 'Chỉ cho nam thuê', '[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\",\"Giường\",\"Tủ lạnh\",\"Máy giặt\",\"Bếp\",\"Chỗ để xe\"]', 3500.00, 20000.00, 200000.00, 'Tiền điện + nước sinh hoạt chung\nRác', 'DaDuyet', NULL, NULL, '2025-10-03 21:30:59', '2025-11-28 22:42:36', NULL),
(7, 16, 1751, 1, 'Phòng trọ cho cán bộ công tác ngắn hạn dưới 3 tháng', '[\"/uploads/1759523405890.jpg\",\"/uploads/1759523405900.jpg\",\"/uploads/1759523405909.jpg\",\"/uploads/1759523405923.jpg\",\"/uploads/1759523405939.jpg\",\"/uploads/1759523405943.jpg\"]', 'Vì tính chất đặc thù của gia đình nên ưu tiên những hoàn cảnh trên. Mong mọi người cảm thông.', '[\"Wifi\",\"Tủ lạnh\",\"Máy giặt\",\"Máy lạnh\",\"Nóng lạnh\",\"Chỗ để xe\",\"Bếp\",\"Giường\"]', 3000.00, 18000.00, 150000.00, 'Phí điện, nước sinh hoạt chung + rác + wifi + giặt sấy', 'ChoDuyet', NULL, NULL, '2025-10-04 03:30:05', '2025-11-28 22:42:36', NULL),
(8, 17, 946, 1, 'Phòng trọ giá rẻ cho nữ thuê, tặng ngay 1tr khi dọn vào trong tháng 10', '[\"/uploads/1759658857045.jpg\",\"/uploads/1759658857116.jpg\",\"/uploads/1759658857163.jpg\",\"/uploads/1759658857213.jpg\"]', 'Miễn Phí 2 tuần đầu dọn vào', '[\"Wifi\",\"Máy lạnh\",\"Nóng lạnh\",\"Giường\",\"Tủ lạnh\",\"Máy giặt\",\"Bếp\",\"Chỗ để xe\"]', 3000.00, 20000.00, 150000.00, 'Bao gồm phí giữ xe', 'DaDuyet', NULL, NULL, '2025-10-05 17:07:37', '2025-11-28 22:42:36', NULL),
(9, 14, 941, 1, 'Cuối tháng 10 trống duy nhất 1 căn 2 phòng ngủ cao cấp ở tối đa 4 người', '[\"/uploads/1760102566417.jpg\",\"/uploads/1760102566418.jpg\",\"/uploads/1760102566418.jpg\",\"/uploads/1760102566419.jpg\",\"/uploads/1760102566420.jpg\",\"/uploads/1760102566420.jpg\",\"/uploads/1760102566422.jpg\",\"/uploads/1760102566423.jpg\",\"/uploads/1760102566424.jpg\",\"/uploads/1760102566425.jpg\"]', '2 phòng ngủ full nội thất, có thang, khóa cửa vân tay, cách IUH 3,7km', '[\"Wifi\",\"Tủ lạnh\",\"Máy giặt\",\"Máy lạnh\",\"Nóng lạnh\",\"Bếp\",\"Chỗ để xe\",\"Giường\"]', 3500.00, 20000.00, 150000.00, 'Phí giữ xe + rác sinh hoạt + điện nước khu vực chung + bảo dưỡng nội thất', 'DaDuyet', NULL, NULL, '2025-10-10 20:22:46', '2025-11-28 22:42:36', NULL),
(15, 17, 946, 1, 'Cuối tháng 12 trống duy nhất 1 căn 2 phòng ngủ cao cấp ở tối đa 4 người', '[\"/uploads/1764386486827.jpg\",\"/uploads/1764386486876.jpg\",\"/uploads/1764386486890.jpg\",\"/uploads/1764386486908.jpg\"]', '', '[\"Wifi\",\"Máy lạnh\",\"Giường\",\"Nóng lạnh\",\"Tủ lạnh\",\"Máy giặt\",\"Bếp\",\"Chỗ để xe\"]', 3000.00, 20000.00, 150000.00, NULL, 'ChoDuyet', NULL, NULL, '2025-11-29 10:21:26', '2025-11-29 10:21:26', NULL);

--
-- Triggers `tindang`
--
DELIMITER $$
CREATE TRIGGER `trg_tindang_pre_publish` BEFORE UPDATE ON `tindang` FOR EACH ROW BEGIN
  -- ⚠️ Lưu ý: Biến phải khai báo ở đầu khối BEGIN...END
  DECLARE v_owner_id INT;       -- ID của Chủ dự án sở hữu Tin đăng
  DECLARE v_trang_thai_kyc VARCHAR(20); -- Trạng thái KYC của Chủ dự án

  -- Chỉ kiểm tra khi trạng thái mới là 'DaDang' và trạng thái cũ khác 'DaDang'
  IF NEW.TrangThai = 'DaDang' AND OLD.TrangThai <> 'DaDang' THEN

    -- 1) Lấy Chủ dự án từ bảng 'duan' bằng DuAnID của Tin đăng
    SELECT d.ChuDuAnID
      INTO v_owner_id
      FROM duan AS d
     WHERE d.DuAnID = NEW.DuAnID;

    -- 2) Lấy trạng thái KYC của Chủ dự án từ bảng 'nguoidung'
    SELECT n.TrangThaiXacMinh
      INTO v_trang_thai_kyc
      FROM nguoidung AS n
     WHERE n.NguoiDungID = v_owner_id;

    -- 3) Nếu KYC chưa đạt (khác 'DaXacMinh') thì chặn việc publish
    IF v_trang_thai_kyc IS NULL OR v_trang_thai_kyc <> 'DaXacMinh' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Từ chối đăng tin: Chủ dự án chưa đạt KYC (yêu cầu trạng thái DaXacMinh).';
    END IF;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tinnhan`
--

CREATE TABLE `tinnhan` (
  `TinNhanID` int(11) NOT NULL,
  `CuocHoiThoaiID` int(11) DEFAULT NULL,
  `NguoiGuiID` int(11) DEFAULT NULL,
  `NoiDung` text DEFAULT NULL,
  `ThoiGian` datetime DEFAULT current_timestamp(),
  `DaXoa` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tinnhan`
--

INSERT INTO `tinnhan` (`TinNhanID`, `CuocHoiThoaiID`, `NguoiGuiID`, `NoiDung`, `ThoiGian`, `DaXoa`) VALUES
(2001, 201, 201, 'Xin chào anh! Em thấy tin đăng phòng trọ của anh rất phù hợp. Em muốn hỏi phòng vẫn còn trống không ạ?', '2025-11-02 22:05:27', 0),
(2002, 201, 6, 'Chào em! Phòng vẫn còn trống em nhé. Em muốn xem phòng khi nào thì báo anh để sắp xếp.', '2025-11-02 23:05:27', 0),
(2003, 201, 201, 'Vâng ạ! Cho em hỏi phòng có máy lạnh không ạ? Và tiền điện nước tính như thế nào?', '2025-11-03 00:05:27', 0),
(2004, 201, 6, 'Phòng có máy lạnh đầy đủ em nhé. Tiền điện 3.500đ/số, nước 20.000đ/người/tháng. Phí dịch vụ 150k/tháng bao gồm wifi, rác, và bảo dưỡng.', '2025-11-03 01:05:27', 0),
(2005, 201, 201, 'Dạ vậy rất tốt! Em muốn xem phòng vào chiều mai được không ạ? Khoảng 3 giờ chiều có tiện không anh?', '2025-11-03 02:05:27', 0),
(2006, 201, 6, 'OK em! 3h chiều mai được nhé. Địa chỉ là 40/6 Lê Văn Thọ, Phường 11, Quận Gò Vấp. Đến gần cổng em gọi anh nhé.', '2025-11-03 03:05:27', 0),
(2007, 201, 201, 'Vâng em cảm ơn anh! Em sẽ đến đúng giờ ạ.', '2025-11-03 04:05:27', 0),
(2010, 202, 6, 'Chào em! Anh nhắc lại lịch hẹn xem phòng hôm nay lúc 3h chiều nhé.', '2025-11-03 22:05:27', 0),
(2011, 202, 202, 'Vâng em nhớ rồi ạ! Em đang trên đường đến, khoảng 10 phút nữa đến nơi.', '2025-11-03 23:05:27', 0),
(2012, 202, 202, 'Em đã xem phòng và rất thích ạ! Em muốn thuê luôn được không anh?', '2025-11-04 00:05:27', 0),
(2013, 202, 6, 'Được em! Anh rất vui vì em thích. Để thuê phòng, em cần đặt cọc giữ chỗ trước nhé. Tiền cọc là 1 tháng tiền phòng.', '2025-11-04 01:05:27', 0),
(2014, 202, 202, 'Vâng ạ! Em có thể chuyển khoản được không? Số tài khoản của anh là gì ạ?', '2025-11-04 01:05:27', 0),
(2015, 202, 6, 'Em chuyển qua hệ thống của bên mình nhé, an toàn và có bảo vệ cho cả 2 bên. Em vào mục \"Cuộc hẹn\" > chọn cuộc hẹn này > click \"Đặt cọc giữ chỗ\".', '2025-11-04 02:05:27', 0),
(2016, 202, 202, 'Vâng em hiểu rồi! Em sẽ làm ngay bây giờ ạ.', '2025-11-04 02:05:27', 0),
(2017, 202, 202, 'Anh ơi em đã cọc xong rồi ạ! Bây giờ em làm gì tiếp ạ?', '2025-11-04 03:05:27', 0),
(2018, 202, 6, 'Anh đã nhận được tiền cọc rồi em. Tuần sau em dọn vào được luôn nhé. Anh sẽ chuẩn bị hợp đồng.', '2025-11-04 04:05:27', 0),
(2020, 203, 6, 'Chào em! Anh đã chuẩn bị xong hợp đồng rồi. Em có thể qua ký hợp đồng được chưa?', '2025-11-04 19:05:27', 0),
(2021, 203, 201, 'Vâng ạ! Em có thể qua chiều nay được anh. Khoảng 5h được không ạ?', '2025-11-04 20:05:27', 0),
(2022, 203, 6, 'OK em! 5h chiều nay nhé. Em nhớ mang CMND/CCCD để làm hợp đồng nhé.', '2025-11-04 20:05:27', 0),
(2023, 203, 201, 'Vâng ạ em nhớ rồi! Cho em hỏi tiền cọc an ninh và tiền kỳ đầu là bao nhiêu ạ?', '2025-11-04 21:05:27', 0),
(2024, 203, 6, 'Cọc an ninh là 2 tháng tiền phòng (4.000.000đ), tiền kỳ đầu là 1 tháng (2.000.000đ). Tổng cộng em cần chuẩn bị 6 triệu để ký hợp đồng nhé.', '2025-11-04 21:05:27', 0),
(2025, 203, 201, 'Dạ em hiểu rồi! Em sẽ chuẩn bị đầy đủ. Cảm ơn anh nhiều ạ!', '2025-11-04 21:15:27', 0),
(2026, 203, 6, 'Không có gì em. Hẹn gặp em chiều nay nhé!', '2025-11-04 21:20:27', 0),
(2030, 204, 203, 'Xin chào anh! Em thấy anh có nhiều phòng cho thuê. Em muốn hỏi phòng nào phù hợp cho sinh viên ạ?', '2025-11-04 17:05:27', 0),
(2031, 204, 6, 'Chào em! Tùy vào nhu cầu của em. Em muốn ở gần trường nào? Và budget của em khoảng bao nhiêu?', '2025-11-04 18:05:27', 0),
(2032, 204, 203, 'Em học ở IUH anh ạ. Budget khoảng 2-2.5 triệu/tháng. Em muốn có máy lạnh và wifi.', '2025-11-04 18:05:27', 0),
(2033, 204, 6, 'Vậy em xem tin đăng \"Phòng trọ giá rẻ cho nữ thuê\" của anh nhé. Phòng đầy đủ tiện nghi, gần IUH chỉ 3.7km. Giá 2 triệu/tháng, có máy lạnh và wifi.', '2025-11-04 19:05:27', 0),
(2034, 204, 203, 'Vâng em sẽ xem! Em có thể xem phòng trực tiếp được không ạ?', '2025-11-04 20:05:27', 0),
(2035, 204, 6, 'Được em! Em vào trang tin đăng, click \"Đặt lịch xem phòng\" để book lịch nhé. Anh sẽ sắp xếp thời gian phù hợp.', '2025-11-04 20:05:27', 0),
(2036, 204, 203, 'Vâng em cảm ơn anh! Em sẽ đặt lịch ngay ạ.', '2025-11-04 21:05:27', 0),
(2037, 201, 201, 'Tin nhắn test số 1 - Để test pagination và scroll trong UI', '2025-11-03 12:05:27', 0),
(2038, 201, 6, 'Tin nhắn test số 2 - Để test pagination và scroll trong UI', '2025-11-03 13:05:27', 0),
(2039, 201, 201, 'Tin nhắn test số 3 - Để test pagination và scroll trong UI', '2025-11-03 14:05:27', 0),
(2040, 201, 6, 'Tin nhắn test số 4 - Để test pagination và scroll trong UI', '2025-11-03 15:05:27', 0),
(2041, 201, 201, 'Tin nhắn test số 5 - Để test pagination và scroll trong UI', '2025-11-03 16:05:27', 0),
(2042, 201, 6, 'Tin nhắn test số 6 - Để test pagination và scroll trong UI', '2025-11-03 17:05:27', 0),
(2043, 201, 201, 'Tin nhắn test số 7 - Để test pagination và scroll trong UI', '2025-11-03 18:05:27', 0),
(2044, 201, 6, 'Tin nhắn test số 8 - Để test pagination và scroll trong UI', '2025-11-03 19:05:27', 0),
(2045, 201, 201, 'Tin nhắn test số 9 - Để test pagination và scroll trong UI', '2025-11-03 20:05:27', 0),
(2046, 201, 6, 'Tin nhắn test số 10 - Để test pagination và scroll trong UI', '2025-11-03 21:05:27', 0),
(2047, 201, 201, 'Tin nhắn test số 11 - Để test pagination và scroll trong UI', '2025-11-03 22:05:27', 0),
(2048, 201, 6, 'Tin nhắn test số 12 - Để test pagination và scroll trong UI', '2025-11-03 23:05:27', 0),
(2049, 201, 201, 'Tin nhắn test số 13 - Để test pagination và scroll trong UI', '2025-11-04 00:05:27', 0),
(2050, 201, 6, 'Tin nhắn test số 14 - Để test pagination và scroll trong UI', '2025-11-04 01:05:27', 0),
(2051, 201, 201, 'Tin nhắn test số 15 - Để test pagination và scroll trong UI', '2025-11-04 02:05:27', 0),
(2052, 201, 6, 'Tin nhắn test số 16 - Để test pagination và scroll trong UI', '2025-11-04 03:05:27', 0),
(2053, 201, 201, 'Tin nhắn test số 17 - Để test pagination và scroll trong UI', '2025-11-04 04:05:27', 0),
(2054, 201, 6, 'Tin nhắn test số 18 - Để test pagination và scroll trong UI', '2025-11-04 05:05:27', 0),
(2055, 201, 201, 'Tin nhắn test số 19 - Để test pagination và scroll trong UI', '2025-11-04 06:05:27', 0),
(2056, 201, 6, 'Tin nhắn test số 20 - Để test pagination và scroll trong UI', '2025-11-04 07:05:27', 0),
(2057, 201, 201, 'Tin nhắn test số 21 - Để test pagination và scroll trong UI', '2025-11-04 08:05:27', 0),
(2058, 201, 6, 'Tin nhắn test số 22 - Để test pagination và scroll trong UI', '2025-11-04 09:05:27', 0),
(2059, 201, 201, 'Tin nhắn test số 23 - Để test pagination và scroll trong UI', '2025-11-04 10:05:27', 0),
(2060, 201, 6, 'Tin nhắn test số 24 - Để test pagination và scroll trong UI', '2025-11-04 11:05:27', 0),
(2061, 201, 201, 'Tin nhắn test số 25 - Để test pagination và scroll trong UI', '2025-11-04 12:05:27', 0),
(2062, 201, 6, 'Tin nhắn test số 26 - Để test pagination và scroll trong UI', '2025-11-04 13:05:27', 0),
(2063, 201, 201, 'Tin nhắn test số 27 - Để test pagination và scroll trong UI', '2025-11-04 14:05:27', 0),
(2064, 201, 6, 'Tin nhắn test số 28 - Để test pagination và scroll trong UI', '2025-11-04 15:05:27', 0),
(2065, 201, 201, 'Tin nhắn test số 29 - Để test pagination và scroll trong UI', '2025-11-04 16:05:27', 0),
(2066, 201, 6, 'Tin nhắn test số 30 - Để test pagination và scroll trong UI', '2025-11-04 17:05:27', 0),
(2067, 203, 6, 'hello em', '2025-11-04 22:51:51', 0),
(2068, 219, 1, 'hey', '2025-11-19 00:40:19', 0),
(2069, 219, 1, 'nghe', '2025-11-19 00:40:30', 0),
(2070, 219, 8, 'em nghe', '2025-11-19 00:41:12', 0),
(2071, 219, 1, 'sếp ơi', '2025-11-19 00:43:26', 0),
(2072, 219, 8, 'anh nghe đây', '2025-11-19 00:43:34', 0),
(2073, 219, 1, 'Test tin nhắn từ Chủ dự án', '2025-11-19 00:54:58', 0),
(2074, 219, 1, 'chào bạn', '2025-11-19 00:58:04', 0),
(2075, 219, 1, 'Chào em', '2025-11-19 15:26:55', 0),
(2076, 219, 1, 'kahcsh sao rồi em', '2025-11-19 15:27:11', 0),
(2077, 219, 1, 'ey em', '2025-11-20 10:29:51', 0),
(2078, 219, 8, 'Chào anh', '2025-11-20 11:16:04', 0),
(2079, 219, 8, 'Chào Lộc', '2025-11-20 11:16:34', 0),
(2080, 219, 1, 'Chung', '2025-11-22 20:41:39', 0),
(2081, 219, 1, 'Chung loz', '2025-11-22 20:41:42', 0),
(2082, 219, 1, 'thấy k', '2025-11-22 20:41:44', 0),
(2083, 219, 1, 'Eyyyyyy', '2025-11-22 20:41:49', 0),
(2084, 219, 8, 'con cac tao ne', '2025-11-22 20:41:52', 0),
(2085, 219, 1, 'đm Chung', '2025-11-22 20:41:53', 0),
(2086, 219, 1, 'Chung ngu vl', '2025-11-22 20:41:59', 0),
(2087, 219, 8, 'nhung hop ngu hon', '2025-11-22 20:42:24', 0),
(2088, 219, 1, 'Ali', '2025-11-28 22:18:58', 0),
(2089, 219, 1, 'Alo', '2025-11-28 22:18:58', 0),
(2090, 219, 1, 'Alo', '2025-11-28 22:19:02', 0),
(2091, 219, 1, 'Alo', '2025-11-28 22:19:08', 0),
(2092, 219, 1, 'Alo', '2025-11-28 22:19:20', 0),
(2093, 225, 7, 'chaof ban', '2025-11-29 11:19:55', 0),
(2094, 219, 1, 'Alo aaalo lo', '2025-12-06 19:15:41', 0),
(2095, 219, 1, 'alo', '2025-12-06 20:54:34', 0),
(2096, 219, 1, 'alo', '2025-12-06 20:54:50', 0),
(2097, 219, 1, 'alo', '2025-12-06 20:54:53', 0),
(2098, 219, 1, 'alo', '2025-12-08 14:23:30', 0),
(2099, 219, 1, 'alo', '2025-12-08 14:23:47', 0),
(2100, 219, 1, 'alo', '2025-12-08 15:04:15', 0),
(2101, 219, 1, 'alo', '2025-12-08 15:04:20', 0),
(2102, 219, 1, 'alo', '2025-12-08 15:35:45', 0),
(2103, 219, 1, 'hello', '2025-12-08 15:35:55', 0),
(2104, 219, 1, 'alo', '2025-12-08 15:36:30', 0),
(2105, 219, 1, 'alo', '2025-12-08 15:36:32', 0),
(2106, 219, 1, 'alo', '2025-12-08 15:36:35', 0),
(2107, 219, 1, 'alo', '2025-12-08 15:36:39', 0),
(2108, 219, 1, 'alo', '2025-12-08 15:36:41', 0),
(2109, 219, 1, 'alo', '2025-12-08 15:36:49', 0),
(2110, 219, 1, 'alo', '2025-12-08 15:36:51', 0),
(2111, 219, 1, 'alo', '2025-12-08 15:36:59', 0),
(2112, 219, 1, 'alo', '2025-12-08 15:37:22', 0),
(2113, 219, 1, 'bạn ey', '2025-12-08 15:38:39', 0),
(2114, 219, 1, 'alo', '2025-12-08 15:41:34', 0),
(2115, 219, 1, 'Alo', '2025-12-08 15:42:34', 0),
(2116, 219, 1, 'Alo', '2025-12-08 15:42:39', 0),
(2117, 219, 1, 'Ali', '2025-12-08 15:43:08', 0),
(2118, 219, 1, 'alo', '2025-12-08 15:45:11', 0),
(2119, 219, 1, 'alo', '2025-12-08 15:45:48', 0),
(2120, 219, 1, 'alo', '2025-12-08 15:45:52', 0),
(2121, 219, 1, 'alo', '2025-12-08 15:45:55', 0),
(2122, 219, 1, 'alo', '2025-12-08 15:46:06', 0),
(2123, 219, 1, 'alo', '2025-12-08 15:46:12', 0),
(2124, 219, 1, 'alo', '2025-12-08 15:46:22', 0),
(2125, 219, 1, 'alo', '2025-12-08 15:46:25', 0),
(2126, 219, 1, 'alo', '2025-12-08 15:46:42', 0),
(2127, 219, 1, 'alo', '2025-12-08 15:46:53', 0),
(2128, 219, 1, 'alo', '2025-12-08 15:47:15', 0),
(2129, 219, 1, 'alo', '2025-12-08 15:47:28', 0),
(2130, 219, 1, 'alo', '2025-12-08 15:47:38', 0),
(2131, 219, 1, 'alo', '2025-12-08 15:47:40', 0),
(2132, 219, 1, 'alo', '2025-12-08 15:47:43', 0),
(2133, 219, 1, 'alo', '2025-12-08 15:47:50', 0),
(2134, 219, 1, 'alo', '2025-12-08 15:47:52', 0),
(2135, 219, 1, 'alo', '2025-12-08 15:47:55', 0),
(2136, 219, 1, 'hello', '2025-12-08 15:58:22', 0),
(2137, 219, 1, 'hello', '2025-12-08 15:59:04', 0),
(2138, 219, 1, 'allo', '2025-12-08 16:00:08', 0),
(2139, 219, 1, 'hello', '2025-12-08 16:00:15', 0),
(2140, 219, 1, 'allo', '2025-12-08 16:05:03', 0),
(2141, 219, 1, 'allo', '2025-12-08 16:05:11', 0),
(2142, 219, 1, 'allo', '2025-12-08 16:05:33', 0),
(2143, 219, 1, 'allo', '2025-12-08 16:05:45', 0),
(2144, 219, 1, 'allo', '2025-12-08 16:06:53', 0),
(2145, 219, 1, 'allo', '2025-12-08 16:06:55', 0),
(2146, 219, 1, '.', '2025-12-08 16:29:35', 0),
(2147, 219, 1, '.', '2025-12-08 22:32:16', 0),
(2148, 219, 1, '.', '2025-12-08 22:33:09', 0),
(2149, 219, 1, '.', '2025-12-08 22:33:22', 0),
(2150, 219, 1, '.', '2025-12-08 22:36:05', 0),
(2151, 226, 245, 'test', '2025-12-10 01:13:27', 0),
(2152, 226, 245, 'dskfhdsfdjksfsd', '2025-12-10 01:15:16', 0),
(2153, 227, 245, 'bshdshdshdhsd', '2025-12-10 01:20:40', 0),
(2154, 227, 245, 'hjkdhádskhạdsakjsa', '2025-12-10 01:33:12', 0),
(2155, 227, 245, 'kjgkg', '2025-12-10 01:33:59', 0);

--
-- Triggers `tinnhan`
--
DELIMITER $$
CREATE TRIGGER `trg_after_insert_tinnhan` AFTER INSERT ON `tinnhan` FOR EACH ROW BEGIN
  UPDATE cuochoithoai 
  SET ThoiDiemTinNhanCuoi = NEW.ThoiGian 
  WHERE CuocHoiThoaiID = NEW.CuocHoiThoaiID;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `bank_name` varchar(50) DEFAULT NULL,
  `account_number` varchar(20) DEFAULT NULL,
  `amount_in` decimal(15,2) DEFAULT NULL,
  `transaction_content` text DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `sepay_id` varchar(64) DEFAULT NULL,
  `bank_brand_name` varchar(100) DEFAULT NULL,
  `amount_out` decimal(14,2) DEFAULT NULL,
  `accumulated` decimal(14,2) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `sub_account` varchar(100) DEFAULT NULL,
  `bank_account_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `bank_name`, `account_number`, `amount_in`, `transaction_content`, `transaction_date`, `reference_number`, `sepay_id`, `bank_brand_name`, `amount_out`, `accumulated`, `code`, `sub_account`, `bank_account_id`) VALUES
(1, NULL, 'TPBank', '80349195777', 2000.00, '104104028174 0349195610 donhang666666', '2025-10-15 16:30:20', '668ITC1252891160', '26445532', 'TPBank', 0.00, 12000.00, NULL, NULL, '29190'),
(2, NULL, 'TPBank', '80349195777', 10000.00, 'anh yeu em', '2025-10-15 08:47:11', '666V501252880750', '26392545', 'TPBank', 0.00, 10000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 2000.00, 'DK8', '2025-10-27 15:46:40', '668ITC125300APWW', '27962446', 'TPBank', 0.00, 16000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 2000.00, 'DK8', '2025-10-27 15:34:41', '668ITC125300APSM', '27961100', 'TPBank', 0.00, 14000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1005951', '2025-10-31 14:52:26', '666V501253041149', '28484057', 'TPBank', 0.00, 86000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '105648802230-0911576456-dk728335', '2025-10-30 13:26:57', '668ITC125303A8K2', '28318274', 'TPBank', 0.00, 76000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1024061', '2025-10-28 16:26:46', '666V501253020009', '28081405', 'TPBank', 0.00, 66000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1095299', '2025-10-28 16:12:33', '668ITC1253020180', '28080430', 'TPBank', 0.00, 56000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'DK1076661', '2025-10-28 16:06:24', '668ITC1253020101', '28079998', 'TPBank', 0.00, 46000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '105459829655 0349195610 DK1055807', '2025-10-28 16:01:42', '668ITC1253020047', '28079682', 'TPBank', 0.00, 36000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 5000.00, 'DK1008860', '2025-10-28 15:52:16', '668ITC125301A9SS', '28078900', 'TPBank', 0.00, 26000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 5000.00, 'DK10', '2025-10-28 15:36:38', '668ITC125301A9MZ', '28077574', 'TPBank', 0.00, 21000.00, NULL, NULL, '29190'),
(1, NULL, 'TPBank', '80349195777', 2000.00, '104104028174 0349195610 donhang666666', '2025-10-15 16:30:20', '668ITC1252891160', '26445532', 'TPBank', 0.00, 12000.00, NULL, NULL, '29190'),
(2, NULL, 'TPBank', '80349195777', 10000.00, 'anh yeu em', '2025-10-15 08:47:11', '666V501252880750', '26392545', 'TPBank', 0.00, 10000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 2000.00, 'DK8', '2025-10-27 15:46:40', '668ITC125300APWW', '27962446', 'TPBank', 0.00, 16000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 2000.00, 'DK8', '2025-10-27 15:34:41', '668ITC125300APSM', '27961100', 'TPBank', 0.00, 14000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1005951', '2025-10-31 14:52:26', '666V501253041149', '28484057', 'TPBank', 0.00, 86000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '105648802230-0911576456-dk728335', '2025-10-30 13:26:57', '668ITC125303A8K2', '28318274', 'TPBank', 0.00, 76000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1024061', '2025-10-28 16:26:46', '666V501253020009', '28081405', 'TPBank', 0.00, 66000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk1095299', '2025-10-28 16:12:33', '668ITC1253020180', '28080430', 'TPBank', 0.00, 56000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'DK1076661', '2025-10-28 16:06:24', '668ITC1253020101', '28079998', 'TPBank', 0.00, 46000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '105459829655 0349195610 DK1055807', '2025-10-28 16:01:42', '668ITC1253020047', '28079682', 'TPBank', 0.00, 36000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 5000.00, 'DK1008860', '2025-10-28 15:52:16', '668ITC125301A9SS', '28078900', 'TPBank', 0.00, 26000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 5000.00, 'DK10', '2025-10-28 15:36:38', '668ITC125301A9MZ', '28077574', 'TPBank', 0.00, 21000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk922845', '2025-11-18 16:48:43', '668ITC1253230759', '31244881', 'TPBank', 0.00, 96000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'dk971184', '2025-11-19 08:25:08', '668ITC125323A2EA', '31326537', 'TPBank', 0.00, 106000.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '108954985902 0349195610 Naptien52391', '2025-11-28 17:16:34', '668ITC1253330348', '32964317', 'TPBank', 0.00, 136003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '108945525457 0349195610 Naptien64470', '2025-11-28 14:42:26', '668ITC125332AAL9', '32944386', 'TPBank', 0.00, 126003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '108712123728-0349195610-Naptien28252', '2025-11-26 12:51:00', '668ITC125330A7WS', '32547335', 'TPBank', 0.00, 116003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 3.00, 'TRA LAI TIEN GUI TK: 80349195777', '2025-11-24 15:27:49', '668DDBBVND000002', '32198322', 'TPBank', 0.00, 106003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien84045', '2025-11-29 02:26:03', '668ITC1253333865', '32999358', 'TPBank', 0.00, 146003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '108981854949-0349195610-Naptien27151', '2025-11-29 02:42:41', '668ITC1253334175', '33001546', 'TPBank', 0.00, 156003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '108991213827-0349195610-Naptien46675', '2025-11-29 04:17:20', '668ITC1253336333', '33014894', 'TPBank', 0.00, 166003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '110284214721-0349195610-Naptien10260', '2025-12-09 16:31:10', '668ITC1253440767', '34728743', 'TPBank', 0.00, 176003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 11000.00, 'Naptien99636', '2025-12-09 16:45:42', '668ITC1253440934', '34730248', 'TPBank', 0.00, 187003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien48113', '2025-12-09 18:19:55', '668ITC1253441624', '34736677', 'TPBank', 0.00, 197003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 11000.00, '110289007170 Naptien12439 CHUYEN TIEN OQCH0004ZJrF MOMO110289007170MOMO', '2025-12-09 18:28:35', '668ITC1253441665', '34736972', 'TPBank', 0.00, 208003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien02598', '2025-12-09 18:35:12', '668ITC1253441689', '34737311', 'TPBank', 0.00, 218003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '110289436272-0349195610-Naptien73262', '2025-12-09 18:39:49', '668ITC1253441714', '34737592', 'TPBank', 0.00, 228003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 20000.00, '110289423333-0349195610-Naptien40385', '2025-12-09 18:42:39', '668ITC1253441732', '34737765', 'TPBank', 0.00, 248003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien14713', '2025-12-09 18:52:34', '666V501253440057', '34738205', 'TPBank', 0.00, 258003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, '110290110321 Naptien45908 CHUYEN TIEN OQCH0004ZKhM MOMO110290110321MOMO', '2025-12-09 19:04:23', '668ITC1253441815', '34738532', 'TPBank', 0.00, 268003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien50763', '2025-12-09 19:08:00', '666V501253440058', '34738631', 'TPBank', 0.00, 278003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien77215', '2025-12-09 19:09:10', '666V501253440060', '34738670', 'TPBank', 0.00, 298003.00, NULL, NULL, '29190'),
(0, NULL, 'TPBank', '80349195777', 10000.00, 'Naptien89921', '2025-12-09 19:08:47', '666V501253440059', '34738656', 'TPBank', 0.00, 288003.00, NULL, NULL, '29190');

-- --------------------------------------------------------

--
-- Table structure for table `vaitro`
--

CREATE TABLE `vaitro` (
  `VaiTroID` int(11) NOT NULL,
  `TenVaiTro` varchar(100) NOT NULL,
  `MoTa` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vaitro`
--

INSERT INTO `vaitro` (`VaiTroID`, `TenVaiTro`, `MoTa`) VALUES
(1, 'Khách hàng', 'Người dùng cuối có nhu cầu tìm kiếm và thuê nơi ở'),
(2, 'NhanVienBanHang', 'Đại diện tuyến đầu hỗ trợ khách hàng'),
(3, 'ChuDuAn', 'Cá nhân/tổ chức sở hữu bất động sản cho thuê'),
(4, 'NhanVienDieuHanh', 'Quản trị viên nội bộ duy trì chất lượng nền tảng'),
(5, 'Quản trị viên Hệ thống', 'Người dùng kỹ thuật cấp cao nhất');

-- --------------------------------------------------------

--
-- Table structure for table `vaitro_quyen`
--

CREATE TABLE `vaitro_quyen` (
  `VaiTroID` int(11) NOT NULL,
  `QuyenID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vi`
--

CREATE TABLE `vi` (
  `ViID` int(11) NOT NULL,
  `NguoiDungID` int(11) DEFAULT NULL,
  `SoDu` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vi`
--

INSERT INTO `vi` (`ViID`, `NguoiDungID`, `SoDu`) VALUES
(1, 7, -3500000.00),
(2, 245, 29964351000.00);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_phong_full_info`
-- (See below for the actual view)
--
CREATE TABLE `v_phong_full_info` (
`PhongID` int(11)
,`DuAnID` int(11)
,`TenDuAn` varchar(255)
,`TenPhong` varchar(100)
,`TrangThai` enum('Trong','GiuCho','DaThue','DonDep')
,`GiaChuan` decimal(15,2)
,`DienTichChuan` decimal(5,2)
,`SoTinDangDangDung` bigint(21)
,`ChiTietTinDang` mediumtext
);

-- --------------------------------------------------------

--
-- Table structure for table `yeucauruttien`
--

CREATE TABLE `yeucauruttien` (
  `YeuCauID` int(11) NOT NULL,
  `NguoiDungID` int(11) NOT NULL,
  `SoTien` decimal(15,2) NOT NULL COMMENT 'Số tiền muốn rút',
  `NganHang` varchar(100) NOT NULL COMMENT 'Tên ngân hàng',
  `SoTaiKhoan` varchar(50) NOT NULL COMMENT 'Số tài khoản nhận tiền',
  `TenChuTaiKhoan` varchar(100) NOT NULL COMMENT 'Tên chủ tài khoản',
  `TrangThai` enum('ChoXuLy','DaDuyet','TuChoi') DEFAULT 'ChoXuLy',
  `GhiChu` text DEFAULT NULL COMMENT 'Ghi chú từ admin hoặc người dùng',
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `yeucauruttien`
--

INSERT INTO `yeucauruttien` (`YeuCauID`, `NguoiDungID`, `SoTien`, `NganHang`, `SoTaiKhoan`, `TenChuTaiKhoan`, `TrangThai`, `GhiChu`, `TaoLuc`, `CapNhatLuc`) VALUES
(1, 7, 10000.00, 'mbbank', '123323423', 'chung', 'DaDuyet', 'Đã chuyển khoản thành công', '2025-11-28 15:32:59', '2025-11-28 15:36:21'),
(2, 7, 10000.00, 'sdsadds', 'đasadasdsad', 'đasadasdas', 'DaDuyet', 'Đã chuyển khoản thành công', '2025-11-28 21:42:40', '2025-11-28 21:43:04'),
(3, 7, 10000.00, 'Ahdhfbdb', '19292939', 'Dhhdh', 'DaDuyet', 'Đã chuyển khoản thành công', '2025-11-29 09:26:27', '2025-11-29 09:27:22'),
(4, 245, 10000.00, 'Đhh', '282828', 'Đbbdhh', 'ChoXuLy', NULL, '2025-11-29 09:42:58', '2025-11-29 09:42:58');

-- --------------------------------------------------------

--
-- Table structure for table `yeuthich`
--

CREATE TABLE `yeuthich` (
  `NguoiDungID` int(11) NOT NULL,
  `TinDangID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `yeuthich`
--

INSERT INTO `yeuthich` (`NguoiDungID`, `TinDangID`) VALUES
(6, 5),
(245, 4);

-- --------------------------------------------------------

--
-- Structure for view `v_phong_full_info`
--
DROP TABLE IF EXISTS `v_phong_full_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_phong_full_info`  AS SELECT `p`.`PhongID` AS `PhongID`, `p`.`DuAnID` AS `DuAnID`, `d`.`TenDuAn` AS `TenDuAn`, `p`.`TenPhong` AS `TenPhong`, `p`.`TrangThai` AS `TrangThai`, `p`.`GiaChuan` AS `GiaChuan`, `p`.`DienTichChuan` AS `DienTichChuan`, count(`pt`.`TinDangID`) AS `SoTinDangDangDung`, group_concat(concat('TinDang #',`pt`.`TinDangID`,': ',coalesce(`pt`.`GiaTinDang`,`p`.`GiaChuan`),'đ') separator ' | ') AS `ChiTietTinDang` FROM (((`phong` `p` join `duan` `d` on(`p`.`DuAnID` = `d`.`DuAnID`)) left join `phong_tindang` `pt` on(`p`.`PhongID` = `pt`.`PhongID`)) left join `tindang` `td` on(`pt`.`TinDangID` = `td`.`TinDangID` and `td`.`TrangThai` in ('ChoDuyet','DaDuyet','DaDang'))) GROUP BY `p`.`PhongID`, `p`.`DuAnID`, `d`.`TenDuAn`, `p`.`TenPhong`, `p`.`TrangThai`, `p`.`GiaChuan`, `p`.`DienTichChuan` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bienbanbangiao`
--
ALTER TABLE `bienbanbangiao`
  ADD PRIMARY KEY (`BienBanBanGiaoID`),
  ADD KEY `idx_bbbg_phong` (`PhongID`),
  ADD KEY `fk_bbbg_hopdong` (`HopDongID`),
  ADD KEY `fk_bbbg_tindang` (`TinDangID`);

--
-- Indexes for table `buttoansocai`
--
ALTER TABLE `buttoansocai`
  ADD PRIMARY KEY (`ButToanID`),
  ADD KEY `GiaoDichID` (`GiaoDichID`),
  ADD KEY `ViID` (`ViID`);

--
-- Indexes for table `chinhsachcoc`
--
ALTER TABLE `chinhsachcoc`
  ADD PRIMARY KEY (`ChinhSachCocID`),
  ADD KEY `idx_chu_du_an` (`ChuDuAnID`);

--
-- Indexes for table `coc`
--
ALTER TABLE `coc`
  ADD PRIMARY KEY (`CocID`),
  ADD KEY `idx_coc_phong` (`PhongID`),
  ADD KEY `idx_coc_tindang` (`TinDangID`),
  ADD KEY `idx_coc_hethan` (`HetHanLuc`),
  ADD KEY `fk_coc_bbbg` (`BienBanBanGiaoID`),
  ADD KEY `idx_coc_phong_trangthai` (`PhongID`,`TrangThai`),
  ADD KEY `idx_coc_loai_trangthai` (`Loai`,`TrangThai`),
  ADD KEY `idx_coc_taoluc_trangthai` (`TaoLuc`,`TrangThai`),
  ADD KEY `idx_coc_taoluc_sotien` (`TaoLuc`,`SoTien`),
  ADD KEY `idx_coc_giaodich` (`GiaoDichID`),
  ADD KEY `idx_coc_hopdong` (`HopDongID`);

--
-- Indexes for table `cuochen`
--
ALTER TABLE `cuochen`
  ADD PRIMARY KEY (`CuocHenID`),
  ADD KEY `KhachHangID` (`KhachHangID`),
  ADD KEY `NhanVienBanHangID` (`NhanVienBanHangID`),
  ADD KEY `idx_cuochen_khachhang` (`KhachHangID`),
  ADD KEY `idx_cuochen_nv` (`NhanVienBanHangID`),
  ADD KEY `idx_cuochen_thoigian` (`ThoiGianHen`),
  ADD KEY `idx_cuochen_pheduyet` (`PheDuyetChuDuAn`),
  ADD KEY `idx_cuochen_thoigianpheduyet` (`ThoiGianPheDuyet`),
  ADD KEY `idx_cuochen_phong_trangthai` (`PhongID`,`TrangThai`),
  ADD KEY `idx_cuochen_thoigianhen_trangthai` (`ThoiGianHen`,`TrangThai`),
  ADD KEY `idx_cuochen_taoluc` (`TaoLuc`),
  ADD KEY `TinDangID` (`TinDangID`);

--
-- Indexes for table `cuochoithoai`
--
ALTER TABLE `cuochoithoai`
  ADD PRIMARY KEY (`CuocHoiThoaiID`),
  ADD KEY `idx_cuochoithoai_ngucanh` (`NguCanhID`,`NguCanhLoai`),
  ADD KEY `idx_cuochoithoai_thoidiemtinnhan` (`ThoiDiemTinNhanCuoi`);

--
-- Indexes for table `duan`
--
ALTER TABLE `duan`
  ADD PRIMARY KEY (`DuAnID`),
  ADD KEY `ChuDuAnID` (`ChuDuAnID`),
  ADD KEY `idx_nguoi_ngung_hoat_dong` (`NguoiNgungHoatDongID`),
  ADD KEY `idx_nguoi_xu_ly_yeu_cau` (`NguoiXuLyYeuCauID`),
  ADD KEY `idx_yeu_cau_mo_lai_status` (`YeuCauMoLai`),
  ADD KEY `idx_duan_chuduan_trangthai` (`ChuDuAnID`,`TrangThai`),
  ADD KEY `idx_duan_chinhsachcoc` (`ChinhSachCocID`);

--
-- Indexes for table `giaodich`
--
ALTER TABLE `giaodich`
  ADD PRIMARY KEY (`GiaoDichID`),
  ADD UNIQUE KEY `KhoaDinhDanh` (`KhoaDinhDanh`),
  ADD UNIQUE KEY `uq_giaodich_khoadinhdanh` (`KhoaDinhDanh`),
  ADD KEY `ViID` (`ViID`),
  ADD KEY `TinDangLienQuanID` (`TinDangLienQuanID`),
  ADD KEY `fk_gd_thamchieu` (`GiaoDichThamChieuID`);

--
-- Indexes for table `hopdong`
--
ALTER TABLE `hopdong`
  ADD PRIMARY KEY (`HopDongID`),
  ADD KEY `TinDangID` (`TinDangID`),
  ADD KEY `KhachHangID` (`KhachHangID`),
  ADD KEY `MauHopDongID` (`MauHopDongID`),
  ADD KEY `idx_hd_tindang` (`TinDangID`),
  ADD KEY `idx_hd_khachhang` (`KhachHangID`),
  ADD KEY `idx_hd_phong` (`PhongID`),
  ADD KEY `idx_hd_duan` (`DuAnID`),
  ADD KEY `idx_hopdong_nhanvien` (`NhanVienBanHangID`);

--
-- Indexes for table `hosonhanvien`
--
ALTER TABLE `hosonhanvien`
  ADD PRIMARY KEY (`HoSoID`),
  ADD KEY `NguoiDungID` (`NguoiDungID`),
  ADD KEY `KhuVucChinhID` (`KhuVucChinhID`),
  ADD KEY `KhuVucPhuTrachID` (`KhuVucPhuTrachID`),
  ADD KEY `QuanLyID` (`QuanLyID`);

--
-- Indexes for table `khuvuc`
--
ALTER TABLE `khuvuc`
  ADD PRIMARY KEY (`KhuVucID`),
  ADD KEY `ParentKhuVucID` (`ParentKhuVucID`);

--
-- Indexes for table `kyc_verification`
--
ALTER TABLE `kyc_verification`
  ADD PRIMARY KEY (`KYCVerificationID`),
  ADD KEY `NguoiDungID` (`NguoiDungID`);

--
-- Indexes for table `lichlamviec`
--
ALTER TABLE `lichlamviec`
  ADD PRIMARY KEY (`LichID`),
  ADD KEY `NhanVienBanHangID` (`NhanVienBanHangID`);

--
-- Indexes for table `lich_su_vi`
--
ALTER TABLE `lich_su_vi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_giao_dich` (`ma_giao_dich`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `mauhopdong`
--
ALTER TABLE `mauhopdong`
  ADD PRIMARY KEY (`MauHopDongID`),
  ADD KEY `TaoBoiAdminID` (`TaoBoiAdminID`);

--
-- Indexes for table `nguoidung`
--
ALTER TABLE `nguoidung`
  ADD PRIMARY KEY (`NguoiDungID`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD UNIQUE KEY `SoDienThoai` (`SoDienThoai`),
  ADD UNIQUE KEY `uq_nguoidung_socccd` (`SoCCCD`),
  ADD KEY `fk_nguoidung_vaitrohoatdong` (`VaiTroHoatDongID`);

--
-- Indexes for table `nhatkyhethong`
--
ALTER TABLE `nhatkyhethong`
  ADD PRIMARY KEY (`NhatKyID`),
  ADD KEY `NguoiDungID` (`NguoiDungID`);

--
-- Indexes for table `noidunghethong`
--
ALTER TABLE `noidunghethong`
  ADD PRIMARY KEY (`NoiDungID`),
  ADD KEY `CapNhatBoiID` (`CapNhatBoiID`);

--
-- Indexes for table `phong`
--
ALTER TABLE `phong`
  ADD PRIMARY KEY (`PhongID`),
  ADD UNIQUE KEY `unique_phong_duan` (`DuAnID`,`TenPhong`),
  ADD KEY `idx_phong_duan_trangthai` (`DuAnID`,`TrangThai`);

--
-- Indexes for table `phong_tindang`
--
ALTER TABLE `phong_tindang`
  ADD PRIMARY KEY (`PhongTinDangID`),
  ADD UNIQUE KEY `unique_phong_per_tindang` (`TinDangID`,`PhongID`),
  ADD KEY `idx_phong_tindang_phong` (`PhongID`),
  ADD KEY `idx_phong_tindang_tindang` (`TinDangID`);

--
-- Indexes for table `quyen`
--
ALTER TABLE `quyen`
  ADD PRIMARY KEY (`QuyenID`),
  ADD UNIQUE KEY `MaQuyen` (`MaQuyen`);

--
-- Indexes for table `thanhviencuochoithoai`
--
ALTER TABLE `thanhviencuochoithoai`
  ADD PRIMARY KEY (`CuocHoiThoaiID`,`NguoiDungID`),
  ADD KEY `NguoiDungID` (`NguoiDungID`),
  ADD KEY `idx_thanhvien_nguoidung` (`NguoiDungID`,`ThamGiaLuc`);

--
-- Indexes for table `thongbao`
--
ALTER TABLE `thongbao`
  ADD PRIMARY KEY (`ThongBaoID`),
  ADD KEY `NguoiNhanID` (`NguoiNhanID`);

--
-- Indexes for table `thongketindang`
--
ALTER TABLE `thongketindang`
  ADD PRIMARY KEY (`ThongKeID`),
  ADD KEY `TinDangID` (`TinDangID`),
  ADD KEY `idx_thongketindang_tindang_ky` (`TinDangID`,`Ky`),
  ADD KEY `idx_thongketindang_ky` (`Ky`);

--
-- Indexes for table `tindang`
--
ALTER TABLE `tindang`
  ADD PRIMARY KEY (`TinDangID`),
  ADD KEY `DuAnID` (`DuAnID`),
  ADD KEY `KhuVucID` (`KhuVucID`),
  ADD KEY `DuyetBoiNhanVienID` (`DuyetBoiNhanVienID`),
  ADD KEY `fk_tindang_chinhsachcoc` (`ChinhSachCocID`),
  ADD KEY `idx_tindang_duan_trangthai` (`DuAnID`,`TrangThai`),
  ADD KEY `idx_tindang_taoluc` (`TaoLuc`),
  ADD KEY `idx_tindang_duan_trangthai_taoluc` (`DuAnID`,`TrangThai`,`TaoLuc`);

--
-- Indexes for table `tinnhan`
--
ALTER TABLE `tinnhan`
  ADD PRIMARY KEY (`TinNhanID`),
  ADD KEY `CuocHoiThoaiID` (`CuocHoiThoaiID`),
  ADD KEY `NguoiGuiID` (`NguoiGuiID`),
  ADD KEY `idx_tinnhan_cuochoithoai` (`CuocHoiThoaiID`,`ThoiGian`),
  ADD KEY `idx_tinnhan_nguoigui` (`NguoiGuiID`,`ThoiGian`),
  ADD KEY `idx_tinnhan_daxoa` (`DaXoa`,`CuocHoiThoaiID`);

--
-- Indexes for table `vaitro`
--
ALTER TABLE `vaitro`
  ADD PRIMARY KEY (`VaiTroID`);

--
-- Indexes for table `vaitro_quyen`
--
ALTER TABLE `vaitro_quyen`
  ADD PRIMARY KEY (`VaiTroID`,`QuyenID`),
  ADD KEY `QuyenID` (`QuyenID`);

--
-- Indexes for table `vi`
--
ALTER TABLE `vi`
  ADD PRIMARY KEY (`ViID`),
  ADD UNIQUE KEY `NguoiDungID` (`NguoiDungID`);

--
-- Indexes for table `yeucauruttien`
--
ALTER TABLE `yeucauruttien`
  ADD PRIMARY KEY (`YeuCauID`),
  ADD KEY `idx_nguoidung_yeucau` (`NguoiDungID`);

--
-- Indexes for table `yeuthich`
--
ALTER TABLE `yeuthich`
  ADD PRIMARY KEY (`NguoiDungID`,`TinDangID`),
  ADD KEY `TinDangID` (`TinDangID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bienbanbangiao`
--
ALTER TABLE `bienbanbangiao`
  MODIFY `BienBanBanGiaoID` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `buttoansocai`
--
ALTER TABLE `buttoansocai`
  MODIFY `ButToanID` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chinhsachcoc`
--
ALTER TABLE `chinhsachcoc`
  MODIFY `ChinhSachCocID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coc`
--
ALTER TABLE `coc`
  MODIFY `CocID` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cuochen`
--
ALTER TABLE `cuochen`
  MODIFY `CuocHenID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `cuochoithoai`
--
ALTER TABLE `cuochoithoai`
  MODIFY `CuocHoiThoaiID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=229;

--
-- AUTO_INCREMENT for table `duan`
--
ALTER TABLE `duan`
  MODIFY `DuAnID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `giaodich`
--
ALTER TABLE `giaodich`
  MODIFY `GiaoDichID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `hopdong`
--
ALTER TABLE `hopdong`
  MODIFY `HopDongID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `hosonhanvien`
--
ALTER TABLE `hosonhanvien`
  MODIFY `HoSoID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `khuvuc`
--
ALTER TABLE `khuvuc`
  MODIFY `KhuVucID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2779;

--
-- AUTO_INCREMENT for table `kyc_verification`
--
ALTER TABLE `kyc_verification`
  MODIFY `KYCVerificationID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `lichlamviec`
--
ALTER TABLE `lichlamviec`
  MODIFY `LichID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `lich_su_vi`
--
ALTER TABLE `lich_su_vi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `mauhopdong`
--
ALTER TABLE `mauhopdong`
  MODIFY `MauHopDongID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `nguoidung`
--
ALTER TABLE `nguoidung`
  MODIFY `NguoiDungID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=248;

--
-- AUTO_INCREMENT for table `nhatkyhethong`
--
ALTER TABLE `nhatkyhethong`
  MODIFY `NhatKyID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=723;

--
-- AUTO_INCREMENT for table `noidunghethong`
--
ALTER TABLE `noidunghethong`
  MODIFY `NoiDungID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `phong`
--
ALTER TABLE `phong`
  MODIFY `PhongID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `phong_tindang`
--
ALTER TABLE `phong_tindang`
  MODIFY `PhongTinDangID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `quyen`
--
ALTER TABLE `quyen`
  MODIFY `QuyenID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thongbao`
--
ALTER TABLE `thongbao`
  MODIFY `ThongBaoID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `thongketindang`
--
ALTER TABLE `thongketindang`
  MODIFY `ThongKeID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tindang`
--
ALTER TABLE `tindang`
  MODIFY `TinDangID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tinnhan`
--
ALTER TABLE `tinnhan`
  MODIFY `TinNhanID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2156;

--
-- AUTO_INCREMENT for table `vaitro`
--
ALTER TABLE `vaitro`
  MODIFY `VaiTroID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vi`
--
ALTER TABLE `vi`
  MODIFY `ViID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `yeucauruttien`
--
ALTER TABLE `yeucauruttien`
  MODIFY `YeuCauID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bienbanbangiao`
--
ALTER TABLE `bienbanbangiao`
  ADD CONSTRAINT `fk_bbbg_hopdong` FOREIGN KEY (`HopDongID`) REFERENCES `hopdong` (`HopDongID`),
  ADD CONSTRAINT `fk_bbbg_phong` FOREIGN KEY (`PhongID`) REFERENCES `phong` (`PhongID`),
  ADD CONSTRAINT `fk_bbbg_tindang` FOREIGN KEY (`TinDangID`) REFERENCES `tindang` (`TinDangID`);

--
-- Constraints for table `buttoansocai`
--
ALTER TABLE `buttoansocai`
  ADD CONSTRAINT `buttoansocai_ibfk_1` FOREIGN KEY (`GiaoDichID`) REFERENCES `giaodich` (`GiaoDichID`),
  ADD CONSTRAINT `buttoansocai_ibfk_2` FOREIGN KEY (`ViID`) REFERENCES `vi` (`ViID`);

--
-- Constraints for table `hopdong`
--
ALTER TABLE `hopdong`
  ADD CONSTRAINT `fk_hopdong_nhanvien` FOREIGN KEY (`NhanVienBanHangID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `hosonhanvien`
--
ALTER TABLE `hosonhanvien`
  ADD CONSTRAINT `hosonhanvien_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`),
  ADD CONSTRAINT `hosonhanvien_ibfk_2` FOREIGN KEY (`KhuVucChinhID`) REFERENCES `khuvuc` (`KhuVucID`),
  ADD CONSTRAINT `hosonhanvien_ibfk_3` FOREIGN KEY (`KhuVucPhuTrachID`) REFERENCES `khuvuc` (`KhuVucID`),
  ADD CONSTRAINT `hosonhanvien_ibfk_4` FOREIGN KEY (`QuanLyID`) REFERENCES `hosonhanvien` (`NguoiDungID`);

--
-- Constraints for table `khuvuc`
--
ALTER TABLE `khuvuc`
  ADD CONSTRAINT `khuvuc_ibfk_1` FOREIGN KEY (`ParentKhuVucID`) REFERENCES `khuvuc` (`KhuVucID`);

--
-- Constraints for table `kyc_verification`
--
ALTER TABLE `kyc_verification`
  ADD CONSTRAINT `kyc_verification_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`);

--
-- Constraints for table `lichlamviec`
--
ALTER TABLE `lichlamviec`
  ADD CONSTRAINT `lichlamviec_ibfk_1` FOREIGN KEY (`NhanVienBanHangID`) REFERENCES `nguoidung` (`NguoiDungID`);

--
-- Constraints for table `mauhopdong`
--
ALTER TABLE `mauhopdong`
  ADD CONSTRAINT `mauhopdong_ibfk_1` FOREIGN KEY (`TaoBoiAdminID`) REFERENCES `nguoidung` (`NguoiDungID`);

--
-- Constraints for table `nguoidung`
--
ALTER TABLE `nguoidung`
  ADD CONSTRAINT `fk_nguoidung_vaitrohoatdong` FOREIGN KEY (`VaiTroHoatDongID`) REFERENCES `vaitro` (`VaiTroID`);

--
-- Constraints for table `yeucauruttien`
--
ALTER TABLE `yeucauruttien`
  ADD CONSTRAINT `fk_yeucauruttien_nguoidung` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
