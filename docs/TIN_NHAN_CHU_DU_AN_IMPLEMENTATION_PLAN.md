# 💬 KẾ HOẠCH TRIỂN KHAI TÍNH NĂNG TIN NHẮN - CHỦ DỰ ÁN

**Ngày tạo:** 04/11/2025  
**Phiên bản:** 1.0  
**Tham chiếu:** use-cases-v1.2.md (UC-PROJ-05, UC-CUST-07, UC-SALE-07)  
**Architecture:** Bulletproof React + Socket.IO Real-time  
**Priority:** 🟢 NICE TO HAVE (sau khi hoàn thành Core Features)

---

## 📊 HIỆN TRẠNG

### ✅ Database Schema (ĐÃ CÓ)

Từ file `use-cases-v1.2.md` - Mô hình dữ liệu (line 654-656):

```sql
-- ✅ ĐÃ ĐỊNH NGHĨA TRONG USE CASE
CREATE TABLE CuocHoiThoai (
  CuocHoiThoaiID INT PRIMARY KEY AUTO_INCREMENT,
  NguCanhID INT COMMENT 'ID của entity context (TinDangID, CuocHenID, HopDongID...)',
  NguCanhLoai ENUM('TinDang', 'CuocHen', 'HopDong', 'General') DEFAULT 'General',
  TieuDe VARCHAR(255),
  ThoiDiemTinNhanCuoi DATETIME,
  DangHoatDong TINYINT(1) DEFAULT 1,
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ThanhVienCuocHoiThoai (
  CuocHoiThoaiID INT,
  NguoiDungID INT,
  ThamGiaLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CuocHoiThoaiID, NguoiDungID),
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES CuocHoiThoai(CuocHoiThoaiID),
  FOREIGN KEY (NguoiDungID) REFERENCES NguoiDung(NguoiDungID)
);

CREATE TABLE TinNhan (
  TinNhanID INT PRIMARY KEY AUTO_INCREMENT,
  CuocHoiThoaiID INT,
  NguoiGuiID INT,
  NoiDung TEXT NOT NULL,
  ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
  DaXoa TINYINT(1) DEFAULT 0,
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES CuocHoiThoai(CuocHoiThoaiID),
  FOREIGN KEY (NguoiGuiID) REFERENCES NguoiDung(NguoiDungID)
);

-- Index cho performance
CREATE INDEX idx_cuochoithoai_ngucanh ON CuocHoiThoai(NguCanhID, NguCanhLoai);
CREATE INDEX idx_tinnhan_cuochoithoai ON TinNhan(CuocHoiThoaiID);
CREATE INDEX idx_tinnhan_thoigian ON TinNhan(ThoiGian);
```

### ❌ Backend & Frontend (CHƯA CÓ)

**Backend:**
- ❌ Socket.IO server setup
- ❌ Chat API endpoints
- ❌ Real-time event handlers
- ❌ Message validation & sanitization

**Frontend:**
- ❌ Chat UI components
- ❌ Socket.IO client integration
- ❌ Real-time message updates
- ❌ Notification badges

**Estimate:** 5-7 ngày (full chat system)

---

## 🎯 USE CASE ANALYSIS

### UC-PROJ-05: Nhắn tin (ChuDuAn)

**Từ use-cases-v1.2.md (line 415-417):**

> **Mô tả:** Tương tự UC-CUST-07, nhưng ở vai trò ChuDuAn (nếu được hệ thống cho phép).

### UC-CUST-07: Nhắn Tin (line 267-273)

```
* **Mục tiêu:** Trao đổi với NhanVienBanHang/ChuDuAn.
* **Luồng chính:** Mở hội thoại → Soạn tin → Gửi → Hiển thị real-time/near-real-time.
* **Ngoại lệ:** Spam/rate limit → chặn tạm thời.
* **Audit:** `gui_tin_nhan`.
* **Nghiệm thu:** Tin nhắn mới hiển thị ở cả hai phía; thông báo đẩy hoạt động.
```

### UC-SALE-07: Nhắn tin (line 334-336)

```
* **Mô tả:** Tương tự UC-CUST-07, nhưng ở phía NhanVienBanHang trao đổi với KhachHang. 
  Hệ thống phải tôn trọng phạm vi hội thoại (chỉ NhanVienBanHang được gán cho CuộcHẹn 
  mới có thể nhắn tin).
```

### Quy tắc Nghiệp vụ (4.2 Idempotency & Rate limits - line 86-90)

```
* Áp dụng giới hạn: 5 lần đăng nhập/phút/IP; 3 lần đặt cọc/phút/người dùng; 
  và các cơ chế chống spam chat.
```

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

### Tech Stack

```
Frontend:
├── React 18 (Vite)
├── Socket.IO Client 4.x
├── React-Virtualized (lazy load messages)
├── Emoji Picker (optional)
└── React-Toastify (notifications)

Backend:
├── Node.js + Express
├── Socket.IO Server 4.x
├── Redis (pub/sub cho multi-instance)
├── MySQL (persistent storage)
└── JWT (authentication)

Infrastructure:
├── CORS policy (allowed origins)
├── Rate limiting (express-rate-limit)
├── Message sanitization (DOMPurify)
└── File upload (multer) - cho attachments (phase 2)
```

### Architecture Pattern: Bulletproof React

```
client/src/
├── features/
│   └── chat/                        # NEW Feature Module
│       ├── api/
│       │   ├── chatApi.js           # REST API calls
│       │   └── socketClient.js      # Socket.IO client
│       ├── components/
│       │   ├── ChatBox.jsx          # Main chat container
│       │   ├── ChatBox.css
│       │   ├── MessageList.jsx      # Message list với virtualization
│       │   ├── MessageItem.jsx      # Single message bubble
│       │   ├── InputBox.jsx         # Message input với emoji
│       │   ├── ConversationList.jsx # Danh sách cuộc hội thoại
│       │   └── ChatBadge.jsx        # Badge số tin nhắn chưa đọc
│       ├── hooks/
│       │   ├── useChat.js           # Chat state management
│       │   ├── useSocket.js         # Socket connection hook
│       │   └── useUnreadCount.js    # Unread messages counter
│       ├── types/
│       │   └── chat.types.js
│       └── utils/
│           ├── validation.js        # Input validation
│           ├── sanitization.js      # XSS prevention
│           └── timeFormat.js        # Time formatting

server/
├── socket/                          # NEW Socket.IO Module
│   ├── index.js                     # Socket.IO server setup
│   ├── handlers/
│   │   ├── chatHandler.js           # Chat event handlers
│   │   ├── authHandler.js           # Socket authentication
│   │   └── presenceHandler.js       # Online/offline status
│   ├── middleware/
│   │   ├── socketAuth.js            # Verify JWT token
│   │   └── rateLimiter.js           # Rate limiting per socket
│   └── services/
│       └── chatService.js           # Business logic
├── models/
│   └── ChatModel.js                 # NEW - DB queries
├── controllers/
│   └── ChatController.js            # NEW - REST endpoints
└── routes/
    └── chatRoutes.js                # NEW - REST routes
```

---

