-- Migration: Add agent tracking columns to tips table
-- This allows us to track which tips came from the autonomous agent
--
--

-- Add agent tracking columns to tips table
ALTER TABLE tips
  ADD COLUMN IF NOT EXISTS is_agent_tip BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS agent_reasoning TEXT;

-- Create index for agent tip queries
CREATE INDEX IF NOT EXISTS idx_tips_agent ON tips(is_agent_tip, created_at DESC);

-- Update agent_actions table to better track agent decisions
-- Add yaps_score column to track Kaito score at time of decision
ALTER TABLE agent_actions
  ADD COLUMN IF NOT EXISTS yaps_score_7d DECIMAL,
  ADD COLUMN IF NOT EXISTS yaps_score_30d DECIMAL,
  ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);

-- Create index for agent decision analytics
CREATE INDEX IF NOT EXISTS idx_agent_actions_decision ON agent_actions(decision, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_twitter ON agent_actions(twitter_handle);

-- Add comment explaining the schema
COMMENT ON COLUMN tips.is_agent_tip IS 'True if this tip was sent by the autonomous agent';
COMMENT ON COLUMN tips.agent_reasoning IS 'AI-generated explanation of why the agent tipped this creator';
COMMENT ON TABLE agent_actions IS 'Tracks all agent decisions (both TIP and SKIP) with reasoning for analytics';
