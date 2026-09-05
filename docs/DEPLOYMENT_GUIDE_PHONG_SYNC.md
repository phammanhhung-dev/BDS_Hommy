# 🚀 HƯỚNG DẪN TRIỂN KHAI - ĐỒNG BỘ TRẠNG THÁI PHÒNG

## Ngày: 09/10/2025

---

## 📋 CHECKLIST TRIỂN KHAI

### Bước 1: Backup Database ⚠️

```bash
# Backup toàn bộ database
mysqldump -u root -p thue_tro > backup_thue_tro_$(date +%Y%m%d_%H%M%S).sql

# Hoặc chỉ backup các bảng liên quan
mysqldump -u root -p thue_tro phong tindang coc cuochen > backup_phong_$(date +%Y%m%d_%H%M%S).sql
```

### Bước 2: Chạy Migration Script

```bash
# Đường dẫn: migrations/2025_10_09_sync_phong_status_trigger.sql

mysql -u root -p thue_tro < migrations/2025_10_09_sync_phong_status_trigger.sql
```

**Hoặc qua MySQL Workbench/phpMyAdmin:**
1. Mở file `2025_10_09_sync_phong_status_trigger.sql`
2. Chạy từng section theo thứ tự
3. Kiểm tra không có lỗi

### Bước 3: Kiểm Tra Migration Thành Công

```sql
-- 1. Kiểm tra triggers đã được tạo
SHOW TRIGGERS LIKE 'phong';
-- Kết quả mong đợi: 2 triggers
--   - trg_phong_sync_status_update
--   - trg_phong_sync_status_insert

-- 2. Kiểm tra stored procedure
SHOW PROCEDURE STATUS WHERE Db = 'thue_tro' AND Name = 'sp_sync_all_phong_status';

-- 3. Kiểm tra view
SELECT * FROM v_phong_trung_lap LIMIT 5;

-- 4. Kiểm tra constraint
SHOW CREATE TABLE phong;
-- Phải có: UNIQUE KEY `unique_phong_tindang` (TinDangID, TenPhong)
```

### Bước 4: Đồng Bộ Dữ Liệu Hiện Tại

```sql
-- Chạy stored procedure để đồng bộ tất cả phòng hiện tại
CALL sp_sync_all_phong_status();

-- Kiểm tra kết quả
SELECT * FROM v_phong_trung_lap;
-- Nếu vẫn còn phòng trùng với trạng thái khác nhau → Cần xử lý thủ công
```

### Bước 5: Cập Nhật Backend Code

```bash
# File mới được tạo: server/utils/phongValidation.js
# Không cần restart server ngay, sẽ sử dụng ở bước tiếp theo
```

---

## 🧪 TEST SAU KHI TRIỂN KHAI

### Test Case 1: Tự động đồng bộ khi cọc phòng

```sql
-- Giả sử có 2 tin đăng cùng dự án, cùng phòng "101"
-- TinDang 4: Phòng 101 (PhongID = 10, TrangThai = 'Trong')
-- TinDang 8: Phòng 101 (PhongID = 15, TrangThai = 'Trong')

-- 1. Update trạng thái phòng ở tin đăng 4
UPDATE phong 
SET TrangThai = 'GiuCho' 
WHERE PhongID = 10;

-- 2. Kiểm tra phòng ở tin đăng 8 có đồng bộ không
SELECT PhongID, TenPhong, TrangThai 
FROM phong 
WHERE PhongID = 15;
-- Kết quả mong đợi: TrangThai = 'GiuCho'
```

### Test Case 2: Đồng bộ khi tạo phòng mới

```sql
-- 1. Giả sử tin đăng 4 có phòng "102" trạng thái 'DaThue'

-- 2. Tạo tin đăng mới (TinDang 9) cùng dự án
INSERT INTO tindang (DuAnID, TieuDe, TrangThai) 
VALUES (14, 'Tin đăng test', 'Nhap');

-- 3. Thêm phòng "102" vào tin đăng 9
INSERT INTO phong (TinDangID, TenPhong, TrangThai, Gia, DienTich)
VALUES (9, '102', 'Trong', 3000000, 25);

-- 4. Kiểm tra phòng vừa tạo
SELECT PhongID, TenPhong, TrangThai 
FROM phong 
WHERE TinDangID = 9 AND TenPhong = '102';
-- Kết quả mong đợi: TrangThai = 'DaThue' (tự động đồng bộ)
```

### Test Case 3: Ngăn tạo phòng trùng trong cùng tin đăng

```sql
-- 1. Thử tạo 2 phòng cùng tên trong 1 tin đăng
INSERT INTO phong (TinDangID, TenPhong, Gia, DienTich)
VALUES (4, '101', 3000000, 25);

INSERT INTO phong (TinDangID, TenPhong, Gia, DienTich)
VALUES (4, '101', 3500000, 30);

-- Kết quả mong đợi: ERROR - Duplicate entry (unique constraint)
```

---

## 📊 MONITORING & BÁO CÁO

