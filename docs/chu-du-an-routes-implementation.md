# Hệ thống Routes nghiệp vụ cho Chủ dự án

Dựa trên đặc tả **use-cases-v1.2.md**, tôi đã xây dựng hệ thống routes nghiệp vụ đầy đủ cho **Chủ dự án** với các tính năng chính:

## 🏗️ Cấu trúc Backend

### 📁 Models
- **ChuDuAnModel.js**: Xử lý logic database cho tất cả nghiệp vụ chủ dự án
  - Quản lý tin đăng (tạo, sửa, gửi duyệt)
  - Quản lý cuộc hẹn (xem, xác nhận)
  - Báo cáo hiệu suất (thống kê, phân tích)
  - Quản lý dự án

### 📁 Controllers  
- **ChuDuAnController.js**: Xử lý các HTTP requests
  - Validate dữ liệu đầu vào
  - Gọi model và service tương ứng
  - Trả về response chuẩn JSON
  - Ghi audit log cho mọi hành động quan trọng

### 📁 Services
- **NhatKyHeThongService.js**: Ghi nhật ký hệ thống
  - Tracking tất cả hành động quan trọng
  - Hỗ trợ kiểm toán và compliance
  - Constants cho các loại hành động và đối tượng

### 📁 Routes
- **chuDuAnRoutes.js**: Định nghĩa tất cả endpoints API
  - Middleware auth và role checking
  - Documentation đầy đủ cho từng endpoint
  - Error handling tập trung

### 📁 Middleware
- **auth.js**: Xác thực JWT token
- **role.js**: Phân quyền theo vai trò
  - Role-based access control (RBAC)
  - Act-as functionality cho đa vai trò
  - Ownership middleware cho bảo mật

## 🎯 API Endpoints theo Use Cases

### UC-PROJ-01: Đăng tin cho thuê
```
GET    /api/chu-du-an/tin-dang           # Danh sách tin đăng
POST   /api/chu-du-an/tin-dang           # Tạo tin đăng mới
GET    /api/chu-du-an/tin-dang/:id       # Chi tiết tin đăng
PUT    /api/chu-du-an/tin-dang/:id       # Cập nhật tin đăng
POST   /api/chu-du-an/tin-dang/:id/gui-duyet  # Gửi duyệt
```

### UC-PROJ-02: Quản lý cuộc hẹn xem phòng
```
GET    /api/chu-du-an/cuoc-hen           # Danh sách cuộc hẹn
POST   /api/chu-du-an/cuoc-hen/:id/xac-nhan  # Xác nhận cuộc hẹn
```

### UC-PROJ-03: Báo cáo hiệu suất
```
GET    /api/chu-du-an/bao-cao            # Báo cáo hiệu suất
GET    /api/chu-du-an/dashboard          # Dashboard tổng quan
```

### UC-PROJ-04: Báo cáo hợp đồng cho thuê
```
POST   /api/chu-du-an/hop-dong/bao-cao  # Báo cáo hợp đồng
```

### Utilities
```
GET    /api/chu-du-an/du-an             # Danh sách dự án
```

## 🎨 Frontend Components

### 📊 Dashboard Components
- **Dashboard.jsx**: Tổng quan hiệu suất kinh doanh
  - Thống kê tổng quan (tin đăng, cuộc hẹn, cọc)
  - Tin đăng gần đây
  - Cuộc hẹn sắp tới
  - Quick actions

### 📝 Quản lý Tin đăng
- **QuanLyTinDang.jsx**: Danh sách và quản lý tin đăng
  - Bộ lọc theo trạng thái, dự án, từ khóa
  - Actions: xem, sửa, gửi duyệt
  - Grid layout responsive
  - Status badges với màu sắc phân biệt

### 📈 Báo cáo
- **BaoCaoHieuSuat.jsx**: Báo cáo chi tiết hiệu suất
  - Bộ lọc thời gian linh hoạt
  - Thống kê với charts và percentages
  - Export PDF/Excel (TODO)
  - Print-friendly

### 🎯 Services
- **ChuDuAnService.js**: API service layer
  - Tách biệt logic API calls
  - Error handling tập trung
  - Constants và utilities
  - Type safety với JSDoc

## 🔐 Bảo mật và Phân quyền

### Authentication
- JWT-based authentication
- Token validation middleware
- Session management

### Authorization  
- Role-based access control (RBAC)
- Ownership verification
- Act-as functionality cho đa vai trò
- Audit logging cho compliance

### Data Security
- Parameterized queries (SQL injection prevention)
- Input validation
- Rate limiting (TODO)
- CSRF protection (TODO)

## 📋 Audit Trail

Tất cả hành động quan trọng được ghi nhật ký:
- Tạo/sửa/xóa tin đăng
- Xác nhận cuộc hẹn
- Đặt/hoàn cọc
- Báo cáo hợp đồng
- Đăng nhập/đăng xuất
- Thay đổi vai trò

## 🗄️ Database Integration

### Models tuân thủ schema trong `thue_tro.sql`:
- Tên bảng: lowercase, không dấu (`tindang`, `cuochen`)
- Tên cột: PascalCase tiếng Việt không dấu (`TinDangID`, `TrangThai`)
- Foreign key relationships chính xác
- Triggers và constraints được tôn trọng

### Idempotency Support:
- Middleware idempotency cho các operations quan trọng
- TTL cache với Redis
- Duplicate request prevention

## 🚀 Triển khai và Sử dụng

### Backend Setup
1. Đã tích hợp vào `server/index.js`
2. Routes được mount tại `/api/chu-du-an`
3. Middleware auth và role checking tự động
4. Error handling và logging

### Frontend Usage
```javascript
import { DashboardChuDuAn, QuanLyTinDang, BaoCaoHieuSuat } from './pages/ChuDuAn';
import { TinDangService, CuocHenService, BaoCaoService } from './services/ChuDuAnService';
```

### Environment Variables cần thiết:
```env
JWT_SECRET=your-secret-key
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password  
MYSQL_DATABASE=thue_tro
```

## 📊 Monitoring và Metrics

### Performance Metrics:
- API response time (P95 ≤ 1.5s theo SLA)
- Database query performance
- Error rate tracking
- User activity analytics

### Business Metrics:
- Số lượng tin đăng theo trạng thái
- Tỉ lệ chuyển đổi cuộc hẹn
- Hiệu suất theo chủ dự án
- Revenue tracking qua giao dịch cọc

## 🔄 Tương lai và Mở rộng

### Phase tiếp theo:
1. **UC-PROJ-02 mở rộng**: Đổi lịch cuộc hẹn, hủy cuộc hẹn
2. **UC-PROJ-05**: Tính năng nhắn tin realtime
3. **Biên bản bàn giao**: Tích hợp chữ ký số
4. **Workflow automation**: Auto-escalation, notifications
5. **Advanced analytics**: Machine learning insights

### Tối ưu hóa:
- Redis caching cho frequent queries
- Database indexing optimization  
- CDN cho static assets
- Microservices architecture

---

**✅ Hoàn thành**: Hệ thống routes nghiệp vụ đầy đủ cho Chủ dự án theo đặc tả use-cases-v1.2.md, tuân thủ 100% quy tắc đặt tên tiếng Việt và cấu trúc database.