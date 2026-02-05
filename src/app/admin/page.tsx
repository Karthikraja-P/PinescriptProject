import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllProjectsAdmin } from "@/lib/db-actions";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
    const session: any = await getServerSession(authOptions);

    // Simple Admin check (real app should check user role)
    // Simple Admin check (real app should check user role)
    if (!session || !session.user) {
        redirect("/auth?mode=login");
    }

    if (session.user.role !== 'ADMIN') {
        redirect("/dashboard");
    }

    const projects = await getAllProjectsAdmin();
    const { getAdminSupportChats, getAllContactMessages, getChatMetas, getAllUsersAdmin, getAllPaymentsAdmin } = await import("@/lib/db-actions");
    const supportChats = await getAdminSupportChats();
    const contactMessages = await getAllContactMessages();
    const chatMetas = await getChatMetas(session.user.email);
    const users = await getAllUsersAdmin();
    const payments = await getAllPaymentsAdmin();

    // Map DynamoDB items to the structure Admin Dashboard expects
    const formattedEnquiries = projects.map((p: any) => ({
        id: p.id || p.SK.split('#')[1],
        client: p.userEmail?.split('@')[0] || p.userId, // Show username part of email
        clientName: p.userEmail?.split('@')[0] || 'Client',
        userId: p.PK, // store full PK
        userEmail: p.userEmail,
        title: p.title,
        type: p.type,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
        status: p.status,
        deadline: p.quote?.deadline,
        lastMessageAt: p.lastMessageAt,
        lastMessageSender: p.lastMessageSender,
        description: p.description,
        attachments: p.attachments,
    }));

    const formattedSupportChats = supportChats.map((c: any) => ({
        id: `SUPPORT_${c.userEmail}`,
        client: c.userEmail?.split('@')[0] || c.userEmail,
        clientName: c.userEmail?.split('@')[0] || 'Client',
        userEmail: c.userEmail,
        type: 'General Support',
        status: 'Open',
        lastMessageAt: c.lastMessageAt || c.updatedAt,
        lastMessageSender: c.lastMessageSender,
    }));

    return (
        <AdminDashboardClient
            initialEnquiries={formattedEnquiries}
            initialSupportChats={formattedSupportChats}
            initialContactMessages={contactMessages}
            initialChatMetas={chatMetas}
            initialUsers={users}
            initialPayments={payments}
            currentUserEmail={session?.user?.email || ""}
        />
    );
}
