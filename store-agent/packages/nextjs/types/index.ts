export interface Agent {
  id: number;
  owner: string;
  name: string;
  category: string;
  pricePerMonth: bigint;
  webhookUrl: string;
  twitterHandle: string;
  active: boolean;
  createdAt: number;
}

export interface Subscription {
  agentId: number;
  subscriber: string;
  expiresAt: number;
}

export interface Message {
  id: string;
  agent_id: number;
  sender_address: string;
  content: string;
  response: string | null;
  created_at: string;
}

export interface AgentDB {
  id: number;
  contract_id: number;
  owner_address: string;
  name: string;
  category: string;
  price_per_month: string;
  webhook_url: string;
  twitter_handle: string;
  twitter_followers: number;
  active: boolean;
  created_at: string;
}

export type Category = "Trading" | "E-commerce" | "News" | "DeFi" | "Dev";

export const CATEGORIES: Category[] = ["Trading", "E-commerce", "News", "DeFi", "Dev"];
