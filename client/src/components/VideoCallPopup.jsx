/**
 * VideoCallPopup - Modal thông báo cuộc gọi video đến
 */

import React from 'react';
import { useChatContext } from '../context/ChatContext';
import './VideoCallPopup.css';

const VideoCallPopup = () => {
    const { incomingCall, acceptCall, declineCall } = useChatContext();

    if (!incomingCall) return null;

    return (
        <div className="video-call-popup-overlay">
            <div className="video-call-popup">
                <div className="video-call-popup__header">
                    <div className="video-call-popup__icon">📞</div>
                    <h3>Cuộc gọi video đến</h3>
                </div>

                <div className="video-call-popup__body">
                    <div className="video-call-popup__avatar">
                        {incomingCall.callerName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <p className="video-call-popup__caller">{incomingCall.callerName || 'Người dùng'}</p>
                    <p className="video-call-popup__subtitle">đang gọi cho bạn...</p>
                </div>

                <div className="video-call-popup__actions">
                    <button
                        className="video-call-popup__btn video-call-popup__btn--decline"
                        onClick={declineCall}
                    >
                        Từ chối
                    </button>
                    <button
                        className="video-call-popup__btn video-call-popup__btn--accept"
                        onClick={acceptCall}
                    >
                        Chấp nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallPopup;
