# 💬 TÓM TẮT: TÍNH NĂNG TIN NHẮN CHO CHỦ DỰ ÁN

**Ngày:** 04/11/2025  
**Priority:** 🟢 NICE TO HAVE (sau khi hoàn thành Core Features)  
**Estimate:** 7 ngày  
**Dependencies:** Database, JWT Auth, Socket.IO  

---

## 📋 TỔNG QUAN

Tính năng tin nhắn real-time cho phép **Chủ Dự án** trao đổi trực tiếp với:
- **Khách hàng** (về tin đăng, cuộc hẹn)
- **Nhân viên bán hàng** (về cuộc hẹn, hợp đồng)

### Use Cases tham chiếu:
- **UC-PROJ-05:** Nhắn tin (ChuDuAn)
- **UC-CUST-07:** Nhắn tin (KhachHang)
- **UC-SALE-07:** Nhắn tin (NhanVienBanHang)

---

## 🏗️ KIẾN TRÚC

### Tech Stack

**Backend:**
- ✅ Socket.IO Server 4.x (real-time messaging)
- ✅ Express REST API (fallback + history)
- ✅ MySQL (persistent storage)
- ✅ JWT authentication
- ✅ Rate limiting (20 messages/minute)

**Frontend:**
- ✅ Socket.IO Client 4.x
- ✅ React 18 + Custom Hooks (useChat, useSocket)
- ✅ React Virtualized (lazy load 1000+ messages)
- ✅ Light Glass Morphism UI

### Database Schema (3 bảng)

```sql
cuochoithoai          -- Cuộc hội thoại
├── NguCanhID         -- Context ID (TinDangID, CuocHenID, HopDongID)
├── NguCanhLoai       -- Context type (TinDang, CuocHen, HopDong, General)
└── ThoiDiemTinNhanCuoi

thanhviencuochoithoai -- Thành viên
├── CuocHoiThoaiID
├── NguoiDungID
└── TinNhanCuoiDocLuc -- Cho unread badge

tinnhan               -- Tin nhắn
├── CuocHoiThoaiID
├── NguoiGuiID
├── NoiDung
└── ThoiGian
```

---

## 📅 ROADMAP (7 NGÀY)

### Phase 1: Backend Setup (2 ngày)

**Day 1: Database & Models**
- ✅ Migration SQL (`2025_11_04_create_chat_tables.sql`)
- ✅ ChatModel.js (CRUD methods)
- ✅ Testing queries

**Day 2: REST API & Socket.IO**
- ✅ ChatController.js (REST endpoints)
- ✅ chatRoutes.js
- ✅ Socket.IO server setup
- ✅ chatHandler.js (Socket events)
- ✅ presenceHandler.js (Online/Offline)
- ✅ Rate limiting

---

### Phase 2: Frontend Implementation (3 ngày)

**Day 3: Socket Client & Hooks**
- ✅ socketClient.js (Socket.IO singleton)
- ✅ chatApi.js (REST API calls)
- ✅ useChat.js (Chat state management)
- ✅ useSocket.js (Socket connection hook)

**Day 4-5: Chat UI Components**
- ✅ ChatBox.jsx (Main container)
- ✅ MessageList.jsx (Virtualized list)
- ✅ MessageItem.jsx (Message bubble)
- ✅ InputBox.jsx (Input + emoji)
- ✅ ConversationList.jsx (Inbox)
- ✅ ChatBadge.jsx (Unread count)
- ✅ Light Glass Morphism CSS

---

### Phase 3: Integration & Testing (2 ngày)

**Day 6: Integration**
- ✅ Tích hợp Chat button vào QuanLyTinDang
- ✅ Tích hợp Chat với Cuộc hẹn (QuanLyCuocHen)
- ✅ Badge số tin nhắn chưa đọc trong Navigation
- ✅ Socket authentication với JWT

**Day 7: Testing & Bug Fixes**
- ✅ E2E testing (10 scenarios)
- ✅ Security testing (XSS, Rate limit, Auth)
- ✅ Performance testing (1000+ messages)
- ✅ Bug fixes & documentation

---

## ✅ FEATURES MVP

### Core Features (7 ngày)

| Feature | Status |
|---------|--------|
| ✅ Real-time messaging (Socket.IO) | Planned |
| ✅ Message history (pagination) | Planned |
| ✅ Typing indicator | Planned |
| ✅ Unread badge | Planned |
| ✅ Mark as read | Planned |
| ✅ Online/Offline status | Planned |
| ✅ Rate limiting (20 msg/min) | Planned |
| ✅ XSS prevention | Planned |
| ✅ Offline fallback (REST API) | Planned |
| ✅ Reconnection handling | Planned |

