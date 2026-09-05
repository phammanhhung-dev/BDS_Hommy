# HƯỚNG DẪN TRIỂN KHAI TÍNH NĂNG XÁC THỰC KYC CCCD

## 📋 Tổng quan

**Tên tính năng:** Xác thực danh tính người dùng bằng CCCD (eKYC)  
**Phương án:** Open Source (Tesseract.js + Face-api.js)  
**Ngày bắt đầu:** 22/11/2025  
**Người phụ trách:** Team Development  
**Ưu tiên:** High  

---

## 🎯 Mục tiêu

### Mục tiêu chính
Tự động hóa quy trình xác thực danh tính người dùng thông qua:
1. **Quét CCCD tự động** - OCR trích xuất thông tin từ ảnh CCCD
2. **Đối chiếu khuôn mặt** - Face matching giữa ảnh CCCD và selfie
3. **Tự động cập nhật dữ liệu** - Điền thông tin vào bảng `nguoidung`
4. **Phòng chống gian lận** - Phát hiện ảnh giả mạo (không có liveness detection)

### Mục tiêu kỹ thuật
- ✅ Độ chính xác OCR: ≥ 70% cho CCCD Việt Nam
- ✅ Thời gian xử lý: < 15 giây/người dùng
- ✅ Chi phí: 0 đồng (100% open source)
- ✅ Privacy: Xử lý trên browser, không gửi ảnh lên third-party API

---

## 🏗️ Kiến trúc Hệ thống

### Sơ đồ tổng quan
```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                    │
├─────────────────────────────────────────────────────────────┤
│  📱 XacThucKYC.jsx (Main Page)                              │
│    ├─ Step 1: Camera chụp CCCD mặt trước                   │
│    │   └─ CameraCapture.jsx                                │
│    ├─ Step 2: Camera chụp CCCD mặt sau                     │
│    │   └─ CameraCapture.jsx                                │
│    ├─ Step 3: Camera chụp selfie                           │
│    │   └─ CameraCapture.jsx                                │
│    ├─ Step 4: OCR Processing (Tesseract.js)               │
│    │   ├─ Load vie.traineddata                            │
│    │   ├─ Recognize text                                  │
│    │   └─ Parse CCCD fields                               │
│    ├─ Step 5: Face Matching (Face-api.js)                 │
│    │   ├─ Load models (ssd_mobilenetv1, face_recognition)│
│    │   ├─ Detect face from CCCD                           │
│    │   ├─ Detect face from selfie                         │
│    │   └─ Calculate similarity                            │
│    └─ Step 6: Preview + Submit                            │
│        └─ PreviewKYC.jsx                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓ POST /api/kyc/xac-thuc
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Node.js + Express)                   │
├─────────────────────────────────────────────────────────────┤
│  📡 Routes: /api/kyc/*                                      │
│    ├─ POST /api/kyc/xac-thuc                               │
│    ├─ GET  /api/kyc/lich-su/:nguoiDungId                   │
│    └─ PUT  /api/kyc/duyet/:kycId                           │
│                                                             │
│  🎛️ Controller: KYCController.js                           │
│    ├─ xacThucKYC()      - Nhận data từ frontend           │
│    ├─ getLichSuKYC()    - Lấy lịch sử xác thực           │
│    └─ duyetKYC()        - Admin duyệt KYC                 │
│                                                             │
│  💼 Service: KYCService.js                                  │
│    ├─ validateCCCDData() - Validate thông tin CCCD        │
│    ├─ saveImages()       - Lưu ảnh lên disk/MinIO        │
│    └─ updateNguoiDung()  - Cập nhật bảng nguoidung       │
│                                                             │
│  📦 Middleware: uploadMiddleware.js                         │
│    └─ multer upload (max 5MB, jpg/png only)               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL/MariaDB)                   │
├─────────────────────────────────────────────────────────────┤
│  📊 Bảng: nguoidung                                         │
│    ├─ TenDayDu          (UPDATE từ OCR)                    │
│    ├─ NgaySinh          (UPDATE từ OCR)                    │
│    ├─ DiaChi            (UPDATE từ OCR)                    │
│    ├─ SoCCCD            (UPDATE từ OCR)                    │
│    ├─ NgayCapCCCD       (UPDATE từ OCR)                    │
│    ├─ AnhCCCDMatTruoc   (NEW - đường dẫn ảnh)             │
│    ├─ AnhCCCDMatSau     (NEW - đường dẫn ảnh)             │
│    ├─ AnhSelfie         (NEW - đường dẫn ảnh)             │
│    └─ TrangThaiXacMinh  (UPDATE: ChuaXacMinh→ChoDuyet)    │
│                                                             │
│  📊 Bảng: kyc_verification (NEW TABLE)                      │
│    ├─ KYCVerificationID (PK)                               │
│    ├─ NguoiDungID       (FK → nguoidung)                   │
│    ├─ SoCCCD, TenDayDu, NgaySinh, DiaChi                  │
│    ├─ FaceSimilarity    (0.0-1.0)                         │
│    ├─ TrangThai         (ThanhCong/ThatBai/CanXemLai)     │
│    ├─ LyDoThatBai       (Text)                            │
│    ├─ AnhCCCDMatTruoc, AnhCCCDMatSau, AnhSelfie           │
│    └─ TaoLuc                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  FILE STORAGE (Local Disk)                  │
│    server/uploads/kyc/                                      │
│      ├─ cccd_front/     (Ảnh CCCD mặt trước)              │
│      ├─ cccd_back/      (Ảnh CCCD mặt sau)                │
│      └─ selfie/         (Ảnh selfie)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies & External Resources

### 1. NPM Packages

#### Frontend (`client/package.json`)
```json
{
  "dependencies": {
    "tesseract.js": "^5.1.0",
    "face-api.js": "^0.22.2",
    "react-webcam": "^7.2.0",
    "framer-motion": "^10.16.4",
    "axios": "^1.6.0"
  }
}
```

**Cài đặt:**
```bash
cd client
npm install tesseract.js@5.1.0 face-api.js@0.22.2 react-webcam@7.2.0 framer-motion@10.16.4
```

#### Backend (`server/package.json`)
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0"
  }
}
```

