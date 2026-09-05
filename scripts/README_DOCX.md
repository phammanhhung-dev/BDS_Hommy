# 📄 Word Document Creator Helper

Helper script để tạo và chỉnh sửa file `.docx` (Microsoft Word) với đầy đủ tính năng.

## 🚀 Cài Đặt

```bash
# Cài đặt thư viện python-docx
pip install python-docx
```

## 📖 Sử Dụng

### 1. Tạo Document Đơn Giản

```bash
python scripts/create_docx.py --title "Báo Cáo" --content "Nội dung báo cáo" --output report.docx
```

### 2. Tạo Document từ JSON File

```bash
python scripts/create_docx.py --json scripts/example_docx_config.json --output output.docx
```

### 3. Tạo Document từ JSON String

```bash
python scripts/create_docx.py --json '{"title":"Test","sections":[{"type":"paragraph","text":"Hello World"}]}' --output test.docx
```

## 🎨 Cấu Trúc JSON Config

### Các loại Section hỗ trợ:

#### 1. **Heading** (Tiêu đề)
```json
{
  "type": "heading1",  // heading1, heading2, heading3
  "text": "Tiêu đề level 1"
}
```

#### 2. **Paragraph** (Đoạn văn)
```json
{
  "type": "paragraph",
  "text": "Nội dung đoạn văn",
  "bold": false,
  "italic": false,
  "underline": false,
  "font_size": 12,
  "color": "#000000",
  "align": "left"  // left, center, right, justify
}
```

#### 3. **List** (Danh sách)
```json
{
  "type": "list",  // hoặc "numbered_list"
  "items": ["Item 1", "Item 2", "Item 3"]
}
```

#### 4. **Table** (Bảng)
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

#### 5. **Image** (Ảnh)
```json
{
  "type": "image",
  "path": "path/to/image.png",
  "width": 6  // inches
}
```

#### 6. **Link** (Hyperlink)
```json
{
  "type": "link",
  "text": "Click here",
  "url": "https://example.com"
}
```

#### 7. **Page Break** (Ngắt trang)
```json
{
  "type": "page_break"
}
```

## 📝 Ví Dụ Đầy Đủ

Xem file `scripts/example_docx_config.json` để có ví dụ đầy đủ.

```json
{
  "title": "Báo Cáo Dự Án",
  "sections": [
    {
      "type": "heading1",
      "text": "1. Giới Thiệu"
    },
    {
      "type": "paragraph",
      "text": "Đây là báo cáo dự án...",
      "font_size": 12
    },
    {
      "type": "list",
      "items": ["Mục tiêu 1", "Mục tiêu 2"]
    },
    {
      "type": "table",
      "headers": ["Tên", "Giá Trị"],
      "rows": [
        ["Item 1", "100"],
        ["Item 2", "200"]
      ]
    }
  ]
}
```

## 🔧 Sử Dụng trong Node.js

Bạn có thể gọi script Python từ Node.js:

```javascript
const { exec } = require('child_process');
const fs = require('fs');

async function createDocx(config, outputPath) {
  // Write config to temp file
  const tempConfig = '/tmp/docx_config.json';
  fs.writeFileSync(tempConfig, JSON.stringify(config));
  
  // Execute Python script
  return new Promise((resolve, reject) => {
    exec(`python scripts/create_docx.py --json ${tempConfig} --output ${outputPath}`, 
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

// Usage
const config = {
  title: "Báo Cáo",
  sections: [
    { type: "paragraph", text: "Nội dung" }
  ]
};

createDocx(config, 'output.docx')
  .then(() => console.log('✅ Tạo file thành công'))
  .catch(err => console.error('❌ Lỗi:', err));
```

## 🎯 Use Cases

### 1. Tạo Báo Cáo Hiệu Suất Chủ Dự Án

```bash
python scripts/create_docx.py --json config/bao_cao_chu_du_an.json --output bao_cao.docx
```

### 2. Tạo Hợp Đồng Thuê Phòng

```bash
python scripts/create_docx.py --json config/hop_dong_template.json --output hop_dong.docx
```

### 3. Tạo Báo Cáo Thu Chi

```bash
python scripts/create_docx.py --json config/bao_cao_thu_chi.json --output thu_chi.docx
```

## 🛠️ Tính Năng

- ✅ Hỗ trợ heading (3 levels)
- ✅ Paragraph với formatting (bold, italic, underline, color, size, alignment)
- ✅ Bullet list và numbered list
- ✅ Table với styling
- ✅ Image với custom width
- ✅ Hyperlink
- ✅ Page break
- ✅ UTF-8 (Tiếng Việt)

## 📚 Tài Liệu Tham Khảo

- [python-docx Documentation](https://python-docx.readthedocs.io/)
- [python-docx GitHub](https://github.com/python-openxml/python-docx)

## ⚠️ Lưu Ý

- File ảnh phải tồn tại trước khi thêm vào document
- Màu sắc sử dụng format HEX (#RRGGBB)
- Width của ảnh tính bằng inches (1 inch = 2.54 cm)
- JSON config phải hợp lệ (valid JSON format)

## 🔍 Troubleshooting

### Lỗi "lxml not found"
```bash
pip install lxml
```

### Lỗi "cannot add image"
Kiểm tra đường dẫn file ảnh có đúng không.

### Lỗi "invalid JSON"
Kiểm tra cú pháp JSON với online validator.

---

**Tác giả:** Cursor AI Agent  
**Ngày tạo:** 2025-11-07


