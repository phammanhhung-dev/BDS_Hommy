# Tài liệu Triển khai Module Nhân viên Bán hàng

## Tổng quan

Module Nhân viên Bán hàng (Sales Staff) đã được triển khai đầy đủ theo kế hoạch trong `nh-n-vi-n-b-n-h-ng.plan.md`. Module bao gồm:

- **Backend:** Service layer, Models, Controller với 19 API endpoints, Routes
- **Frontend:** Design system (Corporate Blue theme), Layout, Navigation, Shared components, Pages, API integration
- **Features:** 7 use cases (UC-SALE-01 đến UC-SALE-07)

## Architecture

### Backend Structure

```
server/
├── services/
│   └── NhanVienBanHangService.js      # Business logic cho 7 UC
├── models/
│   ├── LichLamViecModel.js            # Model lịch làm việc
│   └── BaoCaoThuNhapModel.js          # Model báo cáo thu nhập
├── controllers/
│   └── NhanVienBanHangController.js   # Controller với 19 endpoints
└── routes/
    └── nhanVienBanHangRoutes.js       # Route definitions
```

### Frontend Structure

```
client/src/
├── components/NhanVienBanHang/
│   ├── LayoutNhanVienBanHang.jsx      # Main layout với sidebar
│   ├── NavigationNhanVienBanHang.jsx  # Sidebar navigation
│   ├── MetricCard.jsx                 # Metric display card
│   ├── StatusBadge.jsx                # Status badge component
│   ├── TimelineCuocHen.jsx            # Timeline component
│   └── CalendarGrid.jsx               # Weekly calendar grid
├── pages/NhanVienBanHang/
│   ├── Dashboard.jsx                  # Trang tổng quan
│   └── LichLamViec.jsx                # UC-SALE-01: Lịch làm việc
├── services/
│   └── nhanVienBanHangApi.js          # API integration service
└── styles/
    └── NhanVienBanHangDesignSystem.css # Corporate Blue theme
```

## API Endpoints

### Lịch làm việc (UC-SALE-01)

- `GET /api/nhan-vien-ban-hang/lich-lam-viec` - Lấy lịch làm việc
- `POST /api/nhan-vien-ban-hang/lich-lam-viec` - Tạo ca làm việc
- `PUT /api/nhan-vien-ban-hang/lich-lam-viec/:id` - Cập nhật ca
- `DELETE /api/nhan-vien-ban-hang/lich-lam-viec/:id` - Xóa ca

### Cuộc hẹn (UC-SALE-02, UC-SALE-03, UC-SALE-05)

- `GET /api/nhan-vien-ban-hang/cuoc-hen` - Danh sách cuộc hẹn
- `GET /api/nhan-vien-ban-hang/cuoc-hen/:id` - Chi tiết cuộc hẹn
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/xac-nhan` - Xác nhận
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/doi-lich` - Đổi lịch
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/huy` - Hủy
- `POST /api/nhan-vien-ban-hang/cuoc-hen/:id/bao-cao-ket-qua` - Báo cáo kết quả

### Giao dịch/Cọc (UC-SALE-04)

- `GET /api/nhan-vien-ban-hang/giao-dich` - Danh sách giao dịch
- `GET /api/nhan-vien-ban-hang/giao-dich/:id` - Chi tiết giao dịch
- `POST /api/nhan-vien-ban-hang/giao-dich/:id/xac-nhan-coc` - Xác nhận cọc

### Báo cáo thu nhập (UC-SALE-06)

- `GET /api/nhan-vien-ban-hang/bao-cao/thu-nhap` - Báo cáo thu nhập
- `GET /api/nhan-vien-ban-hang/bao-cao/thong-ke` - Thống kê hiệu suất
- `GET /api/nhan-vien-ban-hang/bao-cao/cuoc-hen-theo-tuan` - Cuộc hẹn theo tuần

### Dashboard

- `GET /api/nhan-vien-ban-hang/dashboard` - Metrics tổng quan
- `GET /api/nhan-vien-ban-hang/ho-so` - Thông tin hồ sơ
- `PUT /api/nhan-vien-ban-hang/ho-so` - Cập nhật hồ sơ

## Design System - Corporate Blue Theme

### Color Palette

```css
--nvbh-primary: #1D4ED8;           /* Blue 600 */
--nvbh-primary-dark: #1E40AF;      /* Blue 700 */
--nvbh-primary-light: #3B82F6;     /* Blue 500 */
--nvbh-secondary: #0EA5E9;         /* Sky 500 */
--nvbh-accent: #94A3B8;            /* Slate 400 - Silver */
--nvbh-accent-light: #CBD5E1;      /* Slate 300 */
```

### Glass Morphism

```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(29, 78, 216, 0.12);
box-shadow: 0 8px 32px rgba(29, 78, 216, 0.08);
```

### Responsive Breakpoints

- **Desktop:** > 1024px - Sidebar mở, grid 3 columns
- **Tablet:** 768px - 1024px - Sidebar collapsed, grid 2 columns
- **Mobile:** < 768px - Bottom nav, grid 1 column

## Components

### MetricCard

Hiển thị số liệu với icon và change indicator.

**Props:**
- `icon` - React component (SVG icon)
- `label` - Nhãn metric
- `value` - Giá trị (number hoặc string)
- `change` - Phần trăm thay đổi (optional)
- `changeType` - 'positive', 'negative', 'neutral'
- `color` - 'primary', 'success', 'warning', 'danger'
- `onClick` - Callback khi click (optional)

**Ví dụ:**
```jsx
<MetricCard
  icon={CalendarIcon}
  label="Cuộc hẹn hôm nay"
  value={12}
  change={5.2}
  changeType="positive"
  color="primary"
  onClick={() => navigate('/cuoc-hen')}
