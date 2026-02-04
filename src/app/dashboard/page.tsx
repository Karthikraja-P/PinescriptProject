import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserProjects } from "@/lib/db-actions";
import ClientDashboard from "./DashboardClient";

export default async function DashboardPage() {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/auth?mode=login");
    }

    const projects = await getUserProjects(session.user.email);
    const { getUserPayments, getUserByEmail, getChatMetas } = await import("@/lib/db-actions");
    const payments = await getUserPayments(session.user.email);
    const userProfile = await getUserByEmail(session.user.email);
    const chatMetas = await getChatMetas(session.user.email);

    const normalizedProjects = projects.map((p: any) => ({
        id: p.id || (p.SK ? p.SK.split('#')[1] : 'Unknown'),
        title: p.title,
        type: p.type,
        status: p.status,
        // Map Quote data if it exists, otherwise use budget or defaults
        price: p.quote ? `$${p.quote.amount}` : p.budget || 'TBD',
        deadline: p.quote ? p.quote.deadline : 'TBD',
        deliveryMessage: p.deliveryMessage,
        files: p.files,
        quote: p.quote, // Keep the full object for detailed review
        lastMessageAt: p.lastMessageAt,
        lastMessageSender: p.lastMessageSender,
        description: p.description,
        attachments: p.attachments,
    }));

    // Normalize Payments
    const normalizedPayments = payments.map((p: any) => ({
        id: p.SK.replace('PAYMENT#', ''),
        date: new Date(p.createdAt).toLocaleDateString(),
        amount: `${p.amount} ${p.currency}`, // Assuming amount is just number string
        status: p.status, // usually COMPLETED
        project: `Project ${p.projectId.substring(0, 8)}` // We might not have project title easily in payment record unless we joined, but we stored GSI1PK as project ID so we can guess. Ideally we'd map it.
    }));

    return (
        <ClientDashboard
            user={{ ...session.user, ...userProfile }} // Merge session info with DB info (like tvUsername)
            initialProjects={normalizedProjects}
            initialPayments={normalizedPayments}
            initialChatMetas={chatMetas}
        />
    );
}
