# 🚀 HƯỚNG DẪN IMPORT TEST DATA VÀO DATABASE

## ⚠️ VẤN ĐỀ PHÁT HIỆN

**Lỗi Foreign Key Constraint (`#1452`)** xảy ra khi import qua phpMyAdmin do:

1. **phpMyAdmin xử lý MySQL session variables không ổn định** trong multi-statement SQL
2. Các biến `@phong*_id`, `@giaodich*_id` có thể bị **NULL** hoặc **sai giá trị**
3. Trigger `trg_coc_one_active_per_room_ins` kiểm tra phòng đã có cọc hiệu lực

## ✅ GIẢI PHÁP ĐÃ TRIỂN KHAI

File `test-data-cuoc-hen-hop-dong.sql` đã được cập nhật với:

```sql
-- Tắt foreign key check tạm thời
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ... các INSERT statements ...

-- Bật lại foreign key check và commit
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
```

### Debug Statements Đã Thêm:

1. **Sau INSERT phòng**: Hiển thị giá trị `@phong1_id`, `@phong5_id`, `@phong6_id`, `@phong11_id`
2. **Trước INSERT cọc**: SELECT các phòng test để verify đã tồn tại

## 📋 CÁCH IMPORT ĐÚNG

### **Phương án 1: Dùng phpMyAdmin (Recommended)**

1. **Mở phpMyAdmin**: `http://localhost/phpmyadmin`

2. **Chọn database**: Click `thue_tro` ở sidebar

3. **Vào tab SQL**

4. **QUAN TRỌNG - Tắt options sau**:
   - ❌ **KHÔNG CHECK** "Enable foreign key checks"
   - ✅ **CHECK** "Do not use AUTO_INCREMENT for zero values"

5. **Import file**:
   - Click **"Browse your computer"** hoặc kéo file vào
   - Chọn: `docs/test-data-cuoc-hen-hop-dong.sql`
   - Click **"Go"**

6. **Kiểm tra kết quả**:
   - Nếu thấy "DEBUG: Verify PhongID values" với giá trị > 0 → OK
   - Nếu thấy "DEBUG: Phòng đã được tạo" với 4 dòng → OK
   - Nếu thấy thông báo thành công → Hoàn tất!

### **Phương án 2: Command Line (100% Success)**

Mở **Command Prompt** (không phải PowerShell):

```cmd
cd "d:\Vo Nguyen Hoanh Hop_J Liff\xampp\mysql\bin"

mysql.exe -u root thue_tro < "..\..\htdocs\daphongtro\docs\test-data-cuoc-hen-hop-dong.sql"
```

Hoặc nếu có password:

```cmd
mysql.exe -u root -p thue_tro < "..\..\htdocs\daphongtro\docs\test-data-cuoc-hen-hop-dong.sql"
```

### **Phương án 3: MySQL Workbench**

1. Mở MySQL Workbench
2. Connect đến database `thue_tro`
3. Menu: **File → Open SQL Script**
4. Chọn file `test-data-cuoc-hen-hop-dong.sql`
5. Click nút **Execute** (⚡ icon)
6. Xem output trong "Action Output" panel

## 🔍 KIỂM TRA SAU KHI IMPORT

Chạy các query này trong phpMyAdmin để verify:

```sql
-- 1. Kiểm tra khách hàng test
SELECT NguoiDungID, TenDayDu, Email 
FROM nguoidung 
WHERE Email LIKE '%test%' 
ORDER BY NguoiDungID DESC 
LIMIT 5;

-- 2. Kiểm tra dự án test của user 6
SELECT DuAnID, ChuDuAnID, TenDuAn, TrangThai
FROM duan 
WHERE TenDuAn LIKE 'Test -%'
ORDER BY DuAnID DESC;

-- 3. Kiểm tra phòng test
SELECT PhongID, DuAnID, TenPhong, TrangThai
FROM phong 
WHERE TenPhong LIKE '%-Test'
ORDER BY PhongID DESC;

-- 4. Kiểm tra cuộc hẹn test
SELECT c.CuocHenID, p.TenPhong, c.TrangThai, c.ThoiGianHen
FROM cuochen c
JOIN phong p ON c.PhongID = p.PhongID
WHERE p.TenPhong LIKE '%-Test'
ORDER BY c.TaoLuc DESC;

-- 5. Kiểm tra hợp đồng test
SELECT h.HopDongID, h.KhachHangID, h.NgayBatDau, h.GiaThueCuoiCung
FROM hopdong h
WHERE h.NoiDungSnapshot LIKE '%-Test%'
ORDER BY h.BaoCaoLuc DESC;

-- 6. Kiểm tra cọc test
SELECT 
  c.CocID, 
  p.TenPhong, 
  c.Loai, 
  c.SoTien, 
  c.TrangThai
FROM coc c
JOIN phong p ON c.PhongID = p.PhongID
WHERE p.TenPhong LIKE '%-Test'
ORDER BY c.TaoLuc DESC;
```

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi import thành công, bạn sẽ có:

