# Manual Video Moderation Guide

## Overview

For now, videos will be manually reviewed instead of using AI moderation. When you have many users, you can switch to OpenAI AI moderation.

---

## Quick Setup (One-Time)

### Option A: Auto-Approve All Videos (Recommended for MVP)

Run this in **Supabase SQL Editor**:

```sql
-- Set default moderation status to 'approved'
ALTER TABLE skill_videos 
ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Approve all existing pending videos
UPDATE skill_videos
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';
```

**Result:** All future uploads will be automatically approved. You can manually review and remove inappropriate videos later.

---

### Option B: Manual Review Required

Keep videos as `pending` by default and approve them manually using the queries below.

---

## Manual Moderation Workflow

### 1. View Pend Videos

```sql
SELECT 
    sv.id,
    sv.title,
    sv.description,
    sv.video_url,
    sv.moderation_status,
    sv.created_at,
    p.full_name as provider_name,
    sc.name as category
FROM skill_videos sv
LEFT JOIN profiles p ON p.id = sv.provider_id
LEFT JOIN skill_categories sc ON sc.id = sv.category_id
WHERE sv.moderation_status = 'pending'
ORDER BY sv.created_at DESC;
```

### 2. Watch the Video

- Copy the `video_url` from the query results
- Open it in your browser and watch the video
- Decide if it's appropriate and skill-related

### 3. Approve the Video

```sql
-- Replace VIDEO_ID with the actual video ID
UPDATE skill_videos
SET moderation_status = 'approved'
WHERE id = 'VIDEO_ID_HERE';

-- Optional: Create moderation record
INSERT INTO video_moderation (
    video_id, status, is_skill_related, moderation_reason, moderated_by
) VALUES (
    'VIDEO_ID_HERE', 'approved', true, 'Approved by admin', 'ADMIN'
);
```

### 4. Reject the Video

```sql
-- Replace VIDEO_ID with the actual video ID
UPDATE skill_videos
SET moderation_status = 'rejected'
WHERE id = 'VIDEO_ID_HERE';

-- Optional: Create rejection record
INSERT INTO video_moderation (
    video_id, status, is_skill_related, moderation_reason, moderated_by
) VALUES (
    'VIDEO_ID_HERE', 'rejected', false, 'Not skill-related content', 'ADMIN'
);
```

---

## Bulk Operations

### Approve All Pending Videos

```sql
UPDATE skill_videos
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';
```

### View Moderation Statistics

```sql
SELECT 
    moderation_status,
    COUNT(*) as count
FROM skill_videos
GROUP BY moderation_status;
```

### View Recent Moderation History

```sql
SELECT 
    sv.title,
    sv.moderation_status,
    vm.moderation_reason,
    vm.moderated_at,
    p.full_name as provider
FROM skill_videos sv
LEFT JOIN video_moderation vm ON vm.video_id = sv.id
LEFT JOIN profiles p ON p.id = sv.provider_id
ORDER BY sv.created_at DESC
LIMIT 20;
```

---

## Daily Moderation Routine

1. **Morning:** Run "View Pending Videos" query
2. **Review:** Watch each pending video
3. **Action:** Approve good videos, reject inappropriate ones
4. **Track:** Check statistics to monitor content quality

---

## When to Switch to AI Moderation

Consider switching to OpenAI AI moderation when:

- ✅ You have **50+ video uploads per day**
- ✅ Manual review is taking too much time
- ✅ You have budget for API costs (~$0.002 per video)
- ✅ You want instant approvals for better UX

**To enable AI moderation:**
1. Add OpenAI API credits to your account
2. Update `server/.env` with `OPENAI_API_KEY`
3. Videos will be automatically moderated on upload

---

## Frontend Integration

### Current Behavior

When providers upload videos:
1. Video is saved to database
2. Status set to `pending` (or `approved` if you chose Option A)
3. User sees "Video uploaded successfully"
4. If pending: "Your video will be reviewed shortly"
5. If auto-approved: Video appears immediately in their profile

### Update VideoManager Component (Optional)

You can show moderation status to providers in their dashboard:

```tsx
// In VideoManager.tsx
<div className="text-sm text-gray-600">
  Status: 
  {video.moderation_status === 'approved' && (
    <span className="text-green-600 ml-2">✓ Approved</span>
  )}
  {video.moderation_status === 'pending' && (
    <span className="text-yellow-600 ml-2">⏳ Under Review</span>
  )}
  {video.moderation_status === 'rejected' && (
    <span className="text-red-600 ml-2">✗ Rejected</span>
  )}
</div>
```

---

## Tips for Manual Moderation

### What to Approve ✅
- Professional skill demonstrations
- Educational content about trades/services
- Clean, appropriate tutorials
- Technical how-to videos

### What to Reject ❌
- Sexual/explicit content
- Violence or dangerous content
- Random vlogs/personal videos
- Content unrelated to professional services
- Spam or promotional content

### Gray Area 🤔
- Cooking/baking (Usually approve - it's a skill)
- Dancing (Reject unless it's teaching professional choreography)
- Gaming (Reject unless it's teaching game development)
- Fitness (Approve if teaching specific techniques)

---

## Database Schema Reference

```sql
skill_videos
├── id (UUID)
├── title
├── description
├── video_url
├── moderation_status ('pending' | 'approved' | 'rejected')
├── provider_id
├── category_id
└── created_at

video_moderation
├── id (UUID)
├── video_id (FK → skill_videos)
├── status ('pending' | 'approved' | 'rejected')
├── moderation_reason
├── moderated_by
└── moderated_at
```

---

## Quick Reference SQL File

All queries are available in:
`src/lib/database/manual_moderation_queries.sql`

Open this file and copy-paste queries as needed!

---

**🎯 Recommendation for Launch:**

Use **Option A (Auto-Approve)** to start. You can:
1. Monitor videos daily
2. Manually remove any inappropriate content if it appears
3. Switch to AI moderation when volume increases

This gives the best user experience while keeping control! 🚀
