# PHASE 6: Cleanup & Documentation

## 📋 Overview

**Objective:** Dọn dẹp code cũ và finalize documentation  
**Status:** ⏳ PENDING  
**Dependencies:** PHASE 2, 3, 4, 5 completed

---

## 🗑️ Cleanup Tasks

### 1. Delete Old Files

**Models to Remove:**
- ✅ `server/models/ChuDuAnModel.js` (1648 dòng)
  - ⚠️ **CHỈ XÓA SAU KHI** verify tất cả imports đã update

**Controllers to Remove:**
- ✅ `server/controllers/ChuDuAnController.js` (1591 dòng)
  - ⚠️ **CHỈ XÓA SAU KHI** verify tất cả routes đã update

**CSS Files to Remove (if unused):**
- ⚠️ `client/src/pages/ChuDuAn/TaoTinDang.css` (nếu không được sử dụng)
- Check và xóa các CSS files legacy khác

**Verification Commands:**
```bash
# Check if ChuDuAnModel is still imported anywhere
grep -r "ChuDuAnModel" server/ --include="*.js" | grep "require"

# Check if ChuDuAnController is still imported
grep -r "ChuDuAnController" server/ --include="*.js" | grep "require"

# Check CSS usage
grep -r "TaoTinDang.css" client/src/ --include="*.jsx" --include="*.tsx"
```

**Deletion Script:**
```bash
#!/bin/bash
# cleanup.sh - Remove old files after verification

echo "⚠️ IMPORTANT: Verify all imports updated before running this script!"
read -p "Have you verified all imports? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled. Please verify imports first."
  exit 1
fi

# Backup old files before deletion
mkdir -p backup/models backup/controllers
cp server/models/ChuDuAnModel.js backup/models/
cp server/controllers/ChuDuAnController.js backup/controllers/

# Delete old files
rm server/models/ChuDuAnModel.js
rm server/controllers/ChuDuAnController.js

echo "✅ Old files removed. Backups saved in ./backup/"
```

---

### 2. Update Imports

#### Routes Files

**File:** `server/routes/chuDuAnRoutes.js` (hoặc tương đương)

**Before:**
```javascript
const ChuDuAnController = require('../controllers/ChuDuAnController');

router.post('/api/chu-du-an/tin-dang', ChuDuAnController.taoTinDang);
router.get('/api/chu-du-an/tin-dang', ChuDuAnController.layDanhSachTinDang);
router.get('/api/chu-du-an/cuoc-hen', ChuDuAnController.layDanhSachCuocHen);
// ... etc
```

**After:**
```javascript
const TinDangController = require('../controllers/TinDangController');
const DuAnController = require('../controllers/DuAnController');
const CuocHenController = require('../controllers/CuocHenController');
const BaoCaoHieuSuatController = require('../controllers/BaoCaoHieuSuatController');

// Tin Dang routes
router.post('/api/chu-du-an/tin-dang', TinDangController.taoTinDang);
router.get('/api/chu-du-an/tin-dang', TinDangController.layDanhSachTinDang);

// Du An routes
router.get('/api/chu-du-an/du-an', DuAnController.layDanhSachDuAn);
router.post('/api/chu-du-an/du-an', DuAnController.taoDuAn);

// Cuoc Hen routes
router.get('/api/chu-du-an/cuoc-hen', CuocHenController.layDanhSachCuocHen);
router.put('/api/chu-du-an/cuoc-hen/:id/xac-nhan', CuocHenController.xacNhanCuocHen);

// Bao Cao routes
router.get('/api/chu-du-an/bao-cao', BaoCaoHieuSuatController.layBaoCaoHieuSuat);
```

**Verification:**
```bash
# Test all routes still work
npm test -- --testPathPattern=routes
```

---

### 3. Update Documentation

#### API Documentation

**File:** `docs/API.md` (nếu có)

**Updates needed:**
- [ ] Document new routes structure
- [ ] Update endpoint paths if changed
- [ ] Document new model methods
- [ ] Update request/response examples

#### README Updates

**File:** `README.md`

