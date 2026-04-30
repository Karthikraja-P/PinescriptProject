import { createUser } from "../src/lib/db-actions";
import { hash } from "bcryptjs";

async function seed() {
    console.log("Seeding REAL database...");
    const password = "password123";
    const passwordHash = await hash(password, 10);

    const users = [
        {
            name: "Admin User",
            email: "admin@test.com",
            passwordHash,
            role: "ADMIN" as const
        },
        {
            name: "Client User",
            email: "client@test.com",
            passwordHash,
            role: "CLIENT" as const
        }
    ];

    for (const user of users) {
        try {
            await createUser(user);
            console.log(`Created ${user.role}: ${user.email} / ${password}`);
        } catch (e: any) {
            if (e.name === 'ConditionalCheckFailedException') {
                console.log(`User ${user.email} already exists.`);
            } else {
                console.error(`Error creating ${user.email}:`, e);
            }
        }
    }
}

seed();
