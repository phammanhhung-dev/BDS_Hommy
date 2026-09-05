# 🐛 KYC Debugging Guide - Hướng dẫn kiểm tra lỗi

## 📋 Tình huống hiện tại
Sau khi triển khai OCRServiceV2 và QR multi-region scanning, bạn cần test để xác định:
1. QR code có được detect không? (console logs)
2. OCR từng field có chính xác không?
3. Thời gian xử lý có chấp nhận được không? (<3 giây)

---

## 🔍 Bước 1: Kiểm tra Console Logs

### Mở DevTools
1. Mở trình duyệt (Chrome/Edge/Firefox)
2. Nhấn **F12** hoặc **Ctrl+Shift+I**
3. Chọn tab **Console**
4. Xóa các logs cũ: Click biểu tượng 🚫 (Clear console)

### Chạy KYC Flow
1. Navigate đến `/xac-thuc-kyc`
2. Chụp 3 ảnh: CCCD mặt trước, mặt sau, selfie
3. Click "Kiểm tra thông tin"
4. Quan sát console logs

---

## 📊 Logs mong đợi (QR thành công)

```
🔍 Bắt đầu quét QR code từ ảnh CCCD...
   Attempt 1: Scan full image...
   ❌ Full image scan failed: QR Code pattern not found
   Attempt (top-right-large): Scan cropped region...
   ✅ QR found on cropped region: top-right-large
✅ QR Code đọc thành công: {
  soCCCD: "060203002124",
  soCMND: "261426123",
  hoTen: "Võ Nguyễn Hoành Hợp",
  ngaySinh: "11/11/2003",
  gioiTinh: "Nam",
  diaChi: "15, Đường Hà Huy Tập, Chợ Lầu, Bắc Bình, Bình Thuận",
  ngayCap: "19/04/2021"
}

🚀 Bắt đầu OCR tất cả fields với ROI-based extraction...
🔍 OCR field "soCCCD" at ROI: { x: 0.3646632048404658, y: 0.40167174309188105, width: 0.45, height: 0.1 }
   soCCCD: 100%
✅ soCCCD: "060203002124" (confidence: 98.3%)

🔍 OCR field "tenDayDu" at ROI: { x: 0.4, y: 0.33, width: 0.5, height: 0.08 }
   tenDayDu: 100%
✅ tenDayDu: "VÕ NGUYỄN HOÀNH HỢP" (confidence: 96.7%)

🔍 OCR field "ngaySinh" at ROI: { x: 0.4, y: 0.41, width: 0.3, height: 0.06 }
   ngaySinh: 100%
✅ ngaySinh: "11/11/2003" (confidence: 99.2%)

🔍 OCR field "gioiTinh" at ROI: { x: 0.4, y: 0.47, width: 0.15, height: 0.06 }
   gioiTinh: 100%
✅ gioiTinh: "Nam" (confidence: 97.5%)

🔍 OCR field "diaChi" at ROI: { x: 0.4, y: 0.59, width: 0.5, height: 0.12 }
   diaChi: 100%
✅ diaChi: "15, Đường Hà Huy Tập, Chợ Lầu, Bắc Bình, Bình Thuận" (confidence: 92.1%)

✅ OCR V2 completed: {...}

🔀 BƯỚC 3: Merge dữ liệu QR + OCR...
✅ Merge hoàn tất: { confidence: "99.8%", conflicts: 0 }

👤 BƯỚC 4: So khớp khuôn mặt...
✅ Face matching: 87.3%

🎉 Xử lý KYC hoàn tất!
```

---

## 🔴 Logs khi QR thất bại (OCR only)

