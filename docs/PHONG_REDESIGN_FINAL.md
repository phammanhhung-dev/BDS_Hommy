# 🎯 THIẾT KẾ LẠI BẢNG PHÒNG - PHIÊN BẢN CUỐI CÙNG

## Ngày: 09/10/2025
## Ý tưởng: Kết hợp đề xuất của Chủ dự án

---

## 🏗️ THIẾT KẾ MỚI

### Nguyên tắc:
1. ✅ **Phòng thuộc về Dự án** (không phải Tin đăng)
2. ✅ **1 phòng vật lý = 1 bản ghi** duy nhất
3. ✅ Tin đăng **chọn phòng từ danh sách** của dự án
4. ✅ Mỗi tin có thể có **giá/mô tả riêng** cho từng phòng

---

## 📋 SCHEMA CHI TIẾT

### Bảng 1: `phong` (Phòng Master - Thuộc Dự án)

```sql
CREATE TABLE `phong` (
  `PhongID` INT PRIMARY KEY AUTO_INCREMENT,
  `DuAnID` INT NOT NULL,
  `TenPhong` VARCHAR(100) NOT NULL,
  `TrangThai` ENUM('Trong','GiuCho','DaThue','DonDep') DEFAULT 'Trong',
  `GiaChuan` DECIMAL(15,2) DEFAULT NULL COMMENT 'Giá chuẩn của phòng (có thể override ở tin đăng)',
  `DienTichChuan` DECIMAL(5,2) DEFAULT NULL COMMENT 'Diện tích chuẩn',
  `MoTaPhong` TEXT DEFAULT NULL COMMENT 'Mô tả đặc điểm phòng: tầng, hướng, view...',
  `HinhAnhPhong` VARCHAR(500) DEFAULT NULL COMMENT 'Hình đại diện phòng (1 hình duy nhất)',
  `TaoLuc` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `CapNhatLuc` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`DuAnID`) REFERENCES `duan`(`DuAnID`) ON DELETE CASCADE,
  UNIQUE KEY `unique_phong_duan` (`DuAnID`, `TenPhong`) -- 1 dự án không có 2 phòng cùng tên
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_phong_duan_trangthai ON phong(DuAnID, TrangThai);
```

**Giải thích:**
- `PhongID` = ID phòng toàn hệ thống
- `DuAnID` = Phòng thuộc dự án nào
- `TrangThai` = Trạng thái **duy nhất** của phòng (đồng bộ tự động)
- `GiaChuan`, `DienTichChuan` = Giá/diện tích mặc định (có thể override)

---

### Bảng 2: `phong_tindang` (Mapping - Metadata cho từng tin)

```sql
CREATE TABLE `phong_tindang` (
  `PhongTinDangID` INT PRIMARY KEY AUTO_INCREMENT,
  `PhongID` INT NOT NULL,
  `TinDangID` INT NOT NULL,
  `GiaTinDang` DECIMAL(15,2) DEFAULT NULL COMMENT 'Giá riêng cho tin này (NULL = dùng GiaChuan)',
  `DienTichTinDang` DECIMAL(5,2) DEFAULT NULL COMMENT 'Diện tích riêng (NULL = dùng DienTichChuan)',
  `MoTaTinDang` TEXT DEFAULT NULL COMMENT 'Mô tả riêng cho tin đăng này (VD: "Ưu đãi SV")',
  `HinhAnhTinDang` VARCHAR(500) DEFAULT NULL COMMENT 'Hình riêng cho tin này (NULL = dùng HinhAnhPhong)',
  `ThuTuHienThi` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị phòng trong tin đăng',
  `TaoLuc` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`PhongID`) REFERENCES `phong`(`PhongID`) ON DELETE CASCADE,
  FOREIGN KEY (`TinDangID`) REFERENCES `tindang`(`TinDangID`) ON DELETE CASCADE,
  UNIQUE KEY `unique_phong_per_tindang` (`TinDangID`, `PhongID`) -- 1 tin không thêm 1 phòng 2 lần
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_phong_tindang_phong ON phong_tindang(PhongID);
CREATE INDEX idx_phong_tindang_tindang ON phong_tindang(TinDangID);
```

