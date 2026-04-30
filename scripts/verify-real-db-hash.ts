import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { compare } from "bcryptjs";

async function verify() {
    const email = "client@test.com";
    const result = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${email}`, SK: "PROFILE" }
    }));

    if (!result.Item) {
        console.log("User not found in REAL DB");
        return;
    }

    const hash = result.Item.passwordHash;
    console.log("Hash in DB:", hash);

    const passwords = ["password", "password123", "client", "client123"];
    for (const pw of passwords) {
        const isValid = await compare(pw, hash);
        console.log(`Password "${pw}" is valid:`, isValid);
    }
}

verify();
