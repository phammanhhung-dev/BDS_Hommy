# NVBH Module Testing Guide

This guide explains how to run automated tests for the Nhan Vien Ban Hang (NVBH) module.

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Database configured in `server/.env`

## Installation

### Backend Tests

```bash
cd server
npm install
```

This will install:
- `jest` - Test framework
- `supertest` - HTTP assertion library

### Frontend Tests

```bash
cd client
npm install
```

This will install:
- `vitest` - Test framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests

## Running Tests

### Backend API Tests

```bash
cd server
npm test
```

Run specific test file:
```bash
npm test -- nhanVienBanHang.test.js
```

Run with coverage:
```bash
npm test -- --coverage
```

Watch mode:
```bash
npm test -- --watch
```

### Frontend Component Tests

```bash
cd client
npm test
```

Run with UI:
```bash
npm test -- --ui
```

Run with coverage:
```bash
npm test -- --coverage
```

## Test Structure

### Backend Tests

**Location:** `server/tests/nhanVienBanHang.test.js`

**Test Suites:**
- UC-SALE-01: Lich Lam Viec (7 tests)
- UC-SALE-02/03: Cuoc Hen (5 tests)
- UC-SALE-04: Xac Nhan Coc (3 tests)
- UC-SALE-05: Bao Cao Ket Qua (3 tests)
- UC-SALE-06: Bao Cao Thu Nhap (3 tests)
- Dashboard (3 tests)

**Total:** 24 tests

**Test Helpers:** `server/tests/helpers/nvbhTestHelpers.js`

### Frontend Tests

**Location:** `client/src/**/__tests__/`

**Test Files:**
- `StatusBadge.test.jsx` (10 tests)
- `MetricCard.test.jsx` (10 tests)
- `Dashboard.test.jsx` (5 tests)
- `LichLamViec.test.jsx` (5 tests)
- `QuanLyCuocHen.test.jsx` (6 tests)

**Total:** 36 tests

## Database Setup for Tests

Before running backend tests, ensure:

1. Test database is configured
2. Test user with NhanVienBanHang role exists
3. Test data can be created/cleaned up

The test helpers will:
- Create test users (NVBH, Customer, ChuDuAn)
- Create test data (DuAn, TinDang, Phong, CuocHen, GiaoDich)
- Clean up after tests complete

## SQL Integrity Checks

Run SQL checks to verify database constraints:

```bash
mysql -u [user] -p [database] < server/tests/sql-checks-nvbh.sql
```

Or execute queries manually from `server/tests/sql-checks-nvbh.sql`

## Troubleshooting

### Backend Tests Fail

1. Check database connection in `server/.env`
2. Verify test user has correct role ID (default: 4)
3. Ensure test database has required tables
4. Check that test data cleanup completed successfully

### Frontend Tests Fail

1. Ensure all dependencies installed: `npm install`
2. Check `vitest.config.js` is configured correctly
3. Verify `src/test/setup.js` exists
4. Check for missing mocks in test files

### Mock Issues

If tests fail due to missing mocks:
- Check API service imports are mocked correctly
- Verify React Router is mocked for navigation tests
- Ensure userEvent is imported correctly

## Test Coverage Goals

- **Backend:** >80% coverage
- **Frontend:** >70% coverage

View coverage reports:
- Backend: `server/coverage/`
- Frontend: `client/coverage/`

## Continuous Integration

To run tests in CI/CD:

```bash
# Backend
cd server && npm install && npm test

# Frontend
cd client && npm install && npm test
```

## Manual Testing

After automated tests pass, refer to `NVBH_TESTING_REPORT.md` for manual testing scenarios.

## Additional Resources

- `NVBH_TESTING_REPORT.md` - Comprehensive testing report
- `NVBH_TESTING_ISSUES.md` - Issues tracker
- `server/tests/sql-checks-nvbh.sql` - SQL integrity checks
