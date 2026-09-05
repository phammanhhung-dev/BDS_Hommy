# 📄 Word Document Generator - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Hệ thống tạo file Word (.docx) với đầy đủ tính năng, sử dụng Python script `python-docx` và Node.js service wrapper.

## 🏗️ Kiến Trúc

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│  API Endpoint   │
│  Express.js     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DocxGenerator  │
│  Service        │
└────────┬────────┘
         │ Execute
         ▼
┌─────────────────┐
│  Python Script  │
│  create_docx.py │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  .docx File     │
└─────────────────┘
```

## 📁 Cấu Trúc Files

```
project/
├── scripts/
│   ├── create_docx.py              # Python script chính
│   ├── example_docx_config.json    # Ví dụ config
│   ├── test_docx_service.js        # Test Node.js service
│   └── README_DOCX.md             # Docs Python script
├── server/
│   ├── services/
│   │   └── DocxGeneratorService.js # Node.js service
│   ├── controllers/
│   │   └── DocxController.js       # API controller
│   └── routes/
│       └── docxRoutes.js           # API routes
└── docs/
    └── DOCX_GENERATOR_GUIDE.md     # File này
```

## 🚀 Cài Đặt

### 1. Cài đặt Python dependencies

```bash
pip install python-docx
```

### 2. Kiểm tra cài đặt

```bash
# Test Python script
python scripts/create_docx.py --title "Test" --content "Hello" --output test.docx

# Test Node.js service
node scripts/test_docx_service.js
```

## 📖 Sử Dụng

### 1. Sử Dụng Python Script Trực Tiếp

#### Tạo document đơn giản:

```bash
python scripts/create_docx.py \
  --title "Báo Cáo" \
  --content "Nội dung báo cáo" \
  --output report.docx
```

#### Tạo document từ JSON file:

```bash
python scripts/create_docx.py \
  --json scripts/example_docx_config.json \
  --output output.docx
```

#### Tạo document từ JSON string:

```bash
python scripts/create_docx.py \
  --json '{"title":"Test","sections":[{"type":"paragraph","text":"Hello"}]}' \
  --output test.docx
```

### 2. Sử Dụng Node.js Service

```javascript
const DocxGeneratorService = require('./server/services/DocxGeneratorService');

// Tạo document đơn giản
await DocxGeneratorService.createSimpleDocx(
  'Tiêu đề',
  'Nội dung',
  'output.docx'
);

// Tạo báo cáo hiệu suất
await DocxGeneratorService.taoBaoCaoHieuSuatChuDuAn(data, 'report.docx');

// Tạo hợp đồng
await DocxGeneratorService.taoHopDongThuePhong(hopDong, 'contract.docx');

// Tạo báo cáo thu chi
await DocxGeneratorService.taoBaoCaoThuChi(data, 'finance.docx');

// Tạo custom document
await DocxGeneratorService.createDocx(config, 'custom.docx');
```

### 3. Sử Dụng API Endpoints

#### Tạo báo cáo hiệu suất:

```bash
POST /api/docx/bao-cao-hieu-suat/:chuDuAnId
```

**Response:** File .docx để download

#### Tạo hợp đồng:

```bash
POST /api/docx/hop-dong/:hopDongId
```

**Response:** File .docx để download

#### Tạo báo cáo thu chi:

```bash
POST /api/docx/bao-cao-thu-chi
Content-Type: application/json

{
  "kyBaoCao": "Tháng 11/2025",
  "tuNgay": "01/11/2025",
  "denNgay": "30/11/2025"
}
```

**Response:** File .docx để download

#### Tạo document tùy chỉnh:

```bash
POST /api/docx/custom
Content-Type: application/json

