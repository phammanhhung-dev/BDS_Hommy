# CHƯƠNG 4: TRIỂN KHAI HỆ THỐNG

Tài liệu này cập nhật toàn bộ trạng thái triển khai đến thời điểm hiện tại của hệ thống Dạ Phòng Trọ theo đúng cấu trúc và độ chi tiết của bản DOCX gốc, đồng thời bổ sung các tính năng mới như eKYC, video call dịch song ngữ, gợi ý phòng trong cuộc hẹn và trung tâm thông báo theo thời gian thực.

---

## 4.1. Môi trường triển khai

### 4.1.1. Technology Stack

| Nhánh chức năng | Công nghệ | Phiên bản | Vai trò | Ghi chú |
|-----------------|-----------|-----------|---------|---------|
| Backend API | Node.js 18, Express 4.18.2 | `server/package.json` | REST API, Socket.IO server | Chạy trên `PORT=5000`, auto load `.env` |
| Database | MySQL 8.0 (`mysql2/promise`) | Pool size: 10 | Lưu trữ domain data, nhật ký | File kết nối: `server/config/db.js` |
| Realtime | Socket.IO 4.8.1 | WS + polling fallback | Chat, notifications, video call | Middleware JWT `socketAuth.js` |
| Frontend | React 19.1.1, Vite 5.4 | SPA | Dashboard Chủ dự án, NVBH, KYC | Hỗ trợ HMR, code-splitting |
| CV/AI (client) | face-api.js, tesseract.js, custom OCR ROI | Browser | eKYC (OCR + face matching + QR parsing) | Module `XacThucKYC` |
| Geospatial | Leaflet 1.9.4 + react-leaflet 5.0 | Canvas | Bản đồ cuộc hẹn, dự án | `ChiTietCuocHen.jsx` |
| Tools & DX | Nodemon, Vitest/Jest, ESLint 9 | Dev | Tăng tốc phát triển & test | Scripts `npm run dev`, `npm run test` |

### 4.1.2. Cấu trúc monorepo

```
daphongtro1/
├── client/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/      # 69 components (BEM)
│   │   ├── pages/           # 60 trang chức năng
│   │   ├── services/        # API clients, CV utilities
│   │   └── hooks/context/   # ChatContext, useSocket
├── server/                  # Express + Socket.IO backend
│   ├── controllers/         # 31 files, chia domain
│   ├── models/              # 25 files, MySQL data access
│   ├── services/            # Business services (KYC, notifications,…)
│   ├── routes/              # Group theo domain
│   └── socket/jobs/utils/   # Handlers, cron, helper
├── docs/                    # Tài liệu KYC, VideoCall AI, use cases
├── scripts/                 # Sinh docx, survey thống kê, download models
└── migrations/              # MySQL migration (DDL + patch)
```

Số lượng file được đo bằng `Get-ChildItem` vào ngày biên soạn chương này.

### 4.1.3. Thiết lập môi trường phát triển

```bash
# Backend
cd server
npm install
npm run dev          # nodemon index.js, chạy http/ws trên 5000

# Frontend
cd client
npm install
npm run dev          # Vite trên 5173, proxy /api về 5000
```

Backend tự động nạp biến môi trường nhờ `require('dotenv').config()` ngay dòng đầu `server/index.js`. Các giá trị mặc định (DB host, JWT secret mock, SePay token dev) nằm trong `.env.example`.

---

## 4.2. Triển khai Backend

### 4.2.1. Kiến trúc chung

- **API Layer:** Express định tuyến theo domain (ChuDuAn, TinDang, CuocHen, NhanVienBanHang, Public, v.v.).
- **Service Layer:** gom logic nghiệp vụ (KycService, ThongBaoService, QRSessionStore, NhatKyHeThongService).
- **Data Access Layer:** models sử dụng `mysql2/promise` với prepared statements.
- **Realtime Layer:** Socket.IO server khởi tạo cùng Express, chia thành các handler độc lập:
  - `socket/chatHandlers.js`: chat, video call, audit log tin nhắn.
  - `socket/goiYHandlers.js`: realtime QR session.
  - `socket/notificationHandlers.js`: notification rooms.

```200:239:server/index.js
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: dynamicCorsOptions, pingTimeout: 60000 });
io.use(socketAuth);
io.on('connection', (socket) => {
  setupChatHandlers(socket, io);
  setupGoiYHandlers(socket, io);
  setupNotificationHandlers(socket, io);
});
app.set('io', io);
setIoInstance(io);
startAppointmentReminders();
startAppointmentReportReminders();
server.listen(PORT || 5000, () => console.log('✅ Server chạy...'));
```

### 4.2.2. Authentication & Authorization

Hệ thống **không** dùng cặp `authenticate/authorize` như phiên bản DOCX cũ, mà triển khai một middleware duy nhất `authMiddleware` trong `server/middleware/auth.js`. Middleware này:

- Đọc JWT từ header `Authorization: Bearer <token>`.
- Cho phép một **mock token dev** (`MOCK_DEV_TOKEN`) để thuận tiện chạy demo/kịch bản test mà không cần JWT thật.
- Tra cứu người dùng trong DB (`nguoidung`) và vai trò hiện tại trong bảng `vaitro`.
- Chuẩn hoá tên vai trò (bỏ dấu, bỏ khoảng trắng, đổi `đ` → `d`) và gắn vào `req.user` dưới dạng:

```json
{
  "id": 123,
  "tenDayDu": "Nguyễn Văn A",
  "email": "a@example.com",
  "vaiTroId": 3,
  "vaiTro": "ChuDuAn",
  "vaiTroGoc": "Chủ dự án"
}
```

Trích code thực tế:

```9:83:server/middleware/auth.js
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const mockToken = process.env.MOCK_DEV_TOKEN || 'mock-token-for-development';
    if (token === mockToken) {
      req.user = {
        id: parseInt(process.env.MOCK_USER_ID || '1', 10),
        tenDayDu: process.env.MOCK_USER_NAME || 'Chu Du An Dev',
        email: process.env.MOCK_USER_EMAIL || 'chu.du.an.dev@daphongtro.local',
        vaiTroId: parseInt(process.env.MOCK_ROLE_ID || '3', 10),
        vaiTro: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
        isMockUser: true
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [userRows] = await db.execute(
      'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
      [decoded.userId]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc đã bị khóa'
      });
    }

    const user = userRows[0];
    const [roleRows] = await db.execute(
      'SELECT vt.TenVaiTro FROM vaitro vt WHERE vt.VaiTroID = ?',
      [user.VaiTroHoatDongID]
    );

    const rawRoleName = roleRows[0]?.TenVaiTro || 'Unknown';
    const normalizedRoleName = rawRoleName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D');

    req.user = {
      id: user.NguoiDungID,
      tenDayDu: user.TenDayDu,
      email: user.Email,
      vaiTroId: user.VaiTroHoatDongID,
      vaiTro: normalizedRoleName,
      vaiTroGoc: rawRoleName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi xác thực' });
  }
};
```

Các route backend chỉ cần:

```javascript
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, UserController.getProfile);
```

Khi cần phân quyền, controller kiểm tra trực tiếp `req.user.vaiTro` / `req.user.vaiTroId` (không dùng một hàm `authorize()` tách riêng như tài liệu cũ).

**Bảo mật bổ sung:**
- **Socket auth:** `socketAuth.js` reuse JWT logic, kèm fallback mock.
- **Rate limiting nội bộ:** chatHandlers giới hạn 50 tin nhắn/phút mỗi user (`userMessageCount` Map).
- **Logging chuẩn:** log prefix `[Context]` để dễ trace (`[KYC]`, `[Socket.IO]`, `[GoiYTinDangController]`…).

### 4.2.3. Controllers & routes theo domain

Thay vì gom tất cả vào `ChuDuAnController.js` như bản DOCX cũ, hệ thống hiện tại đã **tách controller theo domain** trong `server/controllers/`:

| Nhóm | Controller tiêu biểu | Nhiệm vụ chính | Ghi chú |
|------|----------------------|----------------|---------|
| Chủ dự án | `ChuDuAnController.js`, `tinDangController.js` | Dashboard, CRUD tin đăng, upload/ánh xạ phòng (`PhongIDs`), gửi duyệt, lưu trữ mềm | `TinDangController` sau refactor yêu cầu `PhongIDs` |
| Nhân viên bán hàng (NVBH) | `cuocHenController.js`, `GoiYTinDangController.js`, `NhanVienBanHangController.js` | Lịch hẹn, báo cáo, gợi ý phòng, QR "Xem Ngay", nhận phản hồi | Gắn trực tiếp với Notification Center |
| Thanh toán / giao dịch | `sepayController.js`, `sepayCallbackController.js`, `transactionController.js` | Đọc lịch sử từ SePay, xử lý webhook, lưu `TransactionModel`, API nội bộ xem giao dịch | Đang mở rộng thêm verify chữ ký |
| Hệ thống phụ trợ | `KycController.js`, `ThongBaoController.js`, `DocxController.js` | eKYC, thông báo, xuất DOCX | Liên quan tới các tính năng mới |

Routes được nhóm trong `server/routes/` (ví dụ `goiYTinDangRoutes.js`, `nhanVienBanHangRoutes.js`, `chinhSachCocRoutes.js`), mỗi file chỉ gắn đúng controller cho domain tương ứng. Đây là bước đầu của chiến lược "tách file >500 dòng" đã mô tả trong workspace rules.

**Controllers theo domain:**

Hệ thống có **31 controllers** xử lý các domain khác nhau, được tách theo tính năng thay vì gom vào một file lớn:

