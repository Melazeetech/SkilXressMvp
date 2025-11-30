-- Manual Video Moderation Queries
-- Use these queries in Supabase SQL Editor to manually approve/reject videos

-- ========================================
-- 1. VIEW PENDING VIDEOS (Need Review)
-- ========================================

SELECT 
    sv.id,
    sv.title,
    sv.description,
    sv.video_url,
    sv.moderation_status,
    sv.created_at,
    p.full_name as provider_name,
    p.email as provider_email,
    sc.name as category
FROM skill_videos sv
LEFT JOIN profiles p ON p.id = sv.provider_id
LEFT JOIN skill_categories sc ON sc.id = sv.category_id
WHERE sv.moderation_status = 'pending'
ORDER BY sv.created_at DESC;

-- ========================================
-- 2. APPROVE A VIDEO (Replace VIDEO_ID)
-- ========================================

UPDATE skill_videos
SET moderation_status = 'approved'
WHERE id = 'VIDEO_ID_HERE';

-- Also create a moderation record
INSERT INTO video_moderation (
    video_id,
    status,
    nudity_detected,
    violence_detected,
    explicit_content_detected,
    is_skill_related,
    detected_skill_category,
    video_summary,
    moderation_reason,
    confidence_score,
    moderated_by
) VALUES (
    'VIDEO_ID_HERE',
    'approved',
    false,
    false,
    false,
    true,
    'manual approval',
    'Manually reviewed and approved',
    'Approved by admin - manual review',
    1.0,
    'ADMIN'
);

-- ========================================
-- 3. REJECT A VIDEO (Replace VIDEO_ID)
-- ========================================

UPDATE skill_videos
SET moderation_status = 'rejected'
WHERE id = 'VIDEO_ID_HERE';

-- Create rejection record
INSERT INTO video_moderation (
    video_id,
    status,
    nudity_detected,
    violence_detected,
    explicit_content_detected,
    is_skill_related,
    video_summary,
    moderation_reason,
    confidence_score,
    moderated_by
) VALUES (
    'VIDEO_ID_HERE',
    'rejected',
    false,
    false,
    false,
    false,
    'Manually reviewed and rejected',
    'Rejected by admin - not skill-related content',
    0.0,
    'ADMIN'
);

-- ========================================
-- 4. APPROVE ALL PENDING VIDEOS (Bulk)
-- ========================================

UPDATE skill_videos
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';

-- ========================================
-- 5. VIEW ALL MODERATION HISTORY
-- ========================================

SELECT 
    sv.title,
    sv.moderation_status,
    vm.status as mod_status,
    vm.moderation_reason,
    vm.moderated_at,
    vm.moderated_by,
    p.full_name as provider
FROM skill_videos sv
LEFT JOIN video_moderation vm ON vm.video_id = sv.id
LEFT JOIN profiles p ON p.id = sv.provider_id
ORDER BY sv.created_at DESC
LIMIT 20;

-- ========================================
-- 6. STATISTICS
-- ========================================

SELECT 
    moderation_status,
    COUNT(*) as count
FROM skill_videos
GROUP BY moderation_status;

-- ========================================
-- 7. AUTO-APPROVE ALL NEW UPLOADS (Optional)
-- ========================================
-- If you want all videos to be automatically approved on upload,
-- run this to set default status:

ALTER TABLE skill_videos 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Then all future uploads will be auto-approved
-- Existing pending videos still need manual approval
