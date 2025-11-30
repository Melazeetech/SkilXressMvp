/**
 * Example Usage: Video Moderation API
 * 
 * This file demonstrates how to use the video moderation endpoints
 */

// =============================================================================
// EXAMPLE 1: Upload and Moderate a New Video
// =============================================================================

async function uploadAndModerateVideo() {
    const response = await fetch('http://localhost:3001/api/moderation/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            providerId: 'user-uuid-here',
            title: 'Professional Haircutting Techniques',
            description: 'Demonstrating modern layering techniques for medium-length hair',
            categoryId: 'hairstyling-category-uuid',
            videoURL: 'https://storage.example.com/videos/haircut-demo.mp4'
        })
    });

    const result = await response.json();
    console.log('Upload Result:', result);

    /*
    Example Response:
    {
      "success": true,
      "videoId": "550e8400-e29b-41d4-a716-446655440000",
      "moderation": {
        "nudityFlag": false,
        "violenceFlag": false,
        "explicitContentFlag": false,
        "skillFlag": false,
        "isSkillRelated": true,
        "detectedSkill": "haircutting",
        "videoSummary": "Professional hairstylist demonstrates layering technique",
        "reason": "Approved - haircutting demonstration (95% confidence)",
        "confidenceScore": 0.95,
        "approved": true
      },
      "approved": true,
      "message": "Video uploaded and approved!"
    }
    */
}

// =============================================================================
// EXAMPLE 2: Check Moderation Status
// =============================================================================

async function checkModerationStatus(videoId: string) {
    const response = await fetch(`http://localhost:3001/api/moderation/status/${videoId}`);
    const result = await response.json();
    console.log('Moderation Status:', result);

    /*
    Example Response:
    {
      "success": true,
      "status": "approved",
      "moderation": {
        "id": "moderation-uuid",
        "video_id": "video-uuid",
        "status": "approved",
        "nudity_detected": false,
        "violence_detected": false,
        "explicit_content_detected": false,
        "is_skill_related": true,
        "detected_skill_category": "haircutting",
        "confidence_score": 0.95,
        "moderated_at": "2025-11-28T20:00:00Z"
      }
    }
    */
}

// =============================================================================
// EXAMPLE 3: Moderate Existing Video
// =============================================================================

async function moderateExistingVideo() {
    const response = await fetch('http://localhost:3001/api/moderation/moderate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            videoId: 'existing-video-uuid',
            videoURL: 'https://storage.example.com/videos/welding-demo.mp4',
            title: 'Basic Welding Techniques',
            description: 'Introduction to MIG welding for beginners'
        })
    });

    const result = await response.json();
    console.log('Moderation Result:', result);
}

// =============================================================================
// EXAMPLE 4: Rejected Video (Inappropriate Content)
// =============================================================================

async function exampleRejectedVideo() {
    const response = await fetch('http://localhost:3001/api/moderation/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            providerId: 'user-uuid-here',
            title: 'Random Party Video',
            description: 'Just hanging out with friends',
            categoryId: 'entertainment-uuid',
            videoURL: 'https://storage.example.com/videos/party.mp4'
        })
    });

    const result = await response.json();
    console.log('Rejected Video:', result);

    /*
    Example Response:
    {
      "success": true,
      "videoId": "video-uuid",
      "moderation": {
        "nudityFlag": false,
        "violenceFlag": false,
        "explicitContentFlag": false,
        "skillFlag": true,  // ← NOT skill-related
        "isSkillRelated": false,
        "detectedSkill": null,
        "videoSummary": "Group of people socializing at a party",
        "reason": "Content does not demonstrate a professional skill",
        "confidenceScore": 0.92,
        "approved": false
      },
      "approved": false,
      "message": "Video flagged: Content does not demonstrate a professional skill"
    }
    */
}

// =============================================================================
// EXAMPLE 5: Client-Side Integration (React Component)
// =============================================================================

/*
import { useState } from 'react';

function VideoUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);

  const handleUpload = async (file: File, metadata: any) => {
    setUploading(true);
    
    try {
      // 1. Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('skill-videos')
        .upload(`${Date.now()}-${file.name}`, file);
      
      if (storageError) throw storageError;
      
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('skill-videos')
        .getPublicUrl(storageData.path);
      
      // 3. Call moderation API
      const response = await fetch('http://localhost:3001/api/moderation/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: user.id,
          title: metadata.title,
          description: metadata.description,
          categoryId: metadata.categoryId,
          videoURL: publicUrl
        })
      });
      
      const result = await response.json();
      setModerationResult(result);
      
      if (result.approved) {
        alert('✅ Video approved and published!');
      } else {
        alert(`❌ Video rejected: ${result.moderation.reason}`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {uploading && <p>Uploading and moderating...</p>}
      {moderationResult && (
        <div>
          <h3>{moderationResult.approved ? 'Approved' : 'Rejected'}</h3>
          <p>{moderationResult.moderation.reason}</p>
        </div>
      )}
    </div>
  );
}
*/

// =============================================================================
// EXAMPLE 6: cURL Commands
// =============================================================================

/*
# Upload new video
curl -X POST http://localhost:3001/api/moderation/upload \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "user-123",
    "title": "Plumbing Basics",
    "description": "How to fix a leaky faucet",
    "categoryId": "cat-456",
    "videoURL": "https://example.com/video.mp4"
  }'

# Check status
curl http://localhost:3001/api/moderation/status/video-uuid

# Re-moderate
curl -X POST http://localhost:3001/api/moderation/remoderate/video-uuid

# Health check
curl http://localhost:3001/health
*/

// =============================================================================

export {
    uploadAndModerateVideo,
    checkModerationStatus,
    moderateExistingVideo,
    exampleRejectedVideo
};
