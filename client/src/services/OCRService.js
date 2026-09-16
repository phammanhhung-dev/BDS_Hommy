import Tesseract from 'tesseract.js';

const OCRService = {
  /**
   * Preprocessing ảnh nâng cao với CLAHE và denoising
   */
  preprocessImage: async (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Scale 2.5x cho CCCD (tối ưu cho text nhỏ)
        const scale = 2.5;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Vẽ ảnh với scale cao và smooth
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        
        // STEP 1: Bilateral Filter (Denoising) - giảm noise giữ edge
        console.log('🔧 Bước 1: Bilateral denoising...');
        data = OCRService.bilateralFilter(data, canvas.width, canvas.height);
        
        // STEP 2: Grayscale conversion
        console.log('🔧 Bước 2: Grayscale conversion...');
        const grayData = new Uint8ClampedArray(canvas.width * canvas.height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          grayData[j] = Math.round(
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          );
        }
        
        // STEP 3: CLAHE (Contrast Limited Adaptive Histogram Equalization)
        console.log('🔧 Bước 3: CLAHE enhancement...');
        const enhancedGray = OCRService.applyCLAHE(grayData, canvas.width, canvas.height);
        
        // STEP 4: Adaptive Thresholding (Otsu's method)
        console.log('🔧 Bước 4: Adaptive thresholding...');
        const threshold = OCRService.calculateOtsuThreshold(enhancedGray);
        console.log(`   Otsu threshold: ${threshold}`);
        
        // STEP 5: Apply threshold với morphological closing
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const binary = enhancedGray[j] > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = binary;
        }
        
        // STEP 6: Morphological operations (xóa noise nhỏ)
        console.log('🔧 Bước 5: Morphological cleaning...');
        imageData = OCRService.morphologicalClose(data, canvas.width, canvas.height);
        
        ctx.putImageData(imageData, 0, 0);
        
        // STEP 7: Final sharpening
        ctx.filter = 'contrast(1.1) brightness(1.05)';
        ctx.drawImage(canvas, 0, 0);
        
        console.log('✅ Preprocessing hoàn tất');
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageDataUrl;
    });
  },

  /**
   * Bilateral Filter - denoising giữ nguyên edge
   */
  bilateralFilter: (data, width, height, d = 5, sigmaColor = 50, sigmaSpace = 50) => {
    const output = new Uint8ClampedArray(data.length);
    const halfD = Math.floor(d / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
        
        for (let ky = -halfD; ky <= halfD; ky++) {
          for (let kx = -halfD; kx <= halfD; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nidx = (ny * width + nx) * 4;
              
              // Spatial weight
              const spatialDist = kx * kx + ky * ky;
              const spatialWeight = Math.exp(-spatialDist / (2 * sigmaSpace * sigmaSpace));
              
              // Color weight
              const colorDist = Math.pow(data[idx] - data[nidx], 2) +
                               Math.pow(data[idx + 1] - data[nidx + 1], 2) +
                               Math.pow(data[idx + 2] - data[nidx + 2], 2);
              const colorWeight = Math.exp(-colorDist / (2 * sigmaColor * sigmaColor));
              
              const weight = spatialWeight * colorWeight;
              sumR += data[nidx] * weight;
              sumG += data[nidx + 1] * weight;
              sumB += data[nidx + 2] * weight;
              sumWeight += weight;
            }
          }
        }
        
        output[idx] = sumR / sumWeight;
        output[idx + 1] = sumG / sumWeight;
        output[idx + 2] = sumB / sumWeight;
        output[idx + 3] = data[idx + 3];
      }
    }
    
    return output;
  },

  /**
   * CLAHE - Contrast Limited Adaptive Histogram Equalization
   */
  applyCLAHE: (grayData, width, height, tileSize = 8, clipLimit = 2.0) => {
    const output = new Uint8ClampedArray(grayData.length);
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);
    
    // Process each tile
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x0 = tx * tileSize;
        const y0 = ty * tileSize;
        const x1 = Math.min(x0 + tileSize, width);
        const y1 = Math.min(y0 + tileSize, height);
        
        // Calculate histogram for this tile
        const hist = new Array(256).fill(0);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            hist[grayData[y * width + x]]++;
          }
        }
        
        // Clip histogram
        const clipValue = ((x1 - x0) * (y1 - y0) * clipLimit) / 256;
        let excess = 0;
        for (let i = 0; i < 256; i++) {
          if (hist[i] > clipValue) {
            excess += hist[i] - clipValue;
            hist[i] = clipValue;
          }
        }
        const avgIncrease = excess / 256;
        for (let i = 0; i < 256; i++) {
          hist[i] += avgIncrease;
        }
        
        // Calculate CDF
        const cdf = new Array(256);
        cdf[0] = hist[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + hist[i];
        }
        
        // Normalize CDF
        const cdfMin = cdf.find(v => v > 0) || 0;
        const cdfMax = cdf[255];
        const scale = 255.0 / (cdfMax - cdfMin);
        
        // Apply equalization to tile
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const idx = y * width + x;
            const val = grayData[idx];
            output[idx] = Math.round((cdf[val] - cdfMin) * scale);
          }
        }
      }
    }
    
    return output;
  },

  /**
   * Otsu's method - tính threshold tự động
   */
  calculateOtsuThreshold: (grayData) => {
    // Calculate histogram
    const hist = new Array(256).fill(0);
    for (let i = 0; i < grayData.length; i++) {
      hist[grayData[i]]++;
    }
    
    // Normalize histogram
    const total = grayData.length;
    const prob = hist.map(h => h / total);
    
    // Calculate Otsu threshold
    let maxVariance = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      let w0 = 0, w1 = 0, sum0 = 0, sum1 = 0;
      
      for (let i = 0; i < 256; i++) {
        if (i <= t) {
          w0 += prob[i];
          sum0 += i * prob[i];
        } else {
          w1 += prob[i];
          sum1 += i * prob[i];
        }
      }
      
      if (w0 > 0 && w1 > 0) {
        const mean0 = sum0 / w0;
        const mean1 = sum1 / w1;
        const variance = w0 * w1 * Math.pow(mean0 - mean1, 2);
        
        if (variance > maxVariance) {
          maxVariance = variance;
          threshold = t;
        }
      }
    }
    
    return threshold;
  },

  /**
   * Morphological Closing - xóa noise nhỏ
   */
  morphologicalClose: (data, width, height, kernelSize = 3) => {
    const imageData = new ImageData(new Uint8ClampedArray(data), width, height);
    const temp = new Uint8ClampedArray(data.length);
    const half = Math.floor(kernelSize / 2);
    
    // Dilation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4;
              maxVal = Math.max(maxVal, data[idx]);
            }
          }
        }
        const idx = (y * width + x) * 4;
        temp[idx] = temp[idx + 1] = temp[idx + 2] = maxVal;
        temp[idx + 3] = 255;
      }
    }
    
    // Erosion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minVal = 255;
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4;
              minVal = Math.min(minVal, temp[idx]);
            }
          }
        }
        const idx = (y * width + x) * 4;
        imageData.data[idx] = imageData.data[idx + 1] = imageData.data[idx + 2] = minVal;
      }
    }
    
    return imageData;
  },

  recognize: async (imageFile) => {
    try {
      console.log('🔄 Bắt đầu OCR...');
      
      // Preprocessing ảnh
      const processedImage = await OCRService.preprocessImage(imageFile);
      
      // Tạo worker với config tối ưu cho CCCD Việt Nam
      const worker = await Tesseract.createWorker('vie', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        errorHandler: err => console.error('❌ Worker error:', err)
      });
      
      await worker.setParameters({
        // Character whitelist (full Vietnamese + numbers + punctuation)
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ /:,.-',
        
        // PSM 6: Assume uniform block of text (tốt nhất cho CCCD)
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        
        // LSTM only (tốt nhất cho Vietnamese)
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        
        // Disable dictionary (tránh auto-correct sai cho số CCCD)
        load_system_dawg: '0',
        load_freq_dawg: '0',
        load_unambig_dawg: '0',
        load_punc_dawg: '0',
        load_number_dawg: '0',
        
        // Preserve spacing
        preserve_interword_spaces: '1',
      });
      
      const { data: { text, confidence } } = await worker.recognize(processedImage);
      
      console.log(`✅ OCR hoàn thành - Confidence: ${confidence}%`);
      console.log('📄 Raw text:', text);
      
      await worker.terminate();
      return text;
    } catch (error) {
      console.error('❌ OCR Error:', error);
      throw error;
    }
  },

  parseCCCD: (text) => {
    console.log('🔍 Bắt đầu parse CCCD...');
    
    const result = {
      soCCCD: null,
      tenDayDu: null,
      ngaySinh: null,
      diaChi: null,
      ngayCap: null,
      noiCap: null
    };

    // Normalize text: loại bỏ khoảng trắng thừa, chuyển về uppercase
    const normalizedText = text
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, 'I')  // Fix OCR nhầm | thành I
      .trim();

    const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('📝 Lines:', lines);

    // 1. Số CCCD (12 digits) - Thường ở đầu hoặc có label "Số"/"No"
    const cccdPatterns = [
      /(?:Số|No|ID|CCCD)[\s:]*(\d{12})/i,
      /(\d{12})/,
    ];
    
    for (const pattern of cccdPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        result.soCCCD = match[1] || match[0].replace(/\D/g, '');
        if (result.soCCCD.length === 12) {
          console.log('✅ Số CCCD:', result.soCCCD);
          break;
        }
      }
    }

    // 2. Họ và tên (Full name) - Thường sau label "Họ và tên"/"Full name"
    const namePatterns = [
      /(?:Họ và tên|Full name|Họ tên)[\s:]*([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ\s]+)/i,
      /([A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]{2,}(?:\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]{2,})+)/,
    ];
    
    for (const pattern of namePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Validate: tên phải có ít nhất 2 từ, mỗi từ >= 2 ký tự
        const words = name.split(/\s+/);
        if (words.length >= 2 && words.every(w => w.length >= 2)) {
          result.tenDayDu = name;
          console.log('✅ Họ và tên:', result.tenDayDu);
          break;
        }
      }
    }

    // 3. Ngày sinh & Ngày cấp - Extract với context
    const datePattern = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/g;
    const dates = [];
    let dateMatch;
    
    while ((dateMatch = datePattern.exec(normalizedText)) !== null) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      
      // Validate date (basic check)
      if (parseInt(day) >= 1 && parseInt(day) <= 31 && 
          parseInt(month) >= 1 && parseInt(month) <= 12 &&
          parseInt(year) >= 1900 && parseInt(year) <= 2025) {
        dates.push({
          date: `${day}/${month}/${year}`,
          context: normalizedText.substring(Math.max(0, dateMatch.index - 20), dateMatch.index + 30)
        });
      }
    }
    
    if (dates.length > 0) {
      // Ngày sinh - tìm date có context "Date of birth" hoặc year < 2010
      const dobMatch = dates.find(d => 
        /(?:Ngày sinh|Date of birth|DOB)/i.test(d.context) ||
        parseInt(d.date.split('/')[2]) < 2010
      );
      result.ngaySinh = dobMatch ? dobMatch.date : dates[0].date;
      console.log('✅ Ngày sinh:', result.ngaySinh);
      
      // Ngày cấp - tìm date có context "Date of issue" hoặc year >= 2015
      const issueMatch = dates.find(d => 
        /(?:Ngày cấp|Date of issue)/i.test(d.context) ||
        parseInt(d.date.split('/')[2]) >= 2015
      );
      result.ngayCap = issueMatch ? issueMatch.date : (dates.length > 1 ? dates[dates.length - 1].date : null);
      console.log('✅ Ngày cấp:', result.ngayCap);
    }

    // 4. Địa chỉ - Extract và clean
    const addressKeywords = ['Tỉnh', 'Thành phố', 'Quận', 'Huyện', 'Phường', 'Xã', 'Thị trấn', 'Thôn', 'Xóm'];
    let bestAddressLine = '';
    let maxScore = 0;
    
    for (const line of lines) {
      if (line.length > 15) {
        let score = 0;
        
        // Score based on keywords
        for (const keyword of addressKeywords) {
          if (line.includes(keyword)) score += 2;
        }
        
        // Score based on length (địa chỉ thường dài)
        if (line.length > 30) score += 1;
        if (line.length > 50) score += 1;
        
        // Score based on numbers (số nhà)
        if (/\d+/.test(line)) score += 1;
        
        // Penalty for noise patterns
        if (line.includes('CCCD') || line.includes('No') || /^\d{12}$/.test(line)) score -= 5;
        
        if (score > maxScore) {
          maxScore = score;
          bestAddressLine = line;
        }
      }
    }
    
    if (bestAddressLine) {
      // Clean address: remove labels và số CCCD lạc vào
      result.diaChi = bestAddressLine
        .replace(/(?:Địa chỉ|Address|Nơi thường trú|Place of residence)[\s:]*/gi, '')
        .replace(/\d{12}/g, '')  // Remove CCCD nếu lạc vào
        .replace(/\s+/g, ' ')
        .trim();
      console.log('✅ Địa chỉ:', result.diaChi);
    }

    // 5. Nơi cấp - Enhanced patterns cho "Cục Cảnh sát..."
    const noiCapPatterns = [
      /(?:Nơi cấp|Place of issue)[\s:]*([^\n]{10,})/i,
      /(Cục Cảnh sát[^\n]{0,50})/i,
      /(Cục [A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ\s]{5,50})/i,
      /(Công an [A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ\s]+)/i,
    ];
    
    for (const pattern of noiCapPatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let noiCap = match[1].trim();
        
        // Clean up noiCap
        noiCap = noiCap
          .replace(/\d{2}\/\d{2}\/\d{4}/g, '')  // Remove dates
          .replace(/\d{12}/g, '')  // Remove CCCD
          .replace(/\s+/g, ' ')
          .trim();
        
        if (noiCap.length >= 10 && noiCap.length <= 100) {
          result.noiCap = noiCap;
          console.log('✅ Nơi cấp:', result.noiCap);
          break;
        }
      }
    }
    
    // Fallback: tìm line có "Cục" hoặc "Công an"
    if (!result.noiCap) {
      for (const line of lines) {
        if ((line.includes('Cục') || line.includes('Công an')) && 
            line.length >= 10 && line.length <= 100) {
          result.noiCap = line.trim();
          console.log('✅ Nơi cấp (fallback):', result.noiCap);
          break;
        }
      }
    }

    // Fallback: nếu không tìm được tên, thử tìm dòng toàn chữ hoa dài nhất
    if (!result.tenDayDu) {
      for (const line of lines) {
        if (line === line.toUpperCase() && 
            line.length > 10 && 
            line.length < 50 &&
            /^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ\s]+$/.test(line)) {
          result.tenDayDu = line.trim();
          console.log('✅ Họ và tên (fallback):', result.tenDayDu);
          break;
        }
      }
    }

    console.log('📊 Kết quả parse:', result);
    return result;
  }
};

export default OCRService;