/>
```

### StatusBadge

Hiển thị trạng thái với màu semantic.

**Props:**
- `status` - Mã trạng thái (DaXacNhan, ChoXacNhan, etc.)
- `size` - 'sm', 'md', 'lg'
- `showDot` - Hiển thị dot indicator (boolean)

**Trạng thái hỗ trợ:**
- Cuộc hẹn: DaYeuCau, ChoXacNhan, DaXacNhan, DaDoiLich, HuyBoiKhach, HuyBoiHeThong, KhachKhongDen, HoanThanh
- Giao dịch: DaUyQuyen, DaGhiNhan, DaHoanTra, DaRutVe
- Phê duyệt: ChoPheDuyet, DaPheDuyet, TuChoi

**Ví dụ:**
```jsx
<StatusBadge status="DaXacNhan" size="sm" showDot />
```

### TimelineCuocHen

Timeline dọc hiển thị lịch sử cuộc hẹn.

**Props:**
- `events` - Mảng sự kiện với {type, title, description, timestamp, status, user}

**Event types:**
- `created`, `confirmed`, `rescheduled`, `cancelled`, `completed`, `default`

**Ví dụ:**
```jsx
<TimelineCuocHen
  events={[
    { type: 'created', title: 'Tạo cuộc hẹn', timestamp: '2025-01-10T10:00:00', user: 'Hệ thống' },
    { type: 'confirmed', title: 'Xác nhận', timestamp: '2025-01-10T10:30:00', user: 'NVBH001' }
  ]}
/>
```

### CalendarGrid

Weekly calendar grid với time slots.

**Props:**
- `shifts` - Mảng ca làm việc
- `onShiftClick` - Callback khi click vào shift
- `onTimeSlotClick` - Callback khi click vào slot trống
- `weekStart` - Ngày bắt đầu tuần (Date)

**Ví dụ:**
```jsx
<CalendarGrid
  shifts={shifts}
  weekStart={new Date()}
  onTimeSlotClick={(date) => console.log('Create shift at', date)}
  onShiftClick={(shift) => console.log('Edit shift', shift)}
/>
```

## Usage Examples

### API Integration

```javascript
import { 
  layLichLamViec, 
  taoLichLamViec, 
  layDashboard 
} from '@/services/nhanVienBanHangApi';

// Lấy lịch làm việc
const response = await layLichLamViec({
  tuNgay: '2025-01-01',
  denNgay: '2025-01-31'
});

// Tạo ca làm việc
await taoLichLamViec({
  batDau: '2025-01-10T09:00:00',
  ketThuc: '2025-01-10T17:00:00'
});

// Lấy dashboard
const dashboard = await layDashboard();
```

### Routing

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LayoutNhanVienBanHang from '@/components/NhanVienBanHang/LayoutNhanVienBanHang';
import Dashboard from '@/pages/NhanVienBanHang/Dashboard';

<Routes>
  <Route path='/nhan-vien-ban-hang' element={<LayoutNhanVienBanHang />}>
    <Route index element={<Dashboard />} />
    <Route path='lich-lam-viec' element={<LichLamViec />} />
    <Route path='cuoc-hen' element={<QuanLyCuocHen />} />
    {/* ... more routes */}
  </Route>
</Routes>
```