**Giải thích:**
- Bảng mapping nhiều-nhiều giữa `phong` và `tindang`
- Lưu metadata riêng cho từng tin: giá, mô tả, hình ảnh khác nhau
- `NULL` = sử dụng giá trị chuẩn từ bảng `phong`

---

### Bảng 3: `coc` (Cập nhật FK)

```sql
ALTER TABLE `coc`
DROP FOREIGN KEY `coc_ibfk_phong`, -- Xóa FK cũ nếu có
DROP COLUMN `PhongID`,              -- Xóa cột cũ
ADD COLUMN `PhongID` INT NOT NULL COMMENT 'FK đến bảng phong (master)',
ADD FOREIGN KEY (`PhongID`) REFERENCES `phong`(`PhongID`);
```

---

### Bảng 4: `cuochen` (Cập nhật FK)

```sql
ALTER TABLE `cuochen`
DROP FOREIGN KEY `cuochen_ibfk_phong`,
DROP COLUMN `PhongID`,
ADD COLUMN `PhongID` INT NOT NULL COMMENT 'FK đến bảng phong (master)',
ADD FOREIGN KEY (`PhongID`) REFERENCES `phong`(`PhongID`);
```

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1️⃣ Chủ dự án tạo/quản lý phòng

```
┌─────────────────────────────────────────────────────────┐
│  Trang: "Quản lý phòng" (Thuộc Dự án)                    │
├─────────────────────────────────────────────────────────┤
│  Dự án: "Nhà trọ Minh Tâm"                               │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Danh sách phòng:                                 │    │
│  │                                                   │    │
│  │  [🟢 Trống]  Phòng 101 - 3.000.000đ - 25m²       │    │
│  │  [🔴 Giữ chỗ] Phòng 102 - 3.500.000đ - 30m²      │    │
│  │  [🟡 Đã thuê] Phòng 103 - 4.000.000đ - 35m²      │    │
│  │                                                   │    │
│  │  [+ Thêm phòng mới]                              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

INSERT INTO phong (DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan)
VALUES (14, '104', 'Trong', 3200000, 28);
```

---

### 2️⃣ Chủ dự án tạo tin đăng

```
┌─────────────────────────────────────────────────────────┐
│  Trang: "Tạo tin đăng mới"                               │
├─────────────────────────────────────────────────────────┤
│  Bước 1: Thông tin chung                                 │
│  - Tiêu đề: "Phòng cho nữ thuê - Ưu đãi SV"             │
│  - Mô tả: ...                                            │
│                                                           │
│  Bước 2: Chọn phòng                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ☑️ Phòng 101 - 3.000.000đ (Giá: _2.800.000_ đ)  │    │
│  │    └─ Ưu đãi: "Giảm 200k cho SV"                │    │
│  │                                                   │    │
│  │ ☑️ Phòng 102 - 3.500.000đ (Giá: _3.500.000_ đ)  │    │
│  │    └─ Giữ nguyên giá                             │    │
│  │                                                   │    │
│  │ ☐ Phòng 103 - Đã thuê (Không thể chọn)          │    │
│  │                                                   │    │
│  │ [+ Thêm phòng mới vào dự án]                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

-- Tạo tin đăng
INSERT INTO tindang (DuAnID, TieuDe, ...) VALUES (14, '...', ...);
-- TinDangID = 10

-- Thêm phòng vào tin
INSERT INTO phong_tindang (PhongID, TinDangID, GiaTinDang, MoTaTinDang)
VALUES 
  (1, 10, 2800000, 'Ưu đãi sinh viên - Giảm 200k'),
  (2, 10, NULL, NULL); -- NULL = dùng giá chuẩn 3.500.000đ
```

---

### 3️⃣ Khách hàng xem tin đăng

