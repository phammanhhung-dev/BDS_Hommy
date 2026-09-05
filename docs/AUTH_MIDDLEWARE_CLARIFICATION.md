# 🔐 AUTH MIDDLEWARE CLARIFICATION

## 📋 Tổng quan

Dự án có **2 bộ middleware xác thực riêng biệt** cho Development và Production:

### 🟢 Development Middleware (DEV BYPASS)
**Mục đích:** Bỏ qua xác thực để tăng tốc development, không cần JWT token

**Files:**
- `server/middleware/authSimple.js` - Tạo mock user object
- `server/middleware/roleSimple.js` - Bỏ qua role checking

**Khi nào dùng:**
- ✅ Development environment (`NODE_ENV=development`)
- ✅ Local testing without JWT setup
- ✅ Rapid prototyping
- ❌ **KHÔNG BAO GIỜ** dùng trong production

### 🔴 Production Middleware (REAL AUTH)
**Mục đích:** Xác thực thực sự với JWT và database

**Files:**
- `server/middleware/auth.js` - JWT token verification + database validation
- `server/middleware/role.js` - Database-based RBAC with ownership checks

**Khi nào dùng:**
- ✅ Production environment (`NODE_ENV=production`)
- ✅ Staging environment
- ✅ Khi cần real authentication
- ✅ Khi test end-to-end authentication flow

---

## 📂 Chi tiết Implementation

### 1️⃣ authSimple.js (DEV BYPASS)

**Purpose:** Tạo mock user object, không kiểm tra token

```javascript
const authSimple = (req, res, next) => {
  // Bypass authentication - tạo mock user
  req.user = {
    NguoiDungID: parseInt(process.env.MOCK_USER_ID) || 1,
    id: parseInt(process.env.MOCK_USER_ID) || 1,
    userId: parseInt(process.env.MOCK_USER_ID) || 1,
    username: 'test_user',
    vaiTro: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
    roles: [process.env.MOCK_ROLE_NAME || 'ChuDuAn'],
    currentRole: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
    isMockUser: true
  };
  
  next();
};
```

**Characteristics:**
- ✅ Đơn giản, không logic phức tạp
- ✅ Không kiểm tra NODE_ENV (intentionally simple)
- ✅ Tạo mock user từ env variables
- ✅ Flag `isMockUser: true` để middleware khác biết

**Environment Variables:**
```env
MOCK_USER_ID=1
MOCK_ROLE_NAME=ChuDuAn
```

---

### 2️⃣ roleSimple.js (DEV BYPASS)

**Purpose:** Bỏ qua role checking, cho phép tất cả requests

```javascript
const roleSimple = (allowedRoles = []) => {
  return (req, res, next) => {
    // Bypass role checking - cho phép tất cả requests
    if (req.user) {
      req.user.coQuyenTruyCap = true;
    }
    
    next();
  };
};
```

**Characteristics:**
- ✅ Đơn giản, không logic phức tạp
- ✅ Không kiểm tra NODE_ENV (intentionally simple)
- ✅ Luôn cho phép access (set `coQuyenTruyCap = true`)
- ✅ Không query database

---

### 3️⃣ auth.js (PRODUCTION)

**Purpose:** JWT token verification + database user validation

```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token không được cung cấp' });
    }

    // 1. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 2. Check user exists in database
    const [userRows] = await db.execute(
      'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
      [decoded.userId]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị khóa' });
    }

    // 3. Get user role from database
    const [roleRows] = await db.execute(
      'SELECT vt.TenVaiTro FROM vaitro vt WHERE vt.VaiTroID = ?',
      [user.VaiTroHoatDongID]
    );

    // 4. Attach user to request
    req.user = {
      id: user.NguoiDungID,
      tenDayDu: user.TenDayDu,
      email: user.Email,
      vaiTroId: user.VaiTroHoatDongID,
      vaiTro: roleRows[0]?.TenVaiTro || 'Unknown'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn' });
    }
    
    res.status(401).json({ success: false, message: 'Xác thực thất bại' });
  }
};
```

