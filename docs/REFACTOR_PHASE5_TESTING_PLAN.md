# PHASE 5: Testing Plan

## 📋 Overview

**Objective:** Comprehensive testing của refactored codebase  
**Status:** ⏳ PENDING (chờ hoàn thành PHASE 4)  
**Dependencies:** PHASE 2 (Models), PHASE 3 (Controllers), PHASE 4 (CSS)

---

## 🧪 Testing Strategy

### 1. Unit Tests - Models

**Target:** 4 models mới đã tách từ ChuDuAnModel

#### TinDangModel
- ✅ `layDanhSachTinDang(chuDuAnId, filters)`
- ✅ `layChiTietTinDang(tinDangId, chuDuAnId)`
- ✅ `taoTinDang(chuDuAnId, tinDangData)`
- ✅ `capNhatTinDang(tinDangId, chuDuAnId, updateData)`
- ✅ `guiTinDangDeDuyet(tinDangId, chuDuAnId)`
- ✅ `xoaTinDang(tinDangId, chuDuAnId, lyDoXoa)`

#### DuAnModel
- ✅ `layDanhSachDuAn(chuDuAnId)`
- ✅ `layChiTietDuAn(duAnId, chuDuAnId)`
- ✅ `taoDuAn(chuDuAnId, data)`
- ✅ `capNhatDuAn(duAnId, chuDuAnId, data)`
- ✅ `luuTruDuAn(duAnId, chuDuAnId)`

#### CuocHenModel
- ✅ `layDanhSachCuocHen(chuDuAnId, filters)`
- ✅ `xacNhanCuocHen(cuocHenId, chuDuAnId, ghiChu)`
- ✅ `pheDuyetCuocHen(cuocHenId, chuDuAnId, phuongThucVao, ghiChu)`
- ✅ `tuChoiCuocHen(cuocHenId, chuDuAnId, lyDoTuChoi)`
- ✅ `layMetricsCuocHen(chuDuAnId)`

#### BaoCaoHieuSuatModel
- ✅ `layBaoCaoHieuSuat(chuDuAnId, filters)`
- ✅ `layDoanhThuTheoThang(chuDuAnId)`
- ✅ `layTopTinDang(chuDuAnId, filters)`
- ✅ `layConversionRate(chuDuAnId, filters)`
- ✅ `layBaoCaoHieuSuatChiTiet(chuDuAnId, filters)`

**Test Framework:** Jest / Mocha  
**Mocking:** Sinon.js for DB calls

**Example Test:**
```javascript
// tests/models/TinDangModel.test.js
const TinDangModel = require('../../server/models/TinDangModel');
const db = require('../../server/config/db');

jest.mock('../../server/config/db');

describe('TinDangModel', () => {
  describe('layDanhSachTinDang', () => {
    it('should return list of TinDang for given ChuDuAnId', async () => {
      // Mock DB response
      db.query.mockResolvedValue([[
        { TinDangID: 1, TieuDe: 'Test Tin Dang' }
      ]]);

      const result = await TinDangModel.layDanhSachTinDang(123);
      
      expect(result).toHaveLength(1);
      expect(result[0].TieuDe).toBe('Test Tin Dang');
    });
  });
});
```

---

### 2. Integration Tests - Controllers

**Target:** 4 controllers mới

#### TinDangController
- Test endpoints: POST, GET, PUT, DELETE `/api/chu-du-an/tin-dang`
- Verify authorization middleware
- Check response format
- Test error handling

#### DuAnController
- Test CRUD operations for Du An
- Test cascading updates/deletes
- Verify audit logs

#### CuocHenController
- Test workflow: Tạo → Xác nhận → Phê duyệt/Từ chối
- Test metrics aggregation

#### BaoCaoHieuSuatController
- Test complex queries
- Verify data aggregation accuracy
- Test filtering and pagination

**Test Framework:** Supertest + Jest  
**Setup:** Test database with seed data

**Example Test:**
```javascript
// tests/controllers/TinDangController.test.js
const request = require('supertest');
const app = require('../../server/app');

describe('TinDangController', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'hashed_password' });
    
    authToken = res.body.token;
  });

  describe('POST /api/chu-du-an/tin-dang', () => {
    it('should create new TinDang', async () => {
      const res = await request(app)
        .post('/api/chu-du-an/tin-dang')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          DuAnID: 1,
          TieuDe: 'Test Tin Dang',
          MoTa: 'Description',
          PhongIDs: [1, 2, 3]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('TinDangID');
    });
  });
});
```

---

### 3. Visual Regression Tests - CSS

**Target:** Migrated BEM CSS files

#### Tools
- **Percy.io** or **BackstopJS** for screenshot comparison
- **Storybook** for component isolation

