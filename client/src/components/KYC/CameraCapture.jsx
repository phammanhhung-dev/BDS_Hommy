import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './CameraCapture.css';
import { motion, AnimatePresence } from 'framer-motion';
import CardDetectionService from '../../services/CardDetectionService';
import FaceAlignmentService from '../../services/FaceAlignmentService';

/**
 * CameraCapture - Component chụp ảnh KYC với resolution cao cố định
 * 
 * Resolution: Ưu tiên 4K (3840x2160), fallback 1080p minimum
 * - Camera chạy ở resolution cao từ đầu để capture được ảnh chất lượng
 * - Detection vẫn nhanh vì chỉ cần video element, không cần full resolution
 * - Không switch resolution giữa chừng để tránh camera restart/flicker
 */
const CameraCapture = ({ onCapture, label, overlayType = 'card', autoCapture = false }) => {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" (front) or "environment" (back)
  const [isAligned, setIsAligned] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [alignmentStatus, setAlignmentStatus] = useState('Đang khởi động...');
  const [confidence, setConfidence] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false); // Flag để ngăn chụp nhiều lần
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const alignmentTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const consecutiveAlignedFrames = useRef(0);
  const streamRef = useRef(null);

  /**
   * CẤU HÌNH ĐỘ PHÂN GIẢI:
   * Ưu tiên 4K (3840x2160), fallback 1080p minimum
   * Chạy resolution cao từ đầu, không switch giữa chừng
   */
  const VIDEO_RESOLUTION = { 
    width: { ideal: 3840, min: 1920 }, 
    height: { ideal: 2160, min: 1080 } 
  };

  // Cấu hình video constraints - resolution cao cố định
  const videoConstraints = {
    width: VIDEO_RESOLUTION.width,
    height: VIDEO_RESOLUTION.height,
    facingMode: facingMode,
    aspectRatio: { ideal: 16 / 9 },
    // Hỗ trợ flash/torch trên mobile khi dùng camera sau
    ...(flashEnabled && facingMode === 'environment' && {
      advanced: [{ torch: true }]
    })
  };

  // Kiểm tra hỗ trợ flash khi stream được tạo
  const checkFlashSupport = (stream) => {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        setFlashSupported(false);
        return;
      }

      // Kiểm tra capabilities
      if ('getCapabilities' in videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.torch !== undefined) {
          setFlashSupported(true);
          console.log('✅ [CameraCapture] Flash được hỗ trợ');
          return;
        }
      }

      setFlashSupported(false);
      console.log('ℹ️ [CameraCapture] Flash không được hỗ trợ');
    } catch (error) {
      console.log('⚠️ [CameraCapture] Không thể kiểm tra hỗ trợ flash:', error);
      setFlashSupported(false);
    }
  };

  // Callback khi stream được tạo - dùng để kiểm tra và điều khiển flash
  const handleUserMedia = (stream) => {
    streamRef.current = stream;
    
    // Chỉ kiểm tra flash support khi dùng camera sau
    if (facingMode === 'environment') {
      checkFlashSupport(stream);
      
      // Nếu flash đã được bật trước đó, áp dụng ngay
      if (flashEnabled) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && 'applyConstraints' in videoTrack) {
          videoTrack.applyConstraints({
            advanced: [{ torch: true }]
          }).catch(err => {
            console.warn('⚠️ [CameraCapture] Không thể bật flash:', err);
          });
        }
      }
    } else {
      setFlashSupported(false);
    }
  };

  // Điều khiển flash khi state thay đổi
  useEffect(() => {
    const controlFlash = async () => {
      if (!streamRef.current) return;
      
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      try {
        // Kiểm tra capabilities trước
        if ('getCapabilities' in videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.torch === undefined) {
            console.log('ℹ️ [CameraCapture] Camera không hỗ trợ torch');
            return;
          }
        }

        // Áp dụng constraints để bật/tắt torch
        if ('applyConstraints' in videoTrack) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: flashEnabled }]
          });
          console.log(`✅ [CameraCapture] Flash ${flashEnabled ? 'đã bật' : 'đã tắt'}`);
        }
      } catch (error) {
        console.warn('⚠️ [CameraCapture] Không thể điều khiển flash:', error);
      }
    };

    // Chỉ điều khiển flash khi camera sau, đã hỗ trợ flash và có stream
    if (facingMode === 'environment' && flashSupported && streamRef.current) {
      controlFlash();
    }
  }, [flashEnabled, facingMode, flashSupported]);

  // Reset flash khi chuyển camera
  useEffect(() => {
    if (facingMode === 'user') {
      setFlashEnabled(false);
      setFlashSupported(false);
    }
  }, [facingMode]);

  // Load face detection models nếu là selfie
  useEffect(() => {
    if (overlayType === 'face' && autoCapture) {
      FaceAlignmentService.loadModels('/models')
        .then(loaded => {
          setModelsLoaded(loaded);
          if (loaded) {
            setAlignmentStatus('✓ Sẵn sàng - Nhìn vào camera');
          } else {
            setAlignmentStatus('❌ Lỗi tải models');
          }
        });
    }
  }, [overlayType, autoCapture]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (alignmentTimerRef.current) clearTimeout(alignmentTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  // Reset state khi component mount hoặc khi label thay đổi (step thay đổi)
  useEffect(() => {
    console.log(`🔄 [CameraCapture] Reset state - label: ${label}`);
    setHasCaptured(false);
    setIsAligned(false);
    setCountdown(null);
    consecutiveAlignedFrames.current = 0;
    // Clear all timers
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, [label]); // Reset khi label thay đổi (tức là step thay đổi)

  // Real-time detection loop
  useEffect(() => {
    if (!autoCapture || !webcamRef.current || hasCaptured) return; // Không chạy nếu đã chụp

    const checkAlignment = async () => {
      // Ngăn chụp nếu đã chụp rồi
      if (hasCaptured) {
        return;
      }

      const video = webcamRef.current?.video;

      // Safety check: Ensure video is ready and has dimensions
      if (!video || video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
        setIsAligned(false);
        setAlignmentStatus('⊙ Đang chờ camera...');
        setConfidence(0);
        return;
      }

      let result;

      try {
        if (overlayType === 'card') {
          // CCCD detection using edge detection
          result = await CardDetectionService.analyzeFrame(video);
        } else if (overlayType === 'face') {
          // Face detection using face-api.js
          if (!modelsLoaded) {
            setAlignmentStatus('⏳ Đang tải AI models...');
            return;
          }
          // Additional safety check for face detection to prevent Box.constructor error
          if (video.videoWidth === 0 || video.videoHeight === 0) return;

          result = await FaceAlignmentService.analyzeFace(video);
        } else {
          // Fallback - simple readiness check
          result = {
            aligned: video.videoWidth > 0 && video.videoHeight > 0,
            confidence: 1,
            reason: 'Sẵn sàng chụp'
          };
        }

        setConfidence(result.confidence);
        setAlignmentStatus(result.reason);

        // Yêu cầu 3 frames liên tiếp aligned để tránh false positive
        if (result.aligned && !hasCaptured) {
          consecutiveAlignedFrames.current += 1;

          if (consecutiveAlignedFrames.current >= 3) {
            setIsAligned(true);

            // Chỉ start countdown 1 lần và nếu chưa chụp
            if (!countdownIntervalRef.current && countdown === null && !hasCaptured) {
              startCountdown();
            }
          }
        } else {
          consecutiveAlignedFrames.current = 0;
          setIsAligned(false);

          // Cancel countdown nếu user di chuyển
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdown(null);
          }
        }
      } catch (error) {
        console.error('Detection error:', error);
        // Don't show error to user immediately to avoid flickering, just retry
        setIsAligned(false);
      }
    };

    // Run detection every 200ms (5 FPS - balance between responsiveness and performance)
    detectionIntervalRef.current = setInterval(checkAlignment, 200);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [autoCapture, overlayType, modelsLoaded, countdown, hasCaptured]);

  const startCountdown = () => {
    // Clear existing timers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Camera đã chạy ở resolution cao từ đầu, không cần switch
    let count = 3;
    setCountdown(count);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        // Capture ngay, không cần đợi vì resolution đã cao sẵn
        capture();
      }
    }, 1000);
  };

  const capture = useCallback(async () => {
    // Ngăn chụp nhiều lần
    if (hasCaptured) {
      console.log('⚠️ [CameraCapture] Đã chụp rồi, bỏ qua capture request');
      return;
    }

    console.log(`📸 [CameraCapture] Bắt đầu capture - overlayType: ${overlayType}, label: ${label}`);
    setHasCaptured(true); // Đánh dấu đã chụp ngay lập tức
    
    // Dừng tất cả detection và countdown
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      console.warn('⚠️ [CameraCapture] Không lấy được screenshot');
      setHasCaptured(false); // Reset nếu lỗi
      return;
    }

    // Log kích thước ảnh capture được
    const tempImg = new Image();
    tempImg.src = imageSrc;
    tempImg.onload = () => {
      console.log(`📐 [CameraCapture] Captured image resolution: ${tempImg.width}x${tempImg.height}`);
    };

    // Nếu là card capture, crop ảnh theo vùng overlay (tỷ lệ 1.586:1)
    if (overlayType === 'card') {
      try {
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Overlay chiếm 85% width, aspect-ratio 1.586:1
        const overlayWidthRatio = 0.85;
        const cardAspectRatio = 1.586;

        // Tính toán vùng crop từ ảnh gốc
        const cropWidth = img.width * overlayWidthRatio;
        const cropHeight = cropWidth / cardAspectRatio;
        const cropX = (img.width - cropWidth) / 2;
        const cropY = (img.height - cropHeight) / 2;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,  // source
          0, 0, cropWidth, cropHeight            // destination
        );

        const croppedImage = canvas.toDataURL('image/jpeg', 1.0);
        console.log(`✅ [CameraCapture] Đã crop ảnh card - size: ${canvas.width}x${canvas.height} (from ${img.width}x${img.height})`);
        onCapture(croppedImage);
      } catch (e) {
        console.warn('⚠️ [CameraCapture] Crop failed, using original:', e);
        onCapture(imageSrc);
      }
    } else {
      // Face capture - giữ nguyên
      console.log(`✅ [CameraCapture] Đã capture ảnh face`);
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture, overlayType, hasCaptured, label]);

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setIsAligned(false);
    setCountdown(null);
    consecutiveAlignedFrames.current = 0;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  return (
    <div className={`camera-container ${overlayType === 'face' ? 'fullscreen' : ''}`}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        screenshotQuality={1.0}
        videoConstraints={videoConstraints}
        className="webcam-video"
        forceScreenshotSourceSize={true}
        onUserMedia={handleUserMedia}
      />

      {/* Overlay Frame */}
      <div className={`overlay-frame ${overlayType} ${isAligned ? 'aligned' : ''}`}>
        <motion.div
          className="scanning-border"
          animate={{
            scale: [1, 1.02, 1],
            opacity: isAligned ? [0.9, 1, 0.9] : [0.5, 0.7, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Corner guides */}
        {overlayType === 'card' && (
          <>
            <div className="corner-guide top-left"></div>
            <div className="corner-guide top-right"></div>
            <div className="corner-guide bottom-left"></div>
            <div className="corner-guide bottom-right"></div>
          </>
        )}
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="countdown-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            key={countdown}
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status indicator */}
      {autoCapture && (
        <div className={`alignment-status ${isAligned ? 'aligned' : 'searching'}`}>
          <div className="status-text">{alignmentStatus}</div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${confidence * 100}%`,
                backgroundColor: confidence >= 0.75 ? '#10b981' : confidence >= 0.5 ? '#f59e0b' : '#ef4444'
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="camera-controls">
        <p className="camera-instruction">{label}</p>
        <div className="controls-row">
          {/* Nút chuyển camera - Luôn hiển thị */}
          <button
            onClick={switchCamera}
            className="switch-camera-btn"
            title={`Đổi sang camera ${facingMode === 'user' ? 'sau' : 'trước'}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Camera body */}
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              {/* Rotating arrows */}
              <path d="M14.5 10.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2" className="arrow-path" />
              <path d="M9.5 13.5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2" className="arrow-path" />
              {/* Arrow tips */}
              <path d="M12 15l1.5-1.5L12 12" className="arrow-tip" />
              <path d="M12 9l-1.5 1.5L12 12" className="arrow-tip" />
            </svg>
            <span className="switch-label">{facingMode === 'user' ? 'Trước' : 'Sau'}</span>
          </button>

          {/* Nút bật/tắt flash - Chỉ hiện khi camera sau và hỗ trợ flash */}
          {facingMode === 'environment' && flashSupported && (
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className={`flash-btn ${flashEnabled ? 'active' : ''}`}
              title={flashEnabled ? 'Tắt flash' : 'Bật flash'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={flashEnabled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6h-1a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" />
                <path d="M6 3h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" />
                <line x1="6" y1="1" x2="6" y2="3" />
                <line x1="10" y1="1" x2="10" y2="3" />
                <line x1="14" y1="1" x2="14" y2="3" />
                <line x1="18" y1="1" x2="18" y2="3" />
                <line x1="6" y1="21" x2="6" y2="23" />
                <line x1="10" y1="21" x2="10" y2="23" />
                <line x1="14" y1="21" x2="14" y2="23" />
                <line x1="18" y1="21" x2="18" y2="23" />
              </svg>
              <span className="flash-label">{flashEnabled ? 'Tắt' : 'Bật'}</span>
            </button>
          )}

          {/* Nút chụp - Chỉ hiện khi không auto-capture */}
          {!autoCapture && (
            <button onClick={capture} className="capture-btn">
              <div className="capture-btn-inner"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
