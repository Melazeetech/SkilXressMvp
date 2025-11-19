-- Migration: Add Social Features and Portfolio
-- Created: 2025-11-18

-- Create followers table for follow system
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for followers table
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Create work samples/portfolio table
CREATE TABLE IF NOT EXISTS work_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for work samples
CREATE INDEX IF NOT EXISTS idx_work_samples_provider_id ON work_samples(provider_id);

-- Add follower counts to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add more skill categories
INSERT INTO skill_categories (name, icon) VALUES
  ('Carpentry', '🔨'),
  ('Painting', '🎨'),
  ('Gardening', '🌱'),
  ('Tutoring', '📚'),
  ('Fitness Training', '💪'),
  ('Pet Care', '🐕'),
  ('Event Planning', '🎉'),
  ('Catering', '🍽️'),
  ('Photography', '📷'),
  ('Videography', '🎥'),
  ('Web Development', '💻'),
  ('Graphic Design', '🖌️'),
  ('Music Lessons', '🎵'),
  ('Moving Services', '📦'),
  ('Locksmith', '🔑')
ON CONFLICT (name) DO NOTHING;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the person being followed
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    -- Increment following count for the follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for the person being unfollowed
    UPDATE profiles 
    SET followers_count = GREATEST(followers_count - 1, 0) 
    WHERE id = OLD.following_id;
    
    -- Decrement following count for the unfollower
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON followers;
CREATE TRIGGER update_follower_counts_trigger
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Enable RLS on new tables
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_samples ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers table
CREATE POLICY "Users can view all followers"
ON followers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON followers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON followers FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- RLS Policies for work_samples table
CREATE POLICY "Anyone can view work samples"
ON work_samples FOR SELECT
TO public
USING (true);

CREATE POLICY "Providers can create work samples"
ON work_samples FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own work samples"
ON work_samples FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own work samples"
ON work_samples FOR DELETE
TO authenticated
USING (auth.uid() = provider_id);
