/**
 * @fileoverview Message Input Component
 * @component MessageInput
 */

import React, { useState, useRef } from 'react';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import './MessageInput.css';

/**
 * Message Input component với typing indicator
 */
export const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator
    if (onTyping) {
      onTyping();
    }

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Send with Enter, newline with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
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
  );
};

export default MessageInput;


