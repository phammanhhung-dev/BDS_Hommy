# Server Tests Directory

## 📋 Mục đích
Thư mục này chứa các test scripts và utility scripts để kiểm tra database, API endpoints và các chức năng backend.

## 📁 Files

### Database Tests
- **`check-db-structure.js`** - Kiểm tra cấu trúc database schema
- **`check-migration.js`** - Verify migration files đã chạy đúng chưa

### API Tests
- **`test-api-endpoints.js`** - Test các API endpoints chính
- **`test-phong-duan-endpoint.js`** - Test API của module Phòng & Dự án

## 🚀 Cách sử dụng

```bash
# Chạy database structure check
node server/tests/check-db-structure.js

# Chạy migration check
node server/tests/check-migration.js

# Test API endpoints (cần server đang chạy)
node server/tests/test-api-endpoints.js

# Test Phong-DuAn endpoint
node server/tests/test-phong-duan-endpoint.js
```

## ⚠️ Lưu ý

1. Đảm bảo server đang chạy trước khi test API endpoints
2. Cấu hình database connection trong `.env` phải đúng
3. Các test này không phải unit tests tự động, cần review output manually

## 🔄 Maintenance

- Cập nhật tests khi có API endpoints mới
- Thêm test cases cho các features mới
- Review và refactor tests định kỳ
