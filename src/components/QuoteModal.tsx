'use client';

import { useState } from 'react';

interface QuoteModalProps {
    requestId: string;
    clientName: string;
    onClose: () => void;
    onSendQuote: (data: { price: string, deadline: string, notes: string }) => void;
}

export default function QuoteModal({ requestId, clientName, onClose, onSendQuote }: QuoteModalProps) {
    const [formData, setFormData] = useState({
        price: '',
        deadline: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendQuote(formData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Send Quote</h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                    For Request <span style={{ fontWeight: 500, color: '#1e293b' }}>{requestId}</span> by {clientName}
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>
                            Price ($)
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem'
                            }}
                            placeholder="e.g. 150"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>
                            Estimated Deadline
                        </label>
                        <input
                            type="date"
                            required
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem'
                            }}
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '6px' }}>
                            Notes / Conditions
                        </label>
                        <textarea
                            rows={3}
                            style={{
                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem',
                                fontFamily: 'inherit'
                            }}
                            placeholder="e.g. Includes 2 revisions."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                            className="btn-primary" // Assuming global btn-primary or similar style exists, otherwise we inline
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4F46E5',
                                color: 'white', fontWeight: 500, cursor: 'pointer'
                            }}
                        >
                            Send Quote
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
