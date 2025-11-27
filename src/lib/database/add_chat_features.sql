-- Add message type and file details to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'file')),
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_size bigint;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-attachments bucket
-- Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow authenticated users to view attachments
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own attachments (optional but good practice)
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid() = owner);
