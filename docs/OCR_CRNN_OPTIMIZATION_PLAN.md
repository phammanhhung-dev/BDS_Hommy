# 🎯 Kế hoạch Tối ưu hóa OCR CCCD - Chuyển sang CNN-LSTM Architecture

## 📋 Tổng quan

**Mục tiêu:** Nâng cấp hệ thống OCR từ Tesseract.js sang kiến trúc **CNN-LSTM + CTC** theo paper **"An improved CRNN for Vietnamese CID"** (TechScience 2023) và **VNU Journal of Science 2020**.

**Lý do nâng cấp:**
- Tesseract.js accuracy: ~70-85% (phụ thuộc preprocessing)
- CNN-LSTM accuracy: ~95-99% (proven với CCCD Việt Nam)
- Tối ưu CPU: Không cần GPU (chạy được trên browser với TensorFlow.js hoặc ONNX.js)

---

## 🎯 Hai Phương Án Implementation

### Phương Án 1: **Max Accuracy** (Paper TechScience 2023)
**Kiến trúc:** Mask-RCNN + EAST + CRNN joint CTC-Attention

**Pipeline:**
```
Input Image
  ↓
Mask-RCNN (InceptionResNet-v2) - Card Detection & Cropping
  ├─ Backbone: InceptionResNet-v2
  ├─ Pretrain: COCO 2017 → Fine-tune CCCD dataset
  └─ Accuracy: 98.85% (căn thẻ đúng + 4 góc)
  ↓
EAST Detector (ResNet-50) - Text Line Detection
  ├─ Backbone: ResNet-50 pretrain ICDAR 2015
  ├─ IoU threshold: 0.4
  └─ F1-score: 94.5%
  ↓
CRNN Text Recognizer (VGG + BLSTM + Joint CTC-Attention)
  ├─ CNN: 7 Conv layers + BatchNorm
  ├─ RNN: 2× BLSTM-256
  ├─ Input: 32px height (variable width)
  ├─ Loss: Joint CTC + Attention
  └─ WER: 4.28% (text line), 5.38% (end-to-end)
```

**Ưu điểm:**
- ✅ Accuracy cao nhất (~98-99%)
- ✅ Robust với ảnh xoay/nghiêng/mờ
- ✅ Auto-detect text regions (không cần ROI cố định)

**Nhược điểm:**
- ❌ Phức tạp (3 models: Mask-RCNN + EAST + CRNN)
- ❌ Cần GPU để train và inference nhanh
- ❌ Model size lớn (~100-200MB)
- ❌ Thời gian xử lý: 3-5 giây/ảnh (CPU)

**Kết luận:** ⚠️ **KHÔNG KHUYẾN NGHỊ** cho browser-based app (quá nặng)

---

### Phương Án 2: **CPU-Optimized** (Paper VNU 2020) ✅ **KHUYẾN NGHỊ**
**Kiến trúc:** CNN-LSTM + CTC (Simple & Efficient)

**Pipeline:**
```
Input Image
  ↓
1. ROI-based Cropping (giữ nguyên logic hiện tại)
  └─ Crop từng field (soCCCD, tenDayDu, ngaySinh...)
  ↓
2. Preprocessing
  ├─ Normalize height = 32px (giữ aspect ratio)
  ├─ Grayscale
  ├─ Contrast enhancement
  └─ CLAHE (optional)
  ↓
3. CNN Feature Extraction
  ├─ Conv 3×3, 64 filters → BatchNorm → ReLU → MaxPool 2×2
  ├─ Conv 3×3, 128 filters → BatchNorm → ReLU → MaxPool 2×2
  └─ Output: (W/4) × 1024 feature map
  ↓
4. Map-to-Sequence
  └─ Reshape: (W/4) × 1024 → (W/4) timesteps × 1024 features
  ↓
5. BiLSTM (2 layers)
  ├─ Dropout 0.5 (before & after)
  ├─ 2× BiLSTM-256 → (W/4) × 512
  └─ Linear → num_classes
  ↓
6. CTC Decoder
  └─ Best path decoding (greedy)
```