```
🔍 Bắt đầu quét QR code từ ảnh CCCD...
   Attempt 1: Scan full image...
   ❌ Full image scan failed: QR Code pattern not found
   Attempt (top-right-large): Scan cropped region...
   ❌ top-right-large scan failed: QR Code pattern not found
   Attempt (top-right-medium): Scan cropped region...
   ❌ top-right-medium scan failed: QR Code pattern not found
   Attempt (top-right-small): Scan cropped region...
   ❌ top-right-small scan failed: QR Code pattern not found
   Attempt (top-center): Scan cropped region...
   ❌ top-center scan failed: QR Code pattern not found
⚠️ Không đọc được QR code, sẽ dùng OCR làm backup

🚀 Bắt đầu OCR tất cả fields với ROI-based extraction...
[Same OCR logs as above]

🔀 BƯỚC 3: Merge dữ liệu QR + OCR...
✅ Merge hoàn tất: { confidence: "85.2%", conflicts: 0 }
   (Confidence thấp hơn vì chỉ có OCR)
```

**UI hiển thị:** Red warning box:
> ⚠️ Không phát hiện QR code trên CCCD  
> Hệ thống đang sử dụng OCR làm nguồn dữ liệu duy nhất. Độ chính xác có thể thấp hơn.

---

## 🛠️ Bước 2: Kiểm tra Network Tab

### Mục đích
Kiểm tra ảnh đang gửi lên có đúng không, kích thước có quá lớn?

### Cách làm
1. DevTools → Tab **Network**
2. Filter: `kyc` hoặc `upload`
3. Trigger KYC flow
4. Tìm request POST với payload ảnh
5. Click request → Tab **Payload** → Xem `cccdFront` size

**Kích thước hợp lý:**
- 640x480 @ JPEG 90% → ~50-150 KB ✅
- 1920x1080 @ JPEG 95% → ~500-800 KB ⚠️ (chậm)
- 4K @ PNG → 5+ MB ❌ (cực chậm)

**Nếu quá lớn:** Giảm resolution trong Webcam settings:
```javascript
// XacThucKYC.jsx - Line ~35
videoConstraints={{
  width: 1280, // Giảm từ 1920
  height: 720, // Giảm từ 1080
  facingMode: "user"
}}
```

---

## 🧪 Bước 3: Test Từng Thành Phần Riêng

### 3.1. Test QR Scanning (Isolated)
Tạo file test tạm: `client/src/test-qr.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>QR Test</title>
  <script type="module">
    import QRCodeService from './services/QRCodeService.js';
    
    async function testQR() {
      const input = document.getElementById('file-input');
      const result = await QRCodeService.scanFromImage(input.files[0]);
      console.log('QR Result:', result);
      document.getElementById('output').textContent = JSON.stringify(result, null, 2);
    }
    
    window.testQR = testQR;
  </script>
</head>
<body>
  <h1>QR Scanner Test</h1>
  <input type="file" id="file-input" accept="image/*" />
  <button onclick="testQR()">Scan QR</button>
  <pre id="output"></pre>
</body>
</html>
```

**Cách test:**
1. Chụp ảnh CCCD bằng điện thoại
2. Transfer ảnh về máy
3. Mở `test-qr.html` trong browser
4. Upload ảnh
5. Click "Scan QR"
6. Xem console logs

**Expected:** Nếu QR rõ → detect ngay attempt 1 hoặc 2  
**If fails:** QR bị mờ/glare → thử chụp lại với ánh sáng tốt hơn

### 3.2. Test OCR Field Extraction
Tạo file: `client/src/test-ocr.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>OCR Test</title>
  <script type="module">
    import OCRServiceV2 from './services/OCRServiceV2.js';
    
    async function testOCR() {
      const input = document.getElementById('file-input');
      const file = input.files[0];
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = await OCRServiceV2.recognizeAll(e.target.result);
        console.log('OCR Result:', result);
        document.getElementById('output').textContent = JSON.stringify(result, null, 2);
      };
      reader.readAsDataURL(file);
    }
    
    window.testOCR = testOCR;
  </script>
</head>
<body>
  <h1>OCR Field Test</h1>
  <input type="file" id="file-input" accept="image/*" />
  <button onclick="testOCR()">Extract Fields</button>
  <pre id="output"></pre>
</body>
</html>
```

