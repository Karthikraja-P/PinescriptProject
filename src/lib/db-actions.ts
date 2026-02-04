import { db, TABLE_NAME } from "./dynamodb";
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

export interface UserData {
    name: string;
    email: string;
    passwordHash: string;
    role: "ADMIN" | "CLIENT";
}

export interface ContactMessage {
    email: string;
    message: string;
    createdAt?: string;
}

export interface MessageData {
    id?: string;
    sender: string; // Email or "ADMIN"
    senderRole: "ADMIN" | "CLIENT";
    content: string;
    attachments?: any[];
    createdAt?: string;
    status?: 'sent' | 'delivered' | 'read'; // Message status for tick indicators
}

export interface ProjectData {
    userId: string; // This will start with USER#... effectively or we store email
    userEmail: string;
    title: string;
    type: string;
    budget: string;
    description: string;
    status: string;
    attachments?: { name: string; type: string; data: string }[];
}

/**
 * Creates a new user in the DynamoDB table.
 * Partition Key: USER#<email>
 * Sort Key: PROFILE
 */
export async function createUser(user: UserData) {
    const pk = `USER#${user.email}`;
    const sk = `PROFILE`;

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: pk,
            SK: sk,
            ...user,
            createdAt: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(PK)" // Ensure unique email
    }));

    return { ...user, id: pk }; // Return PK as ID for NextAuth compatibility
}

export async function getUserByEmail(email: string) {
    const pk = `USER#${email}`;
    const sk = `PROFILE`;

    const result = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: pk,
            SK: sk
        }
    }));

    if (result.Item) {
        return {
            id: result.Item.PK, // Remap PK to id for easier consumption
            ...result.Item
        };
    }
    return null;
}

export async function updateUser(email: string, updates: { name?: string; tvUsername?: string }) {
    const pk = `USER#${email}`;
    const sk = `PROFILE`;

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.name) {
        updateExpressions.push("#name = :name");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = updates.name;
    }

    if (updates.tvUsername) {
        updateExpressions.push("#tv = :tv");
        expressionAttributeNames["#tv"] = "tvUsername";
        expressionAttributeValues[":tv"] = updates.tvUsername;
    }

    if (updateExpressions.length === 0) return { success: true }; // Nothing to update

    updateExpressions.push("updatedAt = :t");
    expressionAttributeValues[":t"] = new Date().toISOString();

    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `set ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
    }));

    return { success: true };
}

/**
 * Creates a new project.
 * Partition Key: USER#<email>
 * Sort Key: PROJECT#<uuid>
 * GSI1PK: ADMIN#ALL_PROJECTS
 * GSI1SK: TIMESTAMP#<createdAt>
 */
export async function createProject(project: ProjectData) {
    const projectId = uuidv4();
    // We assume userId passed in might be the email or full PK, let's standarize on using Email or extracting it
    // Implementation choice: PK is USER#<email>

    const pk = project.userId.startsWith('USER#') ? project.userId : `USER#${project.userEmail}`;
    const sk = `PROJECT#${projectId}`;

    const timestamp = new Date().toISOString();

    const item = {
        PK: pk,
        SK: sk,
        GSI1PK: "ADMIN#ALL_PROJECTS",
        GSI1SK: `TIMESTAMP#${timestamp}`, // Sort by newest
        id: projectId,
        ...project,
        createdAt: timestamp,
        updatedAt: timestamp
    };

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    }));

    return item;
}

export async function getUserProjects(userEmail: string) {
    const pk = `USER#${userEmail}`;

    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": pk,
            ":sk": "PROJECT#"
        }
    }));

    return result.Items || [];
}

export async function getAllProjectsAdmin() {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
            ":pk": "ADMIN#ALL_PROJECTS"
        },
        ScanIndexForward: false // Newest first
    }));

    return result.Items || [];
}

/**
 * Get a project by its ID (admin use - scans the GSI)
 */
export async function getProjectByIdAdmin(projectId: string) {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        FilterExpression: "id = :id",
        ExpressionAttributeValues: {
            ":pk": "ADMIN#ALL_PROJECTS",
            ":id": projectId
        }
    }));

    return result.Items?.[0] || null;
}

