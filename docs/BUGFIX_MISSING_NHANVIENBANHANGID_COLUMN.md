# BUG FIX: Doanh thu ước tính = 0đ do thiếu cột NhanVienBanHangID

## Ngày phát hiện
2025-01-XX

## Mô tả vấn đề
**Triệu chứng:** Rất nhiều hợp đồng có `SoTienCoc` > 0 nhưng doanh thu ước tính hiển thị = 0đ.

**Nguyên nhân gốc rễ:**
Bảng `hopdong` **thiếu cột `NhanVienBanHangID`**, dẫn đến:

1. Query trong `HoaHongService.js` tham chiếu cột không tồn tại
2. LEFT JOIN với `hosonhanvien` không match → `hsnv.TyLeHoaHong` = NULL
3. Formula tính thu nhập: `doanhThuCongTy * NULL / 100` = **0đ**

## Phân tích chi tiết

### Schema hiện tại (SAI):
```sql
CREATE TABLE `hopdong` (
  `HopDongID` int(11) NOT NULL,
  `TinDangID` int(11) DEFAULT NULL,
  `PhongID` int(11) DEFAULT NULL,
  `DuAnID` int(11) DEFAULT NULL,
  `KhachHangID` int(11) DEFAULT NULL,
  -- ❌ THIẾU CỘT NhanVienBanHangID
  `GiaThueCuoiCung` decimal(15,2) DEFAULT NULL,
  `SoTienCoc` decimal(15,2) DEFAULT NULL
)
```

### Query bị lỗi:
```javascript
// File: server/services/HoaHongService.js
SELECT 
  h.HopDongID,
  h.SoTienCoc,
  d.BangHoaHong,
  hsnv.TyLeHoaHong,
  h.NhanVienBanHangID  -- ❌ CỘT NÀY KHÔNG TỒN TẠI!
FROM hopdong h
LEFT JOIN hosonhanvien hsnv ON h.NhanVienBanHangID = hsnv.NhanVienID
                            -- ❌ JOIN FAIL DO NULL = NULL
```

### Kết quả:
- `h.NhanVienBanHangID` = NULL (cột không tồn tại)
- `hsnv.TyLeHoaHong` = NULL (LEFT JOIN không match)
- `thuNhapNVBH` = `doanhThuCongTy * NULL / 100` = **0**
- `thuNhapNVDH` = `doanhThuCongTy * NULL / 100` = **0**

## Giải pháp

### Bước 1: Chạy migration
```bash
# Vào phpMyAdmin hoặc MySQL CLI
mysql -u root -p thue_tro < migrations/add_nhanvien_to_hopdong.sql
```

**Hoặc trong phpMyAdmin:**
```sql
ALTER TABLE `hopdong` 
ADD COLUMN `NhanVienBanHangID` INT(11) NULL 
COMMENT 'ID nhân viên bán hàng phụ trách hợp đồng này' 
AFTER `DuAnID`;

ALTER TABLE `hopdong` 
ADD CONSTRAINT `fk_hopdong_nhanvien` 
FOREIGN KEY (`NhanVienBanHangID`) 
REFERENCES `nguoidung`(`NguoiDungID`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

ALTER TABLE `hopdong` 
ADD INDEX `idx_hopdong_nhanvien` (`NhanVienBanHangID`);
```

### Bước 2: Cập nhật dữ liệu cũ (optional)
Nếu muốn gán NVBH cho các hợp đồng hiện có, dựa trên `cuochen`:

```sql
UPDATE hopdong h
LEFT JOIN cuochen ch ON h.TinDangID = ch.TinDangID 
                     AND h.KhachHangID = ch.KhachHangID
                     AND ch.TrangThai IN ('DaDuyet', 'DaDen')
SET h.NhanVienBanHangID = ch.NhanVienBanHangID
WHERE h.NhanVienBanHangID IS NULL
  AND ch.NhanVienBanHangID IS NOT NULL;
```

**Lưu ý:** Nếu không có dữ liệu `cuochen`, có thể gán NVBH mặc định:
```sql
-- Gán tất cả cho NVBH có ID = 2 (hoặc ID thực tế trong hệ thống)
UPDATE hopdong 
SET NhanVienBanHangID = 2 
WHERE NhanVienBanHangID IS NULL;
```

