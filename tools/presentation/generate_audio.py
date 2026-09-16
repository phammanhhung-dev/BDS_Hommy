import os
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\phamm\Desktop\BDS_Hommy_Demo_Audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "vi-VN-NamMinhNeural"

SCRIPTS = {
    "Part01_TrangChu_TimKiem_BanDo.mp3": (
        "Kính chào quý thầy cô và hội đồng phản biện. Sau đây em xin phép trình bày video demo hệ thống web quản lý và giao dịch bất động sản Hommy BDS. "
        "Đầu tiên là trang chủ của hệ thống Hommy BDS — nền tảng quản lý và giao dịch bất động sản toàn diện. "
        "Trang chủ hiển thị thanh điều hướng, các tin đăng bất động sản mới nhất, các dự án tiêu biểu và thông tin hỗ trợ. "
        "Tiếp theo là chức năng tìm kiếm và lọc bất động sản đa tiêu chí. "
        "Người dùng có thể lọc theo loại hình như chung cư, nhà phố, mức giá, diện tích, vị trí quận huyện, và sắp xếp linh hoạt. "
        "Khi bấm vào chi tiết một bất động sản, hệ thống hiển thị hình ảnh, thông số chi tiết, chính sách đặt cọc và form đặt lịch xem nhà. "
        "Điểm đặc biệt là hệ thống tích hợp bản đồ số Leaflet với tọa độ GPS thực tế. "
        "Người dùng có thể phóng to thu nhỏ, bấm vào ghim vị trí để tra cứu thông tin trực quan."
    ),
    "Part02_DangNhap_Vi_VietQR.mp3": (
        "Hệ thống phân quyền 5 nhóm người dùng chặt chẽ. Ở đây, em tiến hành đăng nhập với tài khoản Chủ dự án. "
        "Sau khi đăng nhập, Chủ dự án có thể truy cập Ví điện tử cá nhân. "
        "Giao diện ví thể hiện rõ số dư khả dụng, lịch sử biến động số dư như tiền nạp, tiền đặt cọc và tiền hoa hồng. "
        "Hệ thống tích hợp cổng thanh toán trực tuyến SePay. "
        "Khi người dùng nhập số tiền nạp, hệ thống tự động sinh mã VietQR chuẩn ngân hàng. "
        "Khi chuyển khoản thành công, SePay gửi Webhook về máy chủ và số dư tài khoản được cộng ngay lập tức mà không cần xác nhận thủ công."
    ),
    "Part03_DashboardCDA_GoiYAI_HopDongQR.mp3": (
        "Tại Bảng điều khiển dành riêng cho Chủ dự án, giao diện hiển thị các chỉ số KPI trực quan như số tin đăng đang hoạt động, "
        "số cuộc hẹn trong tuần, hợp đồng mới và biểu đồ doanh thu. "
        "Khi tạo tin đăng mới, sau khi nhập diện tích, số phòng và khu vực, hệ thống sẽ tự động gọi AI Microservice để gợi ý mức giá tham khảo "
        "dựa trên mô hình Machine Learning XGBoost với độ chính xác cao. "
        "Mục quản lý cuộc hẹn cho phép Chủ dự án theo dõi trạng thái lịch hẹn xem nhà từ Chờ xác nhận, Đã xác nhận đến Hoàn thành. "
        "Về quản lý hợp đồng, Chủ dự án có thể sinh mã QR động cho hợp đồng đặt cọc để khách hàng quét và thanh toán tiền cọc trực tiếp từ ví."
    ),
    "Part04_NVDH_DuyetTin_PhanCong.mp3": (
        "Chuyển sang vai trò Nhân viên điều hành. Đây là bộ phận kiểm duyệt tập trung tin đăng trên hệ thống. "
        "Nhân viên điều hành kiểm tra tính pháp lý, trạng thái eKYC của Chủ dự án trước khi phê duyệt tin đăng ra công chúng. "
        "Bên cạnh đó, Nhân viên điều hành có lịch làm việc trực quan để phân công nhân viên bán hàng đi gặp khách, "
        "và theo dõi các biên bản bàn giao bất động sản."
    ),
    "Part05_NVBH_Lich_QRGoiY.mp3": (
        "Tiếp theo là giao diện của Nhân viên bán hàng. Bảng điều khiển hiển thị lịch hẹn được phân công hôm nay, "
        "lịch làm việc cá nhân và tiến độ hoa hồng theo tháng. "
        "Nhân viên bán hàng có thể tạo mã QR gợi ý các tin đăng phù hợp gửi nhanh cho khách hàng, "
        "cũng như ghi nhận kết quả tư vấn sau mỗi cuộc hẹn xem nhà."
    ),
    "Part06_DinhGia_AI.mp3": (
        "Một điểm nổi bật của hệ thống là trang Định giá Bất động sản bằng Trí tuệ nhân tạo. "
        "Bất kỳ người dùng nào cũng có thể nhập thông số căn nhà như diện tích, số phòng, vị trí "
        "để nhận định giá tức thì từ mô hình Machine Learning XGBoost được huấn luyện trên hơn 10 nghìn mẫu dữ liệu thực tế."
    ),
    "Part07_ChatRealTime_ChatbotAI.mp3": (
        "Hệ thống trang bị tính năng Nhắn tin trực tuyến thời gian thực sử dụng Socket.IO. "
        "Khách hàng và Chủ dự án có thể trao đổi trực tiếp, nhận tin nhắn ngay lập tức và xem trạng thái trực tuyến. "
        "Ngoài ra, hệ thống tích hợp Trợ lý ảo Chatbot AI ở góc màn hình, "
        "sẵn sàng tư vấn tìm kiếm nhà đất và giải đáp thắc mắc về quy trình 24 trên 7."
    ),
    "Part08_XacThuc_eKYC.mp3": (
        "Nhằm bảo đảm an toàn giao dịch và phòng chống gian lận, hệ thống triển khai quy trình xác thực định danh điện tử eKYC. "
        "Chủ dự án tải ảnh Căn cước công dân hai mặt và chụp ảnh khuôn mặt selfie "
        "để công nghệ AI nhận diện và đối soát danh tính chính xác."
    ),
    "Part09_AdminPanel.mp3": (
        "Cuối cùng là Phân hệ Quản trị viên hệ thống. "
        "Admin có quyền tối cao quản lý người dùng, phân quyền vai trò, khóa hoặc mở tài khoản, "
        "giám sát toàn bộ tin đăng, kiểm duyệt yêu cầu rút tiền và theo dõi nhật ký hoạt động của hệ thống."
    ),
    "Part10_KetLuan_CamOn.mp3": (
        "Trên đây là toàn bộ các tính năng cốt lõi của Hệ thống Web quản lý và giao dịch bất động sản Hommy BDS. "
        "Em xin chân thành cảm ơn quý thầy cô và hội đồng phản biện đã chú ý lắng nghe và theo dõi phần demo."
    ),
}

def generate():
    print(f"=== Bat dau tao file thuyet minh Voiceover AI ({VOICE}) ===")
    for filename, text in SCRIPTS.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            print(f"[Da co] {filename} ({os.path.getsize(filepath):,} bytes)")
            continue
        print(f"[Dang tao] {filename}...")
        text_file = os.path.join(OUTPUT_DIR, "_temp_text.txt")
        with open(text_file, "w", encoding="utf-8") as f:
            f.write(text)
        cmd = [
            sys.executable, "-m", "edge_tts",
            "--voice", VOICE,
            "-f", text_file,
            "--write-media", filepath
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if os.path.exists(text_file):
            try:
                os.remove(text_file)
            except Exception:
                pass
        if result.returncode == 0 and os.path.exists(filepath):
            print(f"  -> Thanh cong: {filename} ({os.path.getsize(filepath):,} bytes)")
        else:
            print(f"  -> Loi khi tao {filename}: {result.stderr}")
    print(f"\nHoan tat! Tat ca file am thanh da duoc luu tai:\n{OUTPUT_DIR}")

if __name__ == "__main__":
    generate()
