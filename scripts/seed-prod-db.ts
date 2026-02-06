
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { hash } from "bcryptjs";
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REGION = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.TABLE_NAME || "PinescriptProjects";

console.log(`Connecting to DynamoDB in ${REGION}...`);
console.log(`Table: ${TABLE_NAME}`);
console.log(`Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 5)}...`);

const client = new DynamoDBClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

const db = DynamoDBDocumentClient.from(client);

async function main() {
    // 1. Check Table Existence
    try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log("✅ Table found!");
    } catch (e: any) {
        if (e.name === 'ResourceNotFoundException') {
            console.error("❌ ERROR: Table 'PinescriptProjects' does not exist in ap-south-1.");
            console.error("Please create it manually in AWS Console with PK, SK, and GSI1 (GSI1PK, GSI1SK).");
            process.exit(1);
        } else {
            console.error("❌ Connection Error:", e.message);
            process.exit(1);
        }
    }

    // 2. Admin User
    const adminEmail = "admin@pinescript.com";
    const adminPassword = "admin"; // keeping it simple as requested previously or standard
    const adminHash = await hash(adminPassword, 10);

    console.log(`Seeding Admin User (${adminEmail})...`);
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${adminEmail}`,
            SK: "PROFILE",
            email: adminEmail,
            name: "Admin User",
            passwordHash: adminHash,
            role: "ADMIN",
            createdAt: new Date().toISOString()
        }
    }));

    // 3. Client User
    const clientEmail = "client@pinescript.com";
    const clientPassword = "client";
    const clientHash = await hash(clientPassword, 10);

    console.log(`Seeding Client User (${clientEmail})...`);
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${clientEmail}`,
            SK: "PROFILE",
            email: clientEmail,
            name: "Test Client",
            passwordHash: clientHash,
            role: "CLIENT",
            tvUsername: "TradingViewUser123",
            createdAt: new Date().toISOString()
        }
    }));

    // 4. Client User 2
    const clientEmail2 = "dinesh@pinescript.com";
    const clientPassword2 = "dinesh";
    const clientHash2 = await hash(clientPassword2, 10);

    console.log(`Seeding Client User 2 (${clientEmail2})...`);
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${clientEmail2}`,
            SK: "PROFILE",
            email: clientEmail2,
            name: "Dinesh Client",
            passwordHash: clientHash2,
            role: "CLIENT",
            tvUsername: "DineshTV",
            createdAt: new Date().toISOString()
        }
    }));

    console.log("✅ Database Seeded Successfully!");
}

main().catch(console.error);
