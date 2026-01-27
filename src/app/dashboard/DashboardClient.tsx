'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import ChatInterface from '@/components/ChatInterface';
import QuoteReviewModal from '@/components/QuoteReviewModal';
import styles from './page.module.css';

interface DashboardClientProps {
    user: any;
    initialProjects: any[];
    initialPayments: any[];
    initialChatMetas: any[];
}

export default function ClientDashboard({ user, initialProjects, initialPayments, initialChatMetas }: DashboardClientProps) {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedPayment, setSelectedPayment] = useState<{ amount: string, id: string } | null>(null);
    const [quoteToReview, setQuoteToReview] = useState<any>(null);
    const [viewingProject, setViewingProject] = useState<any>(null);

    // Payments State
    const [myPayments, setMyPayments] = useState(initialPayments);


    // Requests State - Use Server Data
    const [myProjects, setMyProjects] = useState(initialProjects);

    // Profile State
    const [userProfile, setUserProfile] = useState({
        name: user?.name || 'Client User',
        email: user?.email || 'client@pinescript.com',
        tvUsername: user?.tvUsername || '' // Now coming from DB
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editForm, setEditForm] = useState(userProfile);

    const router = useRouter();

    useEffect(() => {
        // We can still keep this to merge any optimistic updates or just rely on server data
        // For now, let's just use the server data primarily. 
        // If we want to support 'mock_requests' from the landing page flow that might not be in DB yet (if they weren't submitted properly),
        // we'd check that, but the landing page now submits to DB. 
        // So we can assume initialProjects is the source of truth.
        setMyProjects(initialProjects);
    }, [initialProjects]);

    const handleLogout = () => router.push('/');

    const startEditing = () => {
        setEditForm(userProfile);
        setIsEditingProfile(true);
    };

    const saveProfile = async () => {
        // Optimistic Update
        setUserProfile(editForm);
        setIsEditingProfile(false);

        // Server Action
        const formData = new FormData();
        formData.append("name", editForm.name);
        formData.append("tvUsername", editForm.tvUsername);

        const { updateUserAction } = await import('@/app/actions');
        const res = await updateUserAction(formData);
        if (!res.success) {
            alert('Failed to save profile on server.');
        }
    };

    const cancelEditing = () => {
        setIsEditingProfile(false);
    };

    const handlePaymentSuccess = (details: any) => {
        alert(`Transaction completed by ${details.payer.name.given_name}! (Mock Success)`);

        // Update project status if this was a quote payment
        if (selectedPayment) {
            const updatedProjects = myProjects.map(p =>
                p.id === selectedPayment.id ? { ...p, status: 'In Progress' } : p
            );
            setMyProjects(updatedProjects);

            // Sync LocalStorage
            const localRequests = JSON.parse(localStorage.getItem('mock_requests') || '[]');
            const updatedLocal = localRequests.map((r: any) =>
                r.id === selectedPayment.id ? { ...r, status: 'In Progress' } : r
            );
            localStorage.setItem('mock_requests', JSON.stringify(updatedLocal));
        }

        setSelectedPayment(null);
    };

    const handleAcceptQuote = () => {
        if (!quoteToReview) return;
        setQuoteToReview(null);
        // Trigger Payment
        setSelectedPayment({ amount: quoteToReview.price, id: quoteToReview.id });
    };

    const handleDeclineQuote = () => {
        if (!quoteToReview) return;
        // Update Status to Declined
        const updatedProjects = myProjects.map(p =>
            p.id === quoteToReview.id ? { ...p, status: 'Declined' } : p
        );
        setMyProjects(updatedProjects);

        // Sync LocalStorage
        const localRequests = JSON.parse(localStorage.getItem('mock_requests') || '[]');
        const updatedLocal = localRequests.map((r: any) =>
            r.id === quoteToReview.id ? { ...r, status: 'Declined' } : r
        );
        localStorage.setItem('mock_requests', JSON.stringify(updatedLocal));

        setQuoteToReview(null);
    };

    const handleDownload = (project: any) => {
        if (!project.files || project.files.length === 0) {
            alert('No files available for download.');
            return;
        }

        project.files.forEach((fileName: string) => {
            // Simulate file content since we don't have actual storage connected
            const content = `Placeholder content for ${fileName}\n\nDelivery Message:\n${project.deliveryMessage}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // 'strategy.pine'
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    };

    // --- SUB-COMPONENTS ---

    const Sidebar = () => (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <div className={styles.logo}>PineScript<span style={{ color: 'var(--primary)' }}>Elite</span></div>
            </div>
            <nav className={styles.nav}>
                <div className={`${styles.navItem} ${activeView === 'dashboard' ? styles.navActive : ''}`} onClick={() => setActiveView('dashboard')}>
                    <span>📊</span> Dashboard
                </div>
                <div className={`${styles.navItem} ${activeView === 'requests' ? styles.navActive : ''}`} onClick={() => setActiveView('requests')}>
                    <span>📂</span> My Requests
                </div>
                <div className={`${styles.navItem} ${activeView === 'payments' ? styles.navActive : ''}`} onClick={() => setActiveView('payments')}>
                    <span>💳</span> Payments
                </div>
                <div className={`${styles.navItem} ${activeView === 'messages' ? styles.navActive : ''}`} onClick={() => setActiveView('messages')}>
                    <span>💬</span> Messages {initialProjects.some(p => {
                        const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${p.id}`);
                        return p.lastMessageAt && (!meta || meta.lastReadAt < p.lastMessageAt);
                    }) ? <span className={styles.navBadge}>●</span> : null}
                </div>
                <div className={`${styles.navItem} ${activeView === 'profile' ? styles.navActive : ''}`} onClick={() => setActiveView('profile')}>
                    <span>👤</span> Profile
                </div>
            </nav>
            <div className={styles.navItem} onClick={handleLogout} style={{ color: '#ef4444', marginTop: 'auto' }}>
                <span>🚪</span> Logout
            </div>
        </div>
    );

    const DashboardView = () => (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard Overview</h1>
                    <p className={styles.subtitle}>Welcome back, {userProfile.name}.</p>
                </div>
                <Link href="/start">
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>+ New Request</button>
                </Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Active Requests</span>
                    <span className={styles.statValue}>{myProjects.filter(p => p.status === 'In Progress' || p.status === 'New').length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Completed</span>
                    <span className={styles.statValue}>{myProjects.filter(p => p.status === 'Completed').length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pending Payment</span>
                    <span className={styles.statValue} style={{ color: '#dc2626' }}>$50.00</span>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>Recent Activity</div>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Project</th><th>Status</th><th>Update</th></tr>
                    </thead>
                    <tbody>
                        {myProjects.length === 0 ? (
                            <tr><td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No active projects. Click &quot;New Request&quot; to start!</td></tr>
                        ) : (
                            myProjects.slice(0, 5).map(p => (
                                <tr key={p.id}>
                                    <td>{p.title}</td>
                                    <td>
                                        <span className={`${styles.badge} ${p.status === 'Completed' ? styles.statusCompleted :
                                            p.status === 'In Progress' ? styles.statusActive :
                                                p.status === 'New' ? styles.statusNew :
                                                    p.status === 'Quote Sent' ? styles.statusQuote : styles.statusPayment
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {p.status === 'New' ? 'Waiting for Quote' :
                                            p.status === 'Quote Sent' ? 'Action Required' : 'In Progress'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    const RequestsView = () => (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>My Requests</h1>
                <Link href="/start">
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>+ New Request</button>
                </Link>
            </div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myProjects.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.title}</td>
                                <td>{p.type}</td>
                                <td>{p.price}</td>
                                <td>
                                    <span className={`${styles.badge} ${p.status === 'Completed' ? styles.statusCompleted :
                                        p.status === 'In Progress' ? styles.statusActive :
                                            p.status === 'New' ? styles.statusNew :
                                                p.status === 'Quote Sent' ? styles.statusQuote : styles.statusPayment
                                        }`}>{p.status}</span>
                                </td>
                                <td>
                                    {p.status === 'Quote Sent' ? (
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#eab308', borderColor: '#eab308' }}
                                            onClick={() => setQuoteToReview(p)}
                                        >
                                            Review
                                        </button>
                                    ) : p.status === 'Completed' ? (
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#16a34a', borderColor: '#16a34a' }}
                                            onClick={() => handleDownload(p)}
                                        >
                                            Download
                                        </button>
                                    ) : (
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline}`}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                            onClick={() => setViewingProject(p)}
                                        >
                                            View
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    const PaymentsView = () => (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Payments & Invoices</h1>
            </div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Date</th>
                            <th>Project</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myPayments.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No payment history available.</td></tr>
                        ) : (
                            myPayments.map((p: any) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.date}</td>
                                    <td>{p.project}</td>
                                    <td>{p.amount}</td>
                                    <td><span className={`${styles.badge} ${styles.statusActive}`}>{p.status}</span></td>
                                    <td><span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Receipt</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    const MessagesView = () => {
        const [selectedChatId, setSelectedChatId] = useState('general');

        // Combine "General Support" with user projects for the chat list
        const chatList = [
            { id: 'general', title: 'General Support', status: 'Online' },
            ...(myProjects || []).map(p => ({
                id: p.id,
                title: p.title || 'Untitled Project',
                status: p.status
            }))
        ];

        const activeChat = chatList.find(c => c.id === selectedChatId) || chatList[0];

        return (
            <>
                <div className={styles.header}>
                    <h1 className={styles.title}>Messages</h1>
                </div>
                <div className={styles.chatLayout}>
                    {/* Chat Sidebar */}
                    <div className={styles.chatSidebar}>
                        <div className={styles.chatSidebarHeader}>
                            Conversations
                        </div>
                        <div className={styles.chatSidebarList}>
                            {chatList.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className={`${styles.chatSidebarItem} ${selectedChatId === chat.id ? styles.chatSidebarItemActive : ''}`}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: '#1e293b', fontWeight: 500, fontSize: '0.9rem', marginBottom: '4px' }}>{chat.title}</div>
                                        {chat.id !== 'general' && (initialProjects.find(p => p.id === chat.id)?.lastMessageAt > (initialChatMetas.find(m => m.SK === `CHATMETA#${chat.id}`)?.lastReadAt || '')) && (
                                            <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{chat.id === 'general' ? 'Support' : chat.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={styles.chatContent}>
                        <div className={styles.chatContentHeader}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeChat.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {activeChat.id}</span>
                        </div>
                        <div className={styles.chatContentBody}>
                            <ChatInterface
                                chatId={selectedChatId}
                                chatTitle={activeChat.title}
                                currentUserEmail={userProfile.email}
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const ProfileView = () => (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>My Profile</h1>
                {!isEditingProfile && (
                    <button className={`${styles.btn} ${styles.btnOutline}`} onClick={startEditing}>
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            <div className={styles.card} style={{ maxWidth: '600px', padding: '24px' }}>
                {isEditingProfile ? (
                    // --- EDIT MODE ---
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={editForm.email}
                                disabled
                                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>TradingView Username</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={editForm.tvUsername}
                                onChange={(e) => setEditForm({ ...editForm, tvUsername: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveProfile}>Save Changes</button>
                            <button className={`${styles.btn} ${styles.btnOutline}`} onClick={cancelEditing}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    // --- VIEW MODE ---
                    <div>
                        <div className={styles.formGroup}>
                            <div className={styles.label}>Full Name</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#1e293b' }}>{userProfile.name}</div>
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                            <div className={styles.label}>Email Address</div>
                            <div style={{ fontSize: '1.1rem', color: '#334155' }}>{userProfile.email}</div>
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                            <div className={styles.label}>TradingView Username</div>
                            <div style={{ fontSize: '1.1rem', color: '#334155' }}>{userProfile.tvUsername}</div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    const ProjectDetailModal = ({ project, onClose }: { project: any, onClose: () => void }) => (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className={styles.card} style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                <div className={styles.cardHeader}>
                    <span>Request Details</span>
                    <button className={styles.btnOutline} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.label}>Status</div>
                        <span className={`${styles.badge} ${project.status === 'Completed' ? styles.statusCompleted :
                            project.status === 'In Progress' ? styles.statusActive :
                                project.status === 'New' ? styles.statusNew : styles.statusQuote
                            }`}>{project.status}</span>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div className={styles.label}>Title</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b' }}>{project.title}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <div className={styles.label}>Type</div>
                            <div style={{ fontWeight: 500 }}>{project.type}</div>
                        </div>
                        <div>
                            <div className={styles.label}>Budget</div>
                            <div style={{ fontWeight: 500 }}>{project.budget || 'N/A'}</div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <div className={styles.label}>Description</div>
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                            {project.description || 'No description provided.'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {project.status === 'Quote Sent' && (
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setQuoteToReview(project); onClose(); }}>
                                Review Quote
                            </button>
                        )}
                        <button className={`${styles.btn} ${styles.btnOutline}`} style={{ flex: 1 }} onClick={() => { setActiveView('messages'); onClose(); }}>
                            Messages
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                {activeView === 'dashboard' && <DashboardView />}
                {activeView === 'requests' && <RequestsView />}
                {activeView === 'payments' && <PaymentsView />}
                {activeView === 'messages' && <MessagesView />}
                {activeView === 'profile' && <ProfileView />}

                {viewingProject && (
                    <ProjectDetailModal
                        project={viewingProject}
                        onClose={() => setViewingProject(null)}
                    />
                )}

                {/* Quote Review Modal */}
                {quoteToReview && (
                    <QuoteReviewModal
                        request={quoteToReview}
                        onClose={() => setQuoteToReview(null)}
                        onAccept={handleAcceptQuote}
                        onDecline={handleDeclineQuote}
                    />
                )}

                {/* Payment Modal */}
                {selectedPayment && (
                    <PaymentModal
                        amount={selectedPayment.amount}
                        invoiceId={selectedPayment.id}
                        onClose={() => setSelectedPayment(null)}
                        onSuccess={handlePaymentSuccess}
                    />
                )}
            </div>
        </div>
    );
}
