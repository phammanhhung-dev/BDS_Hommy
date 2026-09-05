# 📅 THIẾT KẾ GIAO DIỆN QUẢN LÝ CUỘC HẸN CHO CHỦ DỰ ÁN

## 📊 Phân tích Database Schema

### Bảng `cuochen`:
```sql
- CuocHenID (PK)
- KhachHangID (FK → nguoidung)
- NhanVienBanHangID (FK → nguoidung)
- PhongID (FK → phong)
- ThoiGianHen (datetime)
- TrangThai (enum): 
  • DaYeuCau
  • ChoXacNhan
  • DaXacNhan
  • DaDoiLich
  • HuyBoiKhach
  • HuyBoiHeThong
  • KhachKhongDen
  • HoanThanh
- PheDuyetChuDuAn (enum):
  • ChoPheDuyet
  • DaPheDuyet
  • TuChoi
- LyDoTuChoi (text)
- PhuongThucVao (text) - Hướng dẫn vào dự án
- ThoiGianPheDuyet (datetime)
- SoLanDoiLich (int)
- GhiChuKetQua (text)
- TaoLuc, CapNhatLuc
```

### Quan hệ:
- `cuochen` → `phong` → `tindang` → `duan` (lọc theo ChuDuAnID)
- `cuochen` → `nguoidung` (KhachHang, NhanVienBanHang)

---

## 🎨 Thiết kế UI - Light Glass Morphism Theme

### **1. Metrics Dashboard (Đầu trang)**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 TỔNG QUAN CUỘC HẸN                                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ 🔔 Chờ duyệt│ ✅ Đã xác   │ 📅 Sắp diễn │ ❌ Đã hủy    │ 🎯 Hoàn  │
│     12      │ nhận: 45    │ ra: 8       │    15       │ thành: 32│
│  (+3 mới)   │ (93% ratio) │ (trong 24h) │             │          │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

### **2. Bộ lọc thông minh (Smart Filters)**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Tìm kiếm: [___________________] 🔽 Dự án  🔽 Trạng thái     │
│                                                                  │
│ 📅 Thời gian: [ Hôm nay ▼ ]  🏠 Phòng: [ Tất cả ▼ ]           │
│                                                                  │
│ 🎯 Quick filters:                                               │
│ [ Chờ duyệt (12) ] [ Sắp diễn ra (8) ] [ Cần xử lý (5) ]      │
└─────────────────────────────────────────────────────────────────┘
```

### **3. Danh sách cuộc hẹn (Table/Card View)**

#### **3.1. Desktop - Table View với Timeline**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📅 Thời gian      │ 👤 Khách hàng    │ 🏠 Phòng       │ 🎯 Trạng thái  │
├───────────────────┼──────────────────┼────────────────┼────────────────┤
│ 🔴 14:00 hôm nay │ Nguyễn Văn A     │ Phòng 101      │ ⏰ Chờ duyệt   │
│ ⏱️ Còn 2 giờ     │ 📱 0909***123    │ Căn hộ Sunrise │ [Duyệt] [Từ chối]│
│                  │                  │                │ [Chi tiết]      │
├───────────────────┼──────────────────┼────────────────┼────────────────┤
│ 🟡 10:00 ngày mai│ Trần Thị B       │ Phòng 205      │ ✅ Đã xác nhận │
│                  │ 📱 0912***456    │ Chung cư Green │ 👨‍💼 NV: Mai    │
│                  │                  │                │ [Đổi lịch] [Hủy]│
├───────────────────┼──────────────────┼────────────────┼────────────────┤
│ 🔵 15:00 T7      │ Lê Văn C         │ Phòng Studio   │ 📅 Đã đặt lịch │
│                  │ 📱 0903***789    │ Villa Parkview │ [Gửi hướng dẫn]│
└───────────────────┴──────────────────┴────────────────┴────────────────┘
```

