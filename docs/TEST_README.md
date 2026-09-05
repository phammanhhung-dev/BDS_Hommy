# 🧪 Hướng Dẫn Test - Chat Feature & UC-PROJ-04

## 📂 File Test Đã Tạo

```
daphongtro/
├── QUICK_START_TEST.md         ⭐ Bắt đầu từ đây! (5 phút setup)
├── TESTING_GUIDE.md            📚 Hướng dẫn chi tiết đầy đủ (100+ test cases)
├── test-setup.ps1              🤖 Script tự động cho Windows
├── TEST_README.md              📖 File này
│
├── server/tests/
│   ├── test-data.sql           💾 Test data cho hopboy553@gmail.com
│   ├── test-chat-quick.html    🌐 UI test tool cho Socket.IO
│   ├── test-api.sh             🔧 API test script (Linux/Mac/Git Bash)
│   └── test-chat-api.js        ✅ Automated test suite (Node.js)
│
└── migrations/
    ├── 2025_11_04_add_hopdong_filescan.sql    📄 Thêm FileScanPath
    └── 2025_11_04_update_chat_schema.sql      💬 Update chat schema
```

---

## ⚡ Quick Start (Chọn 1 trong 3 cách)

### 🚀 Cách 1: Tự Động (Windows - Dễ nhất!)

```powershell
# PowerShell
.\test-setup.ps1
```

Sau đó:
```bash
# Install packages
cd server && npm install socket.io isomorphic-dompurify multer
cd ../client && npm install socket.io-client

# Start servers
cd server && npm start        # Terminal 1
cd client && npm run dev      # Terminal 2
```

✅ **Login:** `hopboy553@gmail.com` / `123456`  
✅ **Navigate:** `/chu-du-an/tin-nhan`

---

### 📝 Cách 2: Manual Setup (5 phút)

Đọc file: **`QUICK_START_TEST.md`** ⭐

Tóm tắt:
1. Import test data: `mysql -u root -p thue_tro < server/tests/test-data.sql`
2. Run migrations (2 files trong `migrations/`)
3. Install packages (socket.io, socket.io-client)
4. Start servers
5. Login và test

---

### 🧪 Cách 3: Test Tool (UI)

**Nhanh nhất để test Socket.IO:**

1. Mở file: `server/tests/test-chat-quick.html` trong browser
2. Login vào app → Lấy token (F12 > Application > Local Storage)
3. Paste token → Click "Kết nối"
4. Test join conversation, gửi tin nhắn, typing indicator

**Screenshot:**
```
┌─────────────────────────────────────┐
│  🧪 Quick Chat Test - Socket.IO    │
├─────────────────────────────────────┤
│  1. Kết nối Socket.IO               │
│  [Token Input____________] [Connect]│
│  Status: ✅ Connected (abc123)      │
│                                     │
│  2. Tham gia Cuộc hội thoại         │
│  [Conversation ID: 201_] [Join]     │
│                                     │
│  3. Gửi Tin nhắn                    │
│  [Nhập tin nhắn...________]         │
│  [📤 Gửi] [⌨️ Typing] [⏸️ Stop]     │
│                                     │
│  📋 Log Console                     │
│  [10:30:45] ✅ Connected            │
│  [10:30:50] ✅ Joined conv 201      │
│  [10:31:00] 📩 New message: Hello   │
└─────────────────────────────────────┘
```

---

## 📚 Tài Liệu Test

### 1. QUICK_START_TEST.md ⭐
**Cho ai:** Người cần test nhanh  
**Thời gian:** 5 phút  
**Nội dung:**
- Setup từng bước
- Test UI
- Test real-time (2 users)
- Troubleshooting

### 2. TESTING_GUIDE.md 📚
**Cho ai:** QA, Testers, Developers  
**Thời gian:** 1-2 giờ  
**Nội dung:**
- 100+ test cases chi tiết
- REST API testing
- Socket.IO testing
- Security & Performance testing
- Edge cases
- Performance benchmarks

### 3. test-data.sql 💾
**Test data cho tài khoản:** `hopboy553@gmail.com`

**Bao gồm:**
- 3 khách hàng test (ID: 201-203)
- 4 conversations (ID: 201-204)
- ~60 tin nhắn mẫu thực tế
- Procedure tạo pagination test data

**Ngữ cảnh:**
- Conversation 201: Tư vấn về Tin Đăng (37 messages)
- Conversation 202: Cuộc Hẹn xem phòng (9 messages)
- Conversation 203: Bàn bạc Hợp Đồng (7 messages)
- Conversation 204: Hỗ trợ khách hàng (7 messages)

---

## 🎯 Test Checklist Nhanh

### Phase 1: Basic Setup ✅
- [ ] Import test-data.sql
- [ ] Run 2 migrations
- [ ] Install packages (socket.io, socket.io-client, multer)
- [ ] Create upload directories
- [ ] Start servers (backend + frontend)

### Phase 2: UI Testing ✅
- [ ] Login với `hopboy553@gmail.com`
- [ ] Navigate `/chu-du-an/tin-nhan`
- [ ] Thấy 4 conversations
- [ ] Click conversation → Xem tin nhắn
- [ ] Gửi tin nhắn mới

### Phase 3: Socket.IO Testing ✅
- [ ] Mở `test-chat-quick.html`
- [ ] Connect Socket.IO
- [ ] Join conversation
- [ ] Gửi tin nhắn
- [ ] Nhận tin nhắn real-time

