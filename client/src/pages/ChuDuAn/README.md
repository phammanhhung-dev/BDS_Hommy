# Pages/ChuDuAn - Module Quản lý cho Chủ Dự án

**Mô-đun:** Giao diện quản lý cho Chủ dự án (Project Owner)  
**Design System:** Light Glass Morphism Theme  
**Tham chiếu nghiệp vụ:** `docs/use-cases-v1.2.md`

---

## 📂 Cấu trúc Thư mục

```
client/src/pages/ChuDuAn/
├── Dashboard.jsx/.css              # UC-PROJ-03: Dashboard tổng quan
├── QuanLyDuAn.jsx/.css             # UC-PROJ-01: CRUD Dự án + Banned workflow
├── QuanLyTinDang.jsx/.css          # UC-PROJ-01: Quản lý tin đăng
├── TaoTinDang.jsx/.css             # UC-PROJ-01: Tạo tin đăng mới
├── ChinhSuaTinDang.jsx             # UC-PROJ-01: Chỉnh sửa tin đăng
├── ChiTietTinDang.jsx/.css         # UC-PROJ-01: Xem chi tiết tin đăng
├── BaoCaoHieuSuat.jsx/.css         # UC-PROJ-03: Báo cáo & Analytics
├── QuanLyNhap.jsx                  # Utilities: Quản lý import data
└── index.js                        # Export barrel
```

**Total:** 15 files (13 production + 1 config + 1 legacy backup)

---

## 🎯 Use Cases Mapping

### UC-PROJ-01: Đăng tin cho thuê
**Tác nhân:** Chủ dự án (Project Owner)

#### Flow chính:
1. **QuanLyDuAn.jsx** - Quản lý danh sách dự án
   - CRUD operations (Create, Read, Update, Archive)
   - Banned workflow (Yêu cầu mở lại dự án bị khóa)
   - Chính sách Cọc (Manage deposit policies)
   - Quick filters: Hoạt động / Ngưng hoạt động / Lưu trữ / Banned
   - Bulk operations: Export Excel, Archive multiple

2. **TaoTinDang.jsx** - Tạo tin đăng mới
   - Form validation (tiêu đề, giá, diện tích, ảnh bắt buộc)
   - Upload ảnh (max 5MB, multiple files)
   - Select dự án từ dropdown (chỉ dự án HoatDong)
   - Preview trước khi submit

3. **QuanLyTinDang.jsx** - Danh sách tin đăng
   - Table view với filters (Trạng thái, Dự án)
   - Smart room display logic (Single vs Multiple rooms)
   - Actions: Xem, Sửa, Gửi duyệt, Xóa

4. **ChinhSuaTinDang.jsx** - Chỉnh sửa tin đăng
   - Pre-fill form với data hiện tại
   - Upload ảnh mới / Xóa ảnh cũ
   - Validation rules tương tự TaoTinDang

5. **ChiTietTinDang.jsx** - Xem chi tiết
   - Read-only view
   - Hiển thị ảnh carousel
   - Room status indicators
   - Location map (Leaflet)

#### Components hỗ trợ:
- `ModalTaoNhanhDuAn.jsx` - Modal tạo dự án nhanh
- `ModalChinhSuaDuAn.jsx` - Modal chỉnh sửa dự án (V2 với geocoding)
- `ModalQuanLyChinhSachCoc.jsx` - Modal quản lý chính sách cọc
- `ModalYeuCauMoLaiDuAn.jsx` - Modal yêu cầu mở lại dự án banned

---

### UC-PROJ-03: Xem báo cáo hiệu suất
**Tác nhân:** Chủ dự án

#### Pages:
1. **Dashboard.jsx** - Tổng quan dashboard
   - Hero section với gradient purple background
   - 4 Quick actions (Tạo tin, Quản lý, Báo cáo, Cuộc hẹn)
   - 4 Metric cards (Tổng tin, Hoạt động, Cuộc hẹn, Doanh thu)
   - Charts: Doanh thu 6 tháng (CSS bars), Tỷ lệ lấp đầy (SVG circular)
   - Tin đăng gần đây + Cuộc hẹn sắp tới

2. **BaoCaoHieuSuat.jsx** - Báo cáo chi tiết
   - Time filters (7 ngày, 30 ngày, 90 ngày, Custom range)
   - Export Excel/PDF
   - Advanced analytics (Views, Favorites, Bookings)

---

## 🎨 Design System

### Theme: Light Glass Morphism
**Design tokens:** `client/src/styles/ChuDuAnDesignSystem.css`

