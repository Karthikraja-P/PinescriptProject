import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

async function checkUsers() {
    console.log("Checking for users in DynamoDB...\n");

    const result = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :prefix)",
        ExpressionAttributeValues: {
            ":prefix": "USER#"
        }
    }));

    if (result.Items && result.Items.length > 0) {
        console.log(`Found ${result.Items.length} user(s):\n`);
        result.Items.forEach((item: any) => {
            console.log(`  Email: ${item.email}`);
            console.log(`  Name: ${item.name}`);
            console.log(`  Role: ${item.role}`);
            console.log(`  ---`);
        });
    } else {
        console.log("No users found in the database.");
    }
}

checkUsers().catch(console.error);
