-- Lưu metadata mở rộng cho dự án và tin đăng
-- Dùng TEXT để tương thích với môi trường MySQL hiện tại và chứa JSON string an toàn

ALTER TABLE `duan`
  ADD COLUMN `ThongTinMoRong` LONGTEXT DEFAULT NULL COMMENT 'JSON string chứa metadata mở rộng của dự án' AFTER `LyDoTuChoiHoaHong`;

ALTER TABLE `tindang`
  ADD COLUMN `ThongTinMoRong` LONGTEXT DEFAULT NULL COMMENT 'JSON string chứa metadata mở rộng của tin đăng' AFTER `MoTaGiaDichVu`;