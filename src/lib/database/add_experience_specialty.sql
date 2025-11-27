-- Add experience and specialty columns to profiles table
alter table public.profiles 
add column if not exists experience text,
add column if not exists specialty text;
