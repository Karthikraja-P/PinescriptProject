import { NextResponse } from "next/server";
import { db, TABLE_NAME } from "@/lib/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function GET() {
    const debugInfo = {
        region: process.env.DYNAMODB_REGION || "not set",
        awsRegion: process.env.AWS_REGION || "not set",
        tableName: TABLE_NAME,
        nextAuthUrl: process.env.NEXTAUTH_URL || "not set",
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    };

    try {
        const testEmail = "admin@pinescript.com";
        const result = await db.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${testEmail}`,
                SK: "PROFILE"
            }
        }));

        return NextResponse.json({
            success: true,
            debugInfo,
            userFound: !!result.Item,
            userRole: result.Item?.role
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            debugInfo,
            error: e.message,
            stack: e.stack
        });
    }
}
