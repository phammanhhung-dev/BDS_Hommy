# KẾ HOẠCH MERGE AN TOÀN - UPSTREAM UPDATES

**Ngày:** 16/10/2025  
**Nguồn:** https://github.com/tienchung21/daphongtro.git (upstream/main)  
**Mục tiêu:** Pull updates MÀ KHÔNG MẤT module Chủ dự án

---

## 🚨 PHÂN TÍCH XUNG ĐỘT

### 1. Thay đổi từ Upstream (tienchung21)

**Files BỊ XÓA (40+ files):**
- ❌ **TOÀN BỘ** `client/src/pages/ChuDuAn/*` (Dashboard, QuanLyDuAn, TaoTinDang, etc.)
- ❌ **TOÀN BỘ** `client/src/components/ChuDuAn/*` (Modals, Navigation, etc.)
- ❌ **TOÀN BỘ** `client/src/layouts/ChuDuAnLayout.*`
- ❌ `.github/copilot-instructions.md` + các hướng dẫn copilot
- ❌ `client/src/components/AddressSearchInput/*`

**Files THÊM MỚI:**
- ✅ `client/src/api/khuvucApi.js`
- ✅ `client/src/api/thanhtoanApi.js`
- ✅ `client/src/api/tinDangApi.js`
- ✅ `client/src/api/yeuThichApi.js`
- ✅ `client/src/components/1` (file lạ, có vẻ là lỗi)

**Files CHỈNH SỬA:**
- 🔄 `README.md`
- 🔄 `client/package.json` + `package-lock.json`
- 🔄 `client/src/App.css` + `App.jsx`
- 🔄 `thue_tro.sql` (schema khác hoàn toàn)

### 2. Code Local (đã phát triển)

**Module Chủ dự án (100% tự phát triển):**
- ✅ 16 files trong `pages/ChuDuAn/`
- ✅ 10+ files trong `components/ChuDuAn/`
- ✅ `ChuDuAnLayout.jsx/.css`
- ✅ Backend: `ChuDuAnController.js`, `ChuDuAnModel.js`
- ✅ Routes: `chuDuAnRoutes.js`, `chinhSachCocRoutes.js`, `operatorRoutes.js`
- ✅ Services: `ChinhSachCocService.js`, `NhatKyHeThongService.js`
- ✅ Database extensions: 9 fields for banned workflow, chinhsachcoc table

**Cleanup đã làm:**
- ✅ Phase 1+2: Xóa 8 duplicate files
- ✅ Refactor QuanLyDuAn_v2 → QuanLyDuAn
- ✅ 5 documentation files (42KB)

---

## 📋 CHIẾN LƯỢC MERGE

### Approach: **SELECTIVE MERGE** (Cherry-pick có chọn lọc)

**KHÔNG DÙNG:** `git merge upstream/main` (sẽ xóa toàn bộ module Chủ dự án)

**SỬ DỤNG:** Merge từng file/feature cụ thể:

### Phase 1: Merge API files mới ✅
```bash
# Lấy các API files mới mà không conflict
git checkout upstream/main -- client/src/api/khuvucApi.js
git checkout upstream/main -- client/src/api/thanhtoanApi.js
git checkout upstream/main -- client/src/api/tinDangApi.js
git checkout upstream/main -- client/src/api/yeuThichApi.js
```

### Phase 2: Merge package.json (cẩn thận) ⚠️
```bash
# KHÔNG checkout trực tiếp, phải merge thủ công
# 1. Xem diff dependencies
git diff HEAD upstream/main -- client/package.json

# 2. Manual merge: Thêm dependencies mới, giữ lại dependencies cũ
# 3. npm install để update lock file
```

### Phase 3: Merge App.jsx (partial) ⚠️
```bash
# KHÔNG checkout toàn bộ App.jsx
# 1. Xem diff
git diff HEAD upstream/main -- client/src/App.jsx

# 2. Manual merge: 
#    - Giữ lại routes của module Chủ dự án
#    - Thêm routes mới (nếu có)
#    - Merge imports cẩn thận
```

### Phase 4: Merge Database (thủ công 100%) 🔥
```bash
# TUYỆT ĐỐI KHÔNG checkout upstream thue_tro.sql
# Lý do: Schema đã extend nhiều (banned workflow, chinhsachcoc, etc.)

# Quy trình:
# 1. Backup local: ✅ Đã có trong backup_before_pull/
# 2. Xem upstream changes:
git show upstream/main:thue_tro.sql > upstream_thue_tro.sql

# 3. Manual compare & merge:
#    - Giữ 100% schema local (tables, procedures, triggers)
#    - Chỉ lấy data mới (INSERT INTO nếu có)
#    - Không xóa bất kỳ table/column nào
```

### Phase 5: Verify KHÔNG MẤT code ✅
```bash
# Kiểm tra module Chủ dự án còn nguyên vẹn
ls client/src/pages/ChuDuAn/*.jsx
ls client/src/components/ChuDuAn/*.jsx
ls server/controllers/ChuDuAn*.js
ls server/models/ChuDuAn*.js
```

