'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuoteModal from '@/components/QuoteModal';
import DeliverProjectModal from '@/components/DeliverProjectModal';
import ChatInterface from '@/components/ChatInterface';
import styles from './dev.module.css';

// --- MOCK DATA ---
const mockStats = [
    { title: 'New Enquiries', value: 12 },
    { title: 'Active Projects', value: 5 },
    { title: 'Pending Payments', value: '$450' },
    { title: 'Monthly Revenue', value: '$3,200' },
];

const mockEnquiries = [
    { id: 'ENQ-001', client: 'John Doe', type: 'Strategy', date: 'Jan 24', status: 'New' },
    { id: 'ENQ-002', client: 'Alice Smith', type: 'Indicator', date: 'Jan 23', status: 'Quote Sent' },
];

const mockProjects = [
    { id: 'PRJ-101', title: 'MACD Pro', client: 'Mike Ross', deadline: 'Jan 30', status: 'In Progress' },
    { id: 'PRJ-099', title: 'RSI Alert', client: 'Sarah', deadline: 'Jan 28', status: 'Awaiting Payment' },
];

export default function AdminDashboard() {
    const [activeView, setActiveView] = useState('dashboard');
    const [notifications, setNotifications] = useState(0);
    const [enquiries, setEnquiries] = useState(mockEnquiries);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [projectToDeliver, setProjectToDeliver] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Load simulated requests from LocalStorage
        const localRequests = JSON.parse(localStorage.getItem('mock_requests') || '[]');
        const count = JSON.parse(localStorage.getItem('admin_notifications') || '0');

        if (localRequests.length > 0) {
            // Map LS format to Table format if needed, though structure is similar
            const formatted = localRequests.map((r: any) => ({
                id: r.id,
                client: r.client,
                type: r.type,
                date: r.date,
                status: r.status
            }));

            // Merge with static mocks (preventing duplicates in a real app, but ok for now)
            setEnquiries([...formatted, ...mockEnquiries]);
            setNotifications(count);
        }
    }, []);

    const handleLogout = () => router.push('/');

    const handleSendQuote = (quoteData: { price: string, deadline: string, notes: string }) => {
        // 1. Update Local State
        const updatedEnquiries = enquiries.map(e =>
            e.id === selectedEnquiry.id ? { ...e, status: 'Quote Sent' } : e
        );
        setEnquiries(updatedEnquiries);

        // 2. Persist to LocalStorage (Update the mock_requests array)
        const localRequests = JSON.parse(localStorage.getItem('mock_requests') || '[]');
        const updatedRequests = localRequests.map((r: any) =>
            r.id === selectedEnquiry.id
                ? { ...r, status: 'Quote Sent', price: `$${quoteData.price}`, deadline: quoteData.deadline }
                : r
        );
        localStorage.setItem('mock_requests', JSON.stringify(updatedRequests));

        // 3. Clear Selection
        setSelectedEnquiry(null);
        alert(`Quote sent for ${selectedEnquiry.id}!`);
    };

    const handleDeliverProject = (files: string[], message: string) => {
        // 1. Update Local State
        const updatedEnquiries = enquiries.map(e =>
            e.id === projectToDeliver.id ? { ...e, status: 'Completed' } : e
        );
        setEnquiries(updatedEnquiries);

        // 2. Persist to LocalStorage
        const localRequests = JSON.parse(localStorage.getItem('mock_requests') || '[]');
        const updatedRequests = localRequests.map((r: any) =>
            r.id === projectToDeliver.id
                ? { ...r, status: 'Completed', files: files, deliveryMessage: message }
                : r
        );
        localStorage.setItem('mock_requests', JSON.stringify(updatedRequests));

        // 3. Clear Selection
        setProjectToDeliver(null);
        alert(`Project ${projectToDeliver.id} marked as Completed!`);
    };

    // --- SUB-COMPONENTS ---
    const Sidebar = () => (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <div className={styles.logo}>PineScript<span style={{ color: 'var(--primary)' }}>Dev</span></div>
            </div>
            <nav className={styles.nav}>
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                    { id: 'enquiries', label: 'Enquiries', icon: '📩', badge: notifications },
                    { id: 'projects', label: 'Projects', icon: '🚀' },
                    { id: 'payments', label: 'Payments', icon: '💰' },
                    { id: 'clients', label: 'Clients', icon: '👥' },
                    { id: 'messages', label: 'Messages', icon: '💬' },
                    { id: 'reports', label: 'Reports', icon: '📈' },
                    { id: 'settings', label: 'Settings', icon: '⚙️' },
                ].map(item => (
                    <div
                        key={item.id}
                        className={`${styles.navItem} ${activeView === item.id ? styles.navActive : ''}`}
                        onClick={() => {
                            setActiveView(item.id);
                            if (item.id === 'enquiries') {
                                setNotifications(0); // Clear notifications on view
                                localStorage.setItem('admin_notifications', '0');
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span>{item.icon}</span> {item.label}
                        </div>
                        {item.badge ? (
                            <span className={styles.navBadge}>
                                {item.badge}
                            </span>
                        ) : null}
                    </div>
                ))}
            </nav>
            <div className={styles.navItem} onClick={handleLogout} style={{ color: '#ef4444', marginTop: 'auto' }}>
                <span>🚪</span> Logout
            </div>
        </div>
    );

    // VIEW: Dashboard Overview
    const DashboardView = () => (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Developer Overview</h1>
                    <p className={styles.subtitle}>Welcome back, Admin.</p>
                </div>
            </div>
            <div className={styles.statsGrid}>
                {mockStats.map((s, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statTitle}>{s.title}</div>
                        <div className={styles.statValue}>{i === 0 ? enquiries.length : s.value}</div>
                    </div>
                ))}
            </div>
            {/* Quick Enquiries Table */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span>Recent Enquiries</span>
                    <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setActiveView('enquiries')}>View All</button>
                </div>
                <table className={styles.table}>
                    <thead><tr><th>Client</th><th>Type</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {enquiries.slice(0, 5).map(e => (
                            <tr key={e.id}>
                                <td>{e.client}</td><td>{e.type}</td><td>{e.date}</td>
                                <td><span className={`${styles.badge} ${e.status === 'New' ? styles.statusNew : styles.statusQuote}`}>{e.status}</span></td>
                                <td>
                                    <button
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        onClick={() => {
                                            setActiveView('enquiries');
                                            // Ideally we'd scroll to the item or filter, but bridging to view is good for now
                                        }}
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    // VIEW: Enquiries
    const EnquiriesView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>Enquiry Management</h1></div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead><tr><th>ID</th><th>Client</th><th>Type</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {enquiries.map(e => (
                            <tr key={e.id}>
                                <td>{e.id}</td><td>{e.client}</td><td>{e.type}</td><td>{e.date}</td>
                                <td><span className={styles.badge}>{e.status}</span></td>
                                <td>
                                    {e.status === 'New' ? (
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline}`}
                                            style={{ marginRight: '8px' }}
                                            onClick={() => setSelectedEnquiry(e)}
                                        >
                                            Quote
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '8px' }}>Action Taken</span>
                                    )}
                                    <button className={`${styles.btn} ${styles.btnOutline}`}>Reject</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    // VIEW: Projects
    const ProjectsView = () => {
        const activeProjects = enquiries.filter(e => e.status === 'In Progress' || e.status === 'Completed');

        return (
            <>
                <div className={styles.header}><h1 className={styles.title}>Active Projects</h1></div>
                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead><tr><th>ID</th><th>Client</th><th>Type</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {activeProjects.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No active projects yet.</td></tr>
                            ) : (
                                activeProjects.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.id}</td><td>{p.client}</td><td>{p.type}</td><td>{p.deadline || 'TBD'}</td>
                                        <td>
                                            <span className={`${styles.badge} ${p.status === 'Completed' ? styles.statusCompleted : styles.statusActive}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>
                                            {p.status === 'In Progress' && (
                                                <button
                                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                                    style={{ background: '#16a34a' }}
                                                    onClick={() => setProjectToDeliver(p)}
                                                >
                                                    Deliver
                                                </button>
                                            )}
                                            {p.status === 'Completed' && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Delivered</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    // VIEW: Messages with Project Context
    const MessagesView = () => {
        const [selectedChatId, setSelectedChatId] = useState('general');

        // Admin sees all projects that are not 'New' (i.e., real interactions)
        const chatList = [
            { id: 'general', title: 'General Support' },
            ...enquiries.filter(e => e.status !== 'New').map(e => ({
                id: e.id,
                title: `${e.client} - ${e.type}`
            }))
        ];

        const activeChat = chatList.find(c => c.id === selectedChatId) || chatList[0];

        return (
            <>
                <div className={styles.header}><h1 className={styles.title}>Client Messages</h1></div>
                <div className={styles.chatLayout}>
                    {/* Chat Sidebar */}
                    <div className={styles.chatSidebar}>
                        <div className={styles.chatSidebarHeader}>
                            Recent Conversations
                        </div>
                        <div className={styles.chatSidebarList}>
                            {chatList.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className={`${styles.chatSidebarItem} ${selectedChatId === chat.id ? styles.chatSidebarItemActive : ''}`}
                                >
                                    <div style={{ color: '#1e293b', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2px' }}>{chat.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{chat.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={styles.chatContent}>
                        <div className={styles.chatContentHeader}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeChat.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Chat ID: {activeChat.id}</span>
                        </div>
                        <div className={styles.chatContentBody}>
                            <ChatInterface chatId={selectedChatId} chatTitle={activeChat.title} />
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // VIEW: Settings
    const SettingsView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>System Settings</h1></div>
            <div className={styles.formSection}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>PayPal API Key</label>
                    <input className={styles.input} type="password" defaultValue="sk_test_12345" />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Admin Email</label>
                    <input className={styles.input} defaultValue="admin@pinescript.com" />
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>Save Configuration</button>
            </div>
        </>
    );

    // Placeholder for simple views
    const PlaceholderView = ({ title }: { title: string }) => (
        <>
            <div className={styles.header}><h1 className={styles.title}>{title}</h1></div>
            <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No data available yet.
            </div>
        </>
    );

    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                {activeView === 'dashboard' && <DashboardView />}
                {activeView === 'enquiries' && <EnquiriesView />}
                {activeView === 'projects' && <ProjectsView />}
                {activeView === 'payments' && <PlaceholderView title="Payment Transactions" />}
                {activeView === 'clients' && <PlaceholderView title="Client Management" />}
                {activeView === 'messages' && <MessagesView />}
                {activeView === 'reports' && <PlaceholderView title="Revenue Reports" />}
                {activeView === 'settings' && <SettingsView />}

                {selectedEnquiry && (
                    <QuoteModal
                        requestId={selectedEnquiry.id}
                        clientName={selectedEnquiry.client}
                        onClose={() => setSelectedEnquiry(null)}
                        onSendQuote={handleSendQuote}
                    />
                )}

                {projectToDeliver && (
                    <DeliverProjectModal
                        project={projectToDeliver}
                        onClose={() => setProjectToDeliver(null)}
                        onDeliver={handleDeliverProject}
                    />
                )}
            </div>
        </div>
    );
}
