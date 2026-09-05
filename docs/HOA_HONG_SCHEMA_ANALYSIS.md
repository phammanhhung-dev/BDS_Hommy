# 📊 Phân tích Schema Hoa hồng - Tối ưu hóa

**Ngày:** 06/11/2025  
**Vấn đề:** Migration thêm các cột dư thừa không cần thiết cho hoa hồng

---

## 🔍 Phân tích hiện trạng

### ❌ SAI LẦM TRONG MIGRATION GỐC

Migration `2025_11_06_add_hoa_hong_to_duan.sql` đã thêm 7 columns:

```sql
-- ❌ DƯ THỪA - Trùng với duyệt dự án
TrangThaiDuyetHoaHong  -- Trùng với TrangThai
NguoiDuyetHoaHongID    -- Trùng với NguoiNgungHoatDongID/NguoiXuLyYeuCauID
ThoiGianDuyetHoaHong   -- Trùng với NgungHoatDongLuc/ThoiGianXuLyYeuCau
LyDoTuChoiHoaHong      -- Trùng với LyDoNgungHoatDong/LyDoTuChoiMoLai
GhiChuHoaHong          -- Không cần thiết

-- ✅ CẦN THIẾT - Thuộc về nghiệp vụ hoa hồng
BangHoaHong            -- % hoa hồng
SoThangCocToiThieu     -- Điều kiện áp dụng hoa hồng
```

---

## 💡 GIẢI PHÁP TỐI ƯU

### 1. Cấu trúc bảng `duan` hiện tại (liên quan)

```sql
-- QUẢN LÝ DỰ ÁN
DuAnID                 INT(11)
TenDuAn                VARCHAR(255)
ChuDuAnID              INT(11)
ChinhSachCocID         INT(11)          -- Link đến bảng ChinhSachCoc
TaoLuc                 DATETIME
CapNhatLuc             DATETIME

-- TRẠNG THÁI & DUYỆT (Operator)
TrangThai              ENUM('HoatDong','NgungHoatDong','LuuTru')
LyDoNgungHoatDong      TEXT             -- Lý do banned
NguoiNgungHoatDongID   INT(11)          -- Operator banned dự án
NgungHoatDongLuc       DATETIME         -- Thời điểm banned

-- YÊU CẦU MỞ LẠI (sau khi banned)
YeuCauMoLai            ENUM('ChuaGui','DangXuLy','ChapNhan','TuChoi')
NoiDungGiaiTrinh       TEXT
ThoiGianGuiYeuCau      DATETIME
NguoiXuLyYeuCauID      INT(11)          -- Operator xử lý yêu cầu
ThoiGianXuLyYeuCau     DATETIME
LyDoTuChoiMoLai        TEXT

-- HOA HỒNG (GIỮ LẠI 2 CỘT)
BangHoaHong            DECIMAL(5,2)     -- % hoa hồng
SoThangCocToiThieu     INT(11)          -- Điều kiện áp dụng
```

---

## 🎯 LUỒNG NGHIỆP VỤ THỰC TẾ

### Scenario 1: Duyệt hoa hồng CÙNG với duyệt dự án

**User story:**
> Chủ dự án tạo dự án → Cấu hình hoa hồng (BangHoaHong, SoThangCocToiThieu) → Operator duyệt DỰ ÁN (bao gồm cả cấu hình hoa hồng) → Dự án HoatDong

**Flow:**

1. **Chủ dự án tạo dự án:**
   ```sql
   INSERT INTO duan (TenDuAn, ChuDuAnID, TrangThai, BangHoaHong, SoThangCocToiThieu)
   VALUES ('Nhà trọ ABC', 123, 'HoatDong', 5.00, 3);
   ```
   - `TrangThai = 'HoatDong'` mặc định (tự động active)
   - Operator chỉ **banned** khi vi phạm → `TrangThai = 'NgungHoatDong'`

2. **Operator kiểm tra dự án:**
   - Xem cấu hình hoa hồng: `BangHoaHong`, `SoThangCocToiThieu`
   - **KHÔNG CẦN duyệt riêng** vì:
     - Tin đăng đã có UC-OPER-01 (Duyệt tin đăng)
     - Dự án không có luồng "chờ duyệt" riêng

