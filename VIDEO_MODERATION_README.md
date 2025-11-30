# SkilXpress Video Moderation System

## 📋 Overview

This is a comprehensive AI-powered video moderation pipeline for the SkilXpress platform. It automatically checks uploaded skill demonstration videos for:

1. **Safety & Nudity Detection** - Flags inappropriate content
2. **Violence & Explicit Content** - Identifies unsafe material
3. **Skill-Related Content Verification** - Ensures videos demonstrate actual professional skills

## 🚀 Quick Start

### 1. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- See: src/lib/database/video_moderation_schema.sql
-- This creates the video_moderation table and triggers
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# OpenAI API (required for moderation)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key (for backend operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Adjust moderation thresholds (0-1 scale)
MODERATION_SKILL_CONFIDENCE_THRESHOLD=0.6
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Start the Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Server will run on `http://localhost:3001`

## 📡 API Endpoints

### 1. Upload & Moderate Video

**POST** `/api/moderation/upload`

Upload a new video and run immediate moderation.

**Request:**
```json
{
  "providerId": "uuid-of-provider",
  "title": "Professional Haircutting Techniques",
  "description": "Demonstrating modern layering techniques",
  "categoryId": "uuid-of-skill-category",
  "videoURL": "https://storage.example.com/video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "videoId": "new-video-uuid",
  "approved": true,
  "moderation": {
    "nudityFlag": false,
    "violenceFlag": false,
    "explicitContentFlag": false,
    "skillFlag": false,
    "isSkillRelated": true,
    "detectedSkill": "haircutting",
    "videoSummary": "Professional demonstrates modern layering haircutting techniques",
    "reason": "Approved - haircutting demonstration (95% confidence)",
    "confidenceScore": 0.95,
    "approved": true
  },
  "message": "Video uploaded and approved!"
}
```

### 2. Moderate Existing Video

**POST** `/api/moderation/moderate`

Run moderation on an existing video.

**Request:**
```json
{
  "videoId": "existing-video-uuid",
  "videoURL": "https://storage.example.com/video.mp4",
  "title": "Welding Tutorial",
  "description": "Basic welding techniques for beginners"
}
```

**Response:**
```json
{
  "success": true,
  "moderation": {
    "nudityFlag": false,
    "violenceFlag": false,
    "explicitContentFlag": false,
    "skillFlag": false,
    "isSkillRelated": true,
    "detectedSkill": "welding",
    "videoSummary": "Person demonstrates welding techniques with proper safety equipment",
    "reason": "Approved - welding demonstration (88% confidence)",
    "confidenceScore": 0.88,
    "approved": true
  },
  "stored": true
}
```

### 3. Check Moderation Status

**GET** `/api/moderation/status/:videoId`

Get the current moderation status of a video.

**Response:**
```json
{
  "success": true,
  "status": "approved",
  "moderation": {
    "id": "moderation-record-uuid",
    "video_id": "video-uuid",
    "status": "approved",
    "nudity_detected": false,
    "violence_detected": false,
    "explicit_content_detected": false,
    "is_skill_related": true,
    "detected_skill_category": "welding",
    "video_summary": "...",
    "moderation_reason": "Approved - welding demonstration",
    "confidence_score": 0.88,
    "moderated_at": "2025-11-28T20:00:00Z"
  }
}
```

### 4. Re-run Moderation

**POST** `/api/moderation/remoderate/:videoId`

Re-run moderation on a video (useful for manual review).

**Response:**
```json
{
  "success": true,
  "moderation": { /* same as moderate endpoint */ }
}
```

## 🔧 How It Works

### Moderation Pipeline

```
1. Video URL Received
        ↓
2. Safety Check (OpenAI Moderation API)
   - Check text content for violations
   - Analyze video context
        ↓
3. Skill Classification (GPT-4)
   - Generate video summary
   - Classify if skill-related
   - Detect specific skill category
        ↓
4. Decision
   - If ANY flag = true → REJECT
   - If confidence < threshold → REJECT
   - If all checks pass → APPROVE
        ↓
5. Store Results in Database
   - Update video_moderation table
   - Trigger updates skill_videos.moderation_status
```

