require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const socketAuth = require('./middleware/socketAuth');
const setupChatHandlers = require('./socket/chatHandlers');
const setupGoiYHandlers = require('./socket/goiYHandlers');
const { setupNotificationHandlers } = require('./socket/notificationHandlers');
const { startAppointmentReminders } = require('./jobs/appointmentReminders');
const { startAppointmentReportReminders } = require('./jobs/appointmentReportReminders');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Routes từ local (Module Chủ dự án)
const chuDuAnRoutes = require('./routes/chuDuAnRoutes'); // API chính cho Chủ dự án
const chinhSachCocRoutes = require('./routes/chinhSachCocRoutes'); // API Chính sách Cọc
const operatorRoutes = require('./routes/operatorRoutes'); // API Operator/Admin (Banned dự án)
const geocodingRoutes = require('./routes/geocodingRoutes'); // Geocoding API
const chatRoutes = require('./routes/chatRoutes'); // API Chat/Messaging (UC-PROJ-05)
const hopDongCustomerRoutes = require('./routes/hopDongCustomerRoutes'); // API hợp đồng cho Khách hàng
const hopDongAdminRoutes = require('./routes/hopDongAdminRoutes'); // API hợp đồng cho Admin/Operator
const mauHopDongRoutes = require('./routes/mauHopDongRoutes'); // API đọc mẫu hợp đồng
const kycRoutes = require('./api/kyc/kycRoutes'); // API KYC (Xác thực CCCD)

// Routes cho Nhân viên Bán hàng (UC-SALE-01 đến UC-SALE-07)
const nhanVienBanHangRoutes = require('./routes/nhanVienBanHangRoutes');
const goiYTinDangRoutes = require('./routes/goiYTinDangRoutes'); // Gợi ý tin đăng (QR Xem Ngay)
const publicGoiYRoutes = require('./routes/publicGoiYRoutes'); // Public routes cho khách quét QR
const publicHopDongCocRoutes = require('./routes/publicHopDongCocRoutes'); // Public routes cho hợp đồng cọc qua QR

// Routes cho Nhân viên Điều hành
const nhanVienDieuHanhRoutes = require('./routes/nhanVienDieuHanhRoutes');

const nguoiPhuTrachDuAnRoutes = require('./routes/nguoiPhuTrachDuAnRoutes');
// Routes cho Operator (UC-OPER-01 đến UC-OPER-06)
const tinDangOperatorRoutes = require('./routes/tinDangOperatorRoutes'); // UC-OPER-01: Duyệt tin đăng
const duAnOperatorRoutes = require('./routes/duAnOperatorRoutes'); // UC-OPER-02: Quản lý dự án
const lichLamViecOperatorRoutes = require('./routes/lichLamViecOperatorRoutes'); // UC-OPER-03: Lịch NVBH
const cuocHenOperatorRoutes = require('./routes/cuocHenOperatorRoutes'); // UC-OPER-03: Gán cuộc hẹn
const hoSoNhanVienRoutes = require('./routes/hoSoNhanVienRoutes'); // UC-OPER-04&05: Quản lý NVBH
const bienBanBanGiaoRoutes = require('./routes/bienBanBanGiaoRoutes'); // UC-OPER-06: Biên bản bàn giao
const dashboardRoutes = require('./routes/dashboardRoutes'); // Dashboard API with real-time queries
const noiDungHeThongRoutes = require('./routes/noiDungHeThongRoutes'); // Quản lý Nội dung Hệ thống
const yeuCauRutTienRoutes = require('./routes/yeuCauRutTienRoutes'); // API Rút tiền
const chatBotRoutes = require('./routes/chatBotRoutes'); // API Chatbot AI

