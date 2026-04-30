import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';
import { mockDB } from './mock-db';

dotenv.config();

const useMock = process.env.DYNAMODB_ENDPOINT === 'mock';

const config = {
    region: process.env.DYNAMODB_REGION || process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
    },
    ...(process.env.DYNAMODB_ENDPOINT && process.env.DYNAMODB_ENDPOINT !== 'mock'
        ? { endpoint: process.env.DYNAMODB_ENDPOINT }
        : {}),
};

const client = new DynamoDBClient(config);

// Use mock DB for local development, real DB for production
export const db = useMock ? mockDB as any : DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});

export const TABLE_NAME = process.env.TABLE_NAME || "PinescriptProjects";
