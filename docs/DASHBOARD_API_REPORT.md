# Bước 2b - Dashboard API Report

## Tổng quan

Đã hoàn thành việc implement và test 6 endpoint Dashboard sử dụng real-time SQL query trực tiếp trên các bảng transaction. Không sử dụng bảng `thongketindang`.

**Cấu trúc:**
- Model: `server/models/DashboardModel.js`
- Controller: `server/controllers/DashboardController.js`
- Routes: `server/routes/dashboardRoutes.js`
- Mount point: `/api/operator/dashboard/`

**Authentication:**
- Login endpoint: `POST /api/login`
- Password trong database sử dụng MD5 hash (không phải bcrypt)
- Tài khoản test: `hethong@gmail.com` / `123456` (MD5: `e10adc3949ba59abbe56e057f20f883e`)
- Role: `Quản trị viên Hệ thống` (VaiTroID: 5)

---

## 1. GET /api/operator/dashboard/stats

### SQL Query

```sql
SELECT 
  -- Thống kê tin đăng theo trạng thái
  COUNT(CASE WHEN td.TrangThai = 'Nhap' THEN 1 END) as Nhap,
  COUNT(CASE WHEN td.TrangThai = 'ChoDuyet' THEN 1 END) as ChoDuyet,
  COUNT(CASE WHEN td.TrangThai = 'DaDuyet' THEN 1 END) as DaDuyet,
  COUNT(CASE WHEN td.TrangThai = 'DaDang' THEN 1 END) as DaDang,
  COUNT(CASE WHEN td.TrangThai = 'TamNgung' THEN 1 END) as TamNgung,
  COUNT(CASE WHEN td.TrangThai = 'TuChoi' THEN 1 END) as TuChoi,
  COUNT(CASE WHEN td.TrangThai = 'LuuTru' THEN 1 END) as LuuTru,
  COUNT(*) as TongSoTinDang,
  
  -- Cuộc hẹn trong 7 ngày tới
  COUNT(DISTINCT CASE 
    WHEN ch.ThoiGianHen >= CURDATE() 
    AND ch.ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    THEN ch.CuocHenID 
  END) as CuocHen7Ngay,
  
  -- Doanh thu tháng này (chỉ tính giao dịch đã thanh toán)
  COALESCE(SUM(CASE 
    WHEN gd.TrangThai = 'DaThanhToan' 
    AND MONTH(gd.ThoiGian) = MONTH(CURDATE()) 
    AND YEAR(gd.ThoiGian) = YEAR(CURDATE())
    THEN gd.SoTien 
    ELSE 0 
  END), 0) as DoanhThuThangNay
FROM tindang td
LEFT JOIN cuochen ch ON td.TinDangID = ch.TinDangID
LEFT JOIN giaodich gd ON td.TinDangID = gd.TinDangLienQuanID
```

### JSON Response

```json
{
  "success": true,
  "data": {
    "Nhap": 0,
    "ChoDuyet": 1,
    "DaDuyet": 0,
    "DaDang": 2,
    "TamNgung": 0,
    "TuChoi": 0,
    "LuuTru": 0,
    "TongSoTinDang": 3,
    "CuocHen7Ngay": 0,
    "DoanhThuThangNay": "0.00"
  }
}
```

**Ghi chú:**
- Tổng 3 tin đăng (đã seed trong migration step 2a)
- 2 tin đăng `DaDang`, 1 tin đăng `ChoDuyet`
- 0 cuộc hẹn (đã xóa orphan trong step 2a)
- 0 doanh thu (bảng `giaodich` trống)

---

## 2. GET /api/operator/dashboard/revenue-chart

### SQL Query

```sql
SELECT 
  DATE_FORMAT(gd.ThoiGian, '%Y-%m') as Thang,
  COALESCE(SUM(CASE 
    WHEN gd.TrangThai = 'DaThanhToan' 
    THEN gd.SoTien 
    ELSE 0 
  END), 0) as DoanhThu
FROM giaodich gd
WHERE gd.ThoiGian >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(gd.ThoiGian, '%Y-%m')
ORDER BY Thang ASC
```

