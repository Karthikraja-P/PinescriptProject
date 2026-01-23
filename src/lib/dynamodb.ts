import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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

export const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});

export const TABLE_NAME = process.env.TABLE_NAME || "PinescriptProjects";
