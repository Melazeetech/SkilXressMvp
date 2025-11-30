-- Create video moderation table to store AI moderation results
CREATE TABLE IF NOT EXISTS public.video_moderation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.skill_videos(id) ON DELETE CASCADE,
    
    -- Moderation status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    
    -- Safety flags
    nudity_detected BOOLEAN DEFAULT false,
    violence_detected BOOLEAN DEFAULT false,
    explicit_content_detected BOOLEAN DEFAULT false,
    
    -- Content classification
    is_skill_related BOOLEAN DEFAULT null,
    detected_skill_category VARCHAR(255),
    
    -- AI Analysis results
    video_summary TEXT,
    moderation_reason TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- API responses (for debugging)
    safety_api_response JSONB,
    classification_api_response JSONB,
    
    -- Metadata
    moderated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    moderated_by VARCHAR(50) DEFAULT 'AI', -- 'AI' or admin user ID
    
    UNIQUE(video_id)
);

-- Add moderation_status to skill_videos table
ALTER TABLE public.skill_videos 
    ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'pending';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_moderation_status ON public.video_moderation(status);
CREATE INDEX IF NOT EXISTS idx_video_moderation_video_id ON public.video_moderation(video_id);
CREATE INDEX IF NOT EXISTS idx_skill_videos_moderation_status ON public.skill_videos(moderation_status);

-- Enable RLS
ALTER TABLE public.video_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow service role (backend) to do everything
DROP POLICY IF EXISTS "Service role can manage moderation" ON public.video_moderation;
CREATE POLICY "Service role can manage moderation"
    ON public.video_moderation
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow providers to view their own video moderation results
DROP POLICY IF EXISTS "Providers can view their video moderation" ON public.video_moderation;
CREATE POLICY "Providers can view their video moderation"
    ON public.video_moderation
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.skill_videos 
            WHERE skill_videos.id = video_moderation.video_id 
            AND skill_videos.provider_id = auth.uid()
        )
    );

-- Function to update video moderation status
CREATE OR REPLACE FUNCTION public.update_video_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the skill_videos table with the moderation status
    UPDATE public.skill_videos
    SET moderation_status = NEW.status
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync moderation status
DROP TRIGGER IF EXISTS on_moderation_status_updated ON public.video_moderation;
CREATE TRIGGER on_moderation_status_updated
    AFTER INSERT OR UPDATE OF status ON public.video_moderation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_video_moderation_status();
