/**
 * @fileoverview Chi tiết cuộc trò chuyện - ChatWindow wrapper
 * @component ChiTietTinNhan
 */

import React from 'react';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import { ChatProvider } from '../../context/ChatContext';
import ChatWindow from '../../components/Chat/ChatWindow';
import '../../styles/ChuDuAnDesignSystem.css';

export default function ChiTietTinNhan() {
  return (
    <ChuDuAnLayout>
      <ChatProvider>
        <ChatWindow />
      </ChatProvider>
    </ChuDuAnLayout>
  );
}