{
  "config": {
    "title": "Tiêu đề",
    "sections": [
      {
        "type": "paragraph",
        "text": "Nội dung"
      }
    ]
  }
}
```

**Response:** File .docx để download

## 🎨 JSON Config Format

### Cấu trúc cơ bản:

```json
{
  "title": "Tiêu đề chính",
  "sections": [
    // Array of section objects
  ]
}
```

### Các loại Section:

#### 1. Heading (Tiêu đề)

```json
{
  "type": "heading1",  // heading1, heading2, heading3
  "text": "Tiêu đề"
}
```

#### 2. Paragraph (Đoạn văn)

```json
{
  "type": "paragraph",
  "text": "Nội dung",
  "bold": false,
  "italic": false,
  "underline": false,
  "font_size": 12,
  "color": "#000000",
  "align": "left"  // left, center, right, justify
}
```

#### 3. List (Danh sách)

```json
{
  "type": "list",  // hoặc "numbered_list"
  "items": ["Item 1", "Item 2", "Item 3"]
}
```

#### 4. Table (Bảng)

```json
{
  "type": "table",
  "headers": ["Cột 1", "Cột 2", "Cột 3"],
  "rows": [
    ["Dữ liệu 1", "Dữ liệu 2", "Dữ liệu 3"],
    ["Dữ liệu 4", "Dữ liệu 5", "Dữ liệu 6"]
  ]
}
```

#### 5. Image (Ảnh)

```json
{
  "type": "image",
  "path": "path/to/image.png",
  "width": 6  // inches
}
```

#### 6. Link (Hyperlink)

```json
{
  "type": "link",
  "text": "Click here",
  "url": "https://example.com"
}
```

#### 7. Page Break (Ngắt trang)

```json
{
  "type": "page_break"
}
```

## 💻 Tích Hợp Frontend

### React Component Example:

```jsx
import React from 'react';
import axios from 'axios';

function BaoCaoHieuSuatButton({ chuDuAnId }) {
  const handleDownload = async () => {
    try {
      const response = await axios.post(
        `/api/docx/bao-cao-hieu-suat/${chuDuAnId}`,
        {},
        { responseType: 'blob' }
      );
      
      // Tạo link download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCaoHieuSuat_${chuDuAnId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Tải báo cáo thành công!');
    } catch (error) {
      console.error('Lỗi tải báo cáo:', error);
      alert('Có lỗi xảy ra khi tải báo cáo');
    }
  };

  return (
    <button onClick={handleDownload}>
      Tải Báo Cáo Word
    </button>
  );
}

