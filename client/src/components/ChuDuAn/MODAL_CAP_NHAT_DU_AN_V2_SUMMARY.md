# Modal Cập Nhật Dự Án - Version 2 (Hoàn thiện)

## 📋 Tổng quan thay đổi

**File cập nhật:** `ModalCapNhatDuAn.jsx` + `ModalCapNhatDuAn.css`  
**Ngày:** 16/10/2025  
**Mục đích:** Học hỏi từ `ModalTaoNhanhDuAn.jsx` để có logic geocoding chuẩn, draggable map, và confirmation dialog

---

## ✅ Các tính năng đã triển khai

### 1. **Cascade Địa chỉ (Tỉnh > Quận > Phường > Địa chỉ chi tiết)**
- ✅ Dropdown Tỉnh/Thành phố (load từ API)
- ✅ Dropdown Quận/Huyện (dependent on Tỉnh)
- ✅ Dropdown Phường/Xã (dependent on Quận)
- ✅ Input Địa chỉ chi tiết (enabled khi chọn xong Phường)
- ✅ **Tùy chọn:** User có thể bỏ trống để giữ nguyên địa chỉ cũ
- ✅ Hiển thị địa chỉ hiện tại: "📍 Địa chỉ hiện tại: ..."

### 2. **Auto-Geocoding thông minh**
- ✅ **Chỉ kích hoạt khi:** User đã chọn Tỉnh/Quận/Phường (có thay đổi địa chỉ)
- ✅ **Không chạy nếu:** User không chọn địa chỉ mới (giữ nguyên địa chỉ cũ)
- ✅ **Smart Address Formatting:**
  - Nếu có dấu "/" (hẻm): `Hẻm 40 Lê Văn Thọ, TP. Hồ Chí Minh`
  - Nếu chỉ số nhà: `15 Hà Huy Tập, Bình Thuận`
  - Không có địa chỉ chi tiết: `Phường, Quận, Tỉnh`
- ✅ Debounce 500ms sau khi chọn Phường
- ✅ Hiển thị loading spinner khi đang geocode
- ✅ Badge source: Google Maps (✓ Chính xác) hoặc OpenStreetMap (~ Ước lượng)

### 3. **Draggable Map với giới hạn 1km**
- ✅ Component `DraggableMarker` tái sử dụng từ ModalTaoNhanhDuAn
- ✅ Leaflet + React-Leaflet integration
- ✅ **Vị trí gốc (viTriGoc):** Lưu tọa độ ban đầu từ DB
- ✅ **Kiểm tra khoảng cách:** Dùng `kiemTraKhoangCachChoPhep()` từ `geoUtils.js`
- ✅ **Haversine formula:** Tính khoảng cách GPS chính xác
- ✅ **Warning:** Nếu kéo xa hơn 1km → Reset về vị trí gốc + Hiển thị cảnh báo
- ✅ Popup trên marker hiển thị tọa độ và hướng dẫn kéo thả
- ✅ Map chỉ hiển thị khi có `geocodeResult` (sau khi geocode thành công)

### 4. **Confirmation Dialog (Xác nhận trước khi lưu)**
- ✅ Phát hiện tự động các thay đổi: `detectChanges()`
- ✅ So sánh với dữ liệu gốc (`originalData`)
- ✅ **Các field được theo dõi:**
  - Tên dự án
  - Địa chỉ (nếu có chọn Tỉnh/Quận/Phường mới)
  - Yêu cầu phê duyệt chủ
  - Phương thức vào
  - Tọa độ GPS (chỉ khi có thay đổi địa chỉ)
  - Trạng thái dự án
- ✅ **UI Confirmation:**
  - Header: "Xác nhận cập nhật dự án"
  - Info box: "Phát hiện X thay đổi"
  - Change cards: Hiển thị Old (đỏ, gạch ngang) vs New (xanh, bold)
  - Buttons: "Quay lại chỉnh sửa" / "✓ Xác nhận và lưu"
- ✅ **Validation:**
  - Không có thay đổi → Error: "Không có thay đổi nào để lưu"
  - Có thay đổi → Hiển thị confirmation dialog

### 5. **Logic Lưu Tọa độ thông minh**
- ✅ **Nếu KHÔNG thay đổi địa chỉ:** Giữ nguyên DiaChi, ViDo, KinhDo cũ (không gửi trong payload)
- ✅ **Nếu CÓ thay đổi địa chỉ:** Gửi DiaChi mới + ViDo/KinhDo mới
- ✅ Tránh lỗi geocode không mong muốn khi user chỉ sửa tên dự án

### 6. **Trạng thái Dự án (HoatDong / LuuTru)**
- ✅ Chỉ 2 options: HoatDong và LuuTru (bỏ NgungHoatDong)
- ✅ Status Description Box:
  - HoatDong: Icon ✅, màu xanh lá
  - LuuTru: Icon 📦, màu xám
  - Text giải thích chi tiết
  - Border màu semantic
  - Hover effect

---

