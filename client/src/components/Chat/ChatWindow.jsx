/**
 * @fileoverview Chat Window Component - Main chat interface
 * @component ChatWindow
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineEllipsisVertical, HiOutlineVideoCamera } from 'react-icons/hi2';
import useChat from '../../hooks/useChat';
import { useChatContext } from '../../context/ChatContext';
import useSocket from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

export const ChatWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markConversationAsRead, conversations } = useChatContext();
  const { socket, isConnected: socketConnected } = useSocket();
  const {
    messages,
    sendMessage,
    handleTyping,
    markAsRead,
    isTyping,
    loading,
    error,
    isConnected
  } = useChat(parseInt(id));

  // Get current user ID from localStorage
  let currentUserId = parseInt(localStorage.getItem('userId') || '0');
  let currentUser = {};
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
      if (!currentUserId) currentUserId = currentUser.NguoiDungID || 0;
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
  }

  // Mark as read khi mở conversation
  useEffect(() => {
    if (id) {
      markAsRead();
      markConversationAsRead(parseInt(id));
    }
  }, [id, markAsRead, markConversationAsRead]);

  const handleVideoCall = () => {
    // Tìm thông tin cuộc hội thoại để lấy tên người chat cùng
    const conversationId = parseInt(id);
    const conversation = conversations.find(c => c.CuocHoiThoaiID === conversationId);
    
    // Lấy tên người dùng hiện tại
    const currentUserName = currentUser.TenDayDu || currentUser.tenDayDu || 'User';
    
    // Lấy tên người chat cùng (Partner)
    let partnerName = '';
    if (conversation && conversation.ThanhVienKhac && conversation.ThanhVienKhac.length > 0) {
      partnerName = conversation.ThanhVienKhac[0].TenDayDu;
    }

    // 1. Tạo Room ID khó đoán hơn (Base64 encode)
    // Ví dụ: daphongtro_chat_123 -> ZGFwaG9uZ3Ryb19jaGF0XzEyMw
    // Loại bỏ dấu = ở cuối để URL đẹp hơn
    const rawRoomId = `daphongtro_chat_${id}`;
    const secureRoomId = btoa(rawRoomId).replace(/=/g, '');

    // 2. Mã hóa thông tin user (Base64 với hỗ trợ tiếng Việt UTF-8)
    const userInfo = {
      username: currentUserName,
      userid: currentUserId,
      partner_name: partnerName,
      timestamp: Date.now() // Thêm timestamp để tăng tính duy nhất
    };
    
    // Encode: JSON -> UTF8 -> Base64
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(userInfo))));

    // URL cuối cùng: .../room/ZGFwaG9uZ3Ryb19jaGF0XzEyMw?data=eyJ1c2VybmFtZ...
    const roomUrl = `https://jbcalling.site/room/${secureRoomId}?data=${encodedData}`;
    
    // 3. Emit socket event để thông báo cho NVBH (nếu là chủ dự án)
    if (socket && socketConnected) {
      socket.emit('initiate_video_call', {
        cuocHoiThoaiID: conversationId,
        roomUrl
      });
      console.log('[ChatWindow] Emitted initiate_video_call event');
    }
    
    // 4. Mở window video call
    const width = 1280;
    const height = 720;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      roomUrl,
      'VideoCallWindow',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <button className="chat-window-back-btn" onClick={() => navigate('/chu-du-an/tin-nhan')}>
          <HiOutlineArrowLeft />
        </button>
        
        <div className="chat-window-header-info">
          <h3>Cuộc trò chuyện</h3>
          <p className="chat-window-status">
            {!isConnected ? (
              <span className="status-offline">Đang kết nối lại...</span>
            ) : isTyping ? (
              <span className="status-typing">Đang gõ...</span>
            ) : (
              <span className="status-online">Trực tuyến</span>
            )}
          </p>
        </div>

        <div className="chat-window-actions">
          <button 
            className="chat-window-action-btn" 
            onClick={handleVideoCall}
            title="Video Call"
          >
            <HiOutlineVideoCamera />
          </button>
          <button className="chat-window-menu-btn">
            <HiOutlineEllipsisVertical />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="chat-window-error">
          ⚠️ {error}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isTyping={isTyping}
        loading={loading}
      />

      {/* Input */}
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatWindow;