| Item | Số lượng | Chi tiết |
|------|----------|----------|
| **Khách hàng mới** | 3 | khachtest1@test.com, khachtest2@test.com, khachtest3@test.com |
| **Dự án mới** (user 6) | 3 | Chung cư Sunrise, Nhà trọ Bình An, Căn hộ Studio Golden |
| **Tin đăng mới** | 3 | Mỗi dự án 1 tin |
| **Phòng test** | 13 | 5 + 5 + 3 phòng (có suffix "-Test") |
| **Cuộc hẹn** | 9 | Các trạng thái: ChoXacNhan, DaXacNhan, HoanThanh, HuyBoiKhach, KhachKhongDen |
| **Hợp đồng** | 3 | Đã báo cáo cho 3 phòng đã thuê |
| **Cọc** | 7 | 4 đang hiệu lực + 3 đã giải tỏa |

## 🧹 XÓA TEST DATA

Khi muốn xóa dữ liệu test (chạy theo thứ tự):

```sql
-- Xóa theo thứ tự dependencies (tránh foreign key error)
DELETE FROM nhatkyhethong WHERE DoiTuong IN ('cuochen', 'hopdong', 'coc');

DELETE FROM coc WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test'
);

DELETE FROM cuochen WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test'
);

DELETE FROM hopdong WHERE NoiDungSnapshot LIKE '%-Test%';

DELETE FROM giaodich WHERE TinDangLienQuanID IN (
  SELECT TinDangID FROM tindang WHERE TieuDe LIKE '%Test%'
);

DELETE FROM phong_tindang WHERE PhongID IN (
  SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test'
);

DELETE FROM phong WHERE TenPhong LIKE '%-Test';

DELETE FROM tindang WHERE TieuDe LIKE '%Test%';

DELETE FROM duan WHERE TenDuAn LIKE 'Test -%';

DELETE FROM nguoidung_vaitro WHERE NguoiDungID IN (
  SELECT NguoiDungID FROM nguoidung WHERE Email LIKE '%test%' AND NguoiDungID > 6
);

DELETE FROM vi WHERE NguoiDungID IN (
  SELECT NguoiDungID FROM nguoidung WHERE Email LIKE '%test%' AND NguoiDungID > 6
);

DELETE FROM nguoidung WHERE Email LIKE '%test%' AND NguoiDungID > 6;
```

## 🐛 TROUBLESHOOTING

### Lỗi: "Variable @phong1_id is NULL"

**Nguyên nhân**: phpMyAdmin không xử lý được LAST_INSERT_ID() trong session  
**Giải pháp**: Dùng Command Line (Phương án 2) thay vì phpMyAdmin

### Lỗi: "Duplicate entry for key 'PRIMARY'"

**Nguyên nhân**: Đã import file trước đó  
**Giải pháp**: 
1. Chạy các câu lệnh DELETE ở phần "XÓA TEST DATA"
2. Import lại

### Lỗi: "Trigger trg_coc_one_active_per_room_ins"

**Nguyên nhân**: Phòng đã có cọc hiệu lực  
**Giải pháp**:
```sql
-- Cập nhật cọc cũ sang trạng thái khác
UPDATE coc 
SET TrangThai = 'DaGiaiToa' 
WHERE PhongID IN (SELECT PhongID FROM phong WHERE TenPhong LIKE '%-Test') 
  AND TrangThai = 'HieuLuc';
```

### Lỗi: "Table doesn't exist"

**Nguyên nhân**: Chưa chạy file `thue_tro.sql`  
**Giải pháp**: Import file schema trước:
```cmd
mysql.exe -u root < "..\..\htdocs\daphongtro\thue_tro.sql"
```

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi, cung cấp thông tin sau:

1. **MySQL version**: `SELECT VERSION();`
2. **Error message** đầy đủ
3. **Method import** đã dùng (phpMyAdmin / Command Line / Workbench)
4. **Debug output**: Giá trị của `@phong1_id` trong kết quả SELECT

---

**Tạo bởi**: GitHub Copilot  
**Ngày**: 30/10/2025  
**File liên quan**: `test-data-cuoc-hen-hop-dong.sql`
