#!/bin/bash

# SkilXpress Video Moderation Test Suite
# This script tests all moderation endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

echo "================================================"
echo "  SkilXpress Video Moderation Test Suite"
echo "================================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "${API_URL}/health" | python -m json.tool
echo -e "${GREEN}✓ Health check complete${NC}\n"
sleep 2

# Test 2: Upload Skill Video (Should be APPROVED)
echo -e "${YELLOW}Test 2: Upload Skill Video (Expected: APPROVED)${NC}"
RESPONSE=$(curl -s -X POST "${API_URL}/api/moderation/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Professional Haircutting Techniques",
    "description": "Demonstrating modern layering techniques for medium-length hair using professional scissors and combs",
    "categoryId": "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f",
    "videoURL": "https://example.com/haircut-demo.mp4"
  }')

echo "$RESPONSE" | python -m json.tool

# Extract videoId for later tests
VIDEO_ID=$(echo "$RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('videoId', 'N/A'))" 2>/dev/null || echo "N/A")
APPROVED=$(echo "$RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('approved', False))" 2>/dev/null || echo "False")

if [ "$APPROVED" = "True" ]; then
    echo -e "${GREEN}✓ Video APPROVED as expected${NC}\n"
else
    echo -e "${RED}✗ Video REJECTED (unexpected)${NC}\n"
fi
sleep 2

# Test 3: Upload Non-Skill Video (Should be REJECTED)
echo -e "${YELLOW}Test 3: Upload Non-Skill Video (Expected: REJECTED)${NC}"
curl -s -X POST "${API_URL}/api/moderation/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Weekend Vlog",
    "description": "Just hanging out with friends and having fun at the beach",
    "categoryId": "b7c1e2d4-8f3a-4b6c-9e1d-2a5f8c3d4e6f",
    "videoURL": "https://example.com/beach-vlog.mp4"
  }' | python -m json.tool

echo -e "${GREEN}✓ Non-skill video test complete${NC}\n"
sleep 2

# Test 4: Check Moderation Status
if [ "$VIDEO_ID" != "N/A" ]; then
    echo -e "${YELLOW}Test 4: Check Moderation Status${NC}"
    curl -s "${API_URL}/api/moderation/status/${VIDEO_ID}" | python -m json.tool
    echo -e "${GREEN}✓ Status check complete${NC}\n"
else
    echo -e "${YELLOW}Test 4: Skipped (no video ID from Test 2)${NC}\n"
fi
sleep 2

# Test 5: Moderate Existing Video
echo -e "${YELLOW}Test 5: Moderate Existing Video${NC}"
curl -s -X POST "${API_URL}/api/moderation/moderate" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test-video-uuid-123",
    "videoURL": "https://example.com/welding-tutorial.mp4",
    "title": "MIG Welding for Beginners",
    "description": "Learn the basics of MIG welding including safety, equipment setup, and proper technique"
  }' | python -m json.tool

echo -e "${GREEN}✓ Moderation test complete${NC}\n"
sleep 2

# Test 6: Re-moderate Video
if [ "$VIDEO_ID" != "N/A" ]; then
    echo -e "${YELLOW}Test 6: Re-moderate Video${NC}"
    curl -s -X POST "${API_URL}/api/moderation/remoderate/${VIDEO_ID}" | python -m json.tool
    echo -e "${GREEN}✓ Re-moderation complete${NC}\n"
else
    echo -e "${YELLOW}Test 6: Skipped (no video ID from Test 2)${NC}\n"
fi

echo "================================================"
echo "  All Tests Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Check your Supabase database:"
echo "   - video_moderation table should have new records"
echo "   - skill_videos.moderation_status should be updated"
echo ""
echo "2. Review the console output above for any errors"
echo ""
echo "3. Check server logs for detailed moderation reasoning"
