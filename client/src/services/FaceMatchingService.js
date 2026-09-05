// Using face-api.js for face detection and matching
import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

const FaceMatchingService = {
  loadModels: async () => {
    console.log('[FaceMatchingService] 🔄 Loading models from:', MODEL_URL);

    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      return;
    }

    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      ]);
      console.log('[FaceMatchingService] 🎉 All models loaded successfully!');
    } catch (error) {
      console.error('[FaceMatchingService] ❌ Model loading error:', error);
      throw new Error(`Failed to load face detection models: ${error.message}`);
    }
  },

  /**
   * Detect face với multi-strategy:
   * 1. TinyFaceDetector (nhanh, lightweight)
   * 2. SSD Mobilenet (chính xác hơn, chậm hơn)
   * 3. Nếu ảnh nhỏ (<400px) và không detect được → coi toàn bộ ảnh là face (pre-cropped)
   */
  detectFace: async (imageElement, options = {}) => {
    const { isPreCroppedFace = false, label = 'unknown' } = options;
    
    if (
      !imageElement ||
      !Number.isFinite(imageElement.width) ||
      !Number.isFinite(imageElement.height) ||
      imageElement.width <= 1 ||
      imageElement.height <= 1
    ) {
      console.warn(`[FaceMatchingService] ⚠️ Invalid image (${label})`);
      return null;
    }

    console.log(`[FaceMatchingService] 🔍 Detecting face (${label}): ${imageElement.width}x${imageElement.height}, isPreCropped: ${isPreCroppedFace}`);

    // Resize if too large (max 800px width for detection)
    let input = imageElement;
    if (imageElement.width > 800) {
      const canvas = document.createElement('canvas');
      const scale = 800 / imageElement.width;
      canvas.width = 800;
      canvas.height = Math.floor(imageElement.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      input = canvas;
    }

    try {
      // Strategy 1: TinyFaceDetector (nhanh)
      console.log(`[FaceMatchingService] 🔍 Trying TinyFaceDetector (${label})...`);
      let detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 416,  // Tăng inputSize để detect face nhỏ hơn
          scoreThreshold: 0.3  // Giảm threshold để dễ detect hơn
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        console.log(`[FaceMatchingService] ✅ TinyFaceDetector found face (${label})`);
        return detection;
      }

      // Strategy 2: SSD Mobilenet (chính xác hơn)
      console.log(`[FaceMatchingService] 🔍 Trying SSD Mobilenet (${label})...`);
      detection = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3  // Giảm threshold
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        console.log(`[FaceMatchingService] ✅ SSD Mobilenet found face (${label})`);
        return detection;
      }

      // Strategy 3: Nếu là ảnh pre-cropped face và nhỏ → extract descriptor từ toàn bộ ảnh
      // Đây là trường hợp ảnh đã crop sẵn chỉ chứa khuôn mặt
      if (isPreCroppedFace && imageElement.width < 400 && imageElement.height < 500) {
        console.log(`[FaceMatchingService] 🔍 Pre-cropped face mode: trying full-image descriptor (${label})...`);
        
        // Tạo detection giả với full image như face region
        // Sử dụng computeFaceDescriptor trực tiếp
        try {
          // Tạo canvas từ ảnh để extract descriptor
          const canvas = document.createElement('canvas');
          canvas.width = imageElement.width;
          canvas.height = imageElement.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(imageElement, 0, 0);
          
          // Thử detect với threshold cực thấp
          detection = await faceapi
            .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ 
              inputSize: 224,  // Nhỏ hơn cho ảnh đã crop
              scoreThreshold: 0.1  // Threshold rất thấp
            }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            console.log(`[FaceMatchingService] ✅ Found face in pre-cropped image with low threshold (${label})`);
            return detection;
          }
        } catch (e) {
          console.warn(`[FaceMatchingService] ⚠️ Pre-cropped detection failed (${label}):`, e.message);
        }
      }

      console.warn(`[FaceMatchingService] ⚠️ No face detected (${label})`);
      return null;
    } catch (error) {
      console.error(`[FaceMatchingService] ❌ Detection error (${label}):`, error);
      return null;
    }
  },

  /**
   * Compare faces and return distance + similarity
   * @param {HTMLImageElement} imageElement1 - Card image (or cropped face)
   * @param {HTMLImageElement} imageElement2 - Selfie image
   * @param {Object} options - { image1IsPreCropped: boolean }
   */
  compareFaces: async (imageElement1, imageElement2, options = {}) => {
    const { image1IsPreCropped = true } = options;
    
    console.log('[FaceMatchingService] 🔄 Comparing faces...');
    console.log(`  Image1 (card): ${imageElement1.width}x${imageElement1.height}`);
    console.log(`  Image2 (selfie): ${imageElement2.width}x${imageElement2.height}`);
    
    const detection1 = await FaceMatchingService.detectFace(imageElement1, { 
      isPreCroppedFace: image1IsPreCropped,
      label: 'card-face'
    });
    const detection2 = await FaceMatchingService.detectFace(imageElement2, { 
      isPreCroppedFace: false,
      label: 'selfie'
    });

    if (!detection1 || !detection2) {
      const missing = [];
      if (!detection1) missing.push('ảnh CCCD');
      if (!detection2) missing.push('ảnh selfie');
      throw new Error(`Không tìm thấy khuôn mặt trong ${missing.join(' và ')}`);
    }

    const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);

    // Map distance to similarity (0-1) for UI
    const similarity = Math.max(0, 1 - distance);

    console.log(`[FaceMatchingService] ✅ Face match result: distance=${distance.toFixed(3)}, similarity=${(similarity * 100).toFixed(1)}%`);

    return {
      distance: distance,
      similarity: similarity,
      match: distance < 0.6
    };
  }
};

export default FaceMatchingService;