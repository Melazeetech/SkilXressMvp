# SkilXpress Video Moderation Testing Guide

## 🧪 Complete Testing Instructions

### **Prerequisites Checklist**

Before testing, ensure you have:
- ✅ Database schema created (ran `video_moderation_schema.sql`)
- ✅ OpenAI API key in `.env` file
- ✅ Supabase service role key in `.env` file
- ✅ Backend dependencies installed (`cd server && npm install`)

---

## **Method 1: Quick Test with PowerShell (Windows)**

### Step 1: Start the Backend Server

Open a PowerShell terminal:

```powershell
cd server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║   SkilXpress Backend Server Running      ║
║   Port: 3001                              ║
╚═══════════════════════════════════════════╝
```

**Keep this terminal open!**

### Step 2: Open a New PowerShell Terminal

In a new terminal, run these test commands:

#### Test 1: Health Check
```powershell
curl http://localhost:3001/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T20:00:00.000Z",
  "uptime": 123.456
}
```

#### Test 2: Upload a Skill Video (Should be APPROVED ✅)
```powershell
$body = @{
    providerId = "550e8400-e29b-41d4-a716-446655440000"
    title = "Professional Haircutting Techniques"
    description = "Demonstrating modern layering techniques for medium-length hair"
    categoryId = "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f"
    videoURL = "https://example.com/haircut-demo.mp4"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/upload" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 10
```

**Expected Output:**
```json
{
  "success": true,
  "videoId": "some-uuid-here",
  "approved": true,
  "moderation": {
    "nudityFlag": false,
    "violenceFlag": false,
    "explicitContentFlag": false,
    "skillFlag": false,
    "isSkillRelated": true,
    "detectedSkill": "haircutting",
    "videoSummary": "Professional demonstrates haircutting...",
    "reason": "Approved - haircutting demonstration",
    "confidenceScore": 0.85,
    "approved": true
  }
}
```

#### Test 3: Upload Non-Skill Video (Should be REJECTED ❌)
```powershell
$body = @{
    providerId = "550e8400-e29b-41d4-a716-446655440000"
    title = "My Weekend Vlog"
    description = "Just hanging out with friends at the beach"
    categoryId = "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f"
    videoURL = "https://example.com/beach-vlog.mp4"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/upload" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 10
```

**Expected Output:**
```json
{
  "success": true,
  "approved": false,
  "moderation": {
    "skillFlag": true,
    "isSkillRelated": false,
    "reason": "Content does not demonstrate a professional skill"
  }
}
```

#### Test 4: Check Moderation Status
```powershell
# Replace VIDEO_ID with actual ID from Test 2
Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/status/VIDEO_ID"
```

---

## **Method 2: Using Postman or Thunder Client**

### Import This Collection:

**Endpoint 1: Upload Skill Video**
- Method: `POST`
- URL: `http://localhost:3001/api/moderation/upload`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "providerId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Professional Welding Tutorial",
  "description": "MIG welding basics for beginners - safety and technique",
  "categoryId": "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f",
  "videoURL": "https://example.com/welding-demo.mp4"
}
```

**Endpoint 2: Check Status**
- Method: `GET`
- URL: `http://localhost:3001/api/moderation/status/{videoId}`

**Endpoint 3: Moderate Existing**
- Method: `POST`
- URL: `http://localhost:3001/api/moderation/moderate`
- Body:
```json
{
  "videoId": "existing-video-uuid",
  "videoURL": "https://example.com/video.mp4",
  "title": "Carpentry Basics",
  "description": "Building a wooden shelf from scratch"
}
```

---

## **Method 3: Test with Real Frontend Integration**

Create this test component in your React app:

```tsx
// src/components/TestModeration.tsx
import { useState } from 'react';

export function TestModeration() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUpload = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/moderation/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'Test Skill Video',
          description: 'Testing the moderation system',
          categoryId: 'b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f',
          videoURL: 'https://example.com/test.mp4'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Video Moderation Test</h2>
      
      <button
        onClick={testUpload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Testing...' : 'Test Upload & Moderate'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## **Method 4: Database Verification**

After running tests, check your Supabase database:

### Query 1: View All Moderation Records
```sql
SELECT 
    vm.id,
    vm.video_id,
    vm.status,
    vm.is_skill_related,
    vm.detected_skill_category,
    vm.confidence_score,
    vm.moderation_reason,
    vm.moderated_at,
    sv.title as video_title