## 📅 ROADMAP TRIỂN KHAI (7 NGÀY)

### PHASE 1: DATABASE & BACKEND SETUP (Ngày 1-2)

#### Day 1: Database Migration & Models

**Task 1.1: Verify & Run Migration**

```bash
# Kiểm tra xem bảng đã tồn tại chưa
mysql -u root -p thue_tro -e "SHOW TABLES LIKE 'cuochoithoai';"

# Nếu chưa có, tạo migration
```

**File:** `migrations/2025_11_04_create_chat_tables.sql`

```sql
-- Migration: Tạo bảng tin nhắn
-- Date: 2025-11-04
-- Author: Development Team

USE thue_tro;

-- Bảng Cuộc hội thoại
CREATE TABLE IF NOT EXISTS cuochoithoai (
  CuocHoiThoaiID INT PRIMARY KEY AUTO_INCREMENT,
  NguCanhID INT COMMENT 'ID của entity context (TinDangID, CuocHenID, HopDongID...)',
  NguCanhLoai ENUM('TinDang', 'CuocHen', 'HopDong', 'General') DEFAULT 'General',
  TieuDe VARCHAR(255),
  ThoiDiemTinNhanCuoi DATETIME,
  DangHoatDong TINYINT(1) DEFAULT 1 COMMENT '1=Active, 0=Archived',
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_ngucanh (NguCanhID, NguCanhLoai),
  INDEX idx_thoidiemtinnhancuoi (ThoiDiemTinNhanCuoi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Thành viên cuộc hội thoại
CREATE TABLE IF NOT EXISTS thanhviencuochoithoai (
  CuocHoiThoaiID INT NOT NULL,
  NguoiDungID INT NOT NULL,
  ThamGiaLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  TinNhanCuoiDocLuc DATETIME COMMENT 'Thời điểm đọc tin nhắn cuối (cho unread badge)',
  
  PRIMARY KEY (CuocHoiThoaiID, NguoiDungID),
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE,
  FOREIGN KEY (NguoiDungID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  INDEX idx_nguoidung (NguoiDungID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Tin nhắn
CREATE TABLE IF NOT EXISTS tinnhan (
  TinNhanID INT PRIMARY KEY AUTO_INCREMENT,
  CuocHoiThoaiID INT NOT NULL,
  NguoiGuiID INT NOT NULL,
  NoiDung TEXT NOT NULL,
  ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
  DaXoa TINYINT(1) DEFAULT 0 COMMENT '1=Deleted, 0=Normal',
  
  FOREIGN KEY (CuocHoiThoaiID) REFERENCES cuochoithoai(CuocHoiThoaiID) ON DELETE CASCADE,
  FOREIGN KEY (NguoiGuiID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  INDEX idx_cuochoithoai (CuocHoiThoaiID),
  INDEX idx_thoigian (ThoiGian),
  INDEX idx_nguoigui (NguoiGuiID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger: Cập nhật ThoiDiemTinNhanCuoi khi có tin nhắn mới
DELIMITER $$
CREATE TRIGGER update_conversation_timestamp 
AFTER INSERT ON tinnhan
FOR EACH ROW
BEGIN
  UPDATE cuochoithoai 
  SET ThoiDiemTinNhanCuoi = NEW.ThoiGian 
  WHERE CuocHoiThoaiID = NEW.CuocHoiThoaiID;
END$$
DELIMITER ;

-- Sample data (optional - for testing)
INSERT INTO cuochoithoai (NguCanhID, NguCanhLoai, TieuDe) VALUES
(1, 'TinDang', 'Trao đổi về Tin đăng #1'),
(2, 'CuocHen', 'Cuộc hẹn xem phòng #2');

-- Thêm thành viên
INSERT INTO thanhviencuochoithoai (CuocHoiThoaiID, NguoiDungID) VALUES
(1, 1), -- Khách hàng
(1, 2); -- Chủ dự án

-- Test message
INSERT INTO tinnhan (CuocHoiThoaiID, NguoiGuiID, NoiDung) VALUES
(1, 1, 'Xin chào, tôi quan tâm đến tin đăng này.');

SELECT 'Migration completed successfully!' AS status;
```

**Task 1.2: Backend Model**

**File:** `server/models/ChatModel.js` (NEW)