| Controller | Size | Chức năng | Ghi chú |
|:--- |:--- |:--- |:--- |
| **ChuDuAnController.js** | 1451 dòng | Dashboard, thống kê, quản lý dự án/tin đăng | Controller lớn nhất, tập trung nhiều nghiệp vụ Chủ dự án |
| **NhanVienBanHangController.js** | 825 dòng | Thống kê NVBH, danh sách khách hàng, báo cáo | Dashboard và quản lý NVBH |
| **GoiYTinDangController.js** | 694 dòng | Tìm kiếm gợi ý tin đăng, tạo QR "Xem Ngay", nhận phản hồi | Gắn với QRSessionStore, Notification Center |
| **tinDangController.js** | 534 dòng | CRUD Tin đăng, upload/ánh xạ phòng (`PhongIDs`), gửi duyệt | Yêu cầu `PhongIDs` sau refactor |
| **OperatorController.js** | 437 dòng | Quản lý Điều hành, duyệt/từ chối dự án/tin đăng | Dashboard Operator |
| **cuocHenController.js** | 427 dòng | Lịch hẹn NVBH, xác nhận, đổi lịch, báo cáo kết quả | Timeline, action bar, map Leaflet |
| **HoSoNhanVienController.js** | 378 dòng | Quản lý hồ sơ nhân viên, khu vực phụ trách | CRUD NVBH profile |
| **ChinhSachCocController.js** | 356 dòng | CRUD Chính sách cọc, áp dụng cho tin đăng | Quản lý chính sách cọc |
| **BienBanBanGiaoController.js** | 296 dòng | Biên bản bàn giao, quản lý hợp đồng | Tạo và quản lý biên bản |
| **PhongController.js** | 270 dòng | CRUD Phòng, ánh xạ với tin đăng | Quản lý phòng trọ |
| **DuAnController.js** | 262 dòng | CRUD Dự án, khu vực, chính sách | Quản lý dự án |
| **DuAnOperatorController.js** | 250 dòng | Duyệt/từ chối dự án (Operator) | Operator workflow |
| **ChatController.js** | 236 dòng | Chat messages, cuộc hội thoại, đánh dấu đã đọc | REST API cho chat |
| **DocxController.js** | 222 dòng | Xuất file DOCX báo cáo | Sinh báo cáo định dạng DOCX |
| **LichLamViecOperatorController.js** | 218 dòng | Phân công, quản lý lịch NVBH (Operator) | Operator quản lý lịch |
| **TinDangOperatorController.js** | 194 dòng | Duyệt/từ chối tin đăng (Operator) | Operator workflow |
| **HopDongController.js** | 184 dòng | CRUD Hợp đồng, ký điện tử | Quản lý hợp đồng thuê |
| **PublicTinDangController.js** | 150 dòng | API public cho khách xem tin đăng | Endpoint công khai |
| **userController.js** | 145 dòng | CRUD người dùng cơ bản | User management |
| **BaoCaoHieuSuatController.js** | 127 dòng | Báo cáo hiệu suất NVBH, cuộc hẹn, doanh thu | Thống kê hiệu suất |
| **ThongBaoController.js** | 114 dòng | CRUD thông báo, Notification Center | REST API cho notifications |
| **PublicDuAnController.js** | 97 dòng | API public cho khách xem dự án | Endpoint công khai |
| **khuVucController.js** | 92 dòng | Quản lý khu vực địa lý | CRUD khu vực |
| **KycController.js** | 81 dòng | Xác thực KYC, lưu hồ sơ, lịch sử | eKYC backend |
| **transactionController.js** | 74 dòng | API nội bộ xem giao dịch | Lịch sử giao dịch |
| **authController.js** | 72 dòng | Login, Register, JWT | Authentication |
| **GeocodingController.js** | 67 dòng | Geocoding địa chỉ | Chuyển đổi địa chỉ ↔ tọa độ |
| **yeuThichController.js** | 65 dòng | Yêu thích tin đăng | Khách đánh dấu yêu thích |
| **DashboardOperatorController.js** | 42 dòng | Dashboard Operator | Thống kê tổng quan |
| **sepayCallbackController.js** | 42 dòng | Webhook SePay, lưu transaction | Xử lý callback |
| **sepayController.js** | 19 dòng | Đọc lịch sử giao dịch từ SePay | API SePay |

**Tổng quan:**
- Controller lớn nhất: `ChuDuAnController.js` (1451 dòng) - tập trung nhiều nghiệp vụ của Chủ dự án.
- Controllers trung bình (300-700 dòng): `NhanVienBanHangController`, `GoiYTinDangController`, `tinDangController`, `OperatorController`, `cuocHenController`, `HoSoNhanVienController`.
- Controllers nhỏ (<300 dòng): các controller phụ trợ như `KycController`, `ThongBaoController`, `sepayController`, `authController`.
- Tất cả controllers sử dụng middleware `authMiddleware` để xác thực, kiểm tra phân quyền trực tiếp qua `req.user.vaiTro`.

### 4.2.4. Data access & TinDangModel (phiên bản thật)

Tầng data access dùng `mysql2/promise` với pool chung trong `server/config/db.js`. Mỗi model chỉ phục vụ **một domain** (Tin đăng, Dự án, KYC, Thông báo, Giao dịch…).

**Transaction management:**
- Tất cả models dùng `const db = require('../config/db');` (promise pool).
- Những nghiệp vụ phức tạp (KYC) mở transaction thủ công thông qua `const connection = await db.getConnection(); await connection.beginTransaction();`.

`TinDangModel` hiện tại **không** giống snippet trong DOCX cũ (SELECT đơn giản từ `tindang` + `hinhanh` + `yeuthich`). Thay vào đó, model đã được refactor để:

- Gắn trực tiếp với **Dự án** (`duan`), **Khu vực** (`khuvuc`) và **Phòng** (`phong`, `phong_tindang`).
- Tính toán giá/diện tích hiển thị dựa trên cấu hình override ở `phong_tindang`.
- Bảo vệ quyền sở hữu: luôn ràng buộc theo `ChuDuAnID` khi cần.

Ví dụ (rút gọn) từ `server/models/TinDangModel.js`:

```20:99:server/models/TinDangModel.js
class TinDangModel {
  /**
   * Lấy danh sách tin đăng của chủ dự án
   */
  static async layDanhSachTinDang(chuDuAnId, filters = {}) {
    let query = `
      SELECT 
        td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
        td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
        (
          SELECT MIN(pt.PhongID) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
        ) AS PhongID,
        (
          SELECT GROUP_CONCAT(pt.PhongID) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
        ) AS PhongIDs,
        (
          SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
          FROM phong_tindang pt
          JOIN phong p ON pt.PhongID = p.PhongID
          WHERE pt.TinDangID = td.TinDangID
        ) as Gia,
        (
          SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
          FROM phong_tindang pt
          JOIN phong p ON pt.PhongID = p.PhongID
          WHERE pt.TinDangID = td.TinDangID
        ) as DienTich,
        td.TrangThai,
        da.TenDuAn, da.DiaChi AS DiaChi, kv.TenKhuVuc
      FROM tindang td
      INNER JOIN duan da ON td.DuAnID = da.DuAnID
      LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
      WHERE da.ChuDuAnID = ?
      AND td.TrangThai != 'LuuTru'
    `;
    // ... áp dụng filters.trangThai, filters.duAnId, filters.keyword ...
    const [rows] = await db.execute(query, params);
    return rows;
  }

  /**
   * Tạo tin đăng mới (kèm ánh xạ phòng)
   */
  static async taoTinDang(chuDuAnId, tinDangData) {
    // Kiểm tra quyền sở hữu dự án
    // INSERT vào tindang
    // Nếu có PhongIDs thì thêm mapping vào phong_tindang
  }
}
```

Điểm khác biệt chính so với bản cũ:

- Không dùng các cột "phẳng" như `GiaThue`, `DienTich` riêng lẻ; giá/diện tích được suy ra từ bảng phòng.
- Bắt buộc phải có ít nhất một phòng gắn vào tin đăng khi gửi duyệt (được kiểm tra ở `guiTinDangDeDuyet`).
- Các thao tác cập nhật/xoá là **soft delete** (`TrangThai = 'LuuTru'`) để bảo toàn lịch sử.

**Models theo domain:**

Hệ thống có **26 models** tương ứng với các entities chính, được tách theo domain thay vì gom vào một file lớn:

