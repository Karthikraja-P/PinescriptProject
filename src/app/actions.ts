'use server'

import { createProject, createUser, getUserByEmail, getUserProjects } from "@/lib/db-actions";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWelcomeEmail, sendNewProjectAdminNotification } from "@/lib/email";

export async function submitProjectRequest(prevState: any, formData: FormData) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return { error: "You must be logged in to submit a project." };
    }

    const type = formData.get("type") as string;
    const budget = formData.get("budget") as string;
    const description = formData.get("description") as string;

    if (!description) {
        return { error: "Description is required." };
    }

    try {
        await createProject({
            userId: session.user.id || `USER#${session.user.email}`,
            userEmail: session.user.email,
            title: "New Project Request",
            type,
            budget,
            description,
            status: "SUBMITTED"
        });

        // Notify Admin
        await sendNewProjectAdminNotification({
            userEmail: session.user.email,
            title: "New Project Request", // Or dynamic if we had a title field
            budget,
            description
        });

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

        const hashedPassword = await hash(password, 10);

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
