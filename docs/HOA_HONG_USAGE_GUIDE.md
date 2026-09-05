# 📘 Hướng dẫn sử dụng Hoa hồng (Commission)

**Ngày:** 06/11/2025  
**Phiên bản:** 2.0 (Sau refactor)

---

## 🎯 Tổng quan

Hoa hồng là **CẤU HÌNH** của dự án, không phải trạng thái riêng cần duyệt. Operator chỉ kiểm tra và **banned dự án** nếu cấu hình hoa hồng vi phạm.

---

## 📊 Cấu trúc dữ liệu

### Bảng `duan`

```sql
BangHoaHong         DECIMAL(5,2)  -- % hoa hồng (0-100, ví dụ: 5.00 = 5%)
SoThangCocToiThieu  INT(11)       -- Số tháng cọc tối thiểu để áp dụng hoa hồng
```

**Ví dụ:**
- `BangHoaHong = 5.00` → 5% hoa hồng
- `SoThangCocToiThieu = 3` → Chỉ áp dụng cho hợp đồng cọc ≥ 3 tháng

---

## 🔄 Luồng nghiệp vụ

### 1. Chủ dự án tạo/cập nhật dự án với hoa hồng

**API:** `PUT /api/chu-du-an/du-an/:id`

```javascript
// Request
{
  "BangHoaHong": 5.00,           // % hoa hồng
  "SoThangCocToiThieu": 3        // Điều kiện áp dụng
}

// Response
{
  "success": true,
  "message": "Cập nhật dự án thành công",
  "data": {
    "DuAnID": 123,
    "BangHoaHong": 5.00,
    "SoThangCocToiThieu": 3,
    "TrangThai": "HoatDong"
  }
}
```

**Model:** `DuAnModel.capNhatDuAn()`

```javascript
const DuAnModel = require('./models/DuAnModel');

await DuAnModel.capNhatDuAn(duAnId, chuDuAnId, {
  BangHoaHong: 5.00,
  SoThangCocToiThieu: 3
});
```

**Validation:**
- ✅ `BangHoaHong`: 0-100 (%)
- ✅ `SoThangCocToiThieu`: >= 1 hoặc NULL
- ✅ NULL được chấp nhận (không áp dụng hoa hồng)

---

### 2. Operator kiểm tra hoa hồng

**API:** `GET /api/operator/du-an/:id`

```javascript
// Response
{
  "success": true,
  "data": {
    "DuAnID": 123,
    "TenDuAn": "Nhà trọ ABC",
    "BangHoaHong": 15.00,         // ⚠️ Cao hơn quy định (max 10%)
    "SoThangCocToiThieu": 3,
    "TrangThai": "HoatDong"
  }
}
```

**Operator thấy hoa hồng vi phạm:**
- Hoa hồng 15% > Quy định tối đa 10%

---

### 3. Operator banned dự án (nếu vi phạm)

**API:** `POST /api/operator/du-an/:id/ngung-hoat-dong`

```javascript
// Request
{
  "lyDo": "Hoa hồng 15% vượt quy định tối đa 10%"
}

// Response
{
  "success": true,
  "message": "Ngưng hoạt động dự án thành công",
  "data": {
    "DuAnID": 123,
    "TrangThai": "NgungHoatDong",
    "LyDoNgungHoatDong": "Hoa hồng 15% vượt quy định tối đa 10%",
    "NguoiNgungHoatDongID": 456,  // Operator ID
    "NgungHoatDongLuc": "2025-11-06 10:00:00"
  }
}
```

**Model:** `DuAnOperatorModel.ngungHoatDongDuAn()`

```javascript
const DuAnOperatorModel = require('./models/DuAnOperatorModel');

await DuAnOperatorModel.ngungHoatDongDuAn(
  duAnId,
  operatorId,
  'Hoa hồng 15% vượt quy định tối đa 10%'
);
```

---

### 4. Chủ dự án sửa hoa hồng và yêu cầu mở lại

