# Ghi chú triển khai - Messaging Feature

## Packages cần cài đặt

Trước khi chạy server, cần cài đặt các dependencies sau:

```bash
cd server
npm install socket.io isomorphic-dompurify
```

### Socket.IO
- **Package**: `socket.io@^4.6.0`
- **Mục đích**: Real-time communication cho messaging feature
- **File sử dụng**: 
  - `server/index.js` - Setup Socket.IO server
  - `server/socket/chatHandlers.js` - Event handlers
  - `server/middleware/socketAuth.js` - JWT authentication

### isomorphic-dompurify
- **Package**: `isomorphic-dompurify@^2.3.0`
- **Mục đích**: XSS prevention - sanitize tin nhắn trước khi lưu DB
- **File sử dụng**:
  - `server/controllers/ChatController.js` - REST API sanitization
  - `server/socket/chatHandlers.js` - Socket.IO sanitization

## Migrations cần chạy

### 1. Thêm FileScanPath cho bảng hopdong
```bash
mysql -u root -p thue_tro < migrations/2025_11_04_add_hopdong_filescan.sql
```

### 2. Cập nhật schema cho Chat
```bash
mysql -u root -p thue_tro < migrations/2025_11_04_update_chat_schema.sql
```

**Lưu ý**: Nếu gặp lỗi PRIMARY KEY hoặc FOREIGN KEY đã tồn tại, comment lại các câu lệnh tương ứng trong migration script.

## Environment Variables

Đảm bảo file `.env` có các biến sau:

```env
PORT=5000
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=thue_tro
```

## Kiểm tra sau khi cài đặt

1. **Backend server khởi động thành công**:
   ```bash
   cd server
   npm start
   ```
   
   Expected output:
   ```
   ✅ Server chạy tại http://localhost:5000
   🔌 Socket.IO chạy tại ws://mt5vhvtq-5000.asse.devtunnels.ms/
   💬 Chat: GET/POST /api/chat/conversations (Real-time với Socket.IO)
   ```

2. **REST API hoạt động**:
   ```bash
   curl -X GET http://localhost:5000/api/chat/conversations \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Socket.IO connection test** (dùng browser console):
   ```javascript
   const socket = io('http://localhost:5000', {
     auth: { token: 'YOUR_JWT_TOKEN' }
   });
   
   socket.on('connect', () => console.log('Connected!'));
   socket.on('error', (err) => console.error('Error:', err));
   ```

## Files đã tạo/sửa đổi

### Backend
- ✅ `migrations/2025_11_04_add_hopdong_filescan.sql` - Migration thêm FileScanPath
- ✅ `migrations/2025_11_04_update_chat_schema.sql` - Migration update chat schema
- ✅ `server/models/HopDongModel.js` - Thêm upload file scan support
- ✅ `server/models/ChatModel.js` - Chat data access layer
- ✅ `server/controllers/HopDongController.js` - Upload file scan endpoint
- ✅ `server/controllers/ChatController.js` - Chat REST API
- ✅ `server/routes/hopDongRoutes.js` - Thêm upload route
- ✅ `server/routes/chatRoutes.js` - Chat routes
- ✅ `server/middleware/socketAuth.js` - Socket.IO JWT auth
- ✅ `server/socket/chatHandlers.js` - Socket.IO event handlers
- ✅ `server/index.js` - Setup Socket.IO server, register chat routes

### Frontend
- ✅ `client/src/services/HopDongService.js` - Thêm uploadFileScanHopDong
- ✅ `client/src/components/ChuDuAn/ModalBaoCaoHopDong.jsx` - Thêm file upload UI
- ✅ `client/src/components/ChuDuAn/ModalBaoCaoHopDong.css` - Thêm file upload styles

### Cần tiếp tục implement (Frontend)
- ⏳ `client/src/hooks/useSocket.js` - Socket.IO client hook
- ⏳ `client/src/hooks/useChat.js` - Chat logic hook
- ⏳ `client/src/context/ChatContext.jsx` - Global chat state
- ⏳ `client/src/components/Chat/ChatWindow.jsx` - Main chat UI
- ⏳ `client/src/components/Chat/MessageList.jsx` - Message list with virtualization
- ⏳ `client/src/components/Chat/MessageInput.jsx` - Message input component
- ⏳ `client/src/components/Chat/ConversationList.jsx` - Conversation sidebar

## Security Checklist

- ✅ JWT authentication cho Socket.IO handshake
- ✅ Rate limiting: 10 tin nhắn/phút (socketAuth.js)
- ✅ XSS prevention: DOMPurify sanitize (ChatController, chatHandlers)
- ✅ Authorization: Kiểm tra membership trước khi truy cập
- ✅ Audit log: Ghi nhận mọi hành động chat
- ✅ Soft delete: Tin nhắn không bị xóa vĩnh viễn

## Performance Optimization

- ✅ Database indexes:
  - `idx_cuochoithoai_ngucanh`
  - `idx_tinnhan_cuochoithoai`
  - `idx_thanhvien_nguoidung`
- ✅ Pagination: 50 tin nhắn/lần load
- ⏳ React Virtualized cho MessageList (frontend pending)

## Troubleshooting

### Socket.IO không connect được
1. Kiểm tra `CLIENT_URL` trong `.env`
2. Kiểm tra CORS settings trong `server/index.js`
3. Verify JWT token format: `{ auth: { token: 'xxx' } }`

### Rate limit quá chặt
- Điều chỉnh constants trong `server/socket/chatHandlers.js`:
  ```javascript
  const MAX_MESSAGES_PER_MINUTE = 10; // Tăng số này
  ```

### XSS sanitization fail
- Nếu `isomorphic-dompurify` chưa cài, fallback sẽ dùng basic sanitization
- Cài đặt package để có protection tốt hơn

## Next Steps

1. ✅ Complete frontend implementation (hooks + UI components)
2. ✅ Integration testing
3. ✅ E2E testing với real user scenarios
4. ✅ Performance testing với 1000+ messages
5. ✅ Documentation updates