#### **3.2. Mobile - Card View**
```
┌──────────────────────────────────────────┐
│ 🔴 Chờ duyệt - Còn 2 giờ                │
├──────────────────────────────────────────┤
│ 📅 14:00 hôm nay, 24/10/2025           │
│ 👤 Nguyễn Văn A (0909***123)           │
│ 🏠 Phòng 101 - Căn hộ Sunrise          │
│                                          │
│ [✅ Duyệt] [❌ Từ chối] [👁️ Chi tiết] │
└──────────────────────────────────────────┘
```

### **4. Modal Chi tiết cuộc hẹn**
```
┌──────────────────────────────────────────────────────────────┐
│  📋 CHI TIẾT CUỘC HẸN #12345                         [X]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 THÔNG TIN CUỘC HẸN                                       │
│  ├─ Thời gian: 14:00, Thứ 5, 24/10/2025                    │
│  ├─ Trạng thái: ⏰ Chờ phê duyệt của chủ dự án              │
│  ├─ Số lần đổi lịch: 0/3                                    │
│  └─ Tạo lúc: 13:45, 24/10/2025                             │
│                                                               │
│  👤 THÔNG TIN KHÁCH HÀNG                                     │
│  ├─ Họ tên: Nguyễn Văn A                                    │
│  ├─ Số điện thoại: 0909123456                               │
│  ├─ Email: nguyenvana@example.com                           │
│  └─ Xác minh: ✅ KYC đã hoàn thành                          │
│                                                               │
│  🏠 THÔNG TIN PHÒNG                                          │
│  ├─ Dự án: Căn hộ Sunrise Tower                            │
│  ├─ Phòng: 101 (Tầng 10)                                    │
│  ├─ Giá thuê: 8.500.000 ₫/tháng                            │
│  └─ Trạng thái: Còn trống                                   │
│                                                               │
│  👨‍💼 NHÂN VIÊN PHỤ TRÁCH                                    │
│  ├─ Họ tên: Nguyễn Thị Mai                                  │
│  ├─ Số điện thoại: 0911222333                               │
│  └─ Đánh giá: ⭐⭐⭐⭐⭐ (4.8/5)                              │
│                                                               │
│  📝 GHI CHÚ TỪ KHÁCH HÀNG                                    │
│  "Tôi muốn xem phòng vào buổi chiều, có thể sắp xếp được   │
│   không? Tôi quan tâm đến ánh sáng và view ban công."       │
│                                                               │
│  🚪 HƯỚNG DẪN VÀO DỰ ÁN                                      │
│  [Mật khẩu cửa: 123456#]                                    │
│  [Lấy chìa khóa tại: Bảo vệ tầng 1]                         │
│  [Gặp NV tại: Sảnh chính lúc 14:00]                         │
│                                                               │
│  📜 LỊCH SỬ THAY ĐỔI                                         │
│  • 13:45 - Khách hàng tạo yêu cầu                           │
│  • 13:50 - Hệ thống gán NV Mai                             │
│  • Đang chờ phê duyệt của bạn...                            │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  HÀNH ĐỘNG                                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅ Phê duyệt cuộc hẹn                                  │  │
│  │ • Tự động gửi hướng dẫn vào dự án cho khách           │  │
│  │ • Thông báo cho NV và khách qua SMS/Email             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ❌ Từ chối cuộc hẹn                                    │  │
│  │ Lý do từ chối: [_____________________________]        │  │
│  │ • Phòng đã cho thuê                                    │  │
│  │ • Khung giờ không phù hợp                              │  │
│  │ • Khác (ghi rõ lý do)                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [💬 Nhắn tin cho khách] [📞 Gọi điện] [🗓️ Đề xuất lịch khác]│
│                                                               │
│  [Đóng]                                   [✅ Lưu thay đổi] │
└──────────────────────────────────────────────────────────────┘
```

### **5. Actions cho từng trạng thái**

