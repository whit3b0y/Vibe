import { NextRequest, NextResponse } from "next/server";
import { createAgent } from "@/lib/supabase";
import { Category } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractId,
      name,
      description,
      category,
      webhookUrl,
      pricePerMonth,
      ownerAddress,
      twitterHandle,
      twitterFollowers,
    } = body;

    // Validate required fields
    if (!contractId || !name || !webhookUrl || !pricePerMonth || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const agent = await createAgent({
      contract_id: contractId.toString(),
      name,
      description: description || "",
      category: (category as Category) || "Dev",
      webhook_url: webhookUrl,
      price_per_month: pricePerMonth.toString(),
      owner_address: ownerAddress,
      twitter_handle: twitterHandle || "",
      twitter_followers: twitterFollowers || 0,
      is_active: true,
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error registering agent:", error);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 }
    );
  }
}
