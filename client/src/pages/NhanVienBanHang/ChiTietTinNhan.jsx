/**
 * UC-SALE-07: Chi tiết Tin nhắn - Reuse ChatWindow với NVBH theme
 */

import React from 'react';
import { ChatProvider } from '../../context/ChatContext';
import ChatWindow from '../../components/Chat/ChatWindow';
import './TinNhanNVBH.css';

export default function ChiTietTinNhan() {
  return (
    <ChatProvider>
      <div className="nvbh-chi-tiet-tin-nhan">
        <ChatWindow />
      </div>
    </ChatProvider>
  );
}







