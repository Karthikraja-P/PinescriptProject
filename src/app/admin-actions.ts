'use server'

import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE_NAME } from "@/lib/dynamodb";
import { getAllProjectsAdmin } from "@/lib/db-actions";
import { getServerSession } from "next-auth";
// We need to fetch all projects but also maybe users to map names if not stored in project
// For now, let's just get projects.

export async function submitQuote(quoteData: {
    projectId: string;
    userId: string;
    userEmail: string; // Needed for PK
    amount: string;
    currency: string;
    deadline: string;
    notes: string;
}) {
    // 1. Construct Keys
    // Similar logic: Project PK is USER#<email>, SK is PROJECT#<id>
    const pk = quoteData.userId.startsWith('USER#') ? quoteData.userId : `USER#${quoteData.userEmail}`;
    const sk = `PROJECT#${quoteData.projectId}`;

    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: "set #status = :s, quote = :q, updatedAt = :t",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":s": "QUOTED", // QUOTED status means user needs to pay/accept
                ":q": {
                    amount: quoteData.amount,
                    currency: quoteData.currency,
                    deadline: quoteData.deadline,
                    notes: quoteData.notes,
                    createdAt: new Date().toISOString()
                },
                ":t": new Date().toISOString()
            }
        }));


        // Send Email Notification to User
        const { sendQuoteNotification } = await import("@/lib/email");
        await sendQuoteNotification({
            email: quoteData.userEmail,
            projectTitle: "Project " + quoteData.projectId.substring(0, 8), // Placeholder title if we don't fetch it
            amount: quoteData.amount,
            currency: quoteData.currency,
            deadline: quoteData.deadline,
            notes: quoteData.notes
        });

        return { success: true };
    } catch (e) {
        console.error("Submit quote error:", e);
        return { error: "Failed to send quote" };
    }
}