**Add sections:**
```markdown
## Architecture

### Models
- `TinDangModel` - Quản lý Tin Đăng
- `DuAnModel` - Quản lý Dự Án
- `CuocHenModel` - Quản lý Cuộc Hẹn
- `BaoCaoHieuSuatModel` - Báo cáo và thống kê
- `ChinhSachCocModel` - Chính sách cọc

### Controllers
- `TinDangController` - API endpoints cho Tin Đăng
- `DuAnController` - API endpoints cho Dự Án
- `CuocHenController` - API endpoints cho Cuộc Hẹn
- `BaoCaoHieuSuatController` - API endpoints cho Báo cáo

### CSS Conventions
- **BEM Naming:** All CSS classes follow BEM methodology
- See [BEM Migration Guide](docs/BEM_MIGRATION_GUIDE.md) for details
```

---

### 4. Code Quality Checks

#### ESLint/Prettier

```bash
# Run linter on new files
npm run lint server/models/TinDangModel.js
npm run lint server/controllers/TinDangController.js

# Auto-fix issues
npm run lint:fix
```

#### Remove Console Logs

```bash
# Find console.log statements
grep -r "console\\.log" server/models/ server/controllers/

# Remove them or replace with proper logging
```

#### Check for TODOs

```bash
# Find all TODO comments
grep -r "TODO" server/ client/ docs/

# Address or document them
```

---

### 5. Git Cleanup

#### Commit Organization

```bash
# PHASE 2: Models
git add server/models/TinDangModel.js
git add server/models/DuAnModel.js
git add server/models/CuocHenModel.js
git add server/models/BaoCaoHieuSuatModel.js
git commit -m "refactor(models): split ChuDuAnModel into domain-specific models

- Create TinDangModel with 6 methods
- Create DuAnModel with 9 methods
- Create CuocHenModel with 5 methods
- Create BaoCaoHieuSuatModel with 5 methods

BREAKING CHANGE: ChuDuAnModel split into 4 separate models.
Update imports in controllers and services.

Co-authored-by: AI Agent <ai@cursor.com>"

# PHASE 3: Controllers
git add server/controllers/TinDangController.js
git add server/controllers/DuAnController.js
git add server/controllers/CuocHenController.js
git add server/controllers/BaoCaoHieuSuatController.js
git commit -m "refactor(controllers): split ChuDuAnController into domain-specific controllers

- Create TinDangController with 10 endpoints
- Create DuAnController with 9 endpoints
- Create CuocHenController with 5 endpoints
- Create BaoCaoHieuSuatController with 5 endpoints

BREAKING CHANGE: ChuDuAnController split into 4 separate controllers.
Update route imports.

Co-authored-by: AI Agent <ai@cursor.com>"

# PHASE 4: CSS (per file)
git add client/src/components/ChuDuAn/ModalCapNhatDuAn.css
git add client/src/components/ChuDuAn/ModalCapNhatDuAn.jsx
git commit -m "refactor(css): migrate ModalCapNhatDuAn to BEM naming

- Migrate CSS to BEM with block modal-cap-nhat-du-an
- Update JSX className references
- Rename animations to avoid conflicts

Co-authored-by: AI Agent <ai@cursor.com>"

# PHASE 6: Cleanup
git rm server/models/ChuDuAnModel.js
git rm server/controllers/ChuDuAnController.js
git commit -m "chore: remove old monolithic model and controller files

- Remove ChuDuAnModel.js (1648 lines)
- Remove ChuDuAnController.js (1591 lines)
- Functionality now in domain-specific files

Co-authored-by: AI Agent <ai@cursor.com>"
```

#### Branch Strategy

```bash
# Create feature branch for refactor
git checkout -b refactor/split-chu-du-an-models-controllers

# Work on phases...

# When ready, create PR
git push origin refactor/split-chu-du-an-models-controllers

# Create Pull Request with detailed description
```

