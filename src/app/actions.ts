'use server'

import { createProject, createUser, getUserByEmail, getUserProjects } from "@/lib/db-actions";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWelcomeEmail, sendNewProjectAdminNotification } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function submitProjectRequest(prevState: any, formData: FormData) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return { error: "You must be logged in to submit a project." };
    }

    const type = formData.get("type") as string;
    const budget = formData.get("budget") as string;
    const description = formData.get("description") as string;
    const title = (formData.get("title") as string) || `New ${type.charAt(0).toUpperCase() + type.slice(1)} Request`;

    if (!description) {
        return { error: "Description is required." };
    }

    // Handle File Attachments
    const files = formData.getAll("attachments") as File[];
    const attachments = await Promise.all(
        files
            .filter(file => file.size > 0)
            .map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                return {
                    name: file.name,
                    type: file.type,
                    data: base64
                };
            })
    );

    try {
        await createProject({
            userId: session.user.id || `USER#${session.user.email}`,
            userEmail: session.user.email,
            title,
            type,
            budget,
            description,
            status: "New",
            attachments: attachments.length > 0 ? attachments : undefined
        });

        // Notify Admin
        await sendNewProjectAdminNotification({
            userEmail: session.user.email,
            title,
            budget,
            description
        });

        revalidatePath('/dashboard');
        revalidatePath('/admin');

        return { success: true };
    } catch (e) {
        console.error("Project submission error:", e);
        return { error: "Failed to submit request. Please try again." };
    }
}

export async function registerUser(prevState: any, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    try {
        // Check existing
        const exists = await getUserByEmail(email);

        if (exists) {
            return { error: "User already exists with this email." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await createUser({
            name,
            email,
            passwordHash: hashedPassword,
            role: "CLIENT"
        });

        await sendWelcomeEmail(email, name);

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}

export async function fetchMyProjects() {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return { error: "Unauthorized" };
    }

    try {
        const projects = await getUserProjects(session.user.email);
        return { success: true, data: projects };
    } catch (e) {
        console.error("Fetch projects error:", e);
        return { error: "Failed to fetch projects" };
    }
}

export async function updateUserAction(formData: FormData) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const tvUsername = formData.get("tvUsername") as string;

    try {
        const { updateUser } = await import("@/lib/db-actions");
        await updateUser(session.user.email, { name, tvUsername });
        return { success: true };
    } catch (e) {
        console.error("Update profile error:", e);
        return { error: "Failed to update profile" };
    }
}

export async function submitContactForm(formData: FormData) {
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!email || !message) {
        return { error: "Email and message are required." };
    }

    try {
        const { saveContactMessage } = await import("@/lib/db-actions");
        await saveContactMessage({ email, message });
        return { success: true };
    } catch (e) {
        console.error("Contact form error:", e);
        return { error: "Failed to send message. Please try again." };
    }
}

export async function fetchSupportChatsAction() {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return { error: "Unauthorized" };
    }

    try {
        const { getAllSupportChats } = await import("@/lib/db-actions");
        const chats = await getAllSupportChats();
        return { success: true, chats };
    } catch (e) {
        console.error("Fetch support chats error:", e);
        return { error: "Failed to fetch chats" };
    }
}

export async function acceptDeliveryAction(projectId: string) {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Unauthorized" };

    const { db, TABLE_NAME } = await import("@/lib/dynamodb");
    const { UpdateCommand } = await import("@aws-sdk/lib-dynamodb");

    const pk = `USER#${session.user.email}`;
    const sk = `PROJECT#${projectId}`;

    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: "set #status = :s, updatedAt = :t",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
                ":s": "Completed",
                ":t": new Date().toISOString()
            }
        }));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error("Accept delivery error:", e);
        return { error: "Failed to accept delivery" };
    }
}

export async function requestRevisionAction(projectId: string, reason: string) {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Unauthorized" };

    const { db, TABLE_NAME } = await import("@/lib/dynamodb");
    const { UpdateCommand } = await import("@aws-sdk/lib-dynamodb");

    const pk = `USER#${session.user.email}`;
    const sk = `PROJECT#${projectId}`;

    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: "set #status = :s, revisionReason = :r, updatedAt = :t",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
                ":s": "Revision Requested",
                ":r": reason,
                ":t": new Date().toISOString()
            }
        }));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error("Request revision error:", e);
        return { error: "Failed to request revision" };
    }
}
