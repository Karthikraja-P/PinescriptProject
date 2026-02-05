'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import ChatInterface from '@/components/ChatInterface';
import QuoteReviewModal from '@/components/QuoteReviewModal';
import DeliveryReviewModal from '@/components/DeliveryReviewModal';
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
    const [projectToReview, setProjectToReview] = useState<any>(null);
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
        alert(`Payment successful! Order ID: ${details.id}. Your project status has been updated.`);

        // Refresh server data
        router.refresh();
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

        project.files.forEach((file: any) => {
            const link = document.createElement('a');
            // Assuming .pine files are text, using proper mime type or generic data URL
            link.href = `data:application/octet-stream;base64,${file.data}`;
            link.download = file.name;
            link.click();
        });
    };

    const handleAcceptDelivery = async () => {
        if (!projectToReview) return;

        const { acceptDeliveryAction } = await import('@/app/actions');
        const res = await acceptDeliveryAction(projectToReview.id);

        if (res.success) {
            alert("Project accepted and completed!");
            router.refresh();
            setProjectToReview(null);
        } else {
            alert("Failed to accept delivery.");
        }
    };

    const handleRequestRevision = async (reason: string) => {
        if (!projectToReview) return;

        const { requestRevisionAction } = await import('@/app/actions');
        const res = await requestRevisionAction(projectToReview.id, reason);

        if (res.success) {
            alert("Revision requested.");
            router.refresh();
            setProjectToReview(null);
        } else {
            alert("Failed to request revision.");
        }
    };

    const handleDownloadReview = (file: any) => {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${file.data}`;
        link.download = file.name;
        link.click();
    };

    // --- SUB-COMPONENTS ---

    // Check if there are unread messages (from admin to client)
    const hasUnreadMessages = () => {
        return (initialProjects || []).some(p => {
            const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${p.id}`);
            // Check if there's a new message from someone other than the current user
            return p.lastMessageAt && p.lastMessageSender && p.lastMessageSender !== userProfile.email &&
                (!meta || meta.lastReadAt < p.lastMessageAt);
        });
    };

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
                    <span>💬</span> Messages
                    {hasUnreadMessages() && (
                        <span style={{
                            marginLeft: '8px',
                            width: '10px',
                            height: '10px',
                            background: '#ef4444',
                            borderRadius: '50%',
                            display: 'inline-block'
                        }}></span>
                    )}
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
                                            Review Quote
                                        </button>
                                    ) : p.status === 'Delivered' ? (
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#3b82f6', borderColor: '#3b82f6' }}
                                            onClick={() => setProjectToReview(p)}
                                        >
                                            Review Delivery
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

        // Helper to check if a chat has unread messages from developer
        const hasUnreadFromDeveloper = (chatId: string) => {
            if (chatId.startsWith('SUPPORT_')) return false; // Support chat handling could be added later
            const project = (initialProjects || []).find((p: any) => p.id === chatId);
            if (!project || !project.lastMessageAt) return false;
            // Only show unread if the last message was from someone else (developer)
            if (project.lastMessageSender === userProfile.email) return false;
            const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${chatId}`);
            return !meta || meta.lastReadAt < project.lastMessageAt;
        };

        // Combine "General Support" with user projects for the chat list
        const supportId = `SUPPORT_${userProfile.email}`;
        const chatList = [
            { id: supportId, title: 'General Support', status: 'Online', hasUnread: false },
            ...(myProjects || []).map(p => ({
                id: p.id,
                title: p.title || 'Untitled Project',
                status: p.status,
                hasUnread: hasUnreadFromDeveloper(p.id)
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
                                        <div style={{
                                            color: '#1e293b',
                                            fontWeight: chat.hasUnread ? 700 : 500,
                                            fontSize: '0.9rem',
                                            marginBottom: '4px'
                                        }}>
                                            {chat.title}
                                        </div>
                                        {chat.hasUnread && (
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                background: '#ef4444',
                                                borderRadius: '50%',
                                                flexShrink: 0
                                            }}></span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{chat.id.startsWith('SUPPORT_') ? 'Support' : chat.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={styles.chatContent}>
                        <div className={styles.chatContentHeader}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeChat.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Chat with Developer</span>
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
                    {project.attachments && project.attachments.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div className={styles.label}>Attachments</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {project.attachments.map((file: any, i: number) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `data:${file.type};base64,${file.data}`;
                                            link.download = file.name;
                                            link.click();
                                        }}
                                        style={{
                                            background: '#f1f5f9',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            border: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        📎 {file.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

                {/* Delivery Review Modal */}
                {projectToReview && (
                    <DeliveryReviewModal
                        project={projectToReview}
                        onClose={() => setProjectToReview(null)}
                        onAccept={handleAcceptDelivery}
                        onRequestRevision={handleRequestRevision}
                        onDownload={handleDownloadReview}
                    />
                )}
            </div>
        </div>
    );
}