**Cách test:**
1. Upload ảnh CCCD
2. Click "Extract Fields"
3. Xem console logs cho từng field:
   - soCCCD: 100% → 98.3% ✅
   - tenDayDu: 100% → 96.7% ✅
   - ngaySinh: 100% → 99.2% ✅

**If field null:** ROI coordinates sai → cần adjust

---

## 🔧 Bước 4: Điều chỉnh ROI Coordinates

### Khi nào cần adjust?
- Field trả về `null` hoặc gibberish
- Console log: "confidence: 45.2%" (quá thấp)
- Visual check: ROI crop không khớp field

### Cách adjust
1. Mở `client/src/services/OCRServiceV2.js`
2. Tìm `CCCD_ROI` object (line ~15)
3. Sửa coordinates:

**Ví dụ: Tên bị crop thiếu**
```javascript
// Current
tenDayDu: { x: 0.27435237337743795, y: 0.5376948164845092, width: 0.48, height: 0.09 },

// Adjust - Move down 2%
tenDayDu: { x: 0.27435237337743795, y: 0.5576948164845092, width: 0.48, height: 0.09 },
```

**Ví dụ: Số CCCD bị cắt bên phải**
```javascript
// Current
soCCCD: { x: 0.3646632048404658, y: 0.40167174309188105, width: 0.45, height: 0.1 },

// Adjust - Increase width 5%
soCCCD: { x: 0.3646632048404658, y: 0.40167174309188105, width: 0.50, height: 0.1 },
```

### Tool hỗ trợ: Visual ROI Debugger
Thêm vào `OCRServiceV2.js`:

```javascript
/**
 * Debug: Hiển thị ROI trên ảnh gốc
 */
debugROI: async (imageDataUrl, fieldName) => {
  const roi = OCRServiceV2.CCCD_ROI[fieldName];
  
  const img = new Image();
  img.src = imageDataUrl;
  await img.decode();
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(img, 0, 0);
  
  // Draw ROI rectangle
  const x = img.width * roi.x;
  const y = img.height * roi.y;
  const w = img.width * roi.width;
  const h = img.height * roi.height;
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  
  ctx.fillStyle = '#ff0000';
  ctx.font = '20px Arial';
  ctx.fillText(fieldName, x, y - 5);
  
  // Download debug image
  const link = document.createElement('a');
  link.download = `debug-${fieldName}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
```

**Usage:**
```javascript
await OCRServiceV2.debugROI(imageDataUrl, 'tenDayDu');
// Downloads "debug-tenDayDu.png" with red rectangle showing ROI
```

---

## 📊 Bước 5: Đo Performance

### Timing Breakdown
Thêm vào `XacThucKYC.jsx`:

```javascript
const processKYC = async (selfieSrc) => {
  const timings = {};
  
  // QR Scan
  const qrStart = performance.now();
  const qrResult = await QRCodeService.scanFromImage(images.cccdFront);
  timings.qr = performance.now() - qrStart;
  
  // OCR V2
  const ocrStart = performance.now();
  const parsedOCRData = await OCRServiceV2.recognizeAll(images.cccdFront);
  timings.ocr = performance.now() - ocrStart;
  
  // Face Matching
  const faceStart = performance.now();
  const score = await FaceMatchingService.compareFaces(img1, img2);
  timings.face = performance.now() - faceStart;
  
  timings.total = timings.qr + timings.ocr + timings.face;
  
  console.log('⏱️ Performance Timings:', timings);
  console.table(timings);
};
```

**Expected (Desktop i5):**
- QR: 300-800ms (5 attempts)
- OCR V2: 1500-2500ms (5 fields)
- Face: 200-400ms
- **Total: 2-3.5 seconds** ✅

**If slower than 5 seconds:**
- Reduce image resolution (1280x720 thay vì 1920x1080)
- Skip face matching (comment out)
- Optimize ROI preprocessing (remove scale 3x → scale 2x)

---

## 🐞 Common Issues & Fixes

### Issue 1: "Tesseract worker failed to load"
**Cause:** CDN blocked hoặc offline

**Fix:**
```javascript
// OCRServiceV2.js - line ~215
const worker = await Tesseract.createWorker('vie', 1, {
  workerPath: '/tesseract-worker.js', // Local copy
  langPath: '/tessdata',               // Local Vietnamese data
  logger: m => console.log(m)
});
```

Download Tesseract assets:
```bash
cd client/public
mkdir tessdata
curl -L https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/vie.traineddata.gz -o tessdata/vie.traineddata.gz
gunzip tessdata/vie.traineddata.gz
```

### Issue 2: QR returns "null" despite clear QR code
**Cause:** `html5-qrcode` library issue

**Fix:** Try alternative library `jsQR`:
```bash
npm install jsqr --legacy-peer-deps
```

```javascript
// QRCodeService.js
import jsQR from 'jsqr';

