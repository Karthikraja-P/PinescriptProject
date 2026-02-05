'use client';

import { useState } from 'react';

interface DeliveryReviewModalProps {
    project: {
        id: string;
        title: string;
        deliveryMessage?: string;
        files?: { name: string; data: string }[];
    };
    onClose: () => void;
    onAccept: () => void;
    onRequestRevision: (reason: string) => void;
    onDownload: (file: any) => void;
}

export default function DeliveryReviewModal({ project, onClose, onAccept, onRequestRevision, onDownload }: DeliveryReviewModalProps) {
    const [showRevisionForm, setShowRevisionForm] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');

    const handleSubmitRevision = (e: React.FormEvent) => {
        e.preventDefault();
        onRequestRevision(revisionReason);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflowY: 'auto', maxHeight: '90vh'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Review Delivery</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                    The developer has delivered the work for <span style={{ fontWeight: 500, color: '#1e293b' }}>{project.title}</span>.
                </p>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0f172a' }}>Delivery Message</h4>
                    <p style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {project.deliveryMessage || "No message provided."}
                    </p>

                    {project.files && project.files.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0f172a' }}>Files</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {project.files.map((file, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onDownload(file)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                            background: 'white', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        ⬇ {file.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!showRevisionForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={onAccept}
                            style={{
                                padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a',
                                color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
                            }}
                        >
                            Allowed & Complete Order
                        </button>
                        <button
                            onClick={() => setShowRevisionForm(true)}
                            style={{
                                padding: '12px', borderRadius: '8px', border: '1px solid #ef4444',
                                background: 'white', color: '#ef4444', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Request Revision
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitRevision}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>
                                What needs to be revised?
                            </label>
                            <textarea
                                required
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                placeholder="Describe the issues..."
                                value={revisionReason}
                                onChange={(e) => setRevisionReason(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setShowRevisionForm(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 500 }}
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
