# 🔒 ROLLBACK PLAN - Dashboard & Báo cáo Optimization

## Mục đích
Document này cung cấp hướng dẫn rollback chi tiết nếu triển khai gặp vấn đề.

---

## ✅ Pre-deployment Checklist

### 1. Database Backup
```bash
# Backup database trước khi chạy migration
cd D:\Vo Nguyen Hoanh Hop_J Liff\xampp\mysql\bin
.\mysqldump.exe -u root -p thue_tro > D:\backups\thue_tro_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Git Commit Current State
```bash
# Commit trạng thái hiện tại
git add .
git commit -m "chore: backup before dashboard optimization"
git push upstream Hop
```

### 3. Create Feature Branch
```bash
# Tạo branch riêng cho tính năng
git checkout -b feature/dashboard-optimization
```

---

## 📦 Files Affected (Isolation Strategy)

### ✅ SAFE TO MODIFY (No impact on other pages)
```
client/src/pages/ChuDuAn/
├── Dashboard.jsx          # ✅ Isolated component
├── Dashboard.css          # ✅ Scoped styles
├── BaoCaoHieuSuat.jsx     # ✅ Isolated component
└── BaoCaoHieuSuat.css     # ✅ Scoped styles

client/src/services/
└── ChuDuAnService.js      # ✅ Only BaoCaoService section modified

client/src/hooks/
└── useDashboardData.js    # ✅ New file, no conflicts
```

### ⚠️ SHARED DEPENDENCIES (Already modified in Phase 3)
```
client/src/main.jsx        # QueryClientProvider setup (ALREADY DONE)
package.json               # Dependencies (ALREADY INSTALLED)
```

### 🚫 DO NOT TOUCH
```
client/src/pages/ChuDuAn/
├── QuanLyTinDang.jsx      # ❌ Leave as-is
├── QuanLyTinDang_new.jsx  # ❌ Leave as-is
├── TaoTinDang.jsx         # ❌ Leave as-is
├── QuanLyDuAn.jsx         # ❌ Leave as-is
└── CaiDat.jsx             # ❌ Leave as-is

client/src/layouts/
└── ChuDuAnLayout.jsx      # ❌ Leave as-is

client/src/components/ChuDuAn/
└── NavigationChuDuAn.jsx  # ❌ Leave as-is
```

---

## 🔄 Rollback Procedures

### Scenario 1: Migration Failed (Indexes không tạo được)

**Symptoms:**
- SQL error khi chạy migration
- SHOW INDEXES không hiển thị 16 indexes mới

**Rollback:**
```sql
-- Chạy rollback section trong migration file
DROP INDEX IF EXISTS idx_tindang_duan_trangthai ON tindang;
DROP INDEX IF EXISTS idx_tindang_taoluc ON tindang;
-- ... (xem full list trong 2025_10_24_add_reporting_indexes.sql)
```

**Verification:**
```bash
cd migrations
mysql -u root -p thue_tro < verify_indexes.sql
# Expected: 0 custom indexes found
```

---

### Scenario 2: Backend APIs Return Errors

**Symptoms:**
- /bao-cao-hieu-suat trả về 500 error
- Model methods throw SQL exceptions

**Rollback:**
```bash
# Revert backend changes
git checkout upstream/Hop -- server/models/ChuDuAnModel.js
git checkout upstream/Hop -- server/controllers/ChuDuAnController.js
git checkout upstream/Hop -- server/routes/chuDuAnRoutes.js

# Restart server
cd server
npm run dev
```

**Verification:**
```bash
node migrations/test-backend-apis.js
# Expected: All 5 endpoints return 200 OK (old response structure)
```

---

### Scenario 3: Frontend Crashes (Dashboard/Báo cáo)

**Symptoms:**
- White screen of death
- React error boundary triggered
- "Cannot read property of undefined"

**Rollback Dashboard ONLY:**
```bash
# Revert Dashboard changes
git checkout upstream/Hop -- client/src/pages/ChuDuAn/Dashboard.jsx
git checkout upstream/Hop -- client/src/pages/ChuDuAn/Dashboard.css

# Keep infrastructure (React Query, hooks, services)
# Xóa useDashboardData usage nếu cần
```

**Rollback Báo cáo ONLY:**
```bash
git checkout upstream/Hop -- client/src/pages/ChuDuAn/BaoCaoHieuSuat.jsx
git checkout upstream/Hop -- client/src/pages/ChuDuAn/BaoCaoHieuSuat.css
```

**Verification:**
```bash
cd client
npm run dev
# Navigate to http://localhost:5173/chu-du-an/dashboard
# Expected: Old mock data UI loads successfully
```

---

### Scenario 4: React Query Causing Issues

**Symptoms:**
- Infinite loading states
- Query keys collision
- DevTools shows stale data

**Temporary Fix:**
```javascript
// client/src/pages/ChuDuAn/Dashboard.jsx
// Comment out React Query hooks, use direct fetch

// BEFORE (with React Query)
const { data, isLoading } = useDashboardData();