**Ưu điểm:**
- ✅ Đơn giản (1 model duy nhất)
- ✅ Chạy được trên CPU/browser (TensorFlow.js hoặc ONNX.js)
- ✅ Model size nhỏ (~10-20MB)
- ✅ Accuracy cao (95-99% theo field)
- ✅ Thời gian xử lý: 0.5-1 giây/field (CPU)

**Nhược điểm:**
- ❌ Cần ROI cố định (đã có sẵn trong OCRServiceV2.js)
- ❌ Cần train model trên CCCD dataset

**Kết luận:** ✅ **KHUYẾN NGHỊ** - Phù hợp với yêu cầu "tối ưu CPU"

---

## 📊 So sánh Tesseract.js vs CNN-LSTM

| Metric | Tesseract.js (Hiện tại) | CNN-LSTM (Paper VNU) |
|--------|-------------------------|----------------------|
| **Accuracy - Số CCCD** | ~85% | **~97.7%** |
| **Accuracy - Họ tên** | ~75-80% | **~97.5%** |
| **Accuracy - Ngày sinh** | ~90% | **~98.2%** |
| **Accuracy - Địa chỉ** | ~70% | **~95.9%** |
| **Model size** | 10MB (vie.traineddata) | 10-20MB (CNN-LSTM) |
| **Tốc độ (CPU)** | 2-3s/field | **0.5-1s/field** |
| **GPU required** | ❌ Không | ❌ Không |
| **Training needed** | ❌ Không | ✅ Có (1 lần) |
| **Vietnamese support** | ✅ Built-in | ✅ Custom vocab |

**Kết luận:** CNN-LSTM **vượt trội** về accuracy và speed, chỉ cần train model 1 lần.

---

## 🏗️ Kiến trúc Chi tiết - CNN-LSTM + CTC

### 1. Input Preprocessing
```python
# Normalize height = 32px (chuẩn cho CRNN)
def normalize_height(image, target_height=32):
    h, w = image.shape[:2]
    aspect_ratio = w / h
    new_width = int(target_height * aspect_ratio)
    
    # Resize về 32px height
    resized = cv2.resize(image, (new_width, target_height))
    
    # Grayscale
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    
    # Normalize pixel values [0, 1]
    normalized = gray / 255.0
    
    return normalized
```

### 2. CNN Architecture (VGG-like)
```python
# Layer 1: Conv + BatchNorm + ReLU + MaxPool
Conv2D(64, kernel_size=(3,3), padding='same')
BatchNormalization()
ReLU()
MaxPooling2D((2, 2))  # Output: (16, W/2, 64)

# Layer 2: Conv + BatchNorm + ReLU + MaxPool
Conv2D(128, kernel_size=(3,3), padding='same')
BatchNormalization()
ReLU()
MaxPooling2D((2, 2))  # Output: (8, W/4, 128)

# Flatten height dimension (Map-to-Sequence)
Reshape: (8, W/4, 128) → (W/4, 1024)
```

**Giải thích:**
- **BatchNorm:** Giảm covariate shift, train ổn định hơn
- **2 MaxPool:** Giảm height từ 32 → 16 → 8, width giảm 4 lần
- **Feature map:** (W/4) timesteps × 1024 features

### 3. RNN Architecture (BiLSTM)
```python
# Dropout before RNN
Dropout(0.5)

# BiLSTM Layer 1
Bidirectional(LSTM(256, return_sequences=True))  # (W/4, 512)

# Dropout between layers
Dropout(0.5)

# BiLSTM Layer 2
Bidirectional(LSTM(256, return_sequences=True))  # (W/4, 512)

# Linear projection to vocab size
Dense(num_classes)  # (W/4, num_classes)
```

**Tham số:**
- **LSTM units:** 256 per direction → 512 total
- **Dropout:** 0.5 (prevent overfitting)
- **num_classes:** 108 (89 Vietnamese chars + 10 digits + 9 special)

### 4. CTC Loss & Decoding
```python
# CTC Loss (training)
ctc_loss = tf.nn.ctc_loss(
    labels=target_sequences,
    logits=model_output,
    label_length=target_lengths,
    logit_length=output_lengths,
    blank_index=0
)

# CTC Decoder (inference)
decoded, _ = tf.nn.ctc_greedy_decoder(
    inputs=model_output,
    sequence_length=output_lengths
)
```

