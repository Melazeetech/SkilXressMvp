-- Update existing profiles to have follower count fields
-- This ensures all existing users can use the follow feature

UPDATE profiles 
SET 
  followers_count = 0,
  following_count = 0
WHERE 
  followers_count IS NULL 
  OR following_count IS NULL;