| Model | Size | Chức năng | Ghi chú |
|:--- |:--- |:--- |:--- |
| **ChuDuAnModel.js** | 1541 dòng | Tất cả operations của Chủ dự án | Dashboard, thống kê, quản lý dự án/tin đăng |
| **tinDangModel.js** | 400 dòng | CRUD Tin đăng | Gắn với phòng qua `phong_tindang`, filter đa chiều |
| **DuAnModel.js** | 533 dòng | CRUD Dự án | Quản lý dự án, khu vực, chính sách |
| **cuocHenModel.js** | 565 dòng | CRUD Cuộc hẹn | Lịch hẹn NVBH, timeline, báo cáo kết quả |
| **PhongModel.js** | 366 dòng | Quản lý Phòng | CRUD phòng, ánh xạ với tin đăng |
| **GoiYTinDangModel.js** | 416 dòng | Tìm kiếm gợi ý tin đăng | Filter theo khu vực NVBH, giá, diện tích |
| **HoSoNhanVienModel.js** | 553 dòng | Quản lý hồ sơ nhân viên | Thông tin NVBH, khu vực phụ trách |
| **BienBanBanGiaoModel.js** | 592 dòng | Biên bản bàn giao | Quản lý hợp đồng, bàn giao phòng |
| **DuAnOperatorModel.js** | 383 dòng | Dự án (Operator) | Duyệt/từ chối dự án cho Điều hành |
| **TinDangOperatorModel.js** | 386 dòng | Tin đăng (Operator) | Duyệt/từ chối tin đăng cho Điều hành |
| **LichLamViecOperatorModel.js** | 475 dòng | Lịch làm việc (Operator) | Phân công, quản lý lịch NVBH |
| **ChinhSachCocModel.js** | 271 dòng | Quản lý Chính sách cọc | CRUD chính sách, áp dụng cho tin đăng |
| **HopDongModel.js** | 219 dòng | CRUD Hợp đồng | Tạo, ký, quản lý hợp đồng thuê |
| **ChatModel.js** | 350 dòng | Chat messages | Cuộc hội thoại, tin nhắn, đánh dấu đã đọc |
| **ThongBaoModel.js** | 216 dòng | Thông báo hệ thống | Notification Center, realtime events |
| **BaoCaoHieuSuatModel.js** | 320 dòng | Báo cáo hiệu suất | Thống kê NVBH, cuộc hẹn, doanh thu |
| **BaoCaoThuNhapModel.js** | 237 dòng | Báo cáo thu nhập | Phân tích thu nhập theo thời gian |
| **LichLamViecModel.js** | 183 dòng | Lịch làm việc NVBH | Ca làm việc, phân công |
| **KycModel.js** | 51 dòng | KYC verification | Lưu hồ sơ xác thực, lịch sử |
| **PublicTinDangModel.js** | 144 dòng | Tin đăng công khai | API public cho khách xem |
| **PublicDuAnModel.js** | 48 dòng | Dự án công khai | API public cho khách xem |
| **transactionModel.js** | 56 dòng | Giao dịch | Lưu lịch sử từ SePay |
| **yeuThichModel.js** | 74 dòng | Yêu thích | Khách đánh dấu tin đăng yêu thích |
| **userModel.js** | 38 dòng | User management | CRUD người dùng cơ bản |
| **khuVucModel.js** | 24 dòng | Khu vực | Quản lý khu vực địa lý |
| **CuocHenAdminModel.js** | 100 dòng | Cuộc hẹn (Admin) | Admin xem/quản lý cuộc hẹn |

**Tổng quan:**
- Models lớn nhất: `ChuDuAnModel.js` (1541 dòng) - tập trung nhiều nghiệp vụ của Chủ dự án.
- Models trung bình (300-600 dòng): `DuAnModel`, `cuocHenModel`, `GoiYTinDangModel`, `HoSoNhanVienModel`, `BienBanBanGiaoModel`, `LichLamViecOperatorModel`.
- Models nhỏ (<300 dòng): các model phụ trợ như `KycModel`, `ThongBaoModel`, `transactionModel`, `userModel`.
- Tất cả models sử dụng `mysql2/promise` với prepared statements để tránh SQL injection.

### 4.2.5. Dịch vụ KYC (backend-side)

Phần xử lý ảnh (ROI-based OCR, multi-region QR scanning, face matching) được hiện thực ở frontend module KYC; backend đảm nhiệm các bước:

1. Nhận form data chứa:
   - Trường đã trích xuất: `soCCCD`, `tenDayDu`, `ngaySinh`, `diaChi`, `ngayCapCCCD`, `faceSimilarity` (0–1).
   - Đường dẫn file ảnh sau khi upload (`cccdFront`, `cccdBack`, `selfie`).
2. Áp dụng rule đơn giản để quyết định:
   - `ThanhCong` nếu `faceSimilarity >= 0.85`.
   - `ThatBai` nếu `< 0.6` (kèm lý do).
   - `CanXemLai` cho các trường hợp còn lại.
3. Gọi `KycService.createVerification` để:
   - Xoá ảnh KYC cũ (nếu có).
   - Ghi bảng `kyc_verification`.
   - Cập nhật bảng `nguoidung` (thông tin định danh + `TrangThaiXacMinh`).

Luồng chính:

```4:70:server/controllers/KycController.js
static async xacThucKYC(req, res) {
  const { soCCCD, tenDayDu, ngaySinh, diaChi, ngayCapCCCD, faceSimilarity } = req.body;
  const userId = req.user.id;

  if (!soCCCD || !tenDayDu || !faceSimilarity) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: Số CCCD, Họ tên, Độ tương đồng' });
  }

  const cccdFront = req.files['cccdFront'] ? req.files['cccdFront'][0].path : null;
  const cccdBack = req.files['cccdBack'] ? req.files['cccdBack'][0].path : null;
  const selfie = req.files['selfie'] ? req.files['selfie'][0].path : null;

  // Tính TrangThai dựa trên faceSimilarity
  let trangThai = 'CanXemLai';
  const similarity = parseFloat(faceSimilarity);
  if (similarity >= 0.85) {
    trangThai = 'ThanhCong';
  } else if (similarity < 0.6) {
    trangThai = 'ThatBai';
  }

  const kycData = { NguoiDungID: userId, SoCCCD: soCCCD, TenDayDu: tenDayDu, ... };
  const kycId = await KycService.createVerification(kycData);
  res.status(200).json({ message: 'Gửi yêu cầu xác thực thành công', kycId, trangThai });
}
```

`KycService` dùng transaction để đảm bảo an toàn:

```5:75:server/services/KycService.js
const connection = await db.getConnection();
await connection.beginTransaction();

// 1. Lấy bản ghi KYC gần nhất, xoá ảnh cũ trên ổ đĩa (nếu tồn tại).
// 2. Tạo bản ghi mới trong kyc_verification (qua KycModel.create).
// 3. UPDATE nguoidung: thông tin định danh + ảnh + TrangThaiXacMinh
//    (DaXacMinh / TuChoi / ChoDuyet) tuỳ theo TrangThai KYC.

await connection.commit();
```

Như vậy, ROI-based OCR và multi-region QR scanning được triển khai phía client, còn backend chỉ lưu **dữ liệu đã chuẩn hoá**, vừa đảm bảo tách bạch trách nhiệm, vừa dễ thay thế engine CV trong tương lai.

**Service chuyên biệt khác:**
- **ThongBaoService:** chuẩn hoá cấu trúc thông báo (title, content, payload JSON) và emit realtime.
- **QRSessionStore:** Map in-memory TTL 30 phút cho QR "Xem Ngay", có cleanup interval và các helper (`isValid`, `getRemainingTime`, `updateStatus`).
- **NhatKyHeThongService:** ghi log mọi hành động quan trọng, hỗ trợ cả format object lẫn positional.

### 4.2.6. Dịch vụ Gợi ý tin đăng & phiên QR "Xem Ngay"

Để hiện thực UC-SALE-08 (gợi ý tin đăng trong phiên tư vấn) và UC-CUST-07 (khách xem và phản hồi tin gợi ý), backend cung cấp một cụm API trong `GoiYTinDangController` kết hợp với `QRSessionStore`:

1. **Tìm kiếm tin đăng để gợi ý**  
   API `POST /api/nhan-vien-ban-hang/goi-y/tim-kiem`:

   - Tự xác định khu vực phụ trách của NVBH từ `hosonhanvien.KhuVucPhuTrachID`.
   - Lấy danh sách khu vực con để filter (tin đăng thường nằm ở "lá", không phải node cha).
   - Nhận các filter: `giaMin`, `giaMax`, `dienTichMin`, `dienTichMax`, `tienIch`, `cuocHenId`.
   - Loại trừ tin đăng gốc của cuộc hẹn nếu có (`excludeTinDangId`).

   ```31:125:server/controllers/GoiYTinDangController.js
   static async timKiemGoiY(req, res) {
     const nhanVienId = req.user.id;
     // Lấy KhuVucPhuTrachID, suy ra danh sách khu vực con
     // Lấy tin đăng gốc từ cuochen để loại trừ
     // Gọi GoiYTinDangModel.timKiemGoiY(filters) và trả về tinDangList + khuVucList
   }
   ```

2. **Tạo phiên QR "Xem Ngay"**  
   API `POST /api/nhan-vien-ban-hang/goi-y/tao-qr`:

   - Kiểm tra phòng còn trống (`kiemTraPhongConTrong`).
   - Lấy thông tin phòng, tin đăng và NVBH.
   - Sinh mã QR ngẫu nhiên và lưu session vào `QRSessionStore` với TTL 30 phút.
   - Trả về `maQR`, `qrUrl`, `thoiGianConLai`, `hetHanLuc`.

   ```247:355:server/controllers/GoiYTinDangController.js
   static async taoQRXemNgay(req, res) {
     const nhanVienId = req.user.id;
     const { cuocHenId, tinDangId, phongId } = req.body;
     // ... kiểm tra phòng, load thông tin ...
     const maQR = generateQRCode(12);
     const session = QRSessionStore.create({ maQR, nhanVienId, cuocHenId, tinDangId, phongId, thongTinPhong, thongTinTinDang, thongTinNhanVien });
     const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);
     return res.json({ success: true, data: { maQR, qrUrl: `/xem-ngay/${maQR}`, thoiGianConLai, hetHanLuc: session.hetHanLuc } });
   }
   ```