**Cài đặt:**
```bash
cd server
npm install multer@1.4.5-lts.1 sharp@0.33.0
```

---

### 2. Model Files (BẮT BUỘC tải trước)

#### A. Tesseract.js Language Data
**File:** `vie.traineddata.gz` (11.2 MB)  
**Source:** https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/vie.traineddata.gz  
**Đặt tại:** `client/public/tessdata/vie.traineddata.gz`

**Lệnh tải:**
```bash
# Windows PowerShell
cd client/public
New-Item -ItemType Directory -Force -Path tessdata
Invoke-WebRequest -Uri "https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/vie.traineddata.gz" -OutFile "tessdata/vie.traineddata.gz"
```

---

#### B. Face-api.js Models (4 files bắt buộc)
**Source:** https://github.com/justadudewhohacks/face-api.js/tree/master/weights  
**Đặt tại:** `client/public/models/`

**Chi tiết các file cần tải:**

| File | Size | Description |
|------|------|-------------|
| `ssd_mobilenetv1_model-weights_manifest.json` | 1 KB | Face detection model config |
| `ssd_mobilenetv1_model-shard1` | 5.4 MB | Face detection weights |
| `face_landmark_68_model-weights_manifest.json` | 1 KB | Facial landmarks config |
| `face_landmark_68_model-shard1` | 350 KB | Facial landmarks weights |
| `face_recognition_model-weights_manifest.json` | 1 KB | Face recognition config |
| `face_recognition_model-shard1` | 6.2 MB | Face recognition weights |
| `tiny_face_detector_model-weights_manifest.json` | 1 KB | Tiny detector config |
| `tiny_face_detector_model-shard1` | 190 KB | Tiny detector weights |

**Lệnh tải (Windows PowerShell):**
```powershell
cd client/public
New-Item -ItemType Directory -Force -Path models

# Download face detection model
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-weights_manifest.json" -OutFile "models/ssd_mobilenetv1_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard1" -OutFile "models/ssd_mobilenetv1_model-shard1"

# Download face landmark model
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json" -OutFile "models/face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1" -OutFile "models/face_landmark_68_model-shard1"

# Download face recognition model
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-weights_manifest.json" -OutFile "models/face_recognition_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1" -OutFile "models/face_recognition_model-shard1"

# Download tiny face detector model
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json" -OutFile "models/tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1" -OutFile "models/tiny_face_detector_model-shard1"
```

