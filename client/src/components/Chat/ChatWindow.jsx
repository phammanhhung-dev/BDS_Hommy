/**
 * @fileoverview Chat Window Component - Main chat interface
 * @component ChatWindow
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineEllipsisVertical, HiOutlineVideoCamera } from 'react-icons/hi2';
import useChat from '../../hooks/useChat';
import { useChatContext } from '../../context/ChatContext';
import useSocket from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import viApi from '../../api/viApi';
import { getApiBaseUrl } from '../../config/api';
import { getAuthHeaderValue } from '../../utils/authToken';
import './ChatWindow.css';

export const ChatWindow = ({ conversationId: propConvId }) => {
  const params = useParams();
  const id = propConvId ? parseInt(propConvId) : (params.id ? parseInt(params.id) : null);
  const navigate = useNavigate();
  const { markConversationAsRead, conversations } = useChatContext();
  const [convDetail, setConvDetail] = useState(null);
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
  } = useChat(id);

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

      const fetchDetail = async () => {
        try {
          const authHeader = getAuthHeaderValue();
          const res = await fetch(`${getApiBaseUrl()}/api/chat/conversations/${id}`, {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          const result = await res.json();
          if (result.success && result.data) {
            setConvDetail(result.data);
          }
        } catch (err) {
          console.error('[ChatWindow] fetchDetail error:', err);
        }
      };
      fetchDetail();
    }
  }, [id, markAsRead, markConversationAsRead]);

  // Lắng nghe sự kiện PAY_DEPOSIT từ MessageList
  useEffect(() => {
    const handlePayDeposit = async (e) => {
      const { amount, messageId, cuocHoiThoaiId } = e.detail;
      try {
        if (!window.confirm(`Bạn có chắc chắn muốn thanh toán ${new Intl.NumberFormat('vi-VN').format(amount)}đ bằng Ví nội bộ không?`)) {
          return;
        }
        
        const res = await viApi.thanhToanCoc({
          amount,
          messageId,
          cuocHoiThoaiId
        });
        
        if (res.data.success) {
          alert('Thanh toán cọc thành công! Hợp đồng nháp đã được tạo.');
          // TODO: Có thể update message hiển thị "Đã thanh toán" thông qua websocket
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
      }
    };

    window.addEventListener('PAY_DEPOSIT', handlePayDeposit);
    return () => {
      window.removeEventListener('PAY_DEPOSIT', handlePayDeposit);
    };
  }, []);

  const conversationId = parseInt(id);
  const activeConv = conversations.find(c => c.CuocHoiThoaiID === conversationId) || convDetail;

  // Lấy tên người chat cùng (Partner)
  let partnerName = '';
  if (activeConv) {
    if (activeConv.ThanhVienKhac && activeConv.ThanhVienKhac.length > 0) {
      partnerName = activeConv.ThanhVienKhac.map(tv => tv.TenDayDu).filter(Boolean).join(', ');
    } else if (activeConv.ThanhVien && activeConv.ThanhVien.length > 0) {
      partnerName = activeConv.ThanhVien
        .filter(tv => tv.NguoiDungID !== currentUserId)
        .map(tv => tv.TenDayDu)
        .filter(Boolean)
        .join(', ');
    }
  }

  const handleVideoCall = () => {
    // Lấy tên người dùng hiện tại
    const currentUserName = currentUser.TenDayDu || currentUser.tenDayDu || 'User';

    // 1. Tạo Room ID an toàn
    const rawRoomId = `hommy_chat_${id}`;
    const secureRoomId = btoa(rawRoomId).replace(/=/g, '');

    // 2. URL phòng gọi (sử dụng Jitsi Meet chuẩn WebRTC miễn phí và ổn định)
    const displayName = encodeURIComponent(currentUserName);
    const roomUrl = `https://meet.jit.si/hommy_call_${secureRoomId}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;
    
    // 3. Emit socket event để thông báo cho đối tác
    if (socket && socketConnected && id) {
      socket.emit('initiate_video_call', {
        cuocHoiThoaiID: id,
        roomUrl
      });
      console.log('[ChatWindow] Emitted initiate_video_call event for conversation', id);
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

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/chu-du-an/tin-nhan');
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <button className="chat-window-back-btn" onClick={handleBack} title="Quay lại">
          <HiOutlineArrowLeft />
        </button>
        
        <div className="chat-window-header-info">
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            {partnerName || activeConv?.TieuDe || `Cuộc trò chuyện #${id}`}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px' }}>
            {activeConv?.TieuDe && partnerName && (
              <span style={{ color: '#64748b', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeConv.TieuDe}
              </span>
            )}
            <span className="chat-window-status" style={{ margin: 0 }}>
              {!isConnected ? (
                <span className="status-offline">Đang kết nối lại...</span>
              ) : isTyping ? (
                <span className="status-typing">Đang gõ...</span>
              ) : (
                <span className="status-online">● Trực tuyến</span>
              )}
            </span>
          </div>
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