**API:** `PUT /api/chu-du-an/du-an/:id` (sửa hoa hồng)

```javascript
// Request
{
  "BangHoaHong": 8.00  // Giảm xuống 8%
}
```

**API:** `POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai`

```javascript
// Request
{
  "noiDung": "Đã điều chỉnh hoa hồng từ 15% xuống 8% theo quy định"
}

// Response
{
  "success": true,
  "message": "Gửi yêu cầu mở lại dự án thành công",
  "data": {
    "DuAnID": 123,
    "TrangThai": "NgungHoatDong",      // Vẫn banned
    "YeuCauMoLai": "DangXuLy",         // Chờ Operator duyệt
    "NoiDungGiaiTrinh": "Đã điều chỉnh hoa hồng từ 15% xuống 8%",
    "ThoiGianGuiYeuCau": "2025-11-06 11:00:00"
  }
}
```

---

### 5. Operator duyệt yêu cầu mở lại

**API:** `POST /api/operator/du-an/:id/xu-ly-yeu-cau-mo-lai`

#### ✅ Chấp nhận:

```javascript
// Request
{
  "chapNhan": true,
  "ghiChu": "Hoa hồng đã phù hợp với quy định"
}

// Response
{
  "success": true,
  "message": "Đã chấp nhận yêu cầu mở lại dự án",
  "data": {
    "DuAnID": 123,
    "TrangThai": "HoatDong",           // ✅ Active lại
    "BangHoaHong": 8.00,
    "YeuCauMoLai": "ChapNhan",
    "NguoiXuLyYeuCauID": 456,
    "ThoiGianXuLyYeuCau": "2025-11-06 11:30:00"
  }
}
```

#### ❌ Từ chối:

```javascript
// Request
{
  "chapNhan": false,
  "lyDo": "Hoa hồng 8% vẫn cao hơn mức khuyến nghị 5%"
}

// Response
{
  "success": true,
  "message": "Đã từ chối yêu cầu mở lại dự án",
  "data": {
    "DuAnID": 123,
    "TrangThai": "NgungHoatDong",      // ❌ Vẫn banned
    "YeuCauMoLai": "TuChoi",
    "LyDoTuChoiMoLai": "Hoa hồng 8% vẫn cao hơn mức khuyến nghị 5%",
    "NguoiXuLyYeuCauID": 456,
    "ThoiGianXuLyYeuCau": "2025-11-06 11:30:00"
  }
}
```

**Model:** `DuAnOperatorModel.xuLyYeuCauMoLai()`

```javascript
const DuAnOperatorModel = require('./models/DuAnOperatorModel');

// Chấp nhận
await DuAnOperatorModel.xuLyYeuCauMoLai(
  duAnId,
  operatorId,
  true,  // chấp nhận
  'Hoa hồng đã phù hợp với quy định'
);

// Từ chối
await DuAnOperatorModel.xuLyYeuCauMoLai(
  duAnId,
  operatorId,
  false,  // từ chối
  'Hoa hồng 8% vẫn cao hơn mức khuyến nghị 5%'
);
```

---

## 💻 Ví dụ Frontend

### Form cấu hình hoa hồng (Chủ dự án)

