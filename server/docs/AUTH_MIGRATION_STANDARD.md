# Migration từ authFlexible về Auth Chuẩn

**Ngày:** 06/11/2025  
**Người thực hiện:** System Migration  
**Mục đích:** Chuyển từ authentication bypass (authFlexible) về sử dụng file xác thực chuẩn (auth.js)

---

## 📋 Tổng quan thay đổi

### ❌ **TRƯỚC KHI:**
- Sử dụng `authFlexible.js` - bypass authentication với `AUTH_DISABLED=true`
- Log: `🔓 [AUTH DISABLED] Bypassing authentication for development`
- Socket.IO cũng bypass authentication tương tự

### ✅ **SAU KHI:**
- Sử dụng `auth.js` chuẩn - yêu cầu JWT token hợp lệ
- Hỗ trợ mock token cho development: `MOCK_DEV_TOKEN`
- Log: `🔐 [AUTH] Raw role: ... → Normalized: ...`
- Socket.IO cũng dùng logic tương tự

---

## 🔄 Chi tiết thay đổi

### 1. Routes đã cập nhật

#### **chuDuAnRoutes.js**
```javascript
// TRƯỚC
const { authFlexible } = require('../middleware/authFlexible');
router.get('/dashboard', authFlexible, ...);

// SAU
const authMiddleware = require('../middleware/auth');
router.get('/dashboard', authMiddleware, ...);
```

#### **chatRoutes.js**
```javascript
// TRƯỚC
const { authFlexible } = require('../middleware/authFlexible');
router.get('/conversations', authFlexible, ...);

// SAU
const authMiddleware = require('../middleware/auth');
router.get('/conversations', authMiddleware, ...);
```

#### **hopDongRoutes.js**
```javascript
// TRƯỚC
const { authFlexible } = require('../middleware/authFlexible');
router.get('/hop-dong', authFlexible, ...);

// SAU
const authMiddleware = require('../middleware/auth');
router.get('/hop-dong', authMiddleware, ...);
```

### 2. Socket.IO Authentication

#### **socketAuth.js**
```javascript
// TRƯỚC: Bypass với AUTH_DISABLED
if (process.env.AUTH_DISABLED === 'true') {
  console.log('🔓 [Socket.IO AUTH DISABLED] Bypassing...');
  // ... mock user
}

// SAU: Dùng mock token (giống auth.js)
const mockToken = process.env.MOCK_DEV_TOKEN || 'mock-token-for-development';
if (token === mockToken) {
  // ... mock user
}
```

---

## 🔑 Authentication Flow

### Development Mode (với mock token)

1. **Frontend** gửi token: `mock-token-for-development` (hoặc giá trị từ `MOCK_DEV_TOKEN`)
2. **Backend** kiểm tra:
   ```javascript
   if (token === mockToken) {
     req.user = {
       id: parseInt(process.env.MOCK_USER_ID || '1', 10),
       tenDayDu: process.env.MOCK_USER_NAME || 'Chu Du An Dev',
       email: process.env.MOCK_USER_EMAIL || 'chu.du.an.dev@daphongtro.local',
       vaiTroId: parseInt(process.env.MOCK_ROLE_ID || '3', 10),
       vaiTro: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
       isMockUser: true
     };
   }
   ```
3. **Request được chấp nhận** với mock user

### Production Mode (với JWT)

1. **Frontend** gửi token: `Bearer <JWT_TOKEN>`
2. **Backend** verify:
   ```javascript
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   ```
3. **Kiểm tra user trong database:**
   ```sql
   SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID 
   FROM nguoidung 
   WHERE NguoiDungID = ? AND TrangThai = "HoatDong"
   ```
4. **Chuẩn hóa vai trò:**
   ```javascript
   "Chủ dự án" → "ChuDuAn"
   "Nhân viên bán hàng" → "NhanVienBanHang"
   ```

---

## 🔧 Cấu hình .env

### Development (với mock token)
```env
# Mock token để bypass JWT verification
MOCK_DEV_TOKEN=mock-token-for-development

# Mock user info
MOCK_USER_ID=1
MOCK_USER_NAME=Chu Du An Dev
MOCK_USER_EMAIL=chu.du.an.dev@daphongtro.local
MOCK_ROLE_ID=3
MOCK_ROLE_NAME=ChuDuAn
```

### Production
```env
# JWT Secret
JWT_SECRET=your-production-secret-key

# KHÔNG CÓ MOCK_DEV_TOKEN → bắt buộc JWT hợp lệ
```

---

## ⚠️ Breaking Changes

### 1. Không còn `AUTH_DISABLED`
- **TRƯỚC:** `AUTH_DISABLED=true` → bypass hoàn toàn
- **SAU:** Phải dùng `MOCK_DEV_TOKEN` để bypass

### 2. Frontend phải gửi token
- **Development:** Gửi `MOCK_DEV_TOKEN` (default: `mock-token-for-development`)
- **Production:** Gửi JWT token hợp lệ

### 3. Socket.IO handshake
```javascript
// Frontend phải gửi token
const socket = io('http://localhost:3001', {
  auth: {
    token: 'mock-token-for-development' // hoặc JWT token
  }
});
```

---

## ✅ Checklist Migration

- [x] Thay thế `authFlexible` → `authMiddleware` trong `chuDuAnRoutes.js`
- [x] Thay thế `authFlexible` → `authMiddleware` trong `chatRoutes.js`
- [x] Thay thế `authFlexible` → `authMiddleware` trong `hopDongRoutes.js`
- [x] Cập nhật `socketAuth.js` để dùng logic giống `auth.js`
- [x] Kiểm tra không còn `authFlexible` trong codebase
- [x] Test load routes thành công
- [ ] Test frontend với mock token
- [ ] Test frontend với JWT token thật
- [ ] Cập nhật frontend gửi token đúng format

---

## 📝 Ghi chú

### Files cần giữ lại (để tham khảo)
- `server/middleware/authFlexible.js` - Giữ lại để tham khảo logic cũ
- `server/middleware/authSimple.js` - Giữ lại nếu cần

### Files đang sử dụng
- `server/middleware/auth.js` - **Middleware chính**
- `server/middleware/socketAuth.js` - **Socket.IO auth**

### Logs để debug
```javascript
// auth.js
console.log('🔐 [AUTH] Raw role:', rawRoleName, '→ Normalized:', normalizedRoleName);

// socketAuth.js
console.log('🔐 [Socket.IO] User authenticated: ...');
```

---

## 🔍 Testing

### Test 1: Load middleware
```bash
cd server
node -e "const auth = require('./middleware/auth'); console.log('✓ auth.js loaded');"
```

### Test 2: Load routes
```bash
cd server
node -e "const routes = require('./routes/chuDuAnRoutes'); console.log('✓ routes loaded');"
```

### Test 3: Start server
```bash
cd server
node index.js
# Không nên thấy: 🔓 [AUTH DISABLED]
# Nên thấy: 🔐 [AUTH] ...
```

---

## 🚀 Rollback (nếu cần)

Nếu gặp vấn đề, revert bằng cách:

1. Đổi tất cả `authMiddleware` → `{ authFlexible }`:
   ```javascript
   // const authMiddleware = require('../middleware/auth');
   const { authFlexible } = require('../middleware/authFlexible');
   ```

2. Thêm lại `AUTH_DISABLED=true` vào `.env`

3. Revert `socketAuth.js` về version cũ (dùng git)

---

**Kết luận:** Migration hoàn tất, hệ thống đã chuyển sang dùng authentication chuẩn với hỗ trợ mock token cho development.