**Vocabulary (108 chars):**
```python
VOCAB = [
    '_',  # Blank token (index 0)
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',  # Digits
    'A', 'B', 'C', 'D', 'Đ', 'E', 'F', 'G', 'H', 'I',  # Latin uppercase
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'À', 'Á', 'Ả', 'Ã', 'Ạ',  # Vietnamese vowels
    'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ',
    'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ',
    'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ',
    'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ',
    'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị',
    'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ',
    'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ',
    'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ',
    'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ',
    'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự',
    'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
    ' ', ',', '.', '-', '/', ':'  # Special chars
]
```

---

## 🔧 Training Parameters (Paper VNU)

### Hyperparameters
```python
# Optimizer
optimizer = Adam(learning_rate=1e-4)

# Learning rate schedule
lr_decay = 0.99  # Giảm 0.99 mỗi 10,000 iterations
decay_step = 10000

# Training
epochs = 300
batch_size = 32
```

### Dataset Requirements
```python
# Minimum dataset size
total_images = 3256  # CCCD cards (front + back)
total_text_lines = 13552  # Cropped field images
total_characters = 209613

# Data augmentation (recommended)
augmentations = [
    RandomBrightness(0.8, 1.2),
    RandomContrast(0.8, 1.2),
    RandomRotation(-5, 5),  # Degrees
    RandomNoise(sigma=5)
]
```

### Field-specific Training
```python
# Train separate models cho từng loại field
models = {
    'digits_only': CNN_LSTM(vocab='0-9'),        # soCCCD, ngaySinh
    'uppercase_text': CNN_LSTM(vocab='A-Z+VN'),  # tenDayDu
    'full_text': CNN_LSTM(vocab='FULL')          # diaChi
}
```

---

## 💻 Implementation Plan - 3 Phases

### **Phase 1: Proof of Concept (PoC)** - 2 tuần
**Mục tiêu:** Train model đơn giản với dataset nhỏ, verify accuracy

#### Steps:
1. **Thu thập dataset** (1 tuần)
   - [ ] Chụp 100 CCCD (50 front + 50 back) - Diverse quality
   - [ ] Crop 7 fields × 100 = 700 images
   - [ ] Label thủ công (ground truth)
   - [ ] Split: 70% train, 15% val, 15% test

2. **Train model với Python/TensorFlow** (1 tuần)
   - [ ] Implement CNN-LSTM architecture (Keras)
   - [ ] Train trên GPU (Colab/Kaggle)
   - [ ] Evaluate accuracy per field
   - [ ] Target: ≥90% accuracy

#### Deliverables:
- ✅ Trained model (.h5 hoặc SavedModel format)
- ✅ Evaluation report (accuracy, WER per field)
- ✅ Sample predictions (screenshots)

---

### **Phase 2: Browser Integration** - 2 tuần
**Mục tiêu:** Convert model sang TensorFlow.js, tích hợp vào frontend

#### Steps:
1. **Convert model** (3 ngày)
   ```bash
   # Install tensorflowjs converter
   pip install tensorflowjs
   
   # Convert Keras model → TFJS
   tensorflowjs_converter \
     --input_format=keras \
     model.h5 \
     tfjs_model/
   ```

2. **Implement inference service** (4 ngày)
   ```javascript
   // client/src/services/CRNNService.js
   import * as tf from '@tensorflow/tfjs';
   
   class CRNNService {
     async loadModel() {
       this.model = await tf.loadLayersModel('/models/crnn/model.json');
     }
     
     async recognizeField(imageDataUrl, fieldType) {
       // Preprocess: normalize to 32px height
       const preprocessed = await this.preprocessImage(imageDataUrl);
       
       // Inference
       const prediction = this.model.predict(preprocessed);
       
       // CTC decode
       const text = this.ctcDecode(prediction);
       
       return text;
     }
   }
   ```

3. **Testing & Optimization** (3 ngày)
   - [ ] Test với 50 CCCD mới (không trong training set)
   - [ ] Measure inference time (target <1s/field)
   - [ ] Optimize model size (quantization nếu cần)

4. **UI Integration** (4 ngày)
   - [ ] Update OCRServiceV2.js gọi CRNNService thay Tesseract
   - [ ] Fallback: nếu CRNN fail → dùng Tesseract backup
   - [ ] Progress indicator (loading model + inference)