**Characteristics:**
- ✅ JWT verification với `jsonwebtoken`
- ✅ Database validation (user exists + active status)
- ✅ Role lookup từ database
- ✅ Error handling (JsonWebTokenError, TokenExpiredError)
- ✅ Returns 401 for auth failures
- ✅ Supports mock token for dev (`mock_token_dev`)

---

### 4️⃣ role.js (PRODUCTION)

**Purpose:** Database-based RBAC with ownership verification

```javascript
const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Chưa xác thực người dùng'
        });
      }

      // Handle mock user (dev bypass)
      if (req.user.isMockUser) {
        const mockRoleName = req.user.vaiTro || process.env.MOCK_ROLE_NAME || 'ChuDuAn';
        req.user.vaiTros = [mockRoleName];

        const hasMockPermission =
          allowedRoles.length === 0 || allowedRoles.includes(mockRoleName);

        if (!hasMockPermission) {
          return res.status(403).json({
            success: false,
            message: `Không có quyền truy cập. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
          });
        }

        req.user.coQuyenTruyCap = true;
        return next();
      }

      // Production: Query database for user roles
      const [userRoles] = await db.execute(`
        SELECT vt.TenVaiTro, nvt.VaiTroID
        FROM nguoidung_vaitro nvt
        INNER JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
        WHERE nvt.NguoiDungID = ? AND nvt.TrangThai = 'HoatDong'
      `, [req.user.id]);

      if (userRoles.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Người dùng chưa được gán vai trò'
        });
      }

      // Check permission
      const userRoleNames = userRoles.map(role => role.TenVaiTro);
      const hasPermission = allowedRoles.some(role => userRoleNames.includes(role));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền truy cập. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
        });
      }

      req.user.vaiTros = userRoleNames;
      req.user.coQuyenTruyCap = true;

      next();
    } catch (error) {
      console.error('Lỗi kiểm tra phân quyền:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền truy cập'
      });
    }
  };
};
```

**Additional Features:**
- `ownershipMiddleware(resourceType, idParam)` - Kiểm tra ownership (TinDang, CuocHen, DuAn)
- `actAsMiddleware()` - Cho phép act-as (chuyển đổi vai trò) với audit log
- `requireRole(roleName)` - Helper cho single role
- `requireRoles(roleNames)` - Helper cho multiple roles

**Characteristics:**
- ✅ Database queries cho roles
- ✅ Ownership verification
- ✅ Act-as support
- ✅ Audit logging
- ✅ Handles mock users (dev bypass)
- ✅ Returns 403 for permission failures

---

## 🔄 Sử dụng trong Routes

### Development Mode (hiện tại)

```javascript
// chuDuAnRoutes.js
const { authSimple: authMiddleware } = require('../middleware/authSimple');
const { roleSimple: roleMiddleware } = require('../middleware/roleSimple');

router.get('/tin-dang', 
  authMiddleware, 
  roleMiddleware(['ChuDuAn']), 
  ChuDuAnController.layDanhSachTinDang
);
```

### Production Mode (tương lai)

```javascript
// chuDuAnRoutes.js
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.get('/tin-dang', 
  auth, 
  requireRole('ChuDuAn'), 
  ChuDuAnController.layDanhSachTinDang
);
```

---

## ⚙️ Environment Configuration

### Development (.env.development)
```env
NODE_ENV=development
AUTH_MODE=simple

# Mock user config
MOCK_USER_ID=1
MOCK_ROLE_NAME=ChuDuAn
```

### Production (.env.production)
```env
NODE_ENV=production
AUTH_MODE=jwt

# JWT config
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

---

## 🎯 Migration Plan (Development → Production)

**Bước 1: Update routes**
```bash
# Find all routes using authSimple/roleSimple
grep -r "authSimple" server/routes/
grep -r "roleSimple" server/routes/
```

