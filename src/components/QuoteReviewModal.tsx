'use client';

interface QuoteReviewModalProps {
    request: {
        id: string;
        title: string;
        price: string;
        deadline?: string;
        notes?: string; // We might need to ensure this is passed or mocked if missing
    };
    onClose: () => void;
    onAccept: () => void;
    onDecline: () => void;
}

export default function QuoteReviewModal({ request, onClose, onAccept, onDecline }: QuoteReviewModalProps) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '450px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Review Quote</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '24px' }}>
                    The developer has sent a quote for <span style={{ fontWeight: 600, color: '#1e293b' }}>{request.title}</span>.
                </p>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Price:</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{request.price}</span>
                    </div>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Estimated Date:</span>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{request.deadline || 'TBD'}</span>
                    </div>
                    {/* Notes would ideally come from the request object, mocking or checking safely */}
                    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <span style={{ color: '#64748b', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Developer Notes:</span>
                        <p style={{ fontSize: '0.95rem', color: '#334155', fontStyle: 'italic' }}>
                            &quot;Please review the requirements. This quote includes 2 revisions.&quot;
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <button
                        onClick={onAccept}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a',
                            color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <span>✓</span> Accept & Pay
                    </button>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={onDecline}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ef4444', background: 'white',
                                color: '#ef4444', fontWeight: 500, cursor: 'pointer'
                            }}
                        >
                            Decline
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white',
                                color: '#64748b', fontWeight: 500, cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