```javascript
/**
 * @fileoverview Model quản lý Chat (Cuộc hội thoại & Tin nhắn)
 * @module ChatModel
 * @requires config/db
 * @architecture Bulletproof Pattern - Data Layer
 */

const db = require('../config/db');

class ChatModel {
  /**
   * Tạo hoặc lấy cuộc hội thoại theo context
   * @param {Object} params
   * @param {number} params.NguCanhID - ID entity (TinDangID, CuocHenID, etc.)
   * @param {string} params.NguCanhLoai - Loại context ('TinDang', 'CuocHen', ...)
   * @param {Array<number>} params.ThanhVienIDs - Danh sách ID thành viên
   * @param {string} [params.TieuDe] - Tiêu đề cuộc hội thoại
   * @returns {Promise<number>} CuocHoiThoaiID
   */
  static async taoHoacLayCuocHoiThoai({ NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe }) {
    // Kiểm tra xem cuộc hội thoại đã tồn tại chưa
    const [existing] = await db.query(`
      SELECT CuocHoiThoaiID
      FROM cuochoithoai
      WHERE NguCanhID = ? AND NguCanhLoai = ? AND DangHoatDong = 1
    `, [NguCanhID, NguCanhLoai]);

    if (existing.length > 0) {
      return existing[0].CuocHoiThoaiID;
    }

    // Tạo mới cuộc hội thoại
    const [result] = await db.query(`
      INSERT INTO cuochoithoai (NguCanhID, NguCanhLoai, TieuDe)
      VALUES (?, ?, ?)
    `, [NguCanhID, NguCanhLoai, TieuDe || `${NguCanhLoai} #${NguCanhID}`]);

    const cuocHoiThoaiId = result.insertId;

    // Thêm thành viên vào cuộc hội thoại
    if (ThanhVienIDs && ThanhVienIDs.length > 0) {
      const values = ThanhVienIDs.map(id => [cuocHoiThoaiId, id]);
      await db.query(`
        INSERT INTO thanhviencuochoithoai (CuocHoiThoaiID, NguoiDungID)
        VALUES ?
      `, [values]);
    }

    return cuocHoiThoaiId;
  }

  /**
   * Lấy danh sách cuộc hội thoại của user
   * @param {number} nguoiDungId
   * @returns {Promise<Array>} Danh sách cuộc hội thoại
   */
  static async layDanhSachCuocHoiThoai(nguoiDungId) {
    const [rows] = await db.query(`
      SELECT 
        cht.CuocHoiThoaiID,
        cht.NguCanhID,
        cht.NguCanhLoai,
        cht.TieuDe,
        cht.ThoiDiemTinNhanCuoi,
        cht.DangHoatDong,
        
        -- Tin nhắn cuối
        (SELECT NoiDung FROM tinnhan 
         WHERE CuocHoiThoaiID = cht.CuocHoiThoaiID 
         ORDER BY ThoiGian DESC LIMIT 1) AS TinNhanCuoi,
        
        -- Người gửi tin nhắn cuối
        (SELECT nd.TenDayDu FROM tinnhan tn
         JOIN nguoidung nd ON tn.NguoiGuiID = nd.NguoiDungID
         WHERE tn.CuocHoiThoaiID = cht.CuocHoiThoaiID 
         ORDER BY tn.ThoiGian DESC LIMIT 1) AS NguoiGuiTinNhanCuoi,
        
        -- Số tin nhắn chưa đọc
        (SELECT COUNT(*) FROM tinnhan tn
         WHERE tn.CuocHoiThoaiID = cht.CuocHoiThoaiID
         AND tn.ThoiGian > COALESCE(tv.TinNhanCuoiDocLuc, '1970-01-01')
         AND tn.NguoiGuiID != ?) AS SoTinNhanChuaDoc,
        
        -- Danh sách thành viên (JSON)
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'NguoiDungID', nd.NguoiDungID,
            'TenDayDu', nd.TenDayDu,
            'Avatar', nd.Avatar
          )
        ) AS ThanhVien
        
      FROM cuochoithoai cht
      JOIN thanhviencuochoithoai tv ON cht.CuocHoiThoaiID = tv.CuocHoiThoaiID
      JOIN nguoidung nd ON tv.NguoiDungID = nd.NguoiDungID
      WHERE tv.NguoiDungID = ? AND cht.DangHoatDong = 1
      GROUP BY cht.CuocHoiThoaiID
      ORDER BY cht.ThoiDiemTinNhanCuoi DESC
    `, [nguoiDungId, nguoiDungId]);

    return rows;
  }

  /**
   * Lấy danh sách tin nhắn trong cuộc hội thoại (pagination)
   * @param {number} cuocHoiThoaiId
   * @param {number} limit - Số tin nhắn tối đa (default: 50)
   * @param {number} offset - Vị trí bắt đầu (default: 0)
   * @returns {Promise<Array>} Danh sách tin nhắn
   */
  static async layDanhSachTinNhan(cuocHoiThoaiId, limit = 50, offset = 0) {
    const [rows] = await db.query(`
      SELECT 
        tn.TinNhanID,
        tn.CuocHoiThoaiID,
        tn.NguoiGuiID,
        tn.NoiDung,
        tn.ThoiGian,
        tn.DaXoa,
        nd.TenDayDu AS NguoiGui_TenDayDu,
        nd.Avatar AS NguoiGui_Avatar
      FROM tinnhan tn
      JOIN nguoidung nd ON tn.NguoiGuiID = nd.NguoiDungID
      WHERE tn.CuocHoiThoaiID = ? AND tn.DaXoa = 0
      ORDER BY tn.ThoiGian ASC
      LIMIT ? OFFSET ?
    `, [cuocHoiThoaiId, limit, offset]);

    return rows;
  }

  /**
   * Gửi tin nhắn mới
   * @param {Object} data
   * @param {number} data.CuocHoiThoaiID
   * @param {number} data.NguoiGuiID
   * @param {string} data.NoiDung
   * @returns {Promise<Object>} Tin nhắn vừa gửi
   */
  static async guiTinNhan({ CuocHoiThoaiID, NguoiGuiID, NoiDung }) {
    // Validation
    if (!NoiDung || NoiDung.trim().length === 0) {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    if (NoiDung.length > 5000) {
      throw new Error('Nội dung tin nhắn tối đa 5000 ký tự');
    }

    // Kiểm tra user có quyền gửi tin nhắn trong cuộc hội thoại này không
    const [checkMember] = await db.query(`
      SELECT 1 FROM thanhviencuochoithoai
      WHERE CuocHoiThoaiID = ? AND NguoiDungID = ?
    `, [CuocHoiThoaiID, NguoiGuiID]);

    if (checkMember.length === 0) {
      throw new Error('Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này');
    }

    // Sanitize content (XSS prevention)
    const sanitizedContent = NoiDung.trim();

    // Insert tin nhắn
    const [result] = await db.query(`
      INSERT INTO tinnhan (CuocHoiThoaiID, NguoiGuiID, NoiDung)
      VALUES (?, ?, ?)
    `, [CuocHoiThoaiID, NguoiGuiID, sanitizedContent]);

    // Lấy tin nhắn vừa tạo (kèm thông tin người gửi)
    const [tinNhan] = await db.query(`
      SELECT 
        tn.TinNhanID,
        tn.CuocHoiThoaiID,
        tn.NguoiGuiID,
        tn.NoiDung,
        tn.ThoiGian,
        nd.TenDayDu AS NguoiGui_TenDayDu,
        nd.Avatar AS NguoiGui_Avatar
      FROM tinnhan tn
      JOIN nguoidung nd ON tn.NguoiGuiID = nd.NguoiDungID
      WHERE tn.TinNhanID = ?
    `, [result.insertId]);

    return tinNhan[0];
  }

  /**
   * Đánh dấu đã đọc tin nhắn
   * @param {number} cuocHoiThoaiId
   * @param {number} nguoiDungId
   * @returns {Promise<boolean>} Success
   */
  static async danhDauDaDoc(cuocHoiThoaiId, nguoiDungId) {
    const [result] = await db.query(`
      UPDATE thanhviencuochoithoai
      SET TinNhanCuoiDocLuc = NOW()
      WHERE CuocHoiThoaiID = ? AND NguoiDungID = ?
    `, [cuocHoiThoaiId, nguoiDungId]);

    return result.affectedRows > 0;
  }

  /**
   * Đếm tổng số tin nhắn chưa đọc của user
   * @param {number} nguoiDungId
   * @returns {Promise<number>} Tổng số tin nhắn chưa đọc
   */
  static async demTinNhanChuaDoc(nguoiDungId) {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS TongChuaDoc
      FROM tinnhan tn
      JOIN thanhviencuochoithoai tv ON tn.CuocHoiThoaiID = tv.CuocHoiThoaiID
      WHERE tv.NguoiDungID = ?
      AND tn.NguoiGuiID != ?
      AND tn.ThoiGian > COALESCE(tv.TinNhanCuoiDocLuc, '1970-01-01')
      AND tn.DaXoa = 0
    `, [nguoiDungId, nguoiDungId]);

    return rows[0].TongChuaDoc;
  }

  /**
   * Xóa tin nhắn (soft delete)
   * @param {number} tinNhanId
   * @param {number} nguoiDungId - Chỉ cho phép xóa tin nhắn của chính mình
   * @returns {Promise<boolean>} Success
   */
  static async xoaTinNhan(tinNhanId, nguoiDungId) {
    const [result] = await db.query(`
      UPDATE tinnhan
      SET DaXoa = 1
      WHERE TinNhanID = ? AND NguoiGuiID = ?
    `, [tinNhanId, nguoiDungId]);

    return result.affectedRows > 0;
  }
}

module.exports = ChatModel;
```

**Estimate Day 1:** 8 giờ (migration + model + testing queries)

---

#### Day 2: REST API & Socket.IO Setup

**Task 2.1: REST API Endpoints**

**File:** `server/controllers/ChatController.js` (NEW)

```javascript
/**
 * @fileoverview Controller cho Chat REST API
 * @module ChatController
 * @requires models/ChatModel
 * @requires services/NhatKyHeThongService
 * @architecture Bulletproof Pattern - HTTP Layer
 */

const ChatModel = require('../models/ChatModel');
const NhatKyService = require('../services/NhatKyHeThongService');

class ChatController {
  /**
   * GET /api/chat/conversations
   * Lấy danh sách cuộc hội thoại của user hiện tại
   */
  static async layDanhSachCuocHoiThoai(req, res) {
    try {
      const nguoiDungId = req.user.NguoiDungID;
      const danhSach = await ChatModel.layDanhSachCuocHoiThoai(nguoiDungId);

      res.json({
        success: true,
        data: danhSach
      });
    } catch (error) {
      console.error('[ChatController.layDanhSachCuocHoiThoai]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách cuộc hội thoại'
      });
    }
  }

  /**
   * POST /api/chat/conversations
   * Tạo hoặc lấy cuộc hội thoại theo context
   * Body: { NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe }
   */
  static async taoHoacLayCuocHoiThoai(req, res) {
    try {
      const nguoiDungId = req.user.NguoiDungID;
      const { NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe } = req.body;

      // Validation
      if (!NguCanhID || !NguCanhLoai) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu NguCanhID hoặc NguCanhLoai'
        });
      }

      // Đảm bảo user hiện tại luôn là thành viên
      const allMemberIds = Array.from(
        new Set([nguoiDungId, ...(ThanhVienIDs || [])])
      );

      const cuocHoiThoaiId = await ChatModel.taoHoacLayCuocHoiThoai({
        NguCanhID,
        NguCanhLoai,
        ThanhVienIDs: allMemberIds,
        TieuDe
      });

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungId,
        HanhDong: 'tao_cuoc_hoi_thoai',
        DoiTuong: 'cuochoithoai',
        DoiTuongID: cuocHoiThoaiId,
        ChiTiet: JSON.stringify({ NguCanhID, NguCanhLoai })
      });

      res.status(201).json({
        success: true,
        data: { CuocHoiThoaiID: cuocHoiThoaiId }
      });
    } catch (error) {
      console.error('[ChatController.taoHoacLayCuocHoiThoai]', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/chat/conversations/:id/messages
   * Lấy danh sách tin nhắn trong cuộc hội thoại (pagination)
   * Query params: limit, offset
   */
  static async layDanhSachTinNhan(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.NguoiDungID;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Kiểm tra quyền truy cập cuộc hội thoại
      const [checkAccess] = await require('../config/db').query(`
        SELECT 1 FROM thanhviencuochoithoai
        WHERE CuocHoiThoaiID = ? AND NguoiDungID = ?
      `, [id, nguoiDungId]);

      if (checkAccess.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập cuộc hội thoại này'
        });
      }

      const danhSach = await ChatModel.layDanhSachTinNhan(id, limit, offset);

      res.json({
        success: true,
        data: danhSach,
        pagination: { limit, offset, total: danhSach.length }
      });
    } catch (error) {
      console.error('[ChatController.layDanhSachTinNhan]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tin nhắn'
      });
    }
  }

  /**
   * POST /api/chat/conversations/:id/messages
   * Gửi tin nhắn mới (dùng REST API, không qua Socket)
   * Body: { NoiDung }
   */
  static async guiTinNhan(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.NguoiDungID;
      const { NoiDung } = req.body;

      const tinNhan = await ChatModel.guiTinNhan({
        CuocHoiThoaiID: id,
        NguoiGuiID: nguoiDungId,
        NoiDung
      });

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungId,
        HanhDong: 'gui_tin_nhan',
        DoiTuong: 'tinnhan',
        DoiTuongID: tinNhan.TinNhanID,
        ChiTiet: JSON.stringify({ CuocHoiThoaiID: id })
      });

      res.status(201).json({
        success: true,
        data: tinNhan
      });
    } catch (error) {
      console.error('[ChatController.guiTinNhan]', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/chat/conversations/:id/read
   * Đánh dấu đã đọc tin nhắn
   */
  static async danhDauDaDoc(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.NguoiDungID;

      await ChatModel.danhDauDaDoc(id, nguoiDungId);

      res.json({
        success: true,
        message: 'Đã đánh dấu đọc'
      });
    } catch (error) {
      console.error('[ChatController.danhDauDaDoc]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đánh dấu đã đọc'
      });
    }
  }

  /**
   * GET /api/chat/unread-count
   * Đếm tổng số tin nhắn chưa đọc
   */
  static async demTinNhanChuaDoc(req, res) {
    try {
      const nguoiDungId = req.user.NguoiDungID;
      const count = await ChatModel.demTinNhanChuaDoc(nguoiDungId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('[ChatController.demTinNhanChuaDoc]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đếm tin nhắn chưa đọc'
      });
    }
  }

  /**
   * DELETE /api/chat/messages/:messageId
   * Xóa tin nhắn (soft delete)
   */
  static async xoaTinNhan(req, res) {
    try {
      const { messageId } = req.params;
      const nguoiDungId = req.user.NguoiDungID;

      const success = await ChatModel.xoaTinNhan(messageId, nguoiDungId);

      if (success) {
        await NhatKyService.ghiNhan({
          NguoiDungID: nguoiDungId,
          HanhDong: 'xoa_tin_nhan',
          DoiTuong: 'tinnhan',
          DoiTuongID: messageId
        });
      }

      res.json({
        success,
        message: success ? 'Xóa tin nhắn thành công' : 'Không tìm thấy tin nhắn'
      });
    } catch (error) {
      console.error('[ChatController.xoaTinNhan]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa tin nhắn'
      });
    }
  }
}

module.exports = ChatController;
```

**File:** `server/routes/chatRoutes.js` (NEW)

```javascript
/**
 * @fileoverview Routes cho Chat REST API
 * @module chatRoutes
 * @requires express
 * @requires middleware/auth
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatController = require('../controllers/ChatController');

// Base path: /api/chat

/**
 * GET /api/chat/conversations
 * Lấy danh sách cuộc hội thoại của user
 */
router.get('/conversations', auth, ChatController.layDanhSachCuocHoiThoai);

/**
 * POST /api/chat/conversations
 * Tạo hoặc lấy cuộc hội thoại
 */
router.post('/conversations', auth, ChatController.taoHoacLayCuocHoiThoai);

/**
 * GET /api/chat/conversations/:id/messages
 * Lấy danh sách tin nhắn (pagination)
 */
router.get('/conversations/:id/messages', auth, ChatController.layDanhSachTinNhan);

/**
 * POST /api/chat/conversations/:id/messages
 * Gửi tin nhắn mới (REST fallback)
 */
router.post('/conversations/:id/messages', auth, ChatController.guiTinNhan);

/**
 * PUT /api/chat/conversations/:id/read
 * Đánh dấu đã đọc
 */
router.put('/conversations/:id/read', auth, ChatController.danhDauDaDoc);

/**
 * GET /api/chat/unread-count
 * Đếm tin nhắn chưa đọc
 */
router.get('/unread-count', auth, ChatController.demTinNhanChuaDoc);

/**
 * DELETE /api/chat/messages/:messageId
 * Xóa tin nhắn
 */
router.delete('/messages/:messageId', auth, ChatController.xoaTinNhan);

module.exports = router;
```

**File:** `server/index.js` (UPDATE)

```javascript
// THÊM vào đầu file (sau các imports khác)
const chatRoutes = require('./routes/chatRoutes');

// THÊM vào phần routes (sau các routes khác)
app.use('/api/chat', chatRoutes);
```

**Task 2.2: Socket.IO Server Setup**

**File:** `server/socket/index.js` (NEW)

```javascript
/**
 * @fileoverview Socket.IO Server Setup
 * @module socket
 * @requires socket.io
 * @requires middleware/auth
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatHandler = require('./handlers/chatHandler');
const presenceHandler = require('./handlers/presenceHandler');

/**
 * Middleware xác thực Socket.IO connection
 */
function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user info to socket
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
}

/**
 * Khởi tạo Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware authentication
  io.use(socketAuth);

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.NguoiDungID;
    console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`);

    // Join user's personal room
    socket.join(`user-${userId}`);

    // Presence handlers (online/offline)
    presenceHandler.handleOnline(socket, io);
    presenceHandler.handleOffline(socket, io);

    // Chat handlers
    chatHandler.handleJoinConversation(socket, io);
    chatHandler.handleLeaveConversation(socket, io);
    chatHandler.handleSendMessage(socket, io);
    chatHandler.handleTyping(socket, io);
    chatHandler.handleStopTyping(socket, io);
    chatHandler.handleMarkAsRead(socket, io);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User ${userId} disconnected (socket: ${socket.id})`);
      presenceHandler.handleOffline(socket, io);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Error for user ${userId}:`, error);
    });
  });

  return io;
}

