import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
              .update({ is_read: true })
              .eq('id', payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !booking || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        booking_id: booking.id,
        sender_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!booking) return null;

  const otherUser =
    profile?.user_type === 'client'
      ? booking.provider_profile
      : booking.client_profile;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button onClick={onClose} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center flex-1">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.full_name}
              className="w-10 h-10 rounded-full mr-3"
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
        <button onClick={onClose}>
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{message.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
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

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 p-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
