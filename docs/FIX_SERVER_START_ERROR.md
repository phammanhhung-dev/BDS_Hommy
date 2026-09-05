# ✅ FIX: Server Start Error - Route.get() requires a callback function

## 🐛 Lỗi gốc

```
Error: Route.get() requires a callback function but got a [object Undefined]
    at Route.<computed> [as get] (server/node_modules/express/lib/router/route.js:211:15)
    at Object.<anonymous> (server/routes/chinhSachCocRoutes.js:22:8)
```

## 🔍 Nguyên nhân

1. **Routes sử dụng `requireRole()` với array:**
   ```javascript
   requireRole(['ChuDuAn'])  // ❌ WRONG
   ```

2. **Nhưng `requireRole()` chỉ nhận string:**
   ```javascript
   const requireRole = (roleName) => { ... }  // Expects string, not array
   ```

3. **Solution ban đầu: Dùng `requireRoles()`**
   ```javascript
   requireRoles(['ChuDuAn'])  // ✅ Correct
   ```

4. **Vấn đề mới: Mock user chưa có JWT authentication**
   - User đang dev frontend chưa có trang login
   - Cần dùng mock auth để test API nhanh

## ✅ Giải pháp Final

### Sử dụng DEV MODE (authSimple + roleSimple)

**Files đã sửa:**

1. **`server/routes/chinhSachCocRoutes.js`**
   - Changed: `auth` → `authSimple`
   - Changed: `requireRoles()` → `roleSimple()`

2. **`server/middleware/authSimple.js`**
   - Export: `module.exports = { authSimple }`
   - Mock user với fields: `NguoiDungID`, `vaiTro`, `isMockUser`
   - Đọc từ ENV: `MOCK_USER_ID`, `MOCK_ROLE_NAME`

3. **`server/middleware/roleSimple.js`**
   - Export: `module.exports = { roleSimple }`
   - Bypass role checking (luôn pass)
   - Log debug info

**Code changes:**

```javascript
// OLD (PRODUCTION MODE)
const { auth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/role');

router.get('/', auth, requireRoles(['ChuDuAn']), Controller.method);

// NEW (DEV MODE)
const { authSimple } = require('../middleware/authSimple');
const { roleSimple } = require('../middleware/roleSimple');

router.get('/', authSimple, roleSimple(['ChuDuAn']), Controller.method);
```

## 📝 Environment Variables

**.env file:**
```env
# Auth Mock (DEV MODE)
MOCK_USER_ID=1
MOCK_ROLE_NAME=ChuDuAn
```

## 🧪 Testing

### Test server start:
```bash
cd server
npm start
```

**Expected output:**
```
✅ Server started on port 5000
🔓 [authSimple] Mock user: test_user | Role: ChuDuAn
🔓 [roleSimple] Allowing access for roles: ChuDuAn
```

### Test API endpoint:
```bash
# No JWT token needed in DEV mode
curl http://localhost:5000/api/chu-du-an/chinh-sach-coc
```

## 🔄 Migration Path

**Khi có trang Login/Register:**

1. Comment DEV imports trong `chinhSachCocRoutes.js`:
   ```javascript
   // const { authSimple } = require('../middleware/authSimple');
   // const { roleSimple } = require('../middleware/roleSimple');
   ```

2. Uncomment PRODUCTION imports:
   ```javascript
   const { auth } = require('../middleware/auth');
   const { requireRoles } = require('../middleware/role');
   ```

3. Thay đổi middleware:
   ```javascript
   router.get('/', auth, requireRoles(['ChuDuAn']), Controller.method);
   ```

4. Update .env với JWT_SECRET

## 📚 Related Documentation

- `server/routes/README_AUTH_MODES.md` - Chi tiết về DEV/PROD modes
- `.github/copilot/backend.md` - Backend guidelines

## ✅ Status

- ✅ Server start error FIXED
- ✅ DEV MODE enabled cho chinhSachCocRoutes.js
- ✅ Mock user working
- ⏸️ PRODUCTION MODE - pending login page
- 📋 TODO: Update các routes khác khi cần

## 🎯 Next Steps

1. Test frontend với mock API
2. Tạo trang Login/Register
3. Test JWT authentication flow
4. Switch toàn bộ routes sang PRODUCTION mode
5. Deploy lên staging với JWT auth
