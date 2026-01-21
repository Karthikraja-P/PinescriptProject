'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ChatInterface.module.css';

interface Message {
    id: number;
    text: string;
    sender: 'me' | 'other';
    time: string;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'file';
    fileUrl?: string; // For mock purposes, this will be specific mock updates
    fileName?: string;
}

const INITIAL_MESSAGES: Message[] = [
    { id: 1, text: 'Hi! I saw your request for the MACD Strategy.', sender: 'other', time: '10:00 AM', status: 'read', type: 'text' },
    { id: 2, text: 'Hello! Yes, I need it to include multi-timeframe analysis.', sender: 'me', time: '10:05 AM', status: 'read', type: 'text' },
];

interface ChatInterfaceProps {
    chatId: string;
    chatTitle?: string;
}

export default function ChatInterface({ chatId, chatTitle }: ChatInterfaceProps) {
    // Independent state for each chat could be stored in a parent or context, 
    // but for this mock, let's just use localStorage to persist per-chat messages!
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load messages for specific chat
    useEffect(() => {
        const stored = localStorage.getItem(`chat_messages_${chatId}`);
        if (stored) {
            setMessages(JSON.parse(stored));
        } else {
            // Default initial message for new chats
            setMessages(INITIAL_MESSAGES);
        }
    }, [chatId]);

    // Save messages on update
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
            localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
        }
    }, [messages, chatId]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: messages.length + 1,
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            type: 'text',
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simulate Delivery + Read + Reply
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
        }, 1000);

        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);

        // Auto-reply simulation
        setTimeout(() => {
            const reply: Message = {
                id: messages.length + 2,
                text: "Got it! I'm reviewing the details sent.",
                sender: 'other',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read',
                type: 'text'
            };
            setMessages(prev => [...prev, reply]);
        }, 3500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleCreateMockAttachment = () => {
        // Mock file upload simulation
        const newMessage: Message = {
            id: messages.length + 1,
            text: '',
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            type: 'image',
            fileUrl: 'https://placehold.co/300x200/png?text=Chart+Screenshot', // Mock Image
            fileName: 'chart_screenshot.png'
        };
        setMessages(prev => [...prev, newMessage]);

        // Simulate read for attachment
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);
    };

    return (
        <div className={styles.chatContainer}>
            {/* Messages Area */}
            <div className={styles.messagesArea}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.messageBubble} ${msg.sender === 'me' ? styles.msgSent : styles.msgReceived}`}>

                        {/* Content: Image/File/Text */}
                        {msg.type === 'image' && msg.fileUrl && (
                            <img src={msg.fileUrl} alt="attachment" className={styles.imagePreview} />
                        )}
                        {msg.type === 'file' && (
                            <div className={styles.fileAttachment}>
                                <span className={styles.fileIcon}>📄</span>
                                <span className={styles.fileName}>{msg.fileName || 'Document.pdf'}</span>
                            </div>
                        )}

                        {msg.text && <div>{msg.text}</div>}

                        {/* Metadata: Time + Checkmarks */}
                        <div className={styles.msgMeta}>
                            <span>{msg.time}</span>
                            {msg.sender === 'me' && (
                                <div className={`${styles.ticks} ${msg.status === 'read' ? styles.read : ''}`}>
                                    <span className={styles.tick}></span>
                                    {(msg.status === 'delivered' || msg.status === 'read') && (
                                        <span className={`${styles.tick} ${styles.doubleTick}`}></span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <button className={styles.attachBtn} title="Attach File" onClick={handleCreateMockAttachment}>
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
            <input type="file" style={{ display: 'none' }} ref={fileInputRef} />
        </div>
    );
}
