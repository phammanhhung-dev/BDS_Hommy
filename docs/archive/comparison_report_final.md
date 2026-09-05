# BÁO CÁO SO SÁNH DỮ LIỆU TIN ĐĂNG - TRẠNG THÁI DADUYET
**Tin đăng ID:** 31 | **DuAnID:** 35 | **PhongID:** 19
**Thời gian:** 2026-08-21 16:26:46
**Flow:** Giả lập KYC → Tạo dự án/phòng → POST tin đăng → POST gửi duyệt → PUT operator duyệt

---

## 1. DỮ LIỆU CHỦ DỰ ÁN (GET /api/chu-du-an/tin-dang/31)

```json
{
    "TinDangID": 31,
    "DuAnID": 35,
    "KhuVucID": 1,
    "ChinhSachCocID": 1,
    "TieuDe": "Phòng tro test final flow",
    "URL": "\"[]\"",
    "MoTa": "Test tin dang qua đúng quy trình cuối cùng",
    "TienIch": "\"Dieu hoa, Wifi\"",
    "GiaDien": "2000.00",
    "GiaNuoc": "30000.00",
    "GiaDichVu": "100000.00",
    "MoTaGiaDichVu": "Test description",
    "ThongTinMoRong": null,
    "Gia": "3500000.00",
    "DienTich": "25.00",
    "TrangThai": "DaDuyet",
    "LyDoTuChoi": null,
    "TaoLuc": "2026-08-21T16:26:25.000Z",
    "CapNhatLuc": "2026-08-21T16:26:46.000Z",
    "DuyetLuc": "2026-08-21T16:26:46.000Z",
    "ChuDuAnID": 7,
    "TenDuAn": "Dự án Test Final",
    "DiaChiDuAn": "123 Đường Test, Quận 1, TP.HCM",
    "ViDo": null,
    "KinhDo": null,
    "YeuCauPheDuyetChu": 0,
    "TenKhuVuc": "Phường Phúc Xá (Quận Ba Đình)",
    "TenTinh": "Thành phố Hà Nội",
    "TenChinhSach": "Mặc định",
    "MoTaChinhSach": "Policy mặc định hệ thống",
    "TenChuDuAn": "Lam Ngoc Giang",
    "EmailChuDuAn": "khachang@gmail.com",
    "TongSoPhong": 1,
    "SoPhongTrong": 1,
    "DanhSachPhong": [
        {
            "PhongID": 19,
            "TenPhong": "Phòng Test Final",
            "TrangThai": "Trong",
            "Gia": "3500000.00",
            "DienTich": "25.00",
            "URL": null,
            "MoTa": null,
            "GiaChuan": "3500000.00",
            "DienTichChuan": "25.00",
            "GiaOverride": "3500000.00",
            "DienTichOverride": "25.00",
            "ThuTuHienThi": 0,
            "TaoLuc": "2026-08-21T16:25:46.000Z",
            "CapNhatLuc": "2026-08-21T16:25:46.000Z"
        }
    ]
}
```

---

## 2. DỮ LIỆU CÔNG KHAI (GET /api/public/tin-dang/31)

```json
{
    "TinDangID": 31,
    "DuAnID": 35,
    "KhuVucID": 1,
    "ChinhSachCocID": 1,
    "TieuDe": "Phòng tro test final flow",
    "URL": "\"[]\"",
    "MoTa": "Test tin dang qua đúng quy trình cuối cùng",
    "TienIch": "\"Dieu hoa, Wifi\"",
    "GiaDien": "2000.00",
    "GiaNuoc": "30000.00",
    "GiaDichVu": "100000.00",
    "MoTaGiaDichVu": "Test description",
    "TrangThai": "DaDuyet",
    "TaoLuc": "2026-08-21T16:26:25.000Z",
    "CapNhatLuc": "2026-08-21T16:26:46.000Z",
    "DuyetLuc": "2026-08-21T16:26:46.000Z",
    "TenDuAn": "Dự án Test Final",
    "DiaChi": "123 Đường Test, Quận 1, TP.HCM",
    "YeuCauPheDuyetChu": 0,
    "ViDo": null,
    "KinhDo": null,
    "SoThangCocToiThieu": 1,
    "TenKhuVuc": "Phường Phúc Xá (Quận Ba Đình)",
    "TenTinh": "Thành phố Hà Nội",
    "TongSoPhong": 1,
    "DanhSachPhong": [
        {
            "PhongID": 19,
            "TenPhong": "Phòng Test Final",
            "TrangThaiPhong": "Trong",
            "Gia": "3500000.00",
            "DienTich": "25.00",
            "AnhPhong": null
        }
    ]
}
```

