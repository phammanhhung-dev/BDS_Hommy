# Real-time Card & Face Detection Implementation

## 📋 Tổng quan

Thay thế cơ chế đếm ngược 1-2-3 bằng **nhận diện thực tế** CCCD và khuôn mặt để tự động chụp khi khớp khung.

### Công nghệ sử dụng

**1. CardDetectionService** - Nhận diện CCCD
- **Edge Detection:** Sobel operator để phát hiện cạnh
- **Brightness Analysis:** Kiểm tra độ sáng (Luminance formula)
- **Sharpness Detection:** Laplacian variance để đánh giá độ nét
- **Rectangle Pattern Analysis:** Phân tích phân bố edges theo grid 3x3

**2. FaceAlignmentService** - Nhận diện khuôn mặt
- **face-api.js:** TensorFlow.js-based face detection
- **68-point Facial Landmarks:** Phát hiện các điểm đặc trưng trên khuôn mặt
- **Pose Estimation:** Tính toán góc Yaw, Pitch, Roll
- **Position & Size Analysis:** Kiểm tra vị trí và kích thước khuôn mặt

---

## 🎯 Luồng hoạt động

### 1. CCCD Detection (CardDetectionService)

```
Video Frame
    ↓
┌─────────────────────────────┐
│  Extract Overlay Region     │  10% margins, 80% width
│  (ROI: Region of Interest)  │  25% top, 45% height
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Brightness Check           │  Min: 80/255
│  Luminance = 0.299R+0.587G+ │  Score: normalized
│              0.114B         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Sharpness Check            │  Min: 30 (Laplacian)
│  Apply Laplacian kernel     │  Detects blur
│  Calculate variance         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Edge Detection             │  Sobel operator
│  Find card boundaries       │  Threshold: 100
│  with gradient magnitude    │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Rectangle Pattern Analysis │  9-cell grid
│  Check edge distribution    │  Corners strong
│  Corner vs Center ratio     │  Center weak
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Size & Aspect Ratio Check  │  Area: 15-65%
│  Estimated card area        │  Ratio: 1.586±15%
│  vs overlay area            │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Calculate Confidence       │  Weighted average:
│  brightness: 20%            │  - Brightness: 0.2
│  sharpness:  25%            │  - Sharpness:  0.25
│  edges:      35%            │  - Edges:      0.35
│  size:       20%            │  - Size:       0.2
└─────────────────────────────┘
    ↓
    Aligned if confidence ≥ 75%
```

### 2. Face Detection (FaceAlignmentService)

```
Video Frame
    ↓
┌─────────────────────────────┐
│  Load face-api.js Models    │  TinyFaceDetector
│  - tinyFaceDetector         │  + FaceLandmark68Net
│  - faceLandmark68Net        │  (from /models folder)
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Detect Single Face         │  TinyFaceDetectorOptions
│  with 68 Landmarks          │  inputSize: 224
│                             │  scoreThreshold: 0.5
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Position Check             │  Center tolerance: 15%
│  Face center vs Video center│  offsetX, offsetY
│  Must be centered           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Size Check                 │  Face area: 15-70%
│  Face bounding box area     │  Optimal: ~40%
│  vs video area              │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Orientation Check          │  Yaw:   ±15°
│  Using landmark positions:  │  Pitch: ±15°
│  - Yaw (left/right turn)    │  Roll:  ±10°
│  - Pitch (up/down tilt)     │
│  - Roll (head tilt)         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Detection Confidence Check │  Min: 0.7 (70%)
│  face-api.js detection score│  Neural network output
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Calculate Confidence       │  Weighted average:
│  position:    25%           │  - Position:   0.25
│  size:        20%           │  - Size:       0.2
│  orientation: 35%           │  - Orientation:0.35
│  confidence:  20%           │  - Confidence: 0.2
└─────────────────────────────┘
    ↓
    Aligned if confidence ≥ 75%
```

### 3. Auto-Capture Logic

```
Detection Loop (200ms interval = 5 FPS)
    ↓
┌─────────────────────────────┐
│  Run Detection Service      │  CardDetection or
│  (Card or Face)             │  FaceAlignment
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Check Alignment Result     │  aligned: boolean
│                             │  confidence: 0-1
│                             │  reason: string
└─────────────────────────────┘
    ↓
    Aligned? ──NO──> Reset counter
    │               consecutiveFrames = 0
    │               Cancel countdown
    YES
    ↓
┌─────────────────────────────┐
│  Increment Counter          │  consecutiveFrames++
│  Require 3 consecutive      │  (Avoid false positives)
│  aligned frames             │
└─────────────────────────────┘
    ↓
    Counter ≥ 3?
    │
    YES
    ↓
┌─────────────────────────────┐
│  Start Countdown 3-2-1      │  Visual feedback
│  (1 second intervals)       │  for user
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Auto-Capture at 0          │  Take screenshot
│  Call onCapture(imageSrc)   │  Return to parent
└─────────────────────────────┘
```

---

## 🔧 Tham số và Ngưỡng

### CardDetectionService Thresholds

