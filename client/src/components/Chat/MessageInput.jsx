/**
 * @fileoverview Message Input Component
 * @component MessageInput
 */

import React, { useState, useRef, useEffect } from 'react';
import { HiOutlinePaperAirplane, HiOutlineCurrencyDollar } from 'react-icons/hi2';
import DepositRequestModal from './DepositRequestModal';
import './MessageInput.css';

/**
 * Message Input component với typing indicator
 */
export const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isChuDuAn, setIsChuDuAn] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Kiểm tra role: 2 là Chủ dự án, 3 là NVBH
        if (user.VaiTroID === 2 || user.VaiTroID === 3) {
          setIsChuDuAn(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator
    if (onTyping) {
      onTyping();
    }

    // Auto-resize textarea
    e.target.style.height = '44px';
    const scrollHeight = e.target.scrollHeight;
    if (scrollHeight > 44) {
      e.target.style.height = Math.min(scrollHeight, 120) + 'px';
      e.target.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
    } else {
      e.target.style.overflowY = 'hidden';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.overflowY = 'hidden';
    }
  };

  const handleKeyDown = (e) => {
    // Send with Enter, newline with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDepositSubmit = (payload) => {
    onSendMessage(payload);
  };

  return (
    <>
      <form className="message-input" onSubmit={handleSubmit}>
        {isChuDuAn && (
          <button
            type="button"
            className="message-input-action-btn deposit-btn"
            title="Yêu cầu đặt cọc"
            onClick={() => setIsDepositModalOpen(true)}
            disabled={disabled}
          >
            <HiOutlineCurrencyDollar />
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống hàng)"
          disabled={disabled}
          rows={1}
          className="message-input-textarea"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="message-input-send-btn"
          title="Gửi tin nhắn (Enter)"
        >
          <HiOutlinePaperAirplane />
        </button>
      </form>

      <DepositRequestModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSubmit={handleDepositSubmit}
      />
    </>
  );
};

export default MessageInput;


