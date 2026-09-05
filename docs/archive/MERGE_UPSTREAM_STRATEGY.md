# CHIẾN LƯỢC MERGE AN TOÀN - LOCAL Hop → UPSTREAM/Hop

**Ngày:** 21/10/2025  
**Mục tiêu:** Merge local changes lên upstream/Hop MÀ KHÔNG MẤT CODE hiện có trên upstream

---

## 🔍 PHÂN TÍCH TÌNH HUỐNG

### Local Hop (hoanhhop):
- **Commit:** dd7ece5 - "docs: update copilot-instructions.md"
- **Content:** Module Chủ dự án HOÀN CHỈNH (166 files từ merge trước)
  - 43 files frontend (pages + components)
  - Backend APIs (ChinhSachCocController, OperatorController)
  - Database extended (4239 lines)
  - 30+ documentation files

### Upstream/Hop (tienchung21):
- **Commit:** db21ff7 - "chung done"
- **Content:** Cơ bản, thiếu nhiều files so với local
- **292 files khác biệt!**

### ⚠️ NGUY CƠ:
Nếu `git push upstream Hop` trực tiếp → Git sẽ reject vì histories khác nhau (not fast-forward)

---

## 🎯 CHIẾN LƯỢC: 3-WAY MERGE

### Step 1: Tạo branch backup
```bash
git branch Hop-backup-before-merge
```

### Step 2: Pull upstream/Hop về local (merge)
```bash
git pull upstream Hop --no-rebase
# Sẽ tạo merge commit, kết hợp cả 2 histories
```

### Step 3: Resolve conflicts (nếu có)
```bash
# Git sẽ list conflicts
# Resolve thủ công, ưu tiên GIỮ LOCAL code
```

### Step 4: Verify merge
```bash
# Check module Chủ dự án còn nguyên
ls client/src/pages/ChuDuAn/
ls client/src/components/ChuDuAn/
```

### Step 5: Push merged branch lên upstream
```bash
git push upstream Hop
```

---

## 📋 FILES CẦN ĐẶC BIỆT CHÚ Ý

### 1. Module Chủ Dự Án (MUST KEEP):
```
client/src/pages/ChuDuAn/* (16 files)
client/src/components/ChuDuAn/* (27 files)
client/src/layouts/ChuDuAnLayout.*
```

### 2. Backend APIs (MUST KEEP):
```
server/controllers/ChinhSachCocController.js
server/controllers/OperatorController.js
server/controllers/ChuDuAnController.js
server/models/ChinhSachCocModel.js
server/models/ChuDuAnModel.js
server/routes/chinhSachCocRoutes.js
server/routes/operatorRoutes.js
```

### 3. Database (MUST MERGE):
```
thue_tro.sql (local 4239 lines vs upstream ???)
migrations/2025_10_16_*.sql
```

### 4. Documentation (MUST KEEP):
```
.github/copilot-instructions.md
docs/* (30+ files)
CLEANUP_*.md
MERGE_*.md
```

---

## 🔄 EXECUTION PLAN

### Phase 1: Backup & Preparation
```powershell
# Tạo backup branch
git branch Hop-backup-before-upstream-merge

# Verify current state
git log --oneline -5
git status
```

### Phase 2: Pull upstream/Hop (3-way merge)
```powershell
# Pull với merge strategy
git pull upstream Hop --no-rebase --no-ff

# Expected: Merge commit sẽ được tạo
# Có thể có conflicts
```

### Phase 3: Resolve Conflicts
**Nếu conflict xảy ra:**

#### A. Module Chủ Dự Án conflicts:
```bash
# ALWAYS keep local (ours)
git checkout --ours client/src/pages/ChuDuAn/*
git checkout --ours client/src/components/ChuDuAn/*
git add client/src/pages/ChuDuAn/
git add client/src/components/ChuDuAn/
```

#### B. Database conflicts:
```bash
# Manual merge thue_tro.sql
# Kết hợp cả 2 versions:
# - Upstream: tables/data mới (nếu có)
# - Local: procedures, triggers, extended fields (GIỮ LẠI)

git checkout --ours thue_tro.sql  # Lấy local trước
# Sau đó manually merge upstream changes vào
```

