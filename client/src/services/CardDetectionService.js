/**
 * CardDetectionService - Nhận diện CCCD trong khung hình
 * Sử dụng thuật toán edge detection và contour analysis
 * để xác định khi thẻ CCCD nằm đúng vị trí trong khung overlay
 */

class CardDetectionService {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Các ngưỡng để xác định card alignment
    this.thresholds = {
      minCardArea: 0.18,      // Card phải chiếm ít nhất 18% khung hình (linh hoạt hơn)
      maxCardArea: 0.65,      // Card không quá 65% khung hình
      aspectRatio: 1.586,     // Tỷ lệ CCCD chuẩn (85.6mm x 54mm)
      aspectTolerance: 0.18,  // Cho phép sai số 18% để chấp nhận góc nghiêng thực tế
      minBrightness: 80,      // Độ sáng tối thiểu (0-255)
      minSharpness: 30,       // Độ nét tối thiểu
      edgeThreshold: 100,     // Ngưỡng phát hiện cạnh
      minCornerConfidence: 0.7, // Độ tin cậy tối thiểu khi phát hiện 4 góc
      minRectangularityScore: 0.55, // Điểm tối thiểu cho hình chữ nhật (giảm từ 0.6 → 0.55)
    };

    // Vùng overlay frame (tỷ lệ % so với video)
    this.overlayRegion = {
      x: 0.1,      // 10% từ trái
      y: 0.25,     // 25% từ trên
      width: 0.8,  // 80% chiều rộng
      height: 0.45 // 45% chiều cao
    };
  }

  /**
   * Phân tích frame video để kiểm tra card alignment
   * @param {HTMLVideoElement} videoElement - Video element từ webcam
   * @returns {Object} - Kết quả phân tích
   */
  async analyzeFrame(videoElement) {
    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      return { aligned: false, confidence: 0, reason: 'Video chưa sẵn sàng' };
    }

    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Set canvas size
    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

    // Draw video frame to canvas
    this.ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

    // Lấy image data từ overlay region
    const overlayX = Math.floor(videoWidth * this.overlayRegion.x);
    const overlayY = Math.floor(videoHeight * this.overlayRegion.y);
    const overlayWidth = Math.floor(videoWidth * this.overlayRegion.width);
    const overlayHeight = Math.floor(videoHeight * this.overlayRegion.height);

    const imageData = this.ctx.getImageData(overlayX, overlayY, overlayWidth, overlayHeight);

    // Chạy các bước phân tích
    const brightnessCheck = this.checkBrightness(imageData);
    const sharpnessCheck = this.checkSharpness(imageData);
    const colorVarianceCheck = this.checkColorVariance(imageData); // NEW - phát hiện face vs card
    const edgeCheck = this.detectCardEdges(imageData, overlayWidth, overlayHeight);
    const sizeCheck = this.checkCardSize(edgeCheck, overlayWidth, overlayHeight);
    const aspectCheck = this.checkAspectRatio(edgeCheck, overlayWidth, overlayHeight);
    const rectangularityCheck = this.checkRectangularity(edgeCheck);

    // Tính confidence tổng hợp + xác suất đây là thẻ hợp lệ
    const confidence = this.calculateOverallConfidence({
      brightnessCheck,
      sharpnessCheck,
      colorVarianceCheck,
      edgeCheck,
      sizeCheck,
      aspectCheck,
      rectangularityCheck
    });

    const cardLikelihood = this.calculateCardLikelihood({
      brightnessCheck,
      sharpnessCheck,
      colorVarianceCheck,
      sizeCheck
    });

    const geometryScore = this.calculateGeometryScore({
      edgeCheck,
      sizeCheck,
      aspectCheck,
      rectangularityCheck
    });

    const aligned =
      confidence >= 0.65 ||
      cardLikelihood >= 0.7 ||
      (cardLikelihood >= 0.6 && geometryScore >= 0.5);

    return {
      aligned,
      confidence,
      details: {
        brightness: brightnessCheck,
        sharpness: sharpnessCheck,
        colorVariance: colorVarianceCheck,
        edges: edgeCheck,
        size: sizeCheck,
        aspect: aspectCheck,
        rectangularity: rectangularityCheck,
        cardLikelihood,
        geometryScore
      },
      reason: this.getAlignmentReason(aligned, { 
        brightnessCheck, 
        sharpnessCheck, 
        colorVarianceCheck,
        edgeCheck, 
        sizeCheck, 
        aspectCheck, 
        rectangularityCheck,
        cardLikelihood,
        geometryScore
      })
    };
  }

  /**
   * Kiểm tra độ sáng của ảnh
   */
  checkBrightness(imageData) {
    const data = imageData.data;
    let totalBrightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      // Luminance formula: 0.299*R + 0.587*G + 0.114*B
      const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalBrightness += brightness;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const score = Math.min(avgBrightness / this.thresholds.minBrightness, 1);

    return {
      value: avgBrightness,
      score,
      passed: avgBrightness >= this.thresholds.minBrightness
    };
  }

  /**
   * Kiểm tra độ nét của ảnh (Laplacian variance)
   */
  checkSharpness(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Convert to grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Apply Laplacian kernel
    let variance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian =
          -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1] +
          -gray[idx - 1] + 8 * gray[idx] - gray[idx + 1] +
          -gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1];

        variance += laplacian * laplacian;
        count++;
      }
    }

    const sharpness = Math.sqrt(variance / count);
    const score = Math.min(sharpness / this.thresholds.minSharpness, 1);

    return {
      value: sharpness,
      score,
      passed: sharpness >= this.thresholds.minSharpness
    };
  }

  /**
   * Kiểm tra độ biến thiên màu sắc - Phân biệt thẻ CCCD vs Gương mặt
   * Thẻ CCCD có background đồng nhất, màu sắc ít thay đổi
   * Gương mặt có skin tone, shadow, facial features → variance cao
   */
  checkColorVariance(imageData) {
    const data = imageData.data;
    const pixelCount = data.length / 4;
    
    // Tính mean RGB
    let meanR = 0, meanG = 0, meanB = 0;
    for (let i = 0; i < data.length; i += 4) {
      meanR += data[i];
      meanG += data[i + 1];
      meanB += data[i + 2];
    }
    meanR /= pixelCount;
    meanG /= pixelCount;
    meanB /= pixelCount;
    
    // Tính variance RGB
    let varianceR = 0, varianceG = 0, varianceB = 0;
    for (let i = 0; i < data.length; i += 4) {
      varianceR += Math.pow(data[i] - meanR, 2);
      varianceG += Math.pow(data[i + 1] - meanG, 2);
      varianceB += Math.pow(data[i + 2] - meanB, 2);
    }
    varianceR /= pixelCount;
    varianceG /= pixelCount;
    varianceB /= pixelCount;
    
    // Tổng variance
    const totalVariance = Math.sqrt(varianceR + varianceG + varianceB);
    
    // Thẻ CCCD: variance thấp (20-50 nền đồng nhất), NHƯNG có thể 50-85 nếu có ảnh chân dung
    // Gương mặt thật: variance rất cao (100-150)
    // Score cao khi variance THẤP (là thẻ), score thấp khi variance CAO (là mặt)
    const maxCardVariance = 85; // Ngưỡng variance tối đa cho thẻ (tăng từ 60 → 85)
    const score = totalVariance <= maxCardVariance ? 
                  1 - (totalVariance / maxCardVariance) * 0.3 : // 1.0 → 0.7 khi variance tăng (giảm penalty)
                  Math.max(0, 0.3 - (totalVariance - maxCardVariance) / 150); // < 0.3 khi variance rất cao
    
    const passed = totalVariance <= maxCardVariance;
    
    return {
      variance: totalVariance,
      score,
      passed,
      reason: passed ? 'Màu sắc đồng nhất (thẻ)' : 'Màu sắc biến thiên cao (có thể là gương mặt)'
    };
  }

  /**
   * Phát hiện các cạnh của thẻ bằng Canny Edge Detection đơn giản
   */
  detectCardEdges(imageData, width, height) {
    const data = imageData.data;
    
    // Convert to grayscale
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Simple Sobel edge detection
    const edges = new Uint8Array(width * height);
    let edgeCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel X
        const gx =
          -gray[idx - width - 1] + gray[idx - width + 1] +
          -2 * gray[idx - 1] + 2 * gray[idx + 1] +
          -gray[idx + width - 1] + gray[idx + width + 1];

        // Sobel Y
        const gy =
          -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1] +
          gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > this.thresholds.edgeThreshold) {
          edges[idx] = 255;
          edgeCount++;
        }
      }
    }

    // Phân tích phân bố edges để tìm hình chữ nhật
    const rectangleConfidence = this.analyzeRectanglePattern(edges, width, height);

    return {
      edgeCount,
      edgeRatio: edgeCount / (width * height),
      rectangleConfidence,
      passed: rectangleConfidence >= this.thresholds.minCornerConfidence
    };
  }

  /**
   * Phân tích pattern edges để tìm hình chữ nhật (đơn giản hóa)
   */
  analyzeRectanglePattern(edges, width, height) {
    // Chia vùng thành 9 ô (3x3 grid)
    const gridSize = 3;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    const edgeDensity = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let cellEdges = 0;
        for (let y = gy * cellHeight; y < (gy + 1) * cellHeight; y++) {
          for (let x = gx * cellWidth; x < (gx + 1) * cellWidth; x++) {
            if (edges[y * width + x] === 255) cellEdges++;
          }
        }
        edgeDensity.push(cellEdges);
      }
    }

    // Hình chữ nhật có edge mạnh ở biên, yếu ở giữa
    const corners = [edgeDensity[0], edgeDensity[2], edgeDensity[6], edgeDensity[8]];
    const edges_mid = [edgeDensity[1], edgeDensity[3], edgeDensity[5], edgeDensity[7]];
    const center = edgeDensity[4];

    const avgCorner = corners.reduce((a, b) => a + b, 0) / corners.length;
    const avgEdge = edges_mid.reduce((a, b) => a + b, 0) / edges_mid.length;

    // Card có edge mạnh và center yếu hơn
    const confidence = center < avgCorner * 0.5 && avgEdge > 0 ? 
                      Math.min((avgCorner + avgEdge) / (center + 1) / 10, 1) : 0;

    return confidence;
  }

  /**
   * Kiểm tra tỷ lệ khung hình (aspect ratio) - CCCD có tỷ lệ 1.586 cố định
   */
  checkAspectRatio(edgeCheck, overlayWidth, overlayHeight) {
    // Giả sử card chiếm overlay region
    const estimatedCardWidth = overlayWidth * Math.sqrt(edgeCheck.edgeRatio);
    const estimatedCardHeight = overlayHeight * Math.sqrt(edgeCheck.edgeRatio);
    const aspectRatio = estimatedCardWidth / estimatedCardHeight;
    
    const targetAspect = this.thresholds.aspectRatio;
    const tolerance = this.thresholds.aspectTolerance;
    
    const minAspect = targetAspect * (1 - tolerance);
    const maxAspect = targetAspect * (1 + tolerance);
    
    const passed = aspectRatio >= minAspect && aspectRatio <= maxAspect;
    const deviation = Math.abs(aspectRatio - targetAspect) / targetAspect;
    const score = passed ? Math.max(0, 1 - deviation / tolerance) : 0;
    
    return {
      aspectRatio,
      targetAspect,
      deviation,
      passed,
      score
    };
  }

  /**
   * Kiểm tra độ "chữ nhật" của shape - phân biệt thẻ vs gương mặt
   */
  checkRectangularity(edgeCheck) {
    // rectangleConfidence từ analyzeRectanglePattern đã tính pattern hình chữ nhật
    const rectangularityScore = edgeCheck.rectangleConfidence;
    const passed = rectangularityScore >= this.thresholds.minRectangularityScore;
    
    return {
      score: rectangularityScore,
      passed,
      reason: passed ? 'Hình dạng chữ nhật rõ ràng' : 'Hình dạng không phải thẻ'
    };
  }

  /**
   * Kiểm tra kích thước và tỷ lệ
   */
  checkCardSize(edgeCheck, overlayWidth, overlayHeight) {
    // Ước tính diện tích từ edge density
    const estimatedCardArea = edgeCheck.edgeRatio * overlayWidth * overlayHeight;
    const overlayArea = overlayWidth * overlayHeight;
    const areaRatio = estimatedCardArea / overlayArea;

    const sizeOk = areaRatio >= this.thresholds.minCardArea && 
                   areaRatio <= this.thresholds.maxCardArea;

    return {
      areaRatio,
      sizeOk,
      score: sizeOk ? 1 : Math.max(0, 1 - Math.abs(areaRatio - 0.4) / 0.4)
    };
  }

  /**
   * Tính confidence tổng hợp
   */
  calculateOverallConfidence(checks) {
    const weights = {
      brightness: 0.10,      // 10%
      sharpness: 0.15,       // 15%
      colorVariance: 0.12,   // 12% - giảm từ 0.20 (CCCD có ảnh chân dung)
      edges: 0.25,           // 25% - tăng từ 0.20 (quan trọng hơn)
      size: 0.10,            // 10%
      aspect: 0.15,          // 15%
      rectangularity: 0.13   // 13% - tăng từ 0.10 (shape quan trọng)
    };

    const confidence =
      checks.brightnessCheck.score * weights.brightness +
      checks.sharpnessCheck.score * weights.sharpness +
      checks.colorVarianceCheck.score * weights.colorVariance +
      (checks.edgeCheck.rectangleConfidence * 0.7 + (checks.edgeCheck.passed ? 0.3 : 0)) * weights.edges +
      checks.sizeCheck.score * weights.size +
      checks.aspectCheck.score * weights.aspect +
      checks.rectangularityCheck.score * weights.rectangularity;

    return Math.min(confidence, 1);
  }

  /**
   * Card likelihood - điểm riêng đánh giá đây có phải là thẻ hợp lệ không
   * Dựa nhiều vào màu sắc đồng nhất + kích thước phù hợp
   */
  calculateCardLikelihood(checks) {
    const weights = {
      colorVariance: 0.3,
      size: 0.3,
      brightness: 0.2,
      sharpness: 0.2
    };

    let likelihood =
      checks.colorVarianceCheck.score * weights.colorVariance +
      checks.sizeCheck.score * weights.size +
      checks.brightnessCheck.score * weights.brightness +
      checks.sharpnessCheck.score * weights.sharpness;

    // Nếu variance quá cao (> 140) khả năng là mặt thật → phạt thêm
    if (checks.colorVarianceCheck.variance > 140) {
      likelihood -= 0.15;
    }

    return Math.max(0, Math.min(likelihood, 1));
  }

  /**
   * Geometry score đánh giá tổng hợp các yếu tố hình học
   */
  calculateGeometryScore(checks) {
    const weights = {
      edges: 0.4,
      aspect: 0.25,
      rectangularity: 0.2,
      size: 0.15
    };

    const edgeScore = checks.edgeCheck.rectangleConfidence;
    const aspectScore = checks.aspectCheck.score;
    const rectScore = checks.rectangularityCheck.score;
    const sizeScore = checks.sizeCheck.score;

    const geometry =
      edgeScore * weights.edges +
      aspectScore * weights.aspect +
      rectScore * weights.rectangularity +
      sizeScore * weights.size;

    return Math.max(0, Math.min(geometry, 1));
  }

  /**
   * Lấy lý do alignment
   */
  getAlignmentReason(aligned, checks) {
    if (aligned) {
      return '✓ CCCD nằm đúng vị trí';
    }

    const reasons = [];
    const likelyCard = (checks.cardLikelihood ?? 0) >= 0.55;
    const geometryScore = checks.geometryScore ?? 0;

    // Ưu tiên các lỗi quan trọng trước
    if (!checks.brightnessCheck.passed) reasons.push('Ánh sáng không đủ');
    if (!checks.sharpnessCheck.passed) reasons.push('Ảnh bị mờ');
    if (!checks.edgeCheck.passed && geometryScore < 0.6) reasons.push('Chưa khớp khung');
    if (!checks.sizeCheck.sizeOk) reasons.push('Khoảng cách chưa phù hợp');

    if (checks.aspectCheck && !checks.aspectCheck.passed) {
      if (!likelyCard || checks.aspectCheck.deviation > 0.22) {
        reasons.push('Tỷ lệ không phải thẻ CCCD');
      } else {
        reasons.push('Giữ thẻ thẳng hơn một chút');
      }
    }

    if (checks.rectangularityCheck && !checks.rectangularityCheck.passed) {
      if (geometryScore < 0.55) {
        reasons.push('Không phải hình chữ nhật');
      } else {
        reasons.push('Giữ chắc khung, hạn chế rung tay');
      }
    }

    // ColorVariance check cuối cùng (vì CCCD có ảnh chân dung có thể fail check này)
    if (checks.colorVarianceCheck && !checks.colorVarianceCheck.passed && checks.colorVarianceCheck.variance > 140) {
      reasons.push('⚠️ Có thể là gương mặt thật - vui lòng đưa thẻ CCCD vào khung');
    }

    if (likelyCard && reasons.length === 0) {
      return 'Giữ yên thẻ thêm 1 giây để hệ thống chụp tự động';
    }

    return reasons.join(', ') || 'Điều chỉnh vị trí CCCD';
  }
}

export default new CardDetectionService();
