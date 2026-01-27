'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveMessage, getProjectMessages, checkProjectOwnership } from "@/lib/db-actions";

export async function sendMessageAction(projectId: string, content: string, attachments: any[] = []) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    const { email, role } = session.user;

    // Permission Logic
    if (role !== 'ADMIN') {
        if (projectId === 'general') {
            projectId = `SUPPORT_${email}`;
        } else {
            const isOwner = await checkProjectOwnership(email, projectId);
            if (!isOwner) return { error: "Unauthorized: You do not own this project." };
        }
    } else {
        // Admin Logic
        // For Admin, 'general' is ambiguous without user context. 
        // But currently UI only passes valid Project IDs (or 'general' which we might ignore for Admin for now)
        if (projectId === 'general') {
            return { error: "Admin cannot use general chat without user context" };
        }
    }

    try {
        // For parent update, we need the client's email
        let parentEmail = email;
        if (role === 'ADMIN') {
            // If admin is sending, the parent is the client's project.
            // We need to extract the client email. 
            // In support chats, the projectId is SUPPORT_<clientEmail>.
            if (projectId.startsWith('SUPPORT_')) {
                parentEmail = projectId.replace('SUPPORT_', '');
            } else {
                // For projects, we might need a lookup, but for now let's try to get it if possible.
                // Or we can assume Admin knows which user they are messaging.
                // For now, if role is ADMIN, we might need more info.
            }
        }

        const message = await saveMessage(projectId, {
            sender: email,
            senderRole: role,
            content,
            attachments
        }, parentEmail);

        if (projectId.startsWith('SUPPORT_')) {
            const { createSupportConversation } = await import("@/lib/db-actions");
            await createSupportConversation(email);
        }

        return { success: true, message };
    } catch (e) {
        console.error("Failed to send message", e);
        return { error: "Failed to send message" };
    }
}

export async function fetchMessagesAction(projectId: string) {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Unauthorized" };

    const { email, role } = session.user;

    if (role !== 'ADMIN') {
        if (projectId === 'general') {
            projectId = `SUPPORT_${email}`;
        } else {
            const isOwner = await checkProjectOwnership(email, projectId);
            if (!isOwner) return { error: "Unauthorized" };
        }
    }
    // If Admin, just fetch whatever projectId is passed

    try {
        const messages = await getProjectMessages(projectId);

        // Mark as read
        const { updateLastRead } = await import("@/lib/db-actions");
        await updateLastRead(email, projectId);

        return { success: true, messages };
    } catch (e) {
        console.error("Fetch messages error:", e);
        return { error: "Failed to fetch messages" };
    }
}