3. **Trang "Xem Ngay" cho khách & phản hồi**  

   - `GET /api/public/xem-ngay/:maQR`: kiểm tra session, hết hạn, trạng thái (`CHO_PHAN_HOI`/`DONG_Y`/`TU_CHOI`/`HET_HAN`), trả thông tin phòng + tin đăng (ẩn thông tin liên hệ cho tới khi khách đồng ý).
   - `POST /api/public/xem-ngay/:maQR/phan-hoi`: khách chọn `dongY` hoặc không, backend:
     - Cập nhật trạng thái session trong `QRSessionStore`.
     - Nếu `dongY` thì có thể tự động tạo cuộc hẹn mới, ghi nhật ký hệ thống (`NhatKyHeThongService`) và gửi thông báo cho NVBH (`ThongBaoService.thongBaoCuocHenTuQR`, `thongBaoPhanHoiGoiY`).
     - Emit socket event `goi_y_phan_hoi` để Notification Center cập nhật realtime.

   Phiên QR được lưu in-memory:

   ```44:60:server/services/QRSessionStore.js
   function create(sessionData, expiryMs = DEFAULT_EXPIRY_MS) {
     const now = Date.now();
     const session = {
       maQR: sessionData.maQR,
       nhanVienId: sessionData.nhanVienId,
       cuocHenId: sessionData.cuocHenId,
       tinDangId: sessionData.tinDangId,
       phongId: sessionData.phongId,
       trangThai: 'CHO_PHAN_HOI',
       thongTinPhong: sessionData.thongTinPhong || null,
       thongTinNhanVien: sessionData.thongTinNhanVien || null,
       thongTinTinDang: sessionData.thongTinTinDang || null,
       taoLuc: now,
       hetHanLuc: now + expiryMs,
       phanHoiLuc: null
     };
     sessions.set(sessionData.maQR, session);
     return session;
   }
   ```

### 4.2.7. Tích hợp backend với AI Translation pipeline & WebRTC Gateway

Trong codebase hiện tại:

- **Không có** mã nguồn STT/MT/TTS hoặc WebRTC SFU nằm trực tiếp trong thư mục `server/`.
- Toàn bộ chi tiết kiến trúc pipeline AI (STT Sherpa-ONNX, MT, TTS, WebRTC SFU) được mô tả trong tài liệu riêng `docs/VIDEOCALL_AI_TRANSLATION_COMPLETE.md`.

Backend của hệ thống **dừng ở mức signaling + adapter**, cụ thể:

- Socket handlers trong `server/socket/chatHandlers.js`:
  - `initiate_video_call`: tạo `roomUrl` (địa chỉ WebRTC gateway), lưu `pendingVideoCalls`, phát sự kiện `video_call_incoming` qua Notification Center.
  - `answer_video_call`: ghi nhận `accepted/missed`, phát `video_call_answered`, tạo log "cuộc gọi nhỡ" khi cần.
- UI phía client (`VideoCallNotification.jsx`) mở `roomUrl` trong một cửa sổ mới – đây là nơi WebRTC Gateway gắn thêm pipeline dịch song ngữ nếu đã được deploy.

Khi triển khai thực tế pipeline AI, backend sẽ:

- Cấu hình endpoint các service thông qua biến môi trường (ví dụ: `AI_STT_ENDPOINT`, `AI_TRANSLATE_ENDPOINT`, `AI_TTS_ENDPOINT`, `AI_GATEWAY_URL`) – **không hard-code token/API key trong code**.
- Đóng gói yêu cầu (metadata cuộc gọi, hướng dịch, tham số hotword) và gửi tới cụm AI qua REST/WebSocket.
- Nhận kết quả transcript/bản dịch/URL audio và trả về frontend (chat/video call) dưới dạng JSON, không chứa thông tin nhạy cảm.

Nhờ phân tách này, chương 4 có thể mô tả đầy đủ kiến trúc AI Translation & WebRTC Gateway mà vẫn đảm bảo:

- Token/API key luôn nằm trong **env/secret manager**, không xuất hiện trong repo.
- Backend dễ dàng chuyển giữa các provider (self-hosted, cloud) mà không phải thay đổi hợp đồng API với frontend.

### 4.2.8. Job nền & tự động hoá

- **Cron jobs:** `appointmentReminders` & `appointmentReportReminders` gửi notifications trước/ sau cuộc hẹn; `sepaySyncService` poll giao dịch 60s/lần.

---

## 4.3. Triển khai Real-time với Socket.IO

Hệ thống realtime thống nhất trên Socket.IO để đáp ứng ba nhóm nhu cầu lớn:

- **Messaging:** Chủ dự án ↔ Nhân viên bán hàng ↔ Khách thuê, hỗ trợ văn bản, typing indicator và cuộc gọi video.
- **Notifications:** cuộc hẹn mới/nhắc nhở, phản hồi gợi ý, giao dịch cọc, tin nhắn mới, sự kiện QR…
- **Trạng thái phòng & QR:** gợi ý phòng thay thế, quản lý QR “Xem Ngay”, đồng bộ video call với trung tâm thông báo.

### 4.3.1. Socket.IO server setup

Socket server được khai báo trong [`server/index.js`](server/index.js) với cấu hình CORS động (allow DevTunnel) và heartbeat điều chỉnh cho kết nối dài:

```javascript
// server/index.js (trích)
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) return callback(null, true);
      console.log('⚠️ Socket.IO CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.use(socketAuth);
io.on('connection', (socket) => {
  setupChatHandlers(socket, io);
  setupGoiYHandlers(socket, io);
  setupNotificationHandlers(socket, io);
});

app.set('io', io);          // cho controllers
setIoInstance(io);          // cho services (ThongBaoService, QR, v.v.)
```

### 4.3.2. Chat handlers, rate limit & video call

[`server/socket/chatHandlers.js`](server/socket/chatHandlers.js) chịu trách nhiệm chính:

- Chống spam 50 tin/phút bằng `userMessageCount`.
- Sanitise nội dung với `isomorphic-dompurify`.
- Quản lý room theo `conversation_${CuocHoiThoaiID}` để broadcast cho tất cả thành viên.
- Audit log mỗi tin nhắn và tự động gửi notification cho NVBH khi cần.
- Điều phối cuộc gọi video (`initiate_video_call`, `answer_video_call`, missed-call logging).

```javascript
socket.on('send_message', async ({ cuocHoiThoaiID, noiDung }) => {
  if (!checkRateLimit(userId)) {
    return socket.emit('error', { event: 'send_message', message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút.' });
  }

  if (!noiDung?.trim()) {
    return socket.emit('error', { event: 'send_message', message: 'Nội dung tin nhắn không được để trống' });
  }

  const sanitizedNoiDung = sanitizeMessage(noiDung);
  const tinNhan = await ChatModel.guiTinNhan({ CuocHoiThoaiID: cuocHoiThoaiID, NguoiGuiID: userId, NoiDung: sanitizedNoiDung });
  io.to(`conversation_${cuocHoiThoaiID}`).emit('new_message', tinNhan);

  ThongBaoService.thongBaoTroChuyenMoi(...);
  NhatKyService.ghiNhan({ NguoiDungID: userId, HanhDong: 'gui_tin_nhan_socket', ... });
});
```

Video call tận dụng notification room để bật pop-up đồng thời cho tất cả thành viên:

```javascript
socket.on('initiate_video_call', async ({ cuocHoiThoaiID, roomUrl }) => {
  pendingVideoCalls.set(cuocHoiThoaiID, { nguoiGoiID: userId, roomUrl, timestamp: new Date().toISOString() });

  thanhVienRows.forEach(thanhVien => {
    io.to(`notifications:${thanhVien.NguoiDungID}`).emit('video_call_incoming', {
      cuocHoiThoaiID,
      nguoiGoiID: userId,
      nguoiGoiTen: nguoiGoi.TenDayDu,
      roomUrl,
      timestamp: new Date().toISOString()
    });
    ThongBaoService.thongBaoVideoCall(...);
  });
});
```

### 4.3.3. Client integration (ChatContext & Notification Center)

Hook [`client/src/hooks/useSocket.js`](client/src/hooks/useSocket.js) quản lý kết nối, còn `ChatContext` đảm nhiệm đồng bộ REST + realtime:

```javascript
const { socket, isConnected } = useSocket();

const loadConversations = useCallback(async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${getApiBaseUrl()}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  ...
});

useEffect(() => {
  if (!socket) return;
  const handleNewMessage = (message) => { /* cập nhật conversations + unread */ };
  socket.on('new_message', handleNewMessage);
  return () => socket.off('new_message', handleNewMessage);
}, [socket, activeConversationId]);
```

Notification Center và `VideoCallNotification.jsx` subscribe room `notifications:{NguoiDungID}` để nhận `notification:new` và `video_call_incoming`, sinh toast/badge/popup theo thời gian thực.

---

## 4.4. Tích hợp Thanh toán với SePay

Trạng thái triển khai hiện tại tập trung vào **đồng bộ giao dịch và webhook ghi nhận**:

1. API `GET /api/sepay/transactions` cho phép truy vấn lịch sử từ SePay.
2. `sepaySyncService` poll định kỳ để làm giàu dữ liệu phân tích.
3. Webhook `/api/sepay/callback` lưu payload, chèn transaction vào DB nhằm đối soát thủ công.

### 4.4.1. Đọc lịch sử giao dịch

`SepayService` chỉ cung cấp hàm `listTransactions`, tái sử dụng Axios client với Bearer token dev:

```javascript
// server/services/sepayService.js
const client = axios.create({
  baseURL: 'https://my.sepay.vn',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
});

exports.listTransactions = async (params = {}) => {
  const res = await client.get('/userapi/transactions/list', { params });
  return res.data;
};
```

Controller [`server/controllers/sepayController.js`](server/controllers/sepayController.js) wrap kết quả trả về REST:

```javascript
exports.getTransactions = async (req, res) => {
  try {
    const data = await Sepay.listTransactions(req.query || {});
    return res.status(200).json({ message: 'Lấy lịch sử giao dịch thành công !', metadata: data });
  } catch (err) {
    return res.status(status).json({ error: 'Lấy lịch sử giao dịch thất bại', details });
  }
};
```

### 4.4.2. Webhook callback & lưu trữ

Webhook `/api/sepay/callback` ghi payload vào `_store` (debug) và map sang schema `TransactionModel` để lưu DB:

