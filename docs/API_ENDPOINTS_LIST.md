# Danh sách API Endpoints

H�?thống cung cấp RESTful API với 150+ endpoints được t�?chức theo domain:

## 1. Authentication

**Base Path:** `/api/auth/*`

**S�?endpoints:** 2

**Chức năng chính:**
- Login
- Register

**Chi tiết:**
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

---

## 2. Ch�?d�?án (ChuDuAn)

**Base Path:** `/api/chu-du-an/*`

**S�?endpoints:** 50+

**Chức năng chính:**
- CRUD D�?án
- CRUD Tin đăng
- Quản lý Cuộc hẹn
- Quản lý Phòng
- Quản lý Hợp đồng
- Quản lý Chính sách cọc
- Báo cáo & Analytics
- Upload ảnh

**Chi tiết:**

### Dashboard & Analytics
- `GET /api/chu-du-an/dashboard` - Dashboard tổng quan
- `GET /api/chu-du-an/bao-cao-hieu-suat` - Báo cáo hiệu suất
- `GET /api/chu-du-an/bao-cao-chi-tiet` - Báo cáo chi tiết
- `GET /api/chu-du-an/bao-cao/doanh-thu-theo-thang` - Doanh thu theo tháng
- `GET /api/chu-du-an/bao-cao/top-tin-dang` - Top tin đăng
- `GET /api/chu-du-an/bao-cao/conversion-rate` - T�?l�?chuyển đổi

### D�?án
- `GET /api/chu-du-an/du-an` - Danh sách d�?án
- `GET /api/chu-du-an/du-an/:id` - Chi tiết d�?án
- `POST /api/chu-du-an/du-an` - Tạo d�?án
- `POST /api/chu-du-an/du-an/tao-nhanh` - Tạo nhanh d�?án
- `PUT /api/chu-du-an/du-an/:id` - Cập nhật d�?án
- `DELETE /api/chu-du-an/du-an/:id` - Lưu tr�?d�?án
- `POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai` - Yêu cầu m�?lại d�?án

### Tin đăng
- `GET /api/chu-du-an/tin-dang` - Danh sách tin đăng
- `GET /api/chu-du-an/tin-nhap` - Danh sách tin nháp
- `POST /api/chu-du-an/tin-dang` - Tạo tin đăng
- `POST /api/chu-du-an/tin-dang/nhap` - Lưu nháp tin đăng
- `GET /api/chu-du-an/tin-dang/:id` - Chi tiết tin đăng
- `PUT /api/chu-du-an/tin-dang/:id` - Cập nhật tin đăng
- `DELETE /api/chu-du-an/tin-dang/:id` - Xóa tin đăng
- `GET /api/chu-du-an/tin-dang/:id/chinh-sua` - Lấy tin đăng đ�?chỉnh sửa
- `POST /api/chu-du-an/tin-dang/:id/gui-duyet` - Gửi tin đăng đ�?duyệt

### Cuộc hẹn
- `GET /api/chu-du-an/cuoc-hen` - Danh sách cuộc hẹn
- `GET /api/chu-du-an/cuoc-hen/metrics` - Metrics cuộc hẹn
- `PUT /api/chu-du-an/cuoc-hen/:id/xac-nhan` - Xác nhận cuộc hẹn
- `POST /api/chu-du-an/cuoc-hen/:id/phe-duyet` - Phê duyệt cuộc hẹn
- `POST /api/chu-du-an/cuoc-hen/:id/tu-choi` - T�?chối cuộc hẹn

### Phòng
- `GET /api/chu-du-an/du-an/:duAnID/phong` - Danh sách phòng của d�?án
- `POST /api/chu-du-an/du-an/:duAnID/phong` - Tạo phòng mới
- `GET /api/chu-du-an/phong/:phongID` - Chi tiết phòng
- `PUT /api/chu-du-an/phong/:phongID` - Cập nhật phòng
- `DELETE /api/chu-du-an/phong/:phongID` - Xóa phòng
- `PATCH /api/chu-du-an/phong/:phongID/trang-thai` - Cập nhật trạng thái phòng
- `GET /api/chu-du-an/tin-dang/:tinDangID/phong` - Danh sách phòng của tin đăng
- `POST /api/chu-du-an/tin-dang/:tinDangID/phong` - Thêm phòng vào tin đăng
- `DELETE /api/chu-du-an/tin-dang/:tinDangID/phong/:phongID` - Xóa phòng khỏi tin đăng