### JSON Response

```json
{
  "success": true,
  "data": []
}
```

**Ghi chú:**
- Mảng rỗng vì bảng `giaodich` không có dữ liệu
- Khi có dữ liệu, sẽ trả về 6 tháng gần nhất với doanh thu theo tháng

---

## 3. GET /api/operator/dashboard/occupancy

### SQL Query

```sql
SELECT 
  d.DuAnID,
  d.TenDuAn,
  COUNT(*) as TongPhong,
  COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) as PhongDaThue,
  ROUND(
    (COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) * 100.0) / 
    NULLIF(COUNT(*), 0), 
    2
  ) as TyLeLapDay
FROM duan d
LEFT JOIN phong p ON d.DuAnID = p.DuAnID
GROUP BY d.DuAnID, d.TenDuAn
ORDER BY TyLeLapDay DESC
```

### JSON Response

```json
{
  "success": true,
  "data": [
    {
      "DuAnID": 17,
      "TenDuAn": "Nhà Trọ Hoành Hợp",
      "TongPhong": 2,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 10,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 30,
      "TenDuAn": "Bán nhà",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 4,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 24,
      "TenDuAn": "Nhà trọ Mạnh Hùng",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 11,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 5,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 25,
      "TenDuAn": "Bán căn hộ Bcons NewSky",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 12,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 6,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 26,
      "TenDuAn": "Nhà trọ An Phú Đông",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 14,
      "TenDuAn": "Nhà tró Minh Tâm",
      "TongPhong": 3,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 7,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 27,
      "TenDuAn": "Nhà mặt phố",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 1,
      "TenDuAn": "Dự án Test - Chung cư ABC",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 15,
      "TenDuAn": "Nhà Trọ Cheap Avocado",
      "TongPhong": 2,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 8,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 28,
      "TenDuAn": "Nhà của Hùng",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 2,
      "TenDuAn": "Dự án Test - Nhà trọ XYZ",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 16,
      "TenDuAn": "Nhà trọ Hải Hương",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 9,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 29,
      "TenDuAn": "Hùng nhà đât",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    },
    {
      "DuAnID": 3,
      "TenDuAn": "Dream House 1",
      "TongPhong": 1,
      "PhongDaThue": 0,
      "TyLeLapDay": "0.00"
    }
  ]
}
```

**Ghi chú:**
- 24 dự án có phòng
- Dự án "Nhà tró Minh Tâm" (DuAnID: 14) có 3 phòng (được dùng để seed tin đăng)
- Tất cả phòng hiện tại chưa có phòng nào được thuê (`TrangThai = 'DaThue'`)

---

## 4. GET /api/operator/dashboard/status-distribution

### SQL Query

```sql
SELECT 
  TrangThai,
  COUNT(*) as SoLuong
FROM tindang
GROUP BY TrangThai
ORDER BY 
  CASE TrangThai
    WHEN 'DaDang' THEN 1
    WHEN 'ChoDuyet' THEN 2
    WHEN 'DaDuyet' THEN 3
    WHEN 'Nhap' THEN 4
    WHEN 'TamNgung' THEN 5
    WHEN 'TuChoi' THEN 6
    WHEN 'LuuTru' THEN 7
  END
```

### JSON Response

```json
{
  "success": true,
  "data": [
    {
      "TrangThai": "DaDang",
      "SoLuong": 2
    },
    {
      "TrangThai": "ChoDuyet",
      "SoLuong": 1
    }
  ]
}
```

**Ghi chú:**
- Chỉ hiển thị các trạng thái có dữ liệu
- Sắp xếp theo thứ tự ưu tiên: DaDang > ChoDuyet > DaDuyet > Nhap > TamNgung > TuChoi > LuuTru

---

## 5. GET /api/operator/dashboard/recent-listings?limit=5

