# Fix: KYC Model Files - Tensor Shape Mismatch Error

**Date:** November 22, 2025  
**Issue:** `Error: Based on the provided shape, [3,3,256,512], the tensor should have 1179648 values but has 619230`

---

## 🐛 Root Cause

**Problem:** AI model files (`.shard1`) downloaded từ GitHub raw URLs bị **truncate tại 4MB** do:
- GitHub Large File Storage (LFS) limitations
- CDN caching issues
- HTTP chunked transfer encoding problems

**Evidence:**
```powershell
Name                                  Size(KB)
----                                  --------
ssd_mobilenetv1_model-shard1          4096    # ❌ Should be ~5485 KB
face_recognition_model-shard1         4096    # ❌ Should be ~6293 KB
```

**Impact:**
- TensorFlow.js không thể reconstruct tensor từ incomplete weights
- Face detection API throw error: "load model before inference"
- KYC verification flow không hoạt động

---

## ✅ Solution Applied

### Step 1: Switch to Reliable Source
**From:** `github.com/justadudewhohacks/face-api.js/raw/master/weights/`  
**To:** NPM package `@vladmandic/face-api` (fork với better model management)

```bash
npm install --no-save --legacy-peer-deps @vladmandic/face-api
```

### Step 2: Copy Complete Model Files
```powershell
Copy-Item "client/node_modules/@vladmandic/face-api/model/*" "client/public/models/" -Force
```

**Result:**
```
ssd_mobilenetv1_model.bin          5485.31 KB  ✅
face_recognition_model.bin         6293.00 KB  ✅
face_landmark_68_model.bin          348.48 KB  ✅
tiny_face_detector_model.bin        188.79 KB  ✅
```

### Step 3: Remove Corrupt Shard Files
```powershell
Remove-Item "client/public/models/*-shard1" -Force
Remove-Item "client/public/models/*-weights_manifest.json" -Force
```

**Reason:** face-api.js ưu tiên load `.shard` files trước `.bin` files. Bằng cách xóa shard files, force nó dùng `.bin` format (complete và reliable hơn).

---

## 🔍 Technical Details

### File Format Comparison

| Format | Size Limit | Reliability | Use Case |
|--------|-----------|-------------|----------|
| `.bin` | No limit | ✅ High | Production (single binary) |
| `-shard1` + manifest | Varies | ⚠️ Medium | Large models (sharded for parallel download) |

### Why `.bin` Works Better
1. **Single file:** No assembly required, atomic download
2. **No manifest parsing:** Direct binary read
3. **CDN friendly:** Standard MIME type `application/octet-stream`
4. **Git LFS compatible:** Proper binary file handling

### Model Loading Priority (face-api.js)
```javascript
// Priority order:
1. {modelName}-weights_manifest.json + shard files
2. {modelName}.bin (fallback)
```

---

## 📋 Verification Checklist

**Frontend (Browser Console):**
- [ ] No "load model before inference" errors
- [ ] No tensor shape mismatch errors
- [ ] Face detection returns valid descriptors
- [ ] Euclidean distance calculation succeeds

**File System:**
```powershell
Get-ChildItem "client/public/models" -Filter "*.bin" | 
  Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,2)}}
```

**Expected Output:**
```
face_landmark_68_model.bin          348.48 KB
face_recognition_model.bin         6293.00 KB
ssd_mobilenetv1_model.bin          5485.31 KB
tiny_face_detector_model.bin        188.79 KB
```

---

## 🚀 Updated Download Script

**File:** `scripts/download-kyc-models.js`

**Key Changes:**
1. ✅ Added file size validation
2. ✅ Fallback to NPM package source
3. ✅ Progress tracking with warnings
4. ✅ Auto-cleanup of corrupt files

**Usage:**
```bash
node scripts/download-kyc-models.js
```

**Note:** Script giờ detect incomplete downloads và warning user, nhưng **recommend manual copy từ node_modules** thay vì download trực tiếp.

---

## 📚 References

- **GitHub Issue:** [face-api.js #602](https://github.com/justadudewhohacks/face-api.js/issues/602) - Same tensor shape error
- **Fork Used:** [@vladmandic/face-api](https://www.npmjs.com/package/@vladmandic/face-api) - Active fork với better model hosting
- **TensorFlow.js Docs:** [Model Format Guide](https://www.tensorflow.org/js/guide/conversion)

---

## ⚠️ Known Limitations

1. **Tesseract Vietnamese Data:** `vie.traineddata.gz` vẫn có thể bị truncate nếu download từ GitHub. Alternative: Use Tesseract CDN (`unpkg.com/tesseract.js-core@v5.0.0/tesseract-core-simd-lstm.wasm.js`)

2. **Model Size:** Total ~12MB (5.5 + 6.3 + 0.35 + 0.19 MB). Consider lazy loading nếu cần optimize initial page load.

3. **Browser Compatibility:** Face-api.js require WebGL support. Fallback UI cần implement cho older browsers.

---

## 🎯 Next Steps

1. Test KYC flow end-to-end với real CCCD images
2. Monitor browser memory usage (face-api.js có thể memory leak với repeated detections)
3. Implement model caching strategy (service worker) cho offline mode
4. Consider migrating sang MediaPipe Face Detection (Google's official alternative, better performance)
