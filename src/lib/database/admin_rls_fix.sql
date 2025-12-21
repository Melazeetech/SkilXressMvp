-- ========================================================
-- ADMIN RLS POLICIES AND SCHEMA FIX
-- Run this in your Supabase SQL Editor to enable Admin Panel 
-- functionality for video approval and provider verification.
-- ========================================================

-- 1. Update Profiles Table to allow 'admin' user_type
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
    CHECK (user_type IN ('client', 'provider', 'admin'));

-- 2. Ensure both 'status' and 'moderation_status' columns exist on skill_videos
-- (This ensures compatibility between older and newer code/schemas)
ALTER TABLE public.skill_videos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.skill_videos ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Sync them for existing records
UPDATE public.skill_videos SET status = moderation_status WHERE status IS NULL AND moderation_status IS NOT NULL;
UPDATE public.skill_videos SET moderation_status = status WHERE moderation_status IS NULL AND status IS NOT NULL;

-- 3. RLS POLICIES FOR ADMINS

-- A. Allow admins to update any profile (for verification)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- B. Allow admins to update any video (for moderation/approval)
DROP POLICY IF EXISTS "Admins can update all skill_videos" ON public.skill_videos;
CREATE POLICY "Admins can update all skill_videos"
    ON public.skill_videos FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- C. Allow admins to insert notifications (to notify providers of approval)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- D. Allow admins to manage moderation history
DROP POLICY IF EXISTS "Admins can manage moderation" ON public.video_moderation;
CREATE POLICY "Admins can manage moderation"
    ON public.video_moderation FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- 4. UPDATE SYNC TRIGGER
-- Ensure both status columns stay in sync when update_video_moderation_status is called
CREATE OR REPLACE FUNCTION public.update_video_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.skill_videos
    SET 
        moderation_status = NEW.status,
        status = NEW.status
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. HOW TO MAKE YOURSELF AN ADMIN (RUN THIS INDIVIDUALLY)
/*
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE email = 'your-email@example.com';
*/
