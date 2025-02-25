import { NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { getServerSession } from "next-auth";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch data from DynamoDB
    const command = new ScanCommand({
      TableName: "house_amendments",
    });

    const result = await client.send(command);

    // Transform the DynamoDB items to a more usable format
    const amendments =
      result.Items?.map((item) => ({
        billNumber: item.billNumber.S,
        date: item.date.S,
        lcoLink: item.lcoLink.S,
        billLink: item.billLink.S,
        lcoNumber: item.lcoNumber.S,
        calNumber: item.calNumber.S,
      })) || [];

    return NextResponse.json(amendments);
  } catch (error) {
    console.error("Error fetching house amendments:", error);
    return NextResponse.json(
      { error: "Failed to fetch house amendments" },
      { status: 500 }
    );
  }
}
