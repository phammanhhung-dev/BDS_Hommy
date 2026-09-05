/**
 * FaceAlignmentService - Nhận diện khuôn mặt và kiểm tra alignment
 * Sử dụng face-api.js để phát hiện khuôn mặt và landmarks
 * Kiểm tra khuôn mặt nằm chính giữa, thẳng, và đủ gần camera
 */

import * as faceapi from 'face-api.js';

class FaceAlignmentService {
  constructor() {
    this.modelsLoaded = false;
    this.detectionOptions = null;

    // Các ngưỡng kiểm tra alignment - Fullscreen với camera zoom out
    this.thresholds = {
      minFaceSize: 0.08,        // Giảm từ 0.12 → 0.08 (camera xa hơn, mặt nhỏ hơn)
      maxFaceSize: 0.80,        // Tăng từ 0.75 → 0.80 (cho phép mặt rất lớn)
      centerTolerance: 0.20,    // Tăng từ 0.18 → 0.20 (rất linh hoạt)
      yawTolerance: 20,         // Tăng từ 18 → 20 độ (cho phép xoay nhiều)
      pitchTolerance: 20,       // Tăng từ 18 → 20 độ (cho phép ngẩng/cúi nhiều)
      rollTolerance: 15,        // Tăng từ 12 → 15 độ (cho phép nghiêng nhiều)
      minConfidence: 0.60,      // Giảm từ 0.65 → 0.60 (rất dễ pass)
      minLandmarkDistance: 0.20, // Giảm từ 0.25 → 0.20 (cho phép rất gần camera)
    };

    // Vùng chấp nhận khuôn mặt (tỷ lệ % so với video) - Fullscreen mode
    this.faceRegion = {
      x: 0.05,     // 5% từ trái (rất rộng)
      y: 0.10,     // 10% từ trên (rất cao)
      width: 0.9,  // 90% chiều rộng (hầu như toàn màn hình)
      height: 0.8  // 80% chiều cao (hầu như toàn màn hình)
    };
  }

