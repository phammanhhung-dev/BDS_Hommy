# ⚡ NVBH Module - Quick Test Guide

**Last Updated:** 2025-11-06  
**Status:** ✅ All Bugs Fixed - Ready for Testing

---

## 🚀 Quick Start

### **1. Login**
```
URL: http://localhost:5173/login
Email: banhang@gmail.com
Password: 123456

Expected: Redirect to /nhan-vien-ban-hang/dashboard
```

### **2. Test Checklist**

| # | Page | URL | What to Check | Expected Result |
|---|------|-----|---------------|-----------------|
| 1️⃣ | **Dashboard** | `/nhan-vien-ban-hang/dashboard` | 4 metric cards display | ✅ No errors |
| 2️⃣ | **Cuộc Hẹn** | `/nhan-vien-ban-hang/cuoc-hen` | List loads with data | ✅ No 500 errors |
| 3️⃣ | **Create Cuộc Hẹn** | Click "Tạo cuộc hẹn" | Modal opens | ✅ Form works |
| 4️⃣ | **Cuộc Hẹn Detail** | Click any row → "Xem chi tiết" | Detail modal shows | ✅ All fields display |
| 5️⃣ | **Giao Dịch** | `/nhan-vien-ban-hang/giao-dich` | Transaction list | ✅ Loads without errors |
| 6️⃣ | **Thu Nhập** | `/nhan-vien-ban-hang/bao-cao/thu-nhap` | Report page loads | ✅ No crash (charts may be empty) |

---

## 🔍 What Was Fixed

### ✅ **Fixed Issues**
1. ~~403 Forbidden on login~~ → **FIXED**
2. ~~Unknown column `p.Gia`~~ → **FIXED**
3. ~~Unknown column `td.DiaChi`~~ → **FIXED**
4. ~~Frontend crash on Thu Nhập~~ → **FIXED**
5. ~~React invalid tag warnings~~ → **FIXED**

### ⚠️ **Known Limitation (Non-Critical)**
- **Thu Nhập Report:** Charts are empty (backend incomplete)
  - Page works ✅
  - No crashes ✅
  - Charts just show no data (waiting for backend enhancement)

---

## 🐛 If You See Errors

### **Error: 403 Forbidden**
```
✅ FIXED! Clear cache: Ctrl + Shift + R
```

### **Error: Unknown column in SQL**
```
✅ FIXED! Restart backend: cd server && npm run dev
```

### **Error: Cannot read properties of undefined**
```
✅ FIXED! Hard refresh: Ctrl + Shift + R
```

### **Error: The tag <currency> is unrecognized**
```
✅ FIXED! Clear cache and refresh
```

---

## 📊 Expected Console Output

### **Good (✅):**
```
[Socket.IO] Connected: ZRIS4OgqoZNHHa8gAAAF
Kết quả đăng nhập: {success: true, token: '...', user: {...}}
📊 Login Debug: {vaiTroId: 2, tenVaiTro: 'Nhân viên Bán hàng', ...}
✅ Redirecting to NVBH Dashboard
```

### **Bad (❌) - Should NOT see:**
```
❌ 403 Forbidden
❌ Unknown column 'p.Gia' in 'field list'
❌ Unknown column 'td.DiaChi' in 'field list'
❌ Cannot read properties of undefined (reading 'map')
❌ The tag <currency> is unrecognized
```

---

## 🎯 Focus Areas for Testing

### **High Priority:**
1. ✅ Login → Should redirect to NVBH dashboard
2. ✅ Dashboard → All metrics should load
3. ✅ Cuộc Hẹn list → Should show appointments with addresses
4. ✅ Cuộc Hẹn detail → All fields should display

### **Medium Priority:**
5. ✅ Create new cuộc hẹn → Form should work
6. ✅ Update cuộc hẹn → Status changes should save
7. ✅ Giao Dịch → Transactions should load

### **Low Priority:**
8. ⚠️ Thu Nhập report → Page loads (charts empty is OK)

---

## 💡 Tips

1. **Clear cache before testing:**
   ```
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

2. **Check browser console:**
   - Press F12
   - Look for errors (should be none now!)

3. **If stuck:**
   - Restart backend: `cd server && npm run dev`
   - Restart frontend: `cd client && npm run dev`
   - Check database connection

---

## 📞 Support

If you encounter any issues not listed here:

1. Check `docs/BUGFIX_403_FORBIDDEN.md` for detailed troubleshooting
2. Check `docs/BUGFIX_COMPLETE_SUMMARY.md` for bug details
3. All bugs should be fixed ✅

---

**Happy Testing! 🎉**