3. **Nếu cấu hình hoa hồng SAI:**
   - Operator **banned dự án** → `TrangThai = 'NgungHoatDong'`
   - `LyDoNgungHoatDong = "Hoa hồng 20% vượt quy định tối đa 10%"`
   - `NguoiNgungHoatDongID = 456` (Operator ID)
   - `NgungHoatDongLuc = NOW()`

4. **Chủ dự án sửa và yêu cầu mở lại:**
   - Sửa `BangHoaHong = 8.00` (trong phạm vi cho phép)
   - Gửi yêu cầu mở lại:
     ```sql
     UPDATE duan SET
       YeuCauMoLai = 'DangXuLy',
       NoiDungGiaiTrinh = 'Đã điều chỉnh hoa hồng theo quy định',
       ThoiGianGuiYeuCau = NOW()
     WHERE DuAnID = 789;
     ```

5. **Operator xử lý yêu cầu mở lại:**
   - Chấp nhận:
     ```sql
     UPDATE duan SET
       TrangThai = 'HoatDong',
       YeuCauMoLai = 'ChapNhan',
       NguoiXuLyYeuCauID = 456,
       ThoiGianXuLyYeuCau = NOW()
     WHERE DuAnID = 789;
     ```
   - Từ chối:
     ```sql
     UPDATE duan SET
       YeuCauMoLai = 'TuChoi',
       LyDoTuChoiMoLai = 'Hoa hồng vẫn cao hơn quy định',
       NguoiXuLyYeuCauID = 456,
       ThoiGianXuLyYeuCau = NOW()
     WHERE DuAnID = 789;
     ```

---

## 📋 SO SÁNH 2 CÁCH TIẾP CẬN

### ❌ Cách 1: Duyệt hoa hồng RIÊNG (Migration gốc - SAI)

| Trường | Công dụng | Vấn đề |
|--------|-----------|--------|
| `TrangThaiDuyetHoaHong` | Trạng thái duyệt hoa hồng riêng | ❌ Trùng với `TrangThai` của dự án |
| `NguoiDuyetHoaHongID` | Người duyệt hoa hồng | ❌ Trùng với `NguoiNgungHoatDongID`, `NguoiXuLyYeuCauID` |
| `ThoiGianDuyetHoaHong` | Thời điểm duyệt | ❌ Trùng với `NgungHoatDongLuc`, `ThoiGianXuLyYeuCau` |
| `LyDoTuChoiHoaHong` | Lý do từ chối hoa hồng | ❌ Trùng với `LyDoNgungHoatDong`, `LyDoTuChoiMoLai` |
| `GhiChuHoaHong` | Ghi chú của Operator | ❌ Không cần - dùng `NhatKyHeThong` |

**Vấn đề:**
- ❌ Duplicate logic: Có 2 luồng duyệt (dự án & hoa hồng)
- ❌ Inconsistency: `TrangThai = 'HoatDong'` nhưng `TrangThaiDuyetHoaHong = 'ChoDuyet'` → Dự án hoạt động hay không?
- ❌ Complexity: Code phải xử lý 2 trạng thái độc lập

---

### ✅ Cách 2: Duyệt hoa hồng CÙNG dự án (Tối ưu)

| Trường | Công dụng | Lý do cần |
|--------|-----------|-----------|
| `BangHoaHong` | % hoa hồng | ✅ Thuộc cấu hình dự án |
| `SoThangCocToiThieu` | Điều kiện áp dụng | ✅ Thuộc cấu hình dự án |
| `TrangThai` | Trạng thái dự án | ✅ Đã có - Dùng chung cho cả hoa hồng |
| `NguoiNgungHoatDongID` | Người banned | ✅ Đã có - Dùng khi banned do hoa hồng sai |
| `LyDoNgungHoatDong` | Lý do banned | ✅ Đã có - Ghi rõ lý do liên quan hoa hồng |

**Ưu điểm:**
- ✅ Single source of truth: `TrangThai` duy nhất
- ✅ Reuse existing fields: Không tạo columns mới không cần thiết
- ✅ Simpler logic: 1 luồng duyệt thay vì 2
- ✅ Consistent: Dự án `NgungHoatDong` = Tất cả tin đăng + hoa hồng đều bị ảnh hưởng

---

## 🔄 MAPPING GIỮA 2 CÁCH

