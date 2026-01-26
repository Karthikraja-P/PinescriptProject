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
    currentUserEmail: string;
}

// --- STATS CALCULATION ---
interface Stats {
    revenue: number;
    pending: number;
    active: number;
    completed: number;
}

export default function AdminDashboard({ initialEnquiries, initialSupportChats, currentUserEmail }: AdminDashboardClientProps) {
    const [activeView, setActiveView] = useState('dashboard');
    const [notifications, setNotifications] = useState(0);
    const [enquiries, setEnquiries] = useState(initialEnquiries);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
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
            if (e.status === 'Completed' || e.status === 'IN_PROGRESS') {
                // Approximate revenue parsing
                if (e.quote?.amount) {
                    revenue += parseFloat(e.quote.amount) || 0;
                }
            }
            if (e.status === 'In Progress') active++;
            if (e.status === 'Completed') completed++;
            if (e.status === 'QUOTED') pending++;
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

    const handleDeliverProject = async (files: string[], message: string) => {
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
                <div className={styles.statCard}>
                    <div className={styles.statTitle}>New Enquiries</div>
                    <div className={styles.statValue}>{enquiries.filter(e => e.status === 'New' || e.status === 'SUBMITTED').length}</div>
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
                        {enquiries.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No enquiries found.</td></tr>
                        ) : (
                            enquiries.map(e => (
                                <tr key={e.id}>
                                    <td>{e.id}</td><td>{e.client}</td><td>{e.type}</td><td>{e.date}</td>
                                    <td><span className={styles.badge}>{e.status}</span></td>
                                    <td>
                                        {e.status === 'New' || e.status === 'SUBMITTED' ? (
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
        const [selectedChatId, setSelectedChatId] = useState('general');

        // Admin sees all projects that are not 'New' (i.e., real interactions)
        const chatList = [
            // Include General Support Chats from initialSupportChats
            ...(initialSupportChats || []).map(c => ({
                id: c.id,
                title: `${c.client} - Support`
            })),
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
                            <ChatInterface
                                chatId={selectedChatId}
                                chatTitle={activeChat.title}
                                currentUserEmail={currentUserEmail}
                            />
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
                {activeView === 'payments' && <PlaceholderView title="Payment Transactions" />}
                {activeView === 'clients' && <PlaceholderView title="Client Management" />}
                {activeView === 'messages' && <MessagesView />}
                {activeView === 'reports' && <ReportsView />}
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