**Cấu trúc thư mục sau khi tải:**
```
client/public/
├── models/
│   ├── ssd_mobilenetv1_model-weights_manifest.json
│   ├── ssd_mobilenetv1_model-shard1
│   ├── face_landmark_68_model-weights_manifest.json
│   ├── face_landmark_68_model-shard1
│   ├── face_recognition_model-weights_manifest.json
│   ├── face_recognition_model-shard1
│   ├── tiny_face_detector_model-weights_manifest.json
│   └── tiny_face_detector_model-shard1
└── tessdata/
    └── vie.traineddata.gz
```

---

## 🗄️ Database Migration

### Migration SQL Script

**File:** `migrations/20251122_add_kyc_tables.sql`

```sql
-- =====================================================
-- Migration: Thêm tính năng KYC CCCD
-- Date: 2025-11-22
-- Author: Development Team
-- Description: Thêm các cột và bảng cần thiết cho KYC
-- =====================================================

USE thue_tro;

-- =====================================================
-- BƯỚC 1: Thêm cột vào bảng nguoidung
-- =====================================================
ALTER TABLE nguoidung 
ADD COLUMN AnhCCCDMatTruoc VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt trước' AFTER NoiCapCCCD,
ADD COLUMN AnhCCCDMatSau VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt sau' AFTER AnhCCCDMatTruoc,
ADD COLUMN AnhSelfie VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh selfie xác thực' AFTER AnhCCCDMatSau;

-- =====================================================
-- BƯỚC 2: Tạo bảng lịch sử xác thực KYC
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_verification (
  KYCVerificationID BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID xác thực KYC',
  NguoiDungID INT NOT NULL COMMENT 'ID người dùng (FK)',
  
  -- Thông tin CCCD trích xuất từ OCR
  SoCCCD VARCHAR(12) DEFAULT NULL COMMENT 'Số CCCD (12 số)',
  TenDayDu VARCHAR(255) DEFAULT NULL COMMENT 'Họ tên từ CCCD',
  NgaySinh DATE DEFAULT NULL COMMENT 'Ngày sinh',
  DiaChi VARCHAR(255) DEFAULT NULL COMMENT 'Địa chỉ thường trú',
  NgayCapCCCD DATE DEFAULT NULL COMMENT 'Ngày cấp CCCD',
  
  -- Kết quả Face Matching
  FaceSimilarity DECIMAL(5,4) DEFAULT NULL COMMENT 'Độ tương đồng khuôn mặt (0.0000 - 1.0000)',
  
  -- Trạng thái xác thực
  TrangThai ENUM('ThanhCong', 'ThatBai', 'CanXemLai') NOT NULL DEFAULT 'CanXemLai' COMMENT 'Trạng thái: Thành công/Thất bại/Cần xem lại',
  LyDoThatBai TEXT DEFAULT NULL COMMENT 'Lý do thất bại (nếu có)',
  
  -- Đường dẫn ảnh
  AnhCCCDMatTruoc VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt trước',
  AnhCCCDMatSau VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh CCCD mặt sau',
  AnhSelfie VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn ảnh selfie',
  
  -- Metadata
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo',
  CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật',
  
  -- Foreign Key
  FOREIGN KEY (NguoiDungID) REFERENCES nguoidung(NguoiDungID) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_nguoidung (NguoiDungID),
  INDEX idx_trangthai (TrangThai),
  INDEX idx_taoluc (TaoLuc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Bảng lưu lịch sử xác thực KYC';

-- =====================================================
-- BƯỚC 3: Insert audit log
-- =====================================================
INSERT INTO nhatkyhoatdong (
  NguoiDungID, 
  HanhDong, 
  ChiTiet, 
  IPAddress, 
  UserAgent
) VALUES (
  1, -- System admin
  'MIGRATION',
  'Thêm tính năng KYC CCCD - Migration 20251122',
  '127.0.0.1',
  'MySQL Migration Script'
);

-- =====================================================
-- Hoàn thành migration
-- =====================================================
SELECT 'Migration completed successfully!' AS status;
```

**Chạy migration:**
```bash
# Import vào MySQL
mysql -u root -p thue_tro < migrations/20251122_add_kyc_tables.sql
```

---

## 📁 Cấu trúc File & Folder