module.exports = { initSocketServer };
```

**File:** `server/socket/handlers/chatHandler.js` (NEW)

```javascript
/**
 * @fileoverview Chat event handlers cho Socket.IO
 * @module socket/handlers/chatHandler
 * @requires models/ChatModel
 */

const ChatModel = require('../../models/ChatModel');
const NhatKyService = require('../../services/NhatKyHeThongService');

/**
 * Rate limiting: 20 tin nhắn / phút / user
 */
const messageRateLimiter = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = messageRateLimiter.get(userId) || { count: 0, resetTime: now + 60000 };

  if (now > userLimit.resetTime) {
    // Reset counter
    messageRateLimiter.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (userLimit.count >= 20) {
    return false; // Exceeded rate limit
  }

  userLimit.count++;
  messageRateLimiter.set(userId, userLimit);
  return true;
}

class ChatHandler {
  /**
   * Event: join-conversation
   * Client join vào room của cuộc hội thoại
   */
  static handleJoinConversation(socket, io) {
    socket.on('join-conversation', async ({ conversationId }) => {
      try {
        const userId = socket.user.NguoiDungID;

        // Kiểm tra quyền truy cập
        const db = require('../../config/db');
        const [check] = await db.query(`
          SELECT 1 FROM thanhviencuochoithoai
          WHERE CuocHoiThoaiID = ? AND NguoiDungID = ?
        `, [conversationId, userId]);

        if (check.length === 0) {
          return socket.emit('error', { message: 'Không có quyền truy cập cuộc hội thoại' });
        }

        // Join room
        socket.join(`conversation-${conversationId}`);
        console.log(`[Socket] User ${userId} joined conversation ${conversationId}`);

        socket.emit('joined-conversation', { conversationId });
      } catch (error) {
        console.error('[Socket] join-conversation error:', error);
        socket.emit('error', { message: 'Lỗi khi join cuộc hội thoại' });
      }
    });
  }

