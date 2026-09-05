-- Migration: Thêm table 'transactions' từ upstream
-- Date: 2025-10-21
-- Source: upstream/Hop
-- Purpose: Merge upstream database changes vào local

-- --------------------------------------------------------
--
-- Cấu trúc bảng cho bảng `transactions`
--

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(20) NOT NULL,
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
-- Chỉ mục cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sepay_id` (`sepay_id`);

--
-- AUTO_INCREMENT cho bảng `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT;

--
-- Dữ liệu mẫu cho bảng `transactions` (từ upstream)
--
INSERT INTO `transactions` (`id`, `user_id`, `bank_name`, `account_number`, `amount_in`, `transaction_content`, `transaction_date`, `reference_number`, `sepay_id`, `bank_brand_name`, `amount_out`, `accumulated`, `code`, `sub_account`, `bank_account_id`) VALUES
(1, NULL, 'TPBank', '80349195777', 2000.00, '104104028174 0349195610 donhang666666', '2025-10-15 16:30:20', '668ITC1252891160', '26445532', 'TPBank', 0.00, 12000.00, NULL, NULL, '29190'),
(2, NULL, 'TPBank', '80349195777', 10000.00, 'anh yeu em', '2025-10-15 08:47:11', '666V501252880750', '26392545', 'TPBank', 0.00, 10000.00, NULL, NULL, '29190');

COMMIT;
