import { db, TABLE_NAME } from "../src/lib/dynamodb";
import { UpdateCommand, PutCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

async function verify() {
    console.log("Starting Workflow Verification...");

    // 1. Find the seeded project
    const scanRes = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(PK, :pk) AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": "USER#client@test.com",
            ":sk": "PROJECT#"
        }
    }));

    const project = scanRes.Items?.[0];

    if (!project) {
        console.error("No project found. Run seed-data.ts first.");
        return;
    }

    console.log(`[1] Found Project: ${project.id} (Status: ${project.status})`);

    // 2. Admin Sends Quote
    console.log("[2] simulating Admin sending quote...");
    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: project.PK, SK: project.SK },
        UpdateExpression: "set #status = :s, quote = :q",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
            ":s": "Quote Sent",
            ":q": {
                amount: "200.00",
                currency: "USD",
                deadline: "2024-12-31",
                createdAt: new Date().toISOString()
            }
        }
    }));
    console.log("    - Quote sent.");

    // 3. Payment
    console.log("[3] simulating Payment Callback...");
    const orderId = "PAY-MOCK-" + Date.now();
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: project.PK,
            SK: `PAYMENT#${orderId}`,
            projectId: project.id,
            amount: "200.00",
            status: "COMPLETED",
            createdAt: new Date().toISOString()
        }
    }));

    // Update Project Status
    await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: project.PK, SK: project.SK },
        UpdateExpression: "set #status = :s",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":s": "In Progress" }
    }));
    console.log("    - Payment recorded & Project updated.");

    // 4. Final Verification
    const finalRes = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: project.PK, SK: project.SK }
    }));

    const finalProject = finalRes.Item;
    console.log(`[4] Final Project Status: ${finalProject.status}`);

    if (finalProject.status === 'In Progress') {
        console.log("✅ Workflow Verification PASSED");
    } else {
        console.error("❌ Workflow Verification FAILED");
    }
}

verify();