| Trạng thái          | Actions có thể thực hiện                                |
|---------------------|---------------------------------------------------------|
| **ChoPheDuyet**     | ✅ Phê duyệt / ❌ Từ chối / 💬 Nhắn tin / 📞 Gọi       |
| **DaPheDuyet**      | ✏️ Đổi lịch / ❌ Hủy hẹn / 🚪 Gửi hướng dẫn / 💬 Chat |
| **DaXacNhan**       | 📋 Xem chi tiết / ✅ Đánh dấu hoàn thành / ❌ Báo no-show |
| **HoanThanh**       | 📊 Xem kết quả / 💰 Kiểm tra cọc / 📝 Ghi chú         |
| **KhachKhongDen**   | 🔄 Đặt lại lịch / 📝 Xem lý do / 📊 Báo cáo            |
| **TuChoi**          | 👁️ Xem lý do / 📝 Ghi chú                              |

---

## 🎯 Tính năng đặc biệt

### **6.1. Quick Actions (Floating Menu)**
```
                    [+]
                     │
        ┌────────────┼────────────┐
        │            │            │
   [📊 Thống kê] [🔔 Thông báo] [📥 Export]
```

### **6.2. Bulk Actions (Chọn nhiều)**
```
☑️ Chọn tất cả (15)  [Thao tác hàng loạt ▼]
  ├─ ✅ Phê duyệt các cuộc hẹn đã chọn
  ├─ 🚪 Gửi hướng dẫn hàng loạt
  ├─ 📧 Gửi email nhắc nhở
  └─ 📊 Export báo cáo
```

### **6.3. Timeline View (Lịch tuần)**
```
┌─────────────────────────────────────────────────────────────────┐
│  T2 (23/10)  │  T3 (24/10)  │  T4 (25/10)  │  T5 (26/10)  ...  │
├──────────────┼──────────────┼──────────────┼──────────────┼─────┤
│ 09:00        │              │              │              │     │
│              │ 🔴 14:00 (A) │              │              │     │
│ 10:00        │              │ 🟡 10:00 (B) │              │     │
│              │ 🟢 15:00 (C) │              │ 🔵 16:00 (D) │     │
│ ...          │ ...          │ ...          │ ...          │ ... │
└──────────────┴──────────────┴──────────────┴──────────────┴─────┘
```

### **6.4. Smart Notifications**
```
🔔 Thông báo thông minh:
  • "Bạn có 12 cuộc hẹn chờ phê duyệt"
  • "3 cuộc hẹn sắp diễn ra trong 2 giờ tới"
  • "Cuộc hẹn #12345 đã được khách hàng đổi lịch"
  • "NV Mai đã xác nhận đến cuộc hẹn"
```

### **6.5. Automated Workflows**
```
Tự động hóa:
  ✅ Gửi SMS/Email xác nhận sau khi phê duyệt
  ✅ Nhắc nhở trước cuộc hẹn 1 giờ
  ✅ Thu thập feedback sau cuộc hẹn
  ✅ Cập nhật trạng thái phòng tự động
  ✅ Tính toán KPI hiệu suất
```

---

## 🎨 UI Components cần thiết

### **Component List:**
1. **QuanLyCuocHen.jsx** - Main page
2. **CuocHenTable.jsx** - Table component với sorting/filtering
3. **CuocHenCard.jsx** - Mobile card view
4. **ModalChiTietCuocHen.jsx** - Chi tiết & actions
5. **ModalPheDuyet.jsx** - Form phê duyệt/từ chối
6. **ModalDoiLich.jsx** - Form đổi lịch
7. **TimelineView.jsx** - Calendar timeline
8. **MetricsCuocHen.jsx** - Dashboard metrics
9. **FilterBar.jsx** - Smart filters component
10. **BulkActionsBar.jsx** - Bulk actions toolbar

---

## 📊 API Endpoints cần có

