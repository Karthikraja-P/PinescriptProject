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
    const { getAdminSupportChats } = await import("@/lib/db-actions");
    const supportChats = await getAdminSupportChats();

    // Map DynamoDB items to the structure Admin Dashboard expects
    const formattedEnquiries = projects.map((p: any) => ({
        id: p.id || p.SK.split('#')[1],
        client: p.userId, // We need to fetch User Name, but userID is OK for now
        userId: p.PK, // store full PK
        userEmail: p.userEmail,
        type: p.type,
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
        status: p.status,
        deadline: p.quote?.deadline,
        // ... any active project/quote details
    }));

    const formattedSupportChats = supportChats.map((c: any) => ({
        id: `SUPPORT_${c.userEmail}`,
        client: c.userEmail,
        type: 'General Support',
        status: 'Open'
    }));

    return (
        <AdminDashboardClient
            initialEnquiries={formattedEnquiries}
            initialSupportChats={formattedSupportChats}
            currentUserEmail={session?.user?.email || ""}
        />
    );
}
