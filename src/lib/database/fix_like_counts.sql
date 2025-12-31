-- Function to handle like count updates automatically
CREATE OR REPLACE FUNCTION public.handle_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.skill_videos
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.skill_videos
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after insert or delete on video_likes
DROP TRIGGER IF EXISTS on_video_like_change ON public.video_likes;
CREATE TRIGGER on_video_like_change
    AFTER INSERT OR DELETE ON public.video_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_video_like_count();

-- One-time sync to ensure all counts are correct
UPDATE public.skill_videos v
SET likes_count = (
    SELECT COUNT(*)
    FROM public.video_likes vl
    WHERE vl.video_id = v.id
);
