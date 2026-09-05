# Hướng dẫn Tích hợp Âm thanh Thông báo

## Đã Tích hợp

✅ Hook `useNotificationSound` đã được tạo và tích hợp vào `NotificationCenter`
✅ Tự động phát âm thanh khi nhận thông báo mới qua socket
✅ Hỗ trợ nhiều loại âm thanh khác nhau cho từng loại thông báo

## Cần Làm

### 1. Tải File Âm thanh

Truy cập các nguồn sau và tải về 4 file âm thanh:

#### Nguồn Khuyến nghị: Freesound.org

1. **notification-default.mp3** (1-2 giây)
   - Tìm kiếm: "pop sound", "soft bell", "chime notification"
   - Gợi ý: https://freesound.org/search/?q=pop+sound+short
   - Chọn file có duration < 2s, license CC0 hoặc Attribution

2. **notification-message.mp3** (1-2 giây)
   - Tìm kiếm: "message notification", "chat sound", "ding"
   - Gợi ý: https://freesound.org/search/?q=message+notification
   - Chọn file nhẹ nhàng, phù hợp cho tin nhắn

3. **notification-call.mp3** (1-2 giây)
   - Tìm kiếm: "phone ring short", "call alert", "video call"
   - Gợi ý: https://freesound.org/search/?q=phone+ring+short
   - Chọn file rõ ràng nhưng không quá chói tai

4. **notification-urgent.mp3** (1-2 giây)
   - Tìm kiếm: "alert sound", "warning chime", "urgent notification"
   - Gợi ý: https://freesound.org/search/?q=alert+sound+short
   - Chọn file cảnh báo rõ ràng nhưng không quá khó chịu

### 2. Đặt File vào Thư mục

Đặt 4 file đã tải vào:
```
client/public/sounds/
├── notification-default.mp3
├── notification-message.mp3
├── notification-call.mp3
└── notification-urgent.mp3
```

### 3. Test Âm thanh

1. Mở ứng dụng
2. Mở NotificationCenter
3. Tạo một thông báo mới (từ backend hoặc socket)
4. Kiểm tra xem âm thanh có phát không

## Cấu hình

### Thay đổi Âm lượng

Trong `NotificationCenter.jsx`, dòng 31:
```javascript
const { playNotificationSound } = useNotificationSound({ 
  enabled: true, 
  volume: 0.5  // Thay đổi từ 0.0 đến 1.0
});
```

### Tắt Âm thanh

```javascript
const { playNotificationSound } = useNotificationSound({ 
  enabled: false,  // Tắt âm thanh
  volume: 0.5
});
```

## Mapping Loại Thông báo → Âm thanh

| Loại Thông báo | Âm thanh |
|----------------|----------|
| `tro_chuyen_moi` | `notification-message.mp3` |
| `video_call` | `notification-call.mp3` |
| `cuoc_hen_moi` | `notification-default.mp3` |
| `cuoc_hen_cho_phe_duyet` | `notification-urgent.mp3` |
| `cuoc_hen_da_phe_duyet` | `notification-default.mp3` |
| `cuoc_hen_tu_choi` | `notification-urgent.mp3` |
| `cuoc_hen_tu_qr` | `notification-default.mp3` |
| `khach_huy_cuoc_hen` | `notification-urgent.mp3` |
| `phan_hoi_goi_y` | `notification-message.mp3` |
| Khác | `notification-default.mp3` |

## Troubleshooting

### Âm thanh không phát

1. **Kiểm tra file có tồn tại không:**
   - Mở DevTools → Network tab
   - Tìm request đến `/sounds/notification-*.mp3`
   - Kiểm tra status code (phải là 200)

2. **Kiểm tra browser policy:**
   - Một số browser yêu cầu user interaction trước khi phát âm thanh
   - Thử click vào page trước khi test

3. **Kiểm tra console:**
   - Mở DevTools → Console
   - Tìm warning/error về audio

### Âm thanh quá to/nhỏ

- Điều chỉnh `volume` trong `useNotificationSound` hook
- Hoặc normalize file âm thanh bằng tool như Audacity

### File không tải được

- Kiểm tra đường dẫn file
- Đảm bảo file ở đúng thư mục `client/public/sounds/`
- Kiểm tra tên file phải chính xác (case-sensitive)

## Nâng cao

### Thêm Loại Âm thanh Mới

1. Thêm file mới vào `client/public/sounds/`
2. Cập nhật `useNotificationSound.js`:
   ```javascript
   const soundMap = {
     // ... existing mappings
     'loai_thong_bao_moi': 'ten_file_am_thanh'
   };
   ```

### Cho phép Người dùng Chọn Âm thanh

1. Lưu preference vào localStorage
2. Cập nhật hook để đọc preference
3. Tạo UI cho phép chọn âm thanh


