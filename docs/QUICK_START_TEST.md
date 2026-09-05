# 🚀 Quick Start - Test Messaging Feature

## Hướng dẫn test nhanh cho tài khoản `hopboy553@gmail.com`

---

## ⚡ 5 Phút Setup & Test

### Bước 1: Import Test Data (30 giây)
```bash
# Mở XAMPP MySQL (hoặc MySQL Workbench)
# Chạy file test-data.sql

mysql -u root -p thue_tro < server/tests/test-data.sql
```

**Hoặc qua phpMyAdmin:**
1. Vào http://localhost/phpmyadmin
2. Chọn database `thue_tro`
3. Tab "SQL" > Paste nội dung file `server/tests/test-data.sql`
4. Click "Go"

✅ **Kết quả:** Tạo được:
- 3 khách hàng test
- 4 cuộc hội thoại
- ~60 tin nhắn test

---

### Bước 2: Chạy Migrations (1 phút)
```bash
# Migration 1: Thêm FileScanPath cho hợp đồng
mysql -u root -p thue_tro < migrations/2025_11_04_add_hopdong_filescan.sql

# Migration 2: Update chat schema
mysql -u root -p thue_tro < migrations/2025_11_04_update_chat_schema.sql
```

**Verify:**
```sql
-- Kiểm tra cột FileScanPath
DESCRIBE hopdong;

-- Kiểm tra trigger
SHOW TRIGGERS LIKE 'tinnhan';
```

---

### Bước 3: Install Packages (30 giây)
```bash
# Backend
cd server
npm install socket.io isomorphic-dompurify multer

# Frontend  
cd ../client
npm install socket.io-client
```

---

### Bước 4: Start Servers (30 giây)
```bash
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend (tab mới)
cd client
npm run dev
```

**Kiểm tra console Backend:**
```
✅ Server chạy tại http://localhost:5000
🔌 Socket.IO chạy tại ws://mt5vhvtq-5000.asse.devtunnels.ms/
💬 Chat API: /api/chat/conversations
```

---

### Bước 5: Test trên UI (2 phút)

#### 5.1. Login
1. Mở http://localhost:3000/login
2. Email: `hopboy553@gmail.com`
3. Password: `123456`
4. Click "Đăng nhập"

#### 5.2. Xem Tin Nhắn
1. Navigate đến `/chu-du-an/tin-nhan`
2. **Bạn sẽ thấy 4 cuộc hội thoại:**
   - 📱 **Tin đăng: Phòng trọ giá rẻ** (với Nguyễn Văn A)
   - 📅 **Cuộc hẹn xem phòng #1** (với Trần Thị B)
   - 📝 **Hợp đồng thuê #1** (với Nguyễn Văn A)
   - 💬 **Nhà Trọ Hoành Hợp - Hỗ trợ tư vấn** (với Lê Văn C)

3. Click vào bất kỳ conversation nào → Xem tin nhắn

#### 5.3. Test Gửi Tin Nhắn
1. Mở conversation bất kỳ
2. Gõ tin nhắn vào ô input
3. Press `Ctrl+Enter` hoặc click nút "Gửi"
4. ✅ Tin nhắn xuất hiện ngay lập tức

---

## 🧪 Test Real-time (Socket.IO)

### Option 1: Dùng HTML Test Tool (Dễ nhất!)

1. **Mở file test:**
```bash
# Double-click hoặc
start server/tests/test-chat-quick.html
# Mac/Linux:
open server/tests/test-chat-quick.html
```

2. **Lấy JWT Token:**
   - Mở Developer Tools (F12)
   - Tab "Application" > "Local Storage" > http://localhost:3000
   - Copy giá trị của key `token`

3. **Test:**
   - Paste token vào form
   - Click "Kết nối" → Nhìn thấy "Connected ✅"
   - Nhập Conversation ID: `201`
   - Click "Join" → "Joined conversation ✅"
   - Gõ tin nhắn → Click "Gửi tin nhắn"
   - ✅ Tin nhắn xuất hiện ngay

### Option 2: Dùng Browser Console

```javascript
// Mở Console (F12) tại trang chat
const token = localStorage.getItem('token');

const socket = io('http://localhost:5000', {
  auth: { token }
});

socket.on('connect', () => console.log('✅ Connected:', socket.id));

// Join conversation
socket.emit('join_conversation', { cuocHoiThoaiID: 201 });

// Gửi tin nhắn
socket.emit('send_message', {
  cuocHoiThoaiID: 201,
  noiDung: 'Hello from console!'
});

// Nhận tin nhắn mới
socket.on('new_message', (msg) => {
  console.log('📩 New:', msg.NoiDung);
});
```

---

## 🔥 Test 2 Users Real-time

### Setup:
1. **Browser 1 (Chrome):** Login với `hopboy553@gmail.com`
2. **Browser 2 (Firefox/Incognito):** Login với `khachhang1.test@test.com` (password: `123456`)

### Test Steps:

**Browser 1 (Chủ Dự Án):**
```
1. Vào /chu-du-an/tin-nhan
2. Mở conversation "Tin đăng: Phòng trọ giá rẻ"
3. Gõ tin nhắn: "Chào em, phòng vẫn còn trống nhé!"
4. Gửi (Ctrl+Enter)
```

