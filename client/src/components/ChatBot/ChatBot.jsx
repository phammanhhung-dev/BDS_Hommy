import React, { useState, useRef, useEffect } from 'react';
import { HiChatBubbleLeftRight, HiXMark, HiPaperAirplane, HiArrowPath } from 'react-icons/hi2';
import { buildApiUrl } from '../../config/api';
import axios from 'axios';
import './ChatBot.css';

const API_URL = buildApiUrl('/api/chatbot');

const DEFAULT_WELCOME = {
    role: 'assistant',
    content: 'Xin chào! Tôi là Trợ lý ảo thông minh của Hommy BĐS 🏡\n\nTôi có thể giúp gì cho bạn hôm nay?'
};

const SUGGESTIONS = [
    "🔍 Tìm nhà đất bán",
    "🤖 Hướng dẫn Định giá AI",
    "📑 Quy trình đặt cọc BĐS",
    "📞 Hotline liên hệ"
];

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([DEFAULT_WELCOME]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleSendMessage = async (textToSend) => {
        const text = (textToSend || input).trim();
        if (!text || isLoading) return;

        const userMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(API_URL, {
                messages: updatedMessages.map(msg => ({
                    role: msg.role === 'bot' ? 'assistant' : msg.role,
                    content: msg.content
                }))
            });

            if (response.data && response.data.success) {
                const botMessage = {
                    role: 'assistant',
                    content: response.data.data
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(response.data?.message || 'API Error');
            }
        } catch (error) {
            console.error('Lỗi chat:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Tôi là Trợ lý ảo Hommy. Hiện tại dịch vụ đang phản hồi chậm hoặc ngoại tuyến. Bạn có thể liên hệ hotline 0356960304 hoặc gửi email về batdongsanhommy@gmail.com để được hỗ trợ nhanh nhất nhé!'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSendMessage();
    };

    const handleResetChat = () => {
        setMessages([DEFAULT_WELCOME]);
        setInput('');
    };

    return (
        <>
            {/* Nút mở chat */}
            {!isOpen && (
                <button 
                    className="chatbot-trigger" 
                    onClick={() => setIsOpen(true)}
                    title="Trợ lý ảo Hommy"
                    aria-label="Mở Trợ lý ảo Hommy"
                >
                    <HiChatBubbleLeftRight />
                </button>
            )}

            {/* Khung chat */}
            {isOpen && (
                <div className="chatbot-container">
                    <div className="chatbot-header">
                        <div>
                            <h3>Trợ lý ảo Hommy</h3>
                            <p>Luôn sẵn sàng hỗ trợ bạn</p>
                        </div>
                        <div className="chatbot-header-actions">
                            <button 
                                className="chatbot-action-btn" 
                                onClick={handleResetChat}
                                title="Làm mới cuộc trò chuyện"
                            >
                                <HiArrowPath style={{ width: 18, height: 18 }} />
                            </button>
                            <button 
                                className="chatbot-close-btn" 
                                onClick={() => setIsOpen(false)}
                                title="Đóng cửa sổ chat"
                            >
                                <HiXMark style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}
                            >
                                {msg.content}
                            </div>
                        ))}

                        {/* Gợi ý câu hỏi nhanh khi chỉ mới có tin nhắn chào đầu tiên */}
                        {messages.length === 1 && (
                            <div className="chatbot-suggestions">
                                <div className="chatbot-suggestions-title">💡 Gợi ý câu hỏi nhanh:</div>
                                <div className="chatbot-suggestions-list">
                                    {SUGGESTIONS.map((item, idx) => (
                                        <button 
                                            key={idx} 
                                            className="chatbot-suggestion-chip"
                                            onClick={() => handleSendMessage(item)}
                                            disabled={isLoading}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="message-loading">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-area" onSubmit={handleFormSubmit}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            className="chatbot-input"
                            placeholder="Nhập câu hỏi của bạn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            className="chatbot-send-btn"
                            disabled={isLoading || !input.trim()}
                            title="Gửi tin nhắn"
                        >
                            <HiPaperAirplane style={{ width: 16, height: 16 }} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;
