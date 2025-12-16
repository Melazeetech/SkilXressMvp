-- SECURE THE PROFILES TABLE
-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 2. Create a secure view for public consumption
-- This view exposes ONLY safe fields. Queries to 'public_profiles' will never return email/phone.
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  user_type,
  bio,
  location,
  experience,
  specialty,
  followers_count,
  following_count,
  created_at
FROM profiles;

-- 3. Grant access to the view
GRANT SELECT ON public_profiles TO anon, authenticated;

-- 4. Create a strict policy for the raw 'profiles' table
-- Only the owner can see their own sensitive data (email, phone)
CREATE POLICY "Users can see their own full profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 5. Allow public read access to 'profiles' table BUT we rely on the frontend 
-- to use 'public_profiles' view for general listing. 
-- However, since your existing code queries 'profiles' directly, we need a hybrid approach 
-- to avoid breaking the app immediately while securing data.

-- TEMPORARY COMPATIBILITY FIX:
-- We will allow reading 'profiles' but we rely on Supabase's column-level security feature if available,
-- OR we accept that for now we must lock it down.
-- Since Supabase doesn't support Column Level Security easily with RLS policies alone:
-- WE MUST UPDATE THE FRONTEND TO USE 'public_profiles' VIEW OR RPC FUNCTIONS.

-- STRATEGY:
-- 1. Keep 'profiles' locked to owner only.
-- 2. Create a new policy that allows everyone to read 'profiles' but ONLY if they don't ask for email/phone? 
-- Postgres doesn't work that way.

-- CORRECT FIX:
-- We will re-enable public access to 'profiles' for now to keep the app working,
-- BUT we will NULL out the email/phone for non-owners using a trigger or just accept 
-- we need to migrate the frontend code.

-- LET'S DO THE ROBUST FIX:
-- We will create a policy that allows everyone to read, but we strongly advise migrating to the view.
-- Actually, a better way for your current setup without rewriting all frontend code:
-- We can't easily "hide" columns in a SELECT * query based on user.

-- ALTERNATIVE:
-- We will assume you will run this SQL.
-- We will create a secure function to fetch profile data that strips sensitive info.

-- FOR THIS STEP, I will create a file that defines the 'public_profiles' view.
-- You should update your frontend to select from 'public_profiles' when listing users,
-- and 'profiles' only when showing the current user's dashboard.

-- HOWEVER, to immediately stop the leak without code changes:
-- We can't. If the code selects '*', it asks for email. If RLS forbids it, the query fails.
-- So we MUST update the code.

-- SQL to run:
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  user_type,
  bio,
  location,
  experience,
  specialty,
  followers_count,
  following_count,
  created_at
FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;