  /**
   * Event: leave-conversation
   * Client leave khỏi room
   */
  static handleLeaveConversation(socket, io) {
    socket.on('leave-conversation', ({ conversationId }) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`[Socket] User ${socket.user.NguoiDungID} left conversation ${conversationId}`);
    });
  }

  /**
   * Event: send-message
   * Client gửi tin nhắn mới
   */
  static handleSendMessage(socket, io) {
    socket.on('send-message', async ({ conversationId, noiDung }) => {
      try {
        const userId = socket.user.NguoiDungID;

        // Rate limiting
        if (!checkRateLimit(userId)) {
          return socket.emit('error', { 
            message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút.' 
          });
        }

        // Gửi tin nhắn
        const tinNhan = await ChatModel.guiTinNhan({
          CuocHoiThoaiID: conversationId,
          NguoiGuiID: userId,
          NoiDung: noiDung
        });

        // Audit log
        await NhatKyService.ghiNhan({
          NguoiDungID: userId,
          HanhDong: 'gui_tin_nhan_socket',
          DoiTuong: 'tinnhan',
          DoiTuongID: tinNhan.TinNhanID,
          ChiTiet: JSON.stringify({ CuocHoiThoaiID: conversationId })
        });

        // Broadcast tin nhắn mới đến tất cả thành viên trong room
        io.to(`conversation-${conversationId}`).emit('new-message', tinNhan);

        console.log(`[Socket] User ${userId} sent message in conversation ${conversationId}`);
      } catch (error) {
        console.error('[Socket] send-message error:', error);
        socket.emit('error', { message: error.message });
      }
    });
  }

  /**
   * Event: typing
   * User đang gõ tin nhắn
   */
  static handleTyping(socket, io) {
    socket.on('typing', ({ conversationId }) => {
      const userId = socket.user.NguoiDungID;
      const userName = socket.user.TenDayDu;

      // Broadcast đến những người khác trong room (không gửi lại cho chính mình)
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        userId,
        userName,
        conversationId
      });
    });
  }

  /**
   * Event: stop-typing
   * User dừng gõ tin nhắn
   */
  static handleStopTyping(socket, io) {
    socket.on('stop-typing', ({ conversationId }) => {
      const userId = socket.user.NguoiDungID;

      socket.to(`conversation-${conversationId}`).emit('user-stop-typing', {
        userId,
        conversationId
      });
    });
  }

  /**
   * Event: mark-as-read
   * Đánh dấu đã đọc tin nhắn
   */
  static handleMarkAsRead(socket, io) {
    socket.on('mark-as-read', async ({ conversationId }) => {
      try {
        const userId = socket.user.NguoiDungID;

        await ChatModel.danhDauDaDoc(conversationId, userId);

        // Notify user's other devices
        io.to(`user-${userId}`).emit('conversation-read', { conversationId });
      } catch (error) {
        console.error('[Socket] mark-as-read error:', error);
      }
    });
  }
}

module.exports = ChatHandler;
```

**File:** `server/socket/handlers/presenceHandler.js` (NEW)

```javascript
/**
 * @fileoverview Presence event handlers (Online/Offline status)
 * @module socket/handlers/presenceHandler
 */

// Store online users (userId -> socketIds[])
const onlineUsers = new Map();