// AFTER (direct fetch)
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  BaoCaoService.layBaoCaoHieuSuat()
    .then(res => setData(res.data))
    .catch(console.error)
    .finally(() => setIsLoading(false));
}, []);
```

**Full Rollback React Query:**
```bash
# Revert main.jsx
git checkout upstream/Hop -- client/src/main.jsx

# Remove hooks
rm client/src/hooks/useDashboardData.js

# Restart client
cd client
npm run dev
```

---

### Scenario 5: Recharts Render Issues

**Symptoms:**
- Charts not displaying
- "ResponsiveContainer height undefined"
- SVG overflow issues

**Temporary Fix:**
```jsx
// Add explicit height to ResponsiveContainer
<ResponsiveContainer width="100%" height={400}> {/* Add height={400} */}
  <LineChart data={data}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

**Fallback to CSS Charts:**
```bash
# Revert to CSS-based charts (old implementation)
git checkout upstream/Hop -- client/src/pages/ChuDuAn/Dashboard.jsx
git checkout upstream/Hop -- client/src/pages/ChuDuAn/Dashboard.css
```

---

## 🧪 Testing Before Rollback

**Always test these scenarios BEFORE declaring rollback success:**

### 1. Database Integrity
```sql
-- Verify no data loss
SELECT COUNT(*) FROM tindang;
SELECT COUNT(*) FROM cuochen;
SELECT COUNT(*) FROM coc;

-- Verify indexes still functional (after partial rollback)
EXPLAIN SELECT * FROM tindang WHERE DuAnID = 1 AND TrangThai = 'HoatDong';
```

### 2. Other Pages Still Work
```
✅ Navigate to /chu-du-an/quan-ly-tin-dang
✅ Navigate to /chu-du-an/tao-tin-dang
✅ Navigate to /chu-du-an/quan-ly-du-an
✅ Navigate to /chu-du-an/cai-dat

Expected: All pages load without errors
```

### 3. Existing APIs Unchanged
```bash
# Test existing endpoints (not modified)
curl http://localhost:5000/api/chu-du-an/tin-dang
curl http://localhost:5000/api/chu-du-an/cuoc-hen
curl http://localhost:5000/api/chu-du-an/dashboard  # Old endpoint

Expected: All return 200 OK
```

---

## 📝 Post-Rollback Actions

### 1. Document What Went Wrong
```markdown
## Rollback Report - [Date]

**Issue:** [Description]
**Affected Components:** [List]
**Root Cause:** [Analysis]
**Rollback Steps Taken:** [List]
**Lessons Learned:** [Insights]
**Next Actions:** [Plan]
```

### 2. Clean Up Artifacts
```bash
# Remove unused dependencies (if React Query/Recharts not needed)
cd client
npm uninstall recharts @tanstack/react-query date-fns react-to-print xlsx

# Remove migration (if indexes caused issues)
rm migrations/2025_10_24_add_reporting_indexes.sql
```

### 3. Restore Branch
```bash
# Merge rollback to main branch
git checkout Hop
git merge feature/dashboard-optimization --no-ff
git push upstream Hop

# Delete feature branch
git branch -d feature/dashboard-optimization
```

---

## 🔐 Emergency Contacts

**If rollback fails or database corrupted:**

1. **Stop all services immediately**
   ```bash
   # Stop backend
   pkill -f "node.*server"
   
   # Stop XAMPP MySQL
   # Via XAMPP Control Panel: Stop MySQL
   ```

2. **Restore from backup**
   ```bash
   cd D:\Vo Nguyen Hoanh Hop_J Liff\xampp\mysql\bin
   .\mysql.exe -u root -p thue_tro < D:\backups\thue_tro_backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verify restoration**
   ```bash
   mysql -u root -p
   USE thue_tro;
   SHOW TABLES;
   SELECT COUNT(*) FROM nguoidung;
   ```

---

## 📊 Success Metrics (Post-Deployment)

**After successful deployment, verify:**

- [ ] 16 indexes created (verify_indexes.sql shows ✅)
- [ ] All 5 backend endpoints return 200 OK
- [ ] Dashboard loads in < 1.5s
- [ ] Báo cáo loads in < 2s
- [ ] No console errors in browser
- [ ] React Query DevTools shows cached data
- [ ] Recharts render correctly on all screen sizes
- [ ] Export PDF/Excel works (Báo cáo page)
- [ ] Other pages (QuanLyTinDang, TaoTinDang, etc.) unaffected

---

## 🔗 Related Documents

- `docs/DASHBOARD_BAOCAO_OPTIMIZATION_PLAN.md` - Full implementation plan
- `docs/DASHBOARD_METRICS_ANALYSIS.md` - Metrics mapping
- `migrations/2025_10_24_add_reporting_indexes.sql` - Database migration
- `migrations/test-backend-apis.js` - API testing script
- `.github/copilot-instructions.md` - Development guidelines

---

**Last Updated:** 2025-10-24  
**Version:** 1.0  
**Status:** Pre-deployment
