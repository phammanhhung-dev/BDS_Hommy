# TODO: Emerald Noir Component Updates

**Status:** 🚧 In Progress  
**Priority:** High  
**Deadline:** Before merging to main branch

---

## 📋 Files Requiring Updates

### ✅ COMPLETED
- [x] `client/src/styles/ChuDuAnDesignSystem.css` - All CSS variables and colors updated
- [x] `client/src/pages/ChuDuAn/Dashboard.jsx` - Metric card classes updated (violet→emerald, orange→gold)

---

### ⚠️ PENDING UPDATES

#### 1. BaoCaoHieuSuat.jsx (Báo Cáo Hiệu Suất)
**File:** `client/src/pages/ChuDuAn/BaoCaoHieuSuat.jsx`  
**Lines:** 163, 165, 321, 358, 384, 421, 442

**Changes Required:**

```jsx
// Line 163, 165 - Chart color scheme
const CHART_COLORS = {
  primary: '#8b5cf6',     // ❌ OLD
  success: '#10b981',     // ✅ OK
  warning: '#f59e0b',     // ❌ OLD
};

// FIX TO:
const CHART_COLORS = {
  primary: '#14532D',     // ✅ Deep Emerald
  success: '#10b981',     // ✅ Success Green (unchanged)
  warning: '#D4AF37',     // ✅ Gold
  teal: '#0F766E',        // ✅ Add teal option
};

// Line 321 - Metric card class
<div className="cda-metric-card violet">
// FIX TO:
<div className="cda-metric-card emerald">

// Line 358, 384 - Chart SVG strokes
stroke="#8b5cf6"
fill="#8b5cf6"
// FIX TO:
stroke="#14532D"
fill="#14532D"

// Line 421 - Gradient background
background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
// FIX TO:
background: 'linear-gradient(135deg, #14532D 0%, #0F766E 100%)',
// Emerald → Teal

// Line 442 - Progress bar gradient
background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
// FIX TO:
background: 'linear-gradient(90deg, #14532D, #10b981)',
```

**Impact:** Charts, gradients, metric cards  
**Estimated Effort:** 10 minutes

---

#### 2. Dashboard.jsx (Additional Inline Styles)
**File:** `client/src/pages/ChuDuAn/Dashboard.jsx`  
**Lines:** 245, 261, 305, 314

**Changes Required:**

```jsx
// Line 245 - SVG stroke
stroke="#8b5cf6" 
// FIX TO:
stroke="#14532D"

// Line 261 - Occupancy stat dot
<div className="occupancy-stat-dot" style={{ background: '#8b5cf6' }}></div>
// FIX TO:
<div className="occupancy-stat-dot" style={{ background: '#14532D' }}></div>

// Line 305 - Status dot (warning color)
<span className="status-dot" style={{ background: '#f59e0b' }}></span>
// FIX TO:
<span className="status-dot" style={{ background: '#D4AF37' }}></span>

// Line 314 - Gradient background
background: 'linear-gradient(90deg, #f59e0b, #d97706)'
// FIX TO:
background: 'linear-gradient(90deg, #D4AF37, #B68C3A)'
// Gold → Antique Gold
```

**Impact:** Dashboard charts and status indicators  
**Estimated Effort:** 5 minutes

---

#### 3. QuanLyCuocHen.jsx (Quản Lý Cuộc Hẹn)
**File:** `client/src/pages/ChuDuAn/QuanLyCuocHen.jsx`  
**Line:** 296

**Changes Required:**

```jsx
// Line 296 - Metric card class
<div className="metric-card violet" onClick={() => applyQuickFilter('cho-duyet')}>
// FIX TO:
<div className="metric-card emerald" onClick={() => applyQuickFilter('cho-duyet')}>
```

**Impact:** Appointment metrics filter cards  
**Estimated Effort:** 2 minutes

---

#### 4. TaoTinDang.jsx (Tạo Tin Đăng)
**File:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`  
**Lines:** 976, 1027

**Changes Required:**

```jsx
// Line 976 - Warning icon color
color: '#f59e0b',
// FIX TO:
color: '#D4AF37',

// Line 1027 - Conditional color (coordinates)
color: viDo && kinhDo ? '#8b5cf6' : '#6b7280',
// FIX TO:
color: viDo && kinhDo ? '#14532D' : '#6b7280',
// Emerald if has coords, gray if not
```

**Impact:** Form validation icons and coordinate status  
**Estimated Effort:** 3 minutes

---

#### 5. QuanLyTinDang.jsx (Quản Lý Tin Đăng)
**File:** `client/src/pages/ChuDuAn/QuanLyTinDang.jsx`  
**Line:** 103

**Changes Required:**

```jsx
// Line 103 - Status color mapping
'ChoDuyet': { label: 'Chờ duyệt', badge: 'warning', color: '#f59e0b' },
// FIX TO:
'ChoDuyet': { label: 'Chờ duyệt', badge: 'warning', color: '#D4AF37' },
```

**Impact:** Post status badge colors  
**Estimated Effort:** 2 minutes

---

#### 6. ChiTietTinDang.jsx (Chi Tiết Tin Đăng)
**File:** `client/src/pages/ChuDuAn/ChiTietTinDang.jsx`  
**Lines:** 36 (comment), 318

**Changes Required:**

```jsx
// Line 36 - Update comment
* - High contrast: Purple (#8b5cf6) + vibrant shadows
// FIX TO:
* - High contrast: Emerald (#14532D) + gold accents

// Line 318 - Warning color
color: '#f59e0b' 
// FIX TO:
color: '#D4AF37'
```

**Impact:** Comment documentation + warning text color  
**Estimated Effort:** 2 minutes

---

#### 7. ChinhSuaTinDang.jsx (Chỉnh Sửa Tin Đăng) - **LARGEST FILE**
**File:** `client/src/pages/ChuDuAn/ChinhSuaTinDang.jsx`  
**Lines:** 983, 1046, 1070, 1140, 1273, 1556

**Changes Required:**

```jsx
// Line 983, 1070, 1273 - Light bulb icon color (3 occurrences)
<HiOutlineLightBulb style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0 }} />
// FIX TO:
<HiOutlineLightBulb style={{ width: '16px', height: '16px', color: '#D4AF37', flexShrink: 0 }} />

