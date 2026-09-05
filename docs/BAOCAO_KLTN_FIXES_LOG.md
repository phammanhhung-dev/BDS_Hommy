# Nhật Ký Sửa Đổi Báo Cáo KLTN

**Ngày:** 2025-11-07  
**Người thực hiện:** AI Assistant + Võ Nguyễn Hoành Hợp

---

## 🔧 Các Issues Đã Sửa

### Issue 1: Password Hashing Sai - Bcrypt vs MD5

**Vấn đề:**  
Báo cáo ghi là sử dụng **Bcrypt** nhưng thực tế hệ thống đang dùng **MD5**

**Tìm kiếm code:**
```javascript
// server/controllers/authController.js:61
const matKhauHash = crypto.createHash('md5').update(String(password)).digest('hex');

// client/src/pages/login/index.jsx:23
const hashedPassword = CryptoJS.MD5(password).toString();
```

**Sửa báo cáo:**
- ❌ **Cũ:** "2.5.3. Password Hashing (Bcrypt)"
- ✅ **Mới:** "2.5.3. Password Hashing (MD5)"
- ✅ Thêm ghi chú: "⚠️ Hạn chế: MD5 không còn an toàn, cần migrate sang bcrypt/SHA-256 trong tương lai"

**File đã sửa:**
- `scripts/generate_baocao_kltn.py` (line 533-537)

---

### Issue 2: Chat Rate Limit - 10 vs 50 messages/minute

**Vấn đề:**  
Báo cáo ghi là **10 messages/minute** nhưng yêu cầu tăng lên **50 messages/minute**

**Kiểm tra code hiện tại:**
```javascript
// server/socket/chatHandlers.js:12
const MAX_MESSAGES_PER_MINUTE = 10;
```

**Sửa cả code + báo cáo:**

1. **Code thực tế:**
   - File: `server/socket/chatHandlers.js`
   - Line 12: `const MAX_MESSAGES_PER_MINUTE = 10;` → `50;`

2. **Báo cáo:**
   - File: `scripts/generate_baocao_kltn.py`
   - Line 545: `'Chat: 10 messages/minute/user'` → `'Chat: 50 messages/minute/user'`

**Status:** ✅ Đã đồng bộ code và báo cáo

---

### Issue 3: Format Lỗi - Bold Markdown `**` ở State Machine Headings

**Vấn đề:**  
Trong section **3.3. Mô hình trạng thái**, có sử dụng `**3.3.1. TinĐăng State Machine:**` thay vì heading chuẩn

**Sửa:**
```python
# ❌ Cũ
self.add_paragraph_text("**3.3.1. TinĐăng State Machine:**")
self.add_paragraph_text("**3.3.2. Phòng State Machine:**")
self.add_paragraph_text("**3.3.3. CuocHen State Machine:**")
self.add_paragraph_text("**3.3.4. GiaoDịch State Machine:**")

# ✅ Mới
self.doc.add_heading('3.3.1. TinĐăng State Machine', level=3)
self.doc.add_heading('3.3.2. Phòng State Machine', level=3)
self.doc.add_heading('3.3.3. CuocHen State Machine', level=3)
self.doc.add_heading('3.3.4. GiaoDịch State Machine', level=3)
```

**Lý do:**  
- Headings phải dùng `doc.add_heading()` để tự động vào Table of Contents
- `add_paragraph_text()` với `**...**` chỉ là text thường (không xuất hiện trong TOC)

**File đã sửa:**
- `scripts/generate_baocao_kltn.py` (lines 638, 643, 648, 652)

---

## 📊 Tổng Kết

### Files đã chỉnh sửa:
1. ✅ `scripts/generate_baocao_kltn.py` (4 thay đổi)
2. ✅ `server/socket/chatHandlers.js` (1 thay đổi)
3. ✅ `BaoCao_KLTN_HeThongChoThuePhongTro.docx` (regenerated)

### Verification:
```bash
# Kiểm tra MD5 usage
grep -r "md5\|bcrypt" server/controllers/authController.js

# Kiểm tra rate limit
grep -r "MAX_MESSAGES_PER_MINUTE" server/socket/chatHandlers.js

# Kiểm tra headings trong script
grep -r "add_heading.*State Machine" scripts/generate_baocao_kltn.py
```

### Output:
- ✅ File DOCX mới: 57.1 KB
- ✅ Không có syntax errors
- ✅ Code và báo cáo đã đồng bộ

---

## 🔍 Kiểm Tra Lại

### Checklist:
- [x] Password hashing đúng (MD5, không phải Bcrypt)
- [x] Chat rate limit đúng (50 messages/minute)
- [x] State Machine headings đúng format (Heading 3, không phải bold text)
- [x] Code và báo cáo đồng bộ
- [x] File DOCX generate thành công

### Lưu ý cho lần sau:
- ⚠️ Luôn kiểm tra code thực tế trước khi viết báo cáo
- ⚠️ Sử dụng `grep` hoặc `codebase_search` để verify
- ⚠️ Trong Word: Headings phải dùng `add_heading()`, không dùng `**...**`

---

## 🆕 Issue 4: Bold Markdown `**...**` Hiển Thị Sai (2025-11-07 Update)

**Vấn đề:**  
Các đoạn văn có `**Manual Testing:**` hoặc `**Keywords:**` bị hiển thị kèm dấu `**` trong DOCX thay vì chỉ in đậm text

**Nguyên nhân:**
- Hàm `add_paragraph_text()` chỉ thêm raw text, không parse markdown
- `doc.add_paragraph(keywords_text)` với `p.runs[0].font.bold = True` sẽ làm đậm CẢ dòng (kể cả `**`)

**Ví dụ bị lỗi:**
```
**Manual Testing:** 31/36 UCs...    ❌ Hiển thị cả dấu **
**Keywords:** managed marketplace... ❌ Hiển thị cả dấu **
```

**Giải pháp:**

Sửa hàm `add_paragraph_text()` để tự động parse `**bold**` markdown:

```python
def add_paragraph_text(self, text):
    """Helper: Thêm đoạn văn thông thường, hỗ trợ **bold** markdown"""
    import re
    
    p = self.doc.add_paragraph()
    p.style = 'Normal'
    
    # Parse **bold** markdown
    parts = re.split(r'(\*\*.*?\*\*)', text)
    
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            # Bold text (remove **)
            run = p.add_run(part[2:-2])
            run.font.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
        elif part:  # Non-empty normal text
            run = p.add_run(part)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
    
    return p
```

**Sửa Keywords section:**
```python
# ❌ Cũ
keywords_text = "**Keywords:** ..."
p = self.doc.add_paragraph(keywords_text)
p.runs[0].font.bold = True

# ✅ Mới
keywords_text = "**Keywords:** ..."
self.add_paragraph_text(keywords_text)
```

**Kết quả:**
- ✅ `**Manual Testing:**` → **Manual Testing:** (không có dấu `**`)
- ✅ `**Keywords:**` → **Keywords:** (không có dấu `**`)
- ✅ Tất cả 71 instances của `**...**` đều được parse đúng

**Files đã sửa:**
- `scripts/generate_baocao_kltn.py` (lines 95-117, 244)

---

**Trạng thái:** ✅ HOÀN THÀNH  
**File output:** `BaoCao_KLTN_HeThongChoThuePhongTro.docx`  
**Ngày regenerate lần cuối:** 2025-11-07 (v3 - Fixed bold markdown)

