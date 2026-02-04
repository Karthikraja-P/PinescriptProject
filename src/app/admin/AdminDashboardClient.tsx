'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuoteModal from '@/components/QuoteModal';
import DeliverProjectModal from '@/components/DeliverProjectModal';
import ChatInterface from '@/components/ChatInterface';
import styles from './dev.module.css';

interface AdminDashboardClientProps {
    initialEnquiries: any[];
    initialSupportChats: any[];
    initialContactMessages: any[];
    initialChatMetas: any[];
    initialUsers?: any[];
    initialPayments?: any[];
    currentUserEmail: string;
}

// --- STATS CALCULATION ---
interface Stats {
    revenue: number;
    pending: number;
    active: number;
    completed: number;
}

export default function AdminDashboard({ initialEnquiries, initialSupportChats, initialContactMessages, initialChatMetas, initialUsers = [], initialPayments = [], currentUserEmail }: AdminDashboardClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [payments, setPayments] = useState(initialPayments);
    const [activeView, setActiveView] = useState('dashboard');
    const [notifications, setNotifications] = useState(0);
    const [enquiries, setEnquiries] = useState(initialEnquiries);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [viewingEnquiry, setViewingEnquiry] = useState<any>(null); // For detail view
    const [projectToDeliver, setProjectToDeliver] = useState<any>(null);
    const router = useRouter();

    const [stats, setStats] = useState<Stats>({ revenue: 0, pending: 0, active: 0, completed: 0 });

    useEffect(() => {
        // Calculate Stats from Enquiries
        // Ideally these should come calculated from Server prop 'initialStats'
        // But we can approximate for now
        let revenue = 0;
        let pending = 0;
        let active = 0;
        let completed = 0;

        initialEnquiries.forEach(e => {
            if (e.status === 'Completed' || e.status === 'In Progress') {
                // Approximate revenue parsing
                if (e.quote?.amount) {
                    revenue += parseFloat(e.quote.amount) || 0;
                }
            }
            if (e.status === 'In Progress') active++;
            if (e.status === 'Completed') completed++;
            if (e.status === 'Quote Sent') pending++;
        });

        setStats({
            revenue,
            pending,
            active,
            completed
        });

        setEnquiries(initialEnquiries);
    }, [initialEnquiries]);

    const handleLogout = () => router.push('/');

    const handleSendQuote = async (quoteData: { price: string, deadline: string, notes: string }) => {
        if (!selectedEnquiry) return;

        // 1. Call Server Action
        const { submitQuote } = await import("@/app/admin-actions");
        const numericPrice = quoteData.price.replace(/[^0-9.]/g, ''); // Ensure clean number

        const result = await submitQuote({
            projectId: selectedEnquiry.id,
            userId: selectedEnquiry.userId || "", // Should come from DB
            userEmail: selectedEnquiry.userEmail || "", // We need to fetch this or store it in Project
            amount: numericPrice,
            currency: "USD",
            deadline: quoteData.deadline,
            notes: quoteData.notes
        });

        if (result.error) {
            alert("Failed to send quote: " + result.error);
            return;
        }

        // 2. Update Local State (Optimistic)
        const updatedEnquiries = enquiries.map(e =>
            e.id === selectedEnquiry.id ? { ...e, status: 'Quote Sent' } : e
        );
        setEnquiries(updatedEnquiries);

        // 3. Clear Selection
        setSelectedEnquiry(null);
        alert(`Quote sent successfully!`);
    };

    const handleDeliverProject = async (files: { name: string; data: string }[], message: string) => {
        if (!projectToDeliver) return;

        // 1. Call Server Action
        const { deliverProjectAction } = await import("@/app/admin-actions");
        const result = await deliverProjectAction({
            projectId: projectToDeliver.id,
            userId: projectToDeliver.userId,
            userEmail: projectToDeliver.userEmail,
            files: files,
            message: message
        });

        if (result.error) {
            alert("Failed to deliver project: " + result.error);
            return;
        }

        // 2. Update Local State (Optimistic)
        const updatedEnquiries = enquiries.map(e =>
            e.id === projectToDeliver.id ? { ...e, status: 'Completed', files, deliveryMessage: message } : e
        );
        setEnquiries(updatedEnquiries);

        // 3. Clear Selection
        setProjectToDeliver(null);
        alert(`Project ${projectToDeliver.id} marked as Completed!`);
    };

    const handleRejectEnquiry = async (enquiry: any) => {
        if (!window.confirm("Are you sure you want to reject this project enquiry?")) return;

        const reason = window.prompt("Reason for rejection (Optional):") || undefined;

        // 1. Call Server Action
        const { rejectEnquiryAction } = await import("@/app/admin-actions");
        const result = await rejectEnquiryAction({
            projectId: enquiry.id,
            userId: enquiry.userId || "",
            userEmail: enquiry.userEmail || "",
            reason
        });

        if (result.error) {
            alert("Failed to reject enquiry: " + result.error);
            return;
        }

        // 2. Update Local State (Optimistic)
        const updatedEnquiries = enquiries.map(e =>
            e.id === enquiry.id ? { ...e, status: 'Declined' } : e
        );
        setEnquiries(updatedEnquiries);
        setViewingEnquiry(null);

        alert(`Project ${enquiry.id} rejected.`);
    };

    // Check if there are unread messages (from clients to admin)
    const hasUnreadMessages = () => {
        // Check support chats
        const unreadSupport = initialSupportChats.some(c => {
            const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${c.id}`);
            return c.lastMessageAt && c.lastMessageSender !== currentUserEmail && (!meta || meta.lastReadAt < c.lastMessageAt);
        });

        // Check project chats
        const unreadProjects = initialEnquiries.some(e => {
            const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${e.id}`);
            return e.lastMessageAt && e.lastMessageSender !== currentUserEmail && (!meta || meta.lastReadAt < e.lastMessageAt);
        });

        return unreadSupport || unreadProjects;
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
                    { id: 'enquiries', label: 'Enquiries', icon: '📩', badge: initialEnquiries.filter(e => e.status === 'New').length },
                    { id: 'contact', label: 'Contacts', icon: '📇', badge: initialContactMessages.length },
                    { id: 'projects', label: 'Projects', icon: '🚀' },
                    { id: 'payments', label: 'Payments', icon: '💰' },
                    { id: 'clients', label: 'Clients', icon: '👥' },
                    {
                        id: 'messages',
                        label: 'Messages',
                        icon: '💬',
                        badge: hasUnreadMessages() ? '●' : null,
                        badgeColor: hasUnreadMessages() ? '#ef4444' : undefined // Red color for unread
                    },
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
                            <span
                                className={styles.navBadge}
                                style={(item as any).badgeColor ? { backgroundColor: (item as any).badgeColor, color: 'white' } : {}}
                            >
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
                <div className={styles.statCard}>
                    <div className={styles.statTitle}>New Enquiries</div>
                    <div className={styles.statValue}>{enquiries.filter(e => e.status === 'New').length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statTitle}>Active Projects</div>
                    <div className={styles.statValue}>{stats.active}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statTitle}>Pending Quotes</div>
                    <div className={styles.statValue}>{stats.pending}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statTitle}>Appx Revenue</div>
                    <div className={styles.statValue}>${stats.revenue.toLocaleString()}</div>
                </div>
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
                                            setViewingEnquiry(e);
                                        }}
                                    >
                                        View Details
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
                        {enquiries.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No enquiries found.</td></tr>
                        ) : (
                            enquiries.map(e => (
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
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            style={{ marginRight: '8px' }}
                                            onClick={() => setViewingEnquiry(e)}
                                        >
                                            Open
                                        </button>
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline}`}
                                            onClick={() => handleRejectEnquiry(e)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
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
                                <tr><td colSpan={6} className={styles.noData}>No active projects yet.</td></tr>
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
        // Admin sees all projects that are not 'New' (i.e., real interactions)
        // Also include support chats
        const chatList = [
            // Include General Support Chats from initialSupportChats
            ...(initialSupportChats || []).map(c => {
                const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${c.id}`);
                const hasUnread = c.lastMessageAt && c.lastMessageSender !== currentUserEmail &&
                    (!meta || meta.lastReadAt < c.lastMessageAt);
                return {
                    id: c.id,
                    title: c.clientName || c.client || 'Client',
                    subtitle: 'Support Chat',
                    userEmail: c.userEmail,
                    hasUnread,
                    lastMessageAt: c.lastMessageAt
                };
            }),
            // Include projects with ongoing conversations
            ...enquiries.filter(e => e.status !== 'New' && e.status !== 'SUBMITTED').map(e => {
                const meta = initialChatMetas.find((m: any) => m.SK === `CHATMETA#${e.id}`);
                const hasUnread = e.lastMessageAt && e.lastMessageSender !== currentUserEmail &&
                    (!meta || meta.lastReadAt < e.lastMessageAt);
                return {
                    id: e.id,
                    title: e.clientName || e.client || e.userEmail?.split('@')[0] || 'Client',
                    subtitle: e.type || 'Project',
                    userEmail: e.userEmail,
                    hasUnread,
                    lastMessageAt: e.lastMessageAt
                };
            })
        ];

        // Sort by last message time (most recent first)
        chatList.sort((a, b) => {
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return b.lastMessageAt.localeCompare(a.lastMessageAt);
        });

        // Initialize with the first valid chat, not 'general'
        const [selectedChatId, setSelectedChatId] = useState(chatList.length > 0 ? chatList[0].id : '');

        const activeChat = chatList.find(c => c.id === selectedChatId) || chatList[0];

        // Handle empty chat list
        if (chatList.length === 0) {
            return (
                <>
                    <div className={styles.header}><h1 className={styles.title}>Client Messages</h1></div>
                    <div className={styles.card} style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                            No Conversations Yet
                        </div>
                        <div style={{ color: '#64748b' }}>
                            Messages will appear here once clients start projects or support chats.
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className={styles.header}><h1 className={styles.title}>Client Messages</h1></div>
                <div className={styles.chatLayout}>
                    {/* Chat Sidebar */}
                    <div className={styles.chatSidebar}>
                        <div className={styles.chatSidebarHeader}>
                            Clients ({chatList.length})
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
                                            marginBottom: '2px'
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
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{chat.subtitle}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={styles.chatContent}>
                        <div className={styles.chatContentHeader}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{activeChat?.title || 'Select a conversation'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{activeChat?.id ? `Chat ID: ${activeChat.id}` : ''}</span>
                        </div>
                        <div className={styles.chatContentBody}>
                            {activeChat && selectedChatId ? (
                                <ChatInterface
                                    chatId={selectedChatId}
                                    chatTitle={activeChat.title}
                                    currentUserEmail={currentUserEmail}
                                />
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                    Select a conversation to start messaging
                                </div>
                            )}
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

    // VIEW: Reports
    const ReportsView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>Performance Reports</h1></div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className={styles.statTitle}>Total Revenue</div>
                    <div className={styles.statValue} style={{ color: '#16a34a' }}>${stats.revenue.toLocaleString()}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lifetime Earnings</span>
                </div>
                <div className={styles.statCard} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className={styles.statTitle}>Conversion Rate</div>
                    <div className={styles.statValue}>
                        {enquiries.length > 0 ? ((stats.active + stats.completed) / enquiries.length * 100).toFixed(1) : 0}%
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Projects / Enquiries</span>
                </div>
                <div className={styles.statCard} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className={styles.statTitle}>Avg Project Value</div>
                    <div className={styles.statValue}>
                        ${(stats.active + stats.completed) > 0 ? (stats.revenue / (stats.active + stats.completed)).toFixed(0) : 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Per Paid Project</span>
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: '20px' }}>
                <div className={styles.cardHeader}>Monthly Breakdown (Simulated)</div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 0', borderBottom: '1px solid #e2e8f0' }}>
                    {/* CSS Bar Chart */}
                    {[45, 60, 35, 80, 50, 90, 100].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '100%',
                                height: `${h}%`,
                                backgroundColor: i === 6 ? '#3b82f6' : '#cbd5e1',
                                borderRadius: '4px',
                                transition: 'height 0.3s'
                            }}></div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '20px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                    Showing accurate revenue requires aggregating actual payment records from database.
                </div>
            </div>
        </>
    );

    // VIEW: Contact Form Messages
    const ContactView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>Contact Form Messages</h1></div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead><tr><th>Email</th><th>Message</th><th>Date</th></tr></thead>
                    <tbody>
                        {initialContactMessages.length === 0 ? (
                            <tr><td colSpan={3} className={styles.noData}>No messages received yet.</td></tr>
                        ) : (
                            initialContactMessages.map((m, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{m.email}</td>
                                    <td>{m.message}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    // Detail Modal for Enquiry
    const EnquiryDetailModal = ({ enquiry, onClose }: { enquiry: any, onClose: () => void }) => (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className={styles.card} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '0' }}>
                <div className={styles.cardHeader}>
                    <span>Project Enquiry Detail</span>
                    <button className={styles.btnOutline} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Status</div>
                        <span className={`${styles.badge} ${enquiry.status === 'New' ? styles.statusNew : styles.statusQuote}`}>{enquiry.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Client Email</div>
                            <div style={{ fontWeight: 500 }}>{enquiry.userEmail}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Project Type</div>
                            <div style={{ fontWeight: 500 }}>{enquiry.type}</div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Title</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{enquiry.title || 'Untitled Request'}</div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Description</div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {enquiry.description || initialEnquiries.find(e => e.id === enquiry.id)?.description || 'No description provided.'}
                        </div>
                    </div>

                    {enquiry.attachments && enquiry.attachments.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Attachments</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {enquiry.attachments.map((file: any, i: number) => (
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

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        {enquiry.status === 'New' ? (
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setSelectedEnquiry(enquiry); onClose(); }}>
                                Send Quote
                            </button>
                        ) : null}
                        <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => { setActiveView('messages'); setSelectedEnquiry(null); onClose(); }}>
                            Open Chat
                        </button>
                        <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => handleRejectEnquiry(enquiry)}>Reject</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // VIEW: Clients
    const ClientsView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>Client Management</h1></div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>TV Username</th>
                            <th>Joined Date</th>
                            <th>Projects</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={5} className={styles.noData}>No clients found.</td></tr>
                        ) : (
                            users.map((u: any, i: number) => {
                                const userProjects = enquiries.filter(e => e.userEmail === u.email);
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{u.name || 'N/A'}</td>
                                        <td>{u.email}</td>
                                        <td>{u.tvUsername || 'Not linked'}</td>
                                        <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        <td>{userProjects.length}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    // VIEW: Payments
    const PaymentsView = () => (
        <>
            <div className={styles.header}><h1 className={styles.title}>Payment History</h1></div>
            <div className={styles.card}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Project ID</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan={6} className={styles.noData}>No payments recorded.</td></tr>
                        ) : (
                            payments.map((p: any, i: number) => (
                                <tr key={i}>
                                    <td>{p.orderId}</td>
                                    <td>{p.projectId}</td>
                                    <td>{p.userEmail}</td>
                                    <td style={{ fontWeight: 600, color: '#16a34a' }}>${p.amount} {p.currency}</td>
                                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td><span className={`${styles.badge} ${styles.statusCompleted}`}>{p.status}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    // Placeholder for simple views
    const PlaceholderView = ({ title }: { title: string }) => (
        <>
            <div className={styles.header}><h1 className={styles.title}>{title}</h1></div>
            <div className={`${styles.card} ${styles.noData}`}>
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
                {activeView === 'payments' && <PaymentsView />}
                {activeView === 'clients' && <ClientsView />}
                {activeView === 'messages' && <MessagesView />}
                {activeView === 'contact' && <ContactView />}
                {activeView === 'reports' && <ReportsView />}
                {activeView === 'settings' && <SettingsView />}

                {viewingEnquiry && (
                    <EnquiryDetailModal
                        enquiry={viewingEnquiry}
                        onClose={() => setViewingEnquiry(null)}
                    />
                )}

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