```
┌─────────────────────────────────────────────────────────┐
│  Chi tiết tin đăng: "Phòng cho nữ thuê - Ưu đãi SV"     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  🏠 Phòng 101                                            │
│     💰 Giá: 2.800.000đ/tháng (Giảm 200k cho SV!)        │
│     📐 Diện tích: 25m²                                   │
│     🟢 Trạng thái: Còn trống                             │
│     [Đặt cọc ngay]                                       │
│                                                           │
│  🏠 Phòng 102                                            │
│     💰 Giá: 3.500.000đ/tháng                             │
│     📐 Diện tích: 30m²                                   │
│     🔴 Trạng thái: Đang giữ chỗ                          │
│     [Hẹn xem phòng]                                      │
└─────────────────────────────────────────────────────────┘

-- Query để hiển thị
SELECT 
  p.PhongID,
  p.TenPhong,
  COALESCE(pt.GiaTinDang, p.GiaChuan) as GiaHienThi,
  COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTichHienThi,
  p.TrangThai,
  COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTaHienThi
FROM phong_tindang pt
JOIN phong p ON pt.PhongID = p.PhongID
WHERE pt.TinDangID = 10
ORDER BY pt.ThuTuHienThi;
```

---

### 4️⃣ Khách hàng đặt cọc

```
┌─────────────────────────────────────────────────────────┐
│  Khách A đặt cọc Phòng 101                               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  UPDATE phong SET TrangThai='GiuCho' WHERE PhongID=1    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TẤT CẢ tin đăng có Phòng 101 tự động cập nhật!         │
│                                                           │
│  Tin đăng A: Phòng 101 - 🔴 Giữ chỗ ✅                   │
│  Tin đăng B: Phòng 101 - 🔴 Giữ chỗ ✅ (Tự động!)       │
└─────────────────────────────────────────────────────────┘
```

**Không cần trigger nữa!** Vì chỉ có 1 bản ghi `phong.PhongID=1` → Đồng bộ tự nhiên! 🎉

---

## 📊 SO SÁNH THIẾT KẾ CŨ VS MỚI

### Thiết kế CŨ (Hiện tại):

```
DUAN (ID=14)
  └─ TINDANG (ID=4)
       └─ PHONG (ID=10, Tên=101, TrangThai=GiuCho)
  └─ TINDANG (ID=8)
       └─ PHONG (ID=15, Tên=101, TrangThai=Trong) ❌ BUG!
```

**Vấn đề:** 2 bản ghi riêng biệt → Không đồng bộ!

---

### Thiết kế MỚI (Đề xuất):

```
DUAN (ID=14)
  └─ PHONG (ID=1, Tên=101, TrangThai=GiuCho) ✅ DUY NHẤT
       ├─ phong_tindang (TinDangID=4, Gia=2.800.000) → Tin A
       └─ phong_tindang (TinDangID=8, Gia=3.000.000) → Tin B
```

**Lợi ích:** 
- ✅ 1 phòng = 1 bản ghi → Tự động đồng bộ
- ✅ Mỗi tin có giá/mô tả riêng
- ✅ Không cần trigger phức tạp

---

## 🔄 MIGRATION SCRIPT

### Bước 1: Tạo bảng mới

