# 🔴 VẤN ĐỀ ĐỒNG BỘ TRẠNG THÁI PHÒNG

## Ngày phân tích: 09/10/2025

---

## 📊 PHÂN TÍCH VẤN ĐỀ

### Tình huống thực tế:

```
Dự án: "Nhà trọ Minh Tâm" (DuAnID = 14)

Tin đăng 1 (TinDangID = 4):
  - Phòng 101 (PhongID = 10, TrangThai = 'GiuCho') ← Đã có người cọc
  - Phòng 102 (PhongID = 11, TrangThai = 'Trong')

Tin đăng 2 (TinDangID = 8):
  - Phòng 101 (PhongID = 15, TrangThai = 'Trong') ← ⚠️ VẪN HIỆN TRỐNG!
  - Phòng 103 (PhongID = 16, TrangThai = 'Trong')
```

**Vấn đề:** Cùng 1 phòng vật lý (Phòng 101) nhưng có 2 bản ghi khác nhau trong DB:
- `PhongID=10` (TinDang 1): Trạng thái `GiuCho`
- `PhongID=15` (TinDang 2): Trạng thái `Trong`

→ **Khách hàng có thể đặt cọc 2 lần cho cùng 1 phòng!**

---

## 🔍 NGUYÊN NHÂN GỐC RỄ

### Thiết kế hiện tại:

```sql
phong
├── PhongID (PK)
├── TinDangID (FK → tindang) ⚠️ VẤN ĐỀ Ở ĐÂY
├── TenPhong
└── TrangThai
```

**Vấn đề thiết kế:**
1. **Phòng gắn với Tin đăng**, không phải với Dự án
2. Cùng 1 phòng vật lý → Nhiều bản ghi trong DB (mỗi tin đăng 1 bản ghi)
3. Không có cách nào để hệ thống biết 2 bản ghi là cùng 1 phòng

### Dữ liệu hiện tại (từ SQL dump):

```sql
-- Tin đăng 4 (Dự án 14)
INSERT INTO phong VALUES 
(1, 4, '006', 'Trong', 3500000.00, 25.00, ...),
(2, 4, '1006', 'Trong', 4000000.00, 25.00, ...);

-- Tin đăng 8 (Dự án 17)  
INSERT INTO phong VALUES
(5, 8, '006', 'Trong', 3000000.00, 30.00, ...),
(6, 8, '006A', 'Trong', 3500000.00, 30.00, ...);
```

Nếu cả TinDang 4 và TinDang 8 đều thuộc CÙNG dự án, và phòng "006" là cùng 1 phòng vật lý → **Conflict!**

---

## ✅ GIẢI PHÁP

### 🎯 Giải pháp 1: Tái cấu trúc DB (KHUYẾN NGHỊ - Dài hạn)

**Thiết kế mới:**

```sql
-- Bảng phòng Master (Phòng thực tế của dự án)
CREATE TABLE phong_master (
  PhongMasterID INT PRIMARY KEY AUTO_INCREMENT,
  DuAnID INT NOT NULL,
  TenPhong VARCHAR(100) NOT NULL,
  TrangThai ENUM('Trong','GiuCho','DaThue','DonDep') DEFAULT 'Trong',
  GhiChu TEXT,
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (DuAnID) REFERENCES duan(DuAnID),
  UNIQUE KEY unique_phong_duan (DuAnID, TenPhong) -- 1 dự án không có 2 phòng cùng tên
);

-- Bảng mapping phòng - tin đăng (Thông tin giá cho từng tin)
CREATE TABLE phong_tindang (
  PhongMasterID INT NOT NULL,
  TinDangID INT NOT NULL,
  Gia DECIMAL(15,2),
  DienTich DECIMAL(5,2),
  URL VARCHAR(500),
  MoTaRieng TEXT,
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (PhongMasterID, TinDangID),
  FOREIGN KEY (PhongMasterID) REFERENCES phong_master(PhongMasterID),
  FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID) ON DELETE CASCADE
);

-- Cập nhật bảng cọc
ALTER TABLE coc 
  DROP COLUMN PhongID,
  ADD COLUMN PhongMasterID INT NOT NULL,
  ADD FOREIGN KEY (PhongMasterID) REFERENCES phong_master(PhongMasterID);

-- Cập nhật bảng cuộc hẹn
ALTER TABLE cuochen
  DROP COLUMN PhongID,
  ADD COLUMN PhongMasterID INT NOT NULL,
  ADD FOREIGN KEY (PhongMasterID) REFERENCES phong_master(PhongMasterID);
```

