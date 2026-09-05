# 🧪 Testing Guide: Nhân viên Bán hàng Module

Hướng dẫn test đầy đủ cho module Nhân viên Bán hàng (UC-SALE-01 đến UC-SALE-07)

---

## 📋 Prerequisites

### ✅ Requirements
- XAMPP/MySQL đang chạy
- Backend server running (`npm start` trong `server/`)
- Frontend dev server running (`npm run dev` trong `client/`)

---

## 🚀 Quick Start (5 phút)

### Bước 1: Chạy Migration (30 giây)

```bash
# Via XAMPP MySQL (adjust path to your XAMPP installation)
cd D:\Vo Nguyen Hoanh Hop_J Liff\xampp\mysql\bin
.\mysql.exe -u root -e "source D:\path\to\daphongtro\migrations\2025_11_06_fix_nguoidung_vaitro.sql"
```

**Hoặc qua phpMyAdmin:**
1. Vào http://localhost/phpmyadmin
2. Chọn database `thue_tro`
3. Tab "SQL" > Copy nội dung file `migrations/2025_11_06_fix_nguoidung_vaitro.sql`
4. Click "Go"

✅ **Kết quả:** 
- User `banhang@gmail.com` có entry trong `nguoidung_vaitro` (VaiTroID=2)
- Triggers tự động sync `VaiTroHoatDongID` → `nguoidung_vaitro` cho future updates

---

### Bước 2: Login (30 giây)

1. Mở trình duyệt: http://localhost:5173/login
2. **Credentials:**
   - **Email:** `banhang@gmail.com`
   - **Password:** `123456`
3. Click "Đăng nhập"

✅ **Expected:** Redirect đến `/nhan-vien-ban-hang` (Dashboard Nhân viên Bán hàng)

---

## 🎯 Test Cases by Use Case

### UC-SALE-01: Lịch làm việc

**URL:** `/nhan-vien-ban-hang/lich-lam-viec`

#### Test Cases:
1. **Xem lịch tuần này**
   - ✅ Thấy calendar view với 7 ngày
   - ✅ Các ca làm việc hiển thị đúng khung giờ
   
2. **Tạo ca làm việc mới**
   - Click "Tạo Ca Làm Việc"
   - Chọn ngày, giờ bắt đầu/kết thúc
   - ✅ Ca mới xuất hiện trên calendar
   
3. **Xóa ca làm việc**
   - Click vào ca, chọn "Xóa"
   - ✅ Ca bị xóa khỏi calendar

---

### UC-SALE-02 & UC-SALE-03: Quản lý Cuộc hẹn

**URL:** `/nhan-vien-ban-hang/cuoc-hen`

#### Test Cases:
1. **Xem danh sách cuộc hẹn**
   - ✅ Thấy list cuộc hẹn với trạng thái màu sắc
   - ✅ Filter theo trạng thái hoạt động
   
2. **Xác nhận cuộc hẹn**
   - Click "Xác nhận" trên cuộc hẹn `ChoXacNhan`
   - ✅ Status → `DaXacNhan`
   - ✅ Toast notification xuất hiện
   
3. **Đổi lịch cuộc hẹn**
   - Click "Đổi lịch"
   - Chọn ngày/giờ mới
   - ✅ Cuộc hẹn được cập nhật
   
4. **Hủy cuộc hẹn**
   - Click "Hủy", nhập lý do
   - ✅ Status → `DaHuy`
   
5. **Chi tiết cuộc hẹn**
   - Click vào cuộc hẹn
   - ✅ Thấy timeline, map, thông tin khách
   - ✅ Actions (Xác nhận/Đổi lịch/Hủy) hoạt động

---

### UC-SALE-04: Quản lý Giao dịch

**URL:** `/nhan-vien-ban-hang/giao-dich`

#### Test Cases:
1. **Xem danh sách giao dịch**
   - ✅ Thấy list với đầy đủ thông tin
   - ✅ Badge trạng thái màu sắc đúng
   
2. **Xác nhận đã cọc**
   - Click "Xác nhận Cọc"
   - Upload file scan (PDF/image)
   - ✅ Status → `DaCoc`
   - ✅ File được upload thành công
   
3. **Filter giao dịch**
   - Filter theo trạng thái: `ChoXacNhan`, `DaCoc`, `HoanThanh`
   - ✅ Kết quả filter đúng

---

### UC-SALE-05: Báo cáo kết quả

**Embedded in:** Chi tiết cuộc hẹn

#### Test Cases:
1. **Báo cáo sau cuộc hẹn**
   - Trong chi tiết cuộc hẹn, click "Báo cáo"
   - Chọn kết quả: `ThanhCong`/`ThatBai`/`KhachKhongDen`
   - Nhập ghi chú
   - Rate 5 sao
   - ✅ Báo cáo được lưu, status updated

