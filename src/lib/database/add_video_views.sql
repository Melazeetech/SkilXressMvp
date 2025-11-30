-- Create video_views table to track unique views
CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.skill_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for anonymous views if we allow them, but user asked for "each user view video once", implying auth users. Let's assume auth users for now, or track by IP if anonymous (but IP tracking is harder in this setup). Let's stick to authenticated users or just track session-based unique views if possible. For now, let's assume user_id is required for "unique user view".
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(video_id, user_id) -- Ensure one view per user per video
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to insert a view (authenticated)
CREATE POLICY "Users can insert their own views"
    ON public.video_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to see their own views (optional, but good for debugging)
CREATE POLICY "Users can view their own view history"
    ON public.video_views
    FOR SELECT
    USING (auth.uid() = user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.handle_new_video_view()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.skill_videos
    SET views_count = views_count + 1
    WHERE id = NEW.video_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment view count on new insert
DROP TRIGGER IF EXISTS on_video_view_created ON public.video_views;
CREATE TRIGGER on_video_view_created
    AFTER INSERT ON public.video_views
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_video_view();