```javascript
thresholds: {
  minCardArea: 0.15,           // Card ≥ 15% khung hình
  maxCardArea: 0.65,           // Card ≤ 65% khung hình
  aspectRatio: 1.586,          // CCCD: 85.6mm × 54mm
  aspectTolerance: 0.15,       // ±15% sai số
  minBrightness: 80,           // 0-255 scale
  minSharpness: 30,            // Laplacian variance
  edgeThreshold: 100,          // Sobel magnitude
  minCornerConfidence: 0.7     // Rectangle pattern match
}

overlayRegion: {
  x: 0.1,        // 10% từ trái
  y: 0.25,       // 25% từ trên
  width: 0.8,    // 80% chiều rộng
  height: 0.45   // 45% chiều cao
}
```

### FaceAlignmentService Thresholds

```javascript
thresholds: {
  minFaceSize: 0.15,           // Face ≥ 15% khung hình
  maxFaceSize: 0.7,            // Face ≤ 70% khung hình
  centerTolerance: 0.15,       // ±15% lệch tâm
  yawTolerance: 15,            // ±15° xoay trái/phải
  pitchTolerance: 15,          // ±15° ngẩng/cúi
  rollTolerance: 10,           // ±10° nghiêng đầu
  minConfidence: 0.7,          // 70% detection confidence
  minLandmarkDistance: 0.3     // Landmark spacing
}

faceRegion: {
  x: 0.15,      // 15% từ trái
  y: 0.2,       // 20% từ trên
  width: 0.7,   // 70% chiều rộng
  height: 0.6   // 60% chiều cao
}
```

### Auto-Capture Parameters

```javascript
detectionInterval: 200ms        // 5 FPS detection rate
consecutiveFramesRequired: 3    // 3 frames aligned = trigger
countdownDuration: 3s           // 3-2-1 countdown
countdownInterval: 1000ms       // 1 second per count
```

---

## 📊 Confidence Calculation

### Card Detection Confidence

```javascript
confidence = 
  brightnessScore × 0.2 +
  sharpnessScore  × 0.25 +
  (rectangleConfidence × 0.7 + edgesPassed × 0.3) × 0.35 +
  sizeScore       × 0.2

// Where each score is normalized 0-1
```

**Example:**
- Brightness: 120/255 → score = 1.0 (120 > 80)
- Sharpness: 45 → score = 1.0 (45 > 30)
- Edges: confidence = 0.8, passed = true → 0.8×0.7 + 0.3 = 0.86
- Size: 0.35 (35% area) → optimal → score = 0.975

**Total:** `1.0×0.2 + 1.0×0.25 + 0.86×0.35 + 0.975×0.2 = 0.896` **→ 89.6% ✓**

### Face Detection Confidence

```javascript
confidence = 
  positionScore    × 0.25 +
  sizeScore        × 0.2 +
  orientationScore × 0.35 +
  detectionScore   × 0.2

// Where each score is normalized 0-1
```

**Example:**
- Position: offsetX=0.05, offsetY=0.08 → score = 0.91
- Size: 40% area (optimal) → score = 1.0
- Orientation: yaw=5°, pitch=3°, roll=2° → score = 0.93
- Detection: face-api.js confidence = 0.85

**Total:** `0.91×0.25 + 1.0×0.2 + 0.93×0.35 + 0.85×0.2 = 0.9205` **→ 92% ✓**

---

## 🎨 UI Components

### Status Indicator với Confidence Bar

```jsx
<div className={`alignment-status ${isAligned ? 'aligned' : 'searching'}`}>
  <div className="status-text">{alignmentStatus}</div>
  <div className="confidence-bar">
    <div 
      className="confidence-fill" 
      style={{ 
        width: `${confidence * 100}%`,
        backgroundColor: 
          confidence >= 0.75 ? '#10b981' : // Green
          confidence >= 0.5  ? '#f59e0b' : // Orange
                               '#ef4444'   // Red
      }}
    />
  </div>
</div>
```

### Status Messages

**CCCD Detection:**
- ✓ CCCD nằm đúng vị trí
- Ánh sáng không đủ
- Ảnh bị mờ
- Chưa khớp khung
- Khoảng cách chưa phù hợp

**Face Detection:**
- ✓ Khuôn mặt đã khớp khung
- Di chuyển sang trái/phải/lên/xuống
- Tiến lại gần hơn / Lùi ra xa hơn
- Nhìn thẳng vào camera
- Giữ đầu thẳng
- Không nghiêng đầu
- Cải thiện ánh sáng

---

## 🚀 Performance Optimization

### Detection Rate
- **5 FPS (200ms interval):** Balance giữa responsiveness và CPU usage
- Tránh 30 FPS (33ms) vì quá tốn tài nguyên
- face-api.js TinyFaceDetector: ~50-100ms trên mobile

### Consecutive Frames Logic
- **3 frames liên tiếp aligned** trước khi trigger countdown
- Tránh false positive khi user di chuyển nhanh
- Total latency: 600ms (3 × 200ms)

### Canvas Optimization
```javascript
// CardDetectionService
this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
// Optimize for frequent getImageData() calls
```

### Memory Management
```javascript
// Cleanup timers on unmount
useEffect(() => {
  return () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };
}, []);
```

