# Công thức Hoa hồng V2 - Hướng dẫn Implementation

## 📋 Tổng quan

Document này mô tả công thức tính hoa hồng mới được triển khai trong hệ thống Daphongtro.

### Công thức cơ bản:

```
Số tiền cọc = Số tháng cọc × Giá phòng (+ Phí nạp ví nếu có)

Doanh thu công ty = Số tiền cọc × % Hoa hồng dự án
                   (% phụ thuộc vào số tháng cọc, từ BangHoaHong JSON)

Thu nhập NVBH = Doanh thu công ty × Tỷ lệ hoa hồng nhân viên (thường 50%)

Thu nhập NVDH = Doanh thu công ty × Tỷ lệ hoa hồng quản lý (thường 10%)
```

## 📊 Ví dụ tính toán

### Dữ liệu đầu vào:
- Giá phòng: 5,000,000 VNĐ/tháng
- Số tháng cọc: 6 tháng
- BangHoaHong: `[{"soThang":6,"tyLe":30},{"soThang":12,"tyLe":70}]`
- TyLeHoaHong NVBH: 50%
- TyLeHoaHong NVDH: 10%

### Tính toán:

| Bước | Công thức | Kết quả |
|------|-----------|---------|
| 1. Số tiền cọc | 6 × 5,000,000 | **30,000,000 VNĐ** |
| 2. % Hoa hồng dự án | 6 tháng → 30% | **30%** |
| 3. Doanh thu công ty | 30,000,000 × 30% | **9,000,000 VNĐ** |
| 4. Thu nhập NVBH | 9,000,000 × 50% | **4,500,000 VNĐ** |
| 5. Thu nhập NVDH | 9,000,000 × 10% | **900,000 VNĐ** |

## 🗄️ Database Schema

### Bảng `duan`
```sql
BangHoaHong text DEFAULT NULL COMMENT 'Bảng hoa hồng (JSON array)'
SoThangCocToiThieu int(11) DEFAULT NULL
```

**Format BangHoaHong:**
```json
[
  {"soThang": 6, "tyLe": 30},
  {"soThang": 12, "tyLe": 70}
]
```

### Bảng `hosonhanvien`
```sql
TyLeHoaHong decimal(5,2) DEFAULT NULL -- 50.00 cho NVBH, 10.00 cho NVDH
QuanLyID int(11) DEFAULT NULL -- Link NVBH đến NVDH quản lý
```

### Bảng `hopdong`
```sql
SoTienCoc decimal(12,2) DEFAULT NULL
GiaThueCuoiCung decimal(12,2) DEFAULT NULL
DuAnID int(11) NOT NULL
PhongID int(11) DEFAULT NULL
```

## 🛠️ Backend Implementation

### File mới tạo:
1. **`server/services/HoaHongService.js`** - Service tính hoa hồng tập trung

### Files cập nhật:
1. **`server/services/NhanVienBanHangService.js`** - Import và sử dụng HoaHongService
2. **`server/routes/nhanVienDieuHanhRoutes.js`** - Routes API cho NVDH (MỚI)

### Các method chính trong HoaHongService:

| Method | Mô tả |
|--------|-------|
| `layTyLeHoaHongTheoBangCauHinh()` | Parse BangHoaHong JSON và trả về % theo số tháng |
| `tinhHoaHongHopDong()` | Tính doanh thu công ty cho 1 hợp đồng |
| `tinhThuNhapNVBH()` | Tính thu nhập NVBH cho 1 hợp đồng |
| `tinhThuNhapNVDH()` | Tính thu nhập NVDH cho 1 hợp đồng |
| `baoCaoThuNhapNVBH()` | Báo cáo tổng hợp cho NVBH theo khoảng thời gian |
| `baoCaoThuNhapNVDH()` | Báo cáo tổng hợp cho NVDH (từ các NVBH dưới quyền) |
| `tinhPreviewHoaHong()` | Preview tính toán (không lưu DB) |

## 🔗 API Endpoints

### NVBH (Nhân viên Bán hàng)
```
GET /api/nhan-vien-ban-hang/bao-cao-thu-nhap?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tyLeHoaHong": 50,
    "soGiaoDich": 5,
    "tongGiaTri": 9000000,      // Doanh thu công ty
    "tongHoaHong": 4500000,     // Thu nhập NVBH
    "hoaHongTrungBinh": 900000,
    "tongCuocHen": 10,
    "cuocHenHoanThanh": 5,
    "tyLeChuyenDoi": 50,
    "chiTietHopDong": [
      {
        "hopDongId": 1,
        "tenDuAn": "Chung cư ABC",
        "soPhong": "101",
        "soTienCoc": 30000000,
        "soThangCocThucTe": 6,
        "tyLeHoaHongDuAn": 30,
        "doanhThuCongTy": 9000000,
        "thuNhapNVBH": 4500000
      }
    ],
    "congThuc": {
      "moTa": "Doanh thu công ty = Số tiền cọc × % hoa hồng dự án...",
      "tyLeApDung": "50%"
    }
  }
}
```

