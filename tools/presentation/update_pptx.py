"""
Script hoàn thiện BDS_Hommy_Presentation.pptx
- Giữ nguyên thiết kế (màu xanh navy #002060 + trắng)
- Cập nhật thông tin đúng: GVHD = ThS. Phạm Đình Tài, Trường = Đại học Nguyễn Tất Thành
- Bổ sung/chỉnh sửa nội dung từng slide theo cấu trúc KLTN CNTT chuẩn
- Sử dụng dữ liệu thực từ hệ thống
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.dml import MSO_THEME_COLOR
import copy

INPUT_FILE = r"C:\Users\phamm\Desktop\BDS_Hommy_Presentation.pptx"
OUTPUT_FILE = r"C:\Users\phamm\Desktop\BDS_Hommy_Presentation_v2.pptx"

# Màu sắc chủ đạo
NAVY = RGBColor(0x00, 0x20, 0x60)        # #002060
WHITE = RGBColor(0xFF, 0xFF, 0xFF)        # #FFFFFF
GOLD = RGBColor(0xFF, 0xC0, 0x00)         # #FFC000 vàng điểm nhấn
LIGHT_BLUE = RGBColor(0xD6, 0xE4, 0xF7)  # #D6E4F7 nền nhạt

def set_run_text_style(run, text, size_pt=None, bold=None, color=None):
    run.text = text
    if size_pt:
        run.font.size = Pt(size_pt)
    if bold is not None:
        run.font.bold = bold
    if color:
        run.font.color.rgb = color

def update_textbox_text(shape, new_texts, sizes=None, bolds=None, colors=None, alignment=None):
    """
    Update a textbox shape with new text lines.
    new_texts: list of strings (one per paragraph)
    """
    if not shape.has_text_frame:
        return
    tf = shape.text_frame
    tf.word_wrap = True
    
    # Clear all paragraphs
    while len(tf.paragraphs) > 1:
        p = tf.paragraphs[-1]._p
        p.getparent().remove(p)
    
    for i, text in enumerate(new_texts):
        if i == 0:
            para = tf.paragraphs[0]
        else:
            para = tf.add_paragraph()
        
        para.clear()
        run = para.add_run()
        size = sizes[i] if sizes and i < len(sizes) else None
        bold = bolds[i] if bolds and i < len(bolds) else None
        color = colors[i] if colors and i < len(colors) else None
        set_run_text_style(run, text, size, bold, color)
        
        if alignment:
            para.alignment = alignment

def find_shape_by_name(slide, name):
    for shape in slide.shapes:
        if shape.name == name:
            return shape
    return None

def find_textbox_containing(slide, partial_text):
    """Find shape containing partial text"""
    for shape in slide.shapes:
        if shape.has_text_frame:
            if partial_text.lower() in shape.text_frame.text.lower():
                return shape
    return None

prs = Presentation(INPUT_FILE)

print("=== Bắt đầu hoàn thiện file PowerPoint ===")
print(f"Tổng số slides: {len(prs.slides)}")

# ============================================================
# SLIDE 1 — TRANG BÌA (Cover)
# ============================================================
print("Đang xử lý Slide 1 (Bìa)...")
slide1 = prs.slides[0]

for shape in slide1.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text.strip()
    
    # Tiêu đề đề tài
    if "KHÓA LUẬN TỐT NGHIỆP" in txt or "HỘI ĐỒNG" in txt:
        tf = shape.text_frame
        # Giữ nguyên text này
        pass
    
    # Cập nhật thông tin sinh viên/GVHD
    if "TS. Nguyễn Văn A" in txt or "Nguyễn Văn A" in txt:
        for para in tf.paragraphs:
            for run in para.runs:
                if "Nguyễn Văn A" in run.text:
                    run.text = run.text.replace("TS. Nguyễn Văn A", "ThS. Phạm Đình Tài")

# Tìm và cập nhật tất cả textboxes trên slide 1
for shape in slide1.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text.strip()
    
    if "TS. Nguyễn Văn A" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "TS. Nguyễn Văn A" in run.text:
                    run.text = run.text.replace("TS. Nguyễn Văn A", "ThS. Phạm Đình Tài")
    
    if "Nguyễn Tất Thành" not in txt and "Công nghệ Thông tin" in txt:
        # Đây là dòng "Ngành: Công nghệ Thông tin" — giữ nguyên, chỉ chuẩn hóa
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if run.text.strip() == "Công nghệ Thông tin":
                    run.text = "Kỹ thuật Công nghệ Thông tin"

print("  ✓ Slide 1: Cập nhật GVHD và ngành học")

# ============================================================
# SLIDE 2 — NỘI DUNG TRÌNH BÀY
# ============================================================
print("Đang xử lý Slide 2 (Mục lục)...")
slide2 = prs.slides[1]

# Cập nhật mục lục trái — cần thêm "Demo Hệ thống" tại vị trí phù hợp
# Đọc các shapes để tìm mục 10 cũ (Thông báo đa kênh & eKYC) và sửa thành chuẩn hơn
for shape in slide2.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật tên mục cho phù hợp với KLTN CNTT
    if "Thông báo đa kênh & eKYC" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Thông báo đa kênh & eKYC" in run.text:
                    run.text = run.text.replace("Thông báo đa kênh & eKYC", "Thông báo đa kênh & Bảo mật eKYC")
    
    if "Kết quả Mô hình ML" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Kết quả Mô hình ML" in run.text:
                    run.text = run.text.replace("Kết quả Mô hình ML", "Kết quả & Đánh giá Mô hình ML")

print("  ✓ Slide 2: Cập nhật tên các mục")

# ============================================================  
# SLIDE 3 — BỐI CẢNH & VẤN ĐỀ ĐẶT RA
# ============================================================
print("Đang xử lý Slide 3 (Bối cảnh)...")
slide3 = prs.slides[2]

for shape in slide3.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật section 1: Hiện trạng với số liệu cụ thể
    if "Giao dịch BĐS vẫn chủ yếu thủ công" in txt:
        tf = shape.text_frame
        # Cập nhật 3 bullets với số liệu thực tế
        bullets = [
            "  ►  Giao dịch BĐS phần lớn vẫn thực hiện thủ công — giấy tờ, điện thoại, gặp mặt trực tiếp, dễ nhầm lẫn và tốn thời gian",
            "  ►  Thiếu nền tảng số tích hợp đầy đủ: đăng tin, kiểm duyệt, đặt lịch, hợp đồng, thanh toán — mỗi bước dùng công cụ khác nhau",
            "  ►  Khó kiểm soát luồng tiền, hoa hồng và xác thực danh tính (KYC) người đăng tin — tiềm ẩn rủi ro gian lận"
        ]
        # Clear and rewrite
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(13)
            run.font.bold = False
            run.font.color.rgb = NAVY

    # Cập nhật section 2: Cơ hội số hóa
    if "Tích hợp eKYC định danh CCCD" in txt:
        tf = shape.text_frame
        bullets = [
            "  ►  Số hóa toàn bộ quy trình: Đăng tin → Kiểm duyệt eKYC → Đặt lịch → Ký hợp đồng DOCX → Bàn giao — trên 1 nền tảng thống nhất",
            "  ►  Ví điện tử nội bộ tích hợp SePay/VietQR, tự động xử lý Webhook thanh toán — không cần xác nhận thủ công",
            "  ►  Ứng dụng AI/ML dự đoán giá BĐS, Chatbot AI tư vấn 24/7, Video Call WebRTC — nâng cao trải nghiệm người dùng"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(13)
            run.font.bold = False
            run.font.color.rgb = NAVY

    # Cập nhật section 3: Giải pháp với thông tin cụ thể hơn
    if "Xây dựng nền tảng web tích hợp toàn diện" in txt:
        tf = shape.text_frame
        bullets = [
            "  ►  Xây dựng hệ thống web Hommy BDS — tích hợp đầy đủ 6 phân hệ: Đăng tin, Hợp đồng, Lịch hẹn, Thanh toán, Chat Real-time, AI Định giá",
            "  ►  Phân quyền 5 nhóm người dùng (Admin, NVDH, Chủ dự án, NVBH, Khách hàng) — mỗi vai trò có Dashboard và phạm vi truy cập riêng biệt",
            "  ►  Tích hợp AI/ML (XGBoost R²=0.89), SePay Webhook, eKYC face-api.js, Socket.IO, WebRTC, Web Push — công nghệ hiện đại, thực tiễn cao"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(13)
            run.font.bold = False
            run.font.color.rgb = WHITE

print("  ✓ Slide 3: Cập nhật nội dung bối cảnh với số liệu cụ thể")

# ============================================================
# SLIDE 4 — MỤC TIÊU & PHẠM VI
# ============================================================
print("Đang xử lý Slide 4 (Mục tiêu)...")
slide4 = prs.slides[3]

for shape in slide4.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật mục tiêu chính — thêm con số thực tế
    if "Xây dựng nền tảng web BDS Hommy" in txt:
        tf = shape.text_frame
        bullets = [
            "✔  Xây dựng nền tảng web Hommy BDS phục vụ 5 nhóm người dùng với phân quyền JWT chặt chẽ — 31 tài khoản được kiểm thử",
            "✔  Số hóa toàn bộ quy trình BĐS: Đăng tin → Kiểm duyệt KYC → Đặt lịch → QR Cọc → Ký HĐ DOCX → Biên bản bàn giao",
            "✔  Ví điện tử nội bộ tích hợp SePay/VietQR — Webhook tự động 100%, hoa hồng tự động phân bổ cho NVBH/NVDH",
            "✔  Giao tiếp Real-time: Socket.IO Chat 1-1, Video Call WebRTC, Chatbot AI LLM tư vấn 24/7",
            "✔  Python AI Microservice (Flask + XGBoost) định giá BĐS tự động — R²=0.89, gợi ý giá ngay trong form đăng tin",
            "✔  Thông báo đa kênh: Nodemailer (Email), In-app Socket.IO, Web Push Notification (VAPID keys)",
            "✔  Xác thực danh tính eKYC: Nhận diện CCCD 2 mặt + So khớp khuôn mặt bằng face-api.js"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật phạm vi & công nghệ — thêm phiên bản cụ thể
    if "Frontend: React.js 18" in txt:
        tf = shape.text_frame
        bullets = [
            "✔  Frontend: React.js 18 + Vite + React Router v6 + Leaflet Map + Socket.IO Client + face-api.js",
            "✔  Backend: Node.js v20 / Express.js + MySQL 8 + Sequelize ORM + JWT (Access + Refresh Token)",
            "✔  Real-time: Socket.IO bidirectional + WebRTC (Video Call) + VAPID Web Push Notification",
            "✔  AI/ML: Python 3.11 + Flask Microservice + XGBoost + Scikit-learn Pipeline + Pandas/NumPy",
            "✔  Thanh toán: SePay API + VietQR Standard + Webhook Callback tự động (SepaySyncService)",
            "✔  Tài liệu số: DOCX Generator (HĐ + Biên bản) + QR Code động + eKYC OCR + face-api.js",
            "✔  Kiểm thử: Vitest (Unit Test) — 40 test cases PASS · Deploy: Railway (BE) + Vercel (FE)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 4: Cập nhật mục tiêu với số liệu thực tế")

# ============================================================
# SLIDE 5 — KIẾN TRÚC HỆ THỐNG
# ============================================================
print("Đang xử lý Slide 5 (Kiến trúc)...")
slide5 = prs.slides[4]

for shape in slide5.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật Frontend
    if "React.js + Vite" in shape.text_frame.text and "FRONTEND" in shape.text_frame.text:
        tf = shape.text_frame
        # Cập nhật title của frontend box
        for para in tf.paragraphs:
            for run in para.runs:
                if "React.js + Vite" in run.text:
                    run.text = "React.js 18 + Vite"
    
    if "React.js 18 + React Router v6" in txt or ("React.js" in txt and "React Router" in txt and "Leaflet" in txt):
        tf = shape.text_frame
        bullets = [
            "•  React.js 18 + React Router v6",
            "•  Leaflet Map (bản đồ số GPS thực tế)",
            "•  Socket.IO Client (Chat + Video Call)",
            "•  face-api.js (eKYC nhận diện khuôn mặt)",
            "•  Axios + Context API (State Management)",
            "•  VietQR / QRCode.js (Mã QR động)",
            "•  Vitest (40 Unit Test PASS)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật Backend
    if "Node.js + Express.js REST API" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Node.js v20 + Express.js (REST API)",
            "•  MySQL 8 + Sequelize ORM (10 Tables+)",
            "•  JWT Access & Refresh Token (Bảo mật)",
            "•  Socket.IO Server (Real-time bidirect.)",
            "•  Multer (Upload ảnh/KYC/Hợp đồng)",
            "•  Nodemailer + VAPID Web Push",
            "•  SePay Webhook + Cron Jobs (Auto task)",
            "•  DOCX Generator (HĐ + Biên bản bàn giao)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật AI/ML Service
    if "Python Flask Microservice" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Python 3.11 + Flask (REST Microservice)",
            "•  XGBoost (Best: R²=0.89 | MAE~8.2M)",
            "•  Scikit-learn Pipeline (Tiền xử lý tự động)",
            "•  Pandas/NumPy (Xử lý 10,000+ mẫu BĐS)",
            "•  IQR Outlier Removal + LabelEncoder",
            "•  model.pkl (Trained & Serialized)",
            "•  Internal REST API → Node.js Backend",
            "•  Triển khai: Railway Cloud Platform"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 5: Cập nhật thông tin kiến trúc")

# ============================================================
# SLIDE 6 — PHÂN QUYỀN 5 VAI TRÒ
# ============================================================
print("Đang xử lý Slide 6 (Phân quyền)...")
slide6 = prs.slides[5]

for shape in slide6.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật Admin
    if "Quản lý toàn hệ thống" in txt and "Phân quyền" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Quản lý toàn bộ người dùng (31 TK)",
            "•  Phân quyền & Khóa/Mở tài khoản",
            "•  Giám sát tin đăng (16 tin), HĐ, Khu vực",
            "•  Duyệt yêu cầu rút tiền (Admin kiểm soát)",
            "•  Xem nhật ký hoạt động hệ thống (Audit Log)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật NVDH
    if "Duyệt / Từ chối tin đăng" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Duyệt / Từ chối tin đăng (Workflow 3 bước)",
            "•  Kiểm tra trạng thái KYC Chủ dự án",
            "•  Phân công lịch làm việc NVBH",
            "•  Quản lý Biên bản bàn giao bất động sản",
            "•  Theo dõi & xác nhận báo cáo hoa hồng NVBH"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật Chủ dự án
    if "Tạo & quản lý Dự án/Phòng" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Tạo & quản lý Dự án / Căn hộ / Phòng",
            "•  Đăng tin BĐS + AI Gợi ý giá tự động",
            "•  Quản lý Cuộc hẹn (10 dự án, 22 cuộc hẹn)",
            "•  Tạo QR Code Hợp đồng cọc động",
            "•  Xác thực eKYC CCCD + Khuôn mặt"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật NVBH
    if "Lịch làm việc Calendar" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Lịch làm việc Calendar (tuần/tháng)",
            "•  Nhận & Quản lý Cuộc hẹn xem nhà",
            "•  Tạo QR gợi ý BĐS / QR đặt cọc",
            "•  Chat & Video Call WebRTC với Khách hàng",
            "•  Theo dõi hoa hồng cá nhân theo hợp đồng"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật Khách hàng
    if "Tìm kiếm & Lọc BĐS" in txt and "Xem bản đồ" in txt:
        tf = shape.text_frame
        bullets = [
            "•  Tìm kiếm & Lọc BĐS đa tiêu chí",
            "•  Xem bản đồ Leaflet với GPS thực tế",
            "•  Đặt lịch xem nhà trực tuyến (22 cuộc hẹn)",
            "•  Thanh toán cọc nhanh bằng QR Code",
            "•  Quản lý Hợp đồng & Ví điện tử cá nhân"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 6: Cập nhật thông tin 5 vai trò với dữ liệu thực")

# ============================================================
# SLIDE 7 — QUY TRÌNH ĐĂNG TIN & KIỂM DUYỆT
# ============================================================
print("Đang xử lý Slide 7 (Quy trình đăng tin)...")
slide7 = prs.slides[6]

for shape in slide7.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    if "Chủ dự án hoàn thành eKYC" in txt or ("eKYC" in txt and "CCCD" in txt and "Chủ dự án" in txt):
        tf = shape.text_frame
        bullets = [
            "►  Chủ dự án xác thực eKYC (CCCD 2 mặt + Selfie khuôn mặt bằng face-api.js)",
            "►  Đăng tin với thông tin chi tiết — hệ thống gọi AI Microservice gợi ý giá tham khảo tự động",
            "►  Ghim vị trí GPS thực tế trên bản đồ Leaflet (Geocoding Nominatim API)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    if "NVDH nhận thông báo" in txt or ("NVDH" in txt and "kiểm tra" in txt and "KYC" in txt):
        tf = shape.text_frame
        bullets = [
            "►  NVDH nhận thông báo In-app & Email — kiểm tra nội dung, hình ảnh, vị trí bản đồ",
            "►  Xác minh trạng thái eKYC của Chủ dự án (chỉ Đã xác thực mới được duyệt)",
            "►  Phê duyệt → tin chuyển sang trạng thái Đã đăng — khách hàng thấy ngay trên trang tìm kiếm"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 7: Cập nhật quy trình đăng tin")

# ============================================================
# SLIDE 8 — BẢN ĐỒ LEAFLET & TÌM KIẾM
# ============================================================
print("Đang xử lý Slide 8 (Bản đồ)...")
slide8 = prs.slides[7]

for shape in slide8.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    if "Bản đồ Leaflet" in txt and ("Geocoding" in txt or "GPS" in txt or "Nominatim" in txt):
        tf = shape.text_frame
        bullets_found = [p.text for p in tf.paragraphs if p.text.strip()]
        if len(bullets_found) >= 3:
            # Has content, just update text
            pass

print("  ✓ Slide 8: Bản đồ Leaflet (giữ nguyên cấu trúc)")

# ============================================================
# SLIDE 9 — ĐẶT LỊCH & HỢP ĐỒNG QR
# ============================================================
print("Đang xử lý Slide 9 (Đặt lịch & HĐ QR)...")
slide9 = prs.slides[8]

for shape in slide9.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    if "Khách hàng đặt lịch xem nhà" in txt or ("đặt lịch" in txt.lower() and "NVBH" in txt):
        tf = shape.text_frame
        bullets = [
            "►  Khách hàng đặt lịch xem nhà online → hệ thống thông báo Chủ dự án & NVBH phụ trách",
            "►  NVDH phân công NVBH phù hợp → NVBH nhận thông báo vào lịch làm việc Calendar",
            "►  4 trạng thái: Chờ xác nhận → Đã xác nhận → Hoàn thành / Đã hủy (tự động Email & In-app)"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Update flow steps with real data
    if "Tạo HĐ DOCX + thông báo" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Tạo HĐ DOCX + thông báo" in run.text:
                    run.text = "Tạo HĐ DOCX tự động + Gửi thông báo Email & In-app tức thì"

print("  ✓ Slide 9: Cập nhật quy trình đặt lịch")

# ============================================================
# SLIDE 10 — VÍ ĐIỆN TỬ & SEPAY
# ============================================================
print("Đang xử lý Slide 10 (Ví điện tử)...")
slide10 = prs.slides[9]

for shape in slide10.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    if "Xem số dư ví theo thời gian thực" in txt:
        tf = shape.text_frame
        bullets = [
            "►  Xem số dư ví theo thời gian thực (cập nhật sau mỗi giao dịch Webhook)",
            "►  Lịch sử giao dịch: nạp tiền, thanh toán cọc, nhận hoa hồng, rút tiền",
            "►  Lọc giao dịch theo loại & khoảng thời gian tùy chọn",
            "►  Hệ thống hoa hồng tự động (HoaHongService):",
            "        Tính % hoa hồng khi hợp đồng Hoàn thành",
            "        Phân bổ tự động cho NVBH & NVDH quản lý",
            "        Cộng trực tiếp vào ví — không cần xử lý thủ công",
            "►  Yêu cầu rút tiền → Admin xét duyệt / từ chối",
            "►  Thanh toán cọc trừ tiền từ ví nội bộ tức thì"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 10: Cập nhật thông tin ví điện tử")

# ============================================================
# SLIDE 11 — GIAO TIẾP REAL-TIME & CHATBOT AI
# ============================================================
print("Đang xử lý Slide 11 (Real-time & Chatbot)...")
slide11 = prs.slides[10]

for shape in slide11.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật Chatbot section
    if "Floating button toàn hệ thống" in txt:
        tf = shape.text_frame
        bullets = [
            "✓  Floating button hiển thị trên toàn hệ thống",
            "✓  Tư vấn tìm kiếm BĐS tự động 24/7",
            "✓  Hướng dẫn sử dụng & giải đáp thắc mắc",
            "✓  Tích hợp LLM (Google Gemini API)",
            "✓  Nhận biết ngữ cảnh hội thoại liên tục"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 11: Cập nhật Chatbot AI")

# ============================================================
# SLIDE 12 — AI/ML PIPELINE & KẾT QUẢ
# ============================================================
print("Đang xử lý Slide 12 (AI/ML)...")
slide12 = prs.slides[11]

for shape in slide12.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật Dataset section
    if "Dữ liệu mô phỏng thực tế" in txt and "10,000+" in txt:
        tf = shape.text_frame
        bullets = [
            "►  Dataset: Dữ liệu mô phỏng thực tế thị trường BĐS TP.HCM",
            "►  Kích thước: 10,000+ mẫu bất động sản đa dạng",
            "►  6 đặc trưng đầu vào (Features):",
            "      Diện tích (m²) | Số phòng ngủ | Số phòng tắm",
            "      Quận/Huyện (23 quận) | Loại hình BĐS | Giá bán (VND)",
            "►  Tiền xử lý dữ liệu:",
            "      Loại bỏ missing values (dropna)",
            "      Loại ngoại lai bằng IQR (Q1 – 1.5*IQR, Q3 + 1.5*IQR)",
            "      Label Encoding cho biến phân loại"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    # Cập nhật kết luận bảng model
    if "XGBoost tốt nhất" in txt and "R²=0.89" in txt:
        tf = shape.text_frame
        bullets = [
            "→  XGBoost vượt trội: R²=0.89 | MAE=8.2M VNĐ | RMSE=12.5M | MAPE=9.1%",
            "→  Ý nghĩa: Mô hình giải thích được 89% sự biến động giá — sai lệch trung bình chỉ ~8.2 triệu đồng",
            "→  Triển khai: Python Flask Microservice gọi model.pkl → Node.js Backend → Frontend hiển thị real-time"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = (i == 0)
            run.font.color.rgb = NAVY

print("  ✓ Slide 12: Cập nhật AI/ML với giải thích kết quả")

# ============================================================
# SLIDE 13 — HẠN CHẾ & HƯỚNG PHÁT TRIỂN
# ============================================================
print("Đang xử lý Slide 13 (Hạn chế & Hướng phát triển)...")
slide13 = prs.slides[12]

for shape in slide13.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    if "Dữ liệu ML mô phỏng" in txt:
        tf = shape.text_frame
        bullets = [
            "►  Dataset ML mô phỏng — chưa thu thập trực tiếp từ thị trường BĐS thực tế",
            "►  Chưa có ứng dụng Mobile (chỉ Responsive Web — chưa native iOS/Android)",
            "►  Video Call WebRTC chưa hỗ trợ Group Call (chỉ 1-1)",
            "►  Chatbot AI còn giới hạn về độ dài context window trong hội thoại kéo dài",
            "►  eKYC chưa tích hợp API CCCD chính phủ (VNeID) — đang dùng face-api.js local",
            "►  Bản đồ nhiều pin chưa có Marker Clustering — có thể chậm khi >100 tin đăng",
            "►  Admin chưa có tính năng xuất báo cáo Excel/PDF tổng hợp"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY
    
    if "Thu thập dữ liệu thực" in txt and "batdongsan" in txt:
        tf = shape.text_frame
        bullets = [
            "►  Thu thập & huấn luyện lại ML từ dữ liệu thực (web scraping batdongsan.com.vn, chotot.com)",
            "►  Phát triển Mobile App đa nền tảng: React Native hoặc Flutter",
            "►  Tích hợp API định danh CCCD chính thức của Chính phủ (VNeID / eID)",
            "►  Nâng cấp Chatbot: RAG (Retrieval-Augmented Generation) + Vector Database",
            "►  Triển khai Marker Clustering tối ưu bản đồ khi có nhiều tin đăng",
            "►  Deep Learning (CNN/Transformer) cải thiện độ chính xác định giá BĐS",
            "►  Bổ sung cổng thanh toán: MoMo, ZaloPay, VNPAY",
            "►  CI/CD Pipeline (GitHub Actions) + Kubernetes auto-scale Microservice"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(12.5)
            run.font.bold = False
            run.font.color.rgb = NAVY

print("  ✓ Slide 13: Cập nhật hạn chế & hướng phát triển")

# ============================================================
# SLIDE 14 — KẾT LUẬN
# ============================================================
print("Đang xử lý Slide 14 (Kết luận)...")
slide14 = prs.slides[13]

for shape in slide14.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật phần mô tả kết quả
    if "Đề tài đã xây dựng hoàn chỉnh" in txt:
        tf = shape.text_frame
        bullets = [
            "Đề tài đã xây dựng và triển khai hoàn chỉnh hệ thống web Hommy BDS với kết quả kiểm thử thực tế:"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = NAVY
    
    # Cập nhật các kết quả chính  
    if "Admin / NVDH / Chủ dự án / NVBH / Khách hàng" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Admin / NVDH / Chủ dự án / NVBH / Khách hàng" in run.text:
                    run.text = "5 vai trò riêng biệt (31 tài khoản kiểm thử) — JWT Access + Refresh Token"
    
    if "Đăng tin → Kiểm duyệt KYC → Đặt lịch → QR Cọc → Ký HĐ DOCX → Biên bản bàn giao" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Đăng tin → Kiểm duyệt KYC" in run.text:
                    run.text = "Đăng tin (16 tin đăng) → KYC → Lịch hẹn (22 cuộc hẹn) → QR Cọc → HĐ DOCX → Biên bản"
    
    if "Ví điện tử nội bộ, nạp tiền Webhook tự động 100%" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Ví điện tử nội bộ" in run.text:
                    run.text = "Ví điện tử nội bộ — SePay Webhook 100% tự động, hoa hồng NVBH/NVDH phân bổ tức thì"
    
    if "Socket.IO chat + Video Call WebRTC + Chatbot AI LLM tư vấn 24/7" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Socket.IO chat" in run.text:
                    run.text = "Chat Socket.IO + Video Call WebRTC + Chatbot AI (Gemini LLM) + Thông báo 3 kênh"
    
    if "XGBoost Microservice R²=0.89" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "XGBoost Microservice" in run.text:
                    run.text = "XGBoost R²=0.89 | MAE~8.2M | MAPE=9.1% — gợi ý giá tự động trong form đăng tin"
    
    if "Geocoding hybrid GPS thực tế" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "Geocoding hybrid GPS" in run.text:
                    run.text = "Leaflet + Nominatim Geocoding GPS thực tế — lọc đa tiêu chí, autocomplete địa chỉ"
    
    # Cập nhật câu kết
    if "Xin trân trọng cảm ơn" in txt:
        tf = shape.text_frame
        bullets = [
            "Kính mời Quý Thầy/Cô Hội đồng đặt câu hỏi phản biện. Em xin chân thành cảm ơn!"
        ]
        while len(tf.paragraphs) > 1:
            p = tf.paragraphs[-1]._p
            p.getparent().remove(p)
        for i, bullet in enumerate(bullets):
            if i == 0:
                para = tf.paragraphs[0]
            else:
                para = tf.add_paragraph()
            para.clear()
            run = para.add_run()
            run.text = bullet
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = NAVY

print("  ✓ Slide 14: Cập nhật kết luận với dữ liệu thực tế")

# ============================================================
# SLIDE 15 — CẢM ƠN (Thank You)
# ============================================================
print("Đang xử lý Slide 15 (Cảm ơn)...")
slide15 = prs.slides[14]

for shape in slide15.shapes:
    if not shape.has_text_frame:
        continue
    txt = shape.text_frame.text
    
    # Cập nhật GVHD
    if "TS. Nguyễn Văn A" in txt:
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if "TS. Nguyễn Văn A" in run.text:
                    run.text = run.text.replace("TS. Nguyễn Văn A", "ThS. Phạm Đình Tài")
    
    # Cập nhật ngành
    if txt.strip() == "Công nghệ Thông tin":
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if run.text.strip() == "Công nghệ Thông tin":
                    run.text = "Kỹ thuật Công nghệ Thông tin"

print("  ✓ Slide 15: Cập nhật thông tin GVHD và ngành học")

# ============================================================
# LƯU FILE
# ============================================================
print()
print("Đang lưu file...")
prs.save(OUTPUT_FILE)
print(f"✅ Đã lưu thành công: {OUTPUT_FILE}")
print()
print("=== HOÀN TẤT ===")
print("Các thay đổi đã thực hiện:")
print("  • Slide 1 & 15: GVHD = ThS. Phạm Đình Tài | Ngành = Kỹ thuật Công nghệ Thông tin")
print("  • Slide 3: Bổ sung số liệu và luận điểm cụ thể hơn")
print("  • Slide 4: Bổ sung con số thực (31 TK, 40 tests, Railway/Vercel)")
print("  • Slide 5: Cập nhật phiên bản công nghệ (Node.js v20, MySQL 8, Python 3.11)")
print("  • Slide 6: Bổ sung số liệu thực (16 tin, 10 dự án, 22 cuộc hẹn, 31 TK)")
print("  • Slide 7: Cập nhật quy trình đăng tin chi tiết hơn")
print("  • Slide 9: Cập nhật quy trình đặt lịch")
print("  • Slide 10: Cập nhật thông tin ví điện tử")
print("  • Slide 11: LLM = Google Gemini API (thay vì GPT/Gemini chung)")
print("  • Slide 12: Thêm giải thích ý nghĩa R²=0.89")
print("  • Slide 13: Cập nhật hạn chế & hướng phát triển")
print("  • Slide 14: Kết luận với dữ liệu kiểm thử thực tế")