---

## ⚠️ WARNINGS

### Files TUYỆT ĐỐI KHÔNG MERGE từ upstream:

❌ **BLACKLIST (GIỮ 100% LOCAL):**
```
client/src/pages/ChuDuAn/*
client/src/components/ChuDuAn/*
client/src/layouts/ChuDuAnLayout.*
server/controllers/ChuDuAnController.js
server/controllers/ChinhSachCocController.js
server/controllers/OperatorController.js
server/models/ChuDuAnModel.js
server/models/ChinhSachCocModel.js
server/routes/chuDuAnRoutes.js
server/routes/chinhSachCocRoutes.js
server/routes/operatorRoutes.js
server/services/ChinhSachCocService.js
server/services/NhatKyHeThongService.js
thue_tro.sql (merge thủ công)
migrations/*.sql
.github/copilot-instructions.md
```

### Files CẦN MERGE CẨN THẬN:

⚠️ **MANUAL MERGE REQUIRED:**
```
client/package.json         → Merge dependencies
client/src/App.jsx          → Merge routes
client/src/App.css          → Merge styles
README.md                   → Merge documentation
```

### Files CÓ THỂ LẤY TRỰC TIẾP:

✅ **SAFE TO CHECKOUT:**
```
client/src/api/khuvucApi.js
client/src/api/thanhtoanApi.js
client/src/api/tinDangApi.js
client/src/api/yeuThichApi.js
```

---

## 🎯 EXECUTION STEPS (Tuần tự)

### Step 1: Merge API files ✅
```bash
git checkout upstream/main -- client/src/api/khuvucApi.js
git checkout upstream/main -- client/src/api/thanhtoanApi.js
git checkout upstream/main -- client/src/api/tinDangApi.js
git checkout upstream/main -- client/src/api/yeuThichApi.js
git add client/src/api/
git commit -m "merge(api): thêm 4 API files từ upstream (khuvuc, thanhtoan, tinDang, yeuThich)"
```

### Step 2: Compare package.json
```bash
git diff HEAD upstream/main -- client/package.json > package_json_diff.txt
# Review diff → Merge manually
```

### Step 3: Compare App.jsx
```bash
git diff HEAD upstream/main -- client/src/App.jsx > app_jsx_diff.txt
# Review diff → Merge manually
```

### Step 4: Extract upstream database
```bash
git show upstream/main:thue_tro.sql > upstream_thue_tro.sql
# Compare with local → Merge manually
```

### Step 5: Verify integrity
```bash
# Check module Chủ dự án
ls -la client/src/pages/ChuDuAn/ | wc -l    # Should be 16 files
ls -la client/src/components/ChuDuAn/ | wc -l  # Should be 10+ files
```

### Step 6: Test local
```bash
cd client && npm install && npm run dev
cd server && npm start
# Manual testing: Navigate to /chu-du-an/*
```

---

## 📊 SUCCESS CRITERIA

- ✅ 4 API files mới được thêm vào
- ✅ Dependencies mới trong package.json (nếu cần)
- ✅ App.jsx có routes mới (nếu có)
- ✅ **QUAN TRỌNG:** 16 files trong pages/ChuDuAn còn nguyên vẹn
- ✅ **QUAN TRỌNG:** 10+ files trong components/ChuDuAn còn nguyên vẹn
- ✅ **QUAN TRỌNG:** Backend controllers/models/routes còn nguyên vẹn
- ✅ **QUAN TRỌNG:** Database schema không bị rollback
- ✅ npm run dev (client) chạy không lỗi
- ✅ npm start (server) chạy không lỗi
- ✅ Manual test: Dashboard, QuanLyDuAn, TaoTinDang hoạt động bình thường

---

## 🆘 ROLLBACK PLAN

Nếu có vấn đề:

```bash
# Restore từ backup
cp -r backup_before_pull/pages_ChuDuAn client/src/pages/ChuDuAn
cp -r backup_before_pull/components_ChuDuAn client/src/components/ChuDuAn
cp backup_before_pull/thue_tro.sql.bak thue_tro.sql
cp backup_before_pull/ChuDuAnController.js server/controllers/
cp backup_before_pull/ChuDuAnModel.js server/models/

# Reset git
git reset --hard HEAD
```

---

## 📝 NOTES

1. **Upstream vs Local:** Hai repos đang phát triển song song, không có chung base code cho module Chủ dự án
2. **Không thể auto-merge:** Git merge thông thường sẽ XÓA toàn bộ module Chủ dự án
3. **Strategy:** Cherry-pick có chọn lọc, ưu tiên bảo vệ code local
4. **Future:** Cần sync strategy rõ ràng giữa 2 repos để tránh conflicts lớn

**Prepared by:** GitHub Copilot  
**Date:** 2025-10-16
