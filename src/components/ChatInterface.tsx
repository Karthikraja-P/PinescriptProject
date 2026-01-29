'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatInterface.module.css';
import { sendMessageAction, fetchMessagesAction, markChatAsReadAction } from '@/app/chat-actions';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    senderName?: string;
    time: string;
    status: 'sent' | 'delivered' | 'read' | 'sending';
    type: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
}

interface ChatInterfaceProps {
    chatId: string;
    chatTitle?: string;
    currentUserEmail: string;
}

// Tick SVG components for message status
const SingleTick = ({ color = '#94a3b8' }: { color?: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const DoubleTick = ({ color = '#94a3b8' }: { color?: string }) => (
    <svg width="20" height="16" viewBox="0 0 28 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 12 9 17 20 6"></polyline>
        <polyline points="10 12 15 17 26 6"></polyline>
    </svg>
);

export default function ChatInterface({ chatId, chatTitle, currentUserEmail }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = useCallback(async () => {
        if (!chatId) return;
        const res = await fetchMessagesAction(chatId);
        if (res.success && res.messages) {
            const mapped: Message[] = res.messages.map((m: any) => ({
                id: m.id || m.SK || m.createdAt,
                text: m.content || '',
                sender: m.sender === currentUserEmail ? 'me' : 'other',
                senderName: m.senderRole === 'ADMIN' ? 'Developer' : (m.sender?.split('@')[0] || 'Client'),
                time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                status: m.status || 'sent',
                type: m.attachments?.[0]?.type === 'image' ? 'image' : (m.attachments?.[0] ? 'file' : 'text'),
                fileUrl: m.attachments?.[0]?.url,
                fileName: m.attachments?.[0]?.name
            }));

            // Sort by createdAt
            mapped.sort((a: any, b: any) => {
                if (a.id < b.id) return -1;
                return 1;
            });

            setMessages(mapped);
        }
    }, [chatId, currentUserEmail]);

    // Initial load and polling
    useEffect(() => {
        loadMessages();
        // Mark as read when opening chat
        markChatAsReadAction(chatId);

        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [loadMessages, chatId]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length, chatId]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const content = inputText;
        setInputText(''); // Clear immediately

        // Optimistic update - show message as "sending"
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            text: content,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
            type: 'text'
        };
        setMessages(prev => [...prev, tempMessage]);

        const res = await sendMessageAction(chatId, content);
        if (res.success) {
            // Reload to get actual message with server timestamp
            loadMessages();
        } else {
            console.error("Failed to send:", res.error);
            alert("Failed to send message: " + res.error);
            setInputText(content); // Restore if failed
            // Remove optimistic message
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 200 * 1024; // 200KB

        if (file.size > MAX_SIZE) {
            alert(`File is too large (${(file.size / 1024).toFixed(1)}KB). Max allowed is 200KB for this demo.`);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const type = file.type.startsWith('image/') ? 'image' : 'file';

            const attachment = {
                name: file.name,
                url: base64,
                type: type
            };

            const res = await sendMessageAction(chatId, "", [attachment]);
            if (res.success) {
                loadMessages();
            } else {
                alert("Failed to upload file: " + res.error);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Render tick based on status
    const renderTicks = (status: string) => {
        switch (status) {
            case 'sending':
                return <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>⏳</span>;
            case 'sent':
                return <SingleTick color="#94a3b8" />;
            case 'delivered':
                return <DoubleTick color="#94a3b8" />;
            case 'read':
                return <DoubleTick color="#3b82f6" />;
            default:
                return <SingleTick color="#94a3b8" />;
        }
    };

    return (
        <div className={styles.chatContainer}>
            {/* Messages Area */}
            <div className={styles.messagesArea}>
                {messages.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                        Start a conversation...
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.messageBubble} ${msg.sender === 'me' ? styles.msgSent : styles.msgReceived}`}>

                        {/* Sender name for received messages */}
                        {msg.sender === 'other' && msg.senderName && (
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>
                                {msg.senderName}
                            </div>
                        )}

                        {/* Content: Image/File/Text */}
                        {msg.type === 'image' && msg.fileUrl && (
                            <div className={styles.imageWrapper}>
                                <img src={msg.fileUrl} alt="attachment" className={styles.imagePreview} />
                            </div>
                        )}
                        {msg.type === 'file' && (
                            <div className={styles.fileAttachment}>
                                <a href={msg.fileUrl} download={msg.fileName} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.fileIcon}>📄</span>
                                    <span className={styles.fileName}>{msg.fileName || 'Attachment'}</span>
                                </a>
                            </div>
                        )}

                        {msg.text && <div>{msg.text}</div>}

                        {/* Metadata: Time + Ticks */}
                        <div className={styles.msgMeta}>
                            <span>{msg.time}</span>
                            {msg.sender === 'me' && (
                                <div className={styles.ticks}>
                                    {renderTicks(msg.status)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <button className={styles.attachBtn} title="Attach File (Max 200KB)" onClick={handleAttachmentClick}>
                    📎
                </button>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button className={styles.sendBtn} onClick={handleSendMessage}>
                    ➤
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.txt,.pine,.pdf"
            />
        </div>
    );
}