```sql
-- File: migrations/2025_10_09_redesign_phong_schema.sql

START TRANSACTION;

-- 1. Rename bảng cũ
RENAME TABLE phong TO phong_old;

-- 2. Tạo bảng phong mới (gắn với dự án)
CREATE TABLE phong (
  PhongID INT PRIMARY KEY AUTO_INCREMENT,
  DuAnID INT NOT NULL,
  TenPhong VARCHAR(100) NOT NULL,
  TrangThai ENUM('Trong','GiuCho','DaThue','DonDep') DEFAULT 'Trong',
  GiaChuan DECIMAL(15,2) DEFAULT NULL,
  DienTichChuan DECIMAL(5,2) DEFAULT NULL,
  MoTaPhong TEXT DEFAULT NULL,
  HinhAnhPhong VARCHAR(500) DEFAULT NULL,
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (DuAnID) REFERENCES duan(DuAnID) ON DELETE CASCADE,
  UNIQUE KEY unique_phong_duan (DuAnID, TenPhong)
);

-- 3. Tạo bảng mapping
CREATE TABLE phong_tindang (
  PhongTinDangID INT PRIMARY KEY AUTO_INCREMENT,
  PhongID INT NOT NULL,
  TinDangID INT NOT NULL,
  GiaTinDang DECIMAL(15,2) DEFAULT NULL,
  DienTichTinDang DECIMAL(5,2) DEFAULT NULL,
  MoTaTinDang TEXT DEFAULT NULL,
  HinhAnhTinDang VARCHAR(500) DEFAULT NULL,
  ThuTuHienThi INT DEFAULT 0,
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PhongID) REFERENCES phong(PhongID) ON DELETE CASCADE,
  FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID) ON DELETE CASCADE,
  UNIQUE KEY unique_phong_per_tindang (TinDangID, PhongID)
);

COMMIT;
```

---

### Bước 2: Migrate dữ liệu

```sql
START TRANSACTION;

-- 1. Tạo phòng master (loại bỏ duplicate)
INSERT INTO phong (DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan, HinhAnhPhong)
SELECT DISTINCT
  td.DuAnID,
  po.TenPhong,
  -- Lấy trạng thái "ưu tiên" nhất
  (SELECT p2.TrangThai 
   FROM phong_old p2
   JOIN tindang t2 ON p2.TinDangID = t2.TinDangID
   WHERE t2.DuAnID = td.DuAnID 
     AND p2.TenPhong = po.TenPhong
   ORDER BY 
     CASE p2.TrangThai
       WHEN 'DaThue' THEN 1
       WHEN 'GiuCho' THEN 2
       WHEN 'DonDep' THEN 3
       WHEN 'Trong' THEN 4
     END
   LIMIT 1
  ) as TrangThai,
  po.Gia as GiaChuan,
  po.DienTich as DienTichChuan,
  po.URL as HinhAnhPhong
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
ON DUPLICATE KEY UPDATE 
  TrangThai = VALUES(TrangThai);

-- 2. Tạo mapping phong_tindang
INSERT INTO phong_tindang (PhongID, TinDangID, GiaTinDang, DienTichTinDang, HinhAnhTinDang)
SELECT 
  p.PhongID,
  po.TinDangID,
  po.Gia,
  po.DienTich,
  po.URL
FROM phong_old po
JOIN tindang td ON po.TinDangID = td.TinDangID
JOIN phong p ON p.DuAnID = td.DuAnID AND p.TenPhong = po.TenPhong;

-- 3. Cập nhật bảng coc
ALTER TABLE coc DROP FOREIGN KEY IF EXISTS coc_ibfk_1;
UPDATE coc c
JOIN phong_old po ON c.PhongID = po.PhongID
JOIN tindang td ON c.TinDangID = td.TinDangID
JOIN phong p ON p.DuAnID = td.DuAnID AND p.TenPhong = po.TenPhong
SET c.PhongID = p.PhongID;

ALTER TABLE coc
ADD FOREIGN KEY (PhongID) REFERENCES phong(PhongID);

-- 4. Cập nhật bảng cuochen
ALTER TABLE cuochen DROP FOREIGN KEY IF EXISTS cuochen_ibfk_1;
UPDATE cuochen ch
JOIN phong_old po ON ch.PhongID = po.PhongID
JOIN tindang td ON po.TinDangID = td.TinDangID
JOIN phong p ON p.DuAnID = td.DuAnID AND p.TenPhong = po.TenPhong
SET ch.PhongID = p.PhongID;

ALTER TABLE cuochen
ADD FOREIGN KEY (PhongID) REFERENCES phong(PhongID);

COMMIT;

-- 5. Dọn bảng cũ (đã thực hiện trong migration final)
DROP TABLE IF EXISTS phong_old;
```

