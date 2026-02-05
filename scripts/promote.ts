import { db, TABLE_NAME } from "../src/lib/dynamodb"; // Adjust path if needed
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email as an argument.");
    process.exit(1);
}

async function promote() {
    console.log(`Promoting ${email} to ADMIN...`);
    try {
        await db.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${email}`,
                SK: `PROFILE`
            },
            UpdateExpression: "SET #role = :r",
            ExpressionAttributeNames: { "#role": "role" },
            ExpressionAttributeValues: { ":r": "ADMIN" }
        }));
        console.log("Success!");
    } catch (e) {
        console.error("Error:", e);
    }
}

promote();