## Security & Authorization

Tất cả API endpoints yêu cầu:
1. **Authentication:** JWT token trong header `Authorization: Bearer <token>`
2. **Authorization:** Vai trò phải là `NhanVienBanHang`
3. **Data scope:** Chỉ truy cập data thuộc nhân viên hiện tại

Middleware chain:
```javascript
router.use(authenticate);
router.use(authorize(['NhanVienBanHang']));
```

## Error Handling

### Backend

Tất cả async operations sử dụng try-catch:

```javascript
try {
  const result = await NhanVienBanHangService.dangKyLichLamViec(...);
  res.json({ success: true, data: result });
} catch (error) {
  console.error('[Controller] Error:', error);
  res.status(400).json({ success: false, message: error.message });
}
```

### Frontend

API client tự động xử lý 401 Unauthorized:

```javascript
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);
```

## Database Schema

Module sử dụng các bảng hiện có:

- **`lichlamviec`** - Ca làm việc (LichID, NhanVienBanHangID, BatDau, KetThuc)
- **`cuochen`** - Cuộc hẹn (CuocHenID, NhanVienBanHangID, KhachHangID, TrangThai, SoLanDoiLich, GhiChuKetQua)
- **`hosonhanvien`** - Hồ sơ NVBH (HoSoID, NguoiDungID, TyLeHoaHong, KhuVucPhuTrach)
- **`giaodich`** - Giao dịch (GiaoDichID, SoTien, Loai, TrangThai)

**Không cần migration** - Schema đã sẵn sàng.

## Audit Logging

Tất cả hành động quan trọng được ghi audit log:

```javascript
await NhatKyHeThongService.ghiNhan(
  nhanVienId,
  'xac_nhan_cuoc_hen',
  'CuocHen',
  cuocHenId,
  { trangThai: 'ChoXacNhan' }, // old value
  { trangThai: 'DaXacNhan' },  // new value
  req.ip,
  req.get('User-Agent')
);
```

## Performance Considerations

1. **Pagination:** Sử dụng `limit` parameter (default 50)
2. **Mobile blur reduction:** Giảm `backdrop-filter: blur()` từ 16px → 8px
3. **Query optimization:** JOIN statements được optimize
4. **Caching:** Client-side state management (React hooks)

## Testing

### Backend Testing

```bash
# Run API tests
npm test

# Test specific endpoint
curl -X GET http://localhost:5000/api/nhan-vien-ban-hang/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing

```bash
# Start dev server
npm start

# Navigate to
http://localhost:3000/nhan-vien-ban-hang
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Kiểm tra token trong localStorage
   - Xác nhận vai trò là `NhanVienBanHang`

2. **Không load được lịch làm việc**
   - Check network tab trong DevTools
   - Xác nhận `tuNgay` và `denNgay` hợp lệ

3. **Glass morphism không hoạt động**
   - Kiểm tra browser support cho `backdrop-filter`
   - Fallback: sử dụng solid background

4. **Mobile layout bị vỡ**
   - Xác nhận viewport meta tag
   - Check responsive CSS media queries

## Future Enhancements

1. **Real-time updates:** Socket.IO cho notifications
2. **Offline mode:** Service Workers + IndexedDB
3. **Advanced charts:** Integration với Chart.js hoặc Recharts
4. **Export reports:** PDF/Excel generation
5. **Advanced filtering:** Multi-criteria search

## Support

- **Documentation:** `docs/use-cases-v1.2.md`
- **Design System:** `client/src/styles/NhanVienBanHangDesignSystem.css`
- **API Reference:** Xem JSDoc trong source code

## Changelog

### Version 1.0.0 (2025-11-06)

- ✅ Backend: Service, Models, Controller, Routes (19 endpoints)
- ✅ Frontend: Design system, Layout, Navigation, Components
- ✅ Pages: Dashboard, Lịch làm việc (UC-SALE-01)
- ✅ API Integration: Complete service layer
- ✅ Security: Authentication + Authorization middleware
- ✅ Responsive: 3 breakpoints (desktop/tablet/mobile)

### Next Release (Planned)

- Cuộc hẹn management pages (UC-SALE-02, UC-SALE-03)
- Giao dịch pages (UC-SALE-04)
- Báo cáo kết quả modal (UC-SALE-05)
- Thu nhập reports (UC-SALE-06)
- Tin nhắn với Corporate Blue theme (UC-SALE-07)

---

**Maintained by:** Development Team  
**Last Updated:** 2025-11-06  
**Version:** 1.0.0








