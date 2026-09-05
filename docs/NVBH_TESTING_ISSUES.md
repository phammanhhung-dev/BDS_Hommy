# NVBH Testing Issues Tracker

## Critical (Blocker)
- [x] **Database Schema Issue**: `cuochen.PhongID` có foreign key constraint đến `phong_old` thay vì `phong`
  - **Impact**: 11 tests fail (UC-SALE-02/03, UC-SALE-05)
  - **Solution**: Đã chạy migration drop `cuochen_ibfk_3`, cập nhật schema chuẩn và xóa hẳn bảng `phong_old`

## High (Must fix before production)
- [x] **Test Helper Issues** - ✅ FIXED
  - ✅ Sửa `MatKhau` → `MatKhauHash` trong test helpers
  - ✅ Sửa `KhuVucChinhID` để lấy từ database (cấp tỉnh/thành phố)
  - ✅ Sửa `tindang` không có cột `Gia`
  - ✅ Sửa cleanup để xóa `nguoidung_vaitro` và `nhatkyhethong` trước khi xóa `nguoidung`
  - ✅ Tạo unique email/phone cho mỗi test run

## Medium (Should fix)
- [ ] No medium priority issues found yet

## Low (Nice to have)
- [ ] No low priority issues found yet

---

## Testing Notes

### Phase 1: Code Review
- ✅ All 19 API endpoints reviewed
- ✅ Error handling present in all endpoints
- ✅ Audit logging implemented for critical actions
- ✅ Input validation present
- ✅ Authentication middleware applied

### Phase 2: Automated Testing
- ✅ Backend test suite created
- ✅ Frontend component tests created
- ✅ Dependencies installed
- ✅ **Backend tests: 13/24 PASS** (54% pass rate)
  - ✅ UC-SALE-01: Lich Lam Viec (6/6 tests pass)
  - ✅ UC-SALE-04: Xac Nhan Coc (3/3 tests pass)
  - ✅ UC-SALE-06: Bao Cao Thu Nhap (3/3 tests pass)
  - ✅ Dashboard (3/3 tests pass)
  - ❌ UC-SALE-02/03: Cuoc Hen (0/5 tests pass) - **Blocked by schema issue**
  - ❌ UC-SALE-05: Bao Cao Ket Qua (0/3 tests pass) - **Blocked by schema issue**

### Phase 3: Manual Testing
- ⏳ Pending manual testing execution

### Phase 4: Data Integrity
- ⏳ SQL checks pending execution

---

## Known Issues

### Backend
- Không còn issues mở. Bảng `phong_old` đã được drop và tất cả foreign key đã trỏ về `phong`.

### Frontend
- None identified yet

---

## Test Coverage

### Backend API Tests (13/24 passing - 54%)
- UC-SALE-01: Lich Lam Viec - ✅ 6/6 tests pass
- UC-SALE-02: Chi Tiet Cuoc Hen - ❌ 0/2 tests pass (schema issue)
- UC-SALE-03: Quan Ly Cuoc Hen - ❌ 0/3 tests pass (schema issue)
- UC-SALE-04: Xac Nhan Coc - ✅ 3/3 tests pass
- UC-SALE-05: Bao Cao Ket Qua - ❌ 0/3 tests pass (schema issue)
- UC-SALE-06: Bao Cao Thu Nhap - ✅ 3/3 tests pass
- Dashboard - ✅ 3/3 tests pass

### Frontend Component Tests
- StatusBadge - ✅ Covered
- MetricCard - ✅ Covered
- Dashboard - ✅ Covered
- LichLamViec - ✅ Covered
- QuanLyCuocHen - ✅ Covered

---

## Next Steps

1. ✅ Install test dependencies: `npm install` in both server/ and client/
2. ✅ Run backend tests: `cd server && npm test`
3. ⏳ Re-run backend tests sau khi cập nhật migration
4. ⏳ Run frontend tests: `cd client && npm test`
5. ⏳ Execute manual testing scenarios
6. ⏳ Run SQL integrity checks
7. ⏳ Perform security audit
8. ⏳ Cross-browser testing
9. ⏳ Performance testing with Lighthouse

---

## Test Results Summary

### Backend Tests (Latest Run)
```
✅ PASS: 13 tests
❌ FAIL: 11 tests (all related to cuochen/PhongID foreign key issue)

Pass Rate: 54%
```

### Fixed Issues
- ✅ Test helpers now use `MatKhauHash` instead of `MatKhau`
- ✅ `KhuVucChinhID` now correctly fetched from database
- ✅ `tindang` insert no longer includes non-existent `Gia` column
- ✅ Cleanup properly handles foreign key constraints
- ✅ Unique email/phone generation prevents duplicate key errors

### Remaining Issues
- ❌ Chưa chạy lại test sau khi migrate schema mới