### Bước 3: Cập nhật logic tạo hợp đồng mới
Đảm bảo khi tạo hợp đồng mới, luôn ghi nhận `NhanVienBanHangID`:

**Backend (ví dụ trong `CuocHenController.js` hoặc `HopDongController.js`):**
```javascript
// Khi tạo hợp đồng từ cuộc hẹn
const [result] = await db.query(`
  INSERT INTO hopdong (
    TinDangID, 
    PhongID, 
    DuAnID, 
    KhachHangID, 
    NhanVienBanHangID,  -- ✅ BẮT BUỘC GHI NHẬN
    GiaThueCuoiCung, 
    SoTienCoc, 
    TrangThai
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'xacthuc')
`, [
  tinDangId, 
  phongId, 
  duAnId, 
  khachHangId, 
  nhanVienBanHangId,  -- ✅ Lấy từ cuochen hoặc session
  giaThueCuoiCung, 
  soTienCoc
]);
```

## Testing Checklist

- [ ] Chạy migration thành công
- [ ] Kiểm tra foreign key constraint hoạt động
- [ ] Cập nhật dữ liệu cũ (nếu có)
- [ ] Test tạo hợp đồng mới với `NhanVienBanHangID`
- [ ] Verify query `HoaHongService.baoCaoThuNhapNVBH()` trả về dữ liệu đúng
- [ ] Kiểm tra báo cáo thu nhập NVBH frontend (BaoCaoThuNhap.jsx)
- [ ] Kiểm tra báo cáo thu nhập NVDH frontend (BaoCaoThuNhapNVDH.jsx)
- [ ] Verify Dashboard Chủ dự án hiển thị `cocHoanVeChuDuAnThang` chính xác

## Expected Result

**Trước fix:**
```
SoTienCoc: 3,000,000đ
BangHoaHong: [{"soThang":6,"tyLe":30}]
→ doanhThuCongTy: 0đ ❌
→ thuNhapNVBH: 0đ ❌
→ cocHoanVeChuDuAn: 0đ ❌
```

**Sau fix:**
```
SoTienCoc: 3,000,000đ
GiaThueCuoiCung: 3,500,000đ
soThangCoc: round(3,000,000 / 3,500,000) = 1 tháng
BangHoaHong: [{"soThang":6,"tyLe":30}] → tyLe = 0% (vì 1 < 6)

HOẶC nếu BangHoaHong: [{"soThang":1,"tyLe":20}, {"soThang":6,"tyLe":30}]
→ tyLe = 20%
→ doanhThuCongTy: 3,000,000 * 20% = 600,000đ ✅
→ thuNhapNVBH: 600,000 * 50% = 300,000đ ✅
→ thuNhapNVDH: 600,000 * 10% = 60,000đ ✅
→ cocHoanVeChuDuAn: 3,000,000 - 600,000 = 2,400,000đ ✅
```

## Related Files

**Migration:**
- `migrations/add_nhanvien_to_hopdong.sql`

**Backend:**
- `server/services/HoaHongService.js` (queries using NhanVienBanHangID)
- `server/controllers/CuocHenController.js` (tạo hợp đồng từ cuộc hẹn)

**Frontend:**
- `client/src/pages/NhanVienBanHang/BaoCaoThuNhap.jsx`
- `client/src/pages/Operator/BaoCaoThuNhapNVDH.jsx`
- `client/src/pages/ChuDuAn/Dashboard.jsx`

**Documentation:**
- `docs/HOA_HONG_COMPLETE_IMPLEMENTATION_SUMMARY.md`
- `docs/HOA_HONG_SCHEMA_ANALYSIS.md` (TẠO MỚI)

## Rollback Instructions

Nếu cần rollback migration:
```sql
ALTER TABLE `hopdong` DROP FOREIGN KEY `fk_hopdong_nhanvien`;
ALTER TABLE `hopdong` DROP INDEX `idx_hopdong_nhanvien`;
ALTER TABLE `hopdong` DROP COLUMN `NhanVienBanHangID`;
```

## Phòng ngừa tương lai

1. **Schema Validation:** Thêm test kiểm tra schema trước khi deploy
2. **Mock Data:** Tạo test data đầy đủ với `NhanVienBanHangID`
3. **Code Review:** Review kỹ queries tham chiếu foreign keys
4. **Documentation:** Cập nhật ERD diagram trong `docs/`
