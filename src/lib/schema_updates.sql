-- Add last_read_notifications_at to profiles table
ALTER TABLE profiles 
ADD COLUMN last_read_notifications_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
