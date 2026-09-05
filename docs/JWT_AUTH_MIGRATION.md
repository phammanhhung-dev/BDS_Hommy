# Migration sang Production JWT Authentication

**Ngày hoàn thành:** 21/10/2025  
**Branch:** Hop  
**Loại:** Migration từ dev bypass sang production auth

---

## 📋 Tổng quan

Migration từ **authSimple/roleSimple** (dev bypass) sang **auth.js/role.js** (production JWT authentication) cho toàn bộ hệ thống.

### Vấn đề gặp phải:
- Hệ thống đang dùng dev bypass middleware (mock user, không kiểm tra JWT)
- Cần chuyển sang production auth với JWT verification và database-based RBAC
- Database lưu tên vai trò có dấu tiếng Việt và khoảng trắng ("Chủ dự án")
- Code kiểm tra vai trò không có dấu ("ChuDuAn")

---

## ✅ Các thay đổi đã thực hiện

### 1. Migration Routes (6 files)

#### `server/routes/chuDuAnRoutes.js`
**Thay đổi:**
```javascript
// ❌ TRƯỚC (Dev bypass)
const { authSimple: authMiddleware } = require('../middleware/authSimple');
const { roleSimple: roleMiddleware } = require('../middleware/roleSimple');

// ✅ SAU (Production JWT)
const authMiddleware = require('../middleware/auth');
const { requireRole, requireRoles } = require('../middleware/role');

// Routes (20+ routes đã update)
router.get('/dashboard', authMiddleware, requireRole('ChuDuAn'), ChuDuAnController.layDashboard);
```

**Routes đã update:** 20+ endpoints cho module Chủ dự án

---

#### `server/routes/phongRoutes.js`
**Thay đổi:**
```javascript
// ❌ TRƯỚC
const { authSimple: auth } = require('../middleware/authSimple');
const roleSimple = require('../middleware/roleSimple');
const role = { requireRole: (roleName) => roleSimple.roleSimple([roleName]) };

// ✅ SAU
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const role = { requireRole: (roleName) => requireRole(roleName) };
```

**Routes đã update:** 5+ endpoints quản lý phòng

---

#### `server/routes/geocodingRoutes.js`
**Thay đổi:**
```javascript
// ❌ TRƯỚC
const { authSimple } = require('../middleware/authSimple');
router.post('/', authSimple, GeocodingController.geocode);

// ✅ SAU
const auth = require('../middleware/auth');
router.post('/', auth, GeocodingController.geocode);
```

---

#### `server/routes/chinhSachCocRoutes.js`
**Routes đã update:** 5 CRUD endpoints
- GET / (danh sách)
- GET /:id (chi tiết)
- POST / (tạo mới)
- PUT /:id (cập nhật)
- DELETE /:id (soft delete)

**Middleware:** `auth, requireRole('ChuDuAn')`

---

#### `server/routes/operatorRoutes.js`
**Thay đổi:**
```javascript
// ❌ TRƯỚC
const { authSimple } = require('../middleware/authSimple');
const { roleSimple } = require('../middleware/roleSimple');

// ✅ SAU
const auth = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

// Multi-role support
router.get('/du-an', auth, requireRoles(['Operator', 'Admin']), ...);
```

---

### 2. Fix Role Name Mismatch

#### Vấn đề:
- **Database:** `vaitro.TenVaiTro = "Chủ dự án"` (có dấu + khoảng trắng)
- **Code:** `requireRole('ChuDuAn')` (không dấu, không khoảng trắng)
- **Kết quả:** 403 Forbidden vì không match

#### Giải pháp: Role Name Normalization