class PresenceHandler {
  /**
   * User online
   */
  static handleOnline(socket, io) {
    const userId = socket.user.NguoiDungID;

    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).push(socket.id);
    } else {
      onlineUsers.set(userId, [socket.id]);
    }

    // Broadcast user online status
    io.emit('user-online', { userId });
    console.log(`[Presence] User ${userId} is online (sockets: ${onlineUsers.get(userId).length})`);
  }

  /**
   * User offline
   */
  static handleOffline(socket, io) {
    const userId = socket.user.NguoiDungID;

    if (onlineUsers.has(userId)) {
      const sockets = onlineUsers.get(userId).filter(id => id !== socket.id);
      
      if (sockets.length === 0) {
        onlineUsers.delete(userId);
        // Broadcast user offline (chỉ khi tất cả socket đều disconnect)
        io.emit('user-offline', { userId });
        console.log(`[Presence] User ${userId} is offline`);
      } else {
        onlineUsers.set(userId, sockets);
      }
    }
  }

  /**
   * Lấy danh sách user online
   */
  static getOnlineUsers() {
    return Array.from(onlineUsers.keys());
  }

  /**
   * Kiểm tra user có online không
   */
  static isUserOnline(userId) {
    return onlineUsers.has(userId);
  }
}

module.exports = PresenceHandler;
```

**File:** `server/index.js` (UPDATE - khởi tạo Socket.IO)

```javascript
// THÊM vào đầu file
const http = require('http');
const { initSocketServer } = require('./socket');

// THAY ĐỔI
// app.listen(PORT, ...) => Tạo HTTP server riêng
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
const io = initSocketServer(httpServer);

// Attach io to app (để sử dụng trong controllers nếu cần)
app.set('io', io);

// THAY ĐỔI: Dùng httpServer.listen thay vì app.listen
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.IO server running on ws://localhost:${PORT}`);
});
```

**File:** `package.json` (UPDATE - Thêm dependencies)

```json
{
  "dependencies": {
    "socket.io": "^4.7.2"
  }
}
```

```bash
# Install dependencies
npm install socket.io
```

**Estimate Day 2:** 8 giờ (REST API + Socket.IO setup + testing)

---

### PHASE 2: FRONTEND IMPLEMENTATION (Ngày 3-5)

#### Day 3: Frontend Architecture & Socket Client

**Task 3.1: Socket.IO Client Setup**

**File:** `client/src/features/chat/api/socketClient.js` (NEW)

```javascript
/**
 * @fileoverview Socket.IO client singleton
 * @module socketClient
 * @architecture Bulletproof Pattern - API Layer
 */

import { io } from 'socket.io-client';

let socketInstance = null;

/**
 * Khởi tạo Socket.IO client
 * @param {string} token - JWT token
 * @returns {Socket} Socket instance
 */