#### Color Palette:
```css
/* Background - Light Theme */
--color-white: #ffffff;
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;

/* Brand Colors */
--color-primary: #8b5cf6;          /* Vibrant Purple */
--color-primary-dark: #6006fc;     /* Deep Purple */
--color-primary-light: #a78bfa;    /* Light Purple */

/* Semantic Colors */
--color-success: #10b981;          /* Green */
--color-danger: #ef4444;           /* Red */
--color-warning: #f59e0b;          /* Gold */
--color-info: #3b82f6;             /* Blue */

/* Glass Morphism */
--color-glass-white: rgba(255, 255, 255, 0.8);
--color-glass-border: rgba(255, 255, 255, 0.4);
--color-glass-shadow: rgba(139, 92, 246, 0.1);
```

#### Design Principles:
1. **Light Glass Morphism:** `backdrop-filter: blur(10px)`, white/transparent backgrounds
2. **Gradient Accents:** Purple gradient hero sections
3. **Border Top Colors:** Metric cards có border-top 4px màu semantic
4. **Subtle Shadows:** `box-shadow: 0 8px 24px rgba(139, 92, 246, 0.08)`
5. **Hover Effects:** Transform + shadow tăng + border-color change

---

## 📦 Dependencies

### External Libraries:
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.28.0",
  "react-icons": "^5.4.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0"
}
```

### Internal Components:
- `ChuDuAnLayout.jsx` - Layout wrapper với sidebar navigation
- `NavigationChuDuAn.jsx` - Collapsible sidebar (280px ↔ 72px)
- `AddressAutocompleteInput.jsx` - Address search với Nominatim/Google
- `ModalChinhSuaToaDo.jsx` - Draggable map marker (Leaflet)

### Services:
- `ChuDuAnService.js` - API calls cho CRUD dự án
- `ChinhSachCocService.js` - API calls cho deposit policies
- `NhatKyHeThongService.js` - Audit log tracking

---

## 🚀 Component Status

| Component | Status | Use Case | Design Theme | Size (KB) |
|-----------|--------|----------|--------------|-----------|
| Dashboard.jsx | ✅ Production | UC-PROJ-03 | Light Glass Morphism | 21.94 + 42.53 CSS |
| QuanLyDuAn.jsx | ✅ Production | UC-PROJ-01 | Light Theme | 52.08 + 21.72 CSS |
| QuanLyTinDang.jsx | ✅ Production | UC-PROJ-01 | Light Theme | 21.79 + 13.48 CSS |
| TaoTinDang.jsx | ✅ Production | UC-PROJ-01 | Light Theme | 55.4 + 8.12 CSS |
| ChinhSuaTinDang.jsx | ✅ Production | UC-PROJ-01 | Light Theme | 63.95 |
| ChiTietTinDang.jsx | ✅ Production | UC-PROJ-01 | Light Glass Morphism | 32.28 + 29.81 CSS |
| BaoCaoHieuSuat.jsx | ✅ Production | UC-PROJ-03 | Light Theme | 14.43 + 10.13 CSS |
| QuanLyNhap.jsx | ✅ Production | Utilities | Light Theme | 6.3 |

**Legend:**
- ✅ Production - Actively used, tested
- 🟡 Legacy - Old version, kept for backup

---

## 📋 File Naming Convention

**Bắt buộc:** Tuân thủ quy tắc trong `.github/copilot-instructions.md`

### Tên file:
- **Component/Page:** `TenTrang.jsx` (PascalCase tiếng Việt không dấu)
- **CSS:** `TenTrang.css` (cùng basename với .jsx)
- **Export:** Sử dụng `index.js` làm barrel export

### Tên function:
```javascript
// ✅ CORRECT
function QuanLyDuAn() { ... }
export default QuanLyDuAn;

// ❌ WRONG (no version suffixes)
function QuanLyDuAn_v2() { ... }
```

### Tên CSS class:
```css
/* ✅ CORRECT - BEM naming */
.quanlyduan-container { }
.quanlyduan-header { }
.quanlyduan-table__row { }