### Frontend Structure
```
client/src/
├── pages/
│   └── XacThucKYC/
│       ├── XacThucKYC.jsx          # Main page - KYC flow
│       ├── XacThucKYC.css          # Styles
│       └── README.md               # Component documentation
│
├── components/
│   └── KYC/
│       ├── CameraCapture.jsx       # Camera component với react-webcam
│       ├── CameraCapture.css       # Camera styles
│       ├── PreviewKYC.jsx          # Preview thông tin trước khi submit
│       ├── PreviewKYC.css          # Preview styles
│       └── LoadingProgress.jsx     # Progress indicator (OCR + Face matching)
│
├── services/
│   ├── KYCService.js              # API calls cho KYC
│   ├── OCRService.js              # Tesseract.js wrapper
│   └── FaceMatchingService.js     # Face-api.js wrapper
│
└── utils/
    ├── cccdParser.js              # Parse OCR text → structured data
    ├── imageValidator.js          # Validate ảnh (size, format, quality)
    └── faceDetectionHelper.js     # Face detection utilities
```

### Backend Structure
```
server/
├── api/
│   └── KYC/
│       └── kycRoutes.js           # Routes: POST /xac-thuc, GET /lich-su, etc.
│
├── controllers/
│   └── KYCController.js           # HTTP handlers
│
├── services/
│   └── KYCService.js              # Business logic
│
├── models/
│   └── KYCModel.js                # Database queries (mysql2)
│
├── middleware/
│   ├── uploadKYC.js               # Multer config cho KYC upload
│   └── validateKYC.js             # Validate KYC data
│
├── utils/
│   ├── cccdValidator.js           # Validate số CCCD, ngày sinh, etc.
│   └── imageProcessor.js          # Sharp image processing
│
└── uploads/
    └── kyc/
        ├── cccd_front/            # Ảnh CCCD mặt trước
        ├── cccd_back/             # Ảnh CCCD mặt sau
        └── selfie/                # Ảnh selfie
```

---

## ⚙️ Environment Configuration

### Frontend Environment Variables
**File:** `client/.env`

```env
# API Endpoints
VITE_API_BASE_URL=http://localhost:5000
VITE_KYC_API_URL=http://localhost:5000/api/kyc

# OCR Settings
VITE_TESSERACT_LANG=vie
VITE_TESSERACT_LANG_PATH=/tessdata
VITE_TESSERACT_WORKER_PATH=/node_modules/tesseract.js/dist/worker.min.js

# Face API Settings
VITE_FACE_API_MODELS_PATH=/models
VITE_FACE_SIMILARITY_THRESHOLD=0.6

# Image Upload Settings
VITE_MAX_IMAGE_SIZE=5242880              # 5MB in bytes
VITE_ALLOWED_IMAGE_FORMATS=jpg,jpeg,png
```

### Backend Environment Variables
**File:** `server/.env`

```env
# Existing variables...
# ...

# =====================================================
# KYC Configuration
# =====================================================

# Upload paths
KYC_UPLOAD_PATH=./uploads/kyc
KYC_CCCD_FRONT_PATH=./uploads/kyc/cccd_front
KYC_CCCD_BACK_PATH=./uploads/kyc/cccd_back
KYC_SELFIE_PATH=./uploads/kyc/selfie

# File upload limits
KYC_MAX_FILE_SIZE=5242880                # 5MB in bytes
KYC_ALLOWED_FORMATS=jpg,jpeg,png
KYC_MAX_FILES_PER_REQUEST=3              # Front + Back + Selfie

# Validation thresholds
KYC_FACE_SIMILARITY_THRESHOLD=0.60       # Minimum 60% similarity
KYC_MIN_IMAGE_WIDTH=640                  # Minimum 640px width
KYC_MIN_IMAGE_HEIGHT=480                 # Minimum 480px height

# CCCD Validation
KYC_CCCD_LENGTH=12                       # CCCD mới có 12 số
KYC_CCCD_OLD_LENGTH=9                    # CMND cũ có 9 số
KYC_MIN_AGE=14                           # Tuổi tối thiểu để có CCCD

# Auto-approval settings
KYC_AUTO_APPROVE=false                   # Tự động duyệt KYC nếu đạt threshold
KYC_AUTO_APPROVE_THRESHOLD=0.85          # Threshold để auto-approve

# Retry settings
KYC_MAX_RETRY_ATTEMPTS=3                 # Số lần retry tối đa
KYC_RETRY_COOLDOWN=300                   # Cooldown 5 phút (giây)
```

---

## 🔐 Security & Privacy

### 1. Data Privacy
- ✅ **Client-side processing:** OCR và Face Matching chạy trên browser → ảnh không gửi lên third-party
- ✅ **HTTPS required:** Camera API chỉ hoạt động trên HTTPS (hoặc localhost)
- ✅ **Data retention:** Ảnh xóa sau 30 ngày nếu KYC thất bại
- ✅ **Access control:** Chỉ user và admin có quyền xem ảnh KYC

