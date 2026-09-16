/**
 * @fileoverview Trang Tin nhắn - Chat interface cho Chủ Dự án
 * @component TinNhan
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import ConversationList from '../../components/Chat/ConversationList';
import ChatWindow from '../../components/Chat/ChatWindow';
import { useChatContext } from '../../context/ChatContext';
import useSocket from '../../hooks/useSocket';
import { HiOutlineInbox } from 'react-icons/hi2';
import './TinNhan.css';
import '../../styles/ChuDuAnDesignSystem.css';

const TinNhanContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { conversations, loading, setActiveConversationId, activeConversationId } = useChatContext();
  const { socket, isConnected: socketConnected } = useSocket();
  const [selectedId, setSelectedId] = useState(id ? parseInt(id) : null);

  const activeId = id ? parseInt(id) : selectedId;

  // Cập nhật activeConversationId khi id thay đổi
  useEffect(() => {
    if (id) {
      const parsed = parseInt(id);
      setSelectedId(parsed);
      setActiveConversationId(parsed);
    }
  }, [id, setActiveConversationId]);

  // Lấy thông tin user hiện tại
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

  const handleSelectConversation = (convId) => {
    setSelectedId(convId);
    setActiveConversationId(convId);
    navigate(`/chu-du-an/tin-nhan/${convId}`);
  };

  // Xử lý gọi video từ danh sách
  const handleVideoCall = (conversation) => {
    const conversationId = conversation.CuocHoiThoaiID;
    const currentUserName = currentUser.TenDayDu || currentUser.tenDayDu || 'User';
    
    // Lấy tên người chat cùng
    let partnerName = '';
    if (conversation.ThanhVienKhac && conversation.ThanhVienKhac.length > 0) {
      partnerName = conversation.ThanhVienKhac[0].TenDayDu;
    }

    // Tạo Room ID
    const rawRoomId = `hommy_chat_${conversationId}`;
    const secureRoomId = btoa(rawRoomId).replace(/=/g, '');

    // URL phòng gọi Jitsi Meet
    const displayName = encodeURIComponent(currentUserName);
    const roomUrl = `https://meet.jit.si/hommy_call_${secureRoomId}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;
    
    // Emit socket event để thông báo
    if (socket && socketConnected) {
      socket.emit('initiate_video_call', {
        cuocHoiThoaiID: conversationId,
        roomUrl
      });
      console.log('[TinNhan] Emitted initiate_video_call event');
    }
    
    // Mở window video call
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
    <div className="tin-nhan-page">
      <div className="tin-nhan-container">
        <div className={`tin-nhan-sidebar ${activeId ? 'has-active-mobile' : ''}`}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            onVideoCall={handleVideoCall}
            loading={loading}
          />
        </div>

        <div className={`tin-nhan-main ${!activeId ? 'no-active-mobile' : ''}`}>
          {activeId ? (
            <ChatWindow conversationId={activeId} />
          ) : (
            <div className="tin-nhan-placeholder">
              <HiOutlineInbox className="placeholder-icon" />
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TinNhan() {
  return (
    <ChuDuAnLayout>
      <TinNhanContent />
    </ChuDuAnLayout>
  );
}
