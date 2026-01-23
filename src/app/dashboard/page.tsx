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
        quote: p.quote // Keep the full object for detailed review
    }));

    return (
        <ClientDashboard
            user={session.user}
            initialProjects={normalizedProjects}
        />
    );
}
