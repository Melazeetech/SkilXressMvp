# Chat Features Setup Guide

## Overview
This guide covers the implementation of voice notes and file/document sharing in the chat feature.

## Database Changes

### 1. Run the SQL Migration
Execute the following SQL script in your Supabase SQL Editor:

**File:** `src/lib/database/add_chat_features.sql`

This script will:
- Add `message_type`, `file_url`, `file_name`, and `file_size` columns to `chat_messages` table
- Create a new storage bucket called `chat-attachments`
- Set up appropriate storage policies for authenticated users

### 2. Verify Storage Bucket
After running the migration, verify in Supabase Dashboard:
1. Go to **Storage** section
2. Confirm `chat-attachments` bucket exists
3. Check that policies are properly configured

## Features Implemented

### 1. **Voice Notes**
- Click the microphone icon to start recording
- The button will turn red and pulse while recording
- Click the stop icon to finish recording and send
- Voice messages are automatically uploaded and sent as audio files

### 2. **File Sharing**
- Click the paperclip icon to select files
- Supported file types:
  - Images (jpg, png, gif, etc.)
  - Audio files (mp3, wav, etc.)
  - Videos (mp4, webm, etc.)
  - Documents (pdf, doc, docx, txt)
- Selected file preview appears above the input
- Click X to remove selected file before sending

### 3. **Message Types**
The chat now supports 4 message types:
- **Text**: Regular text messages
- **Image**: Displays images inline with preview
- **Audio**: Shows audio player for voice notes
- **File**: Shows download link with file icon

## UI Features

### Input Area
- **Paperclip button**: Attach files
- **Microphone button**: Record voice notes (turns to stop button when recording)
- **Text input**: Type messages (disabled during recording)
- **Send button**: Send message/file (shows loading spinner during upload)

### Message Display
- **Images**: Displayed inline with rounded corners, max height 240px
- **Audio**: Native HTML5 audio player with controls
- **Files**: Download link with file icon and name
- **Text**: Standard text display

### Visual Indicators
- File preview shows before sending
- Recording state with pulsing red button
- Upload progress with loading spinner
- Disabled states during recording/uploading

## Technical Details

### State Management
```typescript
- recording: boolean          // Voice recording state
- selectedFile: File | null   // Currently selected file
- uploading: boolean          // File upload state
```

### File Upload Process
1. User selects file or records audio
2. File is uploaded to `chat-attachments` bucket
3. Public URL is generated
4. Message is created with file metadata
5. File preview/player is displayed in chat

### Browser Permissions
Voice recording requires microphone permission. Users will be prompted on first use.

## Known Limitations

1. **TypeScript Strict Typing**: Some type assertions (`as any`) are used due to Supabase's strict typing. This is safe but could be improved with better type definitions.

2. **File Size**: No explicit file size limit is enforced in the UI. Consider adding validation based on your storage limits.

3. **Audio Format**: Voice notes are recorded in WebM format, which is widely supported but may not work on all browsers.

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Verify storage bucket exists
- [ ] Test text message sending
- [ ] Test image upload and display
- [ ] Test voice note recording (requires microphone permission)
- [ ] Test document upload and download
- [ ] Test file preview and removal
- [ ] Test on mobile devices
- [ ] Verify real-time updates work with new message types

## Troubleshooting

### "Could not access microphone"
- Check browser permissions
- Ensure HTTPS is enabled (required for microphone access)
- Try a different browser

### Files not uploading
- Verify storage bucket exists and is public
- Check storage policies in Supabase
- Verify file size is within limits

### TypeScript errors
- The `as any` type assertions are intentional workarounds
- If errors persist, try restarting the TypeScript server
- Consider regenerating types from Supabase if schema changes

## Future Enhancements

Consider adding:
- File size validation and limits
- Image compression before upload
- Video message support
- File preview for documents
- Message deletion
- Message editing
- Read receipts for attachments
- Download progress indicator
