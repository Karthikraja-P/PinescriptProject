import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { hash } from "bcryptjs";
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function seedUsers() {
    console.log("Seeding test users into DynamoDB...");

    const users = [
        {
            name: "Client User",
            email: "client@pinescript.com",
            password: "client123",
            role: "CLIENT"
        },
        {
            name: "Admin User",
            email: "admin@pinescript.com",
            password: "admin123",
            role: "ADMIN"
        }
    ];

    for (const u of users) {
        // Check if exists
        const pk = `USER#${u.email}`;
        const existing = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: pk, SK: 'PROFILE' }
        }));

        if (existing.Item) {
            console.log(`User ${u.email} already exists. Skipping.`);
            continue;
        }

        const hashedPassword = await hash(u.password, 10);

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: pk,
                SK: 'PROFILE',
                name: u.name,
                email: u.email,
                passwordHash: hashedPassword,
                role: u.role,
                createdAt: new Date().toISOString()
            }
        }));
        console.log(`Created user: ${u.email} (${u.role})`);
    }
    console.log("Seeding complete.");
}

seedUsers();