### NVDH (Nhân viên Điều hành) - API MỚI

⚠️ **QUAN TRỌNG**: Cần đăng ký route vào `server/index.js`:

```javascript
// Thêm vào đầu file (imports)
const nhanVienDieuHanhRoutes = require('./routes/nhanVienDieuHanhRoutes');

// Thêm sau các routes khác
app.use('/api/nhan-vien-dieu-hanh', nhanVienDieuHanhRoutes);
```

**Endpoints:**
```
GET /api/nhan-vien-dieu-hanh/bao-cao-thu-nhap?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD
GET /api/nhan-vien-dieu-hanh/danh-sach-nvbh
GET /api/nhan-vien-dieu-hanh/nvbh/:nhanVienId/thu-nhap?tuNgay=...&denNgay=...
GET /api/nhan-vien-dieu-hanh/hop-dong/:hopDongId/hoa-hong
GET /api/nhan-vien-dieu-hanh/preview-hoa-hong?soTienCoc=...&soThangCoc=...
```

## 🎨 Frontend Implementation

### Files cập nhật:
1. **`client/src/pages/NhanVienBanHang/BaoCaoThuNhap.jsx`** - Giao diện báo cáo
2. **`client/src/pages/NhanVienBanHang/BaoCaoThuNhap.css`** - Styles mới

### Tính năng mới:
- ✅ Hiển thị công thức tính hoa hồng (collapsible)
- ✅ Bảng chi tiết theo hợp đồng (thay vì theo cuộc hẹn)
- ✅ Metric cards cập nhật (Doanh thu công ty, Thu nhập của bạn)
- ✅ Export Excel với format mới

## ⚠️ Lưu ý quan trọng

### 1. Về "Phí nạp ví"
Trường `PhiNapVi` **KHÔNG TỒN TẠI** trong database schema hiện tại. 

**Giải pháp:**
- Công thức hiện tại bỏ qua phí nạp ví
- Nếu cần thêm, phải tạo migration thêm cột vào bảng phù hợp

### 2. Logic tìm % hoa hồng
```javascript
// Sắp xếp giảm dần theo soThang
// Tìm mức đầu tiên mà soThangCoc >= soThang
const sortedBang = [...bangHoaHongArray].sort((a, b) => b.soThang - a.soThang);

for (const muc of sortedBang) {
  if (soThangCoc >= muc.soThang) {
    return muc.tyLe;
  }
}
```

Ví dụ với BangHoaHong = `[{soThang:6, tyLe:30}, {soThang:12, tyLe:70}]`:
- 5 tháng cọc → 0% (không đủ 6 tháng)
- 6 tháng cọc → 30%
- 8 tháng cọc → 30%
- 12 tháng cọc → 70%
- 15 tháng cọc → 70%

### 3. Relationship NVBH - NVDH
```
hosonhanvien.QuanLyID → Người quản lý (NVDH)

NVDH (NguoiDungID=9) quản lý NVBH (NguoiDungID=8)
→ hosonhanvien WHERE NguoiDungID=8 có QuanLyID=9
```

## 📝 TODO (Nếu cần mở rộng)

- [ ] Thêm field `PhiNapVi` vào database nếu cần
- [ ] Tạo frontend dashboard riêng cho NVDH
- [ ] Thêm filter theo dự án trong báo cáo
- [ ] Thêm chart thu nhập theo tháng

## 📚 Files liên quan

```
server/
├── services/
│   ├── HoaHongService.js          ← MỚI
│   └── NhanVienBanHangService.js  ← CẬP NHẬT
├── routes/
│   └── nhanVienDieuHanhRoutes.js  ← MỚI

client/src/pages/NhanVienBanHang/
├── BaoCaoThuNhap.jsx              ← CẬP NHẬT
└── BaoCaoThuNhap.css              ← CẬP NHẬT

docs/
└── HOA_HONG_FORMULA_V2.md         ← TÀI LIỆU NÀY
```

---

**Tác giả:** GitHub Copilot  
**Ngày:** 2025  
**Version:** 2.0.0
