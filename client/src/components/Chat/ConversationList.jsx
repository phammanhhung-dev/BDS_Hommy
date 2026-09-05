/**
 * @fileoverview Conversation List Component (Sidebar)
 * @component ConversationList
 */

import React from 'react';
import { HiOutlineChatBubbleLeftRight, HiOutlineUserGroup, HiOutlineVideoCamera } from 'react-icons/hi2';
import './ConversationList.css';

export const ConversationList = ({ conversations, activeId, onSelect, onVideoCall, loading = false }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="conversation-list">
        <div className="conversation-list-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <HiOutlineChatBubbleLeftRight />
        <h3>Tin nhắn</h3>
      </div>

      {conversations.length === 0 ? (
        <div className="conversation-list-empty">
          <HiOutlineUserGroup className="empty-icon" />
          <p>Chưa có cuộc trò chuyện</p>
        </div>
      ) : (
        <div className="conversation-list-items">
          {conversations.map((conv) => (
            <div
              key={conv.CuocHoiThoaiID}
              className={`conversation-item ${activeId === conv.CuocHoiThoaiID ? 'active' : ''}`}
              onClick={() => onSelect(conv.CuocHoiThoaiID)}
            >
              <div className="conversation-item-avatar">
                {conv.ThanhVienKhac && conv.ThanhVienKhac[0]?.AnhDaiDien ? (
                  <img src={conv.ThanhVienKhac[0].AnhDaiDien} alt="" />
                ) : (
                  <div className="conversation-item-avatar-placeholder">
                    <HiOutlineUserGroup />
                  </div>
                )}
              </div>

              <div className="conversation-item-content">
                <div className="conversation-item-header">
                  <h4 className="conversation-item-title">
                    {conv.TieuDe || 
                     (conv.ThanhVienKhac && conv.ThanhVienKhac.map(m => m.TenDayDu).join(', ')) ||
                     'Cuộc trò chuyện'
                    }
                  </h4>
                  <span className="conversation-item-time">
                    {formatTime(conv.ThoiDiemTinNhanCuoi)}
                  </span>
                </div>

                <div className="conversation-item-preview">
                  <p className="conversation-item-last-message">
                    {truncateMessage(conv.TinNhanCuoi)}
                  </p>
                  {conv.SoTinChuaDoc > 0 && (
                    <span className="conversation-item-unread-badge">
                      {conv.SoTinChuaDoc}
                    </span>
                  )}
                </div>
              </div>

              {/* Nút Video Call */}
              {onVideoCall && (
                <button
                  className="conversation-item-video-call"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVideoCall(conv);
                  }}
                  title="Gọi video"
                >
                  <HiOutlineVideoCamera />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationList;


