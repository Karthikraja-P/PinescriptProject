import { db, TABLE_NAME } from "./dynamodb";
import { PutCommand, QueryCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

export interface UserData {
    name: string;
    email: string;
    passwordHash: string;
    role: "ADMIN" | "CLIENT";
}

export interface MessageData {
    id?: string;
    sender: string; // Email or "ADMIN"
    senderRole: "ADMIN" | "CLIENT";
    content: string;
    attachments?: any[];
    createdAt?: string;
}

export interface ProjectData {
    userId: string; // This will start with USER#... effectively or we store email
    userEmail: string;
    title: string;
    type: string;
    budget: string;
    description: string;
    status: string;
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
                ":s": "IN_PROGRESS",
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

export async function saveMessage(projectId: string, message: MessageData) {
    const timestamp = new Date().toISOString();
    // Ensure we have a unique ID for the message
    const messageId = message.id || uuidv4();
    const sk = `MSG#${timestamp}`;

    const item = {
        PK: `PROJECT#${projectId}`,
        SK: sk,
        ...message,
        id: messageId,
        createdAt: timestamp,
    };

    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    }));

    return item;
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
