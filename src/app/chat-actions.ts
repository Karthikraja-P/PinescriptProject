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
        if (projectId === 'general') {
            return { error: "Admin cannot use general chat without user context" };
        }
    }

    try {
        // For parent update, we need the client's email
        let parentEmail: string | undefined = email;

        if (role === 'ADMIN') {
            // Admin is sending - find the client's email
            if (projectId.startsWith('SUPPORT_')) {
                parentEmail = projectId.replace('SUPPORT_', '');
            } else {
                // For projects, look up the project to find the owner
                const { getProjectByIdAdmin } = await import("@/lib/db-actions");
                const project = await getProjectByIdAdmin(projectId);
                if (project) {
                    parentEmail = project.userEmail || project.PK?.replace('USER#', '');
                }
            }
        }

        const message = await saveMessage(projectId, {
            sender: email,
            senderRole: role,
            content,
            attachments
        }, parentEmail);

        if (projectId.startsWith('SUPPORT_') && role !== 'ADMIN') {
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

        // Mark messages from the other party as read
        const { markMessagesAsRead } = await import("@/lib/db-actions");
        await markMessagesAsRead(projectId, email);

        // Mark as read in chat metas
        const { updateLastRead } = await import("@/lib/db-actions");
        await updateLastRead(email, projectId);

        return { success: true, messages };
    } catch (e) {
        console.error("Fetch messages error:", e);
        return { error: "Failed to fetch messages" };
    }
}

/**
 * Mark all messages in a chat as read (called when user opens chat)
 */
export async function markChatAsReadAction(projectId: string) {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Unauthorized" };

    const { email, role } = session.user;

    // Transform projectId for clients
    if (role !== 'ADMIN' && projectId === 'general') {
        projectId = `SUPPORT_${email}`;
    }

    try {
        const { markMessagesAsRead, updateLastRead } = await import("@/lib/db-actions");
        await markMessagesAsRead(projectId, email);
        await updateLastRead(email, projectId);
        return { success: true };
    } catch (e) {
        console.error("Mark as read error:", e);
        return { error: "Failed to mark as read" };
    }
}

/**
 * Get unread message count for all chats (for notification badges)
 */
export async function getUnreadCountsAction() {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Unauthorized" };

    const { email, role } = session.user;

    try {
        const { getChatMetas, getUserProjects, getAllProjectsAdmin, getAdminSupportChats } = await import("@/lib/db-actions");

        const chatMetas = await getChatMetas(email);
        let hasUnread = false;

        if (role === 'ADMIN') {
            // Check support chats and projects for unread messages
            const supportChats = await getAdminSupportChats();
            const projects = await getAllProjectsAdmin();

            for (const chat of [...supportChats, ...projects]) {
                const chatId = chat.id || chat.SK?.split('#')[1];
                const meta = chatMetas.find((m: any) => m.SK === `CHATMETA#${chatId}`);
                if (chat.lastMessageAt && chat.lastMessageSender !== email) {
                    if (!meta || meta.lastReadAt < chat.lastMessageAt) {
                        hasUnread = true;
                        break;
                    }
                }
            }
        } else {
            // Client: check their projects
            const projects = await getUserProjects(email);
            for (const p of projects) {
                const meta = chatMetas.find((m: any) => m.SK === `CHATMETA#${p.id}`);
                if (p.lastMessageAt && p.lastMessageSender !== email) {
                    if (!meta || meta.lastReadAt < p.lastMessageAt) {
                        hasUnread = true;
                        break;
                    }
                }
            }
        }

        return { success: true, hasUnread };
    } catch (e) {
        console.error("Get unread counts error:", e);
        return { error: "Failed to get unread counts" };
    }
}

