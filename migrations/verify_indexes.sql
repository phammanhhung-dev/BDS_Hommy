-- ============================================================================
-- Script: Verify Reporting Indexes
-- Purpose: Kiểm tra xem các indexes đã được tạo chưa
-- Date: 2025-10-24
-- ============================================================================

-- Kiểm tra tất cả indexes mới được tạo
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  CARDINALITY,
  INDEX_TYPE,
  CASE 
    WHEN INDEX_NAME LIKE 'idx_%' THEN '✅ Custom Index'
    WHEN INDEX_NAME = 'PRIMARY' THEN '🔑 Primary Key'
    ELSE '📌 Other Index'
  END AS INDEX_STATUS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('tindang', 'cuochen', 'coc', 'thongketindang', 'phong', 'duan', 'phong_tindang')
  AND (INDEX_NAME LIKE 'idx_%' OR INDEX_NAME = 'PRIMARY')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Đếm số lượng indexes theo bảng
SELECT 
  TABLE_NAME,
  COUNT(DISTINCT INDEX_NAME) AS TOTAL_INDEXES,
  SUM(CASE WHEN INDEX_NAME LIKE 'idx_%' THEN 1 ELSE 0 END) AS CUSTOM_INDEXES
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('tindang', 'cuochen', 'coc', 'thongketindang', 'phong', 'duan', 'phong_tindang')
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

-- Kiểm tra các indexes quan trọng nhất
SELECT 
  CASE 
    WHEN COUNT(*) >= 16 THEN '✅ ALL INDEXES CREATED'
    ELSE '❌ MISSING INDEXES'
  END AS STATUS,
  COUNT(*) AS INDEXES_FOUND,
  16 AS INDEXES_EXPECTED
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME IN (
    'idx_tindang_duan_trangthai',
    'idx_tindang_taoluc',
    'idx_tindang_duan_trangthai_taoluc',
    'idx_cuochen_phong_trangthai',
    'idx_cuochen_thoigianhen_trangthai',
    'idx_cuochen_taoluc',
    'idx_coc_phong_trangthai',
    'idx_coc_loai_trangthai',
    'idx_coc_taoluc_trangthai',
    'idx_coc_taoluc_sotien',
    'idx_thongketindang_tindang_ky',
    'idx_thongketindang_ky',
    'idx_phong_duan_trangthai',
    'idx_duan_chuduan_trangthai',
    'idx_phong_tindang_phong',
    'idx_phong_tindang_tindang'
  );