### SQL Query

```sql
SELECT 
  td.TinDangID,
  td.TieuDe,
  td.TrangThai,
  td.TaoLuc,
  td.DuAnID,
  d.TenDuAn
FROM tindang td
LEFT JOIN duan d ON td.DuAnID = d.DuAnID
ORDER BY td.TaoLuc DESC
LIMIT ?
```

### JSON Response

```json
{
  "success": true,
  "data": [
    {
      "TinDangID": 17,
      "TieuDe": "Phòng tró giá rẻ cho sinh viên, gần trường đại học",
      "TrangThai": "DaDang",
      "TaoLuc": "2026-08-16T16:34:13.000Z",
      "DuAnID": 14,
      "TenDuAn": "Nhà tró Minh Tâm"
    },
    {
      "TinDangID": 18,
      "TieuDe": "Phòng tró cao cấp, đầy đủ tiện nghi",
      "TrangThai": "DaDang",
      "TaoLuc": "2026-08-16T16:34:13.000Z",
      "DuAnID": 14,
      "TenDuAn": "Nhà tró Minh Tâm"
    },
    {
      "TinDangID": 19,
      "TieuDe": "Phòng tró cho nữ thuê, an ninh tuyệt đối",
      "TrangThai": "ChoDuyet",
      "TaoLuc": "2026-08-16T16:34:13.000Z",
      "DuAnID": 14,
      "TenDuAn": "Nhà tró Minh Tâm"
    }
  ]
}
```

**Ghi chú:**
- Trả về tối đa `limit` tin đăng mới nhất
- Sắp xếp theo `TaoLuc DESC`
- 3 tin đăng đều được tạo cùng thời điểm trong migration step 2a

---

## 6. GET /api/operator/dashboard/upcoming-appointments

### SQL Query

```sql
SELECT 
  ch.CuocHenID,
  ch.ThoiGianHen,
  ch.TrangThai as TrangThaiCuocHen,
  ch.PheDuyetChuDuAn,
  td.TinDangID,
  td.TieuDe as TieuDeTinDang,
  td.TrangThai as TrangThaiTinDang,
  d.TenDuAn,
  p.TenPhong,
  nd.TenDayDu as TenKhachHang,
  nv.TenDayDu as TenNhanVien
FROM cuochen ch
INNER JOIN tindang td ON ch.TinDangID = td.TinDangID
LEFT JOIN duan d ON td.DuAnID = d.DuAnID
LEFT JOIN phong p ON ch.PhongID = p.PhongID
LEFT JOIN nguoidung nd ON ch.KhachHangID = nd.NguoiDungID
LEFT JOIN nguoidung nv ON ch.NhanVienBanHangID = nv.NguoiDungID
WHERE ch.ThoiGianHen >= CURDATE() 
AND ch.ThoiGianHen <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY ch.ThoiGianHen ASC
LIMIT 10
```

### JSON Response

```json
{
  "success": true,
  "data": []
}
```

**Ghi chú:**
- Mảng rỗng vì không có cuộc hẹn nào trong 7 ngày tới
- Trong step 2a đã xóa các orphan `cuochen`

---

## Database Index Analysis

### Current Indexes

**tindang:**
- PRIMARY: `TinDangID`
- `DuAnID`
- `KhuVucID`
- `DuyetBoiNhanVienID`
- `fk_tindang_chinhsachcoc`: `ChinhSachCocID`
- `idx_tindang_duan_trangthai`: `DuAnID`, `TrangThai`
- `idx_tindang_taoluc`: `TaoLuc`
- `idx_tindang_duan_trangthai_taoluc`: `DuAnID`, `TrangThai`, `TaoLuc`