---

## 3. BẢNG SO SÁNH CHI TIẾT

| Trường dữ liệu | Chủ dự án | Public | Trạng thái | Ghi chú |
|----------------|-----------|--------|------------|---------|
| **Tin đăng** | | | | |
| TinDangID | 31 | 31 | ✅ KHỚP | |
| DuAnID | 35 | 35 | ✅ KHỚP | |
| KhuVucID | 1 | 1 | ✅ KHỚP | |
| ChinhSachCocID | 1 | 1 | ✅ KHỚP | |
| TieuDe | "Phòng tro test final flow" | "Phòng tro test final flow" | ✅ KHỚP | |
| URL | "\"[]\"" | "\"[]\"" | ✅ KHỚP | |
| MoTa | "Test tin dang qua đúng quy trình cuối cùng" | "Test tin dang qua đúng quy trình cuối cùng" | ✅ KHỚP | |
| TienIch | "\"Dieu hoa, Wifi\"" | "\"Dieu hoa, Wifi\"" | ✅ KHỚP | |
| GiaDien | "2000.00" | "2000.00" | ✅ KHỚP | |
| GiaNuoc | "30000.00" | "30000.00" | ✅ KHỚP | |
| GiaDichVu | "100000.00" | "100000.00" | ✅ KHỚP | |
| MoTaGiaDichVu | "Test description" | "Test description" | ✅ KHỚP | |
| ThongTinMoRong | null | - | ❌ BỎ | Public không có field này |
| **Dữ liệu cốt lõi tin đăng** | | | | |
| Gia | "3500000.00" | ❌ KHÔNG CÓ | ⚠️ LỆCH | **VẤN ĐỀ TỒN TẠI** - Public không trả Gia cấp tin đăng |
| DienTich | "25.00" | ❌ KHÔNG CÓ | ⚠️ LỆCH | **VẤN ĐỀ TỒN TẠI** - Public không trả DienTich cấp tin đăng |
| TrangThai | "DaDuyet" | "DaDuyet" | ✅ KHỚP | |
| LyDoTuChoi | null | - | ❌ BỎ | Public không có field này |
| TaoLuc | "2026-08-21T16:26:25.000Z" | "2026-08-21T16:26:25.000Z" | ✅ KHỚP | |
| CapNhatLuc | "2026-08-21T16:26:46.000Z" | "2026-08-21T16:26:46.000Z" | ✅ KHỚP | |
| DuyetLuc | "2026-08-21T16:26:46.000Z" | "2026-08-21T16:26:46.000Z" | ✅ KHỚP | |
| **Thông tin chủ dự án** | | | | |
| ChuDuAnID | 7 | - | ❌ BỎ | Public không hiển thị ID chủ |
| TenChuDuAn | "Lam Ngoc Giang" | - | ❌ BỎ | Public không hiển thị tên chủ |
| EmailChuDuAn | "khachang@gmail.com" | - | ❌ BỎ | Public không hiển thị email chủ |
| **Thông tin dự án** | | | | |
| TenDuAn | "Dự án Test Final" | "Dự án Test Final" | ✅ KHỚP | |
| DiaChiDuAn / DiaChi | "123 Đường Test, Quận 1, TP.HCM" | "123 Đường Test, Quận 1, TP.HCM" | ✅ KHỚP | Field khác tên nhưng cùng giá trị |
| ViDo | null | null | ✅ KHỚP | |
| KinhDo | null | null | ✅ KHỚP | |
| YeuCauPheDuyetChu | 0 | 0 | ✅ KHỚP | |
| **Thông tin khu vực** | | | | |
| TenKhuVuc | "Phường Phúc Xá (Quận Ba Đình)" | "Phường Phúc Xá (Quận Ba Đình)" | ✅ KHỚP | |
| TenTinh | "Thành phố Hà Nội" | "Thành phố Hà Nội" | ✅ KHỚP | |
| **Thông tin chính sách** | | | | |
| TenChinhSach | "Mặc định" | - | ❌ BỎ | Public không hiển thị tên chính sách |
| MoTaChinhSach | "Policy mặc định hệ thống" | - | ❌ BỎ | Public không hiển thị mô tả chính sách |
| SoThangCocToiThieu | - | 1 | ⚠️ LỆCH | Public có thêm field này, ChuDuAn không |
| **Thống kê phòng** | | | | |
| TongSoPhong | 1 | 1 | ✅ KHỚP | |
| SoPhongTrong | 1 | - | ❌ BỎ | Public không hiển thị số phòng trống |
| **Danh sách phòng** | | | | |
| PhongID | 19 | 19 | ✅ KHỚP | |
| TenPhong | "Phòng Test Final" | "Phòng Test Final" | ✅ KHỚP | |
| TrangThai / TrangThaiPhong | "Trong" | "Trong" | ✅ KHỚP | Field khác tên nhưng cùng giá trị |
| Gia | "3500000.00" | "3500000.00" | ✅ KHỚP | |
| DienTich | "25.00" | "25.00" | ✅ KHỚP | |
| URL | null | - | ❌ BỎ | Public không có URL phòng |
| MoTa | null | - | ❌ BỎ | Public không có mô tả phòng |
| GiaChuan | "3500000.00" | - | ❌ BỎ | Public không hiển thị giá chuẩn |
| DienTichChuan | "25.00" | - | ❌ BỎ | Public không hiển thị diện tích chuẩn |
| GiaOverride | "3500000.00" | - | ❌ BỎ | Public không hiển thị giá override |
| DienTichOverride | "25.00" | - | ❌ BỎ | Public không hiển thị diện tích override |
| ThuTuHienThi | 0 | - | ❌ BỎ | Public không hiển thị thứ tự |
| TaoLuc | "2026-08-21T16:25:46.000Z" | - | ❌ BỎ | Public không hiển thị thời gian tạo phòng |
| CapNhatLuc | "2026-08-21T16:25:46.000Z" | - | ❌ BỎ | Public không hiển thị thời gian cập nhật phòng |
| AnhPhong | - | null | ⚠️ LỆCH | Public có thêm field này, ChuDuAn không |