**Ưu điểm:**
- ✅ Đảm bảo tính nhất quán (consistency)
- ✅ 1 phòng vật lý = 1 bản ghi duy nhất
- ✅ Trạng thái đồng bộ tự động
- ✅ Dễ query và báo cáo

**Nhược điểm:**
- ❌ Cần migration data phức tạp
- ❌ Phải cập nhật toàn bộ logic backend
- ❌ Breaking changes cho API

**Migration Plan:**
```sql
-- Migration script
START TRANSACTION;

-- 1. Tạo bảng mới
CREATE TABLE phong_master (...);
CREATE TABLE phong_tindang (...);

-- 2. Di chuyển dữ liệu
INSERT INTO phong_master (DuAnID, TenPhong, TrangThai, GhiChu)
SELECT DISTINCT 
  td.DuAnID,
  p.TenPhong,
  p.TrangThai,
  p.GhiChu
FROM phong p
JOIN tindang td ON p.TinDangID = td.TinDangID
ON DUPLICATE KEY UPDATE 
  TrangThai = IF(VALUES(TrangThai) = 'GiuCho', 'GiuCho', TrangThai);

-- 3. Tạo mapping
INSERT INTO phong_tindang (PhongMasterID, TinDangID, Gia, DienTich, URL)
SELECT 
  pm.PhongMasterID,
  p.TinDangID,
  p.Gia,
  p.DienTich,
  p.URL
FROM phong p
JOIN tindang td ON p.TinDangID = td.TinDangID
JOIN phong_master pm ON pm.DuAnID = td.DuAnID AND pm.TenPhong = p.TenPhong;

-- 4. Backup bảng cũ
RENAME TABLE phong TO phong_old; -- (đã được drop trong migration final sau khi verify)

COMMIT;
```

---

### 🔧 Giải pháp 2: Business Rule (Trung bình - Ngắn hạn)

**Quy tắc:** Một phòng chỉ được xuất hiện trong 1 tin đăng đang hoạt động

**Implementation:**

```javascript
// server/models/ChuDuAnModel.js

async function kiemTraPhongTrungLap(duAnID, tenPhong, tinDangIDHienTai = null) {
  const [rows] = await db.query(`
    SELECT 
      p.PhongID,
      p.TenPhong,
      p.TrangThai,
      td.TinDangID,
      td.TieuDe,
      td.TrangThai as TrangThaiTinDang
    FROM phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    WHERE td.DuAnID = ?
      AND p.TenPhong = ?
      AND td.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaDang')
      AND (? IS NULL OR td.TinDangID != ?)
  `, [duAnID, tenPhong, tinDangIDHienTai, tinDangIDHienTai]);

  return rows;
}

async function themPhongChoTinDang(tinDangID, danhSachPhong) {
  // Lấy DuAnID
  const [tinDang] = await db.query('SELECT DuAnID FROM tindang WHERE TinDangID = ?', [tinDangID]);
  if (!tinDang.length) throw new Error('Tin đăng không tồn tại');
  
  const duAnID = tinDang[0].DuAnID;
  const errors = [];

  // Kiểm tra từng phòng
  for (const phong of danhSachPhong) {
    const trungLap = await kiemTraPhongTrungLap(duAnID, phong.tenPhong, tinDangID);
    
    if (trungLap.length > 0) {
      errors.push({
        tenPhong: phong.tenPhong,
        tinDangTrungLap: trungLap.map(r => ({
          tinDangID: r.TinDangID,
          tieuDe: r.TieuDe,
          trangThai: r.TrangThai
        }))
      });
    }
  }

  if (errors.length > 0) {
    throw {
      code: 'PHONG_TRUNG_LAP',
      message: 'Các phòng sau đã tồn tại trong tin đăng khác',
      details: errors
    };
  }

  // Nếu OK → Thêm phòng
  // ...
}
```

**Ưu điểm:**
- ✅ Không cần thay đổi schema
- ✅ Triển khai nhanh
- ✅ Tương thích ngược

**Nhược điểm:**
- ❌ Chủ dự án không thể tạo nhiều tin đăng cho cùng phòng
- ❌ Không linh hoạt (VD: giá khác nhau cho tin khác nhau)

---

### ⚙️ Giải pháp 3: Đồng bộ tự động qua Trigger (Tạm thời - Nhanh)

**Logic:** Khi PhongA thay đổi trạng thái → Tìm tất cả phòng cùng tên trong cùng dự án → Cập nhật