**`server/middleware/auth.js` (lines 63-71):**
```javascript
// Chuẩn hóa tên vai trò (bỏ dấu cách và ký tự đặc biệt)
const rawRoleName = roleRows[0]?.TenVaiTro || 'Unknown';
const normalizedRoleName = rawRoleName
  .normalize('NFD')                          // Decompose Vietnamese
  .replace(/[\u0300-\u036f]/g, '')          // Remove diacritics
  .replace(/\s+/g, '')                      // Remove spaces
  .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D'); // đ → d

console.log('🔐 [AUTH] Raw role:', rawRoleName, '→ Normalized:', normalizedRoleName);

req.user = {
  id: user.NguoiDungID,
  tenDayDu: user.TenDayDu,
  email: user.Email,
  vaiTroId: user.VaiTroHoatDongID,
  vaiTro: normalizedRoleName,    // "ChuDuAn" - for checking
  vaiTroGoc: rawRoleName          // "Chủ dự án" - for display
};
```

**`server/middleware/role.js` (lines 58-75):**
```javascript
// Chuẩn hóa tên vai trò từ database
const normalizeRoleName = (name) => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/\s+/g, '')             // Bỏ khoảng trắng
    .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D'); // đ → d
};

const userRoleNames = userRoles.map(role => role.TenVaiTro);
const normalizedUserRoles = userRoleNames.map(normalizeRoleName);

console.log('🔐 [ROLE] Raw roles:', userRoleNames);
console.log('🔐 [ROLE] Normalized roles:', normalizedUserRoles);
console.log('🔐 [ROLE] Allowed roles:', allowedRoles);

const hasPermission = allowedRoles.some(role => normalizedUserRoles.includes(role));
console.log('🔐 [ROLE] Has permission:', hasPermission);
```

**Kết quả:**
- "Chủ dự án" → "ChuDuAn" ✅
- "Nhân viên bán hàng" → "Nhanvienbanhang" ✅
- "Quản trị viên" → "Quantrivien" ✅

---

### 3. Debug Logging

Thêm console.log để tracking auth flow:

**Auth middleware:**
```javascript
🔐 [AUTH] Raw role: Chủ dự án → Normalized: ChuDuAn
```

**Role middleware:**
```javascript
🔐 [ROLE] Raw roles: [ 'Chủ dự án' ]
🔐 [ROLE] Normalized roles: [ 'ChuDuAn' ]
🔐 [ROLE] Allowed roles: [ 'ChuDuAn' ]
🔐 [ROLE] Has permission: true
```

---

## 🔧 Cấu trúc JWT Authentication

### Auth Flow:
```
1. User đăng nhập → POST /api/login
2. Backend verify credentials (email + MD5 password)
3. Generate JWT token với payload: { userId, email }
4. Frontend lưu token trong localStorage
5. Mỗi request gửi: Authorization: Bearer <token>
6. Auth middleware verify JWT → Query user + role từ DB
7. Role middleware check permission → Allow/Deny
```

### JWT Token Structure:
```javascript
// Payload
{
  userId: 6,
  email: "chuduantest@gmail.com",
  iat: 1729497114,  // Issued at
  exp: 1730101914   // Expires (7 days)
}

// Response
{
  success: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: 6,
    email: "chuduantest@gmail.com",
    tenDayDu: "Chu Du An Test",
    vaiTro: "ChuDuAn"
  }
}
```

### Middleware Stack:
```javascript
// Single role
router.get('/dashboard', 
  auth,                    // JWT verification + user lookup
  requireRole('ChuDuAn'),  // Role check
  Controller.method
);

// Multiple roles
router.get('/admin', 
  auth, 
  requireRoles(['Operator', 'Admin']), 
  Controller.method
);
```

---

## 📊 Testing Results

### Test Case 1: Login Flow
```http
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "chuduantest@gmail.com",
  "password": "e10adc3949ba59abbe56e057f20f883e"  // MD5 hash
}

✅ Response 200:
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { ... }
}
```

### Test Case 2: Dashboard Access
```http
GET http://localhost:5000/api/chu-du-an/dashboard
Authorization: Bearer eyJhbGci...

✅ Response 200:
{
  "success": true,
  "data": {
    "tongTinDang": 5,
    "tinDangHoatDong": 3,
    ...
  }
}
```

