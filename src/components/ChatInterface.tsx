'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ChatInterface.module.css';
import { sendMessageAction, fetchMessagesAction } from '@/app/chat-actions';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
    status: 'sent' | 'delivered' | 'read' | 'sending';
    type: 'text' | 'image' | 'file';
    fileUrl?: string; // keeping for compatibility 
    fileName?: string;
}

interface ChatInterfaceProps {
    chatId: string;
    chatTitle?: string;
    currentUserEmail: string;
}

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
                id: m.id || m.createdAt,
                text: m.content || '',
                sender: m.sender === currentUserEmail ? 'me' : 'other',
                time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                status: 'read', // Default to read for history
                type: 'text', // Assuming text for now
                fileUrl: m.attachments?.[0]?.url,
                fileName: m.attachments?.[0]?.name
            }));

            // Sort by createdAt just in case
            mapped.sort((a: any, b: any) => {
                // If using createdAt (ISO string)
                if (a.id < b.id) return -1;
                return 1;
            });

            setMessages(mapped);
        }
    }, [chatId, currentUserEmail]);

    // Initial load and polling
    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length, chatId]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const content = inputText;
        setInputText(''); // Clear immediately

        const res = await sendMessageAction(chatId, content);
        if (res.success) {
            loadMessages();
        } else {
            console.error("Failed to send:", res.error);
            alert("Failed to send message: " + res.error);
            setInputText(content); // Restore if failed
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

        // DynamoDB Item limit is 400KB. Base64 adds 33%. 
        // We limit to 200KB to be safe with other attributes.
        const MAX_SIZE = 200 * 1024; // 200KB

        if (file.size > MAX_SIZE) {
            alert(`File is too large (${(file.size / 1024).toFixed(1)}KB). Max allowed is 200KB for this demo.`);
            e.target.value = ''; // Reset
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const type = file.type.startsWith('image/') ? 'image' : 'file';

            const attachment = {
                name: file.name,
                url: base64, // Data URL
                type: type
            };

            // Optimistic update or just wait for reload? 
            // Let's send directly.
            const res = await sendMessageAction(chatId, "", [attachment]);
            if (res.success) {
                loadMessages();
            } else {
                alert("Failed to upload file: " + res.error);
            }
        };
        reader.readAsDataURL(file);

        // Reset input so validation triggers again if same file selected
        e.target.value = '';
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

                        {/* Metadata: Time + Checkmarks */}
                        <div className={styles.msgMeta}>
                            <span>{msg.time}</span>
                            {msg.sender === 'me' && (
                                <div className={`${styles.ticks} ${msg.status === 'read' ? styles.read : ''}`}>
                                    {/* Simple tick for now */}
                                    <span className={styles.tick}></span>
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

            {/* Hidden File Input (for future real implementation) */}
            <input
                type="file"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.txt,.pine,.pdf" // Limit types if needed
            />
        </div>
    );
}