#### C. Config files conflicts (package.json, App.jsx):
```bash
# Manual merge cẩn thận
# Giữ dependencies cần thiết: react-icons, leaflet, recharts
```

### Phase 4: Verify Integrity
```powershell
# Check files count
(Get-ChildItem "client/src/pages/ChuDuAn" -File).Count  # Should be 16+
(Get-ChildItem "client/src/components/ChuDuAn" -File).Count  # Should be 27+

# Check backend
Test-Path "server/controllers/ChinhSachCocController.js"
Test-Path "server/models/ChuDuAnModel.js"

# Check database size
(Get-Content "thue_tro.sql" | Measure-Object -Line).Lines  # Should be ~4239
```

### Phase 5: Commit merge (if conflicts resolved)
```bash
git add .
git commit -m "merge: integrate local Hop changes into upstream/Hop

Local changes:
- Module Chủ dự án (43 files)
- Backend APIs (ChinhSachCocController, OperatorController)
- Database extensions (4239 lines)
- 30+ documentation files

Upstream changes:
- [List changes từ upstream nếu có]

Conflicts resolved:
- Kept local module Chủ dự án 100%
- Merged database schema
- Merged dependencies

Total: 166 files integrated"
```

### Phase 6: Push to upstream
```bash
git push upstream Hop
```

---

## 🚨 ROLLBACK PLAN

Nếu có vấn đề:

### Option 1: Abort merge
```bash
git merge --abort
```

### Option 2: Reset về backup
```bash
git reset --hard Hop-backup-before-upstream-merge
```

### Option 3: Force push local (NUCLEAR OPTION)
```bash
# CHỈ dùng nếu bạn chắc chắn muốn overwrite upstream
git push -f upstream Hop
```

---

## ⚙️ CONFLICT RESOLUTION RULES

### Rule 1: Module Chủ Dự Án
```
Conflict in: client/src/pages/ChuDuAn/*
Strategy: ALWAYS keep LOCAL (ours)
Reason: Upstream không có code này
```

### Rule 2: Backend APIs
```
Conflict in: server/controllers/*, server/models/*
Strategy: KEEP LOCAL first, then manually merge upstream additions
Reason: Local có full implementation
```

### Rule 3: Database
```
Conflict in: thue_tro.sql
Strategy: 3-way manual merge
- Keep local: procedures, triggers, extended fields
- Add upstream: new tables, new data (nếu có)
Result: Superset of both versions
```

### Rule 4: Dependencies
```
Conflict in: package.json
Strategy: Union of dependencies
- Keep local: react-icons, leaflet, recharts (CẦN CHO MODULE)
- Add upstream: new dependencies (nếu có)
```

### Rule 5: Routes
```
Conflict in: App.jsx
Strategy: Union of routes
- Keep local: /chu-du-an/* (6 routes)
- Add upstream: new routes (nếu có)
```

---

## ✅ SUCCESS CRITERIA

- [ ] Merge không có unresolved conflicts
- [ ] Module Chủ dự án: 16 pages + 27 components intact
- [ ] Backend APIs: ChinhSachCocController, OperatorController present
- [ ] Database: thue_tro.sql ~4239 lines
- [ ] Documentation: 30+ docs files present
- [ ] npm run dev (client) no errors
- [ ] npm start (server) no errors
- [ ] Push to upstream/Hop successful
- [ ] GitHub shows all files correctly

---

## 📊 PRE-MERGE CHECKLIST

- [x] Backup branch created: Hop-backup-before-upstream-merge
- [ ] Current branch: Hop
- [ ] Working directory clean (git status)
- [ ] Upstream fetched: git fetch upstream
- [ ] Ready to merge: git pull upstream Hop

---

**Prepared by:** GitHub Copilot  
**Date:** 2025-10-21  
**Risk Level:** 🟡 MEDIUM (292 files different, conflicts likely)
