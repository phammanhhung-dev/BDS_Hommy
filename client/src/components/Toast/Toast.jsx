import React, { useEffect, useState } from "react";
import "./Toast.css";

/**
 * Component Toast Notification
 * Hiển thị thông báo dạng thanh ngang bên phải màu xanh lá
 */
const Toast = ({ message, type = "success", duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Hiển thị toast
    setTimeout(() => setIsVisible(true), 10);

    // Tự động ẩn sau duration
    const timer = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Đợi animation hoàn thành
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  return (
    <div
      className={`toast toast--${type} ${isVisible ? "toast--show" : ""} ${
        isRemoving ? "toast--hide" : ""
      }`}
    >
      <div className="toast__content">
        <span className="toast__message">{message}</span>
        <button
          className="toast__close"
          onClick={handleClose}
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Toast Container - Quản lý nhiều toast
 */
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type || "success"}
          duration={toast.duration || 3000}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Hook để sử dụng Toast
 */
let toastIdCounter = 0;
const toastListeners = new Set();

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toast) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { ...toast, id }]);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const showToast = (message, type = "success", duration = 3000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export default Toast;