```sql
DELIMITER $$

CREATE TRIGGER trg_phong_sync_status 
AFTER UPDATE ON phong
FOR EACH ROW
BEGIN
  -- Chỉ chạy khi TrangThai thay đổi
  IF NEW.TrangThai != OLD.TrangThai THEN
    
    -- Cập nhật tất cả phòng cùng tên trong cùng dự án
    UPDATE phong p
    JOIN tindang td ON p.TinDangID = td.TinDangID
    JOIN tindang td_new ON td_new.TinDangID = NEW.TinDangID
    SET p.TrangThai = NEW.TrangThai
    WHERE td.DuAnID = td_new.DuAnID
      AND p.TenPhong = NEW.TenPhong
      AND p.PhongID != NEW.PhongID;
      
  END IF;
END$$

DELIMITER ;
```

**Ưu điểm:**
- ✅ Tự động đồng bộ
- ✅ Không cần thay đổi code backend
- ✅ Triển khai cực nhanh

**Nhược điểm:**
- ❌ Phụ thuộc vào `TenPhong` (nếu viết khác nhau → không sync)
- ❌ Khó debug
- ❌ Performance có thể chậm với nhiều phòng

---

## 📋 KHUYẾN NGHỊ TRIỂN KHAI

### Giai đoạn 1: Ngắn hạn (1-2 tuần)
1. ✅ Triển khai **Trigger đồng bộ** (Giải pháp 3)
2. ✅ Thêm warning trong UI khi tạo phòng trùng tên
3. ✅ Chuẩn hóa `TenPhong` (trim, uppercase)

### Giai đoạn 2: Trung hạn (1-2 tháng)
1. ✅ Thêm validation **Business Rule** (Giải pháp 2)
2. ✅ Tạo báo cáo phòng trùng lặp
3. ✅ Cho phép Chủ dự án "merge" phòng trùng

### Giai đoạn 3: Dài hạn (3-6 tháng)
1. ✅ Thiết kế và test migration script
2. ✅ Cập nhật toàn bộ backend API
3. ✅ Triển khai **Tái cấu trúc DB** (Giải pháp 1)
4. ✅ QA đầy đủ trước khi lên production

---

## 🔒 RÀNG BUỘC BỔ SUNG

### Constraint để đảm bảo data integrity:

```sql
-- 1. Ngăn tạo phòng trùng trong cùng tin đăng
ALTER TABLE phong 
ADD UNIQUE KEY unique_phong_tindang (TinDangID, TenPhong);

-- 2. Cascade delete khi xóa tin đăng
ALTER TABLE phong
DROP FOREIGN KEY phong_ibfk_1,
ADD CONSTRAINT phong_ibfk_1 
  FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID) 
  ON DELETE CASCADE;

-- 3. Check constraint cho trạng thái hợp lệ
ALTER TABLE phong 
ADD CONSTRAINT chk_trangThai_hop_le 
CHECK (TrangThai IN ('Trong', 'GiuCho', 'DaThue', 'DonDep'));
```

---

## 🧪 TEST CASES

### Test Case 1: Cọc phòng trùng lặp

```javascript
describe('Kiểm tra đồng bộ trạng thái phòng', () => {
  it('Khi cọc Phòng 101 ở TinDang 1 → TinDang 2 cũng phải cập nhật', async () => {
    // Setup: Tạo 2 tin đăng cùng dự án, cùng phòng 101
    const tinDang1 = await taoTinDang({ duAnID: 1, phongs: [{ tenPhong: '101' }] });
    const tinDang2 = await taoTinDang({ duAnID: 1, phongs: [{ tenPhong: '101' }] });
    
    // Action: Cọc phòng 101 ở tin đăng 1
    await cocPhong(tinDang1.phongs[0].PhongID);
    
    // Assert: Phòng 101 ở tin đăng 2 cũng phải có trạng thái 'GiuCho'
    const phong2 = await layPhong(tinDang2.phongs[0].PhongID);
    expect(phong2.TrangThai).toBe('GiuCho');
  });
});
```

---

## 📞 ACTION ITEMS

**Urgent (Làm ngay):**
- [ ] Tạo trigger đồng bộ trạng thái
- [ ] Thêm validation khi tạo phòng
- [ ] Chuẩn hóa TenPhong

**Important (Tuần tới):**
- [ ] Báo cáo phòng trùng lặp hiện tại
- [ ] UI warning cho Chủ dự án
- [ ] Document cho team

**Long-term (Roadmap):**
- [ ] Thiết kế migration script
- [ ] Update API contracts
- [ ] QA và rollout plan

---

**Tài liệu tham khảo:**
- `thue_tro.sql` - Line 3343 (phong table)
- `thue_tro.sql` - Line 151 (coc table)
- `thue_tro.sql` - Line 173 (cuochen table)

