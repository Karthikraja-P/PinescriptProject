import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { hash } from "bcryptjs";

async function updatePasswords() {
    const password = "password123";
    const passwordHash = await hash(password, 10);
    const emails = ["admin@test.com", "client@test.com"];

    for (const email of emails) {
        console.log(`Updating password for ${email} to "${password}"`);
        try {
            await db.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: `USER#${email}`, SK: "PROFILE" },
                UpdateExpression: "SET passwordHash = :h",
                ExpressionAttributeValues: { ":h": passwordHash }
            }));
            console.log(`Updated ${email}`);
        } catch (e) {
            console.error(`Failed to update ${email}:`, e);
        }
    }
}

updatePasswords();