  /**
   * Load face detection models
   */
  async loadModels(modelsPath = '/models') {
    try {
      console.log('🔄 Đang tải models face-api.js...');
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);

      this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      });

      this.modelsLoaded = true;
      console.log('✅ Models đã tải thành công');
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi tải models:', error);
      return false;
    }
  }

  /**
   * Phân tích khuôn mặt trong video frame
   * @param {HTMLVideoElement} videoElement - Video element từ webcam
   * @returns {Object} - Kết quả phân tích
   */
  async analyzeFace(videoElement) {
    if (!this.modelsLoaded) {
      return { 
        aligned: false, 
        confidence: 0, 
        reason: 'Models chưa được tải',
        detection: null 
      };
    }

    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      return { 
        aligned: false, 
        confidence: 0, 
        reason: 'Video chưa sẵn sàng',
        detection: null 
      };
    }

    try {
      // Phát hiện khuôn mặt với landmarks
      const detection = await faceapi
        .detectSingleFace(videoElement, this.detectionOptions)
        .withFaceLandmarks();

      const box = detection?.detection?.box;
      const dims = detection?.detection?.imageDims;
      const boxValid = box && [box.x, box.y, box.width, box.height].every(Number.isFinite);
      const dimsValid = dims && [dims.width, dims.height].every(Number.isFinite);

      if (!detection || !boxValid || !dimsValid) {
        return {
          aligned: false,
          confidence: 0,
          reason: 'Không phát hiện khuôn mặt',
          detection: null
        };
      }

      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      // Chạy các bước kiểm tra
      const positionCheck = this.checkFacePosition(detection, videoWidth, videoHeight);
      const sizeCheck = this.checkFaceSize(detection, videoWidth, videoHeight);
      const orientationCheck = this.checkFaceOrientation(detection.landmarks);
      const confidenceCheck = this.checkDetectionConfidence(detection);

      // Tính confidence tổng hợp
      const confidence = this.calculateOverallConfidence({
        positionCheck,
        sizeCheck,
        orientationCheck,
        confidenceCheck
      });

      const aligned = confidence >= 0.75; // Ngưỡng chấp nhận 75%

      return {
        aligned,
        confidence,
        detection,
        details: {
          position: positionCheck,
          size: sizeCheck,
          orientation: orientationCheck,
          detectionConfidence: confidenceCheck
        },
        reason: this.getAlignmentReason(aligned, {
          positionCheck,
          sizeCheck,
          orientationCheck,
          confidenceCheck
        })
      };
    } catch (error) {
      console.error('❌ Lỗi khi phân tích khuôn mặt:', error);
      return {
        aligned: false,
        confidence: 0,
        reason: 'Lỗi xử lý',
        detection: null,
        error
      };
    }
  }

  /**
   * Kiểm tra vị trí khuôn mặt (phải nằm giữa khung hình)
   */
  checkFacePosition(detection, videoWidth, videoHeight) {
    const box = detection.detection.box;
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) {
      return { faceCenterX: 0, faceCenterY: 0, offsetX: 1, offsetY: 1, centered: false, score: 0 };
    }
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;

    const videoCenterX = videoWidth / 2;
    const videoCenterY = videoHeight / 2;

    const offsetX = Math.abs(faceCenterX - videoCenterX) / videoWidth;
    const offsetY = Math.abs(faceCenterY - videoCenterY) / videoHeight;

    const centered = 
      offsetX <= this.thresholds.centerTolerance &&
      offsetY <= this.thresholds.centerTolerance;

    const score = 1 - (offsetX + offsetY) / (2 * this.thresholds.centerTolerance);

    return {
      faceCenterX,
      faceCenterY,
      offsetX,
      offsetY,
      centered,
      score: Math.max(0, Math.min(score, 1))
    };
  }

  /**
   * Kiểm tra kích thước khuôn mặt
   */
  checkFaceSize(detection, videoWidth, videoHeight) {
    const box = detection.detection.box;
    if (![box.width, box.height].every(Number.isFinite) || videoWidth <= 0 || videoHeight <= 0) {
      return { faceWidth: 0, faceHeight: 0, sizeRatio: 0, sizeOk: false, score: 0 };
    }
    const faceArea = box.width * box.height;
    const videoArea = videoWidth * videoHeight;
    const sizeRatio = faceArea / videoArea;

    const sizeOk = 
      sizeRatio >= this.thresholds.minFaceSize &&
      sizeRatio <= this.thresholds.maxFaceSize;

    // Optimal size around 20-30% (giảm từ 35% do fullscreen camera xa)
    const optimalSize = 0.25;  // Giảm từ 0.35 → 0.25
    const score = 1 - Math.abs(sizeRatio - optimalSize) / optimalSize;

    return {
      faceWidth: box.width,
      faceHeight: box.height,
      sizeRatio,
      sizeOk,
      score: Math.max(0, Math.min(score, 1))
    };
  }

  /**
   * Kiểm tra hướng mặt (yaw, pitch, roll)
   * Sử dụng facial landmarks để ước tính góc
   */
  checkFaceOrientation(landmarks) {
    const positions = landmarks.positions;

    // Key landmarks
    const noseTip = positions[30];       // Mũi
    const leftEye = positions[36];       // Mắt trái
    const rightEye = positions[45];      // Mắt phải
    const leftMouth = positions[48];     // Miệng trái
    const rightMouth = positions[54];    // Miệng phải
    const chin = positions[8];           // Cằm

    // Tính góc Yaw (xoay trái/phải)
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const mouthCenterX = (leftMouth.x + rightMouth.x) / 2;
    const yawOffset = Math.abs(noseTip.x - eyeCenterX);
    const faceWidth = Math.abs(leftEye.x - rightEye.x);
    const yaw = (yawOffset / faceWidth) * 45; // Ước tính góc (độ)

    // Tính góc Pitch (ngẩng/cúi)
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const pitchOffset = noseTip.y - eyeCenterY;
    const faceHeight = Math.abs(chin.y - eyeCenterY);
    const pitch = (pitchOffset / faceHeight) * 30; // Ước tính góc (độ)

    // Tính góc Roll (nghiêng)
    const eyeLineAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = (eyeLineAngle * 180) / Math.PI; // Chuyển sang độ

    const yawOk = Math.abs(yaw) <= this.thresholds.yawTolerance;
    const pitchOk = Math.abs(pitch) <= this.thresholds.pitchTolerance;
    const rollOk = Math.abs(roll) <= this.thresholds.rollTolerance;

    const orientationOk = yawOk && pitchOk && rollOk;

    // Score dựa trên độ lệch tổng hợp
    const totalDeviation = 
      Math.abs(yaw) / this.thresholds.yawTolerance +
      Math.abs(pitch) / this.thresholds.pitchTolerance +
      Math.abs(roll) / this.thresholds.rollTolerance;

    const score = Math.max(0, 1 - totalDeviation / 3);

    return {
      yaw,
      pitch,
      roll,
      yawOk,
      pitchOk,
      rollOk,
      orientationOk,
      score
    };
  }

  /**
   * Kiểm tra độ tin cậy của detection
   */
  checkDetectionConfidence(detection) {
    const score = detection.detection.score;
    const passed = score >= this.thresholds.minConfidence;

    return {
      score,
      passed
    };
  }

  /**
   * Tính confidence tổng hợp
   */
  calculateOverallConfidence(checks) {
    const weights = {
      position: 0.25,
      size: 0.2,
      orientation: 0.35,
      confidence: 0.2
    };

    const confidence =
      checks.positionCheck.score * weights.position +
      checks.sizeCheck.score * weights.size +
      checks.orientationCheck.score * weights.orientation +
      checks.confidenceCheck.score * weights.confidence;

    return Math.min(confidence, 1);
  }

  /**
   * Lấy lý do alignment
   */
  getAlignmentReason(aligned, checks) {
    if (aligned) {
      return '✓ Khuôn mặt đã khớp khung';
    }

    const reasons = [];
    
    if (!checks.positionCheck.centered) {
      const { offsetX, offsetY } = checks.positionCheck;
      if (offsetX > this.thresholds.centerTolerance) {
        reasons.push(checks.positionCheck.faceCenterX < checks.positionCheck.videoCenterX 
          ? 'Di chuyển sang phải' 
          : 'Di chuyển sang trái');
      }
      if (offsetY > this.thresholds.centerTolerance) {
        reasons.push(checks.positionCheck.faceCenterY < checks.positionCheck.videoCenterY 
          ? 'Di chuyển xuống' 
          : 'Di chuyển lên');
      }
    }

    if (!checks.sizeCheck.sizeOk) {
      if (checks.sizeCheck.sizeRatio < this.thresholds.minFaceSize) {
        reasons.push('Tiến lại gần hơn');
      } else {
        reasons.push('Lùi ra xa hơn');
      }
    }

    if (!checks.orientationCheck.orientationOk) {
      if (!checks.orientationCheck.yawOk) {
        reasons.push('Nhìn thẳng vào camera');
      }
      if (!checks.orientationCheck.pitchOk) {
        reasons.push('Giữ đầu thẳng');
      }
      if (!checks.orientationCheck.rollOk) {
        reasons.push('Không nghiêng đầu');
      }
    }

    if (!checks.confidenceCheck.passed) {
      reasons.push('Cải thiện ánh sáng');
    }

    return reasons.join(', ') || 'Điều chỉnh vị trí khuôn mặt';
  }

  /**
   * Draw face detection overlay (để debug)
   */
  drawDetection(canvas, detection, videoWidth, videoHeight) {
    if (!detection) return;

    const ctx = canvas.getContext('2d');
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw bounding box
    const box = detection.detection.box;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw landmarks
    if (detection.landmarks) {
      ctx.fillStyle = '#ff0000';
      detection.landmarks.positions.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }
}

export default new FaceAlignmentService();