---

## 🎯 API CHANGES

### API Endpoint Mới

#### 1. Lấy danh sách phòng của dự án

```javascript
GET /api/chu-du-an/du-an/:duAnID/phong

Response:
{
  "success": true,
  "data": [
    {
      "PhongID": 1,
      "TenPhong": "101",
      "TrangThai": "Trong",
      "GiaChuan": 3000000,
      "DienTichChuan": 25,
      "soTinDangDangDung": 2  // Đang xuất hiện ở 2 tin đăng
    },
    {
      "PhongID": 2,
      "TenPhong": "102",
      "TrangThai": "GiuCho",
      "GiaChuan": 3500000,
      "DienTichChuan": 30,
      "soTinDangDangDung": 1
    }
  ]
}
```

---

#### 2. Thêm phòng cho tin đăng (chọn từ danh sách)

```javascript
POST /api/chu-du-an/tin-dang/:tinDangID/phong

Body:
{
  "danhSachPhong": [
    {
      "PhongID": 1,  // Chọn từ danh sách phòng có sẵn
      "GiaTinDang": 2800000,  // Override giá (optional)
      "MoTaTinDang": "Ưu đãi SV"
    },
    {
      "PhongID": 2,
      "GiaTinDang": null  // Dùng giá chuẩn
    }
  ]
}

Response:
{
  "success": true,
  "message": "Đã thêm 2 phòng vào tin đăng"
}
```

---

#### 3. Tạo phòng mới + Thêm vào tin đăng

```javascript
POST /api/chu-du-an/du-an/:duAnID/phong

Body:
{
  "TenPhong": "104",
  "GiaChuan": 3200000,
  "DienTichChuan": 28,
  "themVaoTinDang": 10  // Optional: Thêm luôn vào TinDangID=10
}

Response:
{
  "success": true,
  "data": {
    "PhongID": 3,
    "TenPhong": "104"
  }
}
```

---

## ✅ ƯU ĐIỂM THIẾT KẾ MỚI

| Tính năng | Thiết kế cũ | Thiết kế mới |
|-----------|-------------|--------------|
| **Đồng bộ trạng thái** | ❌ Cần trigger | ✅ Tự động (1 record) |
| **Giá khác nhau/tin** | ❌ Không hỗ trợ | ✅ Có (GiaTinDang) |
| **Quản lý tập trung** | ❌ Phân tán | ✅ 1 chỗ cho 1 dự án |
| **Reuse phòng** | ❌ Phải tạo lại | ✅ Chọn từ danh sách |
| **Data consistency** | ❌ Dễ sai lệch | ✅ Luôn nhất quán |
| **Query performance** | 🟡 Trung bình | ✅ Tốt hơn (ít JOIN) |
| **UX** | 🟡 Phải nhập lại | ✅ Chọn + Override |

---

## 🚀 KẾ HOẠCH TRIỂN KHAI

### Phase 1: Chuẩn bị (1 tuần)
- [ ] Review thiết kế với team
- [ ] Test migration script trên staging
- [ ] Chuẩn bị rollback plan
- [ ] Update API documentation

### Phase 2: Backend (2 tuần)
- [ ] Tạo models mới
- [ ] Update controllers
- [ ] Viết API endpoints mới
- [ ] Unit tests

### Phase 3: Frontend (2 tuần)
- [ ] UI "Quản lý phòng" (CRUD)
- [ ] Update form "Tạo tin đăng" (chọn phòng)
- [ ] Update "Chi tiết tin đăng"

### Phase 4: Migration (1 tuần)
- [ ] Backup production
- [ ] Chạy migration (giờ thấp điểm)
- [ ] Verify data
- [ ] Monitor

---

**Tổng thời gian:** ~6 tuần  
**Breaking changes:** ❌ Không (API cũ vẫn hoạt động trong transition period)