### Hợp đồng
- `GET /api/chu-du-an/hop-dong` - Danh sách hợp đồng
- `GET /api/chu-du-an/hop-dong/:id` - Chi tiết hợp đồng
- `POST /api/chu-du-an/hop-dong/bao-cao` - Báo cáo hợp đồng đã ký
- `POST /api/chu-du-an/hop-dong/:id/upload` - Upload file scan hợp đồng

### Chính sách cọc
- `GET /api/chu-du-an/chinh-sach-coc` - Danh sách chính sách cọc
- `GET /api/chu-du-an/chinh-sach-coc/:id` - Chi tiết chính sách cọc
- `POST /api/chu-du-an/chinh-sach-coc` - Tạo chính sách cọc
- `PUT /api/chu-du-an/chinh-sach-coc/:id` - Cập nhật chính sách cọc
- `DELETE /api/chu-du-an/chinh-sach-coc/:id` - Vô hiệu hóa chính sách cọc
- `GET /api/chu-du-an/chinh-sach-coc/:id` - Chi tiết chính sách cọc (duplicate)
- `PUT /api/chu-du-an/chinh-sach-coc/:id` - Cập nhật chính sách cọc (duplicate)

### Khu vực
- `GET /api/chu-du-an/khu-vuc` - Danh sách khu vực

### Upload
- `POST /api/chu-du-an/upload-anh` - Upload ảnh

---

## 3. Người thuê (Khách hàng)

**Base Path:** `/api/hop-dong/*`, `/api/public/*`, `/api/yeuthich/*`, `/api/cuoc-hen/*`

**S�?endpoints:** 25+

**Chức năng chính:**
- Tìm kiếm tin đăng
- Xem chi tiết tin đăng
- Đặt lịch hẹn
- Quản lý yêu thích
- Đặt cọc
- Hợp đồng
- Thanh toán

**Chi tiết:**

### Hợp đồng (Khách hàng)
- `POST /api/hop-dong/generate` - Tạo hợp đồng
- `POST /api/hop-dong/:tinDangId/confirm-deposit` - Xác nhận đặt cọc
- `GET /api/hop-dong/khach-hang` - Danh sách hợp đồng của khách hàng

### Tin đăng công khai
- `GET /api/public/tin-dang` - Danh sách tin đăng công khai
- `GET /api/public/tin-dang/:id` - Chi tiết tin đăng công khai
- `PUT /api/public/tin-dang/:id` - Cập nhật tin đăng (public)
- `DELETE /api/public/tin-dang/:id` - Xóa tin đăng (public)

### D�?án công khai
- `GET /api/public/du-an` - Danh sách d�?án công khai
- `PUT /api/public/du-an/:id` - Cập nhật d�?án (public)
- `DELETE /api/public/du-an/:id` - Xóa d�?án (public)

### Yêu thích
- `POST /api/yeuthich` - Thêm yêu thích
- `DELETE /api/yeuthich/:userId/:tinId` - Xóa yêu thích
- `GET /api/yeuthich/user/:userId` - Danh sách yêu thích theo user
- `GET /api/yeuthich/user/:userId/details` - Danh sách yêu thích kèm thông tin tin đăng
- `GET /api/yeuthich/check` - Kiểm tra yêu thích (?userId=..&tinId=..)

### Cuộc hẹn
- `POST /api/cuoc-hen` - Tạo cuộc hẹn (public)
- `GET /api/cuoc-hen` - Danh sách cuộc hẹn
- `GET /api/cuoc-hen/search/khach-hang/:khachHangId` - Tìm theo khách hàng
- `GET /api/cuoc-hen/search/nhan-vien/:nhanVienId` - Tìm theo nhân viên
- `GET /api/cuoc-hen/search/chu-du-an/:chuDuAnId` - Tìm theo ch�?d�?án
- `GET /api/cuoc-hen/:id` - Chi tiết cuộc hẹn
- `PUT /api/cuoc-hen/:id` - Cập nhật cuộc hẹn
- `DELETE /api/cuoc-hen/:id` - Xóa cuộc hẹn

### Mẫu hợp đồng
- `GET /api/mau-hop-dong/:id/preview` - Preview mẫu hợp đồng

---

## 4. Admin/Operator

**Base Path:** `/api/operator/*`, `/api/admin/*`, `/api/tindangs/*`, `/api/users/*`

**S�?endpoints:** 40+

**Chức năng chính:**
- Duyệt tin đăng
- Quản lý d�?án
- Quản lý cuộc hẹn
- Quản lý nhân viên
- Quản lý hợp đồng
- Biên bản bàn giao
- Dashboard & Báo cáo
- KYC

