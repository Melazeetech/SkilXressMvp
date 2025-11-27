import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, Paperclip, Mic, X, FileText, Image as ImageIcon, StopCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  provider_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  skill_categories: {
    name: string;
  };
};

type Message = Database['public']['Tables']['chat_messages']['Row'];

interface ChatProps {
  booking: Booking | null;
  onClose: () => void;
}

export function Chat({ booking, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (booking) {
      loadMessages();
      subscribeToMessages();
    }
  }, [booking]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!booking) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('chat_messages')
        .update({ is_read: true } as any)
        .eq('booking_id', booking.id)
        .neq('sender_id', user?.id || '');
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!booking) return;

    const channel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${booking.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);

          if (payload.new.sender_id !== user?.id) {
            supabase
              .from('chat_messages')
              .update({ is_read: true } as any)
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };



  // ... existing code ...

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        await handleSend(undefined, audioFile, 'audio');

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${booking?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSend = async (e?: React.FormEvent, fileToSend?: File, type: 'text' | 'image' | 'audio' | 'file' = 'text') => {
    if (e) e.preventDefault();

    if (!user || !booking || sending) return;

    // If sending text, ensure it's not empty
    if (type === 'text' && !newMessage.trim() && !fileToSend && !selectedFile) return;

    setSending(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let messageType = type;
      let messageContent = newMessage.trim();

      const file = fileToSend || selectedFile;

      if (file) {
        setUploading(true);
        fileUrl = await uploadFile(file);
        fileName = file.name;
        fileSize = file.size;

        if (!messageType || messageType === 'text') {
          if (file.type.startsWith('image/')) messageType = 'image';
          else if (file.type.startsWith('audio/')) messageType = 'audio';
          else messageType = 'file';
        }

        if (messageType === 'audio') messageContent = 'Voice message';
        else if (messageType === 'image') messageContent = 'Image';
        else messageContent = file.name;

        setUploading(false);
      }

      const { error } = await supabase.from('chat_messages').insert({
        booking_id: booking.id,
        sender_id: user.id,
        message: messageContent,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
      } as any);

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  if (!booking) return null;

  const otherUser =
    profile?.user_type === 'client'
      ? booking.provider_profile
      : booking.client_profile;

  if (!otherUser) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button onClick={onClose} className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center flex-1">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.full_name}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
              <span className="font-bold text-gray-600">
                {otherUser.full_name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold">{otherUser.full_name}</h3>
            <p className="text-xs text-gray-500">{booking.skill_categories.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-200 shadow-sm'
                    }`}
                >
                  {message.message_type === 'image' && message.file_url ? (
                    <div className="mb-2">
                      <img
                        src={message.file_url}
                        alt="Shared image"
                        className="max-w-full rounded-lg max-h-60 object-cover"
                      />
                    </div>
                  ) : message.message_type === 'audio' && message.file_url ? (
                    <div className="mb-2 min-w-[200px]">
                      <audio controls src={message.file_url} className="w-full" />
                    </div>
                  ) : message.message_type === 'file' && message.file_url ? (
                    <div className="mb-2">
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="underline truncate max-w-[150px]">{message.file_name || 'Attachment'}</span>
                      </a>
                    </div>
                  ) : (
                    <p className="break-words">{message.message}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1 text-right ${isOwn ? 'text-blue-100' : 'text-gray-400'
                      }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        {selectedFile && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-2">
            <div className="flex items-center gap-2 truncate">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-blue-600" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm text-gray-700 truncate">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => handleSend(e)}
          className="flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors animate-pulse"
              title="Stop recording"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={recording ? "Recording..." : "Type a message..."}
            disabled={recording}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending || recording || uploading}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {sending || uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