### **Backend APIs:**
```javascript
// Danh sách cuộc hẹn
GET /api/chu-du-an/cuoc-hen
  ?trangThai=ChoPheDuyet
  &duAnId=123
  &tuNgay=2025-10-24
  &denNgay=2025-10-30
  &page=1&limit=20

// Chi tiết cuộc hẹn
GET /api/chu-du-an/cuoc-hen/:id

// Phê duyệt cuộc hẹn
POST /api/chu-du-an/cuoc-hen/:id/phe-duyet
  { phuongThucVao: "Mật khẩu: 123456#", ghiChu: "..." }

// Từ chối cuộc hẹn
POST /api/chu-du-an/cuoc-hen/:id/tu-choi
  { lyDoTuChoi: "Phòng đã cho thuê", ghiChu: "..." }

// Đổi lịch cuộc hẹn
PUT /api/chu-du-an/cuoc-hen/:id/doi-lich
  { thoiGianHenMoi: "2025-10-25 10:00:00", lyDo: "..." }

// Hủy cuộc hẹn
POST /api/chu-du-an/cuoc-hen/:id/huy
  { lyDoHuy: "Khách hàng yêu cầu", ghiChu: "..." }

// Đánh dấu hoàn thành
POST /api/chu-du-an/cuoc-hen/:id/hoan-thanh
  { ghiChuKetQua: "Khách hài lòng, đặt cọc", datCoc: true }

// Báo no-show
POST /api/chu-du-an/cuoc-hen/:id/khach-khong-den
  { lyDo: "Không liên lạc được", ghiChu: "..." }

// Gửi hướng dẫn
POST /api/chu-du-an/cuoc-hen/:id/gui-huong-dan
  { phuongThuc: "sms|email|both" }

// Bulk actions
POST /api/chu-du-an/cuoc-hen/bulk-action
  { action: "phe-duyet", cuocHenIds: [1,2,3], data: {...} }

// Export báo cáo
GET /api/chu-du-an/cuoc-hen/export
  ?format=excel&tuNgay=...&denNgay=...

// Dashboard metrics
GET /api/chu-du-an/cuoc-hen/metrics
  ?tuNgay=...&denNgay=...
```

---

## 🎯 User Flow

### **Flow 1: Phê duyệt cuộc hẹn (UC-PROJ-02)**
```
1. Chủ dự án vào trang Quản lý cuộc hẹn
2. Nhìn thấy badge "Chờ duyệt (12)" đỏ nổi bật
3. Click vào cuộc hẹn hoặc nút "Duyệt"
4. Modal hiện chi tiết đầy đủ
5. Nhập hướng dẫn vào dự án (nếu chưa có)
6. Click "✅ Phê duyệt"
7. Hệ thống:
   - Cập nhật PheDuyetChuDuAn = 'DaPheDuyet'
   - Cập nhật TrangThai = 'DaXacNhan'
   - Ghi ThoiGianPheDuyet
   - Gửi SMS/Email cho khách & NV
   - Ghi audit log
8. Toast: "Đã phê duyệt cuộc hẹn #12345"
9. Refresh danh sách tự động
```

### **Flow 2: Từ chối cuộc hẹn**
```
1. Click "❌ Từ chối"
2. Modal hiện form lý do (required)
3. Chọn/nhập lý do:
   - [ ] Phòng đã cho thuê
   - [ ] Khung giờ không phù hợp
   - [ ] Khách hàng không đủ điều kiện
   - [ ] Khác: [________________]
4. Click "Xác nhận từ chối"
5. Hệ thống:
   - Cập nhật PheDuyetChuDuAn = 'TuChoi'
   - Lưu LyDoTuChoi
   - Ghi ThoiGianPheDuyet
   - Gửi thông báo lịch sự cho khách
   - Đề xuất tin đăng khác phù hợp
   - Ghi audit log
6. Toast: "Đã từ chối cuộc hẹn #12345"
```

### **Flow 3: Theo dõi cuộc hẹn sắp diễn ra**
```
1. Dashboard hiện "📅 Sắp diễn ra: 8"
2. Click vào metric card
3. Filter tự động: TrangThai = 'DaXacNhan' 
                  AND ThoiGianHen IN (next 24 hours)
4. Hiện danh sách với countdown timer
5. Có thể:
   - Gửi tin nhắc nhở
   - Gọi điện cho khách/NV
   - Xem hướng dẫn đã gửi
```

---

## 🎨 Design Tokens (CSS Variables)

