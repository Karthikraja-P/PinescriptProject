import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
    },
});

const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "notifications@pinescript.com"; // Must be verified in SES

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    // Determine if we are in a dev environment without valid AWS creds (dummy)
    // If so, just log the email to console
    if (process.env.AWS_ACCESS_KEY_ID === "dummy") {
        console.log("-----------------------------------------");
        console.log(`[MOCK EMAIL] To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
        console.log("-----------------------------------------");
        return { success: true, messageId: "mock-id" };
    }

    try {
        const command = new SendEmailCommand({
            Source: SENDER_EMAIL,
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Subject: {
                    Data: subject,
                },
                Body: {
                    Html: {
                        Data: html,
                    },
                },
            },
        });

        const response = await sesClient.send(command);
        return { success: true, messageId: response.MessageId };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { width: false, error };
    }
}

// --- Specific Notification Functions ---

export async function sendWelcomeEmail(email: string, name: string) {
    const subject = "Welcome to PineScript Elite!";
    const html = `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for creating an account with PineScript Elite.</p>
        <p>You can now log in and submit your trading strategy ideas for development.</p>
        <br/>
        <p>Best regards,<br/>The PineScript Elite Team</p>
    `;
    return sendEmail({ to: email, subject, html });
}

export async function sendNewProjectAdminNotification(project: any) {
    // Notify Admin (using same sender or a specific admin email env var)
    const adminEmail = process.env.ADMIN_EMAIL || SENDER_EMAIL;
    const subject = `New Project Request: ${project.title}`;
    const html = `
        <h2>New Project Submitted</h2>
        <p><strong>Client:</strong> ${project.userEmail}</p>
        <p><strong>Title:</strong> ${project.title}</p>
        <p><strong>Budget:</strong> ${project.budget}</p>
        <p><strong>Description:</strong></p>
        <div style="background:#f4f4f5; padding: 10px; border-radius: 5px;">${project.description}</div>
        <br/>
        <a href="${process.env.NEXTAUTH_URL}/admin">Open Admin Dashboard</a>
    `;
    return sendEmail({ to: adminEmail, subject, html });
}

export async function sendQuoteNotification(data: { email: string, projectTitle: string, amount: string, currency: string, deadline: string, notes: string }) {
    const subject = `Quote Received: ${data.projectTitle}`;
    const html = `
        <h2>Good news! Your project has been quoted.</h2>
        <p><strong>Project:</strong> ${data.projectTitle}</p>
        <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
        <p><strong>Estimated Delivery:</strong> ${data.deadline}</p>
        <p><strong>Developer Notes:</strong> ${data.notes}</p>
        <br/>
        <p>Please log in to your dashboard to accept and pay for this quote.</p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard">Go to Dashboard</a>
    `;
    return sendEmail({ to: data.email, subject, html });
}

export async function sendPaymentConfirmation(data: { email: string, projectTitle: string, amount: string }) {
    const subject = `Payment Confirmed: ${data.projectTitle}`;
    const html = `
        <h2>Payment Successful</h2>
        <p>We have received your payment of <strong>$${data.amount}</strong> for project <strong>${data.projectTitle}</strong>.</p>
        <p>Implementation will begin shortly. You can track progress in your dashboard.</p>
        <br/>
        <p>Thank you!</p>
    `;
    return sendEmail({ to: data.email, subject, html });
}

export async function sendMessageNotification(data: { toEmail: string, fromName: string, messagePreview: string, projectId: string }) {
    const subject = `New Message from ${data.fromName}`;
    const html = `
        <p>You have a new message regarding project <strong>${data.projectId}</strong>.</p>
        <div style="background:#f4f4f5; padding: 10px; border-radius: 5px; font-style: italic;">
            "${data.messagePreview}"
        </div>
        <br/>
        <a href="${process.env.NEXTAUTH_URL}/dashboard">Reply in Dashboard</a>
   `;
    return sendEmail({ to: data.toEmail, subject, html });
}