---

## 📦 Files Modified

### New Services
- ✅ `client/src/services/CardDetectionService.js` - 450 lines
- ✅ `client/src/services/FaceAlignmentService.js` - 380 lines

### Updated Components
- ✅ `client/src/components/KYC/CameraCapture.jsx`
  - Import 2 detection services
  - Real-time detection loop (5 FPS)
  - Consecutive frames logic
  - Confidence bar UI
  
- ✅ `client/src/components/KYC/CameraCapture.css`
  - `.status-text` - Message display
  - `.confidence-bar` - Progress bar container
  - `.confidence-fill` - Animated fill with color coding

---

## 🧪 Testing Checklist

### CCCD Detection
- [ ] Đặt CCCD trong khung → confidence tăng dần
- [ ] Di chuyển CCCD ra ngoài → confidence giảm
- [ ] Thử với ánh sáng yếu → "Ánh sáng không đủ"
- [ ] Blur camera → "Ảnh bị mờ"
- [ ] Đặt card quá gần/xa → "Khoảng cách chưa phù hợp"
- [ ] Auto-capture sau 3-2-1 countdown

### Face Detection
- [ ] Nhìn thẳng camera → confidence = 90%+
- [ ] Xoay đầu trái/phải → "Nhìn thẳng vào camera"
- [ ] Ngẩng/cúi đầu → "Giữ đầu thẳng"
- [ ] Nghiêng đầu → "Không nghiêng đầu"
- [ ] Lùi ra xa → "Tiến lại gần hơn"
- [ ] Tiến quá gần → "Lùi ra xa hơn"
- [ ] Di chuyển sang trái/phải → status guidance
- [ ] Auto-capture khi aligned 3 frames liên tiếp

### Edge Cases
- [ ] Không có CCCD/face → confidence = 0%
- [ ] Switch camera → reset alignment state
- [ ] Multiple faces → detectSingleFace chọn face lớn nhất
- [ ] Poor lighting → "Cải thiện ánh sáng"
- [ ] Models không load → "❌ Lỗi tải models"

---

## 🔬 Algorithm Deep Dive

### Sobel Edge Detection (Card)

```javascript
// Sobel X kernel       Sobel Y kernel
// [-1  0  +1]          [-1 -2 -1]
// [-2  0  +2]          [ 0  0  0]
// [-1  0  +1]          [+1 +2 +1]

const gx = 
  -gray[idx - width - 1] + gray[idx - width + 1] +
  -2 * gray[idx - 1]     + 2 * gray[idx + 1] +
  -gray[idx + width - 1] + gray[idx + width + 1];

const gy = 
  -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1] +
   gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

const magnitude = Math.sqrt(gx * gx + gy * gy);
```

### Laplacian Sharpness Detection

```javascript
// Laplacian kernel
// [-1 -1 -1]
// [-1  8 -1]
// [-1 -1 -1]

const laplacian =
  -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1] +
  -gray[idx - 1]         + 8 * gray[idx]     - gray[idx + 1] +
  -gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1];

variance += laplacian * laplacian;
sharpness = Math.sqrt(variance / pixelCount);
```

### Facial Landmarks Pose Estimation

```javascript
// Yaw (left/right rotation)
const eyeCenterX = (leftEye.x + rightEye.x) / 2;
const yawOffset = Math.abs(noseTip.x - eyeCenterX);
const faceWidth = Math.abs(leftEye.x - rightEye.x);
const yaw = (yawOffset / faceWidth) * 45;  // Scale to degrees

// Pitch (up/down tilt)
const eyeCenterY = (leftEye.y + rightEye.y) / 2;
const pitchOffset = noseTip.y - eyeCenterY;
const faceHeight = Math.abs(chin.y - eyeCenterY);
const pitch = (pitchOffset / faceHeight) * 30;

// Roll (head tilt)
const eyeLineAngle = Math.atan2(
  rightEye.y - leftEye.y, 
  rightEye.x - leftEye.x
);
const roll = (eyeLineAngle * 180) / Math.PI;
```

---

## 📚 References

- **face-api.js:** https://github.com/justadudewhohacks/face-api.js
- **Sobel Operator:** https://en.wikipedia.org/wiki/Sobel_operator
- **Laplacian of Gaussian:** https://homepages.inf.ed.ac.uk/rbf/HIPR2/log.htm
- **Facial Landmarks:** http://dlib.net/face_landmark_detection.py.html
- **CCCD Dimensions:** 85.6mm × 54mm (ISO/IEC 7810 ID-1)

---

## 🎯 Next Steps

1. **Test trên thiết bị thực:** Mobile Android/iOS cameras
2. **Fine-tune thresholds:** Dựa trên user feedback
3. **Optimize performance:** Web Workers cho heavy computation
4. **Add debug overlay:** Vẽ edges, landmarks lên canvas (development mode)
5. **A/B Testing:** So sánh conversion rate vs countdown cũ
6. **Analytics:** Track alignment time, failed attempts, retry rate

---

**Date:** 2025-01-22  
**Author:** GitHub Copilot  
**Status:** ✅ Implementation Complete - Ready for Testing