---

### UC-SALE-06: Báo cáo Thu nhập

**URL:** `/nhan-vien-ban-hang/thu-nhap`

#### Test Cases:
1. **Xem tổng quan**
   - ✅ 3 metric cards: Tổng Thu Nhập, Hoa Hồng, Giao Dịch
   - ✅ Numbers hiển thị đúng format (VND)
   
2. **Xem biểu đồ**
   - ✅ Line chart: Thu nhập theo ngày
   - ✅ Bar chart: Hoa hồng theo tuần
   - ✅ Pie chart: Giao dịch theo trạng thái
   
3. **Xem bảng chi tiết**
   - ✅ Table hoa hồng với pagination
   - ✅ Sắp xếp theo cột
   
4. **Export báo cáo**
   - Click "Export PDF"
   - ✅ File PDF download
   - Click "Export Excel"
   - ✅ File Excel download

---

### UC-SALE-07: Tin nhắn

**URL:** `/nhan-vien-ban-hang/tin-nhan`

#### Test Cases:
1. **Xem danh sách cuộc hội thoại**
   - ✅ Sidebar với list conversations
   - ✅ Unread count badge
   
2. **Chat real-time**
   - Chọn conversation
   - Gửi tin nhắn
   - ✅ Tin nhắn xuất hiện ngay
   - ✅ Socket.IO real-time update
   
3. **Upload file**
   - Click attach, chọn file
   - ✅ File được upload và hiển thị
   
4. **Typing indicator**
   - Gõ tin nhắn
   - ✅ "đang soạn tin..." xuất hiện cho người khác

---

## 🎨 UI/UX Testing

