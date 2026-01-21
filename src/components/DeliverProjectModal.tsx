'use client';

import { useState, useRef } from 'react';

interface DeliverProjectModalProps {
    project: {
        id: string;
        client: string;
        type: string;
    };
    onClose: () => void;
    onDeliver: (files: string[], message: string) => void;
}

export default function DeliverProjectModal({ project, onClose, onDeliver }: DeliverProjectModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate file names for the mock delivery
        const fileNames = files.map(f => f.name);
        onDeliver(fileNames.length ? fileNames : ['strategy_v1.pine'], message);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Deliver Project</h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                    Upload final files for <span style={{ fontWeight: 500, color: '#1e293b' }}>{project.id}</span>
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px' }}>
                            Project Files (.pine)
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '30px', textAlign: 'center',
                                cursor: 'pointer', background: '#f8fafc'
                            }}
                        >
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".pine,.txt"
                            />
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📤</span>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select files to upload'}
                            </span>
                            {files.length > 0 && (
                                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#0f172a' }}>
                                    {files.map(f => f.name).join(', ')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>
                            Delivery Message
                        </label>
                        <textarea
                            required
                            rows={4}
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Here is the final version..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white',
                                color: '#64748b', fontWeight: 500, cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#16a34a',
                                color: 'white', fontWeight: 500, cursor: 'pointer' // Green for delivery
                            }}
                        >
                            Deliver & Complete
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
