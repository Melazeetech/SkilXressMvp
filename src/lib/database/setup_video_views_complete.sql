-- Complete setup for video views tracking
-- Run this entire script in the Supabase SQL Editor

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.skill_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(video_id, user_id)
);

-- 2. Fix Foreign Key to point to profiles (ensures we can fetch user details)
DO $$
BEGIN
    -- Drop the old constraint if it exists (referencing auth.users)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_views_user_id_fkey') THEN
        ALTER TABLE public.video_views DROP CONSTRAINT video_views_user_id_fkey;
    END IF;
END $$;

-- Add the correct constraint referencing public.profiles
-- We use a DO block to avoid error if it already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_views_user_id_fkey_profiles') THEN
        ALTER TABLE public.video_views
            ADD CONSTRAINT video_views_user_id_fkey_profiles
            FOREIGN KEY (user_id)
            REFERENCES public.profiles(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- 4. Reset Policies
DROP POLICY IF EXISTS "Users can insert their own views" ON public.video_views;
DROP POLICY IF EXISTS "Users can view their own view history" ON public.video_views;
DROP POLICY IF EXISTS "Anyone can view video views" ON public.video_views;

-- Allow anyone to insert a view (authenticated)
CREATE POLICY "Users can insert their own views"
    ON public.video_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view the views (public read access)
CREATE POLICY "Anyone can view video views"
    ON public.video_views
    FOR SELECT
    USING (true);

-- 5. Setup Trigger for View Counting
CREATE OR REPLACE FUNCTION public.handle_new_video_view()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.skill_videos
    SET views_count = views_count + 1
    WHERE id = NEW.video_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_video_view_created ON public.video_views;
CREATE TRIGGER on_video_view_created
    AFTER INSERT ON public.video_views
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_video_view();