### Phase 4: Real-time Testing ✅
- [ ] Mở 2 browsers (Chrome + Firefox)
- [ ] Login 2 users khác nhau
- [ ] Chat qua lại real-time
- [ ] Typing indicator hoạt động
- [ ] Unread count cập nhật

### Phase 5: Integration Testing ✅
- [ ] Navigate `/chu-du-an/cuoc-hen`
- [ ] Click button "Nhắn tin"
- [ ] Conversation mới được tạo
- [ ] Redirect đến chat page

### Phase 6: Upload File Testing ✅
- [ ] Navigate `/chu-du-an/phong`
- [ ] Tìm phòng "GiuCho"
- [ ] Click "Báo cáo hợp đồng"
- [ ] Upload file PDF/JPG
- [ ] Submit thành công

---

## 🛠️ Test Tools

### 1. test-chat-quick.html 🌐
**Browser UI tool cho Socket.IO testing**

**Features:**
- ✅ Connect/Disconnect Socket.IO
- ✅ Join/Leave conversation
- ✅ Send message
- ✅ Typing indicator
- ✅ Real-time log console
- ✅ Beautiful UI

**Cách dùng:**
```bash
# Windows
start server/tests/test-chat-quick.html

# Mac/Linux
open server/tests/test-chat-quick.html
```

### 2. test-api.sh 🔧
**Bash script for REST API testing**

**Features:**
- ✅ Create conversation
- ✅ Get conversations list
- ✅ Send message (REST)
- ✅ Get message history
- ✅ Mark as read
- ✅ XSS prevention check

**Cách dùng:**
```bash
# Linux/Mac/Git Bash
./server/tests/test-api.sh YOUR_JWT_TOKEN
```

### 3. test-chat-api.js ✅
**Node.js automated test suite**

**Features:**
- ✅ 12 test cases
- ✅ REST API + Socket.IO
- ✅ Auth testing
- ✅ CRUD operations
- ✅ Real-time events

**Cách dùng:**
```bash
cd server/tests
node test-chat-api.js
```

---

## 👤 Tài Khoản Test

| Email | Password | Vai Trò | ID |
|-------|----------|---------|-----|
| hopboy553@gmail.com | 123456 | Chủ Dự Án | 6 |
| khachhang1.test@test.com | 123456 | Khách Hàng | 201 |
| khachhang2.test@test.com | 123456 | Khách Hàng | 202 |
| khachhang3.test@test.com | 123456 | Khách Hàng | 203 |

---

## 🐛 Common Issues

### Issue: Socket.IO không connect
```
✅ Check: Backend server đang chạy?
✅ Check: Token valid? (F12 > Console)
✅ Fix: Logout → Login lại
```

### Issue: Không thấy conversations
```
✅ Check: Test data đã import? (SELECT * FROM cuochoithoai WHERE CuocHoiThoaiID >= 201)
✅ Fix: Re-run test-data.sql
```

### Issue: Messages không real-time
```
✅ Check: Socket connected? (Console log)
✅ Check: Joined conversation? (Emit join_conversation)
✅ Fix: Reload page, reconnect socket
```

### Issue: Upload file fail
```
✅ Check: Directory exists? (public/uploads/temp)
✅ Check: File size < 10MB?
✅ Check: File type PDF/JPG/PNG?
✅ Fix: Run test-setup.ps1 để tạo directories
```

---

## 📊 Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response | < 100ms | < 300ms |
| Socket Latency | < 50ms | < 150ms |
| Page Load | < 500ms | < 1s |
| Upload 5MB | < 2s | < 5s |
| 100 messages | < 50ms | < 200ms |

---

## 🎉 Success Criteria

Test thành công khi:

✅ **Backend:**
- [ ] Socket.IO server chạy tại ws://mt5vhvtq-5000.asse.devtunnels.ms/
- [ ] Chat API endpoints hoạt động
- [ ] Database có test data (4 conversations, ~60 messages)
- [ ] Migrations đã chạy thành công

✅ **Frontend:**
- [ ] ConversationList hiển thị 4 conversations
- [ ] Messages load nhanh (< 500ms)
- [ ] Gửi tin nhắn thành công
- [ ] Real-time updates hoạt động

✅ **Real-time:**
- [ ] Socket.IO connection stable
- [ ] 2 users chat real-time không lag
- [ ] Typing indicator hoạt động
- [ ] Unread count tự động update

✅ **Security:**
- [ ] XSS prevention (script tags bị sanitize)
- [ ] Rate limiting (10 msg/min)
- [ ] JWT authentication
- [ ] Authorization checks

---

## 📞 Support

**Gặp vấn đề?**

1. Đọc **TESTING_GUIDE.md** phần Troubleshooting
2. Check console logs (F12 > Console)
3. Check server logs (Terminal backend)
4. Verify test data: `SELECT COUNT(*) FROM cuochoithoai WHERE CuocHoiThoaiID >= 201;`

---

## 🚀 Next Steps

Sau khi test xong:

1. ✅ Review code quality
2. ✅ Test security vulnerabilities
3. ✅ Performance optimization
4. ✅ Mobile responsive testing
5. ✅ Deploy to staging
6. ✅ E2E testing với production data
7. ✅ Load testing (1000+ concurrent users)

---

**Happy Testing! 🎉**

_Last updated: 2025-11-04_