export default BaoCaoHieuSuatButton;
```

### Tạo document tùy chỉnh từ frontend:

```jsx
async function taoDocumentTuyChon() {
  const config = {
    title: 'Báo Cáo Tùy Chỉnh',
    sections: [
      { type: 'heading1', text: 'Phần 1' },
      { type: 'paragraph', text: 'Nội dung phần 1' },
      {
        type: 'table',
        headers: ['Tên', 'Giá'],
        rows: [
          ['Sản phẩm A', '100,000'],
          ['Sản phẩm B', '200,000']
        ]
      }
    ]
  };

  const response = await axios.post(
    '/api/docx/custom',
    { config },
    { responseType: 'blob' }
  );

  // Download file
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'document.docx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

## 🔧 Đăng Ký Routes

Thêm vào `server/server.js` hoặc main app file:

```javascript
const docxRoutes = require('./routes/docxRoutes');

// ... other code ...

app.use('/api/docx', docxRoutes);
```

## 📝 Use Cases Thực Tế

### 1. Báo Cáo Hiệu Suất Chủ Dự Án

**Mục đích:** Export báo cáo tổng hợp hiệu suất của chủ dự án để gửi cho quản lý hoặc lưu trữ.

**Cách dùng:**
- Frontend: Nút "Tải Báo Cáo" trong trang Thống Kê
- API: `POST /api/docx/bao-cao-hieu-suat/:chuDuAnId`

**Dữ liệu cần thiết:**
- Thông tin chủ dự án
- Thống kê tin đăng
- Doanh thu theo tháng
- Thống kê cuộc hẹn

### 2. Hợp Đồng Thuê Phòng

**Mục đích:** Tạo hợp đồng chính thức để ký kết giữa chủ nhà và người thuê.

**Cách dùng:**
- Frontend: Nút "Xuất Hợp Đồng" trong trang Chi Tiết Hợp Đồng
- API: `POST /api/docx/hop-dong/:hopDongId`

**Dữ liệu cần thiết:**
- Thông tin chủ nhà (tên, CMND, SĐT, địa chỉ)
- Thông tin người thuê (tên, CMND, SĐT, địa chỉ)
- Thông tin phòng (địa chỉ, diện tích, giá thuê)
- Thời hạn hợp đồng
- Trách nhiệm các bên

### 3. Báo Cáo Thu Chi

**Mục đích:** Tạo báo cáo tài chính chi tiết về thu nhập và chi tiêu.

**Cách dùng:**
- Frontend: Nút "Xuất Báo Cáo" trong trang Quản Lý Tài Chính
- API: `POST /api/docx/bao-cao-thu-chi`

**Dữ liệu cần thiết:**
- Kỳ báo cáo
- Danh sách thu nhập
- Danh sách chi tiêu
- Tổng thu, tổng chi, số dư

### 4. Document Tùy Chỉnh

**Mục đích:** Tạo các loại document khác như giấy xác nhận, thông báo, biên bản, v.v.

**Cách dùng:**
- Frontend: Form nhập liệu + Preview
- API: `POST /api/docx/custom`

**Ví dụ:**
- Giấy xác nhận đã thanh toán
- Thông báo tăng giá thuê
- Biên bản bàn giao phòng
- Biên bản thanh lý hợp đồng

## 🛠️ Troubleshooting

### Lỗi "python not found"

**Nguyên nhân:** Python chưa được cài đặt hoặc không có trong PATH.

**Giải pháp:**
- Cài đặt Python 3.9+
- Thêm Python vào PATH
- Restart terminal/IDE

### Lỗi "python-docx not installed"

**Nguyên nhân:** Thư viện python-docx chưa được cài đặt.

**Giải pháp:**
```bash
pip install python-docx
```

### Lỗi encoding trên Windows

**Nguyên nhân:** PowerShell sử dụng encoding mặc định không phải UTF-8.

**Giải pháp:** Script đã được fix để không sử dụng emoji và ký tự đặc biệt.

### Lỗi "cannot add image"

**Nguyên nhân:** File ảnh không tồn tại hoặc đường dẫn không đúng.

**Giải pháp:**
- Kiểm tra đường dẫn file ảnh
- Đảm bảo file tồn tại và có quyền đọc
- Sử dụng đường dẫn tuyệt đối

### Lỗi "invalid JSON"

**Nguyên nhân:** JSON config không hợp lệ.

**Giải pháp:**
- Kiểm tra cú pháp JSON với online validator
- Đảm bảo tất cả strings được quote đúng
- Kiểm tra commas và brackets

## 📊 Performance

### Thời gian xử lý:

- Document đơn giản (< 5 sections): ~1-2 giây
- Document vừa (5-20 sections): ~2-5 giây
- Document lớn (> 20 sections, có table/image): ~5-10 giây

### Tối ưu:

1. **Async processing:** Xử lý tạo file trong background
2. **Caching:** Cache các template thường dùng
3. **Queue:** Sử dụng job queue cho nhiều requests đồng thời
4. **Clean up:** Xóa temp files sau khi download

## 🔐 Security

### Best Practices:

1. **Validate input:** Kiểm tra config trước khi xử lý
2. **Sanitize paths:** Đảm bảo file paths an toàn
3. **Rate limiting:** Giới hạn số requests tạo document
4. **Authentication:** Yêu cầu auth cho các endpoints
5. **File cleanup:** Xóa temp files sau khi sử dụng

### Example Auth Middleware:

```javascript
// server/routes/docxRoutes.js
const { authenticate, authorize } = require('../middleware/auth');

router.post(
  '/bao-cao-hieu-suat/:chuDuAnId',
  authenticate,
  authorize(['ChuDuAn']),
  DocxController.taoBaoCaoHieuSuat
);
```

## 📚 Tài Liệu Tham Khảo

- [python-docx Documentation](https://python-docx.readthedocs.io/)
- [python-docx GitHub](https://github.com/python-openxml/python-docx)
- [Office Open XML Format](https://docs.microsoft.com/en-us/office/open-xml/structure-of-a-wordprocessingml-document)

## 🎓 Tips & Tricks

### 1. Tạo Template Có Sẵn

Tạo các template config cho các loại document thường dùng:

```javascript
// templates/bao-cao-template.json
const baoCaoTemplate = {
  title: '{TITLE}',
  sections: [
    { type: 'heading1', text: '1. Tổng Quan' },
    { type: 'paragraph', text: '{OVERVIEW}' },
    // ... more sections
  ]
};

// Replace placeholders
function fillTemplate(template, data) {
  let json = JSON.stringify(template);
  Object.keys(data).forEach(key => {
    json = json.replace(`{${key}}`, data[key]);
  });
  return JSON.parse(json);
}
```

### 2. Dynamic Table Generation

```javascript
function createTableSection(headers, rows) {
  return {
    type: 'table',
    headers,
    rows: rows.map(row => 
      headers.map(header => row[header] || '')
    )
  };
}
```

### 3. Conditional Sections

```javascript
function buildConfig(data) {
  const sections = [
    { type: 'heading1', text: 'Báo Cáo' }
  ];

  if (data.includeChart) {
    sections.push({
      type: 'image',
      path: data.chartPath,
      width: 6
    });
  }

  if (data.includeTable) {
    sections.push(createTableSection(data.headers, data.rows));
  }

  return { title: data.title, sections };
}
```

---

**Tác giả:** Cursor AI Agent  
**Ngày tạo:** 2025-11-07  
**Phiên bản:** 1.0


