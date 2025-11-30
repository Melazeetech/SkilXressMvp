# Quick Test - Copy and paste this in PowerShell

# Test 1: Health Check
Write-Host "=== Test 1: Health Check ===" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:3001/health"
Write-Host ""

# Test 2: Upload Skill Video (Should be APPROVED)
Write-Host "=== Test 2: Upload Skill Video (Expected: APPROVED) ===" -ForegroundColor Yellow
$skillVideo = @{
    providerId = "550e8400-e29b-41d4-a716-446655440000"
    title = "Professional Haircutting Techniques"
    description = "Demonstrating modern layering techniques for medium-length hair using professional tools"
    categoryId = "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f"
    videoURL = "https://example.com/haircut-demo.mp4"
} | ConvertTo-Json

$result1 = Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/upload" `
    -Method Post `
    -ContentType "application/json" `
    -Body $skillVideo

$result1 | ConvertTo-Json -Depth 10
$videoId = $result1.videoId

if ($result1.approved) {
    Write-Host "✓ PASSED: Video was APPROVED as expected" -ForegroundColor Green
} else {
    Write-Host "✗ FAILED: Video was REJECTED (unexpected)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Upload Non-Skill Video (Should be REJECTED)
Write-Host "=== Test 3: Upload Non-Skill Video (Expected: REJECTED) ===" -ForegroundColor Yellow
$nonSkillVideo = @{
    providerId = "550e8400-e29b-41d4-a716-446655440000"
    title = "My Weekend Beach Vlog"
    description = "Just hanging out with friends and having fun at the beach"
    categoryId = "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f"
    videoURL = "https://example.com/beach-vlog.mp4"
} | ConvertTo-Json

$result2 = Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/upload" `
    -Method Post `
    -ContentType "application/json" `
    -Body $nonSkillVideo

$result2 | ConvertTo-Json -Depth 10

if (-not $result2.approved) {
    Write-Host "✓ PASSED: Non-skill video was REJECTED as expected" -ForegroundColor Green
} else {
    Write-Host "✗ FAILED: Non-skill video was APPROVED (unexpected)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check Status (if we have a video ID)
if ($videoId) {
    Write-Host "=== Test 4: Check Moderation Status ===" -ForegroundColor Yellow
    Invoke-RestMethod -Uri "http://localhost:3001/api/moderation/status/$videoId" | ConvertTo-Json -Depth 10
    Write-Host "✓ Status check complete" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== ALL TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your Supabase database -> video_moderation table"
Write-Host "2. Verify skill_videos.moderation_status is updated"
Write-Host "3. Check server terminal for detailed AI responses"