### Supported Skills

The system recognizes these professional skills:

- **Beauty & Personal Care**: Haircutting, hairstyling, makeup, cosmetics
- **Trades**: Welding, plumbing, carpentry, electrical work, painting
- **Crafts**: Tailoring, sewing, woodwork
- **Services**: Cleaning, repairs, handyman, gardening, landscaping
- **Technical**: Auto repair, mechanics, construction, photography
- **Culinary**: Cooking, catering, baking

## 🔐 Security Features

1. **RLS Policies**: Providers can only view their own moderation results
2. **Service Role Authentication**: Backend uses service role key for unrestricted access
3. **Input Validation**: All endpoints validate required fields
4. **Error Handling**: Comprehensive error logging and user-friendly messages
5. **Fail-Safe Design**: If APIs fail, videos are flagged for manual review

## 📊 Database Schema

```sql
video_moderation
├── id (UUID, Primary Key)
├── video_id (UUID, FK → skill_videos)
├── status (VARCHAR: pending | approved | rejected)
├── nudity_detected (BOOLEAN)
├── violence_detected (BOOLEAN)
├── explicit_content_detected (BOOLEAN)
├── is_skill_related (BOOLEAN)
├── detected_skill_category (VARCHAR)
├── video_summary (TEXT)
├── moderation_reason (TEXT)
├── confidence_score (DECIMAL 0.00-1.00)
├── safety_api_response (JSONB)
├── classification_api_response (JSONB)
├── moderated_at (TIMESTAMP)
└── moderated_by (VARCHAR: AI | admin_user_id)
```

## 🧪 Testing

### Example cURL Request

```bash
# Upload and moderate video
curl -X POST http://localhost:3001/api/moderation/upload \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "your-provider-uuid",
    "title": "Professional Haircutting",
    "description": "Modern layering techniques",
    "categoryId": "skill-category-uuid",
    "videoURL": "https://example.com/video.mp4"
  }'
```

### Test Videos

Create test videos for different scenarios:
- ✅ Approved: Skill demonstration video
- ❌ Rejected (Safety): Video with inappropriate content
- ❌ Rejected (Not Skill): Random personal vlog

## 🔄 Integration with Frontend

### Upload Flow

```typescript
// When provider uploads video
const uploadVideo = async (file: File, metadata: VideoMetadata) => {
  // 1. Upload to storage (Supabase Storage/Cloudinary)
  const videoURL = await uploadToStorage(file);
  
  // 2. Call moderation API
  const response = await fetch('http://localhost:3001/api/moderation/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: user.id,
      title: metadata.title,
      description: metadata.description,
      categoryId: metadata.categoryId,
      videoURL: videoURL
    })
  });
  
  const result = await response.json();
  
  if (result.approved) {
    // Video approved - show success message
    showNotification('Video approved and published!');
  } else {
    // Video rejected - show reason
    showNotification(`Video rejected: ${result.moderation.reason}`);
  }
};
```

## 📈 Scaling Considerations

### Current Implementation
- Synchronous moderation (uploads wait for moderation to complete)
- Direct API calls to OpenAI

### For Production
1. **Async Job Queue**: Use Bull/BullMQ for background processing
2. **Rate Limiting**: Implement rate limits on API endpoints
3. **Caching**: Cache moderation results for identical videos
4. **Batch Processing**: Process multiple videos in parallel
5. **Monitoring**: Add logging/monitoring (e.g., Sentry, LogRocket)

## 🐛 Troubleshooting

### Common Issues

**Problem**: "Moderation failed: OpenAI API key invalid"
- **Solution**: Check your `.env` file has correct `OPENAI_API_KEY`

**Problem**: "Database error: permission denied"
- **Solution**: Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)

**Problem**: "Video approved but not showing in feed"
- **Solution**: Check that `skill_videos.moderation_status` is set to 'approved'

**Problem**: False rejections for skill videos
- **Solution**: Lower `MODERATION_SKILL_CONFIDENCE_THRESHOLD` (default 0.6)

## 📜 License

This moderation system is part of the SkilXpress platform.

## 🤝 Support

For issues or questions, contact the development team.