**Bước 2: Replace imports**
```javascript
// Before (Dev)
const { authSimple: authMiddleware } = require('../middleware/authSimple');
const { roleSimple: roleMiddleware } = require('../middleware/roleSimple');

// After (Production)
const auth = require('../middleware/auth');
const { requireRole, ownershipMiddleware } = require('../middleware/role');
```

**Bước 3: Update middleware usage**
```javascript
// Before (Dev)
router.get('/tin-dang', authMiddleware, roleMiddleware(['ChuDuAn']), controller);

// After (Production)
router.get('/tin-dang', auth, requireRole('ChuDuAn'), controller);
```

**Bước 4: Test với JWT token**
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token
curl -X GET http://localhost:5000/api/chu-du-an/tin-dang \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ❌ Common Mistakes (Đã sửa)

### ❌ MISTAKE 1: Thêm production checks vào authSimple
```javascript
// WRONG - authSimple.js (phiên bản cũ)
if (process.env.NODE_ENV === 'production') {
  return res.status(500).json({ message: 'Server misconfiguration' });
}
```

**Tại sao sai:**
- authSimple **CHỈ** dùng trong dev, không cần check NODE_ENV
- Nếu dùng trong production, đó là lỗi cấu hình routes, không phải lỗi của middleware
- Middleware dev phải giữ đơn giản, không có business logic

### ❌ MISTAKE 2: Thêm production checks vào roleSimple
```javascript
// WRONG - roleSimple.js (phiên bản cũ)
if (process.env.NODE_ENV === 'production') {
  return res.status(500).json({ message: 'RBAC bypass detected' });
}
```

**Tại sao sai:**
- Lý do tương tự như authSimple
- Dev middleware phải tập trung vào một việc: bypass auth/role
- Production safety là trách nhiệm của deployment config, không phải middleware

### ✅ CORRECT: Keep dev middleware simple

```javascript
// ✅ authSimple.js (phiên bản mới - ĐÚNG)
const authSimple = (req, res, next) => {
  req.user = { /* mock user */ };
  next();
};

// ✅ roleSimple.js (phiên bản mới - ĐÚNG)
const roleSimple = (allowedRoles = []) => {
  return (req, res, next) => {
    if (req.user) req.user.coQuyenTruyCap = true;
    next();
  };
};
```

---

## 📚 Tài liệu liên quan

- **JWT Implementation:** `docs/CAI_DAT_CHU_DU_AN_IMPLEMENTATION.md` (Section 3.2)
- **Auth Controller:** `server/controllers/authController.js` - generateToken()
- **Frontend Integration:** `client/src/api/axiosClient.js` - Auto-attach token
- **Database Schema:** `thue_tro.sql` - nguoidung, vaitro, nguoidung_vaitro tables

---

## 🔍 Summary

| Aspect | authSimple/roleSimple (DEV) | auth/role (PRODUCTION) |
|--------|----------------------------|------------------------|
| **Purpose** | Bypass auth for speed | Real security |
| **Database queries** | ❌ None | ✅ Yes (user validation, roles) |
| **JWT verification** | ❌ No | ✅ Yes |
| **Environment check** | ❌ No (intentionally simple) | ✅ Yes (JWT_SECRET required) |
| **Complexity** | 🟢 Very simple (~10 lines) | 🔴 Complex (~150 lines) |
| **When to use** | Development only | Production, staging |
| **Security level** | ❌ None (mock user) | ✅ High (JWT + DB validation) |

**Key Takeaway:**
- `authSimple.js` và `roleSimple.js` là **dev bypasses** - giữ đơn giản, không thêm production logic
- `auth.js` và `role.js` là **production middlewares** - complex, secure, database-backed
- Migration từ dev → production: Chỉ cần thay đổi imports trong routes

---

**Last Updated:** 2025-01-XX
**Status:** ✅ Corrected - Dev middleware reverted to simple state