### Báo cáo phòng trùng lặp

```sql
-- Xem tất cả phòng trùng lặp
SELECT * FROM v_phong_trung_lap;

-- Lọc theo dự án cụ thể
SELECT * FROM v_phong_trung_lap WHERE DuAnID = 14;

-- Chỉ xem phòng có trạng thái không đồng bộ
SELECT * FROM v_phong_trung_lap WHERE SoTrangThaiKhacNhau > 1;
```

### Sử dụng phongValidation.js trong code

```javascript
// server/controllers/ChuDuAnController.js
const { validateDanhSachPhong } = require('../utils/phongValidation');

async function themPhongChoTinDang(req, res) {
  const { tinDangID } = req.params;
  const { danhSachPhong } = req.body;
  
  try {
    // Validate trước khi thêm
    const validation = await validateDanhSachPhong(
      tinDangID, 
      danhSachPhong,
      {
        allowDuplicate: false,  // Không cho phép trùng
        autoSync: true          // Tự động đồng bộ nếu cho phép
      }
    );
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }
    
    // Warnings không block, nhưng nên thông báo cho user
    if (validation.warnings.length > 0) {
      console.warn('Phòng warnings:', validation.warnings);
    }
    
    // Tiếp tục logic thêm phòng...
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
```

---

## 🔍 TROUBLESHOOTING

### Vấn đề 1: Trigger không chạy

**Triệu chứng:** Update trạng thái phòng nhưng không đồng bộ

**Kiểm tra:**
```sql
-- Xem log MySQL (nếu có)
SHOW VARIABLES LIKE 'log_error';

-- Kiểm tra trigger có lỗi không
SHOW TRIGGERS LIKE 'phong';
```

**Giải pháp:**
- Xóa và tạo lại trigger
- Kiểm tra user có quyền CREATE TRIGGER không

### Vấn đề 2: Constraint unique_phong_tindang block việc import data

**Triệu chứng:** ERROR 1062: Duplicate entry khi import/seed data

**Giải pháp tạm thời:**
```sql
-- Tắt constraint
ALTER TABLE phong DROP INDEX unique_phong_tindang;

-- Import data
-- ...

-- Bật lại constraint
ALTER TABLE phong ADD UNIQUE KEY unique_phong_tindang (TinDangID, TenPhong);
```

### Vấn đề 3: Performance chậm khi có nhiều phòng

**Triệu chứng:** Update phòng mất nhiều thời gian

**Giải pháp:**
```sql
-- Thêm index để tối ưu query
CREATE INDEX idx_tindang_duan ON tindang(DuAnID, TrangThai);
CREATE INDEX idx_phong_ten ON phong(TenPhong, TrangThai);
```

---

## 📈 ROADMAP DÀI HẠN

### Phase 1: Ngắn hạn (Hoàn thành) ✅
- [x] Trigger đồng bộ trạng thái
- [x] Constraint unique per tin đăng
- [x] Validation utils
- [x] View báo cáo

### Phase 2: Trung hạn (1-2 tháng)
- [ ] UI warning khi tạo phòng trùng
- [ ] API endpoint `/api/chu-du-an/phong/kiem-tra-trung-lap`
- [ ] Dashboard báo cáo phòng trùng lặp
- [ ] Tính năng "merge" phòng trùng

### Phase 3: Dài hạn (3-6 tháng)
- [ ] Redesign schema (`phong_master` + `phong_tindang`)
- [ ] Migration script tự động
- [ ] Update toàn bộ API
- [ ] QA và rollout production

---

## 🔐 ROLLBACK PLAN

Nếu có vấn đề sau khi triển khai:

```sql
-- 1. Xóa triggers
DROP TRIGGER IF EXISTS trg_phong_sync_status_update;
DROP TRIGGER IF EXISTS trg_phong_sync_status_insert;

-- 2. Xóa stored procedure
DROP PROCEDURE IF EXISTS sp_sync_all_phong_status;

-- 3. Xóa view
DROP VIEW IF EXISTS v_phong_trung_lap;

-- 4. Xóa constraint (nếu gây vấn đề)
ALTER TABLE phong DROP INDEX unique_phong_tindang;

-- 5. Restore từ backup
-- mysql -u root -p thue_tro < backup_thue_tro_YYYYMMDD_HHMMSS.sql
```

---

## 📞 SUPPORT

**Nếu gặp vấn đề:**
1. Kiểm tra log MySQL
2. Chạy test cases trên
3. Xem view `v_phong_trung_lap`
4. Liên hệ team tech

**Files liên quan:**
- `docs/PHONG_SYNCHRONIZATION_SOLUTION.md` - Phân tích chi tiết
- `migrations/2025_10_09_sync_phong_status_trigger.sql` - Migration script
- `server/utils/phongValidation.js` - Validation utilities

---

**Người triển khai:** _________________
**Ngày triển khai:** _________________
**Kết quả:** ☐ Thành công  ☐ Có lỗi (ghi chú): _________________