## 🎨 CSS Updates

### Thêm mới:
```css
/* Spinner Animation */
@keyframes spin { ... }
.spinner { animation: spin 0.6s linear infinite; }

/* Modal Grid for Cascade Address */
.modal-duan-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* Select Dropdown Styling */
.modal-duan-field select {
  appearance: none;
  background-image: url("data:image/svg+xml...");
  /* Custom arrow icon */
}

/* Disabled States */
.modal-duan-field select:disabled,
.modal-duan-field input:disabled { 
  background-color: #f3f4f6;
  cursor: not-allowed;
}

/* Modal Size Control */
.modal-duan-container {
  max-width: 90vw;
  width: 720px;
}
.modal-duan-body {
  max-height: calc(92vh - 200px);
  overflow-y: auto;
}
```

---

## 📊 Architecture

### Component Tree:
```
ModalCapNhatDuAn (Main)
├── Form (Chỉnh sửa)
│   ├── Tên dự án
│   ├── Cascade Địa chỉ (Tỉnh/Quận/Phường/Chi tiết)
│   ├── Geocoding Result Box
│   │   ├── Loading Spinner
│   │   ├── Error Message
│   │   └── Success (Map + Marker)
│   │       └── DraggableMarker
│   ├── Yêu cầu phê duyệt chủ (checkbox)
│   ├── Phương thức vào (textarea)
│   └── Trạng thái dự án (select + description)
└── Confirmation Dialog
    ├── Header
    ├── Info Box (số lượng thay đổi)
    ├── Change Cards (Old vs New)
    └── Actions (Quay lại / Xác nhận)
```

### State Management:
```javascript
// Form data
formData: { TenDuAn, DiaChiChiTiet, ViDo, KinhDo, YeuCauPheDuyetChu, PhuongThucVao, TrangThai }

// Cascade address
tinhs, quans, phuongs
selectedTinh, selectedQuan, selectedPhuong

// Geocoding
geocoding (loading), geocodeResult, geocodeError, viTriGoc, canhBaoKhoangCach

// Confirmation
showConfirmation, changes, originalData

// UI
loading, error
```

### API Calls:
```javascript
// 1. Load Khu vực (Tỉnh/Quận/Phường)
KhuVucService.layDanhSach(parentId)

// 2. Geocoding
POST /api/geocode
Body: { address: "Smart formatted address" }
Response: { success, data: { lat, lng, source } }

// 3. Update Dự án
DuAnService.capNhat(duAnId, payload)
Payload: { TenDuAn, DiaChi?, ViDo?, KinhDo?, YeuCauPheDuyetChu, PhuongThucVao, TrangThai }
```

---

## 🔄 Flow Diagram

### Flow 1: Giữ nguyên địa chỉ
```
User mở modal
→ Load dữ liệu dự án vào form
→ User sửa TenDuAn hoặc TrangThai
→ User click "Xem thay đổi và xác nhận"
→ detectChanges() → 1 thay đổi
→ Hiển thị Confirmation Dialog
→ User click "Xác nhận và lưu"
→ API capNhat(duAnId, { TenDuAn, TrangThai })
   (KHÔNG gửi DiaChi, ViDo, KinhDo)
→ onSaved() → Đóng modal
```

### Flow 2: Thay đổi địa chỉ
```
User mở modal
→ Load dữ liệu dự án vào form
→ User chọn Tỉnh → Load Quận
→ User chọn Quận → Load Phường
→ User chọn Phường
→ [Auto] useEffect kích hoạt
→ [Auto] Debounce 500ms
→ [Auto] Smart format address
→ [Auto] POST /api/geocode
→ [Success] setGeocodeResult({ lat, lng, source })
→ [Success] setFormData({ ViDo, KinhDo })
→ [Success] Hiển thị Map với DraggableMarker
→ User kéo marker → xuLyThayDoiViTri()
   → kiemTraKhoangCachChoPhep(viTriGoc, newPos, 1000)
   → [Valid] Cập nhật ViDo/KinhDo
   → [Invalid] Reset về viTriGoc + Hiển thị warning
→ User click "Xem thay đổi và xác nhận"
→ detectChanges() → 3 thay đổi (DiaChi, TenDuAn, ToaDo)
→ Hiển thị Confirmation Dialog
→ User click "Xác nhận và lưu"
→ API capNhat(duAnId, { TenDuAn, DiaChi, ViDo, KinhDo, TrangThai })
→ onSaved() → Đóng modal
```

---

## 🐛 Known Issues & Solutions

### Issue 1: Modal tràn nội dung
**Cause:** Thiếu CSS cho grid layout và overflow control  
**Fix:** Thêm `max-height: calc(92vh - 200px)` cho `.modal-duan-body`

### Issue 2: Spinner không rotate
**Cause:** Thiếu keyframes animation  
**Fix:** Thêm `@keyframes spin` + `.spinner { animation: spin 0.6s linear infinite; }`

