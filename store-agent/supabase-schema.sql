-- Store Agent Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Trading', 'E-commerce', 'News', 'DeFi', 'Dev')),
  webhook_url TEXT NOT NULL,
  price_per_month TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  twitter_handle TEXT DEFAULT '',
  twitter_followers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_owner ON agents(owner_address);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_contract_id ON agents(contract_id);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(contract_id),
  subscriber_address TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, subscriber_address)
);

-- Create index for faster subscription lookups
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_address);
CREATE INDEX idx_subscriptions_agent ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(contract_id),
  subscriber_address TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster message lookups
CREATE INDEX idx_messages_agent ON messages(agent_id);
CREATE INDEX idx_messages_subscriber ON messages(subscriber_address);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for agents (public read, owner write)
CREATE POLICY "Agents are publicly readable"
  ON agents FOR SELECT
  USING (true);

CREATE POLICY "Agents can be inserted by anyone"
  ON agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agents can be updated by owner"
  ON agents FOR UPDATE
  USING (true);

-- Policies for subscriptions
CREATE POLICY "Subscriptions are publicly readable"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Subscriptions can be created by anyone"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- Policies for messages
CREATE POLICY "Messages are readable by participants"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Messages can be created by anyone"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Messages can be updated (for responses)"
  ON messages FOR UPDATE
  USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for agents updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
