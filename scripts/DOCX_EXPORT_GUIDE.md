# 📄 HƯỚNG DẪN SỬ DỤNG FILE BÁO CÁO DOCX

## ✅ File đã tạo

**Tên file:** `BaoCao_KLTN_VideoCall_AI_Translation.docx`  
**Kích thước:** ~100 KB  
**Vị trí:** `scripts/BaoCao_KLTN_VideoCall_AI_Translation.docx`  
**Tổng số paragraphs:** 3,769 paragraphs

---

## 📊 NỘI DUNG FILE

### **Cover Page:**
- Tiêu đề: "BÁO CÁO KHÓA LUẬN TỐT NGHIỆP"
- Phụ đề: "HỆ THỐNG QUẢN LÝ CHO THUÊ PHÒNG TRỌ"
- Subtitle: "Tích hợp Video Call với AI Translation Real-time"

### **Chương 1 - GIỚI THIỆU** (4 sections)
- 1.1. Bối cảnh và Động lực
- 1.2. Mục tiêu đề tài
- 1.3. Đóng góp của đề tài
- 1.4. Cấu trúc báo cáo

### **Chương 2 - CƠ SỞ LÝ THUYẾT** (6 sections)
- 2.1. Mô hình Managed Marketplace
- 2.2. Kiến trúc 3 tầng (3-tier Architecture)
- 2.3. React - Modern UI Library
- 2.4. Node.js và Express - Backend Framework
- 2.5. Security Fundamentals
- 2.6. AI Translation Pipeline cho Real-time Communication (~4,200 dòng)
  * STT (Sherpa-ONNX)
  * Machine Translation (VinAI)
  * TTS (gTTS/Piper)
  * Performance Analysis
  * Cost Comparison

### **Chương 3 - PHÂN TÍCH VÀ THIẾT KẾ** (1 major section)
- 3.6. Nâng cấp Communication Layer: Video Call + AI Translation (~616 dòng)
  * Use Cases mở rộng (UC-CUST-02-EXT, UC-SALE-03-EXT)
  * AI Pipeline Design (3-step, SLA, error handling)
  * WebRTC Overview (SFU decision)
  * Cost-Performance Trade-offs

### **Chương 4 - TRIỂN KHAI** (1 major section)
- 4.8. Triển khai AI Translation cho Video Call (~1,635 dòng)
  * 4.8.1: STT Service Implementation (Node.js + Sherpa-ONNX)
  * 4.8.2: Translation Service (VinAI + CTranslate2 + Redis)
  * 4.8.3: TTS Service (gTTS + dual-layer cache)
  * 4.8.4: WebRTC Gateway Integration (SignalingServer + MediaSoup)
  * 4.8.5: Performance Optimization & Results

### **Tài liệu tham khảo** (9 IEEE citations)
- [1] Sherpa-ONNX
- [2] VinAI Translate v2
- [3] Piper TTS
- [4] Google Cloud Translation Pricing
- [5] MediaSoup WebRTC SFU
- [6] W3C WebRTC Standard
- [7] Google Cloud Speech-to-Text Pricing
- [8] Meta AI NLLB Paper
- [9] AWS Amazon Transcribe Pricing

---

## 🎨 FORMATTING NOTES

### **Styles Applied:**
- **Heading 1 (Chương):** Times New Roman, 16pt, Bold
- **Heading 2 (Section):** Times New Roman, 14pt, Bold
- **Heading 3 (Subsection):** Times New Roman, 13pt, Bold
- **Normal Text:** Times New Roman, 13pt
- **Code Blocks:** Consolas, 10pt

### **Formatting Features:**
✅ **Bold text:** `**text**` → Text in bold  
✅ **Bullet lists:** `- item` → Bullet points  
✅ **Numbered lists:** `1. item` → Auto-numbered  
✅ **Code blocks:** `` ```code``` `` → Consolas font  
⚠️ **Tables:** Markdown tables được skip (cần format thủ công)  
⚠️ **Diagrams:** ASCII diagrams giữ nguyên trong code blocks  

---

## 🛠️ CẬP NHẬT FILE (NẾU CẦN)

### **Bước 1: Chỉnh sửa dữ liệu**
```bash
# Edit file Python data
nano scripts/baocao_data_full.py

# Hoặc mở bằng VS Code
code scripts/baocao_data_full.py
```

### **Bước 2: Regenerate DOCX**
```bash
cd scripts
python generate_docx.py
```

### **Bước 3: Kiểm tra file**
```bash
# Windows
start BaoCao_KLTN_VideoCall_AI_Translation.docx

# macOS
open BaoCao_KLTN_VideoCall_AI_Translation.docx

# Linux
xdg-open BaoCao_KLTN_VideoCall_AI_Translation.docx
```

