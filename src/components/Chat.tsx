import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Paperclip, Mic, X, FileText, Image as ImageIcon, StopCircle, MessageSquare, Play } from 'lucide-react';
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [remoteTyping, setRemoteTyping] = useState(false);

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
        // @ts-ignore
        .update({ is_read: true })
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
              // @ts-ignore
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setRemoteTyping(payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!user || !booking) return;

    // Send typing broadcast
    const channel = supabase.channel(`booking-${booking.id}`);

    if (typingTimeout) clearTimeout(typingTimeout);

    if (!isTyping) {
      setIsTyping(true);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: true },
      });
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false },
      });
    }, 2000);

    setTypingTimeout(timeout);
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
        // @ts-ignore
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
    <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100/80 rounded-full transition-all active:scale-95 group">
            <ArrowLeft className="w-6 h-6 text-secondary-black group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              {otherUser.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-orange to-secondary-cyan flex items-center justify-center border-2 border-white shadow-md">
                  <span className="font-black text-white text-lg">
                    {otherUser.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white ring-1 ring-gray-100" />
            </div>
            <div>
              <h3 className="font-black text-secondary-black text-lg leading-tight">{otherUser.full_name}</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-secondary-cyan/10 text-secondary-cyan text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {booking.skill_categories.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 scroll-smooth relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-secondary-black/10 border-t-secondary-black rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary-black/40 gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-2`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-3xl shadow-sm transition-all duration-200 ${isOwn
                    ? 'bg-secondary-black text-white rounded-tr-none hover:shadow-md'
                    : 'bg-white text-secondary-black border border-gray-100 rounded-tl-none hover:shadow-md'
                    }`}
                >
                  {message.message_type === 'image' && message.file_url ? (
                    <div className="mb-2 overflow-hidden rounded-2xl">
                      <img
                        src={message.file_url}
                        alt="Shared image"
                        className="max-w-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : message.message_type === 'audio' && message.file_url ? (
                    <div className="min-w-[240px] flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isOwn ? 'bg-white/10' : 'bg-secondary-black/5'}`}>
                        <Play className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-secondary-black'}`} />
                      </div>
                      <audio controls src={message.file_url} className="w-full h-8 accent-secondary-cyan" />
                    </div>
                  ) : message.message_type === 'file' && message.file_url ? (
                    <div className="mb-1">
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <div className={`p-2 rounded-xl ${isOwn ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold truncate text-sm">{message.file_name || 'Attachment'}</span>
                          <span className="text-[10px] opacity-60 uppercase tracking-wider font-bold">Download</span>
                        </div>
                      </a>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed font-medium md:text-base">{message.message}</p>
                  )}
                  <p
                    className={`text-[10px] mt-2 font-bold uppercase tracking-wider opacity-50 ${isOwn ? 'text-right text-white' : 'text-left text-secondary-black'
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
        {remoteTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-1.5">
              <span className="text-xs font-bold mr-2 text-gray-400">Typing</span>
              <div className="w-1.5 h-1.5 bg-secondary-cyan rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-secondary-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-secondary-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 sticky bottom-0 z-20">
        {selectedFile && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl mb-3 border border-gray-100 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-secondary-black" />
                ) : (
                  <FileText className="w-5 h-5 text-secondary-black" />
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-secondary-black truncate">{selectedFile.name}</span>
                <span className="text-[10px] font-medium text-gray-400 uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => handleSend(e)}
          className="flex items-end gap-3 max-w-5xl mx-auto"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          />

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-secondary-black/60 hover:text-secondary-black hover:bg-white rounded-full transition-all active:scale-95"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-all animate-pulse"
                title="Stop recording"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-3 text-secondary-black/60 hover:text-secondary-black hover:bg-white rounded-full transition-all active:scale-95"
                title="Record voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={recording ? "Recording audio..." : "Type your message..."}
              disabled={recording}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-secondary-black/10 focus:bg-white focus:border-secondary-black/20 text-secondary-black placeholder:text-gray-400 font-medium transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending || recording || uploading}
            className="bg-secondary-black text-white p-4 rounded-full hover:bg-secondary-black/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none mb-0.5"
          >
            {sending || uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 translate-x-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