**Chi tiết:**

### Dashboard Operator
- `GET /api/operator/dashboard/stats` - Thống kê tổng quan
|- `GET /api/operator/dashboard/revenue-chart` - Biểu đồ doanh thu 6 tháng
|- `GET /api/operator/dashboard/occupancy` - Tỷ lệ lấp đầy theo dự án
|- `GET /api/operator/dashboard/status-distribution` - Phân phối trạng thái tin đăng
|- `GET /api/operator/dashboard/recent-listings` - Tin đăng mới nhất
|- `GET /api/operator/dashboard/upcoming-appointments` - Cuộc hẹn 7 ngày tới

### Duyệt tin đăng
- `GET /api/operator/tin-dang/cho-duyet` - Danh sách tin đăng ch�?duyệt
- `GET /api/operator/tin-dang/thong-ke` - Thống kê tin đăng
- `GET /api/operator/tin-dang/:id/chi-tiet` - Chi tiết tin đăng cần duyệt
- `PUT /api/operator/tin-dang/:id/duyet` - Duyệt tin đăng
- `PUT /api/operator/tin-dang/:id/tu-choi` - T�?chối tin đăng

### Quản lý d�?án
- `GET /api/operator/du-an` - Danh sách d�?án
- `GET /api/operator/du-an/thong-ke` - Thống kê d�?án
- `GET /api/operator/du-an/:id` - Chi tiết d�?án
- `POST /api/operator/du-an` - **(Ch�?QuanTriVienHeThong)** Tạo d�?án mới
- `PUT /api/operator/du-an/:id` - **(Ch�?QuanTriVienHeThong)** Cập nhật d�?án
- `PUT /api/operator/du-an/:id/tam-ngung` - Tạm ngưng d�?án
- `PUT /api/operator/du-an/:id/kich-hoat` - Kích hoạt lại d�?án
- `PUT /api/operator/du-an/:id/banned` - Banned d�?án
- `PUT /api/operator/du-an/:id/xu-ly-yeu-cau` - X�?lý yêu cầu m�?lại
- `POST /api/operator/du-an/:id/tu-choi-hoa-hong` - T�?chối hoa hồng

### Quản lý cuộc hẹn
- `GET /api/operator/cuoc-hen` - Danh sách cuộc hẹn
- `GET /api/operator/cuoc-hen/can-gan` - Cuộc hẹn cần gán NVBH
- `PUT /api/operator/cuoc-hen/:id/gan-lai` - Gán lại cuộc hẹn
- `GET /api/operator/cuoc-hen/thong-ke` - Thống kê cuộc hẹn
- `GET /api/operator/lich-lam-viec` - Lịch làm việc

### Lịch làm việc NVBH
- `GET /api/operator/lich-lam-viec/tong-hop` - Lịch làm việc tổng hợp
- `GET /api/operator/lich-lam-viec/heatmap` - Phân tích đ�?ph�?nhân s�?
- `GET /api/operator/lich-lam-viec/nvbh-kha-dung` - Danh sách NVBH kh�?dụng

### Quản lý nhân viên
- `GET /api/operator/nhan-vien` - Danh sách nhân viên
- `GET /api/operator/nhan-vien/khu-vuc/mac-dinh` - Khu vực mặc định
- `GET /api/operator/nhan-vien/thong-ke` - Thống kê nhân viên
- `GET /api/operator/nhan-vien/:id/khu-vuc` - Khu vực ph�?trách của nhân viên
- `GET /api/operator/nhan-vien/:id` - Chi tiết nhân viên
- `POST /api/operator/nhan-vien` - Tạo tài khoản nhân viên
- `PUT /api/operator/nhan-vien/:id/trang-thai` - Kích hoạt/vô hiệu hóa nhân viên
- `PUT /api/operator/nhan-vien/:id` - Cập nhật h�?sơ nhân viên

### Biên bản bàn giao
- `GET /api/operator/bien-ban` - Danh sách biên bản
- `GET /api/operator/bien-ban/can-ban-giao` - Danh sách phòng cần bàn giao
- `GET /api/operator/bien-ban/thong-ke` - Thống kê biên bản
- `GET /api/operator/bien-ban/:id` - Chi tiết biên bản
- `POST /api/operator/bien-ban` - Tạo biên bản mới
- `PUT /api/operator/bien-ban/:id` - Cập nhật biên bản
- `PUT /api/operator/bien-ban/:id/ky` - Ký biên bản

### Hợp đồng (Admin)
- `GET /api/admin/hop-dong` - Danh sách tất c�?hợp đồng

