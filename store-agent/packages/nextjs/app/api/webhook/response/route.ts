import { NextRequest, NextResponse } from "next/server";
import { updateMessageResponse } from "@/lib/supabase";

// This endpoint is called by agents to send their responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, response: agentResponse } = body;

    if (!messageId || !agentResponse) {
      return NextResponse.json(
        { error: "Missing required fields: messageId and response" },
        { status: 400 }
      );
    }

    // Update message with agent's response
    await updateMessageResponse(messageId, agentResponse);

    return NextResponse.json({
      status: "success",
      messageId,
    });
  } catch (error) {
    console.error("Error processing webhook response:", error);
    return NextResponse.json(
      { error: "Failed to process response" },
      { status: 500 }
    );
  }
}
