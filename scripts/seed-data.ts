import { createUser, createProject } from "../src/lib/db-actions";
import { hash } from "bcryptjs";

async function seed() {
    console.log("Seeding data...");

    // 1. Create Client
    try {
        const passwordHash = await hash("password", 10);
        await createUser({
            name: "Client User",
            email: "client@test.com",
            passwordHash,
            role: "CLIENT"
        });
        console.log("Created Client: client@test.com");

        // 2. Create Project for Client
        const project = await createProject({
            userId: "USER#client@test.com",
            userEmail: "client@test.com",
            title: "Test Strategy",
            type: "strategy",
            budget: "$150-300",
            description: "A test strategy seeded for verification.",
            status: "New"
        });
        console.log("Created Project:", project.id);

        // 3. Create Admin
        await createUser({
            name: "Admin User",
            email: "admin@test.com",
            passwordHash,
            role: "ADMIN"
        });
        console.log("Created Admin: admin@test.com");

    } catch (e) {
        console.error("Seeding error:", e);
    }
}

seed();
