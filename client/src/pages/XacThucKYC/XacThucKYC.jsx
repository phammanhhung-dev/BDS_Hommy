import React, { useState, useEffect } from 'react';
import CameraCapture from '../../components/KYC/CameraCapture';
import OCRServiceV2 from '../../services/OCRServiceV2';
import QRCodeService from '../../services/QRCodeService';
import FaceMatchingService from '../../services/FaceMatchingService';
import KYCService from '../../services/KYCService';
import ImageProcessingService from '../../services/ImageProcessingService';
import ImageResizeService from '../../services/ImageResizeService';
import { motion, AnimatePresence } from 'framer-motion';
import './XacThucKYC.css';
import { FiUpload, FiCamera } from 'react-icons/fi';

const STEPS = {
  INTRO: 0,
  CCCD_FRONT: 1,
  CCCD_BACK: 2,
  SELFIE: 3,
  PROCESSING: 4,
  PREVIEW: 5,
  SUCCESS: 6,
  FAILURE: 7
};

const XacThucKYC = () => {
  const [step, setStep] = useState(STEPS.INTRO);
  const [images, setImages] = useState({
    cccdFront: null,
    cccdBack: null,
    selfie: null
  });
  const [ocrData, setOcrData] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [error, setError] = useState(null);
  const [inputMethod, setInputMethod] = useState('camera'); // 'camera' | 'upload'
  const [processingStatus, setProcessingStatus] = useState('');
  const [showVision, setShowVision] = useState(true);
  const [roiConfig, setRoiConfig] = useState({
    ocr: { ...OCRServiceV2.CCCD_ROI },
    qr: {
      full: { x: 0, y: 0, width: 1, height: 1 },
      trl: { x: 0.6943596950212068, y: 0, width: 0.28, height: 0.38 },
      trm: { x: 0.7239388609855822, y: 0.0003052771011813199, width: 0.24, height: 0.33 },
      trs: { x: 0.7688202812287943, y: 0.046528110505082154, width: 0.15, height: 0.23 },
      tc: { x: 0.7450600625148778, y: 0, width: 0.2, height: 0.3 }
    }
  });
  const [dragState, setDragState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visionRef = React.useRef(null);

  // Ripple effect state
  const [ripple, setRipple] = useState({ active: false, x: 0, y: 0 });

  // Sound effect helper
  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  const triggerRipple = () => {
    setRipple({ active: true, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    playSuccessSound();
    setTimeout(() => setRipple({ active: false, x: 0, y: 0 }), 1000);
  };

  useEffect(() => {
    // Load models on mount
    const loadModels = async () => {
      try {
        await FaceMatchingService.loadModels();
        await ImageProcessingService.loadOpenCV();
      } catch (err) {
        console.error('Model load error:', err);
      }
    };
    loadModels();
  }, []);

  const handleCapture = (imageSrc) => {
    console.log(`📥 [XacThucKYC] handleCapture called - step: ${step}, imageSrc length: ${imageSrc?.length || 0}`);
    
    if (step === STEPS.CCCD_FRONT) {
      console.log('✅ [XacThucKYC] Lưu ảnh mặt trước CCCD');
      // Reset ocrData và qrData khi bắt đầu lại
      setOcrData(null);
      setQrData(null);
      setMergedData(null);
      setFaceMatchResult(null);
      
      setImages(prev => {
        const newState = { ...prev, cccdFront: imageSrc };
        console.log('📸 [XacThucKYC] State updated - cccdFront:', newState.cccdFront ? 'có ảnh' : 'null');
        return newState;
      });
      triggerRipple();
      setTimeout(() => {
        setStep(STEPS.CCCD_BACK);
        setInputMethod('camera');
      }, 600); // Wait for ripple
    } else if (step === STEPS.CCCD_BACK) {
      console.log('✅ [XacThucKYC] Lưu ảnh mặt sau CCCD');
      setImages(prev => {
        const newState = { ...prev, cccdBack: imageSrc };
        console.log('📸 [XacThucKYC] State updated - cccdBack:', newState.cccdBack ? 'có ảnh' : 'null');
        console.log('📸 [XacThucKYC] State updated - cccdFront:', newState.cccdFront ? 'có ảnh' : 'null');
        // Đảm bảo cccdFront không bị ghi đè
        if (!newState.cccdFront) {
          console.error('❌ [XacThucKYC] CẢNH BÁO: cccdFront bị mất!');
        }
        return newState;
      });
      triggerRipple();
      setTimeout(() => {
        setStep(STEPS.SELFIE);
        setInputMethod('camera');
      }, 600);
    } else if (step === STEPS.SELFIE) {
      console.log('✅ [XacThucKYC] Lưu ảnh selfie');
      setImages(prev => {
        const newState = { ...prev, selfie: imageSrc };
        console.log('📸 [XacThucKYC] State updated - selfie:', newState.selfie ? 'có ảnh' : 'null');
        console.log('📸 [XacThucKYC] State updated - cccdFront:', newState.cccdFront ? 'có ảnh' : 'null');
        console.log('📸 [XacThucKYC] State updated - cccdBack:', newState.cccdBack ? 'có ảnh' : 'null');
        
        // Kiểm tra lại trước khi process
        if (!newState.cccdFront) {
          console.error('❌ [XacThucKYC] LỖI: Không có ảnh mặt trước!');
          setError('Không tìm thấy ảnh mặt trước CCCD. Vui lòng chụp lại từ đầu.');
          setStep(STEPS.FAILURE);
          return prev; // Không update state
        }
        
        // Gọi processKYC với state mới nhất để đảm bảo dùng đúng ảnh
        setTimeout(() => {
          setStep(STEPS.PROCESSING);
          // Sử dụng newState thay vì images từ closure
          processKYCWithState(newState, imageSrc);
        }, 600);
        
        return newState;
      });
      triggerRipple();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageSrc = reader.result;

      // Nếu đang ở bước CCCD, crop ảnh về tỷ lệ chuẩn ID card (1.586:1)
      if (step === STEPS.CCCD_FRONT || step === STEPS.CCCD_BACK) {
        try {
          const img = new Image();
          img.src = imageSrc;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const cardAspectRatio = 1.586; // 85.6mm / 54mm
          const imgAspectRatio = img.width / img.height;

          let cropWidth, cropHeight, cropX, cropY;

          if (imgAspectRatio > cardAspectRatio) {
            // Ảnh rộng hơn - crop theo chiều ngang
            cropHeight = img.height;
            cropWidth = cropHeight * cardAspectRatio;
            cropX = (img.width - cropWidth) / 2;
            cropY = 0;
          } else {
            // Ảnh cao hơn - crop theo chiều dọc
            cropWidth = img.width;
            cropHeight = cropWidth / cardAspectRatio;
            cropX = 0;
            cropY = (img.height - cropHeight) / 2;
          }

          canvas.width = cropWidth;
          canvas.height = cropHeight;

          ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          const croppedImage = canvas.toDataURL('image/jpeg', 1.0);
          handleCapture(croppedImage);
        } catch (err) {
          console.warn('Crop failed, using original:', err);
          handleCapture(imageSrc);
        }
      } else {
        handleCapture(imageSrc);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function để process KYC với state cụ thể
  const processKYCWithState = async (currentImages, selfieSrc) => {
    try {
      console.log('🚀 Bắt đầu xử lý KYC Optimized...');
      console.log('📸 [processKYC] Kiểm tra ảnh trong state:');
      console.log('   - cccdFront:', currentImages.cccdFront ? `có ảnh (${currentImages.cccdFront.substring(0, 50)}...)` : 'NULL');
      console.log('   - cccdBack:', currentImages.cccdBack ? `có ảnh (${currentImages.cccdBack.substring(0, 50)}...)` : 'NULL');
      console.log('   - selfie:', selfieSrc ? `có ảnh (${selfieSrc.substring(0, 50)}...)` : 'NULL');
      
      // Kiểm tra ảnh mặt trước có tồn tại không
      if (!currentImages.cccdFront) {
        throw new Error('Không tìm thấy ảnh mặt trước CCCD. Vui lòng chụp lại.');
      }
      
      setProcessingStatus('Đang khởi tạo...');
      const currentOcrRoi = roiConfig.ocr || OCRServiceV2.CCCD_ROI;
      const baseQrRegions = roiConfig.qr
        ? Object.entries(roiConfig.qr).map(([name, roi]) => ({ name, ...roi }))
        : [];
      const qrSlot = currentOcrRoi.qrCode || OCRServiceV2.CCCD_ROI.qrCode;
      const currentQrRegions = qrSlot
        ? [{ name: 'slot', ...qrSlot }, ...baseQrRegions]
        : baseQrRegions;

      // BƯỚC 1: Warping & Preprocessing
      setProcessingStatus('Đang xử lý ảnh CCCD (Warping)...');
      console.log('📐 BƯỚC 1: Warp Perspective CCCD...');
      console.log('📸 [processKYC] Sử dụng ảnh mặt trước:', currentImages.cccdFront.substring(0, 50) + '...');
      // Note: OCRServiceV2.recognizeAll now handles warping internally and returns the warped image

      // BƯỚC 2: OCR Processing
      setProcessingStatus('Đang đọc thông tin (OCR)...');
      console.log('🔤 BƯỚC 2: OCR mặt trước CCCD...');
      const parsedOCRData = await OCRServiceV2.recognizeAll(currentImages.cccdFront, currentOcrRoi);
      setOcrData(parsedOCRData);

      const warpedCCCD = parsedOCRData.warpedImage || currentImages.cccdFront;

      // BƯỚC 3: QR Code Scanning
      setProcessingStatus('Đang quét mã QR...');
      console.log('📱 BƯỚC 3: Quét QR code...');
      const qrResult = await QRCodeService.scanFromImage(warpedCCCD, currentQrRegions);
      setQrData(qrResult);

      // BƯỚC 4: Face Matching (with Cropping)
      setProcessingStatus('Đang so khớp khuôn mặt...');
      console.log('👤 BƯỚC 4: So khớp khuôn mặt...');

      // Crop face from CCCD using ROI - SỬ DỤNG ẢNH GỐC (không enhance) để giữ màu sắc tự nhiên
      // parsedOCRData.warpedImage là ảnh đã warp TRƯỚC KHI apply Xiaomi Style
      const warpedOriginal = parsedOCRData.warpedImage || currentImages.cccdFront;
      let cardFaceImage = warpedOriginal;
      let isPreCroppedFace = false;
      
      try {
        console.log('   Cropping face from card (ROI)...');
        const faceRoi = currentOcrRoi.faceImage || OCRServiceV2.CCCD_ROI.faceImage;
        cardFaceImage = await OCRServiceV2.cropROI(warpedOriginal, faceRoi);
        isPreCroppedFace = true; // Đánh dấu đây là ảnh đã crop sẵn face
        console.log('   ✅ Face cropped successfully');
      } catch (e) {
        console.warn('   Face cropping failed, using full image:', e);
      }

      const img1 = await createImage(cardFaceImage);
      const img2 = await createImage(selfieSrc);
      
      console.log(`   Card face image: ${img1.width}x${img1.height}, isPreCropped: ${isPreCroppedFace}`);
      console.log(`   Selfie image: ${img2.width}x${img2.height}`);

      let matchResult = { distance: 1, similarity: 0, match: false, note: 'fallback_face_not_found' };
      try {
        matchResult = await FaceMatchingService.compareFaces(img1, img2, { 
          image1IsPreCropped: isPreCroppedFace 
        });
        console.log(`✅ Face matching: Distance ${matchResult.distance.toFixed(2)} (Sim ${(matchResult.similarity * 100).toFixed(1)}%)`);
      } catch (faceErr) {
        console.warn('⚠️ Face matching failed, using fallback score', faceErr);
      }
      setFaceMatchResult(matchResult);

      // BƯỚC 5: Merge & Risk Scoring
      setProcessingStatus('Đang đánh giá rủi ro...');
      console.log('🔀 BƯỚC 5: Merge & Risk Scoring...');
      const merged = QRCodeService.mergeAndValidate(
        qrResult.success ? qrResult.data : null,
        parsedOCRData,
        matchResult.distance
      );
      setMergedData(merged);

      console.log('🎉 Xử lý KYC hoàn tất!', merged);
      setStep(STEPS.PREVIEW);

    } catch (err) {
      console.error('❌ Lỗi xử lý KYC:', err);
      setError(err.message || 'Lỗi xử lý hình ảnh');
      setStep(STEPS.FAILURE);
    }
  };

  const createImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Resize ảnh xuống 800px trước khi gửi lên server để tiết kiệm storage
      const resizedFront = await ImageResizeService.resizeForStorage(images.cccdFront, 800, 0.85);
      const resizedBack = await ImageResizeService.resizeForStorage(images.cccdBack, 800, 0.85);
      const resizedSelfie = await ImageResizeService.resizeForStorage(images.selfie, 800, 0.85);

      const frontBlob = await (await fetch(resizedFront)).blob();
      const backBlob = await (await fetch(resizedBack)).blob();
      const selfieBlob = await (await fetch(resizedSelfie)).blob();

      formData.append('cccdFront', frontBlob, 'front.jpg');
      formData.append('cccdBack', backBlob, 'back.jpg');
      formData.append('selfie', selfieBlob, 'selfie.jpg');

      // Format ngày: "11/11/2003" -> "2003-11-11"
      const formatDateForDB = (dateStr) => {
        if (!dateStr) return '';
        // Nếu đã là format YYYY-MM-DD thì giữ nguyên
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Nếu là DD/MM/YYYY thì convert
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
      };

      formData.append('soCCCD', mergedData?.finalData?.soCCCD || '');
      formData.append('tenDayDu', mergedData?.finalData?.tenDayDu || '');
      formData.append('ngaySinh', formatDateForDB(mergedData?.finalData?.ngaySinh || ''));
      formData.append('diaChi', mergedData?.finalData?.diaChi || '');
      formData.append('ngayCapCCCD', formatDateForDB(mergedData?.finalData?.ngayCap || ''));

      // Tính toán trạng thái KYC dựa trên confidence và face similarity
      // Làm tròn confidence giống cách giao diện hiển thị: (confidence * 100).toFixed(0)
      const soCCCDConfidence = mergedData?.confidence?.soCCCD ?? 0;
      const tenDayDuConfidence = mergedData?.confidence?.tenDayDu ?? 0;
      const faceSimilarity = faceMatchResult?.similarity ?? 0;
      
      // Làm tròn để đồng bộ với UI - 0.995 -> 100%, 0.994 -> 99%
      const soCCCDPercent = Math.round(soCCCDConfidence * 100);
      const tenDayDuPercent = Math.round(tenDayDuConfidence * 100);
      const faceSimPercent = Math.round(faceSimilarity * 100);
      
      // Logic xác định trạng thái KYC (dựa trên % đã làm tròn như UI hiển thị):
      // - ThanhCong: soCCCD = 100% VÀ tenDayDu = 100% VÀ faceSim > 50%
      // - ThatBai: soCCCD < 100% VÀ tenDayDu < 100% VÀ faceSim <= 50%
      // - CanXemLai: (soCCCD = 100% VÀ tenDayDu = 100%) HOẶC faceSim > 50%
      const isCCCDPerfect = soCCCDPercent >= 100;
      const isTenPerfect = tenDayDuPercent >= 100;
      const isFaceGood = faceSimPercent > 50;
      
      let trangThaiKYC;
      if (isCCCDPerfect && isTenPerfect && isFaceGood) {
        trangThaiKYC = 'ThanhCong';
      } else if (!isCCCDPerfect && !isTenPerfect && !isFaceGood) {
        trangThaiKYC = 'ThatBai';
      } else {
        // (isCCCDPerfect && isTenPerfect) || isFaceGood -> CanXemLai
        trangThaiKYC = 'CanXemLai';
      }
      
      console.log('📊 [KYC] Tính toán trạng thái:', {
        soCCCDConfidence,
        tenDayDuConfidence, 
        faceSimilarity,
        soCCCDPercent: soCCCDPercent + '%',
        tenDayDuPercent: tenDayDuPercent + '%',
        faceSimPercent: faceSimPercent + '%',
        isCCCDPerfect,
        isTenPerfect,
        isFaceGood,
        trangThaiKYC
      });

      // Send both similarity and risk score
      formData.append('faceSimilarity', faceSimilarity.toString());
      formData.append('riskScore', (mergedData?.riskScore ?? 0).toString());
      formData.append('riskLevel', mergedData?.riskLevel || 'UNKNOWN');
      formData.append('trangThaiKYC', trangThaiKYC);

      console.log('📤 [KYC] Submitting data:', Object.fromEntries(formData));

      await KYCService.xacThuc(formData);
      
      // Cập nhật localStorage với trạng thái KYC mới
      // Để Navigation và các trang khác biết user đã xác minh
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser) {
          // Map trạng thái KYC sang TrangThaiXacMinh
          let newTrangThaiXacMinh = 'ChuaXacMinh';
          if (trangThaiKYC === 'ThanhCong') {
            newTrangThaiXacMinh = 'DaXacMinh';
          } else if (trangThaiKYC === 'CanXemLai') {
            newTrangThaiXacMinh = 'ChoDuyet';
          }
          // ThatBai vẫn giữ ChuaXacMinh
          
          storedUser.TrangThaiXacMinh = newTrangThaiXacMinh;
          localStorage.setItem('user', JSON.stringify(storedUser));
          
          // Dispatch custom event để các component khác biết (cùng tab)
          window.dispatchEvent(new Event('kyc-updated'));
          
          console.log('✅ [KYC] Updated localStorage TrangThaiXacMinh:', newTrangThaiXacMinh);
        }
      } catch (e) {
        console.warn('⚠️ [KYC] Could not update localStorage:', e);
      }
      
      triggerRipple();
      setStep(STEPS.SUCCESS);
    } catch (err) {
      console.error('❌ [KYC] Submit error:', err);
      setError(err.response?.data?.message || 'Gửi dữ liệu thất bại');
      setStep(STEPS.FAILURE);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug vision data - LUÔN dùng ảnh mặt trước, không dùng ảnh mặt sau
  // Ưu tiên hiển thị ảnh đã enhance (Xiaomi Style) để debug ROI chính xác hơn
  // Fallback về warpedImage rồi ảnh gốc nếu không có enhanced
  const visionImage = ocrData?.warpedEnhanced || ocrData?.warpedImage || images.cccdFront;
  
  // Đảm bảo visionImage không phải là ảnh mặt sau
  // Nếu ocrData có warpedImage, nó đã được tạo từ cccdFront trong processKYC
  // Nếu không có, fallback về cccdFront (luôn là mặt trước)
  const ocrBoxes = [
    { key: 'soCCCD', label: 'OCR: Số', roi: roiConfig.ocr.soCCCD },
    { key: 'tenDayDu', label: 'OCR: Họ tên', roi: roiConfig.ocr.tenDayDu },
    { key: 'ngaySinh', label: 'OCR: Ngày sinh', roi: roiConfig.ocr.ngaySinh },
    { key: 'gioiTinh', label: 'OCR: Giới tính', roi: roiConfig.ocr.gioiTinh },
    { key: 'diaChi', label: 'OCR: Địa chỉ', roi: roiConfig.ocr.diaChi },
    { key: 'faceImage', label: 'OCR: Face ROI', roi: roiConfig.ocr.faceImage },
    { key: 'qrCode', label: 'OCR: QR slot', roi: roiConfig.ocr.qrCode },
  ];

  const qrRegions = [
    { key: 'full', label: 'QR full', roi: roiConfig.qr.full },
    { key: 'trl', label: 'QR top-right large', roi: roiConfig.qr.trl },
    { key: 'trm', label: 'QR top-right medium', roi: roiConfig.qr.trm },
    { key: 'trs', label: 'QR top-right small', roi: roiConfig.qr.trs },
    { key: 'tc', label: 'QR top-center', roi: roiConfig.qr.tc },
  ];

  const visionBoxes = [
    ...ocrBoxes.map(b => ({ ...b, type: 'ocr' })),
    ...qrRegions.map(b => ({ ...b, type: 'qr' }))
  ];

  const boxStyle = (roi) => ({
    left: `${roi.x * 100}%`,
    top: `${roi.y * 100}%`,
    width: `${roi.width * 100}%`,
    height: `${roi.height * 100}%`
  });

  const updateRoi = (type, key, roi) => {
    setRoiConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: roi
      }
    }));
  };

  const startDrag = (box, mode, e) => {
    if (!visionRef.current) return;
    e.preventDefault();
    const rect = visionRef.current.getBoundingClientRect();
    setDragState({
      type: mode, // 'move' | 'resize'
      boxType: box.type,
      key: box.key,
      startX: e.clientX,
      startY: e.clientY,
      rect,
      roi: { ...box.roi }
    });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragState || !visionRef.current) return;
      const { rect, roi, type, boxType, key, startX, startY } = dragState;
      const dx = (e.clientX - startX) / rect.width;
      const dy = (e.clientY - startY) / rect.height;

      if (type === 'move') {
        const newRoi = {
          ...roi,
          x: Math.min(Math.max(roi.x + dx, 0), 1 - roi.width),
          y: Math.min(Math.max(roi.y + dy, 0), 1 - roi.height)
        };
        updateRoi(boxType, key, newRoi);
      } else if (type === 'resize') {
        const newRoi = {
          ...roi,
          width: Math.min(Math.max(roi.width + dx, 0.02), 1 - roi.x),
          height: Math.min(Math.max(roi.height + dy, 0.02), 1 - roi.y)
        };
        updateRoi(boxType, key, newRoi);
      }
    };

    const handleUp = () => setDragState(null);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragState]);

  const copyRoiJson = async () => {
    const payload = {
      ocr: roiConfig.ocr,
      qrRegions: roiConfig.qr
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert('Đã copy ROI JSON vào clipboard');
    } catch (err) {
      console.log(text);
      alert('Không copy được clipboard, đã log JSON trong console.');
    }
  };

  return (
    <div className="kyc-page">
      {/* Global Ripple Effect */}
      {ripple.active && (
        <motion.div
          className="ripple-effect"
          initial={{ scale: 0, opacity: 0.8, x: "-50%", y: "-50%" }}
          animate={{ scale: 4, opacity: 0, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      )}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

      <div className="kyc-container">
        <AnimatePresence mode="wait">
          {step === STEPS.INTRO && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="kyc-step intro"
            >
              <h1>Xác thực danh tính (eKYC)</h1>
              <p>Vui lòng chuẩn bị CCCD và chụp ảnh chân dung để xác thực tài khoản.</p>
              <button className="btn-primary" onClick={() => setStep(STEPS.CCCD_FRONT)}>
                Bắt đầu ngay
              </button>
            </motion.div>
          )}

          {(step === STEPS.CCCD_FRONT || step === STEPS.CCCD_BACK) && (
            <motion.div key="capture" className="kyc-step">
              <div className="input-method-toggle">
                <button
                  className={`toggle-btn ${inputMethod === 'camera' ? 'active' : ''}`}
                  onClick={() => setInputMethod('camera')}
                >
                  <FiCamera /> Chụp ảnh
                </button>
                <button
                  className={`toggle-btn ${inputMethod === 'upload' ? 'active' : ''}`}
                  onClick={() => setInputMethod('upload')}
                >
                  <FiUpload /> Tải ảnh lên
                </button>
              </div>

              {inputMethod === 'camera' ? (
                <CameraCapture
                  key={`cccd-${step}`} // Force remount khi step thay đổi để reset state
                  label={step === STEPS.CCCD_FRONT ? "Chụp mặt trước CCCD" : "Chụp mặt sau CCCD"}
                  onCapture={handleCapture}
                  overlayType="card"
                  autoCapture={true}
                />
              ) : (
                <div className="upload-container">
                  <div className="upload-box">
                    <FiUpload className="upload-icon" />
                    <p>Chọn ảnh {step === STEPS.CCCD_FRONT ? "mặt trước" : "mặt sau"} CCCD</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      id="cccd-upload"
                    />
                    <label htmlFor="cccd-upload" className="btn-primary">Chọn ảnh</label>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === STEPS.SELFIE && (
            <motion.div key="selfie" className="kyc-step">
              <CameraCapture
                label="Chụp ảnh chân dung"
                onCapture={handleCapture}
                overlayType="face"
                autoCapture={true}
              />
            </motion.div>
          )}

          {step === STEPS.PROCESSING && (
            <motion.div key="processing" className="kyc-step processing">
              <div className="spinner"></div>
              <p>{processingStatus}</p>
            </motion.div>
          )}

          {step === STEPS.PREVIEW && (
            <motion.div key="preview" className="kyc-step preview">
              <h2>Kết quả xác thực</h2>

              {/* Risk Score Badge */}
              {mergedData && (
                <div className={`risk-badge ${mergedData.riskLevel}`}>
                  <div className="risk-score">
                    Risk Score: <span className="value">{mergedData.riskScore.toFixed(2)}</span>
                  </div>
                  <div className="risk-decision">
                    {mergedData.riskLevel === 'AUTO_APPROVE' && '✅ Đủ điều kiện duyệt tự động'}
                    {mergedData.riskLevel === 'MANUAL_REVIEW' && '⚠️ Cần xem xét thủ công'}
                    {mergedData.riskLevel === 'REJECT' && '❌ Không đạt yêu cầu'}
                  </div>
                </div>
              )}

              <div className="preview-content">
                <div className="preview-images">
                  <div className="image-preview">
                    <label>Mặt trước CCCD</label>
                    <img src={images.cccdFront} alt="Front" />
                  </div>
                  {images.cccdBack && (
                    <div className="image-preview">
                      <label>Mặt sau CCCD</label>
                      <img src={images.cccdBack} alt="Back" />
                    </div>
                  )}
                  <div className="image-preview">
                    <label>Ảnh chân dung</label>
                    <img src={images.selfie} alt="Selfie" />
                  </div>
                  {visionImage && (
                    <div className="image-preview debug-vision-card">
                      <div className="vision-header">
                        <label>🛰️ Debug Vision (OCR + QR)</label>
                        <button
                          className="vision-toggle"
                          onClick={() => setShowVision(!showVision)}
                        >
                          {showVision ? 'Ẩn' : 'Hiện'}
                        </button>
                        <button className="vision-toggle secondary" onClick={copyRoiJson}>
                          Copy ROI JSON
                        </button>
                      </div>
                      {showVision && (
                        <div className="vision-body">
                          <div
                            className="vision-overlay"
                            style={{ backgroundImage: `url(${visionImage})` }}
                            ref={visionRef}
                          >
                            {visionBoxes.map(box => (
                              <div
                                key={`${box.type}-${box.key}`}
                                className={`vision-box ${box.type}`}
                                style={boxStyle(box.roi)}
                                title={box.label}
                                onMouseDown={(e) => startDrag(box, 'move', e)}
                              >
                                <span>{box.label}</span>
                                <div
                                  className="resize-handle"
                                  onMouseDown={(e) => startDrag(box, 'resize', e)}
                                ></div>
                              </div>
                            ))}
                          </div>
                          <div className="vision-legend">
                            <div className="legend-row"><span className="legend-dot ocr"></span> OCR ROIs</div>
                            <div className="legend-row"><span className="legend-dot qr"></span> QR regions</div>
                            <div className="legend-note">Ảnh dùng: warped nếu có, fallback ảnh gốc.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="preview-data">
                  {/* Merged Data */}
                  <div className="data-section merged">
                    <h3>📋 Thông tin trích xuất</h3>
                    {['soCCCD', 'tenDayDu', 'ngaySinh', 'gioiTinh', 'diaChi'].map(field => {
                      const value = mergedData?.finalData?.[field] ?? 'N/A';
                      const confidence = mergedData?.confidence?.[field] ?? 0;
                      return (
                        <div className="data-row" key={field}>
                          <span className="label">{field}:</span>
                          <span className="value">{value}</span>
                          <span className={`confidence ${confidence >= 0.9 ? 'high' : 'medium'}`}>
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Face Match */}
                  <div className="data-section verification-status">
                    <h3>👤 So khớp khuôn mặt</h3>
                    <div className="similarity-meter">
                      <div className="similarity-label">
                        Distance: {faceMatchResult?.distance.toFixed(3)}
                        (Sim: {(faceMatchResult?.similarity * 100).toFixed(1)}%)
                      </div>
                      <div className="similarity-bar">
                        <div
                          className="similarity-fill"
                          style={{
                            width: `${faceMatchResult?.similarity * 100}%`,
                            backgroundColor: faceMatchResult?.distance <= 0.45 ? '#10b981' :
                              faceMatchResult?.distance <= 0.6 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Conflicts - Đã ẩn theo yêu cầu */}
                  {/* {mergedData?.conflicts?.length > 0 && (
                    <div className="conflicts-warning">
                      <strong>⚠️ Xung đột dữ liệu ({mergedData.conflicts.length})</strong>
                      <ul>
                        {mergedData.conflicts.map((c, idx) => (
                          <li key={idx}>
                            {c.field}: QR="{c.qr}" vs OCR="{c.ocr}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                </div>
              </div>

              <div className="actions">
                <button className="btn-secondary" onClick={() => setStep(STEPS.INTRO)} disabled={isSubmitting}>Làm lại</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Xác nhận gửi'}
                </button>
              </div>
            </motion.div>
          )}

          {step === STEPS.SUCCESS && (
            <motion.div key="success" className="kyc-step success">
              <div className="success-icon">✅</div>
              <h2>Gửi hồ sơ thành công!</h2>
              <p>Hệ thống đang xử lý hồ sơ của bạn.</p>
            </motion.div>
          )}

          {step === STEPS.FAILURE && (
            <motion.div key="failure" className="kyc-step failure">
              <h2>Xác thực thất bại</h2>
              <p>{error}</p>
              <button className="btn-primary" onClick={() => setStep(STEPS.INTRO)}>Thử lại</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default XacThucKYC;