#### Deliverables:
- ✅ TensorFlow.js model files (model.json + weights)
- ✅ CRNNService.js (inference API)
- ✅ Updated OCRServiceV2.js (CRNN + Tesseract fallback)
- ✅ Demo video

---

### **Phase 3: Production Optimization** - 1 tuần
**Mục tiêu:** Fine-tune accuracy, optimize performance

#### Steps:
1. **Expand dataset** (3 ngày)
   - [ ] Thu thập thêm 400 CCCD (diverse lighting, angles)
   - [ ] Label với tool automation (reduce manual work)
   - [ ] Retrain model với full dataset

2. **Post-processing enhancements** (2 ngày)
   ```javascript
   // Regex validation cho từng field
   const validators = {
     soCCCD: /^\d{12}$/,
     ngaySinh: /^\d{2}\/\d{2}\/\d{4}$/,
     tenDayDu: /^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ\s]+$/
   };
   
   // Levenshtein correction với dictionary
   const correctWithDictionary = (text, field) => {
     if (field === 'diaChi') {
       // Correct tỉnh/huyện names với Levenshtein distance
       return autoCorrectLocation(text);
     }
     return text;
   };
   ```

3. **Performance optimization** (2 ngày)
   - [ ] Model quantization (float32 → int8)
   - [ ] WebAssembly backend (nếu cần)
   - [ ] Model caching (localStorage)

#### Deliverables:
- ✅ Production-ready model (>95% accuracy)
- ✅ Post-processing pipeline
- ✅ Performance report (inference time, accuracy)

---

## 📦 Tech Stack cho Implementation

### Training (Python)
```python
# requirements.txt
tensorflow==2.13.0
opencv-python==4.8.0
numpy==1.24.3
pillow==10.0.0
albumentations==1.3.1  # Data augmentation
tensorflowjs==4.11.0   # Model conversion
```

### Inference (JavaScript)
```json
// package.json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.11.0",
    "@tensorflow/tfjs-backend-webgl": "^4.11.0"
  }
}
```

**Model files structure:**
```
client/public/models/crnn/
├── model.json               # Model architecture
├── group1-shard1of4.bin     # Weights shard 1
├── group1-shard2of4.bin     # Weights shard 2
├── group1-shard3of4.bin     # Weights shard 3
└── group1-shard4of4.bin     # Weights shard 4
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Model)
```python
# test_model.py
def test_input_shape():
    model = build_crnn_model()
    input_tensor = tf.random.normal([1, 32, 128, 1])  # (batch, height, width, channels)
    output = model(input_tensor)
    assert output.shape == (1, 32, 108)  # (batch, timesteps, vocab_size)

def test_ctc_decode():
    logits = model.predict(test_image)
    decoded_text = ctc_decode(logits)
    assert decoded_text == ground_truth
```

### 2. Integration Tests (Frontend)
```javascript
// CRNNService.test.js
describe('CRNNService', () => {
  it('should load model successfully', async () => {
    const service = new CRNNService();
    await service.loadModel();
    expect(service.model).toBeDefined();
  });
  
  it('should recognize CCCD number', async () => {
    const result = await service.recognizeField(testImage, 'soCCCD');
    expect(result).toMatch(/^\d{12}$/);
  });
});
```

### 3. Accuracy Benchmark
```python
# evaluate.py
def evaluate_model(model, test_dataset):
    total_samples = 0
    correct_samples = 0
    
    for image, label in test_dataset:
        prediction = model.predict(image)
        decoded = ctc_decode(prediction)
        
        if decoded == label:
            correct_samples += 1
        total_samples += 1
    
    accuracy = correct_samples / total_samples
    return accuracy