```jsx
// client/src/components/ChuDuAn/FormHoaHong.jsx

import { useState } from 'react';

export default function FormHoaHong({ duAn, onUpdate }) {
  const [bangHoaHong, setBangHoaHong] = useState(duAn.BangHoaHong || '');
  const [soThangCoc, setSoThangCoc] = useState(duAn.SoThangCocToiThieu || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      BangHoaHong: bangHoaHong ? parseFloat(bangHoaHong) : null,
      SoThangCocToiThieu: soThangCoc ? parseInt(soThangCoc) : null
    };

    await onUpdate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="form-hoa-hong">
      <div className="form-hoa-hong__field">
        <label>Bảng hoa hồng (%):</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={bangHoaHong}
          onChange={(e) => setBangHoaHong(e.target.value)}
          placeholder="Ví dụ: 5.00"
        />
        <small>Từ 0-100%. Quy định tối đa: 10%</small>
      </div>

      <div className="form-hoa-hong__field">
        <label>Số tháng cọc tối thiểu:</label>
        <input
          type="number"
          min="1"
          value={soThangCoc}
          onChange={(e) => setSoThangCoc(e.target.value)}
          placeholder="Ví dụ: 3"
        />
        <small>Chỉ áp dụng hoa hồng cho hợp đồng cọc ≥ số tháng này</small>
      </div>

      <button type="submit">Cập nhật</button>
    </form>
  );
}
```

---

## 🔍 Query Examples

### Lấy danh sách dự án có hoa hồng cao

```sql
SELECT 
  DuAnID,
  TenDuAn,
  BangHoaHong,
  SoThangCocToiThieu,
  TrangThai
FROM duan
WHERE BangHoaHong > 10  -- Vượt quy định
  AND TrangThai = 'HoatDong'
ORDER BY BangHoaHong DESC;
```

### Lấy danh sách yêu cầu mở lại do hoa hồng

```sql
SELECT 
  d.DuAnID,
  d.TenDuAn,
  d.BangHoaHong,
  d.LyDoNgungHoatDong,
  d.NoiDungGiaiTrinh,
  d.YeuCauMoLai
FROM duan d
WHERE d.TrangThai = 'NgungHoatDong'
  AND d.LyDoNgungHoatDong LIKE '%hoa hồng%'
  AND d.YeuCauMoLai = 'DangXuLy'
ORDER BY d.ThoiGianGuiYeuCau DESC;
```

---

## 🚨 Lưu ý quan trọng

### ❌ KHÔNG còn sử dụng:

- ~~`TrangThaiDuyetHoaHong`~~ - Đã xóa
- ~~`NguoiDuyetHoaHongID`~~ - Đã xóa
- ~~`ThoiGianDuyetHoaHong`~~ - Đã xóa
- ~~`LyDoTuChoiHoaHong`~~ - Đã xóa
- ~~`GhiChuHoaHong`~~ - Đã xóa
- ~~`duyetHoaHongDuAn()`~~ - Method đã xóa
- ~~`tuChoiHoaHongDuAn()`~~ - Method đã xóa

### ✅ Sử dụng thay thế:

| Trường hợp | Method | Trường sử dụng |
|------------|--------|----------------|
| Hoa hồng vi phạm | `ngungHoatDongDuAn()` | `TrangThai`, `LyDoNgungHoatDong`, `NguoiNgungHoatDongID` |
| Duyệt sau khi sửa | `xuLyYeuCauMoLai()` | `YeuCauMoLai`, `NguoiXuLyYeuCauID`, `ThoiGianXuLyYeuCau` |

---

## 📝 Migration History

### Phiên bản 1.0 (SAI - Đã rollback)
- ❌ Thêm 7 columns: TrangThaiDuyetHoaHong, NguoiDuyetHoaHongID, etc
- ❌ Tạo luồng duyệt hoa hồng riêng

### Phiên bản 2.0 (ĐÚNG - Hiện tại)
- ✅ Chỉ giữ 2 columns: BangHoaHong, SoThangCocToiThieu
- ✅ Tận dụng lại TrangThai, NguoiNgungHoatDongID, YeuCauMoLai
- ✅ Hoa hồng là cấu hình, không phải trạng thái riêng

---

## 🔗 Tham khảo

- `docs/HOA_HONG_SCHEMA_ANALYSIS.md` - Phân tích chi tiết schema
- `docs/use-cases-v1.2.md` - Use cases hệ thống
- `migrations/ROLLBACK_hoa_hong_migration.sql` - Migration rollback

---

**Cập nhật cuối:** 06/11/2025  
**Người viết:** AI Assistant

