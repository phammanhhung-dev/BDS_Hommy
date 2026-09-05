# 🔍 Hướng dẫn Test Đăng nhập Nhân viên Điều hành

## ✅ Đã sửa các lỗi sau:

### 1. **Export Issues trong `operatorApi.js`**
- ✅ Thêm `export { operatorApi }` và `export default operatorApi`
- ✅ `nhanVienApi` và `bienBanApi` đã có named exports

### 2. **API Method Names**
- ✅ Thêm `duyetTinDang()`, `tuChoiTinDang()` (aliases)
- ✅ Thêm `getLichThang(year, month)`
- ✅ Thêm `getDanhSachKhaDung()` cho nhân viên
- ✅ Rename methods trong `bienBanApi`: `taoMoi()`, `ky()`, `getDanhSach()`

### 3. **Login Redirect Logic**
- ✅ Thêm console.log debug để track VaiTroID
- ✅ Logic redirect đã có sẵn:
  - `VaiTroID = 2` → `/nhan-vien-ban-hang`
  - `VaiTroID = 3` → `/chu-du-an/dashboard`
  - `VaiTroID = 4` → `/operator/dashboard` ✅
  - `VaiTroID = 5` → `/operator/dashboard`
  - Default → `/` (trang chủ)

---

## 🚀 Các bước Test

### Bước 1: Tạo tài khoản Operator trong Database

**Option A: Dùng phpMyAdmin**
1. Mở `http://localhost/phpmyadmin`
2. Chọn database `daphongtro`
3. Vào tab "SQL"
4. Paste nội dung file `create-operator-account.sql`
5. Click "Go"

**Option B: Import từ file SQL**
```bash
# Từ thư mục gốc dự án
mysql -u root daphongtro < create-operator-account.sql
```

**Tài khoản được tạo:**
- Email: `operator@daphongtro.com`
- Password: `operator123`
- VaiTroHoatDongID: `4` (Nhân viên Điều hành)

---

### Bước 2: Khởi động Backend & Frontend

**Terminal 1 - Backend:**
```bash
cd server
npm start
# Hoặc: node index.js
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# URL: http://localhost:5173
```

---

### Bước 3: Test Đăng nhập

1. Truy cập: `http://localhost:5173/login`

2. Nhập thông tin:
   - Email: `operator@daphongtro.com`
   - Password: `operator123`

3. Click "Đăng nhập"

4. **Kiểm tra Console log (F12):**
   ```javascript
   📊 Login Debug: {
     vaiTroId: 4,
     tenVaiTro: "Nhân viên Điều hành",
     VaiTroHoatDongID: 4,
     VaiTroID: 4,
     fullUser: {...}
   }
   ✅ Redirecting to Operator Dashboard
   ```

5. **Expected result:**
   - Redirect sang: `http://localhost:5173/operator/dashboard`
   - Hiển thị Dashboard Operator với glass morphism design
   - Navigation sidebar hiển thị menu items:
     - Dashboard
     - Duyệt Tin đăng
     - Quản lý Dự án
     - Lịch NVBH
     - Quản lý Nhân viên
     - Biên bản Bàn giao

---

## 🔍 Troubleshooting

### Nếu redirect về trang chủ `/` thay vì `/operator/dashboard`:

**Check 1: Xem console log**
```javascript
// Nếu thấy:
vaiTroId: null
// hoặc
vaiTroId: undefined
```
→ **Backend không trả về VaiTroHoatDongID/VaiTroID**

**Fix:**
- Kiểm tra `server/controllers/authController.js` line 22-28
- Đảm bảo query JOIN với bảng `vaitro`
- Kiểm tra user trong DB có `VaiTroHoatDongID = 4` chưa

---

### Nếu trang Operator blank/lỗi:

**Check 2: Xem lỗi trong Console (F12)**

**Lỗi thường gặp:**

1. **`operatorApi is not defined`**
   ```
   Fix: Import đã sửa trong operatorApi.js
   ```

2. **`Cannot read property 'tinDang' of undefined`**
   ```
   Fix: operatorApi.tinDang → tinDangOperatorApi
   hoặc import { operatorApi } from '../../services/operatorApi'
   ```

3. **API calls 404**
   ```
   Fix: Kiểm tra backend routes trong server/index.js
   Đảm bảo có:
   app.use('/api/operator', operatorRoutes);
   ```

---

## 📋 Checklist Test đầy đủ

- [ ] Tài khoản Operator đã được tạo trong DB
- [ ] Backend đang chạy trên port 5000
- [ ] Frontend đang chạy trên port 5173
- [ ] Đăng nhập với `operator@daphongtro.com` / `operator123`
- [ ] Console log hiển thị `vaiTroId: 4`
- [ ] Redirect đến `/operator/dashboard`
- [ ] Dashboard hiển thị đúng layout (glass morphism)
- [ ] Sidebar navigation hoạt động
- [ ] Metrics cards hiển thị (hoặc loading state)

---

## 🎯 Next Steps

Sau khi đăng nhập thành công, test các tính năng:

1. **Duyệt Tin đăng** (`/operator/duyet-tin-dang`)
2. **Quản lý Dự án** (`/operator/du-an`)
3. **Lịch NVBH** (`/operator/lich-nvbh`)
4. **Quản lý Nhân viên** (`/operator/nhan-vien`)
5. **Biên bản Bàn giao** (`/operator/bien-ban`)

---

## 📝 Notes

- Mật khẩu đã hash MD5 (production nên dùng bcrypt)
- Token được lưu trong `localStorage` với key `token`
- User info được lưu trong `localStorage` với key `user`
- API base URL: `http://localhost:5000` (config trong `operatorApi.js`)

---

**Created:** 2025-01-06
**Status:** ✅ READY FOR TESTING





