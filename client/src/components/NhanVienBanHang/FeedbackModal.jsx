/**
 * Feedback Modal component
 * Form gửi phản hồi với title, type, và content
 */

import React, { useState, useEffect } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import './FeedbackModal.css';

/**
 * @param {Object} props
 * @param {boolean} props.open - Hiển thị modal
 * @param {Function} props.onOpenChange - Handler khi thay đổi trạng thái open
 */
const FeedbackModal = ({ open, onOpenChange }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form khi đóng modal
  useEffect(() => {
    if (!open) {
      setTitle('');
      setType('');
      setContent('');
      setIsSubmitting(false);
    }
  }, [open]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, isSubmitting, onOpenChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !type || !content.trim()) {
      // Có thể thêm toast notification ở đây
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      alert('Gửi phản hồi thành công! Cảm ơn bạn đã đóng góp ý kiến.');
      
      // Reset form and close modal
      setTitle('');
      setType('');
      setContent('');
      setIsSubmitting(false);
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange?.(false);
    }
  };

  if (!open) return null;

  return (
    <div className="nvbh-feedback-modal" onClick={handleClose}>
      <div
        className="nvbh-feedback-modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nvbh-feedback-modal__header">
          <h2 className="nvbh-feedback-modal__title">Gửi phản hồi</h2>
          <button
            className="nvbh-feedback-modal__close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            <HiOutlineXMark className="nvbh-feedback-modal__close-icon" />
          </button>
        </div>

        {/* Description */}
        <div className="nvbh-feedback-modal__description">
          Chia sẻ ý kiến của bạn để giúp chúng tôi cải thiện hệ thống tốt hơn.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="nvbh-feedback-modal__form">
          <div className="nvbh-feedback-modal__body">
            {/* Title Field */}
            <div className="nvbh-feedback-modal__field">
              <label htmlFor="feedback-title" className="nvbh-feedback-modal__label">
                Tiêu đề
              </label>
              <input
                id="feedback-title"
                type="text"
                className="nvbh-feedback-modal__input"
                placeholder="Nhập tiêu đề phản hồi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Type Field */}
            <div className="nvbh-feedback-modal__field">
              <label htmlFor="feedback-type" className="nvbh-feedback-modal__label">
                Loại phản hồi
              </label>
              <select
                id="feedback-type"
                className="nvbh-feedback-modal__select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="">Chọn loại phản hồi</option>
                <option value="bug">Báo lỗi</option>
                <option value="feature">Đề xuất tính năng</option>
                <option value="improvement">Cải thiện</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {/* Content Field */}
            <div className="nvbh-feedback-modal__field">
              <label htmlFor="feedback-content" className="nvbh-feedback-modal__label">
                Nội dung
              </label>
              <textarea
                id="feedback-content"
                className="nvbh-feedback-modal__textarea"
                placeholder="Mô tả chi tiết phản hồi của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={6}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="nvbh-feedback-modal__footer">
            <button
              type="button"
              className="nvbh-feedback-modal__btn nvbh-feedback-modal__btn--cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="nvbh-feedback-modal__btn nvbh-feedback-modal__btn--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;