/**
 * Record a payment and update project status
 */
export async function recordPayment(paymentData: {
    userId: string;
    userEmail: string;
    projectId: string;
    orderId: string;
    amount: string;
    currency: string;
}) {
    const timestamp = new Date().toISOString();

    // 1. Create Payment Record
    const paymentItem = {
        PK: `USER#${paymentData.userEmail}`,
        SK: `PAYMENT#${paymentData.orderId}`,
        GSI1PK: `PROJECT#${paymentData.projectId}`, // Allow looking up payments by project
        GSI1SK: `PAYMENT#${timestamp}`,
        type: 'PAYMENT',
        ...paymentData,
        status: 'COMPLETED',
        provider: 'PAYPAL',
        createdAt: timestamp
    };

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: paymentItem
    }));

    // 2. Update Project Status to 'PAID' or 'IN_PROGRESS'
    const projectPk = paymentData.userId.startsWith('USER#') ? paymentData.userId : `USER#${paymentData.userEmail}`;
    const projectSk = `PROJECT#${paymentData.projectId}`;

    // We only try to update; if project doesn't exist, this might fail or do nothing depending on logic.
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: projectPk,
                SK: projectSk
            },
            UpdateExpression: "set #status = :s, updatedAt = :t",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":s": "In Progress",
                ":t": timestamp
            }
        }));
    } catch (e) {
        console.error("Failed to update project status after payment:", e);
    }

    return paymentItem;
}

export async function getUserPayments(userEmail: string) {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userEmail}`,
            ":sk": "PAYMENT#"
        }
    }));
    return result.Items || [];
}

/**
 * Chat & Messaging Functions
 */

export async function saveMessage(projectId: string, message: MessageData, parentUserEmail?: string) {
    const timestamp = new Date().toISOString();
    const sk = `MSG#${timestamp}`;

    const item = {
        PK: `PROJECT#${projectId}`,
        SK: sk,
        ...message,
        id: message.id || uuidv4(),
        createdAt: timestamp,
        status: 'sent' as const, // Initial status is 'sent'
    };

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    }));

    // Update parent project/support record for unread tracking/sorting
    // For projects, find the project and update it
    // For support chats, update the support record
    try {
        if (projectId.startsWith('SUPPORT_')) {
            // Support chat - update the support record
            const clientEmail = projectId.replace('SUPPORT_', '');
            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: `USER#${clientEmail}`, SK: `SUPPORT#${clientEmail}` },
                UpdateExpression: "SET updatedAt = :t, lastMessageAt = :t, lastMessageSender = :s",
                ExpressionAttributeValues: { ":t": timestamp, ":s": message.sender }
            }));
        } else if (parentUserEmail) {
            // Project chat - update the user's project record
            const parentPK = parentUserEmail.startsWith('USER#') ? parentUserEmail : `USER#${parentUserEmail}`;
            const parentSK = `PROJECT#${projectId}`;

            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: parentPK, SK: parentSK },
                UpdateExpression: "SET updatedAt = :t, lastMessageAt = :t, lastMessageSender = :s",
                ExpressionAttributeValues: { ":t": timestamp, ":s": message.sender }
            }));
        } else {
            // Try to find the project owner from the project ID using GSI
            const project = await getProjectByIdAdmin(projectId);
            if (project && project.PK) {
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { PK: project.PK, SK: `PROJECT#${projectId}` },
                    UpdateExpression: "SET updatedAt = :t, lastMessageAt = :t, lastMessageSender = :s",
                    ExpressionAttributeValues: { ":t": timestamp, ":s": message.sender }
                }));
            }
        }
    } catch (e) {
        console.error("Failed to update parent timestamp", e);
    }

    return item;
}

/**
 * Update message status to delivered or read
 */
export async function updateMessageStatus(projectId: string, messageSK: string, status: 'delivered' | 'read') {
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `PROJECT#${projectId}`,
                SK: messageSK
            },
            UpdateExpression: "SET #status = :s",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":s": status }
        }));
        return { success: true };
    } catch (e) {
        console.error("Failed to update message status", e);
        return { error: "Failed to update message status" };
    }
}

/**
 * Mark all messages in a chat as read by the recipient
 */
