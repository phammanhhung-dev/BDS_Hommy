/**
 * Hook để phát âm thanh thông báo
 * Sử dụng Web Audio API để tạo âm thanh programmatically (không cần file)
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Tạo âm thanh bằng Web Audio API
 * @param {AudioContext} audioContext - Audio context
 * @param {number} frequency - Tần số (Hz)
 * @param {number} duration - Thời lượng (ms)
 * @param {string} type - Loại sóng: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} volume - Âm lượng (0-1)
 */
function playTone(audioContext, frequency, duration, type = 'sine', volume = 0.3) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

/**
 * Tạo âm thanh thông báo dựa trên loại
 * @param {AudioContext} audioContext - Audio context
 * @param {string} soundType - Loại âm thanh
 */
function createNotificationSound(audioContext, soundType) {
  switch (soundType) {
    case 'default':
      // Âm thanh mặc định: 2 nốt ngắn
      playTone(audioContext, 800, 100, 'sine', 0.3);
      setTimeout(() => {
        playTone(audioContext, 1000, 150, 'sine', 0.3);
      }, 120);
      break;

    case 'message':
      // Âm thanh tin nhắn: 1 nốt ngắn
      playTone(audioContext, 600, 80, 'sine', 0.25);
      break;

    case 'call':
    case 'video_call':
      // Âm thanh cuộc gọi video: 3 nốt lặp lại (chuông dài)
      playTone(audioContext, 800, 200, 'sine', 0.5);
      setTimeout(() => {
        playTone(audioContext, 1000, 200, 'sine', 0.5);
      }, 220);
      setTimeout(() => {
        playTone(audioContext, 1200, 250, 'sine', 0.5);
      }, 440);
      // Lặp lại sau 1 giây để tạo hiệu ứng chuông dài
      setTimeout(() => {
        playTone(audioContext, 800, 200, 'sine', 0.5);
        setTimeout(() => {
          playTone(audioContext, 1000, 200, 'sine', 0.5);
        }, 220);
        setTimeout(() => {
          playTone(audioContext, 1200, 250, 'sine', 0.5);
        }, 440);
      }, 1000);
      break;

    case 'urgent':
      // Âm thanh khẩn cấp: 2 nốt cao
      playTone(audioContext, 1000, 100, 'square', 0.4);
      setTimeout(() => {
        playTone(audioContext, 1200, 150, 'square', 0.4);
      }, 120);
      break;

    default:
      playTone(audioContext, 800, 100, 'sine', 0.3);
  }
}

/**
 * Hook quản lý âm thanh thông báo
 * @param {Object} options - Tùy chọn
 * @param {boolean} [options.enabled=true] - Bật/tắt âm thanh
 * @param {number} [options.volume=0.5] - Âm lượng (0-1)
 * @returns {Object} { playSound, playNotificationSound, setEnabled, setVolume }
 */
export function useNotificationSound(options = {}) {
  const { enabled = true, volume = 0.5 } = options;
  
  const audioContextRef = useRef(null);
  const userInteractedRef = useRef(false);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);

  // Cập nhật enabled và volume
  enabledRef.current = enabled;
  volumeRef.current = volume;

  /**
   * Đánh dấu user đã tương tác (để cho phép tạo AudioContext)
   */
  useEffect(() => {
    const markUserInteracted = () => {
      userInteractedRef.current = true;
    };

    // Listen cho các events user interaction (chỉ cần 1 lần)
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, markUserInteracted, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, markUserInteracted);
      });
    };
  }, []);

  /**
   * Lấy hoặc tạo AudioContext (LAZY - chỉ tạo khi cần và sau user gesture)
   * @returns {AudioContext|null}
   */
  const getAudioContext = useCallback(() => {
    // Chỉ tạo AudioContext sau khi user đã tương tác
    if (!userInteractedRef.current) {
      return null;
    }

    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          // AudioContext được tạo sau user gesture nên sẽ ở trạng thái 'running'
        }
      } catch (error) {
        console.warn('[useNotificationSound] Không thể tạo AudioContext:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  /**
   * Phát âm thanh thông báo
   * @param {string} [soundType='default'] - Loại âm thanh: 'default', 'message', 'call', 'urgent'
   */
  const playSound = useCallback(async (soundType = 'default') => {
    if (!enabledRef.current) return;

    // Chỉ phát âm thanh sau khi user đã tương tác
    if (!userInteractedRef.current) {
      // Silently fail - không log warning vì đây là behavior mong đợi
      return;
    }

    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Resume audio context nếu bị suspended (phòng trường hợp edge case)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (err) {
        console.warn('[useNotificationSound] Không thể resume AudioContext:', err);
        return;
      }
    }

    try {
      createNotificationSound(audioContext, soundType);
    } catch (error) {
      console.warn('[useNotificationSound] Lỗi phát âm thanh:', error);
    }
  }, [getAudioContext]);

  /**
   * Phát âm thanh dựa trên loại thông báo
   * @param {string} notificationType - Loại thông báo từ Payload.type
   */
  const playNotificationSound = useCallback((notificationType) => {
    // Map loại thông báo sang loại âm thanh
    const soundMap = {
      // Trò chuyện
      'tro_chuyen_moi': 'message',
      'video_call': 'call',
      
      // Cuộc hẹn
      'cuoc_hen_moi': 'default',
      'cuoc_hen_cho_phe_duyet': 'urgent',
      'cuoc_hen_da_phe_duyet': 'default',
      'cuoc_hen_tu_choi': 'urgent',
      'cuoc_hen_tu_qr': 'default',
      'khach_huy_cuoc_hen': 'urgent',
      
      // Gợi ý
      'phan_hoi_goi_y': 'message',
      
      // Khác
      'default': 'default'
    };

    const soundType = soundMap[notificationType] || 'default';
    playSound(soundType);
  }, [playSound]);

  return {
    playSound,
    playNotificationSound,
    setEnabled: (value) => {
      enabledRef.current = value;
    },
    setVolume: (value) => {
      volumeRef.current = Math.max(0, Math.min(1, value));
      // Volume được áp dụng khi tạo âm thanh
    }
  };
}

export default useNotificationSound;

