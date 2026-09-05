# 🔐 Authentication Modes - Routes Configuration

## 📋 Tổng quan

File này hướng dẫn cách chuyển đổi giữa **DEV MODE** (mock auth) và **PRODUCTION MODE** (JWT auth) cho các routes.

---

## 🛠️ DEV MODE (Mock Authentication)

**Sử dụng khi:**
- Phát triển frontend mà chưa có trang đăng nhập
- Test API nhanh mà không cần JWT token
- Mock user với role cố định

**Middleware:**
- `authSimple` - Mock user ID và thông tin cơ bản
- `roleSimple(['ChuDuAn'])` - Mock role checking (luôn pass)

**Cấu hình:**
```javascript
// routes/chinhSachCocRoutes.js
const { authSimple } = require('../middleware/authSimple');
const { roleSimple } = require('../middleware/roleSimple');

router.get('/', authSimple, roleSimple(['ChuDuAn']), Controller.method);
```

**Environment Variables (.env):**
```env
MOCK_USER_ID=1
MOCK_ROLE_NAME=ChuDuAn
```

---

## 🚀 PRODUCTION MODE (JWT Authentication)

**Sử dụng khi:**
- Có trang đăng nhập hoàn chỉnh
- Cần security thật (JWT tokens)
- Deploy lên staging/production

**Middleware:**
- `auth` - Verify JWT token từ header
- `requireRoles(['ChuDuAn'])` - Kiểm tra role thật từ database

**Cấu hình:**
```javascript
// routes/chinhSachCocRoutes.js
const { auth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

router.get('/', auth, requireRoles(['ChuDuAn']), Controller.method);
```

**Environment Variables (.env):**
```env
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

---

## 🔄 Cách chuyển đổi giữa 2 modes

### Chuyển từ DEV → PRODUCTION:

1. **Comment DEV imports:**
```javascript
// const { authSimple } = require('../middleware/authSimple');
// const { roleSimple } = require('../middleware/roleSimple');
```

2. **Uncomment PRODUCTION imports:**
```javascript
const { auth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');
```

3. **Thay đổi middleware trong routes:**
```javascript
// DEV:
// router.get('/', authSimple, roleSimple(['ChuDuAn']), Controller.method);

// PRODUCTION:
router.get('/', auth, requireRoles(['ChuDuAn']), Controller.method);
```

4. **Update .env file** với JWT_SECRET

---

## 📁 Files cần update khi switch mode

### Routes cần thay đổi:
- ✅ `chinhSachCocRoutes.js` - Đã update (DEV mode hiện tại)
- ⚠️ `chuDuAnRoutes.js` - Cần kiểm tra
- ⚠️ `tinDangRoutes.js` - Cần kiểm tra
- ⚠️ `operatorRoutes.js` - Cần kiểm tra (nếu có)

### Không cần thay đổi:
- `authRoutes.js` - Login/register endpoints (luôn dùng auth thật)
- `userRoutes.js` - Profile endpoints

---

## 🧪 Testing

### Test DEV mode (authSimple):
```bash
# Không cần JWT token
curl http://localhost:5000/api/chu-du-an/chinh-sach-coc
```

### Test PRODUCTION mode (JWT auth):
```bash
# Cần JWT token trong header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/chu-du-an/chinh-sach-coc
```

---

## ⚠️ Important Notes

1. **KHÔNG COMMIT production credentials vào git**
2. **Luôn dùng PRODUCTION mode trên server thật**
3. **DEV mode chỉ cho local development**
4. **Khi có login page → switch sang PRODUCTION mode ngay**

---

## 📝 Current Status

**File: `chinhSachCocRoutes.js`**
- Mode: ✅ DEV MODE (authSimple + roleSimple)
- Last Update: 2025-10-16
- Reason: Chưa có trang đăng nhập, sử dụng mock user

**TODO:**
- [ ] Tạo trang Login/Register
- [ ] Test JWT authentication flow
- [ ] Switch sang PRODUCTION mode
- [ ] Update tất cả routes sang PRODUCTION mode