```javascript
// server/controllers/sepayCallbackController.js (trích)
exports.callback = async (req, res) => {
  const payload = req.body || {};
  _store.unshift({ at: new Date().toISOString(), payload });
  const tx = {
    user_id: payload.user_id || null,
    sepay_id: payload.id || payload.sepay_id || null,
    bank_name: payload.bank_name || payload.bank_brand_name || null,
    amount_in: payload.amount_in != null ? parseFloat(payload.amount_in) : (payload.amount != null ? parseFloat(payload.amount) : null),
    transaction_content: payload.transaction_content || payload.note || payload.description || null,
    transaction_date: payload.transaction_date || payload.date || null,
    reference_number: payload.reference_number || payload.ref || null
  };
  await Transaction.insertTransaction(tx);
  return res.status(200).json({ success: true });
};
```

### 4.4.3. Đồng bộ định kỳ & roadmap

- `sepaySyncService.startPolling(60 * 1000)` được kích hoạt sau khi server ổn định 1 giây.
- Dữ liệu giao dịch lưu DB dùng để đối soát thủ công, nuôi báo cáo và kích hoạt thông báo nội bộ (ví dụ `ThongBaoService.thongBaoCocMoi`).

---

## 4.5. Triển khai Frontend

### 4.5.1. Kiến trúc SPA & quy tắc CSS

- **Framework:** React 19 + Vite 5 (ESM, alias, HMR).
- **Quy ước CSS:** BEM bắt buộc, ví dụ `nvbh-card__header`, `video-call-notification__button--accept`.
- **Organizing:** components vs pages vs services vs hooks; file `client/src/styles/NhanVienBanHangDesignSystem.css` gom token (màu sắc, spacing, typography).

**Kiến trúc Component:**

Hệ thống frontend được tổ chức theo cấu trúc rõ ràng với các category sau:

| Category | Count | Examples |
|:--- |:--- |:--- |
| **Pages** | 57 files | `ChuDuAn/Dashboard.jsx`, `NhanVienBanHang/ChiTietCuocHen.jsx`, `XacThucKYC/XacThucKYC.jsx`, `Operator/DashboardOperator.jsx`, etc. |
| **Components** | 70 files | `ModalTaoDuAn`, `TableTinDang`, `NotificationCenter`, `VideoCallNotification`, `ChatWindow`, `AddressAutocomplete`, etc. |
| **Layouts** | 3 files | `ChuDuAnLayout.jsx`, `OperatorLayout.jsx`, `LayoutNhanVienBanHang.jsx` |
| **Services** | 16 files | `KYCService.js`, `OCRServiceV2.js`, `FaceMatchingService.js`, `QRCodeService.js`, `ChuDuAnService.js`, `HopDongService.js`, etc. |
| **API Clients** | 10 files | `axiosClient.js`, `authApi.js`, `tinDangApi.js`, `cuocHenApi.js`, `userApi.js`, `nhanVienBanHangApi.js`, `operatorApi.js`, etc. |
| **Utils** | 2 files | `geoUtils.js`, `nvbhHelpers.js` |

**Tổng quan:**
- **Pages (57):** Chia theo module: ChuDuAn (13), NhanVienBanHang (13), Operator (20), XacThucKYC, XemNgay, và các trang công khai.
- **Components (70):** Tổ chức theo folder domain: `ChuDuAn/`, `NhanVienBanHang/`, `Operator/`, `Chat/`, `KYC/`, và các component dùng chung.
- **Layouts (3):** Mỗi layout phục vụ một nhóm người dùng (Chủ dự án, NVBH, Điều hành).
- **Services (16):** Bao gồm business services (ChuDuAnService, HopDongService) và CV/AI services (OCR, Face Matching, QR Code).
- **API Clients (10):** Tổ chức theo domain, tái sử dụng `axiosClient.js` làm base.
- **Utils (2):** Helper functions cho geospatial và NVBH operations.

### 4.5.2. Triển khai Pages chính

#### 4.5.2.1. ChuDuAnDashboard - Trang tổng quan

Trang Dashboard Chủ dự án (`client/src/pages/ChuDuAn/Dashboard.jsx`) sử dụng React Query pattern với custom hook `useDashboardData` để quản lý data fetching, caching và error handling tự động.

**Kiến trúc:**
- Sử dụng `@tanstack/react-query` cho data fetching (cache 5 phút, retry 2 lần).
- Custom hook `useDashboardData` gọi `DashboardService.layDashboard()` từ `ChuDuAnService`.
- Layout wrapper `ChuDuAnLayout` cung cấp navigation và structure chung.
- UI được redesigned với gradient hero, metrics grid enhanced, charts và status distribution.

**Code snippet thực tế:**

```1:66:client/src/pages/ChuDuAn/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import { useDashboardData } from '../../hooks/useDashboardData';
import './Dashboard.css';

import {
  HiOutlineChartBar,
  HiOutlineArrowTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineEye
} from 'react-icons/hi2';

/**
 * UC-PROJ-03: Dashboard tổng quan cho Chủ dự án
 * Redesigned với clean layout, focus vào metrics quan trọng
 * Updated: Sử dụng React Query cho data fetching
 */
function DashboardChuDuAn() {
  // React Query hook - tự động handle loading, error, caching
  const { data: dashboardData, isLoading: loading, error, refetch } = useDashboardData();

  const formatNumber = (value = 0) => {
    return Number(value || 0).toLocaleString('vi-VN');
  };

  const formatCurrency = (value = 0) => {
    const num = Number(value || 0);
    if (!num) return '0 ₫';
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  if (loading) {
    return (
      <ChuDuAnLayout>
        <div className="cda-loading">
          <div className="cda-spinner"></div>
          <p className="cda-loading-text">Đang tải dữ liệu...</p>
        </div>
      </ChuDuAnLayout>
    );
  }

  if (error) {
    return (
      <ChuDuAnLayout>
        <div className="cda-card">
          <div className="cda-empty-state">
            <div className="cda-empty-icon">⚠️</div>
            <h3 className="cda-empty-title">Có lỗi xảy ra</h3>
            <p className="cda-empty-description">{error?.message || 'Không thể tải dữ liệu dashboard'}</p>
            <button onClick={() => refetch()} className="cda-btn cda-btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      </ChuDuAnLayout>
    );
  }

  return (
    <ChuDuAnLayout>
      {/* Page Header với gradient background */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-text">
            <h1 className="dashboard-title">Chào mừng trở lại! 👋</h1>
            <p className="dashboard-subtitle">Quản lý dự án của bạn một cách hiệu quả</p>
          </div>
          
          {/* Quick actions */}
          <div className="quick-actions-hero">
            <Link to="/chu-du-an/tao-tin-dang" className="quick-action-btn primary">
              <HiOutlinePlus />
              <span>Tạo tin đăng</span>
            </Link>
            {/* ... more quick actions ... */}
          </div>
        </div>
      </div>

      {/* Metrics Grid - Enhanced */}
      <div className="cda-metrics-grid enhanced">
        <div className="cda-metric-card emerald enhanced">
          <div className="cda-metric-icon pulse">
            <HiOutlineChartBar />
          </div>
          <div className="metric-card-content">
            <div className="cda-metric-label">Tổng tin đăng</div>
            <div className="cda-metric-value">{formatNumber(dashboardData?.tongTinDang || 0)}</div>
            <div className="cda-metric-change">
              <HiOutlineArrowTrendingUp />
              <span>{formatNumber(dashboardData?.tinDangChoDuyet || 0)} chờ duyệt</span>
            </div>
          </div>
        </div>
        {/* ... more metric cards ... */}
      </div>

      {/* Charts, Status Distribution, Recent Activities */}
      {/* ... */}
    </ChuDuAnLayout>
  );
}

export default DashboardChuDuAn;
```

**Custom Hook `useDashboardData`:**

```17:32:client/src/hooks/useDashboardData.js
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await DashboardService.layDashboard();
      if (!response.success) {
        throw new Error(response.message || 'Không thể tải dữ liệu dashboard');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    retry: 2, // Retry 2 lần cho dashboard (quan trọng)
  });
};
```

**Tính năng chính:**
- **Metrics Grid:** 4 metric cards (Tổng tin đăng, Đang hoạt động, Cuộc hẹn sắp tới, Doanh thu tháng này) với icon pulse animation.
- **Charts:** Biểu đồ doanh thu 6 tháng, tỷ lệ lấp đầy phòng (circular progress), phân bố trạng thái tin đăng.
- **Quick Actions:** Các nút hành động nhanh (Tạo tin đăng, Quản lý tin, Báo cáo, Cuộc hẹn).
- **Recent Activities:** Danh sách tin đăng gần đây và cuộc hẹn sắp tới.
- **Error Handling:** Tự động retry, hiển thị error state với nút "Thử lại".

### 4.5.3. State Management

Hệ thống sử dụng kết hợp **React Context API**, **localStorage**, **React Query** và **local component state** để quản lý state:

| Cơ chế | Mục đích | Implementation | Ghi chú |
|:--- |:--- |:--- |:--- |
| **ChatContext** | Quản lý chat messages, socket connection, conversations, unread count | `client/src/context/ChatContext.jsx` | Context Provider với `useSocket` hook, quản lý conversations list, active conversation, incoming call state |
| **localStorage** | Authentication state, user info, token | `localStorage.getItem('token')`, `localStorage.getItem('user')` | Token và user info được lưu sau login, axios interceptor tự động thêm token vào headers |
| **React Query** | Server state management, data fetching, caching | `@tanstack/react-query` với custom hooks (`useDashboardData`, `useBaoCaoData`) | Cache 5-15 phút, tự động retry, stale-while-revalidate pattern |
| **Local State** | Notifications, UI state, form state | `useState` trong components | NotificationCenter, ToastNotification quản lý notifications qua local state + socket events |

