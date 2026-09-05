import React, { useEffect } from 'react';
import './ModalOperator.css';
import IconOperator from '../Icon';
import { HiOutlineXMark } from 'react-icons/hi2';

/**
 * Modal component với glass morphism design
 * @param {Object} props
 * @param {boolean} props.isOpen - Hiển thị modal
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Tiêu đề
 * @param {React.ReactNode} props.children - Nội dung
 * @param {React.ReactNode} props.footer - Footer content
 * @param {string} props.size - 'normal' | 'large' | 'fullscreen'
 */
function ModalOperator({ 
  isOpen = false, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'normal'
}) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'large' ? 'operator-modal--large' : 
                    size === 'fullscreen' ? 'operator-modal--fullscreen' : '';

  return (
    <div className="operator-modal" onClick={onClose}>
      <div 
        className={`operator-modal__container ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="operator-modal__header">
          <h2 className="operator-modal__title">{title}</h2>
          <button 
            className="operator-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconOperator size={16} title="Đóng"><HiOutlineXMark /></IconOperator>
          </button>
        </div>
        <div className="operator-modal__body">
          {children}
        </div>
        {footer && (
          <div className="operator-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalOperator;






