import { getUserByEmail, getAllUsersAdmin } from "../src/lib/db-actions";
import { db, TABLE_NAME } from "../src/lib/dynamodb";

async function check() {
    console.log("Checking DB connection...");
    console.log("Table Name:", TABLE_NAME);
    
    try {
        const users = await getAllUsersAdmin();
        console.log("Total users found:", users.length);
        users.forEach(u => {
            console.log(`- ${u.email} (${u.role})`);
        });

        const testEmail = "admin@pinescript.com";
        const user = await getUserByEmail(testEmail);
        if (user) {
            console.log(`Found user ${testEmail}:`, JSON.stringify(user, null, 2));
        } else {
            console.log(`User ${testEmail} NOT found.`);
        }
    } catch (e) {
        console.error("DB check failed:", e);
    }
}

check();