### Test Case 3: Wrong Role
```http
GET http://localhost:5000/api/operator/du-an
Authorization: Bearer <ChuDuAn token>

❌ Response 403:
{
  "success": false,
  "message": "Không có quyền truy cập. Yêu cầu vai trò: Operator, Admin"
}
```

### Test Case 4: No Token
```http
GET http://localhost:5000/api/chu-du-an/dashboard

❌ Response 401:
{
  "success": false,
  "message": "Không tìm thấy token xác thực"
}
```

---

## 🐛 Issues Resolved

### Issue 1: 403 Forbidden sau khi login
**Nguyên nhân:** Database có "Chủ dự án" (với dấu), code check "ChuDuAn"  
**Fix:** Thêm normalization trong auth.js và role.js  
**Status:** ✅ Resolved

### Issue 2: Middleware không chạy
**Nguyên nhân:** Route gọi `roleMiddleware(['ChuDuAn'])` nhưng import sai  
**Fix:** Đổi thành `requireRole('ChuDuAn')`  
**Status:** ✅ Resolved

### Issue 3: Debug logs không hiện
**Nguyên nhân:** Middleware được bypass do import sai  
**Fix:** Import đúng + thêm console.log  
**Status:** ✅ Resolved

---

## 📦 Dependencies

```json
{
  "jsonwebtoken": "^9.0.2"  // JWT generation & verification
}
```

---

## 🔒 Security Notes

1. **JWT_SECRET:** Đang dùng `your-secret-key-here` (dev only)
   - ⚠️ **TODO:** Đổi thành random string 256-bit cho production
   
2. **Password Hashing:** Đang dùng MD5
   - ⚠️ **TODO:** Migrate sang bcrypt (SHA-256 minimum)
   
3. **Token Expiry:** 7 days
   - ✅ Reasonable cho app có user login thường xuyên
   
4. **HTTPS:** Required cho production
   - ⚠️ Hiện tại dev dùng HTTP

---

## 📝 Migration Checklist

- [x] Migrate chuDuAnRoutes.js (20+ routes)
- [x] Migrate phongRoutes.js (5 routes)
- [x] Migrate geocodingRoutes.js (1 route)
- [x] Migrate chinhSachCocRoutes.js (5 routes)
- [x] Migrate operatorRoutes.js (admin routes)
- [x] Fix role name mismatch (normalization)
- [x] Add debug logging
- [x] Test complete auth flow
- [ ] Delete authSimple.js/roleSimple.js (user cancelled)
- [ ] Update .env with strong JWT_SECRET
- [ ] Add token refresh mechanism
- [ ] Migrate password hashing to bcrypt

---

## 🚀 Next Steps

### Immediate (High Priority):
1. **Test toàn bộ endpoints** sau khi migration
2. **Verify ownership middleware** vẫn hoạt động
3. **Check error handling** cho expired tokens

### Short-term (Medium Priority):
1. **Generate strong JWT_SECRET** cho production
2. **Add token refresh** mechanism (refresh token)
3. **Implement rate limiting** cho login endpoint

### Long-term (Low Priority):
1. **Migrate MD5 → bcrypt** cho password hashing
2. **Add 2FA** support
3. **Implement session management** (logout all devices)
4. **Add audit logging** cho auth events

---

## 📚 References

- **Use Cases:** `docs/use-cases-v1.2.md`
- **API Documentation:** `docs/chu-du-an-routes-implementation.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`
- **Backend Guide:** `.github/copilot/backend.md`

---

## 👥 Contributors

- **Hoanh Hop** - Initial migration & role normalization fix

---

## 📅 Timeline

- **21/10/2025 07:00:** Started migration from authSimple to production auth
- **21/10/2025 07:02:** Completed route migrations (6 files)
- **21/10/2025 07:03:** Encountered 403 error (role name mismatch)
- **21/10/2025 07:04:** Implemented role normalization in auth.js
- **21/10/2025 07:05:** Implemented role normalization in role.js
- **21/10/2025 07:06:** Fixed middleware import issue in chuDuAnRoutes.js
- **21/10/2025 07:07:** ✅ **Migration completed successfully**
