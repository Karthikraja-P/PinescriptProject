import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

async function check() {
    console.log("Checking table:", TABLE_NAME);
    try {
        const result = await db.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "SK = :sk",
            ExpressionAttributeValues: {
                ":sk": "PROFILE"
            }
        }));
        console.log("Users found:", result.Items?.length || 0);
        result.Items?.forEach(user => {
            console.log(`- ${user.email} (${user.role})`);
        });
    } catch (e) {
        console.error("Error scanning table:", e);
    }
}

check();