### Issue 3: Select dropdown không có mũi tên
**Cause:** `appearance: none` nhưng không có background-image  
**Fix:** Thêm custom SVG arrow icon

### Issue 4: Geocode chạy khi không mong muốn
**Cause:** useEffect không kiểm tra điều kiện đủ  
**Fix:** Chỉ chạy khi `selectedTinh && selectedQuan && selectedPhuong` (user đã chọn địa chỉ mới)

---

## 📝 Testing Checklist

### Test Case 1: Sửa tên dự án (không đổi địa chỉ)
- [ ] Mở modal → Thấy địa chỉ cũ
- [ ] Không chọn Tỉnh/Quận/Phường
- [ ] Sửa TenDuAn: "Nhà trọ ABC" → "Nhà trọ XYZ"
- [ ] Click "Xem thay đổi"
- [ ] Thấy confirmation: 1 thay đổi (Tên dự án)
- [ ] Xác nhận → API không gửi DiaChi/ViDo/KinhDo

### Test Case 2: Thay đổi địa chỉ
- [ ] Mở modal
- [ ] Chọn Tỉnh → Dropdown Quận enabled
- [ ] Chọn Quận → Dropdown Phường enabled
- [ ] Chọn Phường → Thấy loading spinner
- [ ] Sau 500ms → API geocode chạy
- [ ] Thấy map với marker (màu xanh/vàng badge)
- [ ] Kéo marker → Tọa độ update
- [ ] Kéo xa >1km → Warning hiển thị + Reset marker
- [ ] Click "Xem thay đổi"
- [ ] Thấy confirmation: 2-3 thay đổi (Địa chỉ, Tọa độ)
- [ ] Xác nhận → API gửi DiaChi mới + ViDo/KinhDo mới

### Test Case 3: Thay đổi trạng thái
- [ ] Mở modal
- [ ] Dropdown TrangThai: HoatDong → LuuTru
- [ ] Thấy description box đổi màu (xanh → xám)
- [ ] Icon đổi (✅ → 📦)
- [ ] Click "Xem thay đổi"
- [ ] Thấy confirmation: 1 thay đổi (Trạng thái: Hoạt động → Lưu trữ)
- [ ] Xác nhận → API gửi TrangThai: "LuuTru"

### Test Case 4: Bật/tắt phê duyệt chủ
- [ ] Checkbox "Chủ dự án duyệt cuộc hẹn" → Check
- [ ] Textarea "Phương thức vào" → Disabled
- [ ] Uncheck → Textarea enabled lại
- [ ] Click "Xem thay đổi"
- [ ] Thấy confirmation: 2 thay đổi (YeuCauPheDuyetChu, PhuongThucVao)

### Test Case 5: Validation
- [ ] Xóa hết TenDuAn → Click "Xem thay đổi"
- [ ] Thấy error: "Vui lòng nhập tên dự án"
- [ ] YeuCauPheDuyetChu = false + PhuongThucVao trống
- [ ] Thấy error: "Vui lòng nhập phương thức vào dự án"
- [ ] Không có thay đổi → Click "Xem thay đổi"
- [ ] Thấy error: "Không có thay đổi nào để lưu"

---

## 🚀 Performance

- ✅ Debounce geocoding: 500ms (giảm API calls)
- ✅ Conditional rendering: Map chỉ render khi có geocodeResult
- ✅ React.memo cho DraggableMarker (tránh re-render không cần thiết)
- ✅ useMemo cho eventHandlers (Leaflet marker)
- ✅ Lazy load Leaflet CSS/JS (from CDN, zero bundle impact) → **KHÔNG**, dùng npm package

---

## 📦 Dependencies

```json
{
  "react-leaflet": "^5.0.0",
  "leaflet": "^1.9.4"
}
```

---

## 🎯 Next Steps

- [ ] Thêm unit tests cho detectChanges()
- [ ] Thêm E2E tests cho flow cập nhật địa chỉ
- [ ] Tối ưu hóa API calls (cache Tỉnh/Quận/Phường)
- [ ] Thêm animation cho confirmation dialog (fade in/out)
- [ ] Thêm undo/redo cho marker drag
- [ ] Responsive optimization cho mobile

---

## 📄 Files Modified

1. **ModalCapNhatDuAn.jsx** (1,100+ LOC)
   - Rewritten từ đầu dựa trên ModalTaoNhanhDuAn.jsx
   - Added: Cascade address, auto-geocoding, draggable map, confirmation dialog
   - Backup: ModalCapNhatDuAn_old.jsx

2. **ModalCapNhatDuAn.css** (+80 LOC)
   - Added: Spinner animation, grid layout, select styling, disabled states
   - Fixed: Modal overflow, responsive breakpoints

3. **ModalCapNhatDuAn_v2.jsx** (Staging file)
   - Temporary file for development
   - Can be deleted after testing

---

**✅ HOÀN THÀNH:** Modal Cập Nhật Dự Án V2 với đầy đủ tính năng geocoding, draggable map, và confirmation dialog!