**Chi tiết từng cơ chế:**

1. **ChatContext (`client/src/context/ChatContext.jsx`):**
   - Quản lý global state cho chat: `conversations`, `unreadCount`, `activeConversationId`, `incomingCall`.
   - Tích hợp với `useSocket` hook để tự động cập nhật khi có tin nhắn mới qua socket.
   - Methods: `loadConversations()`, `findOrCreateConversation()`, `markConversationAsRead()`, `acceptCall()`, `declineCall()`.

```20:200:client/src/context/ChatContext.jsx
export const ChatProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // Load conversations từ REST API
  const loadConversations = useCallback(async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${getApiBaseUrl()}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // ... update state
  }, []);

  // Listen socket events
  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', handleNewMessage);
    socket.on('incoming_call', handleIncomingCall);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket, activeConversationId]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
```

2. **Authentication (localStorage):**
   - Token và user info được lưu vào `localStorage` sau khi login thành công.
   - `axiosClient` interceptor tự động thêm `Authorization: Bearer ${token}` vào mọi request.
   - Khi token hết hạn (401), interceptor tự động xóa localStorage và redirect về `/login`.

3. **React Query (Server State):**
   - Custom hooks như `useDashboardData()` sử dụng `useQuery` để fetch và cache data.
   - Cache time: 5-15 phút tùy loại data (dashboard: 5 phút, báo cáo: 10-15 phút).
   - Tự động retry khi lỗi, stale-while-revalidate để tối ưu UX.

4. **Notifications (Local State + Socket):**
   - `NotificationCenter` và `ToastNotification` quản lý notifications qua local `useState`.
   - Subscribe socket room `notifications:{NguoiDungID}` để nhận realtime updates.
   - Unread count được sync qua prop `onUnreadCountChange` lên parent component (LayoutNhanVienBanHang).

```32:50:client/src/components/NhanVienBanHang/NotificationCenter/NotificationCenter.jsx
const NotificationCenter = ({ isOpen, onClose, onUnreadCountChange }) => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Load từ REST API
  const loadNotifications = useCallback(async (page = 1) => {
    const response = await layDanhSachThongBao({ page, limit: 20 });
    setNotifications(response.data || []);
  }, []);

  // Subscribe socket
  useEffect(() => {
    if (!socket) return;
    socket.emit('subscribe_notifications');
    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.emit('unsubscribe_notifications');
    };
  }, [socket, isConnected]);
};
```

**Tổng quan:**
- **Global Context:** Chỉ có `ChatContext` cho chat state.
- **Authentication:** localStorage (không dùng Context riêng).
- **Server State:** React Query với custom hooks cho data fetching và caching.
- **Component State:** Local `useState` cho UI state, notifications, forms.
- **Realtime State:** Socket.IO events được handle trong components và Context.

### 4.5.4. Layout Nhân viên Bán hàng

`LayoutNhanVienBanHang.jsx` là shell chính chứa:

- Sidebar điều hướng (desktop + mobile).
- Header với search, NotificationBadge, message shortcut, user menu.
- NotificationCenter, ToastNotification, VideoCallNotification, FeedbackModal.
- `Outlet` render nội dung page con theo route.

Trạng thái unread đồng bộ qua prop `onUnreadCountChange`, kèm state `notificationOpen`, `userMenuOpen`, `mobileMenuOpen`.

### 4.5.5. ChatContext & hook socket

- `useSocket.js` đọc JWT từ `localStorage`, tạo socket connection với `auth: { token }`, tự reconnect 5 lần, expose `{ socket, isConnected, error }`.
- `ChatContext.jsx` dùng hook này để quản lý:
  - Danh sách cuộc hội thoại (`loadConversations`, `findOrCreateConversation`).
  - Unread count (cộng dồn theo `SoTinChuaDoc`).
  - Incoming call state (kết nối với VideoCallNotification).

### 4.5.6. Pages tiêu biểu khác

- **Chi tiết cuộc hẹn NVBH:** `client/src/pages/NhanVienBanHang/ChiTietCuocHen.jsx` chi tiết ở §4.7.
- **Trang công khai "Xem Ngay":** `client/src/pages/XemNgay/...` đọc thông tin QR session cho khách hàng.
- **Trang eKYC:** `client/src/pages/XacThucKYC/XacThucKYC.jsx` (chi tiết §4.6).

---

## 4.6. Triển khai Security

Hệ thống áp dụng các biện pháp bảo mật ở nhiều tầng, từ input validation đến SQL injection prevention và XSS sanitization. Dưới đây là tổng quan các biện pháp đã triển khai:

| Security Measure | Implementation | Purpose | Ghi chú |
|:--- |:--- |:--- |:--- |
| **Input Validation** | Manual validation trong controllers | Prevent injection attacks | Hầu hết controllers dùng if/else checks; chỉ `GeocodingController` dùng `express-validator` |
| **SQL Injection Prevention** | Parameterized queries với `mysql2/promise` | Tránh SQL injection | Tất cả queries dùng prepared statements (`db.execute()`, `db.query()`) |
| **XSS Prevention** | `isomorphic-dompurify` cho chat messages | Sanitize user inputs | Áp dụng cho tin nhắn chat trong `chatHandlers.js` với fallback basic sanitization |
| **CSRF Protection** | - | Protect state-changing operations | - |
| **Rate Limiting** | Socket.IO: 50 tin nhắn/phút mỗi user | Prevent spam/brute force | Áp dụng cho chat messages |
| **Password Hashing** | MD5 (crypto.createHash) | Hash passwords | `bcrypt` package có trong `package.json` |
| **JWT Security** | JWT với `expiresIn: '7d'` | Short-lived tokens | Token hết hạn sau 7 ngày |
| **HTTPS** | - | Encrypt data in transit | - |

**Chi tiết từng biện pháp:**

### 4.6.1. Input Validation

Hệ thống sử dụng **hai phương pháp validation**:

#### A. Manual Validation (Phổ biến)

Hầu hết controllers dùng manual validation với if/else checks trực tiếp trong controller method. Ví dụ từ `TinDangController`:

```22:44:server/controllers/tinDangController.js
// Validate dữ liệu đầu vào
if (!tinDangData.DuAnID || !tinDangData.TieuDe) {
  return res.status(400).json({
    success: false,
    message: 'Thiếu thông tin bắt buộc: DuAnID, TieuDe'
  });
}

// Bắt buộc phải chọn phòng từ danh sách dự án
if (!Array.isArray(tinDangData.PhongIDs) || tinDangData.PhongIDs.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'Tin đăng phải chọn ít nhất một phòng từ dự án'
  });
}

const phongIdKhongHopLe = tinDangData.PhongIDs.some(item => !item || !item.PhongID);
if (phongIdKhongHopLe) {
  return res.status(400).json({
    success: false,
    message: 'Danh sách phòng không hợp lệ'
  });
}
```

Ví dụ từ `KycController`:

```18:22:server/controllers/KycController.js
// Validation: Kiểm tra các trường bắt buộc
if (!soCCCD || !tenDayDu || !faceSimilarity) {
  return res.status(400).json({ 
    message: 'Thiếu thông tin bắt buộc: Số CCCD, Họ tên, Độ tương đồng' 
  });
}
```

**Ưu điểm:** Đơn giản, dễ hiểu, không cần thêm dependency.

#### B. Express-Validator (Hiếm khi dùng)

Chỉ `GeocodingController` sử dụng `express-validator` middleware. Validation được định nghĩa như một static property của controller:

```68:74:server/controllers/GeocodingController.js
static validateGeocodeRequest = [
  body('address')
    .trim()
    .notEmpty().withMessage('Địa chỉ không được để trống')
    .isLength({ min: 5, max: 500 }).withMessage('Địa chỉ phải từ 5-500 ký tự')
    .matches(/[a-zA-ZÀ-ỹ]/).withMessage('Địa chỉ phải chứa chữ cái'),
];
```

Sử dụng trong route:

```javascript
// server/routes/geocodingRoutes.js
const GeocodingController = require('../controllers/GeocodingController');

router.post(
  '/geocode',
  GeocodingController.validateGeocodeRequest, // Middleware validation
  GeocodingController.geocodeAddress
);
```

Controller kiểm tra validation results:

```16:23:server/controllers/GeocodingController.js
// Validation
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({
    success: false,
    errors: errors.array(),
  });
}
```


### 4.6.2. SQL Injection Prevention

Tất cả database queries sử dụng **prepared statements** qua `mysql2/promise` để tránh SQL injection. Không có string concatenation hoặc template literals trực tiếp trong SQL queries.

**Pattern chuẩn:**
- Sử dụng `?` placeholders cho parameters
- Truyền parameters dưới dạng array vào `db.execute()` hoặc `db.query()`
- Tất cả models tuân thủ pattern này

**Ví dụ từ `auth.js` middleware:**

```46:49:server/middleware/auth.js
const [userRows] = await db.execute(
  'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
  [decoded.userId]
);
```

**Ví dụ từ `TinDangModel`:**

```282:316:server/models/TinDangModel.js
static async layDanhSachTinDang(chuDuAnId, filters = {}) {
  let query = `
    SELECT 
      td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
      td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
      ...
    FROM tindang td
    INNER JOIN duan da ON td.DuAnID = da.DuAnID
    LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
    WHERE da.ChuDuAnID = ?
    AND td.TrangThai != 'LuuTru'
  `;
  const params = [chuDuAnId];
  // ... thêm filters vào params array
  const [rows] = await db.execute(query, params);
  return rows;
}
```


### 4.6.3. XSS Prevention