export async function markMessagesAsRead(projectId: string, readerEmail: string) {
    try {
        // Fetch all messages in this chat
        const messages = await getProjectMessages(projectId);

        // Update messages that were sent by someone else and not yet read
        for (const msg of messages) {
            if (msg.sender !== readerEmail && msg.status !== 'read') {
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `PROJECT#${projectId}`,
                        SK: msg.SK
                    },
                    UpdateExpression: "SET #status = :s",
                    ExpressionAttributeNames: { "#status": "status" },
                    ExpressionAttributeValues: { ":s": "read" }
                }));
            }
        }
        return { success: true };
    } catch (e) {
        console.error("Failed to mark messages as read", e);
        return { error: "Failed to mark messages as read" };
    }
}

/**
 * Mark messages as delivered when recipient opens the chat
 */
export async function markMessagesAsDelivered(projectId: string, recipientEmail: string) {
    try {
        const messages = await getProjectMessages(projectId);

        for (const msg of messages) {
            if (msg.sender !== recipientEmail && msg.status === 'sent') {
                await db.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        PK: `PROJECT#${projectId}`,
                        SK: msg.SK
                    },
                    UpdateExpression: "SET #status = :s",
                    ExpressionAttributeNames: { "#status": "status" },
                    ExpressionAttributeValues: { ":s": "delivered" }
                }));
            }
        }
        return { success: true };
    } catch (e) {
        console.error("Failed to mark messages as delivered", e);
        return { error: "Failed to mark messages as delivered" };
    }
}

export async function updateLastRead(userEmail: string, chatId: string) {
    const timestamp = new Date().toISOString();
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${userEmail}`,
            SK: `CHATMETA#${chatId}`,
            lastReadAt: timestamp
        }
    }));
}

export async function getChatMetas(userEmail: string) {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userEmail}`,
            ":sk": "CHATMETA#"
        }
    }));
    return result.Items || [];
}

export async function getProjectMessages(projectId: string) {
    // Query PK = PROJECT#<id> and SK begins_with MSG#
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `PROJECT#${projectId}`,
            ":sk": "MSG#"
        }
    }));

    return result.Items || [];
}

export async function checkProjectOwnership(userEmail: string, projectId: string) {
    // Check if PROJECT#<projectId> exists under USER#<email>
    // This confirms the user owns the project.
    const pk = `USER#${userEmail}`;
    const sk = `PROJECT#${projectId}`;

    const result = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk }
    }));

    return !!result.Item;
}

export async function createSupportConversation(userEmail: string) {
    // Create a record so Admin can find this chat
    const timestamp = new Date().toISOString();
    const item = {
        PK: `SUPPORT#${userEmail}`,
        SK: `META`,
        GSI1PK: `ADMIN#SUPPORT_CHATS`,
        GSI1SK: `TIMESTAMP#${timestamp}`,
        userEmail,
        lastMessage: "New support conversation started",
        updatedAt: timestamp
    };

    try {
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK)"
        }));
    } catch (e) {
        // Ignore if exists
    }
}

export async function getAdminSupportChats() {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
            ":pk": "ADMIN#SUPPORT_CHATS"
        },
        ScanIndexForward: false
    }));
    return result.Items || [];
}
export async function saveContactMessage(data: ContactMessage) {
    const timestamp = new Date().toISOString();
    const id = uuidv4();

    const item = {
        PK: `CONTACT#${data.email}`,
        SK: `MSG#${id}`,
        GSI1PK: "ADMIN#CONTACT_MESSAGES",
        GSI1SK: `TIMESTAMP#${timestamp}`,
        ...data,
        createdAt: timestamp,
        type: 'CONTACT_FORM'
    };

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    }));

    return item;
}

export async function getAllContactMessages() {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
            ":pk": "ADMIN#CONTACT_MESSAGES"
        },
        ScanIndexForward: false // Newest first
    }));

    return result.Items || [];
}

export async function getAllUsersAdmin() {
    const result = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: {
            ":sk": "PROFILE"
        }
    }));

    return result.Items || [];
}

export async function getAllPaymentsAdmin() {
    const result = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":sk": "PAYMENT#"
        }
    }));

    return result.Items || [];
}