### Tin đăng (Admin)
- `GET /api/tindangs` - Danh sách tin đăng
- `POST /api/tindangs` - Tạo tin đăng
- `GET /api/tindangs/:id` - Chi tiết tin đăng
- `PUT /api/tindangs/:id` - Cập nhật tin đăng
- `DELETE /api/tindangs/:id` - Xóa tin đăng
- `POST /api/tindangs/:id/approve` - Duyệt tin đăng

### Quản lý người dùng
- `GET /api/users` - Danh sách người dùng
- `POST /api/users` - Tạo người dùng
- `GET /api/users/:id` - Chi tiết người dùng
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### KYC
- `POST /api/kyc/verify` - Xác thực CCCD (gi�?định)

---

## 5. Nhân viên Bán hàng

**Base Path:** `/api/nhan-vien-ban-hang/*`

**S�?endpoints:** 19

**Chức năng chính:**
- Lịch làm việc
- Quản lý cuộc hẹn
- Xác nhận cọc
- Báo cáo thu nhập
- Dashboard

**Chi tiết:**

### Lịch làm việc
- `GET /api/nhan-vien-ban-hang/lich-lam-viec` - Lấy lịch làm việc
- `POST /api/nhan-vien-ban-hang/lich-lam-viec` - Tạo lịch làm việc
- `PUT /api/nhan-vien-ban-hang/lich-lam-viec/:id` - Cập nhật lịch làm việc
- `DELETE /api/nhan-vien-ban-hang/lich-lam-viec/:id` - Xóa lịch làm việc

### Cuộc hẹn
- `GET /api/nhan-vien-ban-hang/cuoc-hen` - Danh sách cuộc hẹn
- `GET /api/nhan-vien-ban-hang/cuoc-hen/:id` - Chi tiết cuộc hẹn
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/xac-nhan` - Xác nhận cuộc hẹn
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/doi-lich` - Đổi lịch cuộc hẹn
- `PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/huy` - Hủy cuộc hẹn
- `POST /api/nhan-vien-ban-hang/cuoc-hen/:id/bao-cao-ket-qua` - Báo cáo kết qu�?cuộc hẹn

### Giao dịch/Cọc
- `GET /api/nhan-vien-ban-hang/giao-dich` - Danh sách giao dịch
- `GET /api/nhan-vien-ban-hang/giao-dich/:id` - Chi tiết giao dịch
- `POST /api/nhan-vien-ban-hang/giao-dich/:id/xac-nhan-coc` - Xác nhận cọc

### Báo cáo
- `GET /api/nhan-vien-ban-hang/bao-cao/thu-nhap` - Báo cáo thu nhập
- `GET /api/nhan-vien-ban-hang/bao-cao/thong-ke` - Thống kê hiệu suất
- `GET /api/nhan-vien-ban-hang/bao-cao/cuoc-hen-theo-tuan` - Cuộc hẹn theo tuần

### Dashboard & H�?sơ
- `GET /api/nhan-vien-ban-hang/dashboard` - Dashboard
- `GET /api/nhan-vien-ban-hang/ho-so` - Lấy h�?sơ
- `PUT /api/nhan-vien-ban-hang/ho-so` - Cập nhật h�?sơ

---

## 6. Chat & Notification

**Base Path:** `/api/chat/*`

**S�?endpoints:** 7

**Chức năng chính:**
- Tin nhắn
- Thông báo real-time
- Cuộc hội thoại

**Chi tiết:**
- `POST /api/chat/conversations` - Tạo hoặc lấy cuộc hội thoại
- `GET /api/chat/conversations` - Danh sách cuộc hội thoại (với unread count)
- `GET /api/chat/conversations/:id` - Chi tiết cuộc hội thoại
- `GET /api/chat/conversations/:id/messages` - Lịch s�?tin nhắn
- `POST /api/chat/conversations/:id/messages` - Gửi tin nhắn (REST fallback)
- `PUT /api/chat/conversations/:id/mark-read` - Đánh dấu đã đọc
- `DELETE /api/chat/messages/:id` - Xóa tin nhắn (soft delete)

---

## 7. Ví & Thanh toán

**Base Path:** `/api/vi/*`, `/api/lich-su-vi/*`

**S�?endpoints:** 6

**Chức năng chính:**
- Quản lý ví
- Lịch s�?giao dịch
- Nạp tiền
- Rút tiền

**Chi tiết:**

### Ví
- `GET /api/vi` - Danh sách ví
- `GET /api/vi/:id` - Ví theo NguoiDungID