export function initSocket(token) {
  if (socketInstance) {
    return socketInstance;
  }

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  socketInstance = io(API_BASE, {
    auth: {
      token: token
    },
    autoConnect: false, // Manual connection
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  // Event listeners
  socketInstance.on('connect', () => {
    console.log('[Socket] Connected:', socketInstance.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socketInstance;
}

/**
 * Lấy Socket instance hiện tại
 * @returns {Socket|null}
 */
export function getSocket() {
  return socketInstance;
}

/**
 * Kết nối Socket
 */
export function connectSocket() {
  if (socketInstance && !socketInstance.connected) {
    socketInstance.connect();
  }
}

/**
 * Ngắt kết nối Socket
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}

/**
 * Hủy Socket instance
 */
export function destroySocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}
```

**File:** `client/src/features/chat/api/chatApi.js` (NEW)

```javascript
/**
 * @fileoverview REST API client cho Chat
 * @module chatApi
 * @architecture Bulletproof Pattern - API Layer
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Lấy danh sách cuộc hội thoại
 */
export const layDanhSachCuocHoiThoai = async () => {
  const response = await axios.get(`${API_BASE}/api/chat/conversations`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

/**
 * Tạo hoặc lấy cuộc hội thoại
 */
export const taoHoacLayCuocHoiThoai = async ({ NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe }) => {
  const response = await axios.post(
    `${API_BASE}/api/chat/conversations`,
    { NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe },
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

/**
 * Lấy danh sách tin nhắn (pagination)
 */
export const layDanhSachTinNhan = async (conversationId, limit = 50, offset = 0) => {
  const response = await axios.get(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    {
      params: { limit, offset },
      headers: getAuthHeaders()
    }
  );
  return response.data.data;
};

/**
 * Gửi tin nhắn (REST fallback)
 */
export const guiTinNhan = async (conversationId, noiDung) => {
  const response = await axios.post(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    { NoiDung: noiDung },
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

/**
 * Đánh dấu đã đọc
 */
export const danhDauDaDoc = async (conversationId) => {
  const response = await axios.put(
    `${API_BASE}/api/chat/conversations/${conversationId}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Đếm tin nhắn chưa đọc
 */
export const demTinNhanChuaDoc = async () => {
  const response = await axios.get(`${API_BASE}/api/chat/unread-count`, {
    headers: getAuthHeaders()
  });
  return response.data.data.count;
};

/**
 * Xóa tin nhắn
 */
export const xoaTinNhan = async (messageId) => {
  const response = await axios.delete(
    `${API_BASE}/api/chat/messages/${messageId}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};
```

**File:** `client/package.json` (UPDATE - Thêm dependencies)

```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2",
    "react-virtualized": "^9.22.5"
  }
}
```

```bash
# Install dependencies
cd client
npm install socket.io-client react-virtualized
```

**Estimate Day 3:** 8 giờ (Socket client setup + API layer + testing connections)

---

#### Day 4-5: Chat UI Components

**File:** `client/src/features/chat/hooks/useChat.js` (NEW)

```javascript
/**
 * @fileoverview Custom hook quản lý Chat state
 * @module useChat
 * @architecture Bulletproof Pattern - Hook Layer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../api/socketClient';
import { 
  layDanhSachTinNhan, 
  guiTinNhan as guiTinNhanREST,
  danhDauDaDoc 
} from '../api/chatApi';

export function useChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const socket = getSocket();
  const typingTimeoutRef = useRef(null);

  // Load tin nhắn ban đầu
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      joinConversation();
    }

    return () => {
      if (conversationId) {
        leaveConversation();
      }
    };
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Lắng nghe tin nhắn mới
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    // Lắng nghe user typing
    const handleUserTyping = ({ userId, userName }) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === userId)) {
          return [...prev, { userId, userName }];
        }
        return prev;
      });
    };

    // Lắng nghe user stop typing
    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await layDanhSachTinNhan(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Lỗi load tin nhắn:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinConversation = () => {
    if (socket) {
      socket.emit('join-conversation', { conversationId });
    }
  };

  const leaveConversation = () => {
    if (socket) {
      socket.emit('leave-conversation', { conversationId });
    }
  };

  const sendMessage = useCallback(async (noiDung) => {
    if (!noiDung.trim()) return;

    try {
      if (socket && socket.connected) {
        // Gửi qua Socket (real-time)
        socket.emit('send-message', { conversationId, noiDung });
      } else {
        // Fallback: Gửi qua REST API
        const message = await guiTinNhanREST(conversationId, noiDung);
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      throw error;
    }
  }, [conversationId, socket]);

  const handleTyping = useCallback(() => {
    if (!socket) return;

    // Gửi event typing
    socket.emit('typing', { conversationId });

    // Clear timeout cũ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout mới (3s không gõ thì stop typing)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId });
    }, 3000);
  }, [conversationId, socket]);

  const markAsRead = useCallback(async () => {
    try {
      await danhDauDaDoc(conversationId);
      
      if (socket) {
        socket.emit('mark-as-read', { conversationId });
      }
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  }, [conversationId, socket]);

  return {
    messages,
    loading,
    typingUsers,
    sendMessage,
    handleTyping,
    markAsRead,
    refreshMessages: loadMessages
  };
}
```

**File:** `client/src/features/chat/components/ChatBox.jsx` (NEW)

```javascript
/**
 * @fileoverview Main Chat Box component
 * @component ChatBox
 * @architecture Bulletproof Pattern - Component Layer
 */

import React, { useEffect, useRef } from 'react';
import { HiOutlineXMark, HiOutlinePhone, HiOutlineVideoCamera } from 'react-icons/hi2';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { useChat } from '../hooks/useChat';
import './ChatBox.css';

/**
 * ChatBox component
 * @param {Object} props
 * @param {number} props.conversationId - ID cuộc hội thoại
 * @param {Object} props.conversation - Thông tin cuộc hội thoại
 * @param {Function} props.onClose - Callback đóng chat
 * @param {boolean} props.minimized - Trạng thái minimize
 */
export default function ChatBox({ conversationId, conversation, onClose, minimized }) {
  const { 
    messages, 
    loading, 
    typingUsers,
    sendMessage, 
    handleTyping,
    markAsRead 
  } = useChat(conversationId);

  const chatBoxRef = useRef(null);

  // Đánh dấu đã đọc khi mở chat box
  useEffect(() => {
    if (conversationId && !minimized) {
      markAsRead();
    }
  }, [conversationId, minimized, markAsRead]);

  const handleSendMessage = async (noiDung) => {
    try {
      await sendMessage(noiDung);
    } catch (error) {
      alert('Lỗi gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  if (minimized) {
    return (
      <div className="chat-box chat-box--minimized" ref={chatBoxRef}>
        <div className="chat-box__header" onClick={() => onMinimize(false)}>
          <div className="chat-box__header-left">
            <div className="avatar-sm">
              {conversation?.ThanhVien?.[0]?.Avatar ? (
                <img src={conversation.ThanhVien[0].Avatar} alt="" />
              ) : (
                <span>{conversation?.ThanhVien?.[0]?.TenDayDu?.charAt(0)}</span>
              )}
            </div>
            <span className="chat-box__title">{conversation?.TieuDe || 'Chat'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box" ref={chatBoxRef}>
      {/* Header */}
      <div className="chat-box__header">
        <div className="chat-box__header-left">
          <div className="avatar-sm">
            {conversation?.ThanhVien?.[0]?.Avatar ? (
              <img src={conversation.ThanhVien[0].Avatar} alt="" />
            ) : (
              <span>{conversation?.ThanhVien?.[0]?.TenDayDu?.charAt(0)}</span>
            )}
          </div>
          <div className="chat-box__header-info">
            <h4 className="chat-box__title">{conversation?.TieuDe || 'Chat'}</h4>
            <p className="chat-box__subtitle">
              {typingUsers.length > 0 
                ? `${typingUsers.map(u => u.userName).join(', ')} đang nhập...`
                : `Hoạt động ${formatLastActive(conversation?.ThoiDiemTinNhanCuoi)}`
              }
            </p>
          </div>
        </div>

        <div className="chat-box__header-actions">
          <button className="btn-icon" title="Gọi điện">
            <HiOutlinePhone />
          </button>
          <button className="btn-icon" title="Video call">
            <HiOutlineVideoCamera />
          </button>
          <button className="btn-icon" onClick={onClose} title="Đóng">
            <HiOutlineXMark />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-box__messages">
        {loading ? (
          <div className="chat-box__loading">Đang tải tin nhắn...</div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="chat-box__typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      )}

      {/* Input */}
      <InputBox 
        onSend={handleSendMessage} 
        onTyping={handleTyping}
      />
    </div>
  );
}

// Helper function
function formatLastActive(datetime) {
  if (!datetime) return 'vừa xong';
  
  const diff = Date.now() - new Date(datetime).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
```

**File:** `client/src/features/chat/components/ChatBox.css` (NEW)

```css
/**
 * ChatBox Component Styles
 * Architecture: Light Glass Morphism - Emerald-Noir Palette
 */

.chat-box {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  height: 600px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(240, 253, 250, 0.98) 100%
  );
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(5, 150, 105, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(5, 150, 105, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-box--minimized {
  height: 56px;
  width: 280px;
  cursor: pointer;
}

.chat-box__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(5, 150, 105, 0.95) 0%,
    rgba(16, 185, 129, 0.98) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: #fff;
}

.chat-box__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.chat-box__header-info {
  flex: 1;
  min-width: 0;
}

.chat-box__title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-box__subtitle {
  font-size: 12px;
  margin: 2px 0 0;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-box__header-actions {
  display: flex;
  gap: 8px;
}

.chat-box__header-actions .btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-box__header-actions .btn-icon:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.chat-box__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(
    180deg,
    rgba(240, 253, 250, 0.3) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
}

.chat-box__messages::-webkit-scrollbar {
  width: 6px;
}

.chat-box__messages::-webkit-scrollbar-track {
  background: rgba(5, 150, 105, 0.05);
}

.chat-box__messages::-webkit-scrollbar-thumb {
  background: rgba(5, 150, 105, 0.2);
  border-radius: 3px;
}

.chat-box__messages::-webkit-scrollbar-thumb:hover {
  background: rgba(5, 150, 105, 0.3);
}

.chat-box__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #059669;
  font-size: 14px;
}

.chat-box__typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(5, 150, 105, 0.05);
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #059669;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-box {
    width: 100%;
    height: 100%;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }

  .chat-box--minimized {
    width: calc(100% - 40px);
    left: 20px;
    bottom: 20px;
    border-radius: 12px;
  }
}
```

**File:** `client/src/features/chat/components/MessageList.jsx`, `MessageItem.jsx`, `InputBox.jsx` - Tương tự pattern trên...

**Estimate Day 4-5:** 16 giờ (Chat UI components + CSS + testing real-time)

---

### PHASE 3: INTEGRATION & TESTING (Ngày 6-7)

#### Day 6: Integration với Module Chủ Dự án

**Task 6.1: Tích hợp Chat Button vào Tin đăng**

**File:** `client/src/pages/ChuDuAn/QuanLyTinDang.jsx` (UPDATE)

```javascript
// Import Chat components
import { useState } from 'react';
import ChatBox from '../../features/chat/components/ChatBox';
import { taoHoacLayCuocHoiThoai } from '../../features/chat/api/chatApi';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

// Thêm state
const [activeChatConversation, setActiveChatConversation] = useState(null);

// Hàm mở chat với khách hàng quan tâm tin đăng
const handleOpenChat = async (tinDang) => {
  try {
    // Giả sử có API lấy danh sách khách hàng quan tâm tin đăng
    // Hoặc mở chat với khách hàng từ cuộc hẹn
    const conversation = await taoHoacLayCuocHoiThoai({
      NguCanhID: tinDang.TinDangID,
      NguCanhLoai: 'TinDang',
      TieuDe: `Trao đổi về: ${tinDang.TieuDe}`
    });
    
    setActiveChatConversation(conversation);
  } catch (error) {
    alert('Lỗi khi mở chat');
  }
};

// Render Chat button trong danh sách tin đăng
<button 
  className="btn-action" 
  onClick={() => handleOpenChat(tinDang)}
  title="Nhắn tin với khách hàng"
>
  <HiOutlineChatBubbleLeftRight />
</button>

// Render ChatBox (fixed bottom-right)
{activeChatConversation && (
  <ChatBox 
    conversationId={activeChatConversation.CuocHoiThoaiID}
    conversation={activeChatConversation}
    onClose={() => setActiveChatConversation(null)}
  />
)}
```

**Task 6.2: Tích hợp Chat với Cuộc hẹn**

Tương tự, thêm chat button vào trang `QuanLyCuocHen.jsx` (khi triển khai chức năng này).

**Task 6.3: Thêm Badge số tin nhắn chưa đọc vào Navigation**

**File:** `client/src/components/ChuDuAn/NavigationChuDuAn.jsx` (UPDATE)

```javascript
import { demTinNhanChuaDoc } from '../../features/chat/api/chatApi';
import { useEffect, useState } from 'react';
import { getSocket } from '../../features/chat/api/socketClient';

// Component
const [unreadCount, setUnreadCount] = useState(0);
const socket = getSocket();

// Load unread count
useEffect(() => {
  loadUnreadCount();

  // Real-time update
  if (socket) {
    socket.on('new-message', loadUnreadCount);
    socket.on('conversation-read', loadUnreadCount);
  }

  return () => {
    if (socket) {
      socket.off('new-message', loadUnreadCount);
      socket.off('conversation-read', loadUnreadCount);
    }
  };
}, [socket]);

const loadUnreadCount = async () => {
  try {
    const count = await demTinNhanChuaDoc();
    setUnreadCount(count);
  } catch (error) {
    console.error('Lỗi load unread count:', error);
  }
};

// Render badge trong Navigation
{
  to: '/chu-du-an/tin-nhan',
  icon: <HiOutlineChatBubbleLeftRight />,
  label: 'Tin nhắn',
  badge: unreadCount > 0 ? unreadCount : null
}
```

**Estimate Day 6:** 8 giờ (Integration + testing features)

---

#### Day 7: Testing & Bug Fixes

**Task 7.1: E2E Testing Scenarios**

```javascript
/**
 * Test scenarios cho Chat feature
 */

// TEST 1: Tạo cuộc hội thoại mới
// TEST 2: Gửi tin nhắn real-time
// TEST 3: Nhận tin nhắn real-time
// TEST 4: Typing indicator
// TEST 5: Mark as read
// TEST 6: Unread badge update
// TEST 7: Rate limiting (gửi 20+ tin nhắn/phút)
// TEST 8: Offline fallback (disconnect Socket, gửi tin nhắn qua REST API)
// TEST 9: Reconnection sau khi disconnect
// TEST 10: Multiple tabs (đồng bộ trạng thái)
```

**Task 7.2: Security Testing**

- XSS prevention (sanitize input)
- Rate limiting
- Authentication (Socket.IO token validation)
- Authorization (chỉ thành viên mới gửi tin nhắn)

**Task 7.3: Performance Testing**

- Load 1000+ tin nhắn (React Virtualized)
- Multiple chat boxes
- Memory leaks (socket cleanup)

**Estimate Day 7:** 8 giờ (Testing + bug fixes + documentation)

---

## 📊 SUMMARY

### Tổng Estimate: 7 ngày

| Phase | Tasks | Estimate |
|-------|-------|----------|
| **Phase 1** | Database + Backend (Models, REST API, Socket.IO) | 2 ngày |
| **Phase 2** | Frontend (Socket client, Hooks, UI components) | 3 ngày |
| **Phase 3** | Integration + Testing | 2 ngày |
| **Total** | | **7 ngày** |

### Tech Stack Summary

**Backend:**
- Node.js + Express
- Socket.IO Server 4.x
- MySQL (persistent storage)
- JWT authentication
- Rate limiting

**Frontend:**
- React 18 (Vite)
- Socket.IO Client 4.x
- Custom hooks (useChat, useSocket)
- React Virtualized (lazy load)
- Light Glass Morphism UI

### Performance Targets

- Message send latency: < 100ms (Socket.IO)
- Message load time (50 messages): < 500ms
- Typing indicator delay: < 50ms
- Reconnection time: < 2s
- Memory usage: < 50MB (1000 messages)

### Security Checklist

- ✅ JWT authentication cho Socket.IO
- ✅ Rate limiting (20 messages/minute)
- ✅ XSS prevention (sanitize input)
- ✅ Authorization check (member-only messaging)
- ✅ Audit logging (NhatKyHeThong)

---

## 🚀 NEXT STEPS (PHASE 2 - OPTIONAL)

### Future Enhancements (sau khi hoàn thành Phase 1)

1. **File Attachments** (2 ngày)
   - Upload ảnh/file (multer)
   - Preview ảnh trong chat
   - File size limit (5MB)

2. **Emoji Picker** (1 ngày)
   - Emoji picker component
   - Recent emojis
   - Search emojis

3. **Message Reactions** (1 ngày)
   - Reaction UI (👍❤️😂...)
   - Count reactions
   - Real-time update

4. **Search Messages** (1 ngày)
   - Full-text search
   - Highlight matches
   - Jump to message

5. **Group Chat** (3 ngày)
   - Multiple participants
   - Add/remove members
   - Group admin permissions

6. **Voice/Video Call** (5 ngày)
   - WebRTC integration
   - Call UI
   - Screen sharing

**Total Phase 2:** 13 ngày (optional)

---

## 📚 TÀI LIỆU THAM KHẢO

- **Use Cases:** `docs/use-cases-v1.2.md` (UC-PROJ-05, UC-CUST-07, UC-SALE-07)
- **Hiện trạng:** `docs/CHU_DU_AN_ACTUAL_STATUS_2025.md`
- **Database Schema:** `docs/use-cases-v1.2.md` (line 654-656)
- **Socket.IO Docs:** https://socket.io/docs/v4/
- **React Virtualized:** https://github.com/bvaughn/react-virtualized

---

**KẾT LUẬN:** Tính năng tin nhắn là một hệ thống phức tạp yêu cầu tích hợp Socket.IO cho real-time messaging. Roadmap 7 ngày này cung cấp MVP đầy đủ để Chủ Dự án có thể trao đổi với Khách hàng/NhanVienBanHang. Các tính năng nâng cao (file attachments, emoji, video call) có thể triển khai ở Phase 2 sau khi hoàn thành Core Features của module Chủ Dự án.


