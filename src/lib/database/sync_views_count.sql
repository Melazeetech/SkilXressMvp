-- Sync views_count in skill_videos with the actual count from video_views
-- This fixes discrepancies between the displayed count and the actual list of viewers

UPDATE public.skill_videos v
SET views_count = (
    SELECT COUNT(*)
    FROM public.video_views vv
    WHERE vv.video_id = v.id
);
