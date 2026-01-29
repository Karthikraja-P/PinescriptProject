import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const config = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
    },
    ...(process.env.DYNAMODB_ENDPOINT
        ? { endpoint: process.env.DYNAMODB_ENDPOINT }
        : {}),
};

const client = new DynamoDBClient(config);
const TABLE_NAME = process.env.TABLE_NAME || "PinescriptProjects";

async function checkUsers() {
    console.log("Checking for users in DynamoDB...\n");

    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :prefix)",
        ExpressionAttributeValues: {
            ":prefix": { S: "USER#" }
        }
    }));

    if (result.Items && result.Items.length > 0) {
        console.log(`Found ${result.Items.length} user(s):\n`);
        result.Items.forEach((item: any) => {
            console.log(`  Email: ${item.email?.S}`);
            console.log(`  Name: ${item.name?.S}`);
            console.log(`  Role: ${item.role?.S}`);
            console.log(`  ---`);
        });
    } else {
        console.log("No users found in the database.");
        console.log("\nTo register, go to http://localhost:3000/auth and click 'Register'");
    }
}

checkUsers().catch(console.error);
