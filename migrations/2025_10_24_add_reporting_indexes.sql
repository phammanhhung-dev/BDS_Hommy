-- ============================================================================
-- Migration: Add Reporting Indexes for Dashboard & Báo cáo Hiệu suất
-- Date: 2025-10-24
-- Purpose: Optimize queries cho Dashboard và Báo cáo của Chủ dự án
-- Refs: UC-PROJ-03, DASHBOARD_BAOCAO_OPTIMIZATION_PLAN.md
-- ============================================================================

-- ============================================================================
-- 1. INDEXES CHO TIN ĐĂNG (tindang)
-- ============================================================================

-- Index cho queries lọc theo ChuDuAnID và TrangThai
-- Sử dụng trong: Dashboard, Báo cáo, Danh sách tin đăng
CREATE INDEX IF NOT EXISTS idx_tindang_duan_trangthai 
ON tindang(DuAnID, TrangThai);

-- Index cho queries lọc theo ngày tạo (time-range filtering)
-- Sử dụng trong: Báo cáo theo khoảng thời gian
CREATE INDEX IF NOT EXISTS idx_tindang_taoluc 
ON tindang(TaoLuc);

-- Index cho queries kết hợp DuAnID + TrangThai + TaoLuc
-- Sử dụng trong: Báo cáo chi tiết với date range
CREATE INDEX IF NOT EXISTS idx_tindang_duan_trangthai_taoluc 
ON tindang(DuAnID, TrangThai, TaoLuc);

-- ============================================================================
-- 2. INDEXES CHO CUỘC HẸN (cuochen)
-- ============================================================================

-- Index cho queries lọc theo PhongID và TrangThai
-- Sử dụng trong: Thống kê cuộc hẹn theo phòng
CREATE INDEX IF NOT EXISTS idx_cuochen_phong_trangthai 
ON cuochen(PhongID, TrangThai);

-- Index cho queries lọc theo thời gian hẹn (upcoming appointments)
-- Sử dụng trong: Dashboard - Cuộc hẹn sắp tới
CREATE INDEX IF NOT EXISTS idx_cuochen_thoigianhen_trangthai 
ON cuochen(ThoiGianHen, TrangThai);

-- Index cho queries lọc theo TaoLuc (reporting date range)
-- Sử dụng trong: Báo cáo theo khoảng thời gian
CREATE INDEX IF NOT EXISTS idx_cuochen_taoluc 
ON cuochen(TaoLuc);

-- ============================================================================
-- 3. INDEXES CHO COC (coc)
-- ============================================================================

-- Index cho queries lọc theo PhongID và TrangThai
-- Sử dụng trong: Thống kê giao dịch cọc theo phòng
CREATE INDEX IF NOT EXISTS idx_coc_phong_trangthai 
ON coc(PhongID, TrangThai);

-- Index cho queries lọc theo Loai (CocGiuCho, CocAnNinh)
-- Sử dụng trong: Báo cáo phân loại cọc
CREATE INDEX IF NOT EXISTS idx_coc_loai_trangthai 
ON coc(Loai, TrangThai);

-- Index cho queries lọc theo TaoLuc (reporting date range)
-- Sử dụng trong: Báo cáo doanh thu theo thời gian
CREATE INDEX IF NOT EXISTS idx_coc_taoluc_trangthai 
ON coc(TaoLuc, TrangThai);

-- Index cho queries GROUP BY tháng (revenue trends)
-- Sử dụng trong: Doanh thu 6 tháng gần nhất
CREATE INDEX IF NOT EXISTS idx_coc_taoluc_sotien 
ON coc(TaoLuc, SoTien);

-- ============================================================================
-- 4. INDEXES CHO THỐNG KÊ TIN ĐĂNG (thongketindang)
-- ============================================================================

-- Index cho queries lọc theo TinDangID và Ky
-- Sử dụng trong: Lượt xem, yêu thích theo ngày
CREATE INDEX IF NOT EXISTS idx_thongketindang_tindang_ky 
ON thongketindang(TinDangID, Ky);

