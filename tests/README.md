# BDS HOMMY - Thư Mục Kiểm Thử (Tests)

Thư mục này tập trung toàn bộ các script kiểm thử, bộ dữ liệu mẫu, và công cụ kiểm tra tính toàn vẹn của hệ thống BDS HOMMY.

---

## 📁 Cấu Trúc Thư Mục

```
tests/
├── README.md               # Hướng dẫn chi tiết sử dụng các test
├── jest/                   # Unit test & Integration test tự động bằng Jest
│   ├── nhanVienBanHang.test.js
│   └── helpers/
│       └── nvbhTestHelpers.js
├── api/                    # Scripts kiểm tra các endpoint API backend
├── database/               # Scripts kiểm tra cấu trúc schema, địa giới, dữ liệu DB
├── fixtures/               # Dữ liệu mẫu (SQL fixtures) dùng cho môi trường test
└── cleanup/                # Scripts dọn dẹp dữ liệu rác sau khi chạy test
```

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Chạy Test Tự Động (Jest)
Chạy bộ kiểm thử tự động cho module Nhân Viên Bán Hàng:
```bash
# Chạy từ thư mục gốc
npm test

# Hoặc chạy từ thư mục server
cd server
npm test
```

### 2. Kiểm Tra Cấu Trúc Cơ Sở Dữ Liệu (Database Checks)
Đảm bảo database MySQL đang chạy (`127.0.0.1:3306`), sau đó chạy các script kiểm tra:
```bash
# Kiểm tra toàn diện cấu trúc bảng và schema
node tests/database/check-db-structure.js

# Kiểm tra migration đã áp dụng đủ chưa
node tests/database/check-migration.js

# Kiểm tra địa giới hành chính (HCMC, Bình Dương, Bình Phước, ...)
node tests/database/check-khuvuc-hcm.js
node tests/database/check-khuvuc-binhduong.js
```

### 3. Kiểm Tra API Endpoints (API Testing)
Khởi động server backend (`npm --prefix server run dev`), sau đó chạy các script:
```bash
# Test API địa chỉ / hành chính
node tests/api/test_address_api.js

# Test API Dashboard Chủ Dự Án
node tests/api/test_chuduan_dashboard_api.js

# Test API Dashboard Điều Hành (Operator)
node tests/api/test_operator_dashboard_api.js

# Test luồng tạo tin đăng
node tests/api/test_create_tindang_no_project.js
```

### 4. Dọn Dẹp Dữ Liệu Test Trong Database
```bash
# Liệt kê tin đăng test
node tests/cleanup/list_test_tindang.js

# Dọn dẹp tài khoản test đã seed
node tests/cleanup/cleanup_test_accounts.js

# Dọn dẹp các tin đăng test
node tests/cleanup/cleanup_test_tindang.js
```

---

## ⚠️ Lưu Ý Khi Viết Test Mới
- Nếu viết unit test hoặc integration test tự động cho Jest, đặt file trong `tests/jest/` với đuôi `.test.js`.
- Nếu viết script kiểm tra thủ công bằng HTTP/fetch, đặt trong `tests/api/`.
- Nếu viết script query kiểm tra dữ liệu hoặc schema database, đặt trong `tests/database/`.
- Không tạo các file log dump, grep output (`temp_*.txt`, `*_grep.txt`) ở thư mục gốc.