/* ✅ CORRECT - Design tokens */
:root {
  --color-primary: #8b5cf6;
}
```

---

## 🎯 Smart Room Display Logic

**Tham chiếu:** `client/src/pages/ChuDuAn/ROOM_DISPLAY_LOGIC.md`

### Phân loại Tin Đăng:

#### 1. Phòng Đơn (Single Room):
```javascript
TongSoPhong === 0 || TongSoPhong === 1
```
- Thông tin lưu ở `tindang.Gia`, `tindang.DienTich`
- Hiển thị: "Phòng đơn" + Trạng thái (Còn trống / Đã thuê)

#### 2. Nhiều Phòng (Multiple Rooms):
```javascript
TongSoPhong > 1
```
- Mỗi phòng có giá/diện tích riêng trong bảng `phong`
- Hiển thị: Tổng số phòng, phòng trống, đã thuê, tỷ lệ %
- `tindang.Gia`, `tindang.DienTich` có thể NULL

---

## 🔧 Development Guidelines

### CSS Architecture:
1. **Global tokens:** Define trong `:root` (ChuDuAnDesignSystem.css)
2. **Component-specific:** Mỗi page có file `.css` riêng
3. **Mobile-first:** Code cho màn hình nhỏ trước
4. **Responsive breakpoints:** 480px, 768px, 1024px, 1280px

### JavaScript Patterns:
```javascript
// ✅ JSDoc for type definitions
/**
 * @typedef {Object} DuAn
 * @property {number} DuAnID
 * @property {string} TenDuAn
 * @property {string} TrangThai - 'HoatDong' | 'NgungHoatDong' | 'LuuTru'
 */

// ✅ Destructuring imports
import { DuAnService, Utils } from '../../services/ChuDuAnService';

// ✅ Named exports for utilities
export const formatCurrency = (value) => { ... };
```

### State Management:
- **Local state:** `useState` cho UI state (modals, filters)
- **Persistent state:** `localStorage` cho user preferences (sort, pageSize)
- **Server state:** Fetch on mount, no global state library yet

---

## 🧪 Testing Guidelines

### Manual Testing Checklist:
- [ ] Dashboard loads without errors (4 metric cards visible)
- [ ] QuanLyDuAn CRUD operations work (Create, Edit, Archive)
- [ ] Banned workflow: Modal mở lại dự án hiển thị đúng
- [ ] Chính sách Cọc: CRUD deposit policies
- [ ] TaoTinDang: Upload ảnh + validation works
- [ ] QuanLyTinDang: Smart room display (single vs multiple)
- [ ] Responsive design: Test 480px, 768px, 1024px

### Browser Testing:
- Chrome/Edge (primary)
- Firefox (secondary)
- Safari (mobile)

---

## 📖 Documentation Links

### Internal Docs:
- **Use Cases:** `docs/use-cases-v1.2.md`
- **Design System:** `client/src/styles/ChuDuAnDesignSystem.css`
- **Room Logic:** `client/src/pages/ChuDuAn/ROOM_DISPLAY_LOGIC.md`
- **API Routes:** `docs/chu-du-an-routes-implementation.md`
- **Cleanup Plan:** `COMPREHENSIVE_CLEANUP_PLAN.md`

### External Refs:
- **React Icons:** https://react-icons.github.io/react-icons/icons/hi2/
- **Leaflet:** https://leafletjs.com/reference.html
- **React Leaflet:** https://react-leaflet.js.org/

---

## 🚨 Known Issues & Fixes

### Issue 1: Layout không giãn toàn màn hình
**Fix:** 
```css
.cda-table-container { width: 100%; }
.cda-table { width: 100%; min-width: 100%; table-layout: fixed; }
```

### Issue 2: Icon import error (Dashboard)
**Fix:** `HiOutlineTrendingUp` → `HiOutlineArrowTrendingUp` (react-icons@5.4.0)

### Issue 3: localStorage key conflict
**Fix:** Changed `quanlyduan_v2_preferences` → `quanlyduan_preferences` (Phase 2 refactor)

---

## 📞 Cleanup History

### Phase 1 (2025-10-16): Xóa Duplicates
**Files deleted:**
- DashboardNew.jsx/.css
- DashboardOptimized.jsx/.css
- TestIcon.jsx
- debug-icons.md

**Result:** 6 files removed (-28.6%), ~150KB saved

### Phase 2 (2025-10-16): Refactor QuanLyDuAn
**Actions:**
1. Backup: QuanLyDuAn.jsx → QuanLyDuAn_legacy.jsx
2. Rename: QuanLyDuAn_v2.jsx → QuanLyDuAn.jsx
3. Update imports: App.jsx, internal CSS
4. Update function name: `QuanLyDuAn_v2()` → `QuanLyDuAn()`
5. Update localStorage key: Remove `_v2` suffix

**Result:** No version suffixes in production code ✅

---

## 🎉 Future Improvements

### Short-term (Next Sprint):
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Implement code splitting (React.lazy)
- [ ] Add Storybook for component documentation
- [ ] Optimize images (WebP format)

### Long-term:
- [ ] Migrate to TypeScript
- [ ] Implement React Query for server state
- [ ] Add E2E tests (Playwright)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

**Last Updated:** 2025-10-16  
**Maintainer:** Development Team  
**Status:** ✅ Production Ready