-- Index cho queries lọc theo Ky (date range filtering)
-- Sử dụng trong: Báo cáo tương tác theo thời gian
CREATE INDEX IF NOT EXISTS idx_thongketindang_ky 
ON thongketindang(Ky);

-- ============================================================================
-- 5. INDEXES CHO PHÒNG (phong)
-- ============================================================================

-- Index cho queries lọc theo DuAnID và TrangThai
-- Sử dụng trong: Thống kê phòng theo dự án
CREATE INDEX IF NOT EXISTS idx_phong_duan_trangthai 
ON phong(DuAnID, TrangThai);

-- ============================================================================
-- 6. INDEXES CHO DỰ ÁN (duan)
-- ============================================================================

-- Index cho queries lọc theo ChuDuAnID và TrangThai
-- Sử dụng trong: Danh sách dự án của chủ dự án
CREATE INDEX IF NOT EXISTS idx_duan_chuduan_trangthai 
ON duan(ChuDuAnID, TrangThai);

-- ============================================================================
-- 7. INDEXES CHO PHÒNG_TIN ĐĂNG (phong_tindang) - Junction table
-- ============================================================================

-- Index cho queries JOIN giữa phong và tindang
-- Sử dụng trong: Tất cả queries cần liên kết phòng-tin đăng
CREATE INDEX IF NOT EXISTS idx_phong_tindang_phong 
ON phong_tindang(PhongID);

CREATE INDEX IF NOT EXISTS idx_phong_tindang_tindang 
ON phong_tindang(TinDangID);

-- ============================================================================
-- 8. VERIFY INDEXES
-- ============================================================================

-- Kiểm tra các indexes đã tạo
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  CARDINALITY,
  INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('tindang', 'cuochen', 'coc', 'thongketindang', 'phong', 'duan', 'phong_tindang')
  AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- ROLLBACK (Nếu cần xóa indexes)
-- ============================================================================

-- Uncomment để rollback:
/*
DROP INDEX IF EXISTS idx_tindang_duan_trangthai ON tindang;
DROP INDEX IF EXISTS idx_tindang_taoluc ON tindang;
DROP INDEX IF EXISTS idx_tindang_duan_trangthai_taoluc ON tindang;
DROP INDEX IF EXISTS idx_cuochen_phong_trangthai ON cuochen;
DROP INDEX IF EXISTS idx_cuochen_thoigianhen_trangthai ON cuochen;
DROP INDEX IF EXISTS idx_cuochen_taoluc ON cuochen;
DROP INDEX IF EXISTS idx_coc_phong_trangthai ON coc;
DROP INDEX IF EXISTS idx_coc_loai_trangthai ON coc;
DROP INDEX IF EXISTS idx_coc_taoluc_trangthai ON coc;
DROP INDEX IF EXISTS idx_coc_taoluc_sotien ON coc;
DROP INDEX IF EXISTS idx_thongketindang_tindang_ky ON thongketindang;
DROP INDEX IF EXISTS idx_thongketindang_ky ON thongketindang;
DROP INDEX IF EXISTS idx_phong_duan_trangthai ON phong;
DROP INDEX IF EXISTS idx_duan_chuduan_trangthai ON duan;
DROP INDEX IF EXISTS idx_phong_tindang_phong ON phong_tindang;
DROP INDEX IF EXISTS idx_phong_tindang_tindang ON phong_tindang;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Indexes giúp tăng tốc SELECT nhưng làm chậm INSERT/UPDATE/DELETE
--    → Phù hợp với use case Dashboard/Báo cáo (đọc nhiều, ghi ít)

-- 2. Sử dụng EXPLAIN để verify query performance:
--    EXPLAIN SELECT ... FROM tindang WHERE DuAnID = ? AND TrangThai = ?;

-- 3. Monitor index usage:
--    SELECT * FROM sys.schema_unused_indexes WHERE object_schema = 'thue_tro';

-- 4. Rebuild indexes định kỳ (monthly):
--    OPTIMIZE TABLE tindang, cuochen, coc, thongketindang, phong, duan;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
