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
                ":s": "Quote Sent", // QUOTED status means user needs to pay/accept
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

export async function deliverProjectAction(data: {
    projectId: string;
    userId: string; // or PK
    userEmail: string;
    files: { name: string; data: string }[];
    message: string;
}) {
    const pk = data.userId.startsWith('USER#') ? data.userId : `USER#${data.userEmail}`;
    const sk = `PROJECT#${data.projectId}`;

    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: "set #status = :s, files = :f, deliveryMessage = :m, updatedAt = :t",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":s": "Completed",
                ":f": data.files, // In a real app, these would be S3 URLs
                ":m": data.message,
                ":t": new Date().toISOString()
            }
        }));

        // Send Email Notification (Optional)
        // const { sendDeliveryNotification } = await import("@/lib/email");
        // await sendDeliveryNotification(...)

        return { success: true };
    } catch (e) {
        console.error("Delivery error:", e);
        return { error: "Failed to deliver project" };
    }
}

export async function rejectEnquiryAction(data: {
    projectId: string;
    userId: string;
    userEmail: string;
    reason?: string;
}) {
    const pk = data.userId.startsWith('USER#') ? data.userId : `USER#${data.userEmail}`;
    const sk = `PROJECT#${data.projectId}`;

    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: sk },
            UpdateExpression: "set #status = :s, updatedAt = :t",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":s": "Declined",
                ":t": new Date().toISOString()
            }
        }));

        // Send Email Notification
        const { sendRejectionNotification } = await import("@/lib/email");
        await sendRejectionNotification({
            email: data.userEmail,
            projectTitle: "Project " + data.projectId.substring(0, 8),
            reason: data.reason
        });

        return { success: true };
    } catch (e) {
        console.error("Rejection error:", e);
        return { error: "Failed to reject project" };
    }
}
