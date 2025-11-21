import { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
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
    last_message?: {
        message: string;
        created_at: string;
        is_read: boolean;
        sender_id: string;
    };
};

interface ConversationListProps {
    onSelectBooking: (booking: Booking) => void;
}

export function ConversationList({ onSelectBooking }: ConversationListProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadConversations();
            subscribeToMessages();
        }
    }, [user]);

    const loadConversations = async () => {
        try {
            // Fetch bookings where user is client OR provider
            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          client_profile:profiles!bookings_client_id_fkey (
            full_name,
            avatar_url
          ),
          provider_profile:profiles!bookings_provider_id_fkey (
            full_name,
            avatar_url
          ),
          skill_categories (
            name
          )
        `)
                .or(`client_id.eq.${user?.id},provider_id.eq.${user?.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // For each booking, fetch the last message
            const bookingsWithMessages = await Promise.all(
                (data || []).map(async (booking: any) => {
                    const { data: messages } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('booking_id', booking.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    return {
                        ...booking,
                        last_message: messages || undefined,
                    };
                })
            );

            // Sort by last message time if available, else booking time
            const sortedBookings = bookingsWithMessages.sort((a: any, b: any) => {
                const timeA = a.last_message?.created_at || a.created_at;
                const timeB = b.last_message?.created_at || b.created_at;
                return new Date(timeB).getTime() - new Date(timeA).getTime();
            });

            setBookings(sortedBookings as Booking[]);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel('public:chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                },
                () => {
                    // Reload to update last message and ordering
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Book a service to start chatting!</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {bookings.map((booking) => {
                const isClient = user?.id === booking.client_id;
                const otherProfile = isClient ? booking.provider_profile : booking.client_profile;
                const lastMessage = booking.last_message;
                const isUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== user?.id;

                return (
                    <button
                        key={booking.id}
                        onClick={() => onSelectBooking(booking)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left ${isUnread ? 'bg-blue-50/50' : ''
                            }`}
                    >
                        {/* Avatar */}
                        <div className="relative">
                            {otherProfile.avatar_url ? (
                                <img
                                    src={otherProfile.avatar_url}
                                    alt={otherProfile.full_name}
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <User className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            {isUnread && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className={`font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {otherProfile.full_name}
                                </h3>
                                {lastMessage && (
                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                        {new Date(lastMessage.created_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                    {booking.skill_categories.name}
                                </span>
                                <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                    {lastMessage ? lastMessage.message : 'Start a conversation'}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
