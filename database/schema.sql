-- BlinkTip Database Schema
-- PostgreSQL/Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT slug_length CHECK (char_length(slug) >= 3 AND char_length(slug) <= 50),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9_-]+$')
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  signature TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('human', 'agent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT valid_token CHECK (token IN ('USDC', 'CASH'))
);

-- Agent actions table
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_url TEXT NOT NULL,
  content_title TEXT,
  content_source TEXT,
  evaluation_score INTEGER CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
  decision TEXT NOT NULL CHECK (decision IN ('tip', 'skip', 'error')),
  tip_id UUID REFERENCES tips(id) ON DELETE SET NULL,
  reasoning TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT url_format CHECK (content_url ~ '^https?://')
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_creators_slug ON creators(slug);
CREATE INDEX IF NOT EXISTS idx_creators_wallet ON creators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_creators_created_at ON creators(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tips_creator_id ON tips(creator_id);
CREATE INDEX IF NOT EXISTS idx_tips_signature ON tips(signature);
CREATE INDEX IF NOT EXISTS idx_tips_source ON tips(source);
CREATE INDEX IF NOT EXISTS idx_tips_status ON tips(status);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_confirmed_at ON tips(confirmed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_actions_tip_id ON agent_actions(tip_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_decision ON agent_actions(decision);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_score ON agent_actions(evaluation_score DESC);

-- Creator stats view
CREATE OR REPLACE VIEW creator_stats AS
SELECT
  c.id,
  c.slug,
  c.name,
  c.wallet_address,
  COUNT(DISTINCT t.id) as total_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'human' THEN t.id END) as human_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'agent' THEN t.id END) as agent_tips,
  COALESCE(SUM(CASE WHEN t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'human' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as human_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'agent' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as agent_earnings,
  MAX(t.created_at) as last_tip_at
FROM creators c
LEFT JOIN tips t ON c.id = t.creator_id
GROUP BY c.id, c.slug, c.name, c.wallet_address;

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creators table
CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON creators
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