// Line 1046 - Switch case color
case 'ChoDuyet': return '#f59e0b';
// FIX TO:
case 'ChoDuyet': return '#D4AF37';

// Line 1140 - Warning text color
color: '#f59e0b',
// FIX TO:
color: '#D4AF37',

// Line 1556 - Button gradient background
background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
// FIX TO:
background: 'linear-gradient(135deg, #D4AF37 0%, #B68C3A 100%)',
// Gold → Antique Gold
```

**Impact:** Edit form icons, status colors, button gradients  
**Estimated Effort:** 8 minutes

---

## 🎯 Summary Statistics

| Status | Files | Lines to Change | Estimated Time |
|--------|-------|-----------------|----------------|
| ✅ Completed | 2 | ~20 | 15 min |
| ⚠️ Pending | 7 | ~35 | 32 min |
| **Total** | **9** | **~55** | **47 min** |

---

## 🔧 Batch Update Strategy

### Option 1: Manual Find & Replace (Recommended)
Use VS Code's Find & Replace with regex:

1. **Purple Primary (`#8b5cf6` → `#14532D`):**
   ```
   Find: #8b5cf6
   Replace: #14532D
   Scope: client/src/pages/ChuDuAn/**/*.jsx
   ```

2. **Orange/Warning (`#f59e0b` → `#D4AF37`):**
   ```
   Find: #f59e0b
   Replace: #D4AF37
   Scope: client/src/pages/ChuDuAn/**/*.jsx
   ```

3. **Orange Dark (`#d97706` → `#B68C3A`):**
   ```
   Find: #d97706
   Replace: #B68C3A
   Scope: client/src/pages/ChuDuAn/**/*.jsx
   ```

4. **Metric Card Classes:**
   ```
   Find: (className="[^"]*\s)violet(\s[^"]*)
   Replace: $1emerald$2
   
   Find: (className="[^"]*\s)orange(\s[^"]*)
   Replace: $1gold$2
   ```

### Option 2: Script-based Replacement
Create Node.js script:

```javascript
// scripts/update-emerald-colors.js
const fs = require('fs');
const glob = require('glob');

const COLOR_MAP = {
  '#8b5cf6': '#14532D',  // Purple → Deep Emerald
  '#f59e0b': '#D4AF37',  // Orange → Gold
  '#d97706': '#B68C3A',  // Orange Dark → Antique Gold
};

const CLASS_MAP = {
  'violet': 'emerald',
  'orange': 'gold',
};

glob('client/src/pages/ChuDuAn/**/*.jsx', (err, files) => {
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace colors
    Object.entries(COLOR_MAP).forEach(([old, new]) => {
      content = content.replaceAll(old, new);
    });
    
    // Replace class names (careful with word boundaries)
    Object.entries(CLASS_MAP).forEach(([old, new]) => {
      const regex = new RegExp(`(className="[^"]*\\s)${old}(\\s[^"]*)`, 'g');
      content = content.replace(regex, `$1${new}$2`);
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  });
});
```

---

## ⚠️ Cautions

### Before Running Bulk Updates:

1. **Commit current state** (rollback point):
   ```bash
   git add .
   git commit -m "checkpoint: before emerald color replacements"
   ```

2. **Test selectively:** Update 1-2 files first, test in browser

3. **Watch for false positives:**
   - Comments with color names (e.g., "// Purple theme")
   - Color names in strings (e.g., `"This is a violet card"`)
   - External library colors (shouldn't have any in ChuDuAn module)

4. **Verify chart libraries:** If using Recharts/Chart.js, check their color prop names

---

## ✅ Verification Checklist

After updates:

- [ ] Run `npm run build` in client directory (no errors)
- [ ] Visual test: Dashboard page shows emerald/teal/gold metrics
- [ ] Visual test: Charts use emerald colors instead of purple
- [ ] Visual test: Badges/status dots use gold (#D4AF37) for warnings
- [ ] Visual test: Form validation icons use emerald (#14532D)
- [ ] Browser console: No React warnings about invalid colors
- [ ] Lighthouse accessibility: No color contrast issues (WCAG AA)

---

## 📝 Related Documents

- [EMERALD_NOIR_MIGRATION_COMPLETE.md](./EMERALD_NOIR_MIGRATION_COMPLETE.md) - Full migration spec
- [DESIGN_SYSTEM_COLOR_PALETTES.md](./DESIGN_SYSTEM_COLOR_PALETTES.md) - Color palette reference
- [COLOR_PALETTE_UPDATE_SUMMARY.md](./COLOR_PALETTE_UPDATE_SUMMARY.md) - Implementation roadmap

---

**Last Updated:** 2025-01-XX  
**Next Action:** Choose batch update strategy (manual or script) and execute component updates