**Phạm vi áp dụng:** Áp dụng cho **chat messages** trong Socket.IO handlers.

**Implementation trong `chatHandlers.js`:**

```40:53:server/socket/chatHandlers.js
function sanitizeMessage(content) {
  try {
    const DOMPurify = require('isomorphic-dompurify');
    return DOMPurify.sanitize(content.trim());
  } catch (error) {
    // Fallback: basic sanitization if DOMPurify not available
    return content.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

**Sử dụng trong chat handler:**

```javascript
socket.on('send_message', async ({ cuocHoiThoaiID, noiDung }) => {
  // ... rate limit check ...
  const sanitizedNoiDung = sanitizeMessage(noiDung);
  const tinNhan = await ChatModel.guiTinNhan({ 
    CuocHoiThoaiID: cuocHoiThoaiID, 
    NguoiGuiID: userId, 
    NoiDung: sanitizedNoiDung 
  });
  // ...
});
```


### 4.6.4. Rate Limiting

**Phạm vi:** Áp dụng cho **Socket.IO chat messages**.

**Implementation:**

```9:35:server/socket/chatHandlers.js
// Rate limiting: Map để lưu số lượng tin nhắn của mỗi user
const userMessageCount = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
const MAX_MESSAGES_PER_MINUTE = 50;

/**
 * Reset message count sau mỗi phút
 */
setInterval(() => {
  userMessageCount.clear();
}, RATE_LIMIT_WINDOW);

/**
 * Kiểm tra rate limit
 */
function checkRateLimit(userId) {
  const count = userMessageCount.get(userId) || 0;
  if (count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }
  userMessageCount.set(userId, count + 1);
  return true;
}
```

**Sử dụng trong handler:**

```javascript
socket.on('send_message', async ({ cuocHoiThoaiID, noiDung }) => {
  if (!checkRateLimit(userId)) {
    return socket.emit('error', { 
      event: 'send_message', 
      message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút.' 
    });
  }
  // ... xử lý tin nhắn ...
});
```


### 4.6.5. Password Hashing

Hệ thống sử dụng MD5 để hash password:

1. **Login:** So sánh password với `MatKhauHash` trong database:

```33:34:server/controllers/authController.js
if (user.MatKhauHash !== password) return res.status(401).json({ error: 'Thông tin đăng nhập không đúng' });
```

2. **Register:** Hash password bằng MD5:

```61:61:server/controllers/authController.js
const matKhauHash = crypto.createHash('md5').update(String(password)).digest('hex');
```

Package `bcrypt` có trong `package.json`.

### 4.6.6. JWT Security

**Token Configuration:**
- **Expiration:** `7d` (7 ngày) - khá dài, có thể rút ngắn xuống 1-2 ngày cho production
- **Secret:** Lưu trong `JWT_SECRET` environment variable
- **Algorithm:** Mặc định HS256 (symmetric)

**Token Generation:**

```7:12:server/controllers/authController.js
const generateToken = (userId, vaiTroId) => {
  return jwt.sign(
    { userId, vaiTroId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' } // Token hết hạn sau 7 ngày
  );
};
```

**Token Validation trong `auth.js`:**

```42:49:server/middleware/auth.js
// Verify JWT token
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

// Kiểm tra người dùng có tồn tại trong database
const [userRows] = await db.execute(
  'SELECT NguoiDungID, TenDayDu, Email, VaiTroHoatDongID FROM nguoidung WHERE NguoiDungID = ? AND TrangThai = "HoatDong"',
  [decoded.userId]
);
```

**Error Handling:**

```177:185:server/middleware/auth.js
} catch (error) {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token đã hết hạn' });
  }
  res.status(500).json({ success: false, message: 'Lỗi server khi xác thực' });
}
```

**Mock Token cho Development:**
Hệ thống hỗ trợ mock token để thuận tiện development:

```28:40:server/middleware/auth.js
// Cho phép token mock cho môi trường development
const mockToken = process.env.MOCK_DEV_TOKEN || 'mock-token-for-development';
if (token === mockToken) {
  req.user = {
    id: parseInt(process.env.MOCK_USER_ID || '1', 10),
    tenDayDu: process.env.MOCK_USER_NAME || 'Chu Du An Dev',
    email: process.env.MOCK_USER_EMAIL || 'chu.du.an.dev@daphongtro.local',
    vaiTroId: parseInt(process.env.MOCK_ROLE_ID || '3', 10),
    vaiTro: process.env.MOCK_ROLE_NAME || 'ChuDuAn',
    isMockUser: true
  };
  return next();
}
```


### 4.6.7. Authorization & Role-based Access Control

Hệ thống có middleware phân quyền dựa trên vai trò trong `server/middleware/role.js`:

**Role Middleware:**

```13:87:server/middleware/role.js
const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    // Kiểm tra user đã authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng'
      });
    }

    // Lấy tất cả vai trò của người dùng từ database
    const [userRoles] = await db.execute(`
      SELECT vt.TenVaiTro, nvt.VaiTroID
      FROM nguoidung_vaitro nvt
      INNER JOIN vaitro vt ON nvt.VaiTroID = vt.VaiTroID
      WHERE nvt.NguoiDungID = ?
    `, [req.user.id]);

    // Chuẩn hóa tên vai trò (bỏ dấu, khoảng trắng)
    const normalizeRoleName = (name) => {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D');
    };

    // Kiểm tra quyền truy cập
    const normalizedUserRoles = userRoles.map(r => normalizeRoleName(r.TenVaiTro));
    const normalizedAllowedRoles = allowedRoles.map(r => normalizeRoleName(r).toLowerCase());
    const hasPermission = normalizedAllowedRoles.some(role => 
      normalizedUserRoles.map(r => r.toLowerCase()).includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Không có quyền truy cập. Yêu cầu vai trò: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
```

**Ownership Middleware:**
Kiểm tra quyền sở hữu tài nguyên (ví dụ: Chủ dự án chỉ có thể sửa tin đăng của chính mình):

```133:194:server/middleware/role.js
const ownershipMiddleware = (resourceType, idParam = 'id') => {
  return async (req, res, next) => {
    const resourceId = req.params[idParam];
    const userId = req.user.id;

    let query = '';
    let params = [];

    switch (resourceType) {
      case 'TinDang':
        query = `
          SELECT td.TinDangID 
          FROM tindang td
          INNER JOIN duan da ON td.DuAnID = da.DuAnID
          WHERE td.TinDangID = ? AND da.ChuDuAnID = ?
        `;
        params = [resourceId, userId];
        break;
      // ... các resource types khác
    }

    const [rows] = await db.execute(query, params);
    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập tài nguyên này'
      });
    }

    next();
  };
};
```

### 4.6.8. CORS Configuration

CORS được cấu hình động trong `server/index.js`:

```55:73:server/index.js
// ✅ CORS Configuration - Dynamic origin validation
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