FROM video_moderation vm
LEFT JOIN skill_videos sv ON sv.id = vm.video_id
ORDER BY vm.moderated_at DESC;
```

### Query 2: Check Approved Videos
```sql
SELECT * FROM skill_videos 
WHERE moderation_status = 'approved'
ORDER BY created_at DESC;
```

### Query 3: Check Rejected Videos
```sql
SELECT 
    sv.title,
    vm.moderation_reason,
    vm.nudity_detected,
    vm.violence_detected,
    vm.is_skill_related
FROM skill_videos sv
JOIN video_moderation vm ON vm.video_id = sv.id
WHERE sv.moderation_status = 'rejected';
```

---

## **🔍 What to Look For**

### ✅ **Successful Test Indicators:**

1. **Health Check Returns 200**
   - Server is running correctly

2. **Skill Videos Get Approved**
   - `approved: true`
   - `skillFlag: false`
   - `detectedSkill` has a value (e.g., "haircutting")
   - `confidenceScore` > 0.6

3. **Non-Skill Videos Get Rejected**
   - `approved: false`
   - `skillFlag: true` (flagged as not skill-related)
   - `reason` explains why

4. **Database Records Created**
   - New entries in `video_moderation` table
   - `skill_videos.moderation_status` updated to "approved" or "rejected"

5. **Server Logs Show Details**
   - Check your backend terminal for detailed AI responses
   - Should see OpenAI API calls and responses

---

## **🐛 Troubleshooting**

### Problem: "Connection refused"
**Solution:**
- Make sure backend server is running (`npm run dev`)
- Check it's on port 3001

### Problem: "OpenAI API key invalid"
**Solution:**
- Verify `.env` has `OPENAI_API_KEY=sk-...`
- Make sure there are no quotes or extra spaces

### Problem: "Database error: permission denied"
**Solution:**
- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check you ran the database schema SQL

### Problem: "All videos rejected with low confidence"
**Solution:**
- Lower threshold: `MODERATION_SKILL_CONFIDENCE_THRESHOLD=0.5`
- Provide more detailed video descriptions

### Problem: "Moderation takes too long"
**Solution:**
- This is normal! OpenAI API calls can take 5-10 seconds
- For production, use a job queue for async processing

---

## **📊 Expected Response Times**

- Health Check: < 10ms
- Upload & Moderate: 5-15 seconds (OpenAI API calls)
- Status Check: < 100ms
- Re-moderate: 5-15 seconds

---

## **🎯 Test Scenarios**

### Scenario 1: Approved Skill Videos
Test these descriptions (should be APPROVED):
- "Professional haircutting techniques demonstration"
- "MIG welding tutorial for beginners"
- "Plumbing repair - fixing a leaky faucet"
- "Carpentry basics - building a shelf"
- "Makeup tutorial - bridal makeup application"

### Scenario 2: Rejected Non-Skill Videos
Test these descriptions (should be REJECTED):
- "My weekend vlog with friends"
- "Dancing at a party"
- "Random funny moments compilation"
- "Travel video from my vacation"
- "Unboxing my new phone"

### Scenario 3: Edge Cases
Test these (may vary):
- "Cooking tutorial - making pasta" (should approve - cooking is a skill)
- "Teaching my friend how to cook" (should approve)
- "Playing video games" (should reject - not professional skill)
- "DIY home repair tips" (should approve - handyman skill)

---

## **✨ Success Criteria**

Your moderation system is working correctly if:

✅ Skill demonstration videos get approved  
✅ Non-skill/entertainment videos get rejected  
✅ Database records are created for each moderation  
✅ `moderation_status` is synced to `skill_videos` table  
✅ API returns proper JSON responses  
✅ Server logs show OpenAI API interactions  

---

## **📝 Next Steps After Testing**

1. **Integrate with Frontend Upload Flow**
   - Call moderation API when users upload videos
   - Show approval/rejection messages to users

2. **Add Admin Dashboard**
   - View flagged videos
   - Manual review interface
   - Override AI decisions

3. **Optimize for Production**
   - Add job queue (Bull/BullMQ)
   - Implement rate limiting
   - Add monitoring/analytics

4. **Enhance Moderation**
   - Add more skill categories
   - Fine-tune confidence thresholds
   - Implement appeal process

---

**Happy Testing! 🚀**

If you encounter any issues, check the server logs for detailed error messages.
