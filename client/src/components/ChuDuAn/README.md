# Cấu trúc Components - Module Chủ Dự Án

## 📂 Tổng quan

Thư mục này chứa các React components được sử dụng trong module Chủ Dự Án, tuân thủ theo hướng dẫn trong `.github/copilot-instructions.md`.

---

## 📋 Danh sách Components

### 🎯 **Navigation & Layout**
- **`NavigationChuDuAn.jsx/.css`** - Sidebar navigation collapsible (280px ↔ 72px)
  - Sử dụng trong: `ChuDuAnLayout.jsx`
  - Features: Collapsible, icon-based menu, active state highlighting

### 🗺️ **Map & Address Components**
- **`AddressAutocompleteInput.jsx/.css`** - Input tự động suggest địa chỉ
  - Sử dụng trong: `ModalTaoNhanhDuAn.jsx`, form tạo tin đăng
  - Features: Debounce search, dropdown suggestions

### 📊 **Dashboard Components**
- **`MetricCard.jsx/.css`** - Card hiển thị số liệu thống kê
  - Sử dụng trong: `Dashboard.jsx`
  - Features: Border-top colored, hover effects, icon support

- **`Charts/`** - Thư mục chứa các biểu đồ
  - Bar charts, Line charts, Circular progress
  - Sử dụng CSS-based rendering (không dùng Chart.js)

### 🏢 **Modals - Quản lý Dự án**
- **`ModalTaoNhanhDuAn.jsx`** - Tạo dự án mới nhanh
  - Features: Cascade address, auto-geocoding, draggable map, validation
  - Architecture: Smart address formatting, 1km radius restriction
  - Status: ✅ Production-ready

- **`ModalCapNhatDuAn.jsx/.css`** - Chỉnh sửa thông tin dự án
  - Features: Cascade address, geocoding, confirmation dialog, change detection
  - Architecture: Học hỏi từ ModalTaoNhanhDuAn, smart coordinate update
  - Status: ✅ Production-ready (V2 - hoàn thiện)
  - Alias: `ModalChinhSuaDuAn.jsx` (export từ ModalCapNhatDuAn)

- **`ModalChinhSuaToaDo.jsx`** - Chỉnh sửa tọa độ GPS trên map
  - Sử dụng trong: `TaoTinDang.jsx`, `ChinhSuaTinDang.jsx`
  - Features: Draggable marker, Leaflet map, coordinate validation
  - Status: ✅ Production-ready

### 🏠 **Modals - Quản lý Phòng**
- **`ModalDanhSachPhong.jsx`** - Hiển thị danh sách phòng trong dự án
  - Sử dụng trong: `QuanLyTinDang.jsx`
  - Features: Table view, status badges, quick actions

- **`ModalPreviewPhong.jsx/.css`** - Preview thông tin phòng chi tiết
  - Sử dụng trong: `TaoTinDang.jsx`, `ChinhSuaTinDang.jsx`
  - Features: Image gallery, specs display, availability status

- **`SectionChonPhong.jsx/.css`** - Section chọn phòng khi tạo tin đăng
  - Sử dụng trong: `TaoTinDang.jsx`
  - Features: Multiple selection, search, filter by status

### 💰 **Modals - Chính sách Cọc**
- **`ModalQuanLyChinhSachCoc.jsx/.css`** - Quản lý chính sách cọc
  - Sử dụng trong: `QuanLyDuAn_v2.jsx`
  - Features: CRUD chính sách, validation, policy cards
  - Status: ✅ Production-ready

- **`ModalChinhSachCoc.jsx`** - Modal xem chi tiết chính sách cọc
  - Sử dụng trong: `QuanLyDuAn.jsx` (legacy)
  - **Status: 🔴 Deprecated** - Sử dụng ModalQuanLyChinhSachCoc thay thế

- **`ModalThongTinCoc.jsx`** - Modal hiển thị thông tin cọc
  - Sử dụng trong: `QuanLyDuAn.jsx`
  - Features: Display deposit info, policy details

### 🔓 **Modals - Workflow Banned/Reopen**
- **`ModalYeuCauMoLaiDuAn.jsx/.css`** - Yêu cầu mở lại dự án bị banned
  - Sử dụng trong: `QuanLyDuAn_v2.jsx`
  - Features: Form lý do, attachments upload, validation
  - Status: ✅ Production-ready

- **`ModalPhuongThucVao.jsx`** - Chỉnh sửa phương thức vào dự án
  - Sử dụng trong: `QuanLyDuAn.jsx`
  - Features: Textarea with validation, auto-save

---

## 🗑️ Files cần xóa (Deprecated/Backup)

### 🔴 **Backup files - Không còn sử dụng:**
```bash
# Các file backup sau khi refactor
ModalCapNhatDuAn_old.jsx    # Backup trước khi refactor V2
ModalCapNhatDuAn_v2.jsx     # Staging file, đã merge vào ModalCapNhatDuAn.jsx
```

