
import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function fixRoles() {
    console.log("Fixing user roles...");

    // 1. Fix Admin
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: 'USER#admin@pinescript.com', SK: 'PROFILE' },
            UpdateExpression: 'SET #r = :r',
            ExpressionAttributeNames: { '#r': 'role' },
            ExpressionAttributeValues: { ':r': 'ADMIN' }
        }));
        console.log("✅ admin@pinescript.com set to ADMIN");
    } catch (e) {
        console.error("Failed to fix admin:", e);
    }

    // 2. Fix Client
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: 'USER#client@pinescript.com', SK: 'PROFILE' },
            UpdateExpression: 'SET #r = :r',
            ExpressionAttributeNames: { '#r': 'role' },
            ExpressionAttributeValues: { ':r': 'CLIENT' }
        }));
        console.log("✅ client@pinescript.com set to CLIENT");
    } catch (e) {
        console.error("Failed to fix client:", e);
    }
}

fixRoles();
