-- Migration: Add last_seen_at to profiles
-- This column tracks the last time a user interacted with the app

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance on activity queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);