**Browser 2 (Khách Hàng):**
```
1. Vào /tin-nhan (hoặc trang chat của khách hàng)
2. Mở cùng conversation
3. ✅ Tin nhắn của Chủ Dự Án xuất hiện NGAY LẬP TỨC
4. Gõ reply: "Vâng em cảm ơn anh!"
```

**Browser 1:**
```
✅ Reply của khách hàng xuất hiện NGAY LẬP TỨC (không cần refresh)
✅ Typing indicator hiển thị "Đang gõ..." khi khách hàng gõ
✅ Unread count tự động cập nhật
```

---

## 🎯 Test Checklist

### Chat UI ✅
- [ ] ConversationList hiển thị 4 conversations
- [ ] Unread badges (số tin chưa đọc)
- [ ] Click conversation → Navigate đến detail page
- [ ] Messages hiển thị đúng (own vs other)
- [ ] Time formatting đẹp ("5 phút trước", "1 giờ trước")
- [ ] Avatar/placeholder hiển thị

### Gửi/Nhận Tin Nhắn ✅
- [ ] Gõ tin nhắn → Textarea auto-resize
- [ ] Press Ctrl+Enter → Gửi thành công
- [ ] Tin nhắn xuất hiện ngay trong list
- [ ] Auto-scroll to bottom
- [ ] Disabled state khi socket offline

### Real-time Features ✅
- [ ] Socket.IO connected (check console)
- [ ] Mở 2 tabs → Gửi tin ở tab 1 → Tab 2 nhận ngay
- [ ] Typing indicator ("Đang gõ...")
- [ ] Online/Offline status
- [ ] Unread count tự động update

### Button "Nhắn tin" ✅
- [ ] Vào `/chu-du-an/cuoc-hen`
- [ ] Click button "Nhắn tin" ở cuộc hẹn bất kỳ
- [ ] Conversation mới được tạo (hoặc lấy existing)
- [ ] Navigate đến chat page
- [ ] Title hiển thị đúng: "Cuộc hẹn #X - Tên phòng"

### Upload File Scan Hợp Đồng ✅
- [ ] Vào `/chu-du-an/phong`
- [ ] Tìm phòng "GiuCho" → Click "Báo cáo hợp đồng"
- [ ] Điền form đầy đủ
- [ ] Click vùng upload → Chọn file PDF/JPG
- [ ] File preview hiển thị
- [ ] Submit → Success message
- [ ] File lưu vào `public/uploads/hop-dong/{id}/`

---

## 🐛 Troubleshooting

### Issue: Socket.IO không connect

**Check:**
```javascript
// Browser console
console.log(localStorage.getItem('token')); // Có token?
```

**Fix:**
- Logout → Login lại để lấy token mới
- Check backend console: `🔌 Socket.IO chạy tại ws://mt5vhvtq-5000.asse.devtunnels.ms/`

### Issue: Không thấy conversations

**Check database:**
```sql
SELECT * FROM cuochoithoai WHERE CuocHoiThoaiID >= 201;
SELECT * FROM thanhviencuochoithoai WHERE CuocHoiThoaiID >= 201;
```

**Fix:**
- Re-run `test-data.sql`

### Issue: Messages không real-time

**Check:**
1. ✅ Socket connected? → Check browser console
2. ✅ User joined conversation? → Emit `join_conversation`
3. ✅ Đúng Conversation ID?

**Fix:**
- F12 → Console → Xem logs
- Re-join conversation: `socket.emit('join_conversation', {cuocHoiThoaiID: 201})`

---

## 📊 Test Data Overview

### Tài khoản đã tạo:

| Email | Password | Vai trò | NguoiDungID |
|-------|----------|---------|-------------|
| hopboy553@gmail.com | 123456 | Chủ Dự Án | 6 |
| khachhang1.test@test.com | 123456 | Khách Hàng | 201 |
| khachhang2.test@test.com | 123456 | Khách Hàng | 202 |
| khachhang3.test@test.com | 123456 | Khách Hàng | 203 |

### Conversations:

| ID | Loại | Tiêu đề | Tin nhắn |
|----|------|---------|----------|
| 201 | TinDang | Phòng trọ giá rẻ cho nữ thuê | ~37 |
| 202 | CuocHen | Cuộc hẹn xem phòng #1 | 9 |
| 203 | HopDong | Hợp đồng thuê #1 | 7 |
| 204 | TinDang | Nhà Trọ Hoành Hợp | 7 |

---

## 🎉 Kết Luận

Sau 5 phút setup, bạn đã có:
- ✅ 4 cuộc hội thoại đầy đủ ngữ cảnh
- ✅ ~60 tin nhắn mẫu thực tế
- ✅ Socket.IO real-time hoạt động
- ✅ UI components đầy đủ
- ✅ Upload file scan hợp đồng

**Next steps:**
- Test security (XSS, rate limiting)
- Test performance (100+ messages)
- Test mobile responsive
- Deploy to staging/production

**Happy Testing! 🚀**

---

## 📝 Notes

- Test data sử dụng ID >= 201 để tránh conflict với production data
- Passwords đều là `123456` (hash MD5: `e10adc3949ba59abbe56e057f20f883e`)
- Có script cleanup để xóa test data (xem cuối file `test-data.sql`)
- Socket.IO events được log ra console, check F12 để debug