# Target metrics
assert accuracy['soCCCD'] >= 0.95
assert accuracy['tenDayDu'] >= 0.95
assert accuracy['ngaySinh'] >= 0.95
```

---

## 📊 Expected Results

### Accuracy (sau Phase 3)
| Field | Tesseract (Hiện tại) | CNN-LSTM (Target) | Improvement |
|-------|----------------------|-------------------|-------------|
| Số CCCD | 85% | **≥97%** | +12% |
| Họ tên | 75% | **≥95%** | +20% |
| Ngày sinh | 90% | **≥98%** | +8% |
| Địa chỉ | 70% | **≥95%** | +25% |
| **Overall** | **80%** | **≥96%** | **+16%** |

### Performance
| Metric | Tesseract (Hiện tại) | CNN-LSTM (Target) |
|--------|----------------------|-------------------|
| Inference time/field | 2-3s | **0.5-1s** |
| Model size | 10MB | 10-20MB |
| CPU usage | Medium | Low-Medium |
| GPU required | ❌ | ❌ |

---

## 💰 Cost & Resources

### Training Resources
- **GPU:** Google Colab Free (T4 GPU) hoặc Kaggle Notebooks
- **Dataset labeling:** 1 người × 3 ngày = 3 ngày công
- **Training time:** 8-12 giờ (300 epochs × 100 iterations)

### Storage
- **Model files:** 10-20MB (browser cache)
- **Training dataset:** ~500MB (images + labels)

**Total cost:** ✅ **FREE** (sử dụng Colab/Kaggle)

---

## 🚨 Risks & Mitigation

### Risk 1: Accuracy không đạt target (≥95%)
**Mitigation:**
- Thu thập thêm data (1000+ samples)
- Data augmentation mạnh hơn
- Train ensemble models (3 models vote)

### Risk 2: Model quá lớn (>50MB) cho browser
**Mitigation:**
- Quantization (float32 → int8)
- Pruning (remove low-weight connections)
- Split models per field (load on-demand)

### Risk 3: Inference chậm trên mobile
**Mitigation:**
- WebAssembly backend
- Model optimization (reduce layers)
- Progressive loading (show results per field)

---

## 📚 References

### Papers
1. **"An improved CRNN for Vietnamese Identity Card Information Extraction"**
   - TechScience, 2023
   - URL: https://www.techscience.com/csse/v40n2/44478

2. **"A Deep Learning Based Approach for Vietnamese Identity Card Information Extraction"**
   - VNU Journal of Science, 2020
   - Authors: Nguyen Ngoc Tân et al.

### Code References
- **CRNN PyTorch:** https://github.com/meijieru/crnn.pytorch
- **TensorFlow.js Examples:** https://github.com/tensorflow/tfjs-examples
- **Vietnamese OCR Dataset:** https://github.com/pbcquoc/vn_id_card

---

## ✅ Decision Matrix

| Criteria | Keep Tesseract | Upgrade to CNN-LSTM |
|----------|----------------|---------------------|
| **Accuracy** | 80% | ✅ **96%** |
| **Speed** | 2-3s | ✅ **0.5-1s** |
| **Easy to implement** | ✅ Đã có | Training needed |
| **Maintenance** | ✅ Low | Medium |
| **Vietnamese specific** | Generic | ✅ **Optimized** |
| **Cost** | ✅ Free | ✅ Free |

**KHUYẾN NGHỊ CUỐI CÙNG:** ✅ **UPGRADE TO CNN-LSTM**

**Lý do:**
1. Accuracy tăng **+16%** (80% → 96%)
2. Speed nhanh hơn **2-3x** (2-3s → 0.5-1s)
3. Optimized cho tiếng Việt (không phụ thuộc Tesseract generic)
4. Chi phí triển khai thấp (Colab Free)
5. ROI cao: 6 tuần dev → Improvement vĩnh viễn

---

## 🚀 Next Steps (Action Items)

### Immediate (Tuần này):
- [ ] Review tài liệu này với team
- [ ] Confirm budget & timeline (6 tuần)
- [ ] Setup Colab/Kaggle account
- [ ] Install dependencies (TensorFlow, OpenCV)

### Phase 1 Start (Tuần tới):
- [ ] Bắt đầu thu thập 100 CCCD samples
- [ ] Setup labeling tool (LabelImg hoặc custom)
- [ ] Clone CRNN PyTorch repo (reference)

### Monitoring:
- [ ] Weekly progress report (accuracy metrics)
- [ ] Blocker resolution (data quality, model convergence)

---

**Created:** 2025-11-23  
**Author:** AI Development Team  
**Status:** 📋 **PENDING APPROVAL**  
**Expected Completion:** 6 tuần (3 phases)