---

## 4. KẾT LUẬN

### ✅ DỮ LIỆU KHỚP (CORE DATA)
- Tất cả thông tin cốt lõi về tin đăng (TieuDe, MoTa, TienIch, GiaDien, GiaNuoc, GiaDichVu, MoTaGiaDichVu) **KHỚP**
- Thông tin dự án (TenDuAn, DiaChi) **KHỚP**
- Thông tin khu vực (TenKhuVuc, TenTinh) **KHỚP**
- Thông tin phòng (TenPhong, TrangThai, Gia, DienTich) **KHỚP**
- Thông tin thời gian (TaoLuc, CapNhatLuc, DuyetLuc) **KHỚP**

### ⚠️ VẤN ĐỀ TỒN TẠI (CONFIRMED)
1. **Thiếu Gia cấp tin đăng ở Public API**
   - ChuDuAn trả: `Gia: "3500000.00"`
   - Public trả: **KHÔNG CÓ** field `Gia` ở cấp tin đăng
   - **Đây là vấn đề đã phát hiện lần đầu** và **VẪN TỒN TẠI** với dữ liệu qua đúng luồng thật
   - Chỉ có `Gia` ở cấp từng phòng trong `DanhSachPhong`

2. **Thiếu DienTich cấp tin đăng ở Public API**
   - ChuDuAn trả: `DienTich: "25.00"`
   - Public trả: **KHÔNG CÓ** field `DienTich` ở cấp tin đăng
   - **Đây là vấn đề đã phát hiện lần đầu** và **VẪN TỒN TẠI** với dữ liệu qua đúng luồng thật
   - Chỉ có `DienTich` ở cấp từng phòng trong `DanhSachPhong`

### ❌ DỮ LIỆU BỎ (EXPECTED - BẢO MẬT)
- Thông tin chủ dự án (ChuDuAnID, TenChuDuAn, EmailChuDuAn) - **Đúng, cần bảo mật**
- Thông tin chi tiết phòng (GiaChuan, DienTichChuan, GiaOverride, DienTichOverride, ThuTuHienThi, TaoLuc, CapNhatLuc) - **Đúng, không cần hiển thị cho khách**
- Thông tin chính sách (TenChinhSach, MoTaChinhSach) - **Có thể cần hiển thị cho khách?**
- Thống kê phòng trống (SoPhongTrong) - **Có thể cần hiển thị cho khách?**

### 📊 TỔNG KẾT
- **Core data MATCH:** ✅ Chính xác, không bị hỏng qua đúng luồng
- **Vấn đề Gia/DienTich cấp tin đăng:** ⚠️ **TỒN TẠI** - cần xem xét thêm field này vào Public API
- **Data loss:** ❌ KHÔNG CÓ - dữ liệu không bị mất, chỉ là Public API được thiết kế trả ít field hơn (đúng theo security concern)