// Routes từ upstream
const viRoutes = require('./routes/viRoutes');
const tinDangRoutes = require('./routes/tinDangRoutes');
const khuVucRoutes = require('./routes/khuVucRoutes');
const locationRoutes = require('./routes/locationRoutes');
const addressRoutes = require('./routes/address.routes');
const yeuThichRoutes = require('./routes/yeuThichRoutes');
const sepayRoutes = require('./routes/sepayRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const sepayCallbackRoutes = require('./routes/sepayCallbackRoutes');
const cuocHenRoutes = require('./routes/cuocHenRoutes');
const publicDuAnRoutes = require('./routes/publicDuAnRoutes');
const publicTinDangRoutes = require('./routes/publicTinDangRoutes');
const publicBaiVietRoutes = require('./routes/publicBaiVietRoutes');
const sepaySync = require('./services/sepaySyncService');
const lichSuViRoutes = require('./routes/lichSuViRoutes');
const pushRoutes = require('./routes/pushRoutes'); // Push Notifications
const thongBaoRoutes = require('./routes/thongBaoRoutes');
// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Helper function: Check if origin is allowed
const isOriginAllowed = (origin) => {
  // Allow any localhost origin (any port) for development
  if (origin && origin.startsWith('http://localhost:')) return true;

  // Allow any DevTunnel origin (*.devtunnels.ms)
  if (origin && origin.match(/^https:\/\/[a-z0-9]+-[0-9]+\.asse\.devtunnels\.ms$/)) {
    console.log('✅ DevTunnel origin allowed:', origin);
    return true;
  }

  // Allow production CLIENT_URL from environment variable (e.g. Vercel domain)
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl && origin === clientUrl) {
    return true;
  }

  // Allow any *.vercel.app subdomain
  if (origin && origin.match(/^https:\/\/[a-z0-9-]+\.vercel\.app$/)) {
    return true;
  }

  return false;
};

// Setup Socket.IO with dynamic CORS (auto-detect DevTunnel)
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.log('⚠️ Socket.IO CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO Authentication & Event Handlers
io.use(socketAuth);
io.on('connection', (socket) => {
  setupChatHandlers(socket, io);
  setupGoiYHandlers(socket, io);
  setupNotificationHandlers(socket, io);
});

// Store io instance in app for use in controllers
app.set('io', io);

// Store io instance in utils for use in services
const { setIoInstance } = require('./utils/socketIo');
setIoInstance(io);

// Express CORS Options (sử dụng cùng logic với Socket.IO)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      callback(null, true); // Origin allowed
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
  preflightContinue: false
};

app.use(cors(corsOptions));

// ✅ Explicit preflight handler for all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút' }
});

