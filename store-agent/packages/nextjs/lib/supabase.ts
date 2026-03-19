import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database functions
export async function getAgents(category?: string, search?: string) {
  let query = supabase
    .from("agents")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching agents:", error);
    return [];
  }

  return data;
}

export async function getAgentById(id: number) {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("contract_id", id)
    .single();

  if (error) {
    console.error("Error fetching agent:", error);
    return null;
  }

  return data;
}

export async function createAgent(agent: {
  contract_id: number;
  owner_address: string;
  name: string;
  category: string;
  price_per_month: string;
  webhook_url: string;
  twitter_handle: string;
  twitter_followers?: number;
}) {
  const { data, error } = await supabase
    .from("agents")
    .insert([{ ...agent, active: true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating agent:", error);
    throw error;
  }

  return data;
}

export async function getMessages(agentId: number, userAddress: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("agent_id", agentId)
    .eq("sender_address", userAddress)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data;
}

export async function createMessage(message: {
  agent_id: number;
  sender_address: string;
  content: string;
  response?: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert([message])
    .select()
    .single();

  if (error) {
    console.error("Error creating message:", error);
    throw error;
  }

  return data;
}

export async function updateMessageResponse(messageId: string, response: string) {
  const { error } = await supabase
    .from("messages")
    .update({ response })
    .eq("id", messageId);

  if (error) {
    console.error("Error updating message:", error);
    throw error;
  }
}

export async function getUserSubscriptions(userAddress: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, agents(*)")
    .eq("subscriber_address", userAddress)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  return data;
}

export async function createSubscription(subscription: {
  agent_id: number;
  subscriber_address: string;
  expires_at: string;
}) {
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert([subscription], { onConflict: "agent_id,subscriber_address" })
    .select()
    .single();

  if (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }

  return data;
}
