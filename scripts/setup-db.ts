import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

async function setupTable() {
    console.log(`Checking table: ${TABLE_NAME}...`);
    console.log(`Region: ${config.region}`);

    try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log(`Table ${TABLE_NAME} already exists.`);
        return;
    } catch (e: any) {
        if (e.name !== 'ResourceNotFoundException') {
            console.error("Error checking table:", e);
            throw e;
        }
        console.log(`Table ${TABLE_NAME} does not exist. Creating...`);
    }

    const params = {
        TableName: TABLE_NAME,
        KeySchema: [
            { AttributeName: "PK", KeyType: "HASH" },
            { AttributeName: "SK", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
            { AttributeName: "PK", AttributeType: "S" },
            { AttributeName: "SK", AttributeType: "S" },
            { AttributeName: "GSI1PK", AttributeType: "S" },
            { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "GSI1",
                KeySchema: [
                    { AttributeName: "GSI1PK", KeyType: "HASH" },
                    { AttributeName: "GSI1SK", KeyType: "RANGE" },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    };

    try {
        // @ts-ignore
        await client.send(new CreateTableCommand(params));
        console.log(`Table ${TABLE_NAME} creation initiated.`);
        console.log("Waiting for table to be active (this might take a few seconds)...");

        // Simple wait loop
        let active = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const desc = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
                if (desc.Table?.TableStatus === 'ACTIVE') {
                    active = true;
                    break;
                }
                process.stdout.write('.');
            } catch (e) { }
        }

        if (active) {
            console.log(`\nTable ${TABLE_NAME} is now ACTIVE and ready to use.`);
        } else {
            console.log(`\nTable created but not yet ACTIVE. Please wait a moment before using.`);
        }

    } catch (e) {
        console.error("Error creating table:", e);
    }
}

setupTable();
