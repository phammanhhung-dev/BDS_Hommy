/**
 * UC-SALE-07: Tin nhắn - Reuse từ ChuDuAn với Corporate Blue theme
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatProvider, useChatContext } from '../../context/ChatContext';
import ConversationList from '../../components/Chat/ConversationList';
import { HiOutlineInbox } from 'react-icons/hi2';
import './TinNhanNVBH.css';

const TinNhanContent = () => {
  const navigate = useNavigate();
  const { conversations, loading, setActiveConversationId, activeConversationId } = useChatContext();
  const [selectedId, setSelectedId] = useState(null);

  const handleSelectConversation = (id) => {
    setSelectedId(id);
    setActiveConversationId(id);
    navigate(`/nhan-vien-ban-hang/tin-nhan/${id}`);
  };

  return (
    <div className="nvbh-tin-nhan-page">
      <div className="nvbh-tin-nhan-container">
        <ConversationList
          conversations={conversations}
          activeId={selectedId || activeConversationId}
          onSelect={handleSelectConversation}
          loading={loading}
        />
        <div className="nvbh-tin-nhan-placeholder">
          <HiOutlineInbox className="nvbh-placeholder-icon" />
          <h3>Chọn một cuộc trò chuyện</h3>
          <p>Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
        </div>
      </div>
    </div>
  );
};

export default function TinNhan() {
  return (
    <ChatProvider>
      <TinNhanContent />
    </ChatProvider>
  );
}