**Lệnh xóa:**
```powershell
cd client/src/components/ChuDuAn
Remove-Item ModalCapNhatDuAn_old.jsx -Force
Remove-Item ModalCapNhatDuAn_v2.jsx -Force
```

### 🟡 **Deprecated - Cần review trước khi xóa:**
```bash
ModalChinhSachCoc.jsx       # Đã thay thế bởi ModalQuanLyChinhSachCoc
```

**Action:** Kiểm tra xem còn file nào import không, nếu không thì xóa.

---

## 🎨 Naming Convention

Theo `.github/copilot-instructions.md`:

### ✅ **Đúng:**
- `ModalTaoNhanhDuAn.jsx` - Tên tiếng Việt không dấu, PascalCase
- `NavigationChuDuAn.jsx/.css` - Component + CSS cùng tên
- `SectionChonPhong.jsx/.css` - Prefix Section cho UI sections

### ❌ **Sai:**
- `ModalCreateProject.jsx` - Không dùng tiếng Anh
- `modal_tao_du_an.jsx` - Không dùng snake_case
- `ModalTaoDuAn.js` - Thiếu extension `.jsx` cho React components

---

## 📦 Import Convention

### ✅ **Absolute imports (Khuyến nghị):**
```jsx
import ModalTaoNhanhDuAn from '@/components/ChuDuAn/ModalTaoNhanhDuAn';
import NavigationChuDuAn from '@/components/ChuDuAn/NavigationChuDuAn';
```

### ✅ **Relative imports (Hiện tại):**
```jsx
import ModalTaoNhanhDuAn from '../../components/ChuDuAn/ModalTaoNhanhDuAn';
import NavigationChuDuAn from '../../components/ChuDuAn/NavigationChuDuAn';
```

---

## 🔗 Dependencies

### **External Libraries:**
```json
{
  "react-leaflet": "^5.0.0",
  "leaflet": "^1.9.4",
  "react-icons": "^5.4.0"
}
```

### **Internal Services:**
- `services/ChuDuAnService.js` - API calls cho Chủ dự án
- `utils/geoUtils.js` - Utilities cho GPS calculations
- `context/AuthContext.js` - Authentication state

---

## 📊 Component Dependency Tree

```
ChuDuAnLayout
├── NavigationChuDuAn
└── Pages (Dashboard, QuanLyDuAn, TaoTinDang...)
    ├── ModalTaoNhanhDuAn
    │   ├── AddressAutocompleteInput
    │   └── DraggableMarker (from react-leaflet)
    ├── ModalCapNhatDuAn
    │   ├── AddressAutocompleteInput
    │   └── DraggableMarker
    ├── ModalQuanLyChinhSachCoc
    ├── ModalYeuCauMoLaiDuAn
    └── ModalDanhSachPhong
        └── ModalPreviewPhong
```

---

## 🧪 Testing Guidelines

### **Unit Tests Location:**
```
client/src/components/ChuDuAn/__tests__/
├── ModalTaoNhanhDuAn.test.jsx
├── ModalCapNhatDuAn.test.jsx
└── NavigationChuDuAn.test.jsx
```

### **Coverage Requirements:**
- Component logic: ≥ 80%
- User interactions: ≥ 90%
- Edge cases: 100%

---

## 📝 Documentation

### **Component-level docs:**
Mỗi component phức tạp (modals, forms) phải có file markdown đi kèm:
- `MODAL_CAP_NHAT_DU_AN_V2_SUMMARY.md` - Architecture & flow diagram
- `NAVIGATION_CHU_DU_AN_DESIGN.md` - Design decisions & responsive behavior

### **Inline JSDoc:**
```jsx
/**
 * ModalTaoNhanhDuAn - Modal tạo dự án nhanh với geocoding tự động
 * @param {boolean} isOpen - Modal visibility state
 * @param {Function} onClose - Callback khi đóng modal
 * @param {Function} onSuccess - Callback sau khi tạo thành công
 */
function ModalTaoNhanhDuAn({ isOpen, onClose, onSuccess }) {
  // ...
}
```

---

## 🚀 Future Improvements

- [ ] Chuyển sang absolute imports với `@/` alias
- [ ] Thêm Storybook cho component showcase
- [ ] Implement code splitting cho các modals (React.lazy)
- [ ] Thêm E2E tests với Playwright
- [ ] Tối ưu bundle size (tree-shaking, dynamic imports)

---

## 📞 Contact

Nếu có câu hỏi về cấu trúc hoặc cách sử dụng components, tham khảo:
- **Main docs:** `.github/copilot-instructions.md`
- **API docs:** `docs/chu-du-an-routes-implementation.md`
- **Use cases:** `docs/use-cases-v1.2.md`