#### Test Coverage
- [ ] ModalCapNhatDuAn - All states
- [ ] Login Page - Normal & Rainbow mode
- [ ] All remaining migrated components

**Workflow:**
1. Capture baseline screenshots BEFORE BEM migration
2. Migrate to BEM
3. Capture new screenshots AFTER migration
4. Compare pixel-by-pixel for differences
5. Approve or fix discrepancies

**Example BackstopJS Config:**
```json
{
  "id": "bem_migration_test",
  "viewports": [
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "mobile",
      "width": 375,
      "height": 667
    }
  ],
  "scenarios": [
    {
      "label": "ModalCapNhatDuAn",
      "url": "http://localhost:3000/chu-du-an/du-an?openModal=true",
      "selectors": [".modal-cap-nhat-du-an"]
    },
    {
      "label": "Login Page",
      "url": "http://localhost:3000/login",
      "selectors": [".login-page"]
    }
  ]
}
```

---

### 4. End-to-End Tests

**Target:** Critical user workflows

#### Workflows to Test
1. **Chủ Dự Án - Tạo Tin Đăng**
   - Login
   - Navigate to Dự Án
   - Select phòng
   - Create tin đăng
   - Submit for approval
   - Verify tin đăng appears in list

2. **Chủ Dự Án - Quản Lý Cuộc Hẹn**
   - View list of cuộc hẹn
   - Xác nhận cuộc hẹn
   - Phê duyệt/Từ chối
   - Verify audit log

3. **Chủ Dự Án - Xem Báo Cáo**
   - Navigate to Dashboard
   - View charts and metrics
   - Filter by date range
   - Export data

**Test Framework:** Playwright or Cypress

**Example E2E Test:**
```javascript
// tests/e2e/tao-tin-dang.spec.js
describe('Tạo Tin Đăng Flow', () => {
  it('should create tin dang successfully', async () => {
    await page.goto('http://localhost:3000/login');
    
    // Login
    await page.fill('#email', 'chuduan@example.com');
    await page.fill('#password', 'password123');
    await page.click('.login-page__submit-btn');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/chu-du-an/dashboard');
    
    // Navigate to Tạo Tin Đăng
    await page.click('text=Tạo tin đăng');
    
    // Fill form
    await page.selectOption('#DuAnID', '1');
    await page.fill('#TieuDe', 'Test Tin Dang E2E');
    await page.fill('#MoTa', 'Test Description');
    
    // Select phòng
    await page.click('text=Chọn phòng');
    await page.check('[data-phong-id="1"]');
    await page.check('[data-phong-id="2"]');
    await page.click('text=Xác nhận');
    
    // Submit
    await page.click('.tao-tin-dang__btn--primary');
    
    // Verify success message
    await expect(page.locator('.tao-tin-dang__success')).toContainText('Tạo tin đăng thành công');
  });
});
```

---

## 🎯 Test Coverage Goals

- **Unit Tests:** 80% code coverage for models
- **Integration Tests:** 70% coverage for controllers
- **E2E Tests:** Cover 100% of critical user workflows (5-10 workflows)
- **Visual Regression:** 0 unintended visual changes

---

## 📊 Test Execution Plan

### Phase 5.1: Setup Test Environment
- [ ] Install test frameworks (Jest, Supertest, Playwright)
- [ ] Create test database
- [ ] Seed test data
- [ ] Configure CI/CD for automated testing

### Phase 5.2: Write Unit Tests
- [ ] TinDangModel tests (6 methods)
- [ ] DuAnModel tests (5 methods)
- [ ] CuocHenModel tests (5 methods)
- [ ] BaoCaoHieuSuatModel tests (5 methods)

### Phase 5.3: Write Integration Tests
- [ ] TinDangController tests (10 endpoints)
- [ ] DuAnController tests (9 endpoints)
- [ ] CuocHenController tests (5 endpoints)
- [ ] BaoCaoHieuSuatController tests (5 endpoints)

### Phase 5.4: Visual Regression Tests
- [ ] Setup BackstopJS or Percy
- [ ] Capture baseline screenshots
- [ ] Test migrated components
- [ ] Approve differences

### Phase 5.5: E2E Tests
- [ ] Write E2E tests for critical workflows
- [ ] Run tests in all browsers
- [ ] Fix failing tests

### Phase 5.6: Performance Tests
- [ ] Benchmark API response times
- [ ] Check DB query performance
- [ ] Verify no performance regression

---

## ✅ Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] 0 visual regressions (or all approved)
- [ ] Test coverage > 75%
- [ ] CI/CD pipeline configured and passing

---

**Status:** ⏳ PENDING  
**Dependencies:** PHASE 4 (CSS Migration)  
**Estimated Time:** 2-3 days (with setup)


