// Helper function: Check if origin is allowed
const isOriginAllowed = (origin) => {
  // Allow localhost
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow any DevTunnel origin (*.devtunnels.ms)
  if (origin && origin.match(/^https:\/\/[a-z0-9]+-[0-9]+\.asse\.devtunnels\.ms$/)) {
    console.log('✅ DevTunnel origin allowed:', origin);
    return true;
  }
  
  return false;
};
```

### 4.6.9. Audit Logging

Hệ thống sử dụng `NhatKyHeThongService` để ghi log các hành động quan trọng:

| Biện pháp | Trạng thái | Ghi chú |
|:--- |:--- |:--- |
| **Audit Logging** | ✅ Đã triển khai | Sử dụng `NhatKyHeThongService` để ghi log các hành động quan trọng |

---

## 4.7. Module eKYC (Computer Vision + Face Matching)

### 4.7.1. Quy trình người dùng (UI/UX)

1. **Intro:** giải thích bước, chọn camera/upload.
2. **Chụp CCCD mặt trước:** auto crop tỷ lệ 1.586:1, highlight ROI.
3. **Chụp CCCD mặt sau:** tương tự mặt trước.
4. **Selfie:** gợi ý căn chỉnh gương mặt.
5. **Processing:** pipeline gồm warping, OCR, QR scan, face matching, risk scoring (hiện overlay status).
6. **Preview:** hiển thị dữ liệu trích xuất, cho phép chỉnh ROI (drag & resize overlay).
7. **Submit:** nén ảnh xuống 800px, gửi FormData kèm metadata.

UI sử dụng `framer-motion` cho transitions, `AnimatePresence` cho modal, và `FiUpload`/`FiCamera` icon để tạo cảm giác hiện đại.

### 4.7.2. Pipeline kỹ thuật

- **OCR & QR:** `OCRServiceV2.recognizeAll` warp perspective, trích xuất text theo ROI; `QRCodeService.scanFromImage` thử nhiều ROI fallback (top-right large/medium/small).
- **Face matching:** `FaceMatchingService.compareFaces` sử dụng face-api.js, distillation models preload khi component mount, fallback if face not detected.
- **Risk scoring:** `QRCodeService.mergeAndValidate` kết hợp OCR + QR + face distance để tính risk level (LOW/MEDIUM/HIGH).
- **Image resize:** `ImageResizeService.resizeForStorage` -> dataURL -> blob -> append formData.

### 4.7.3. Backend & lưu trữ

- Endpoint `POST /api/kyc` do `KycController.xacThucKYC` xử lý:
  - Validate thông tin bắt buộc (`soCCCD`, `tenDayDu`, `faceSimilarity`, ảnh).
  - Tính trạng thái tự động (>=0.85 => ThanhCong, <0.6 => ThatBai kèm lý do).
- `KycService.createVerification`:
  - Mở transaction.
  - Xóa ảnh cũ để giảm storage và tránh rò rỉ.
  - Ghi bảng `kyc_verification`.
  - Cập nhật `nguoidung` (Tên, Địa chỉ, SoCCCD, Ngày cấp, Trạng thái xác minh).
- Endpoint `GET /api/kyc/lich-su`: trả lịch sử xác thực cho user hiện tại.

Kết quả KYC phục vụ các use case nghiệp vụ (Ví dụ: Chủ dự án phải đạt “DaXacMinh” trước khi tạo dự án/tin đăng lớn).

---

## 4.8. Trợ lý cuộc hẹn & gợi ý phòng thay thế

### 4.8.1. Hành trình NVBH trên màn hình chi tiết cuộc hẹn

`ChiTietCuocHen.jsx` cung cấp:

- Thông tin khách hàng, chủ dự án, phòng, tin đăng, dự án (có badge trạng thái).
- Timeline hoạt động (“history log”).
- Action bar: Xác nhận, đổi lịch, báo cáo kết quả, gợi ý tin khác, huỷ.
- Map Leaflet hiển thị vị trí nếu cuộc hẹn có tọa độ.

Tính năng **Gợi ý tin đăng khác** bật khi cuộc hẹn ở trạng thái “Đã xác nhận” hoặc “Đang diễn ra”. Khi click:

1. `ModalGoiYPhongKhac` gọi API `POST /api/nhan-vien-ban-hang/goi-y/tim-kiem`.
2. Kết quả hiển thị card tin đăng, xem chi tiết qua `PreviewTinDangSheet`.
3. NVBH chọn phòng cụ thể và tạo QR bằng `ModalQRXemNgay`.

### 4.8.2. API trợ lý gợi ý

`GoiYTinDangController` triển khai đầy đủ các nghiệp vụ:

| API | Mô tả | Ghi chú |
|-----|-------|---------|
| `POST /tim-kiem` | Lọc tin theo khu vực phụ trách NVBH, giá, diện tích, tiện ích, loại trừ tin gốc | Tự động suy ra khu vực từ hồ sơ NVBH |
| `GET /khu-vuc` | Lấy danh sách khu vực con cho dropdown | Dựa trên `KhuVucPhuTrachID` |
| `GET /tin-dang/:id` | Chi tiết tin + danh sách phòng trống | Dùng cho preview sheet |
| `POST /tao-qr` | Tạo QR “Xem Ngay” | Kiểm tra phòng trống, lưu session vào `QRSessionStore`, trả `maQR` + countdown |
| `GET /api/public/xem-ngay/:maQR` | Endpoint public cho khách quét | Kiểm tra session, trả thông tin phòng, NVBH |
| `POST /api/public/xem-ngay/:maQR/phan-hoi` | Khách phản hồi (Thích/Không) | Gọi `ThongBaoService.thongBaoPhanHoiGoiY` |

### 4.8.3. Quản lý phiên QR & phản hồi

- Session cấu trúc gồm `maQR`, `nhanVienId`, `cuocHenId`, `tinDangId`, `phongId`, `trangThai`, `thongTinPhong`, `thongTinTinDang`, `thongTinNhanVien`, `hetHanLuc`.
- TTL mặc định 30 phút; cleanup interval 5 phút; fallback xóa session sau khi phản hồi > 1 giờ.
- Notification:
  - Khi khách “Xem ngay” hoặc “Thích/Không thích”, backend đẩy thông báo `phan_hoi_goi_y` đến NVBH, Notification Center chuyển hướng tới chat/chi tiết cuộc hẹn tương ứng.

---

## 4.9. Trung tâm thông báo & nhắc việc

### 4.9.1. Luồng Socket.IO

- Client emit `subscribe_notifications` ngay khi NotificationCenter hoặc VideoCallNotification mount.
- Server join room `notifications:{NguoiDungID}` và trả `subscribed_notifications`.
- Bất kỳ service nào gọi `ThongBaoService.guiThongBao` sẽ lưu DB và emit `notification:new` kèm payload JSON (type, data).
- Video call sử dụng cùng kênh này (`video_call_incoming`) để tận dụng notification pipeline.

Nguồn thông báo hiện có:

1. Quản lý cuộc hẹn: phân công mới, chờ phê duyệt, được duyệt, bị từ chối, khách huỷ, nhắc báo cáo kết quả.
2. Gợi ý phòng: phản hồi `Thich/KhongThich/XemNgay`.
3. Giao dịch: cọc mới, giao dịch từ QR.
4. Chat: tin nhắn mới, video call.
5. Cron: nhắc lịch, nhắc báo cáo (SLA).

### 4.9.2. Notification Center (UI + điều hướng)

- Component `NotificationCenter` tải dữ liệu qua REST (`layDanhSachThongBao`, `demThongBaoChuaDoc`) và đồng bộ realtime qua socket.
- Mỗi loại thông báo có icon khác nhau (`HiOutlineCalendar`, `HiOutlineChatBubbleLeftRight`, `HiOutlineVideoCamera`, `HiOutlineCurrencyDollar`…).
- Khi click, component tự đánh dấu đã đọc và điều hướng:
  - `cuoc_hen_*` → `/nhan-vien-ban-hang/cuoc-hen/:id`.
  - `tro_chuyen_moi` → `/nhan-vien-ban-hang/tin-nhan/:conversationId`.
  - `video_call` → mở room URL trong popup 1280x720.
  - `phan_hoi_goi_y` → tạo/mở chat với khách hoặc fallback sang chi tiết cuộc hẹn.
- `NotificationBadge` hiển thị số chưa đọc, header layout hiển thị icon chuông kèm badge.

### 4.9.3. Toast Notification & VideoCall pop-up

- `ToastNotification.jsx` nghe broadcast từ Notification Center để hiển thị toast nhanh.
- `VideoCallNotification.jsx` subcribe chung room, phát âm thanh lặp, auto reject sau 60 giây nếu NVBH không trả lời, gửi `answer_video_call` với `accepted` hoặc `missed`.

---

## 4.10. Video call + AI Translation (Signaling & Pipeline)

### 4.10.1. Signaling & quản lý cuộc gọi

| Bước | Thành phần | Mô tả |
|------|------------|-------|
| 1 | Chat UI | Chủ dự án hoặc NVBH nhấn “Gọi video” trong cuộc hội thoại |
| 2 | `socket/chatHandlers.js` | Handler `initiate_video_call` kiểm tra quyền, lấy danh sách thành viên, lưu `pendingVideoCalls`, emit `video_call_incoming` đến các NVBH (qua notification room) |
| 3 | `VideoCallNotification.jsx` | Hiển thị pop-up, đổ chuông, cung cấp nút Đồng ý/Từ chối |
| 4 | `answer_video_call` | Gửi kết quả về server. Nếu `accepted`, backend phát `video_call_answered`; nếu quá 60 giây mà không trả lời, pop-up tự gửi `missed=true` để lưu tin nhắn “Cuộc gọi nhỡ” |
| 5 | `roomUrl` | URL WebRTC gateway (MediaSoup/traefik) mở trong cửa sổ mới, sẵn sàng tap audio vào pipeline dịch |

### 4.10.2. Pipeline AI Translation (theo tài liệu VideoCall)

- **STT Service** (Sherpa-ONNX Zipformer 30M): WebSocket nhận PCM chunk 3s, inject hotwords (địa danh, thuật ngữ bất động sản), publish transcript qua Redis `stt-transcripts`.
- **Translation Service** (VinAI + CTranslate2): dual-layer cache (Redis 24h + file 7 ngày), custom dictionary 41 thuật ngữ, beam search size=4, latency P50 ~ 120ms.
- **TTS Service** (gTTS + Audio cache): TTL Redis 48h + file 7 ngày, plan migrate Piper ONNX.
- **WebRTC Gateway** (MediaSoup + PlainTransport): tap audio track, forward translated audio vào phòng, hiển thị caption realtime.

Các service ở trên đã được mô tả chi tiết trong `docs/VIDEOCALL_AI_TRANSLATION_COMPLETE.md` và dataset `scripts/baocao_data_full.py` (section 4.8). Signaling hiện tại đã sẵn sàng kết nối với pipeline này khi triển khai cluster self-hosted.

---

## 4.11. Tự động hoá & giám sát

| Hạng mục | Thành phần | Mục đích |
|----------|------------|----------|
| Cron nhắc việc | `jobs/appointmentReminders.js`, `jobs/appointmentReportReminders.js` | Nhắc NVBH xác nhận cuộc hẹn, gửi báo cáo kết quả đúng SLA |
| Đồng bộ giao dịch | `services/sepaySyncService.js` | Poll API SePay, cập nhật giao dịch offline, bắn thông báo |
| Logging chuẩn hoá | Console prefix `[Context]` | Dễ dàng grep log (`[KYC]`, `[Socket.IO]`, `[GoiYTinDangController]`…) |
| Scripts hỗ trợ | `scripts/*.py`, `.js` | Sinh báo cáo DOCX, khảo sát hệ thống, download model KYC, test pipeline |

---

## 4.12. Tổng kết

Chương 4 mới đã tái cấu trúc toàn bộ nội dung để:

1. **Phản ánh chính xác codebase hiện tại** (stack, kiến trúc, routes, services).
2. **Bổ sung các tính năng trọng yếu mới**: eKYC tối ưu (OCR/QR/Face), trợ lý gợi ý phòng + QR “Xem Ngay”, Notification Center realtime, video call với khả năng gắn pipeline dịch song ngữ.
3. **Giữ format DOCX gốc** với bảng, quy trình từng bước, và trích dẫn file mã nguồn cụ thể.

Tài liệu này có thể dùng trực tiếp cho báo cáo KLTN hoặc làm nguồn tham chiếu nội bộ khi training thành viên mới.