### Lịch s�?ví
- `POST /api/lich-su-vi` - Thêm mới giao dịch
- `PUT /api/lich-su-vi/:id` - Sửa giao dịch
- `GET /api/lich-su-vi` - Danh sách giao dịch
- `GET /api/lich-su-vi/user/:user_id` - Giao dịch theo user

---

## 8. Thanh toán & Giao dịch

**Base Path:** `/api/sepay/*`, `/api/transactions/*`

**S�?endpoints:** 8

**Chức năng chính:**
- Đồng b�?Sepay
- Callback thanh toán
- Quản lý giao dịch

**Chi tiết:**

### Sepay
- `GET /api/sepay/transactions` - Lấy giao dịch Sepay
- `POST /api/sepay/sync-now` - Đồng b�?ngay
- `POST /api/sepay/callback` - Callback thanh toán
- `GET /api/sepay/callbacks` - Danh sách callbacks (dev)

### Transactions
- `GET /api/transactions` - Danh sách giao dịch
- `GET /api/transactions/:id` - Chi tiết giao dịch
- `POST /api/transactions` - Tạo giao dịch
- `PUT /api/transactions/:id` - Cập nhật giao dịch
- `DELETE /api/transactions/:id` - Xóa giao dịch

---

## 9. Tiện ích & H�?tr�?

**Base Path:** `/api/geocode/*`, `/api/khuvucs/*`, `/api/docx/*`, `/api/nguoi-phu-trach-du-an/*`

**S�?endpoints:** 15+

**Chức năng chính:**
- Geocoding
- Quản lý khu vực
- Tạo tài liệu Word
- Người ph�?trách d�?án

**Chi tiết:**

### Geocoding
- `POST /api/geocode` - Forward Geocoding (địa ch�?�?tọa đ�?

### Khu vực
- `GET /api/khuvucs` - Danh sách khu vực (flat)
- `GET /api/khuvucs/tree` - Cây khu vực (hierarchical)
- `GET /api/khuvucs/:id` - Chi tiết khu vực
- `POST /api/khuvucs` - Tạo khu vực
- `PUT /api/khuvucs/:id` - Cập nhật khu vực
- `DELETE /api/khuvucs/:id` - Xóa khu vực

### Tạo tài liệu Word
- `POST /api/docx/bao-cao-hieu-suat/:chuDuAnId` - Tạo báo cáo hiệu suất
- `POST /api/docx/hop-dong/:hopDongId` - Tạo hợp đồng
- `POST /api/docx/bao-cao-thu-chi` - Tạo báo cáo thu chi
- `POST /api/docx/custom` - Tạo document tùy chỉnh

### Người ph�?trách d�?án
- `GET /api/nguoi-phu-trach-du-an/:id` - Danh sách người ph�?trách d�?án

---

## Tổng kết

| Domain | Base Path | S�?endpoints | Chức năng chính |
|--------|-----------|--------------|-----------------|
| Authentication | `/api/auth/*` | 2 | Login, Register |
| Ch�?d�?án | `/api/chu-du-an/*` | 50+ | CRUD D�?án, Tin đăng, Cuộc hẹn, Cọc, Hợp đồng |
| Người thuê | `/api/hop-dong/*`, `/api/public/*`, `/api/yeuthich/*`, `/api/cuoc-hen/*` | 25+ | Tìm kiếm, Đặt lịch, Cọc, Hợp đồng, Thanh toán |
| Admin/Operator | `/api/operator/*`, `/api/admin/*`, `/api/tindangs/*`, `/api/users/*` | 40+ | Duyệt tin, KYC, Báo cáo, Quản lý người dùng |
| Nhân viên Bán hàng | `/api/nhan-vien-ban-hang/*` | 19 | Lịch làm việc, Cuộc hẹn, Xác nhận cọc, Báo cáo |
| Chat & Notification | `/api/chat/*` | 7 | Tin nhắn, Thông báo real-time |
| Ví & Thanh toán | `/api/vi/*`, `/api/lich-su-vi/*` | 6 | Quản lý ví, Lịch s�?giao dịch |
| Thanh toán & Giao dịch | `/api/sepay/*`, `/api/transactions/*` | 8 | Đồng b�?Sepay, Callback, Giao dịch |
| Tiện ích & H�?tr�?| `/api/geocode/*`, `/api/khuvucs/*`, `/api/docx/*`, `/api/nguoi-phu-trach-du-an/*` | 15+ | Geocoding, Khu vực, Tài liệu Word |

**Tổng s�?endpoints:** ~172 endpoints


