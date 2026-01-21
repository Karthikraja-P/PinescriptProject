'use server'

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export async function submitProjectRequest(prevState: any, formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
        return { error: "You must be logged in to submit a project." };
    }

    const type = formData.get("type") as string;
    const budget = formData.get("budget") as string;
    const description = formData.get("description") as string;

    if (!description) {
        return { error: "Description is required." };
    }

    try {
        await prisma.project.create({
            data: {
                userId: (session.user as any).id,
                type,
                budget,
                description,
                title: "New Project Request",
                status: "SUBMITTED"
            }
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
        const exists = await prisma.user.findUnique({
            where: { email }
        });

        if (exists) {
            return { error: "User already exists with this email." };
        }

        const hashedPassword = await hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "CLIENT"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}
