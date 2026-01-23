'use server'

import { recordPayment } from "@/lib/db-actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function processPayment(paymentData: {
    projectId: string;
    orderId: string;
    amount: string;
    currency: string;
}) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return { error: "Unauthorized" };
    }

    try {
        // In a real production app, verify the orderId with PayPal API here before recording
        // const isValid = await verifyPayPalOrder(paymentData.orderId);
        // if(!isValid) throw new Error("Invalid Payment");

        await recordPayment({
            userId: session.user.id || `USER#${session.user.email}`,
            userEmail: session.user.email,
            projectId: paymentData.projectId,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency
        });



        // Send Email Confirmation
        const { sendPaymentConfirmation } = await import("@/lib/email");
        await sendPaymentConfirmation({
            email: session.user.email,
            projectTitle: "Project " + paymentData.projectId.substring(0, 8),
            amount: paymentData.amount
        });

        return { success: true };
    } catch (e) {
        console.error("Payment processing error:", e);
        return { error: "Failed to record payment" };
    }
}
