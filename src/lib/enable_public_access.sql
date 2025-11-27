-- Enable public read access for essential tables
-- Run this in your Supabase Dashboard > SQL Editor

-- 1. Profiles (Provider details)
-- Allow anyone (anon and authenticated) to read profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. Skill Videos (The video feed)
-- Allow anyone to watch videos
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON skill_videos;
CREATE POLICY "Videos are viewable by everyone" 
ON skill_videos FOR SELECT 
USING (true);

-- 3. Skill Categories (Filtering)
-- Allow anyone to see categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON skill_categories;
CREATE POLICY "Categories are viewable by everyone" 
ON skill_categories FOR SELECT 
USING (true);

-- 4. Ratings (Reviews)
-- Allow anyone to read ratings/reviews
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
CREATE POLICY "Ratings are viewable by everyone" 
ON ratings FOR SELECT 
USING (true);

-- 5. Work Samples (Portfolio)
-- Allow anyone to see work samples
DROP POLICY IF EXISTS "Work samples are viewable by everyone" ON work_samples;
CREATE POLICY "Work samples are viewable by everyone" 
ON work_samples FOR SELECT 
USING (true);

-- Note: We are NOT enabling public write/insert/update/delete access. 
-- Those should remain restricted to authenticated users only.