### 2. Security Measures
```javascript
// Backend validation
const validateKYCRequest = (req, res, next) => {
  // 1. Check JWT token
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 2. Check rate limiting (max 3 attempts/5 minutes)
  const attempts = await getKYCAttempts(req.user.id);
  if (attempts >= 3) {
    return res.status(429).json({ 
      error: 'Quá nhiều lần thử. Vui lòng đợi 5 phút.' 
    });
  }
  
  // 3. Validate file types
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(req.files.cccdFront.mimetype)) {
    return res.status(400).json({ error: 'File type không hợp lệ' });
  }
  
  next();
};
```

### 3. GDPR Compliance
- ✅ User consent trước khi chụp ảnh
- ✅ Right to delete: User có thể xóa ảnh KYC
- ✅ Data encryption at rest (nếu production)
- ✅ Audit log mọi truy cập vào ảnh KYC

---

## 🎨 UI/UX Flow

### Step-by-step User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Giới thiệu                                          │
│  "Để xác thực danh tính, bạn cần chụp ảnh CCCD và selfie"  │
│  [Button: Bắt đầu xác thực]                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Hướng dẫn chụp CCCD                                 │
│  ✓ Đặt CCCD trên nền trơn, tối màu                          │
│  ✓ Chụp từ trên xuống, vuông góc                            │
│  ✓ CCCD chiếm 70-80% khung hình                             │
│  ✓ Không bị lóa, mờ, nghiêng                                │
│  [Button: Tiếp tục]                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Chụp CCCD mặt trước                                 │
│  ┌────────────────────────┐                                 │
│  │   CAMERA PREVIEW       │                                 │
│  │   (React Webcam)       │                                 │
│  │   [Overlay: Khung CCCD]│                                 │
│  └────────────────────────┘                                 │
│  [Button: 📷 Chụp ảnh]  [Button: 🔄 Chụp lại]             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Chụp CCCD mặt sau                                   │
│  (Tương tự STEP 3)                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Chụp selfie                                         │
│  "Hướng mặt thẳng vào camera, ánh sáng tốt"                 │
│  ┌────────────────────────┐                                 │
│  │   CAMERA PREVIEW       │                                 │
│  │   [Overlay: Khung mặt] │                                 │
│  └────────────────────────┘                                 │
│  [Button: 📷 Chụp ảnh]                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Đang xử lý...                                       │
│  ⏳ Đang quét thông tin CCCD... [████████░░] 80%            │
│  ⏳ Đang đối chiếu khuôn mặt... [████░░░░░░] 40%            │
│  (Thời gian ước tính: 8-12 giây)                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Xem lại thông tin                                   │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Số CCCD:        079193012345                    │        │
│  │ Họ tên:         NGUYỄN VĂN A                    │        │
│  │ Ngày sinh:      01/01/1990                       │        │
│  │ Địa chỉ:        123 ABC, Q1, TP.HCM             │        │
│  │ Ngày cấp:       01/01/2020                       │        │
│  │                                                   │        │
│  │ Độ khớp khuôn mặt: 85% ✅                        │        │
│  └─────────────────────────────────────────────────┘        │
│  [Button: ✏️ Sửa thông tin]  [Button: ✅ Xác nhận]        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Hoàn thành                                          │
│  ✅ Xác thực thành công!                                    │
│  "Thông tin của bạn đang chờ admin duyệt"                   │
│  [Button: Quay về trang chủ]                                │
└─────────────────────────────────────────────────────────────┘
```

### 🌟 Visual Design & Animation Concepts (Mới)

**1. Giao diện Quét (Scanning Interface):**
- **Khung quét (Scanning Frame):**
  - Bo tròn 4 góc, tỷ lệ chuẩn thẻ CCCD.
  - **Hiệu ứng viền:** Sử dụng các **vòng tròn gradient cong** (Curved Gradient Circles) bao quanh khung.
  - **Màu sắc:** Gradient chuyển màu mượt mà (Cyan → Blue → Purple) chạy dọc theo viền.
  - **Animation:** Hiệu ứng "Breathing" (thở) nhẹ nhàng hoặc xoay chậm để báo hiệu hệ thống đang hoạt động.

**2. Hiệu ứng Xác thực Thành công (Success Interaction):**
- **Trigger:** Khi OCR nhận diện đủ thông tin hoặc Face Matching đạt chuẩn.
- **Animation:**
  - Các vòng tròn gradient **phát sáng mạnh** (Glow effect).
  - **Lan tỏa dần** ra toàn bộ màn hình (Ripple/Pulse effect) như sóng nước.
  - Chuyển màu từ Gradient sang Xanh lá (Success Green).
- **Feedback:**
  - **Pop-up Icon:** Một dấu tích (Checkmark) xuất hiện từ giữa màn hình với hiệu ứng nảy (Bounce).
  - Haptic feedback (rung nhẹ) trên mobile.

**3. Tech Stack cho Animation:**
- **CSS:** `keyframes`, `backdrop-filter`, `conic-gradient`.
- **Library:** `framer-motion` (React) để xử lý complex transitions.

---

## 🧪 Testing Strategy

### 1. Unit Tests

#### Frontend Tests (`client/src/__tests__/`)
```javascript
// OCRService.test.js
describe('OCRService', () => {
  it('should extract CCCD number correctly', () => {
    const text = 'Số: 079193012345\nHọ tên: NGUYỄN VĂN A';
    const result = parseCCCDText(text);
    expect(result.soCCCD).toBe('079193012345');
  });
  
  it('should handle invalid CCCD format', () => {
    const text = 'Invalid text';
    const result = parseCCCDText(text);
    expect(result.soCCCD).toBeNull();
  });
});