### Design System
- ✅ Corporate Blue palette (#1e40af, #3b82f6, #60a5fa)
- ✅ Glass morphism effects hoạt động
- ✅ Smooth animations và transitions

### Responsive Design
- ✅ **Desktop (>1024px):** Full layout
- ✅ **Tablet (768-1024px):** Responsive grid
- ✅ **Mobile (<768px):** Mobile-first layout

### Accessibility
- ✅ ARIA labels present
- ✅ Keyboard navigation
- ✅ Focus states visible

---

## 🐛 Common Issues & Solutions

### Issue 1: Cannot login / 403 Forbidden Errors
**Problem:** 
- Frontend redirect to `/` thay vì `/nhan-vien-ban-hang`
- Backend API returns 403 Forbidden: "Người dùng chưa được gán vai trò"

**Root Cause:**
User có `VaiTroHoatDongID=2` trong `nguoidung` table nhưng **thiếu entry** trong `nguoidung_vaitro` table. Backend middleware check `nguoidung_vaitro` để authorize.

**Solution:**
```bash
# Run migration to fix nguoidung_vaitro
mysql -u root thue_tro < migrations/2025_11_06_fix_nguoidung_vaitro.sql
```

**Verify:**
```sql
-- Check both tables
SELECT 
  n.Email, 
  n.VaiTroHoatDongID,
  nv.VaiTroID AS RoleInNguoiDungVaiTro
FROM nguoidung n
LEFT JOIN nguoidung_vaitro nv ON n.NguoiDungID = nv.NguoiDungID
WHERE Email = 'banhang@gmail.com';

-- Expected: VaiTroHoatDongID = 2, RoleInNguoiDungVaiTro = 2
-- If RoleInNguoiDungVaiTro is NULL → Migration not run!
```

---

---

### Issue 2: 500 Error - "Unknown column 'p.Gia'"
**Problem:** 
```
GET /api/nhan-vien-ban-hang/cuoc-hen 500 (Internal Server Error)
Unknown column 'p.Gia' in 'field list'
```

**Root Cause:**
Backend query uses old schema column `p.Gia`, but schema redesign (2025-10-09) changed it to:
- `phong.GiaChuan` (base price)
- `phong_tindang.GiaTinDang` (override per listing)

**Solution:**
Already fixed in code. If you see this error:
1. Pull latest changes from `server/controllers/NhanVienBanHangController.js`
2. Restart backend server

**Verify Fix:**
```sql
-- Check phong table columns
DESCRIBE phong;
-- Should see: GiaChuan (not Gia)

-- Check controller query (line 197)
COALESCE(pt.GiaTinDang, p.GiaChuan, 0) as Gia  -- ✅ Correct
```

---

### Issue 3: 400 Error - Thu Nhập Report Parameter Mismatch
**Problem:**
```
GET /api/nhan-vien-ban-hang/bao-cao/thu-nhap?from=2025-10-31&to=2025-11-06 400 (Bad Request)
Message: "Thiếu tham số tuNgay và denNgay"
```

**Root Cause:**
Frontend sends `?from=...&to=...` but backend expects `?tuNgay=...&denNgay=...`

**Solution:**
Already fixed in code (accepts both formats). If you see this error:
1. Pull latest changes from `server/controllers/NhanVienBanHangController.js`
2. Restart backend server

**Alternative:**
Update frontend to send correct params:
```javascript
// Option 1: Change frontend API call
const params = { tuNgay: from, denNgay: to };

// Option 2: Use backend fix (accepts both)
const params = { from, to }; // ✅ Works now
```

---

### Issue 4: API returns 404
**Problem:** Backend routes not found

**Solution:**
```bash
# Check backend logs
cd server
npm start
# Ensure message: "API Nhân viên Bán hàng (/api/nhan-vien-ban-hang)"
```

**Verify routes registered:**
```bash
curl http://localhost:5000/api/nhan-vien-ban-hang/dashboard
# Should return 401 (unauthorized), not 404
```

---

### Issue 3: Charts không hiển thị
**Problem:** Recharts component error

**Solution:**
```bash
cd client
npm install recharts
npm run dev
```

---

### Issue 4: Socket.IO không connect
**Problem:** Real-time chat không hoạt động

**Check:**
1. Backend Socket.IO server running (port 5000)
2. Browser console: `ws://mt5vhvtq-5000.asse.devtunnels.ms/`
3. JWT token trong localStorage

**Solution:**
```bash
# Backend terminal
cd server
npm install socket.io
npm start
# Look for: "🔌 Socket.IO initialized"

# Frontend terminal
cd client
npm install socket.io-client
npm run dev
```

---

## 📊 Performance Testing

### Load Testing
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/nhan-vien-ban-hang/dashboard
```

**Expected:**
- Requests per second: >500
- Time per request: <20ms
- Failed requests: 0

---

## 🔒 Security Testing

### JWT Token
- ✅ Token stored in localStorage
- ✅ Token sent in Authorization header
- ✅ 401 response on expired token

### Input Validation
- ✅ XSS protection (DOMPurify)
- ✅ SQL injection protection (parameterized queries)
- ✅ File upload validation (size, type)

---

## 📸 Screenshots Expected

### Dashboard
![Dashboard](docs/screenshots/nvbh-dashboard.png)
- Metric cards
- Today's schedule
- Quick actions

### Lịch làm việc
![Lịch làm việc](docs/screenshots/nvbh-lich-lam-viec.png)
- Calendar grid
- Ca làm việc slots
- Create modal

### Cuộc hẹn
![Cuộc hẹn](docs/screenshots/nvbh-cuoc-hen.png)
- Filter bar
- List with status badges
- Timeline view

### Thu nhập
![Thu nhập](docs/screenshots/nvbh-thu-nhap.png)
- Charts (Line, Bar, Pie)
- Commission table
- Export buttons

---

## ✅ Test Completion Checklist

### Functional Testing
- [ ] UC-SALE-01: Lịch làm việc
- [ ] UC-SALE-02: Xem cuộc hẹn
- [ ] UC-SALE-03: Xử lý cuộc hẹn
- [ ] UC-SALE-04: Quản lý giao dịch
- [ ] UC-SALE-05: Báo cáo kết quả
- [ ] UC-SALE-06: Báo cáo thu nhập
- [ ] UC-SALE-07: Tin nhắn

### UI/UX Testing
- [ ] Corporate Blue theme consistent
- [ ] Glass morphism effects work
- [ ] Responsive design (3 breakpoints)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### Integration Testing
- [ ] API endpoints (19 total)
- [ ] Socket.IO real-time
- [ ] File uploads
- [ ] Authentication/Authorization

### Performance Testing
- [ ] Page load <2s
- [ ] API response <200ms
- [ ] Charts render smoothly

### Security Testing
- [ ] JWT validation
- [ ] Role-based access
- [ ] Input sanitization

---

## 📞 Support

**Issues?** Check:
1. Backend console logs: `server/` terminal
2. Frontend console: Browser DevTools (F12)
3. Network tab: Check API calls and responses
4. Database: Verify test data exists

**Need help?** Contact dev team or create issue.

---

## 📚 Related Documentation

- [Use Cases v1.2](docs/use-cases-v1.2.md) - Business logic specs
- [Implementation Guide](docs/NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md) - Technical details
- [API Documentation](server/routes/nhanVienBanHangRoutes.js) - Endpoint specs
- [Database Schema](migrations/2025_11_06_nhan_vien_ban_hang_schema.sql) - DB structure

---

**Last Updated:** 2025-11-06
**Status:** ✅ Ready for Testing
**Tester:** QA Team

