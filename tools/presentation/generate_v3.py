"""
Script tái cấu trúc bài thuyết trình Hommy BDS sang phiên bản 15+1 slides:
1. Sửa lại Slide 2 (Mục lục) thành 5 PHẦN TỔNG QUÁT chuẩn Khóa luận CNTT, thiết kế thẻ ngang hiện đại.
2. Bổ sung Slide 13: KỊCH BẢN DEMO THỰC TẾ HỆ THỐNG (chia 4 cột vai trò kèm mốc thời gian và môi trường chạy).
3. Chuẩn hóa tiêu đề các slide theo đúng 5 Phần lớn để bài thuyết trình có tính liên kết chặt chẽ.
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

INPUT_FILE = r"C:\Users\phamm\Desktop\BDS_Hommy_Presentation_v2.pptx"
OUTPUT_FILE = r"C:\Users\phamm\Desktop\BDS_Hommy_Presentation_v3.pptx"

prs = Presentation(INPUT_FILE)
print(f"Bắt đầu xử lý file... Tổng số slide ban đầu: {len(prs.slides)}")

# Màu sắc chủ đạo
NAVY = RGBColor(0x00, 0x20, 0x60)         # #002060 Xanh navy đậm
WHITE = RGBColor(0xFF, 0xFF, 0xFF)        # #FFFFFF Trắng
GOLD = RGBColor(0xD9, 0x77, 0x06)         # #D97706 Vàng hổ phách điểm nhấn
DARK_TEXT = RGBColor(0x1E, 0x29, 0x3B)    # #1E293B Chữ đậm
GRAY_TEXT = RGBColor(0x47, 0x55, 0x69)    # #475569 Chữ phụ
LIGHT_BG = RGBColor(0xF8, 0xFA, 0xFC)     # #F8FAFC Nền thẻ thường
BORDER_COLOR = RGBColor(0xCB, 0xD5, 0xE1) # #CBD5E1 Viền thẻ thường

DEMO_BG = RGBColor(0xFF, 0xFB, 0xEB)      # #FFFBEB Nền thẻ demo
DEMO_BORDER = RGBColor(0xF5, 0x9E, 0x0B)  # #F59E0B Viền thẻ demo

# ==============================================================================
# BƯỚC 1: LÀM LẠI SLIDE 2 — NỘI DUNG TRÌNH BÀY (5 PHẦN TỔNG QUÁT)
# ==============================================================================
print("\n--- BƯỚC 1: TÁI CẤU TRÚC SLIDE 2 (5 PHẦN TỔNG QUÁT) ---")
slide2 = prs.slides[1]

# 1. Xóa tất cả các shapes 14 mục con cũ (chỉ giữ Top Bar, Tiêu đề và Footer)
shapes_to_delete = []
for s in slide2.shapes:
    if s.has_text_frame and "NỘI DUNG TRÌNH BÀY" in s.text:
        continue
    if s.has_text_frame and "Hommy BDS" in s.text:
        continue
    if s.top == 0 and s.height < 700000:
        continue
    shapes_to_delete.append(s)

for s in shapes_to_delete:
    slide2.shapes._spTree.remove(s._element)

print(f"  ✓ Đã dọn dẹp các mục cũ, còn lại {len(slide2.shapes)} shapes cơ bản.")

# 2. Dữ liệu 5 Phần Tổng Quát
SECTIONS = [
    {
        "num": "01",
        "title": "TỔNG QUAN & ĐẶT VẤN ĐỀ",
        "desc": "Bối cảnh thị trường BĐS · Nhu cầu chuyển đổi số · Mục tiêu nghiên cứu & Phạm vi đề tài",
        "is_demo": False
    },
    {
        "num": "02",
        "title": "PHÂN TÍCH & THIẾT KẾ KIẾN TRÚC HỆ THỐNG",
        "desc": "Kiến trúc công nghệ MERN Stack & Hạ tầng · Mô hình CSDL · Phân quyền 5 nhóm người dùng (RBAC)",
        "is_demo": False
    },
    {
        "num": "03",
        "title": "HIỆN THỰC CÁC PHÂN HỆ CHỨC NĂNG CỐT LÕI",
        "desc": "Quy trình Đăng tin & Bản đồ Leaflet · Lịch hẹn & Hợp đồng QR · Thanh toán SePay · Real-time Socket.IO & AI Định giá",
        "is_demo": False
    },
    {
        "num": "04",
        "title": "KỊCH BẢN DEMO HỆ THỐNG THỰC TẾ",
        "tag": "★ TRỌNG TÂM (5 PHÚT)",
        "desc": "Trình diễn luồng giao dịch khép kín đa vai trò: Khách hàng ↔ Chủ dự án ↔ Môi giới (NVBH) ↔ Quản trị Admin",
        "is_demo": True
    },
    {
        "num": "05",
        "title": "ĐÁNH GIÁ KẾT QUẢ, HẠN CHẾ & KẾT LUẬN",
        "desc": "Đánh giá kết quả kiểm thử thực nghiệm (40 Test Cases PASS) · Hạn chế tồn đọng · Định hướng phát triển & Kết luận",
        "is_demo": False
    }
]

# 3. Vẽ 5 Card Hàng Ngang
W_CARD = 11200000
H_CARD = 880000
GAP = 180000
X_START = 496000
Y_START = 1120000
W_BADGE = 1650000

for i, sec in enumerate(SECTIONS):
    card_top = Y_START + i * (H_CARD + GAP)
    is_demo = sec["is_demo"]

    # --- Khối Badge bên trái (Số phần) ---
    badge_shape = slide2.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        X_START, card_top, W_BADGE, H_CARD
    )
    badge_shape.line.color.rgb = GOLD if is_demo else NAVY
    badge_shape.line.width = Pt(1)
    badge_shape.fill.solid()
    badge_shape.fill.fore_color.rgb = GOLD if is_demo else NAVY

    tf_badge = badge_shape.text_frame
    tf_badge.word_wrap = True
    tf_badge.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf_badge.margin_left = tf_badge.margin_right = tf_badge.margin_top = tf_badge.margin_bottom = 0

    p_badge_label = tf_badge.paragraphs[0]
    p_badge_label.text = "PHẦN"
    p_badge_label.alignment = PP_ALIGN.CENTER
    p_badge_label.font.name = "Calibri"
    p_badge_label.font.size = Pt(10)
    p_badge_label.font.bold = True
    p_badge_label.font.color.rgb = WHITE

    p_badge_num = tf_badge.add_paragraph()
    p_badge_num.text = sec["num"]
    p_badge_num.alignment = PP_ALIGN.CENTER
    p_badge_num.font.name = "Arial"
    p_badge_num.font.size = Pt(22)
    p_badge_num.font.bold = True
    p_badge_num.font.color.rgb = WHITE

    # --- Khối Nội dung bên phải ---
    body_shape = slide2.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        X_START + W_BADGE, card_top, W_CARD - W_BADGE, H_CARD
    )
    body_shape.line.color.rgb = DEMO_BORDER if is_demo else BORDER_COLOR
    body_shape.line.width = Pt(2 if is_demo else 1)
    body_shape.fill.solid()
    body_shape.fill.fore_color.rgb = DEMO_BG if is_demo else LIGHT_BG

    tf_body = body_shape.text_frame
    tf_body.word_wrap = True
    tf_body.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf_body.margin_left = Inches(0.25)
    tf_body.margin_right = Inches(0.2)
    tf_body.margin_top = Inches(0.08)
    tf_body.margin_bottom = Inches(0.08)

    # Tiêu đề phần
    p_title = tf_body.paragraphs[0]
    p_title.text = sec["title"]
    p_title.font.name = "Arial"
    p_title.font.size = Pt(14.5)
    p_title.font.bold = True
    p_title.alignment = PP_ALIGN.LEFT
    p_title.font.color.rgb = RGBColor(0xB4, 0x53, 0x09) if is_demo else NAVY

    if is_demo:
        run_tag = p_title.add_run()
        run_tag.text = f"   {sec['tag']}"
        run_tag.font.size = Pt(11)
        run_tag.font.bold = True
        run_tag.font.color.rgb = RGBColor(0xDC, 0x26, 0x26) # Đỏ nổi bật

    # Mô tả nội dung bên dưới
    p_desc = tf_body.add_paragraph()
    p_desc.text = sec["desc"]
    p_desc.font.name = "Calibri"
    p_desc.font.size = Pt(11.5)
    p_desc.alignment = PP_ALIGN.LEFT
    p_desc.font.color.rgb = DARK_TEXT if is_demo else GRAY_TEXT

print("  ✓ Slide 2: Đã tạo xong 5 Card Hàng Ngang sang trọng, rõ ràng.")

# ==============================================================================
# BƯỚC 2: TẠO VÀ CHÈN SLIDE 13 — KỊCH BẢN DEMO THỰC TẾ HỆ THỐNG
# ==============================================================================
print("\n--- BƯỚC 2: TẠO VÀ CHÈN SLIDE DEMO THỰC TẾ ---")
# Sử dụng layout blank (index 6)
blank_layout = prs.slide_layouts[6]
demo_slide = prs.slides.add_slide(blank_layout)

# 1. Top Bar Navy
top_bar = demo_slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, 12188952, 694944)
top_bar.fill.solid()
top_bar.fill.fore_color.rgb = NAVY
top_bar.line.fill.background()

# Tiêu đề Header
tb_title = demo_slide.shapes.add_textbox(256032, 64008, 11704320, 566928)
tf_t = tb_title.text_frame
tf_t.word_wrap = True
p_t = tf_t.paragraphs[0]
p_t.text = "PHẦN 4 — KỊCH BẢN DEMO HỆ THỐNG THỰC TẾ"
p_t.font.name = "Arial"
p_t.font.size = Pt(20)
p_t.font.bold = True
p_t.font.color.rgb = WHITE

# 2. Footer
tb_footer = demo_slide.shapes.add_textbox(274320, 6483096, 9601200, 320040)
tf_f = tb_footer.text_frame
p_f = tf_f.paragraphs[0]
p_f.text = "Hommy BDS — Hệ thống Quản lý & Giao dịch Bất động sản"
p_f.font.size = Pt(9.5)
p_f.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

# 3. Banner mục tiêu demo
banner = demo_slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 496000, 800000, 11200000, 420000)
banner.fill.solid()
banner.fill.fore_color.rgb = RGBColor(0xEE, 0xF4, 0xFF)
banner.line.color.rgb = RGBColor(0xBF, 0xDB, 0xFE)
banner.line.width = Pt(1)
tf_b = banner.text_frame
tf_b.vertical_anchor = MSO_ANCHOR.MIDDLE
p_b = tf_b.paragraphs[0]
p_b.text = "🎯 MỤC TIÊU DEMO: Trình diễn luồng giao dịch khép kín giữa 4 vai trò trên nền tảng Hommy BDS (Thời lượng: ~5 phút)"
p_b.alignment = PP_ALIGN.CENTER
p_b.font.name = "Arial"
p_b.font.size = Pt(11.5)
p_b.font.bold = True
p_b.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

# 4. 4 Cột đại diện 4 vai trò
ROLES = [
    {
        "step": "BƯỚC 1",
        "role": "KHÁCH HÀNG (1:00)",
        "h_color": RGBColor(0x1E, 0x40, 0xAF), # Xanh dương
        "bg_color": RGBColor(0xFA, 0xFC, 0xFF),
        "border_color": RGBColor(0x93, 0xC5, 0xFD),
        "actions": [
            "Truy cập bản đồ Leaflet định vị GPS, lọc BĐS theo giá & tiện ích",
            "Xem chi tiết tin đăng, ảnh thực tế & thông số quy hoạch",
            "Nhắn tin realtime với môi giới qua Socket.IO",
            "Chat với AI Chatbot (Gemini LLM) hỏi đáp thủ tục pháp lý",
            "Chọn khung giờ & Đặt lịch hẹn xem nhà trực tuyến"
        ]
    },
    {
        "step": "BƯỚC 2",
        "role": "CHỦ DỰ ÁN (1:00)",
        "h_color": RGBColor(0x06, 0x5F, 0x46), # Xanh lá đậm
        "bg_color": RGBColor(0xFA, 0xFF, 0xFA),
        "border_color": RGBColor(0x86, 0xEF, 0xAC),
        "actions": [
            "Đăng tin BĐS mới với form thông số chuẩn hóa",
            "Mô hình AI (XGBoost) gợi ý khoảng giá bán tự động",
            "Tải hình ảnh căn hộ & đính kèm hồ sơ pháp lý",
            "Gửi duyệt tin đăng & Quản lý danh mục BĐS cá nhân",
            "Theo dõi phân bổ môi giới và tiến độ giao dịch"
        ]
    },
    {
        "step": "BƯỚC 3",
        "role": "MÔI GIỚI / NVBH (1:30)",
        "h_color": RGBColor(0xB4, 0x53, 0x09), # Vàng cam hổ phách
        "bg_color": RGBColor(0xFF, 0xFD, 0xF5),
        "border_color": RGBColor(0xFD, 0xE6, 0x8A),
        "actions": [
            "Nhận thông báo lịch hẹn qua Socket.IO realtime",
            "Khởi tạo Video Call trực tiếp với khách (WebRTC P2P)",
            "Xác nhận lịch xem nhà & lập dự thảo hợp đồng cọc",
            "Tạo mã VietQR thanh toán cọc SePay tự động",
            "Xác nhận trạng thái cọc thành công vào hệ thống"
        ]
    },
    {
        "step": "BƯỚC 4",
        "role": "QUẢN TRỊ ADMIN (1:00)",
        "h_color": RGBColor(0x5B, 0x21, 0xB6), # Tím
        "bg_color": RGBColor(0xFD, 0xFA, 0xFF),
        "border_color": RGBColor(0xD8, 0xB4, 0xFE),
        "actions": [
            "Kiểm duyệt tin đăng BĐS & đối chiếu hồ sơ pháp lý",
            "Xác thực danh tính người dùng qua quy trình eKYC",
            "Giám sát biến động số dư Ví điện tử nội bộ",
            "Đối soát tự động giao dịch qua SePay Webhook",
            "Dashboard thống kê: 31 tài khoản, 16 tin, 22 cuộc hẹn"
        ]
    }
]

COL_W = 2650000
COL_GAP = 200000
COL_LEFT_START = 496000
COL_TOP = 1320000
COL_H_HEADER = 580000
COL_H_BODY = 3900000

for j, role in enumerate(ROLES):
    col_left = COL_LEFT_START + j * (COL_W + COL_GAP)
    
    # Header cột
    h_box = demo_slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, col_left, COL_TOP, COL_W, COL_H_HEADER)
    h_box.fill.solid()
    h_box.fill.fore_color.rgb = role["h_color"]
    h_box.line.color.rgb = role["h_color"]
    tf_h = h_box.text_frame
    tf_h.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf_h.margin_left = tf_h.margin_right = tf_h.margin_top = tf_h.margin_bottom = 0
    
    p1 = tf_h.paragraphs[0]
    p1.text = role["step"]
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = "Calibri"
    p1.font.size = Pt(9.5)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(0xFE, 0xF0, 0x8A) # Vàng nhạt
    
    p2 = tf_h.add_paragraph()
    p2.text = role["role"]
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(11.5)
    p2.font.bold = True
    p2.font.color.rgb = WHITE

    # Body cột
    b_box = demo_slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, col_left, COL_TOP + COL_H_HEADER, COL_W, COL_H_BODY)
    b_box.fill.solid()
    b_box.fill.fore_color.rgb = role["bg_color"]
    b_box.line.color.rgb = role["border_color"]
    b_box.line.width = Pt(1.5)
    
    tf_b_col = b_box.text_frame
    tf_b_col.word_wrap = True
    tf_b_col.margin_left = Inches(0.12)
    tf_b_col.margin_right = Inches(0.12)
    tf_b_col.margin_top = Inches(0.15)
    tf_b_col.margin_bottom = Inches(0.1)

    for a_idx, act in enumerate(role["actions"]):
        p_act = tf_b_col.paragraphs[0] if a_idx == 0 else tf_b_col.add_paragraph()
        p_act.text = f"• {act}"
        p_act.alignment = PP_ALIGN.LEFT
        p_act.font.name = "Calibri"
        p_act.font.size = Pt(10.5)
        p_act.font.color.rgb = DARK_TEXT
        p_act.space_after = Pt(6)

# 5. Khối chân trang Môi trường & Dữ liệu thực nghiệm
tech_box = demo_slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 496000, 5880000, 11200000, 520000)
tech_box.fill.solid()
tech_box.fill.fore_color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Slate rất đậm
tech_box.line.color.rgb = RGBColor(0x33, 0x41, 0x55)
tf_tech = tech_box.text_frame
tf_tech.vertical_anchor = MSO_ANCHOR.MIDDLE
tf_tech.margin_left = Inches(0.2)
tf_tech.margin_top = Inches(0.05)
tf_tech.margin_bottom = Inches(0.05)

p_tech1 = tf_tech.paragraphs[0]
p_tech1.text = "⚙️ Môi trường: React/Vite (Port 5173) | Node.js/Express API (Port 5000) | MongoDB Atlas | Socket.IO Server"
p_tech1.font.name = "Calibri"
p_tech1.font.size = Pt(10)
p_tech1.font.bold = True
p_tech1.font.color.rgb = RGBColor(0x38, 0xBD, 0xF8) # Xanh cyan nhạt

p_tech2 = tf_tech.add_paragraph()
p_tech2.text = "📊 Dữ liệu thực nghiệm: 31 tài khoản test (5 vai trò) | 16 tin đăng BĐS thực | 22 cuộc hẹn | 40/40 Test Cases PASS"
p_tech2.font.name = "Calibri"
p_tech2.font.size = Pt(10)
p_tech2.font.color.rgb = RGBColor(0xEA, 0xE8, 0xE4)

# Reorder: Đưa slide Demo vừa tạo vào vị trí Slide 13 (index 12 trong danh sách 16 slides)
sldIdLst = prs.slides._sldIdLst
demo_sldId = sldIdLst[-1]
sldIdLst.insert(12, demo_sldId)
print("  ✓ Đã chèn Slide Demo vào vị trí Slide 13 thành công.")

# ==============================================================================
# BƯỚC 3: ĐỒNG BỘ TIÊU ĐỀ CÁC SLIDE THEO 5 PHẦN TỔNG QUÁT
# ==============================================================================
print("\n--- BƯỚC 3: ĐỒNG BỘ TIÊU ĐỀ CÁC SLIDE THEO 5 PHẦN TỔNG QUÁT ---")

NEW_TITLES = {
    2: "PHẦN 1 — BỐI CẢNH & VẤN ĐỀ ĐẶT RA",
    3: "PHẦN 1 — MỤC TIÊU & PHẠM VI ĐỀ TÀI",
    4: "PHẦN 2 — KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ SỬ DỤNG",
    5: "PHẦN 2 — PHÂN QUYỀN & DASHBOARD THEO VAI TRÒ",
    6: "PHẦN 3 — QUY TRÌNH ĐĂNG TIN & KIỂM DUYỆT TẬP TRUNG",
    7: "PHẦN 3 — BẢN ĐỒ SỐ LEAFLET & TÌM KIẾM BẤT ĐỘNG SẢN",
    8: "PHẦN 3 — ĐẶT LỊCH XEM NHÀ & HỢP ĐỒNG CỌC QR CODE",
    9: "PHẦN 3 — VÍ ĐIỆN TỬ NỘI BỘ & CỔNG THANH TOÁN SEPAY / VIETQR",
    10: "PHẦN 3 — GIAO TIẾP REAL-TIME · CHATBOT AI · THÔNG BÁO ĐA KÊNH",
    11: "PHẦN 3 — AI/ML: DỰ ĐOÁN GIÁ BẤT ĐỘNG SẢN & KẾT QUẢ MÔ HÌNH",
    # Index 12 là slide Demo (đã có tiêu đề sẵn)
    13: "PHẦN 5 — HẠN CHẾ HIỆN TẠI & HƯỚNG PHÁT TRIỂN TIẾP THEO",
    14: "PHẦN 5 — KẾT LUẬN & ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC"
}

for s_idx, new_title in NEW_TITLES.items():
    slide = prs.slides[s_idx]
    # Tìm shape tiêu đề trên cùng
    found = False
    for s in slide.shapes:
        if s.has_text_frame and s.top < 800000 and s.height < 700000 and s.text.strip():
            # Cập nhật run đầu tiên
            tf = s.text_frame
            for p in tf.paragraphs:
                p.text = new_title
                p.font.name = "Arial"
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = WHITE
            found = True
            break
    if found:
        print(f"  ✓ Slide {s_idx+1:02d}: Cập nhật tiêu đề -> {new_title}")
    else:
        print(f"  ⚠ Slide {s_idx+1:02d}: Không tìm thấy shape tiêu đề header")

# Lưu kết quả
prs.save(OUTPUT_FILE)
print(f"\n✅ ĐÃ HOÀN TẤT! File mới đã được lưu tại: {OUTPUT_FILE}")
print(f"Tổng số slides hiện tại: {len(prs.slides)}")
