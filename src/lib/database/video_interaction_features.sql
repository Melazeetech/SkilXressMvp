-- 1. Create video_reports table
CREATE TABLE IF NOT EXISTS public.video_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.skill_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create user_video_preferences table
CREATE TABLE IF NOT EXISTS public.user_video_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.skill_videos(id) ON DELETE CASCADE,
    preference_type VARCHAR(50) NOT NULL, -- 'not_interested'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, video_id, preference_type)
);

-- 3. Enable RLS
ALTER TABLE public.video_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_preferences ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for video_reports
DROP POLICY IF EXISTS "Users can create reports" ON public.video_reports;
CREATE POLICY "Users can create reports"
    ON public.video_reports
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.video_reports;
CREATE POLICY "Users can view their own reports"
    ON public.video_reports
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.video_reports;
CREATE POLICY "Admins can view all reports"
    ON public.video_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update reports" ON public.video_reports;
CREATE POLICY "Admins can update reports"
    ON public.video_reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- 5. RLS Policies for user_video_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_video_preferences;
CREATE POLICY "Users can manage their own preferences"
    ON public.user_video_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_video_reports_video_id ON public.video_reports(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reports_status ON public.video_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON public.user_video_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_video_id ON public.user_video_preferences(video_id);