**cuochen:**
- PRIMARY: `CuocHenID`
- `KhachHangID`
- `NhanVienBanHangID`
- `idx_cuochen_khachhang`: `KhachHangID`
- `idx_cuochen_nv`: `NhanVienBanHangID`
- `idx_cuochen_thoigian`: `ThoiGianHen`
- `idx_cuochen_pheduyet`: `PheDuyetChuDuAn`
- `idx_cuochen_thoigianpheduyet`: `ThoiGianPheDuyet`
- `idx_cuochen_phong_trangthai`: `PhongID`, `TrangThai`
- `idx_cuochen_thoigianhen_trangthai`: `ThoiGianHen`, `TrangThai`
- `idx_cuochen_taoluc`: `TaoLuc`
- `TinDangID`

**giaodich:**
- PRIMARY: `GiaoDichID`
- `KhoaDinhDanh` (unique)
- `uq_giaodich_khoadinhdanh`: `KhoaDinhDanh`
- `ViID`
- `TinDangLienQuanID`
- `fk_gd_thamchieu`: `GiaoDichThamChieuID`

**phong:**
- PRIMARY: `PhongID`
- `unique_phong_duan`: `DuAnID`, `TenPhong` (unique)
- `idx_phong_duan_trangthai`: `DuAnID`, `TrangThai`

### Index Recommendations

**Các index hiện tại đã bao phủ tốt các query Dashboard:**

✅ `tindang.TrangThai` - Đã có trong `idx_tindang_duan_trangthai` và `idx_tindang_duan_trangthai_taoluc`
✅ `tindang.DuAnID` - Đã có nhiều index
✅ `tindang.TaoLuc` - Đã có `idx_tindang_taoluc` và composite index
✅ `cuochen.TinDangID` - Đã có
✅ `cuochen.ThoiGianHen` - Đã có `idx_cuochen_thoigian` và composite indexes
✅ `giaodich.TinDangLienQuanID` - Đã có
✅ `giaodich.TrangThai` - **CHƯA CÓ INDEX RIÊNG**
✅ `giaodich.ThoiGian` - **CHƯA CÓ INDEX RIÊNG**
✅ `phong.DuAnID` - Đã có
✅ `phong.TrangThai` - Đã có trong `idx_phong_duan_trangthai`

**Đề xuất thêm index cho `giaodich`:**

```sql
-- Index cho filter theo TrangThai trong revenue queries
CREATE INDEX idx_giaodich_trangthai ON giaodich(TrangThai);

-- Index cho filter theo ThoiGian trong revenue chart
CREATE INDEX idx_giaodich_thoigian ON giaodich(ThoiGian);

-- Composite index cho query doanh thu theo tháng
CREATE INDEX idx_giaodich_trangthai_thoigian ON giaodich(TrangThai, ThoiGian);
```

**Lý do:**
- `giaodich.TrangThai` được dùng trong WHERE clause của cả stats và revenue-chart
- `giaodich.ThoiGian` được dùng trong WHERE clause và GROUP BY của revenue-chart
- Composite index sẽ tối ưu cho query filter cả 2 cột

---

## Files Changed/Added

**Added:**
- `server/models/DashboardModel.js` - SQL queries cho 6 endpoints
- `server/controllers/DashboardController.js` - Controller xử lý logic
- `server/routes/dashboardRoutes.js` - Route definitions
- `server/test_dashboard_api.js` - Direct DB test script
- `server/test_dashboard_http.js` - HTTP test script
- `server/check_password.js` - Password diagnostic
- `server/check_indexes.js` - Index check script

**Modified:**
- `server/index.js` - Mount dashboard routes at `/api/operator/dashboard`

---

## Next Steps (Step 3)

Sau khi bạn xác nhận Step 2b hoàn thành, sẽ tiến hành:
1. Frontend integration - React Dashboard component
2. Socket.IO live updates
3. Wire Dashboard UI với 6 endpoints mới

**Trước khi bắt đầu Step 3, cần xác nhận:**
- [x] 6 Dashboard endpoints hoạt động đúng
- [x] SQL queries đã được test và trả về kết quả mong đợi
- [ ] Index recommendations có muốn áp dụng?
- [ ] Bắt đầu Step 3 (Frontend integration)