### Future Enhancements (Phase 2 - Optional)

| Feature | Estimate |
|---------|----------|
| 📎 File attachments (ảnh, PDF) | 2 ngày |
| 😊 Emoji picker | 1 ngày |
| 👍 Message reactions | 1 ngày |
| 🔍 Search messages | 1 ngày |
| 👥 Group chat | 3 ngày |
| 📞 Voice/Video call (WebRTC) | 5 ngày |

---

## 🔒 SECURITY

### Authentication & Authorization
- ✅ JWT token validation (Socket.IO middleware)
- ✅ Member-only messaging (kiểm tra quyền truy cập)
- ✅ Ownership verification (chỉ xóa tin nhắn của mình)

### Input Validation
- ✅ Sanitize content (XSS prevention)
- ✅ Max length 5000 ký tự
- ✅ Không cho gửi tin nhắn rỗng

### Rate Limiting
- ✅ 20 tin nhắn / phút / user
- ✅ Chặn tạm thời khi vượt giới hạn

### Audit Logging
- ✅ Ghi nhận mọi hành động (gui_tin_nhan, xoa_tin_nhan)
- ✅ Lưu IP, User Agent, Thời gian

---

## 📊 PERFORMANCE

### Targets
- Message send latency: **< 100ms** (Socket.IO)
- Message load time (50 messages): **< 500ms**
- Typing indicator delay: **< 50ms**
- Reconnection time: **< 2s**
- Memory usage: **< 50MB** (1000 messages)

### Optimization
- ✅ React Virtualized (lazy load messages)
- ✅ Pagination (50 messages per page)
- ✅ Index database (CuocHoiThoaiID, ThoiGian)
- ✅ Socket.IO reconnection strategy
- ✅ Cleanup event listeners on unmount

---

## 📂 FILES CREATED

### Backend (8 files)
```
server/
├── models/ChatModel.js                      # NEW - 350 lines
├── controllers/ChatController.js            # NEW - 200 lines
├── routes/chatRoutes.js                     # NEW - 50 lines
├── socket/
│   ├── index.js                             # NEW - 80 lines
│   ├── handlers/
│   │   ├── chatHandler.js                   # NEW - 150 lines
│   │   └── presenceHandler.js               # NEW - 60 lines
│   └── middleware/
│       └── socketAuth.js                    # NEW - 30 lines
└── index.js                                 # UPDATE - Khởi tạo Socket.IO
```

### Frontend (10 files)
```
client/src/features/chat/
├── api/
│   ├── socketClient.js                      # NEW - 100 lines
│   └── chatApi.js                           # NEW - 120 lines
├── components/
│   ├── ChatBox.jsx                          # NEW - 200 lines
│   ├── ChatBox.css                          # NEW - 250 lines
│   ├── MessageList.jsx                      # NEW - 150 lines
│   ├── MessageItem.jsx                      # NEW - 100 lines
│   ├── InputBox.jsx                         # NEW - 120 lines
│   └── ConversationList.jsx                 # NEW - 180 lines
├── hooks/
│   ├── useChat.js                           # NEW - 150 lines
│   └── useSocket.js                         # NEW - 80 lines
└── types/
    └── chat.types.js                        # NEW - 50 lines
```

### Database & Docs (3 files)
```
migrations/
└── 2025_11_04_create_chat_tables.sql        # NEW - 180 lines

docs/
├── TIN_NHAN_CHU_DU_AN_IMPLEMENTATION_PLAN.md # NEW - 1500+ lines
└── TIN_NHAN_CHU_DU_AN_SUMMARY.md            # NEW - Tóm tắt này
```

**Tổng:** 21 files mới, 3500+ lines code

---

## 🧪 TESTING CHECKLIST

### Unit Tests (Backend)
- [ ] ChatModel.taoHoacLayCuocHoiThoai()
- [ ] ChatModel.guiTinNhan() - validation
- [ ] ChatModel.demTinNhanChuaDoc()
- [ ] Rate limiting logic

### Integration Tests
- [ ] REST API endpoints (7 endpoints)
- [ ] Socket.IO events (6 events)
- [ ] Database triggers (update_conversation_timestamp)

### E2E Tests (Frontend)
- [ ] Tạo cuộc hội thoại mới
- [ ] Gửi tin nhắn real-time
- [ ] Nhận tin nhắn real-time
- [ ] Typing indicator
- [ ] Mark as read
- [ ] Unread badge update
- [ ] Rate limiting (gửi 20+ tin nhắn/phút)
- [ ] Offline fallback (REST API)
- [ ] Reconnection sau disconnect
- [ ] Multiple tabs sync

### Security Tests
- [ ] XSS prevention
- [ ] Rate limiting enforcement
- [ ] JWT authentication (Socket.IO)
- [ ] Authorization (member-only)