| Nghiệp vụ | Cách 1 (SAI) | Cách 2 (ĐÚNG) |
|-----------|--------------|---------------|
| Dự án hoạt động, hoa hồng OK | `TrangThai=HoatDong`, `TrangThaiDuyetHoaHong=DaDuyet` | `TrangThai=HoatDong` |
| Dự án hoạt động, hoa hồng chờ duyệt | `TrangThai=HoatDong`, `TrangThaiDuyetHoaHong=ChoDuyet` | `TrangThai=HoatDong` (Operator chỉ kiểm tra, không chặn) |
| Hoa hồng vi phạm → banned | `TrangThaiDuyetHoaHong=TuChoi`, `LyDoTuChoiHoaHong=...` | `TrangThai=NgungHoatDong`, `LyDoNgungHoatDong="Hoa hồng vi phạm: ..."` |
| Chủ dự án sửa và yêu cầu mở lại | (Không có) | `YeuCauMoLai=DangXuLy`, `NoiDungGiaiTrinh=...` |
| Operator duyệt mở lại | `TrangThaiDuyetHoaHong=DaDuyet`, `NguoiDuyetHoaHongID=...` | `TrangThai=HoatDong`, `YeuCauMoLai=ChapNhan`, `NguoiXuLyYeuCauID=...` |

---

## 🚀 HÀNH ĐỘNG

### 1. Rollback migration sai

```bash
cd "D:\Vo Nguyen Hoanh Hop_J Liff\xampp\htdocs\daphongtro"
mysql -u root thue_tro < migrations/ROLLBACK_hoa_hong_migration.sql
```

### 2. Cấu trúc tối ưu (SAU KHI ROLLBACK)

```sql
-- ✅ Chỉ giữ lại 2 cột liên quan hoa hồng
BangHoaHong            DECIMAL(5,2)    -- % hoa hồng
SoThangCocToiThieu     INT(11)         -- Điều kiện áp dụng

-- ✅ Dùng lại các cột có sẵn
TrangThai              ENUM(...)       -- Trạng thái duy nhất
NguoiNgungHoatDongID   INT(11)         -- Operator xử lý (banned)
LyDoNgungHoatDong      TEXT            -- Lý do (có thể về hoa hồng)
YeuCauMoLai            ENUM(...)       -- Luồng yêu cầu mở lại
NguoiXuLyYeuCauID      INT(11)         -- Operator duyệt mở lại
```

### 3. Cập nhật Model/Controller

**DuAnModel.js:**
- ✅ `capNhatDuAn()`: Thêm validation cho `BangHoaHong`, `SoThangCocToiThieu`
- ❌ Xóa: `duyetHoaHong()`, `tuChoiHoaHong()` → Không cần

**DuAnOperatorModel.js:**
- ❌ Xóa: `duyetHoaHongDuAn()`, `tuChoiHoaHongDuAn()`
- ✅ Giữ: `ngungHoatDongDuAn(lyDo)` - Dùng khi banned do hoa hồng vi phạm
- ✅ Giữ: `xuLyYeuCauMoLai()` - Dùng khi chủ dự án sửa hoa hồng và yêu cầu mở lại

---

## 📝 CHECKLIST REFACTOR

- [ ] 1. Rollback migration: Xóa 5 cột dư thừa
- [ ] 2. Giữ lại 2 cột: `BangHoaHong`, `SoThangCocToiThieu`
- [ ] 3. Cập nhật `DuAnModel.js`: Validation hoa hồng trong `capNhatDuAn()`
- [ ] 4. Xóa methods dư thừa: `duyetHoaHongDuAn()`, `tuChoiHoaHongDuAn()`
- [ ] 5. Tận dụng lại: `ngungHoatDongDuAn()` cho banned do hoa hồng sai
- [ ] 6. Tận dụng lại: `xuLyYeuCauMoLai()` cho duyệt sau khi sửa
- [ ] 7. Cập nhật Frontend: Hiển thị hoa hồng trong form dự án
- [ ] 8. Audit logging: Ghi rõ lý do banned liên quan hoa hồng

---

**Kết luận:** Hoa hồng là **cấu hình của dự án**, không phải **trạng thái riêng cần duyệt**. Operator chỉ cần **kiểm tra và banned** khi vi phạm, giống như cách xử lý các vi phạm khác của dự án.