```css
/* Màu trạng thái cuộc hẹn */
--cuoc-hen-cho-duyet: #ef4444;        /* Red - Urgent */
--cuoc-hen-da-xac-nhan: #10b981;      /* Green - Success */
--cuoc-hen-da-doi-lich: #f59e0b;      /* Orange - Warning */
--cuoc-hen-hoan-thanh: #3b82f6;       /* Blue - Info */
--cuoc-hen-huy: #6b7280;              /* Gray - Neutral */
--cuoc-hen-khach-khong-den: #dc2626;  /* Dark Red - Error */

/* Timeline colors */
--timeline-past: #e5e7eb;
--timeline-today: #8b5cf6;
--timeline-future: #d1d5db;

/* Priority levels */
--priority-high: #ef4444;
--priority-medium: #f59e0b;
--priority-low: #10b981;
```

---

## 📱 Responsive Design

### **Breakpoints:**
- **Desktop (≥1280px)**: Table view với đầy đủ columns
- **Laptop (1024-1279px)**: Table view thu gọn
- **Tablet (768-1023px)**: Card view + Timeline horizontal scroll
- **Mobile (<768px)**: Card view stacked + Bottom sheet actions

### **Mobile Optimizations:**
- Swipe actions (swipe right = phê duyệt, swipe left = từ chối)
- Bottom sheet modals thay vì center modals
- Call-to-action buttons lớn (min 48px height)
- Touch-friendly spacing (min 12px gap)

---

## ✅ Nghiệm thu (Acceptance Criteria)

### **Functional:**
- [ ] Hiển thị đúng danh sách cuộc hẹn theo ChuDuAnID
- [ ] Phê duyệt/từ chối cuộc hẹn thành công
- [ ] Gửi thông báo đúng format và timing
- [ ] Filter/search hoạt động chính xác
- [ ] Timeline view render đúng events
- [ ] Bulk actions xử lý đúng multiple items
- [ ] Export Excel/PDF thành công

### **Performance:**
- [ ] P95 load time ≤ 2s
- [ ] Smooth scrolling với 100+ items
- [ ] Real-time updates (WebSocket/polling)

### **Security:**
- [ ] Chỉ xem cuộc hẹn của dự án mình sở hữu
- [ ] Audit log đầy đủ mọi hành động
- [ ] Rate limiting cho bulk actions

### **UX:**
- [ ] Loading states rõ ràng
- [ ] Error messages thân thiện
- [ ] Empty states có hướng dẫn
- [ ] Toast notifications không làm phiền
- [ ] Keyboard shortcuts (Esc, Enter, Tab)

---

## 🚀 Implementation Priority

### **Phase 1 (Must-have):**
1. Danh sách cuộc hẹn với filters cơ bản
2. Modal chi tiết
3. Phê duyệt/từ chối cuộc hẹn
4. Gửi hướng dẫn vào dự án
5. Dashboard metrics

### **Phase 2 (Should-have):**
6. Timeline view
7. Bulk actions
8. Đổi lịch/hủy hẹn
9. Real-time notifications
10. Export báo cáo

### **Phase 3 (Nice-to-have):**
11. Chat tích hợp trong modal
12. Video call integration
13. AI suggestions (slot tốt nhất)
14. Predictive analytics
15. Mobile app deep links

---

## 📝 Notes cho Developer

### **Backend:**
- Sử dụng transaction cho update trạng thái
- Index columns: ChuDuAnID, TrangThai, ThoiGianHen, PheDuyetChuDuAn
- Cron job: Tự động đánh dấu "KhachKhongDen" nếu quá 30 phút không check-in
- Rate limit: 100 requests/minute cho bulk actions
- Audit log: Mọi thay đổi trạng thái, từ chối, đổi lịch

### **Frontend:**
- React Query cho caching & optimistic updates
- Debounce search input (300ms)
- Virtualized list cho 500+ items
- LocalStorage cho saved filters
- Service Worker cho offline support

### **Testing:**
- Unit tests cho filters/sort logic
- Integration tests cho API calls
- E2E tests cho critical flows (phê duyệt, từ chối)
- Load testing với 1000+ concurrent users

---

**Tài liệu này cung cấp đầy đủ thông tin để implement trang Quản lý Cuộc hẹn cho Chủ dự án.**