### Performance Tests
- [ ] Load 1000+ messages (React Virtualized)
- [ ] Multiple chat boxes
- [ ] Memory leak detection
- [ ] Socket cleanup

---

## 📝 HƯỚNG DẪN TRIỂN KHAI

### Bước 1: Chạy Migration

```bash
# PowerShell
cd "d:\Vo Nguyen Hoanh Hop_J Liff\xampp\htdocs\daphongtro"

# Import migration
mysql -u root -p thue_tro < migrations/2025_11_04_create_chat_tables.sql
```

### Bước 2: Install Dependencies

```bash
# Backend
cd server
npm install socket.io

# Frontend
cd client
npm install socket.io-client react-virtualized
```

### Bước 3: Cấu hình Environment

```env
# .env
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

### Bước 4: Start Server

```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev
```

### Bước 5: Testing

```bash
# Mở trình duyệt
http://localhost:5173

# Login với 2 tài khoản khác nhau (2 tabs)
# Test chat real-time
```

---

## ⚠️ DEPENDENCIES & BLOCKERS

### Dependencies (phải hoàn thành trước)
1. ✅ JWT Authentication system (đã có)
2. ✅ User authentication middleware (đã có)
3. ✅ Database `nguoidung` table (đã có)
4. ❌ **Quản lý Cuộc hẹn** (UC-PROJ-02) - để chat về cuộc hẹn
5. ❌ **Dashboard real-time** - để hiển thị badge số tin nhắn

### Potential Blockers
- Chưa có chức năng **Quản lý Cuộc hẹn** → Tạm thời chat chỉ về Tin đăng
- Chưa có **WebSocket infrastructure** → Cần setup Socket.IO từ đầu
- Performance với nhiều user online → Cần Redis pub/sub (Phase 2)

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- ✅ Chủ dự án gửi tin nhắn cho khách hàng real-time
- ✅ Hiển thị typing indicator
- ✅ Đếm số tin nhắn chưa đọc
- ✅ Đánh dấu đã đọc tin nhắn
- ✅ Hiển thị online/offline status

### Non-Functional Requirements
- ✅ Message send latency < 100ms
- ✅ Support 100+ concurrent users
- ✅ Memory usage < 50MB per user
- ✅ No XSS vulnerabilities
- ✅ Rate limiting works (20 msg/min)

### User Experience
- ✅ UI đẹp, trực quan (Light Glass Morphism)
- ✅ Responsive mobile/desktop
- ✅ Smooth animations (typing, scroll)
- ✅ Clear error messages

---

## 📞 CONTACTS & SUPPORT

**Tài liệu tham khảo:**
- Implementation Plan: `docs/TIN_NHAN_CHU_DU_AN_IMPLEMENTATION_PLAN.md`
- Use Cases: `docs/use-cases-v1.2.md` (UC-PROJ-05)
- Database Schema: `migrations/2025_11_04_create_chat_tables.sql`
- Socket.IO Docs: https://socket.io/docs/v4/

**Development Team:**
- Backend: [Your Name]
- Frontend: [Your Name]
- Testing: [Your Name]

---

## ✅ CHECKLIST TRƯỚC KHI TRIỂN KHAI

### Backend
- [ ] Database migration chạy thành công
- [ ] ChatModel.js tests pass
- [ ] REST API endpoints test với Postman
- [ ] Socket.IO server khởi động không lỗi
- [ ] Rate limiting test với Postman

### Frontend
- [ ] Socket.IO client kết nối thành công
- [ ] ChatBox UI render đúng
- [ ] Message gửi/nhận real-time
- [ ] Unread badge update real-time
- [ ] Responsive mobile test

### Integration
- [ ] Chat button hiển thị trong QuanLyTinDang
- [ ] Navigation badge update real-time
- [ ] JWT authentication works
- [ ] Cross-tab synchronization works

### Security
- [ ] XSS prevention test
- [ ] Rate limiting enforcement test
- [ ] Authorization check (member-only)
- [ ] Audit logging verify

---

**KẾT LUẬN:** Tính năng tin nhắn real-time là một tính năng phức tạp nhưng rất quan trọng để tăng tính tương tác giữa Chủ Dự án và Khách hàng. Với roadmap 7 ngày này, chúng ta sẽ có MVP đầy đủ để triển khai production. Các tính năng nâng cao (file upload, emoji, video call) có thể triển khai sau ở Phase 2.

**Next Steps:** Sau khi hoàn thành Core Features (Quản lý Cuộc hẹn, Báo cáo Hợp đồng, Banned workflow), tiến hành triển khai tính năng tin nhắn theo roadmap này.