---

## 📝 POST-PROCESSING (KHUYẾN NGHỊ)

Sau khi mở file DOCX trong Microsoft Word, bạn nên:

### **1. Format Tables (Thủ công):**
- Các bảng so sánh (Cost Comparison, Performance Metrics)
- Tables trong Section 3.6.3 (SFU vs Mesh vs MCU)
- Latency Breakdown Table (Section 4.8.5)

### **2. Convert ASCII Diagrams (Tùy chọn):**
- Nếu muốn đẹp hơn, có thể convert sang:
  * **Visio diagrams** (chuyên nghiệp)
  * **Draw.io images** (miễn phí)
  * **PowerPoint SmartArt** (nhanh)

### **3. Add Figure/Table Captions:**
```
Figure 3.1: AI Translation Pipeline Architecture
Table 4.1: End-to-End Latency Breakdown
Code Listing 4.1: STT Service Implementation
```

### **4. Update Table of Contents:**
- References → Table of Contents (tự động)
- Update fields (Ctrl + A, F9)

### **5. Add Page Numbers:**
- Insert → Page Number → Bottom of Page
- Format: "Trang X / Y"

### **6. Final Review:**
- [ ] Check heading levels (1, 2, 3)
- [ ] Verify citations [1]-[9]
- [ ] Fix line spacing (1.5 or 2.0)
- [ ] Add margins (2.5cm all sides)
- [ ] Check font consistency

---

## 🔧 TROUBLESHOOTING

### **Issue 1: File không mở được**
```bash
# Kiểm tra file có bị corrupt
python -c "from docx import Document; doc = Document('BaoCao_KLTN_VideoCall_AI_Translation.docx'); print('OK')"
```

**Fix:** Regenerate file bằng `python generate_docx.py`

### **Issue 2: Code blocks không đẹp**
- Chuyển font sang **Courier New** hoặc **Consolas**
- Giảm size xuống **9pt** hoặc **10pt**
- Thêm shading (màu xám nhạt) cho dễ đọc

### **Issue 3: Tables bị vỡ**
- Markdown tables không tự động convert
- Cần format thủ công trong Word:
  1. Insert → Table
  2. Copy data từ file
  3. Apply Table Style (Grid Table)

### **Issue 4: Thiếu content**
- Kiểm tra `baocao_data_full.py` có đầy đủ 4 chapters không
- Run validation: `python test_baocao.py`

---

## 📤 EXPORT SANG PDF (NẾU CẦN)

### **Option 1: Microsoft Word**
```
File → Save As → PDF
```

### **Option 2: LibreOffice (Free)**
```bash
# Windows
"C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf BaoCao_KLTN_VideoCall_AI_Translation.docx

# macOS/Linux
soffice --headless --convert-to pdf BaoCao_KLTN_VideoCall_AI_Translation.docx
```

### **Option 3: Python (docx2pdf)**
```bash
pip install docx2pdf
python -c "from docx2pdf import convert; convert('BaoCao_KLTN_VideoCall_AI_Translation.docx')"
```

---

## 📊 FILE STATISTICS

```yaml
Total Characters: ~350,000 (estimated)
Total Words: ~50,000 (estimated)
Total Paragraphs: 3,769
Total Pages: ~120-150 (depends on formatting)

Chapters: 4
Sections: 12 major sections
Code Examples: 15+
Diagrams: 20+ (ASCII art)
Tables: 15+ (need manual formatting)
Citations: 9 IEEE references
```

---

## ✅ CHECKLIST TRƯỚC KHI NỘP

- [ ] **Content Complete:** All 4 chapters present
- [ ] **Citations Valid:** Check URLs [1]-[9] still working
- [ ] **Tables Formatted:** All comparison tables properly formatted
- [ ] **Code Readable:** Code blocks use monospace font
- [ ] **Page Numbers:** Added and formatted correctly
- [ ] **TOC Updated:** Table of Contents reflects all headings
- [ ] **Spelling Check:** Run spell checker (F7 in Word)
- [ ] **Grammar Check:** Vietnamese grammar tools
- [ ] **Peer Review:** Get feedback from advisor/peers
- [ ] **PDF Export:** Export final version to PDF
- [ ] **Backup:** Save multiple copies (USB, Cloud, Email)

---

## 🎓 READY FOR SUBMISSION

File `BaoCao_KLTN_VideoCall_AI_Translation.docx` đã sẵn sàng cho:
✅ Thesis submission  
✅ Peer review  
✅ Presentation slides (extract diagrams/tables)  
✅ Publication (convert to LaTeX if needed)  

**Chúc bạn bảo vệ KLTN thành công! 🎉**