**PR Template:**
```markdown
## Refactor: Split ChuDuAn Models & Controllers

### Summary
Split monolithic `ChuDuAnModel` (1648 lines) and `ChuDuAnController` (1591 lines) into domain-specific modules for better maintainability and adherence to Single Responsibility Principle.

### Changes

#### PHASE 2: Models
- ✅ Created `TinDangModel` (6 methods)
- ✅ Created `DuAnModel` (9 methods)
- ✅ Created `CuocHenModel` (5 methods)
- ✅ Created `BaoCaoHieuSuatModel` (5 methods)

#### PHASE 3: Controllers
- ✅ Created `TinDangController` (10 endpoints)
- ✅ Created `DuAnController` (9 endpoints)
- ✅ Created `CuocHenController` (5 endpoints)
- ✅ Created `BaoCaoHieuSuatController` (5 endpoints)

#### PHASE 4: CSS Migration (Partial)
- ✅ Migrated `ModalCapNhatDuAn` to BEM (2/38 files)
- ✅ Migrated `Login` page to BEM
- 📋 Remaining: 36 CSS files (see docs/REFACTOR_PHASE4_CSS_MIGRATION_SUMMARY.md)

#### PHASE 5: Testing
- ⏳ Pending (test plan created)

#### PHASE 6: Cleanup
- ✅ Removed old files
- ✅ Updated documentation

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing completed
- [ ] No visual regressions

### Documentation
- [x] Updated API docs
- [x] Updated README
- [x] Created migration guides
- [x] Documented breaking changes

### Breaking Changes
- `ChuDuAnModel` split into 4 models - update imports
- `ChuDuAnController` split into 4 controllers - update routes
- CSS class names changed to BEM format (2 components)

### Checklist
- [x] Code follows project style guidelines
- [x] Self-review completed
- [ ] Tests added/updated
- [x] Documentation updated
- [ ] No console.log statements
- [x] No linter errors
```

---

### 6. Performance Verification

#### Database Query Analysis

```sql
-- Check if new queries are optimized
EXPLAIN ANALYZE SELECT * FROM TinDang WHERE ChuDuAnID = 123;

-- Compare with old queries
-- Verify no N+1 query issues
```

#### Load Testing

```bash
# Use Artillery or k6 for load testing
artillery quick --count 10 --num 100 http://localhost:5000/api/chu-du-an/tin-dang

# Compare response times before/after refactor
```

---

## 📝 Final Documentation

### 1. Architecture Decision Records (ADRs)

**File:** `docs/ADR-001-split-chu-du-an-models.md`

```markdown
# ADR-001: Split ChuDuAnModel into Domain-Specific Models

## Status
Accepted

## Context
`ChuDuAnModel.js` had grown to 1648 lines with 29 methods covering multiple domains: TinDang, DuAn, CuocHen, BaoCaoHieuSuat. This violated Single Responsibility Principle and made maintenance difficult.

## Decision
Split into 4 domain-specific models:
1. TinDangModel
2. DuAnModel
3. CuocHenModel
4. BaoCaoHieuSuatModel

## Consequences
**Positive:**
- Easier to maintain and test
- Clear separation of concerns
- Better code organization

**Negative:**
- More files to manage
- Need to update all imports
- Breaking change for dependent code

## Implementation
See docs/REFACTOR_PHASE2_SUMMARY.md for details.
```

### 2. Changelog

**File:** `CHANGELOG.md`

```markdown
# Changelog

## [2.0.0] - 2025-11-04

### Changed (BREAKING)
- **Models:** Split `ChuDuAnModel` into 4 domain-specific models
- **Controllers:** Split `ChuDuAnController` into 4 domain-specific controllers
- **CSS:** Migrate components to BEM naming convention

### Added
- TinDangModel, DuAnModel, CuocHenModel, BaoCaoHieuSuatModel
- TinDangController, DuAnController, CuocHenController, BaoCaoHieuSuatController
- Comprehensive documentation in docs/ folder
- BEM Migration Guide

### Removed
- Old monolithic ChuDuAnModel.js (1648 lines)
- Old monolithic ChuDuAnController.js (1591 lines)

### Migration Guide
See docs/REFACTOR_MIGRATION_GUIDE.md for step-by-step instructions.
```

---

## ✅ Completion Checklist

- [ ] All old files removed (after verification)
- [ ] All imports updated
- [ ] All routes tested
- [ ] Documentation updated
- [ ] ADRs written
- [ ] CHANGELOG updated
- [ ] Performance verified (no regression)
- [ ] Git commits organized
- [ ] Pull Request created and reviewed
- [ ] Merged to main branch
- [ ] Tagged release (v2.0.0)

---

**Status:** ⏳ PENDING  
**Dependencies:** PHASE 2, 3, 4, 5  
**Estimated Time:** 1-2 days


















