-- Add visibility and status columns to profiles table
alter table public.profiles 
add column if not exists is_public boolean default true,
add column if not exists status text default 'active' check (status in ('active', 'deactivated', 'suspended'));

-- Policy to only show public profiles (optional, depending on requirements)
-- For now, we'll just add the columns.