// FaceMatchingService.test.js
describe('FaceMatchingService', () => {
  it('should return similarity score', async () => {
    const score = await compareFaces(imageA, imageB);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

#### Backend Tests (`server/__tests__/`)
```javascript
// KYCController.test.js
describe('POST /api/kyc/xac-thuc', () => {
  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .post('/api/kyc/xac-thuc')
      .send({});
    expect(res.status).toBe(401);
  });
  
  it('should create KYC verification record', async () => {
    const res = await request(app)
      .post('/api/kyc/xac-thuc')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('cccdFront', 'test/fixtures/cccd_front.jpg')
      .attach('cccdBack', 'test/fixtures/cccd_back.jpg')
      .attach('selfie', 'test/fixtures/selfie.jpg')
      .field('soCCCD', '079193012345')
      .field('tenDayDu', 'NGUYỄN VĂN A');
    
    expect(res.status).toBe(200);
    expect(res.body.kycId).toBeDefined();
  });
});
```

---

### 2. Integration Tests

#### Test Scenarios
```markdown
## Scenario 1: Happy Path (100% Success)
1. User chụp CCCD mặt trước (ảnh rõ, đúng format)
2. User chụp CCCD mặt sau (ảnh rõ, đúng format)
3. User chụp selfie (mặt thẳng, ánh sáng tốt)
4. OCR trích xuất thành công 100% fields
5. Face similarity = 0.92 (> 0.6 threshold) ✅
6. Data được lưu vào DB, TrangThaiXacMinh = 'ChoDuyet'

Expected: ✅ Pass

## Scenario 2: OCR thất bại (ảnh mờ)
1. User chụp CCCD mờ/nghiêng
2. OCR chỉ trích xuất được 30% thông tin
3. Hiển thị lỗi: "Ảnh không đủ rõ, vui lòng chụp lại"

Expected: ❌ Yêu cầu chụp lại

## Scenario 3: Face mismatch
1. OCR thành công
2. Face similarity = 0.45 (< 0.6 threshold)
3. Hiển thị lỗi: "Khuôn mặt không khớp với CCCD"

Expected: ❌ Yêu cầu chụp selfie lại

## Scenario 4: CCCD không hợp lệ
1. OCR trích xuất số CCCD = "123456789" (9 số - CMND cũ)
2. Hệ thống accept (vẫn hợp lệ)
3. Hoặc số CCCD = "ABC123" (không phải số)
4. Hiển thị lỗi: "Số CCCD không hợp lệ"

Expected: ❌ Yêu cầu kiểm tra lại

## Scenario 5: Rate limiting
1. User thử KYC lần 1: Thất bại
2. User thử KYC lần 2: Thất bại
3. User thử KYC lần 3: Thất bại
4. User thử KYC lần 4: Bị block
5. Hiển thị: "Quá nhiều lần thử. Vui lòng đợi 5 phút"

Expected: ❌ HTTP 429 (Too Many Requests)
```

---

### 3. Performance Tests

#### Benchmarks
| Metric | Target | Measured |
|--------|--------|----------|
| OCR processing time | < 5s | TBD |
| Face detection time | < 2s | TBD |
| Total end-to-end time | < 15s | TBD |
| Success rate (good quality images) | > 80% | TBD |
| Face matching accuracy | > 90% | TBD |
| Browser memory usage | < 200MB | TBD |

---

### 4. Manual Testing Checklist

**QA tester cần test:**

- [ ] Camera permission prompt hiển thị đúng
- [ ] Camera switch (front/back) hoạt động
- [ ] Chụp ảnh và preview đúng
- [ ] Loading indicator hiển thị trong quá trình OCR
- [ ] OCR trích xuất đúng thông tin (test với 5+ CCCD khác nhau)
- [ ] Face matching cho kết quả hợp lý
- [ ] Form validation hoạt động (số CCCD, ngày sinh, etc.)
- [ ] Error messages hiển thị đúng
- [ ] Responsive design (mobile + desktop)
- [ ] Upload ảnh thành công lên server
- [ ] Database update đúng
- [ ] Admin có thể xem lịch sử KYC
- [ ] User có thể retry sau khi thất bại
- [ ] Rate limiting hoạt động (3 attempts/5 min)

---

## 📊 Success Metrics (KPI)

### Technical Metrics
- **OCR Accuracy:** ≥ 70% (trích xuất đúng ≥ 5/7 trường)
- **Face Matching Accuracy:** ≥ 85% (similarity score)
- **Processing Time:** < 15 giây (end-to-end)
- **Success Rate:** ≥ 75% (first-time success)
- **Error Rate:** < 10% (system errors)

### Business Metrics
- **User Adoption:** ≥ 60% users hoàn thành KYC trong 7 ngày
- **Manual Review Rate:** < 30% (cần admin xem lại)
- **Time Saved:** 80% giảm thời gian xác thực so với manual
- **User Satisfaction:** ≥ 4.0/5.0 (survey)

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] NPM packages đã install đầy đủ
- [ ] Model files đã tải và đặt đúng vị trí
- [ ] Database migration đã chạy thành công
- [ ] Environment variables đã cấu hình đúng
- [ ] Upload folders đã tạo với permissions đúng
- [ ] Unit tests pass 100%
- [ ] Integration tests pass 100%
- [ ] Manual testing checklist hoàn thành
- [ ] Code review approved
- [ ] Documentation đã update

### Deployment Steps
1. **Backup database** trước khi migrate
2. **Chạy migration** trên production DB
3. **Deploy backend** lên server
4. **Deploy frontend** lên CDN/static hosting
5. **Verify model files** đã được deploy
6. **Test trên staging environment** trước
7. **Smoke test** trên production
8. **Monitor logs** trong 24h đầu

### Post-deployment
- [ ] Smoke test: User có thể chụp ảnh và submit
- [ ] Check logs: Không có errors
- [ ] Performance monitoring: Response time < 15s
- [ ] Database: Records được tạo đúng
- [ ] Upload folder: Ảnh được lưu đúng
- [ ] Rollback plan prepared (nếu có vấn đề)

---

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Camera không hoạt động
**Lỗi:** `NotAllowedError: Permission denied`

**Nguyên nhân:**
- User từ chối quyền camera
- Browser không hỗ trợ getUserMedia
- Không chạy trên HTTPS (production)

**Giải pháp:**
```javascript
// Detect và hiển thị error message
navigator.mediaDevices.getUserMedia({ video: true })
  .catch(err => {
    if (err.name === 'NotAllowedError') {
      alert('Vui lòng cho phép truy cập camera');
    } else if (err.name === 'NotFoundError') {
      alert('Không tìm thấy camera');
    } else {
      alert('Lỗi camera: ' + err.message);
    }
  });
```

---

#### 2. Models không load được
**Lỗi:** `Failed to load model from /models/...`

**Nguyên nhân:**
- Files không tồn tại trong `public/models/`
- Path không đúng
- CORS issue

**Giải pháp:**
```javascript
// Check file existence trước khi load
const checkModels = async () => {
  const modelPath = '/models/ssd_mobilenetv1_model-weights_manifest.json';
  try {
    const res = await fetch(modelPath);
    if (!res.ok) {
      console.error('Model file not found:', modelPath);
      alert('Lỗi: Thiếu model files. Vui lòng liên hệ admin.');
    }
  } catch (err) {
    console.error('Cannot load models:', err);
  }
};
```

---

#### 3. OCR không trích xuất được thông tin
**Lỗi:** OCR trả về text rỗng hoặc sai

**Nguyên nhân:**
- Ảnh quá mờ/tối
- Ảnh bị nghiêng > 15°
- CCCD bị lóa sáng
- Tesseract chưa load xong

**Giải pháp:**
```javascript
// Pre-process ảnh trước khi OCR
const preprocessImage = async (imageFile) => {
  // 1. Resize về 1280x720 (tăng tốc)
  // 2. Tăng contrast
  // 3. Convert to grayscale
  // 4. Sharpen
  return processedImage;
};

// Validate kết quả OCR
const validateOCRResult = (text) => {
  if (!text || text.length < 50) {
    throw new Error('OCR không đọc được thông tin. Vui lòng chụp lại ảnh rõ hơn.');
  }
};
```

---

#### 4. Face matching luôn fail
**Lỗi:** Similarity score luôn < 0.6

**Nguyên nhân:**
- Ảnh selfie bị tối/sáng quá
- Face không detect được
- Góc chụp sai (profile thay vì frontal)

**Giải pháp:**
```javascript
// Validate face detection trước khi matching
const detectFace = async (imageEl) => {
  const detection = await faceapi
    .detectSingleFace(imageEl)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    throw new Error('Không phát hiện được khuôn mặt. Vui lòng chụp lại.');
  }
  
  return detection;
};
```

---

#### 5. Upload ảnh lên server thất bại
**Lỗi:** `ENOENT: no such file or directory`

**Nguyên nhân:**
- Upload folder chưa được tạo
- Permissions không đủ

**Giải pháp:**
```bash
# Tạo folders với permissions đúng
mkdir -p server/uploads/kyc/{cccd_front,cccd_back,selfie}
chmod 755 server/uploads/kyc/
```

---

## 📞 Support & Contacts

### Technical Support
- **Lead Developer:** [Tên developer]
- **Email:** dev@example.com
- **Slack:** #kyc-implementation

### Issue Tracking
- **JIRA:** [Link to JIRA board]
- **GitHub Issues:** [Link to GitHub]

### Documentation
- **API Docs:** `/docs/api/kyc.md`
- **Component Docs:** `/client/src/pages/XacThucKYC/README.md`
- **Database Schema:** `/docs/database_schema.md`

---

## 📚 References & Resources

### Official Documentation
- **Tesseract.js:** https://tesseract.projectnaptha.com/
- **Face-api.js:** https://github.com/justadudewhohacks/face-api.js
- **React Webcam:** https://github.com/mozmorris/react-webcam

### Vietnamese CCCD Format
- **CCCD Layout:** https://docs-vision.fpt.ai/en/ekyc/III-integration/III-2-APIs/b-APIs%20of%20AI%20Engine/vnm-id
- **CCCD Validation Rules:** [Thông tư số 59/2019/TT-BCA]

### Best Practices
- **OCR Best Practices:** https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html
- **Face Recognition Best Practices:** https://medium.com/@ageitgey/machine-learning-is-fun-part-4-modern-face-recognition-with-deep-learning-c3cffc121d78

---

## 📝 Changelog

### Version 1.0.0 (2025-11-22)
- ✅ Initial implementation
- ✅ Tesseract.js OCR integration
- ✅ Face-api.js face matching
- ✅ React Webcam camera capture
- ✅ Backend API endpoints
- ✅ Database migration
- ✅ Full documentation

### Planned Features (Future Versions)
- [ ] **v1.1:** Liveness detection (chống fake ảnh)
- [ ] **v1.2:** NFC chip reading (CCCD gắn chip)
- [ ] **v1.3:** Auto-approve nếu similarity > 85%
- [ ] **v1.4:** Export báo cáo KYC (Excel/PDF)
- [ ] **v1.5:** Tích hợp FPT AI eKYC (phương án upgrade)

---

## ✅ READY TO IMPLEMENT

Tài liệu này cung cấp **TẤT CẢ thông tin cần thiết** để triển khai tính năng KYC CCCD.

**Bước tiếp theo:**
1. Review tài liệu này với team
2. Confirm requirements & scope
3. Bắt đầu implementation theo các bước:
   - ✅ Setup dependencies & models
   - ✅ Database migration
   - ✅ Backend API implementation
   - ✅ Frontend components
   - ✅ Integration & testing

**Estimated Timeline:** 3-5 ngày (1 developer full-time)

---

*Document created: 2025-11-22*  
*Last updated: 2025-11-22*  
*Version: 1.0.0*