scanWithJsQR: async (imageDataUrl) => {
  const img = new Image();
  img.src = imageDataUrl;
  await img.decode();
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, canvas.width, canvas.height);
  
  if (code) {
    return QRCodeService.parseQRData(code.data);
  }
  return null;
}
```

### Issue 3: OCR returns empty for all fields
**Cause:** ROI coordinates completely wrong

**Fix:** Use debugROI() to visualize:
```javascript
for (const field of ['soCCCD', 'tenDayDu', 'ngaySinh', 'diaChi']) {
  await OCRServiceV2.debugROI(imageDataUrl, field);
}
// Check downloaded images → adjust coordinates
```

### Issue 4: Address field cut off (2 lines)
**Cause:** Height too small (0.12 → ~50px, not enough for 2 lines)

**Fix:**
```javascript
diaChi: { x: 0.40, y: 0.59, width: 0.50, height: 0.15 } // Tăng từ 0.12 → 0.15
```

---

## 📧 Reporting Bugs

Khi gặp lỗi, gửi cho dev team:

### Format báo cáo
```
**Bug:** OCR field "tenDayDu" returns null

**Steps to reproduce:**
1. Open /xac-thuc-kyc
2. Upload CCCD image (attached: cccd-test.jpg)
3. Click "Kiểm tra thông tin"
4. Result: tenDayDu = null

**Console logs:**
🔍 OCR field "tenDayDu" at ROI: { x: 0.4, y: 0.33, width: 0.5, height: 0.08 }
   tenDayDu: 100%
❌ tenDayDu: null (confidence: 35.2%)

**Expected:** Should extract name "VÕ NGUYỄN HOÀNH HỢP"

**Actual:** Returns null

**Browser:** Chrome 120.0.6099.109
**OS:** Windows 11
**Image resolution:** 1920x1080
```

### Attachments
1. Screenshot of preview page
2. Original CCCD image (blur sensitive data if needed)
3. Debug ROI images (if you ran debugROI())
4. Full console logs (copy từ F12 Console)

---

## ✅ Success Checklist

Sau khi test, verify:
- [ ] QR scan thành công ≥80% trường hợp
- [ ] OCR accuracy ≥85% cho mỗi field
- [ ] Total processing time <3 seconds
- [ ] UI hiển thị warning khi QR fail
- [ ] Merged data confidence ≥90%
- [ ] Face matching score hợp lý (>70% với cùng người)
- [ ] No JavaScript errors in console
- [ ] No network errors (Tesseract workers load OK)

**If ALL pass:** ✅ Ready for production deployment  
**If ANY fail:** 🔧 Continue debugging với hướng dẫn trên

---

**Last updated:** 2024-01-XX  
**Maintainer:** GitHub Copilot + Dev Team