app.use(globalLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Phục vụ file static cho uploads (để hiển thị ảnh)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Định nghĩa API
app.use('/api/users', userRoutes);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api', authRoutes);


// API từ local (Module Chủ dự án)
app.use('/api/chu-du-an', chuDuAnRoutes); // API nghiệp vụ chủ dự án theo đặc tả
app.use('/api/chu-du-an/chinh-sach-coc', chinhSachCocRoutes); // API Chính sách Cọc
app.use('/api/operator', operatorRoutes); // API Operator/Admin (UC-OPR-01, UC-OPR-02)
app.use('/api/geocode', geocodingRoutes); // Geocoding API (Nominatim)
app.use('/api/chat', chatRoutes); // API Chat/Messaging (UC-PROJ-05)
app.use('/api/kyc', kycRoutes); // API KYC (Xác thực CCCD)
app.use('/api/hop-dong', hopDongCustomerRoutes); // API hợp đồng phía Khách hàng
app.use('/api/admin', hopDongAdminRoutes); // API hợp đồng cho Admin/Operator
app.use('/api/mau-hop-dong', mauHopDongRoutes); // API preview mẫu hợp đồng

// API Operator (UC-OPER-01 đến UC-OPER-06)
app.use('/api/operator/tin-dang', tinDangOperatorRoutes); // UC-OPER-01: Duyệt tin đăng
app.use('/api/operator/du-an', duAnOperatorRoutes); // UC-OPER-02: Quản lý dự án
app.use('/api/operator/lich-lam-viec', lichLamViecOperatorRoutes); // UC-OPER-03: Lịch NVBH
app.use('/api/operator/cuoc-hen', cuocHenOperatorRoutes); // UC-OPER-03: Gán cuộc hẹn
app.use('/api/operator/nhan-vien', hoSoNhanVienRoutes); // UC-OPER-04&05: Quản lý NVBH
app.use('/api/operator/bien-ban', bienBanBanGiaoRoutes); // UC-OPER-06: Biên bản bàn giao
app.use('/api/operator/dashboard', dashboardRoutes); // Dashboard API with real-time queries
app.use('/api/operator/noi-dung-he-thong', noiDungHeThongRoutes); // Quản lý Nội dung Hệ thống
app.use('/api/rut-tien', yeuCauRutTienRoutes); // API Rút tiền
app.use('/api/chatbot', chatBotRoutes); // API Chatbot AI

// API Nhân viên Bán hàng (UC-SALE-01 đến UC-SALE-07)
app.use('/api/nhan-vien-ban-hang', nhanVienBanHangRoutes);
app.use('/api/nhan-vien-ban-hang/goi-y', goiYTinDangRoutes); // Gợi ý tin đăng (QR Xem Ngay)

// API Nhân viên Điều hành
app.use('/api/nhan-vien-dieu-hanh', nhanVienDieuHanhRoutes);

app.use('/api/nguoi-phu-trach-du-an', nguoiPhuTrachDuAnRoutes);
// API từ upstream
app.use('/api/tindangs', tinDangRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/khuvucs', khuVucRoutes);
app.use('/api/khuvuc-sync', require('./routes/khuVucSyncRoutes'));
app.use('/api/yeuthich', yeuThichRoutes);
app.use('/api/sepay', sepayRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/sepay', sepayCallbackRoutes);
app.use('/api/cuoc-hen', cuocHenRoutes);
app.use('/api/public/du-an', publicDuAnRoutes);
app.use('/api/public/tin-dang', publicTinDangRoutes);
app.use('/api/public/bai-viet', publicBaiVietRoutes);
app.use('/api/public/xem-ngay', publicGoiYRoutes); // Public routes cho khách quét QR xem phòng
app.use('/api/public/hop-dong-coc', publicHopDongCocRoutes); // Public routes cho hợp đồng cọc qua QR
app.use('/api/lich-su-vi', lichSuViRoutes);
app.use('/api/vi', viRoutes);
app.use('/api/push', pushRoutes); // Push Notifications API
app.use('/api/thong-bao', thongBaoRoutes);
app.get('/', (req, res) => {
  res.send('API server đang chạy - Module Chủ dự án + Upstream APIs');
});













const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('✅ Server chạy tại http://localhost:' + PORT);
  console.log('🔌 Socket.IO chạy tại ws://localhost:' + PORT);
  console.log('� JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded from .env' : '⚠️ Using fallback key');
  console.log('�📁 Static files: http://localhost:5000/uploads');
  console.log('🔗 API endpoints cho Chủ dự án (theo đặc tả use cases):');
  console.log('   📊 Dashboard: GET /api/chu-du-an/dashboard');
  console.log('   📝 Tin đăng:');
  console.log('       - GET  /api/chu-du-an/tin-dang (Danh sách)');
  console.log('       - POST /api/chu-du-an/tin-dang (Tạo mới)');
  console.log('       - GET  /api/chu-du-an/tin-dang/:id (Chi tiết)');
  console.log('       - PUT  /api/chu-du-an/tin-dang/:id (Cập nhật)');
  console.log('       - POST /api/chu-du-an/tin-dang/:id/gui-duyet (Gửi duyệt)');
  console.log('   📅 Cuộc hẹn:');
  console.log('       - GET  /api/chu-du-an/cuoc-hen (Danh sách)');
  console.log('       - POST /api/chu-du-an/cuoc-hen/:id/xac-nhan (Xác nhận)');
  console.log('   📈 Báo cáo: GET /api/chu-du-an/bao-cao-hieu-suat');
  console.log('   🏢 Dự án: GET /api/chu-du-an/du-an');
  console.log('   📋 Hợp đồng: POST /api/chu-du-an/hop-dong/bao-cao');
  console.log('   💬 Chat: GET/POST /api/chat/conversations (Real-time với Socket.IO)');
  console.log('   🗺️ Geocoding: POST /api/geocode (Địa chỉ → Tọa độ)');
  console.log('🔗 API endpoints từ upstream:');
  console.log('   📝 /api/tindangs, /api/khuvucs, /api/yeuthich');
  console.log('   💰 /api/sepay, /api/transactions');
  console.log('');
  console.log('📡 Socket.IO Events:');
  console.log('   - join_conversation, leave_conversation');
  console.log('   - send_message, typing_start, typing_stop');
  console.log('   - mark_as_read');

  // Khởi động job đồng bộ Sepay (sau 1 giây để server ổn định)
  setTimeout(() => {
    sepaySync.startPolling(60 * 1000); // Poll mỗi 60 giây
  }, 1000);

  // Khởi động cron jobs cho thông báo
  startAppointmentReminders();
  startAppointmentReportReminders();
});
