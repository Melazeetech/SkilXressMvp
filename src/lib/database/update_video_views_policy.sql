-- Update RLS policy for video_views to allow public read access
DROP POLICY IF EXISTS "Users can view their own view history" ON public.video_views;

CREATE POLICY "Anyone can view video views"
    ON public.video_views
    FOR SELECT
    USING (true);

-- Fix Foreign Key to point to profiles for easier joining
-- We first try to drop the constraint if it exists (referencing auth.users)
-- Note: The name might vary if it was auto-generated, but video_views_user_id_fkey is standard
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_views_user_id_fkey') THEN
        ALTER TABLE public.video_views DROP CONSTRAINT video_views_user_id_fkey;
    END IF;
END $$;

-- Add the new constraint referencing public.profiles
ALTER TABLE public.video_views
    ADD CONSTRAINT video_views_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
