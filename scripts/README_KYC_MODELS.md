# Script tải model AI cho tính năng KYC

## Mục đích
Script này tự động tải các file model cần thiết cho tính năng xác thực KYC (eKYC):
- **Face-api.js models:** Phát hiện và nhận dạng khuôn mặt
- **Tesseract.js language data:** OCR tiếng Việt cho CCCD

## Cách sử dụng

### Lần đầu setup (hoặc khi thiếu models):
```bash
npm run download-kyc-models
```

### Hoặc chạy trực tiếp:
```bash
node scripts/download-kyc-models.js
```

## Files được tải về

### Face-api.js Models (client/public/models/):
1. `ssd_mobilenetv1_model-shard1` (5.4 MB) - Face detection
2. `face_landmark_68_model-shard1` (350 KB) - Facial landmarks
3. `face_recognition_model-shard1` (6.2 MB) - Face recognition
4. `tiny_face_detector_model-shard1` (190 KB) - Tiny detector

### Tesseract.js Data (client/public/tessdata/):
1. `vie.traineddata.gz` (11.2 MB) - Vietnamese OCR data

## Khi nào cần chạy lại?

- Sau khi clone repository lần đầu
- Khi gặp lỗi "load model before inference"
- Khi gặp lỗi "Based on the provided shape..." hoặc "tensor should have X values but has Y"
- Sau khi xóa thư mục `client/public/models` hoặc `client/public/tessdata`
- Khi models bị corrupt hoặc không tải đầy đủ

## ⚠️ Lỗi "tensor should have X values but has Y"

**Nguyên nhân:** Models bị corrupt hoặc không tương thích với version face-api.js

**Giải pháp:**
1. Xóa tất cả files trong `client/public/models/`
2. Chạy lại script: `npm run download-kyc-models`
3. Nếu vẫn lỗi, tải thủ công từ:
   - https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   - Copy vào `client/public/models/`

## Tổng dung lượng
~23 MB (không nén)

## Nguồn models
- Face-api.js: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
- Tesseract.js: https://github.com/naptha/tessdata/tree/gh-pages/4.0.0
