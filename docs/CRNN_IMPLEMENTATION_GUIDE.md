# 🔧 CRNN Implementation Guide - Step by Step

## 📋 Mục lục
1. [Training Phase - Python/TensorFlow](#training-phase)
2. [Model Conversion - TensorFlow.js](#model-conversion)
3. [Browser Integration - React](#browser-integration)
4. [Post-processing & Validation](#post-processing)
5. [Testing & Evaluation](#testing)

---

## 🐍 Training Phase - Python/TensorFlow

### Step 1: Setup Environment

```bash
# Tạo virtual environment
python -m venv crnn-env
source crnn-env/bin/activate  # Linux/Mac
# hoặc
crnn-env\Scripts\activate  # Windows

# Install dependencies
pip install tensorflow==2.13.0 opencv-python numpy pillow albumentations tensorflowjs
```

### Step 2: Data Preparation

```python
# data_loader.py
import cv2
import numpy as np
from pathlib import Path

class CCCDDataset:
    """Dataset loader cho CCCD text recognition"""
    
    def __init__(self, data_dir, target_height=32):
        self.data_dir = Path(data_dir)
        self.target_height = target_height
        self.samples = self._load_samples()
        
    def _load_samples(self):
        """
        Expected structure:
        data/
        ├── images/
        │   ├── 001_soCCCD.jpg
        │   ├── 001_tenDayDu.jpg
        │   └── ...
        └── labels.txt  # Format: filename\tground_truth
        """
        samples = []
        labels_file = self.data_dir / 'labels.txt'
        
        with open(labels_file, 'r', encoding='utf-8') as f:
            for line in f:
                filename, label = line.strip().split('\t')
                image_path = self.data_dir / 'images' / filename
                if image_path.exists():
                    samples.append({
                        'image_path': str(image_path),
                        'label': label
                    })
        
        return samples
    
    def preprocess_image(self, image_path):
        """Preprocess theo paper: height=32px, grayscale, normalize"""
        # Load image
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        
        # Resize height = 32px (giữ aspect ratio)
        h, w = img.shape
        aspect_ratio = w / h
        new_width = int(self.target_height * aspect_ratio)
        
        img_resized = cv2.resize(img, (new_width, self.target_height))
        
        # Normalize [0, 1]
        img_normalized = img_resized / 255.0
        
        # Add channel dimension: (32, W) → (32, W, 1)
        img_expanded = np.expand_dims(img_normalized, axis=-1)
        
        return img_expanded
    
    def encode_label(self, text, vocab):
        """Convert text → indices"""
        return [vocab.index(c) if c in vocab else 0 for c in text]
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        image = self.preprocess_image(sample['image_path'])
        label = sample['label']
        return image, label

# Vocabulary định nghĩa (108 chars)
VOCAB = [
    '_',  # Blank for CTC (index 0)
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'Đ', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ', 
    'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 
    'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị',
    'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ',
    'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ',
    'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
    ' ', ',', '.', '-', '/', ':'
]

def create_char_to_idx():
    return {char: idx for idx, char in enumerate(VOCAB)}

def create_idx_to_char():
    return {idx: char for idx, char in enumerate(VOCAB)}
```

### Step 3: Model Architecture

```python
# model.py
import tensorflow as tf
from tensorflow.keras import layers, Model

def build_crnn_model(input_height=32, num_classes=108):
    """
    CNN-LSTM + CTC model theo paper VNU
    
    Architecture:
    - Conv 3×3, 64 filters → BatchNorm → ReLU → MaxPool 2×2
    - Conv 3×3, 128 filters → BatchNorm → ReLU → MaxPool 2×2
    - Map-to-Sequence
    - Dropout 0.5
    - BiLSTM-256 (2 layers)
    - Dense(num_classes)
    """
    
    # Input: (batch, 32, W, 1)
    input_img = layers.Input(shape=(input_height, None, 1), name='image')
    
    # ============ CNN Layers ============
    # Layer 1: Conv + BatchNorm + ReLU + MaxPool
    x = layers.Conv2D(64, (3, 3), padding='same', activation=None)(input_img)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.MaxPooling2D((2, 2), name='pool1')(x)  # (batch, 16, W/2, 64)
    
    # Layer 2: Conv + BatchNorm + ReLU + MaxPool
    x = layers.Conv2D(128, (3, 3), padding='same', activation=None)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.MaxPooling2D((2, 2), name='pool2')(x)  # (batch, 8, W/4, 128)
    
    # ============ Map-to-Sequence ============
    # Reshape: (batch, 8, W/4, 128) → (batch, W/4, 8*128)
    new_shape = ((x.shape[2]), (x.shape[1] * x.shape[3]))  # (W/4, 1024)
    x = layers.Reshape(target_shape=new_shape, name='reshape')(x)
    
    # Dense layer to reduce feature dimension
    x = layers.Dense(256, activation='relu', name='dense1')(x)  # (batch, W/4, 256)
    
    # ============ RNN Layers ============
    # Dropout before RNN
    x = layers.Dropout(0.5)(x)
    
    # BiLSTM Layer 1
    x = layers.Bidirectional(
        layers.LSTM(256, return_sequences=True, dropout=0.2),
        name='bilstm1'
    )(x)  # (batch, W/4, 512)
    
    # Dropout between layers
    x = layers.Dropout(0.5)(x)
    
    # BiLSTM Layer 2
    x = layers.Bidirectional(
        layers.LSTM(256, return_sequences=True, dropout=0.2),
        name='bilstm2'
    )(x)  # (batch, W/4, 512)
    
    # ============ Output Layer ============
    # Dense to vocab size (CTC logits)
    x = layers.Dense(num_classes, activation='softmax', name='dense2')(x)
    
    # Build model
    model = Model(inputs=input_img, outputs=x, name='CRNN_CTC')
    
    return model

# Test model
if __name__ == '__main__':
    model = build_crnn_model()
    model.summary()
    
    # Test với dummy input
    dummy_input = tf.random.normal([1, 32, 128, 1])
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")  # (1, 32, 108)
```

### Step 4: CTC Loss & Training Loop

```python
# train.py
import tensorflow as tf
from model import build_crnn_model, VOCAB
from data_loader import CCCDDataset, create_char_to_idx

def ctc_loss_function(y_true, y_pred):
    """
    CTC Loss wrapper for Keras
    
    Args:
        y_true: Ground truth labels (sparse tensor)
        y_pred: Model predictions (logits)
    """
    # Get batch size & timesteps
    batch_size = tf.shape(y_pred)[0]
    timesteps = tf.shape(y_pred)[1]
    
    # Label lengths (assume all labels are fully used)
    label_length = tf.shape(y_true)[1]
    label_lengths = tf.ones((batch_size,), dtype=tf.int32) * label_length
    
    # Logit lengths (all timesteps)
    logit_lengths = tf.ones((batch_size,), dtype=tf.int32) * timesteps
    
    # Compute CTC loss
    loss = tf.nn.ctc_loss(
        labels=y_true,
        logits=y_pred,
        label_length=label_lengths,
        logit_length=logit_lengths,
        blank_index=0  # Blank token at index 0
    )
    
    return tf.reduce_mean(loss)

class CRNNTrainer:
    def __init__(self, model, train_dataset, val_dataset):
        self.model = model
        self.train_dataset = train_dataset
        self.val_dataset = val_dataset
        
        # Optimizer với learning rate decay
        self.lr_schedule = tf.keras.optimizers.schedules.ExponentialDecay(
            initial_learning_rate=1e-4,
            decay_steps=10000,
            decay_rate=0.99,
            staircase=True
        )
        self.optimizer = tf.keras.optimizers.Adam(learning_rate=self.lr_schedule)
        
        # Metrics
        self.train_loss_metric = tf.keras.metrics.Mean(name='train_loss')
        self.val_loss_metric = tf.keras.metrics.Mean(name='val_loss')
    
    @tf.function
    def train_step(self, images, labels):
        """Single training step"""
        with tf.GradientTape() as tape:
            # Forward pass
            predictions = self.model(images, training=True)
            
            # Compute loss
            loss = ctc_loss_function(labels, predictions)
        
        # Backward pass
        gradients = tape.gradient(loss, self.model.trainable_variables)
        self.optimizer.apply_gradients(zip(gradients, self.model.trainable_variables))
        
        # Update metrics
        self.train_loss_metric.update_state(loss)
        
        return loss
    
    @tf.function
    def val_step(self, images, labels):
        """Validation step"""
        predictions = self.model(images, training=False)
        loss = ctc_loss_function(labels, predictions)
        self.val_loss_metric.update_state(loss)
        return loss
    
    def train(self, epochs=300, checkpoint_dir='checkpoints'):
        """Training loop"""
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            print(f"\nEpoch {epoch+1}/{epochs}")
            
            # Reset metrics
            self.train_loss_metric.reset_states()
            self.val_loss_metric.reset_states()
            
            # Training
            for batch_idx, (images, labels) in enumerate(self.train_dataset):
                loss = self.train_step(images, labels)
                
                if batch_idx % 10 == 0:
                    print(f"Batch {batch_idx}: Loss = {loss:.4f}")
            
            # Validation
            for images, labels in self.val_dataset:
                self.val_step(images, labels)
            
            # Log metrics
            train_loss = self.train_loss_metric.result()
            val_loss = self.val_loss_metric.result()
            
            print(f"Epoch {epoch+1} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
            
            # Save checkpoint nếu val loss improve
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self.model.save(f'{checkpoint_dir}/best_model.h5')
                print(f"✅ Saved best model (val_loss={val_loss:.4f})")

# Main training script
if __name__ == '__main__':
    # Load dataset
    train_dataset = CCCDDataset('data/train')
    val_dataset = CCCDDataset('data/val')
    
    # Build model
    model = build_crnn_model()
    
    # Train
    trainer = CRNNTrainer(model, train_dataset, val_dataset)
    trainer.train(epochs=300)
```

### Step 5: CTC Decoding (Inference)

```python
# decode.py
import tensorflow as tf
import numpy as np
from model import VOCAB

def ctc_decode_greedy(predictions, vocab):
    """
    CTC greedy decoder
    
    Args:
        predictions: Model output logits (batch, timesteps, vocab_size)
        vocab: List of characters
    
    Returns:
        decoded_texts: List of decoded strings
    """
    # Get best path (argmax)
    decoded_indices = tf.argmax(predictions, axis=-1)  # (batch, timesteps)
    
    decoded_texts = []
    
    for indices in decoded_indices.numpy():
        # Remove consecutive duplicates & blank (0)
        prev = -1
        chars = []
        
        for idx in indices:
            if idx != 0 and idx != prev:  # Not blank & not duplicate
                chars.append(vocab[idx])
            prev = idx
        
        decoded_texts.append(''.join(chars))
    
    return decoded_texts

def ctc_decode_beam_search(predictions, vocab, beam_width=10):
    """
    CTC beam search decoder (more accurate than greedy)
    
    Args:
        predictions: Model output logits (batch, timesteps, vocab_size)
        vocab: List of characters
        beam_width: Number of beams to keep
    
    Returns:
        decoded_texts: List of decoded strings
    """
    # Convert to log probabilities
    log_probs = tf.nn.log_softmax(predictions, axis=-1)
    
    # Get sequence lengths (assume all timesteps are valid)
    sequence_lengths = tf.fill([tf.shape(log_probs)[0]], tf.shape(log_probs)[1])
    
    # Beam search decode
    decoded, log_probabilities = tf.nn.ctc_beam_search_decoder(
        inputs=log_probs,
        sequence_length=sequence_lengths,
        beam_width=beam_width,
        top_paths=1
    )
    
    # Convert sparse tensor to dense
    decoded_dense = tf.sparse.to_dense(decoded[0], default_value=0)
    
    # Map indices to characters
    decoded_texts = []
    for indices in decoded_dense.numpy():
        chars = [vocab[idx] for idx in indices if idx != 0]
        decoded_texts.append(''.join(chars))
    
    return decoded_texts

# Test decoding
if __name__ == '__main__':
    # Dummy predictions
    dummy_predictions = tf.random.normal([2, 32, 108])
    
    # Greedy decode
    texts_greedy = ctc_decode_greedy(dummy_predictions, VOCAB)
    print("Greedy:", texts_greedy)
    
    # Beam search decode
    texts_beam = ctc_decode_beam_search(dummy_predictions, VOCAB)
    print("Beam Search:", texts_beam)
```

---

## 🔄 Model Conversion - TensorFlow.js

### Step 1: Convert Keras Model

```bash
# Convert .h5 → TensorFlow.js format
tensorflowjs_converter \
  --input_format=keras \
  --output_format=tfjs_layers_model \
  checkpoints/best_model.h5 \
  client/public/models/crnn/
```

**Output files:**
```
client/public/models/crnn/
├── model.json               # Model architecture + metadata
├── group1-shard1of4.bin     # Weights (split into shards)
├── group1-shard2of4.bin
├── group1-shard3of4.bin
└── group1-shard4of4.bin
```

### Step 2: Optimize Model Size

```bash
# Quantization (float32 → uint8) - Giảm size 75%
tensorflowjs_converter \
  --input_format=keras \
  --output_format=tfjs_layers_model \
  --quantization_bytes 1 \
  checkpoints/best_model.h5 \
  client/public/models/crnn_quantized/
```

---

## ⚛️ Browser Integration - React

### Step 1: Install TensorFlow.js

```bash
cd client
npm install @tensorflow/tfjs@4.11.0 @tensorflow/tfjs-backend-webgl@4.11.0 --legacy-peer-deps
```

### Step 2: Implement CRNNService

```javascript
// client/src/services/CRNNService.js
import * as tf from '@tensorflow/tfjs';

class CRNNService {
  constructor() {
    this.model = null;
    this.vocab = [
      '_', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'A', 'B', 'C', 'D', 'Đ', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 
      'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ',
      'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ',
      'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị',
      'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ',
      'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ',
      'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
      ' ', ',', '.', '-', '/', ':'
    ];
  }

  /**
   * Load model (gọi 1 lần khi app khởi động)
   */
  async loadModel() {
    try {
      console.log('🔄 Đang tải CRNN model...');
      
      // Set backend
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Load model
      this.model = await tf.loadLayersModel('/models/crnn/model.json');
      
      console.log('✅ CRNN model loaded successfully');
      
      // Warmup (chạy 1 lần để init GPU)
      const dummyInput = tf.zeros([1, 32, 128, 1]);
      await this.model.predict(dummyInput);
      dummyInput.dispose();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load CRNN model:', error);
      return false;
    }
  }

  /**
   * Preprocess image (giống training)
   */
  async preprocessImage(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Target height = 32px
        const targetHeight = 32;
        const aspectRatio = img.width / img.height;
        const targetWidth = Math.floor(targetHeight * aspectRatio);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw grayscale
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data;
        
        // Convert to tensor: (32, W, 1) normalized [0, 1]
        const pixels = [];
        for (let i = 0; i < data.length; i += 4) {
          pixels.push(data[i] / 255.0);  // Only R channel (grayscale)
        }
        
        // Reshape to (1, 32, W, 1)
        const tensor = tf.tensor4d(pixels, [1, targetHeight, targetWidth, 1]);
        
        resolve(tensor);
      };
      img.src = imageDataUrl;
    });
  }

  /**
   * CTC Greedy Decoder
   */
  ctcDecodeGreedy(predictions) {
    // predictions: (1, timesteps, vocab_size)
    const argmax = tf.argMax(predictions[0], axis=-1);  // (timesteps)
    const indices = argmax.arraySync();
    
    // Remove consecutive duplicates & blank (0)
    let prev = -1;
    const chars = [];
    
    for (const idx of indices) {
      if (idx !== 0 && idx !== prev) {
        chars.push(this.vocab[idx]);
      }
      prev = idx;
    }
    
    argmax.dispose();
    return chars.join('');
  }

  /**
   * Recognize text từ ảnh
   */
  async recognizeField(imageDataUrl, fieldType = 'full') {
    if (!this.model) {
      throw new Error('Model chưa được load. Gọi loadModel() trước.');
    }

    try {
      console.log(`🔍 CRNN recognizing field: ${fieldType}`);
      
      // Preprocess
      const inputTensor = await this.preprocessImage(imageDataUrl);
      
      // Inference
      const startTime = performance.now();
      const predictions = await this.model.predict(inputTensor);
      const endTime = performance.now();
      
      // Decode
      const text = this.ctcDecodeGreedy(predictions);
      
      // Cleanup
      inputTensor.dispose();
      predictions.dispose();
      
      const inferenceTime = (endTime - startTime).toFixed(0);
      console.log(`✅ CRNN result: "${text}" (${inferenceTime}ms)`);
      
      return {
        text: text,
        confidence: 0.95,  // TODO: Calculate from logits
        inferenceTime: inferenceTime,
        source: 'CRNN'
      };
      
    } catch (error) {
      console.error('❌ CRNN recognition failed:', error);
      return null;
    }
  }

  /**
   * Recognize all fields (parallel)
   */
  async recognizeAll(cccdFrontImage, cccdBackImage = null) {
    console.log('🚀 CRNN recognizing all fields...');
    
    // Sử dụng ROI cropping từ OCRServiceV2
    const { cropROI, CCCD_ROI } = await import('./OCRServiceV2.js');
    
    const fields = ['soCCCD', 'tenDayDu', 'ngaySinh', 'gioiTinh', 'diaChi'];
    const results = {};
    
    for (const field of fields) {
      const roi = CCCD_ROI[field];
      const croppedROI = await cropROI(cccdFrontImage, roi);
      
      const result = await this.recognizeField(croppedROI, field);
      results[field] = result ? result.text : null;
    }
    
    return results;
  }
}

export default new CRNNService();
```

### Step 3: Update OCRServiceV2 với Fallback

```javascript
// client/src/services/OCRServiceV2.js (UPDATE)
import CRNNService from './CRNNService';
import Tesseract from 'tesseract.js';

const OCRServiceV2 = {
  // ... existing code ...
  
  /**
   * Recognize field với CRNN + Tesseract fallback
   */
  recognizeField: async (imageDataUrl, fieldName) => {
    try {
      // Attempt 1: CRNN (nếu model đã load)
      if (CRNNService.model) {
        console.log(`🎯 Thử CRNN cho field: ${fieldName}`);
        const crnnResult = await CRNNService.recognizeField(imageDataUrl, fieldName);
        
        if (crnnResult && crnnResult.text && crnnResult.text.length > 0) {
          console.log(`✅ CRNN thành công: "${crnnResult.text}"`);
          return crnnResult.text;
        }
        
        console.warn(`⚠️ CRNN failed for ${fieldName}, fallback to Tesseract`);
      }
      
      // Attempt 2: Tesseract fallback
      console.log(`🔄 Fallback to Tesseract cho field: ${fieldName}`);
      const roi = OCRServiceV2.CCCD_ROI[fieldName];
      const croppedROI = await OCRServiceV2.cropROI(imageDataUrl, roi);
      const processedROI = await OCRServiceV2.preprocessROI(croppedROI);
      
      const worker = await Tesseract.createWorker('vie', 1, { logger: () => {} });
      const config = OCRServiceV2.getFieldConfig(fieldName);
      await worker.setParameters(config);
      
      const { data: { text, confidence } } = await worker.recognize(processedROI);
      await worker.terminate();
      
      let cleanText = text.trim();
      if (fieldName === 'soCCCD') cleanText = cleanText.replace(/\D/g, '');
      
      console.log(`✅ Tesseract: "${cleanText}" (conf: ${confidence.toFixed(1)}%)`);
      return cleanText;
      
    } catch (error) {
      console.error(`❌ Both CRNN & Tesseract failed for ${fieldName}:`, error);
      return null;
    }
  }
};

export default OCRServiceV2;
```

### Step 4: Initialize CRNN trong App.jsx

```javascript
// client/src/App.jsx (UPDATE)
import React, { useEffect, useState } from 'react';
import CRNNService from './services/CRNNService';

function App() {
  const [crnnReady, setCrnnReady] = useState(false);
  
  useEffect(() => {
    // Load CRNN model khi app khởi động
    const initCRNN = async () => {
      console.log('🚀 Initializing CRNN model...');
      const success = await CRNNService.loadModel();
      setCrnnReady(success);
      
      if (success) {
        console.log('✅ CRNN ready for inference');
      } else {
        console.warn('⚠️ CRNN failed to load, will use Tesseract only');
      }
    };
    
    initCRNN();
  }, []);
  
  return (
    <div className="App">
      {!crnnReady && (
        <div className="crnn-loading-banner">
          🔄 Đang tải AI model... (có thể mất 5-10 giây)
        </div>
      )}
      
      {/* Rest of app */}
    </div>
  );
}

export default App;
```

---

## ✅ Post-processing & Validation

### Field-specific Validators

```javascript
// client/src/utils/cccdValidator.js
const CCCDValidator = {
  /**
   * Validate số CCCD (12 chữ số)
   */
  validateSoCCCD: (text) => {
    const digits = text.replace(/\D/g, '');
    
    if (digits.length === 12) {
      return { valid: true, corrected: digits };
    } else if (digits.length === 9) {
      // CMND cũ (9 số) - vẫn hợp lệ
      return { valid: true, corrected: digits, type: 'CMND' };
    }
    
    return { valid: false, error: 'Số CCCD phải có 12 chữ số' };
  },
  
  /**
   * Validate ngày sinh (DD/MM/YYYY)
   */
  validateNgaySinh: (text) => {
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = text.match(datePattern);
    
    if (!match) {
      // Try auto-correct từ DDMMYYYY
      const digits = text.replace(/\D/g, '');
      if (digits.length === 8) {
        const corrected = `${digits.substring(0,2)}/${digits.substring(2,4)}/${digits.substring(4,8)}`;
        return { valid: true, corrected: corrected };
      }
      return { valid: false, error: 'Định dạng phải là DD/MM/YYYY' };
    }
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    // Validate ranges
    if (day < 1 || day > 31) return { valid: false, error: 'Ngày không hợp lệ' };
    if (month < 1 || month > 12) return { valid: false, error: 'Tháng không hợp lệ' };
    if (year < 1900 || year > 2010) return { valid: false, error: 'Năm không hợp lệ' };
    
    return { valid: true, corrected: text };
  },
  
  /**
   * Validate giới tính
   */
  validateGioiTinh: (text) => {
    const normalized = text.toUpperCase().trim();
    
    if (normalized === 'NAM' || normalized === 'M') {
      return { valid: true, corrected: 'Nam' };
    } else if (normalized === 'NỮ' || normalized === 'NU' || normalized === 'F') {
      return { valid: true, corrected: 'Nữ' };
    }
    
    return { valid: false, error: 'Giới tính phải là "Nam" hoặc "Nữ"' };
  },
  
  /**
   * Auto-correct tên Việt Nam
   */
  correctVietnameseName: (text) => {
    // Common OCR errors
    const corrections = {
      'VÕ': 'VÕ', 'VO': 'VÕ',
      'NGUYỄN': 'NGUYỄN', 'NGUYEN': 'NGUYỄN',
      'TRẦN': 'TRẦN', 'TRAN': 'TRẦN',
      'LÊ': 'LÊ', 'LE': 'LÊ',
      'PHẠM': 'PHẠM', 'PHAM': 'PHẠM',
      // Add more common names
    };
    
    let corrected = text.toUpperCase();
    
    for (const [wrong, right] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(wrong, 'g'), right);
    }
    
    return corrected;
  },
  
  /**
   * Validate địa chỉ với Levenshtein distance
   */
  correctAddress: (text) => {
    // Dictionary tỉnh/thành phố Việt Nam
    const provinces = [
      'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
      'Bắc Ninh', 'Bình Dương', 'Đồng Nai', 'Quảng Ninh', 'Thanh Hóa',
      'Nghệ An', 'Thừa Thiên Huế', 'Khánh Hòa', 'Lâm Đồng', 'Bình Thuận',
      // ... thêm 63 tỉnh
    ];
    
    // TODO: Implement Levenshtein matching
    return text;
  }
};

export default CCCDValidator;
```

---

## 🧪 Testing & Evaluation

### Accuracy Benchmark Script

```javascript
// client/src/__tests__/crnn.benchmark.test.js
import CRNNService from '../services/CRNNService';
import testSamples from './fixtures/cccd_test_samples.json';

describe('CRNN Accuracy Benchmark', () => {
  beforeAll(async () => {
    await CRNNService.loadModel();
  });
  
  test('Số CCCD accuracy ≥95%', async () => {
    const samples = testSamples.filter(s => s.field === 'soCCCD');
    let correct = 0;
    
    for (const sample of samples) {
      const result = await CRNNService.recognizeField(sample.image, 'soCCCD');
      if (result.text === sample.groundTruth) {
        correct++;
      }
    }
    
    const accuracy = correct / samples.length;
    console.log(`Số CCCD accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    expect(accuracy).toBeGreaterThanOrEqual(0.95);
  });
  
  test('Họ tên accuracy ≥95%', async () => {
    const samples = testSamples.filter(s => s.field === 'tenDayDu');
    let correct = 0;
    
    for (const sample of samples) {
      const result = await CRNNService.recognizeField(sample.image, 'tenDayDu');
      if (result.text === sample.groundTruth) {
        correct++;
      }
    }
    
    const accuracy = correct / samples.length;
    console.log(`Họ tên accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    expect(accuracy).toBeGreaterThanOrEqual(0.95);
  });
  
  // Similar tests for other fields...
});
```

---

## 📊 Expected Results Table

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Số CCCD Accuracy** | ≥97% | Test với 100 samples |
| **Họ tên Accuracy** | ≥95% | WER (Word Error Rate) |
| **Ngày sinh Accuracy** | ≥98% | Exact match |
| **Địa chỉ Accuracy** | ≥95% | Character-level accuracy |
| **Inference Time** | <1s/field | performance.now() |
| **Model Size** | <20MB | Check .bin files |

---

## ✅ Checklist

### Training Phase:
- [ ] Dataset thu thập (100+ samples)
- [ ] Data labeling hoàn tất
- [ ] Model train xong (300 epochs)
- [ ] Accuracy đạt ≥95% (validation set)
- [ ] Model export thành .h5 file

### Conversion Phase:
- [ ] TensorFlow.js converter chạy thành công
- [ ] Model files sinh ra đầy đủ (model.json + shards)
- [ ] Test load model trong browser
- [ ] Inference time <1s

### Integration Phase:
- [ ] CRNNService.js implement xong
- [ ] OCRServiceV2.js update với fallback
- [ ] App.jsx initialize CRNN khi khởi động
- [ ] UI loading indicator
- [ ] Post-processing validators

### Testing Phase:
- [ ] Unit tests pass (≥95% accuracy)
- [ ] Integration tests pass
- [ ] Manual testing với 50 CCCD mới
- [ ] Performance benchmark (inference time)

---

**Created:** 2025-11-23  
**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Estimated Time:** 6 tuần (3 phases)

