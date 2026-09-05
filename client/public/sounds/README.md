# Thư mục Âm thanh Thông báo

Thư mục này chứa các file âm thanh thông báo cho hệ thống.

## Cấu trúc File

Đặt các file âm thanh với tên sau vào thư mục này:

- `notification-default.mp3` - Âm thanh mặc định cho thông báo thường
- `notification-message.mp3` - Âm thanh cho tin nhắn/trò chuyện
- `notification-call.mp3` - Âm thanh cho video call
- `notification-urgent.mp3` - Âm thanh cho thông báo khẩn cấp

## Nguồn Âm thanh Miễn phí

### 1. Freesound.org (Khuyến nghị)
- URL: https://freesound.org
- Tìm kiếm: "notification", "alert", "bell", "chime", "ding"
- Lọc theo: Duration < 2s, License: CC0 hoặc Attribution
- Một số gợi ý:
  - "notification bell" - Tiếng chuông thông báo
  - "pop sound" - Âm thanh pop vui tai
  - "chime notification" - Tiếng chuông nhẹ nhàng
  - "ding sound" - Tiếng ding ngắn gọn

### 2. Zapsplat.com
- URL: https://www.zapsplat.com
- Tìm kiếm: "notification", "alert", "bell"
- Cần đăng ký miễn phí để tải về

### 3. SoundBible.com
- URL: https://soundbible.com
- Tìm kiếm: "notification", "alert", "bell"
- Nhiều file miễn phí, dễ tải về

## Gợi ý Mẫu Âm thanh Thú vị

### Cho notification-default.mp3 (1-2 giây):
- **Pop/Plop sound**: Âm thanh pop nhẹ nhàng, vui tai
- **Soft bell**: Tiếng chuông mềm mại, không gây giật mình
- **Chime**: Tiếng chuông nhẹ, dễ chịu
- **Whoosh**: Âm thanh whoosh ngắn, hiện đại

### Cho notification-message.mp3 (1-2 giây):
- **Message pop**: Âm thanh pop đặc trưng cho tin nhắn
- **Chat notification**: Tiếng thông báo chat nhẹ nhàng
- **Soft ding**: Tiếng ding mềm mại

### Cho notification-call.mp3 (1-2 giây):
- **Phone ring short**: Tiếng chuông điện thoại ngắn
- **Call alert**: Âm thanh cảnh báo cuộc gọi
- **Video call sound**: Âm thanh đặc trưng cho video call

### Cho notification-urgent.mp3 (1-2 giây):
- **Alert sound**: Âm thanh cảnh báo rõ ràng nhưng không quá chói tai
- **Warning chime**: Tiếng chuông cảnh báo
- **Urgent notification**: Âm thanh thông báo khẩn cấp

## Yêu cầu Kỹ thuật

- **Format**: MP3 (khuyến nghị) hoặc WAV
- **Duration**: 1-2 giây
- **Bitrate**: 128kbps trở lên (cho MP3)
- **Volume**: Nên normalize để không quá to hoặc quá nhỏ
- **Sample Rate**: 44.1kHz (chuẩn)

## Cách Tải và Đặt File

1. Truy cập một trong các nguồn trên
2. Tìm kiếm âm thanh phù hợp với mô tả
3. Tải file về (đảm bảo license cho phép sử dụng thương mại)
4. Đổi tên file theo cấu trúc trên
5. Đặt vào thư mục `client/public/sounds/`

## Lưu ý

- Kiểm tra license của file âm thanh trước khi sử dụng
- Nên test âm thanh trên nhiều trình duyệt khác nhau
- Cân nhắc tạo fallback nếu file không tải được
- Có thể tạo nhiều biến thể cho cùng một loại để người dùng chọn


