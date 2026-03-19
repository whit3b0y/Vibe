import { NextRequest, NextResponse } from "next/server";
import { createMessage, updateMessageResponse, getAgentById } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, senderAddress } = body;

    if (!agentId || !message || !senderAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get agent to find webhook URL
    const agent = await getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { error: "Agent is not active" },
        { status: 400 }
      );
    }

    // Create message in database
    const dbMessage = await createMessage({
      agent_id: agentId,
      subscriber_address: senderAddress,
      user_message: message,
    });

    // Send to agent webhook (async, don't wait)
    sendToWebhook(agent.webhook_url, {
      messageId: dbMessage.id,
      agentId,
      senderAddress,
      message,
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      console.error("Failed to send to webhook:", err);
    });

    return NextResponse.json({
      messageId: dbMessage.id,
      status: "sent",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

async function sendToWebhook(
  webhookUrl: string,
  payload: {
    messageId: string;
    agentId: string;
    senderAddress: string;
    message: string;
    timestamp: string;
  }
) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }

  return response.json();
}
