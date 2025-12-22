import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
                <div className="w-10 h-10 border-4 border-secondary-black/10 border-t-secondary-black rounded-full animate-spin" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-secondary-black/40 gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center">
                    <User className="w-10 h-10 opacity-20" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-lg mb-1 text-secondary-black">No conversations yet</p>
                    <p className="text-sm font-medium opacity-60">Book a service to start chatting!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-2">
            {bookings.map((booking) => {
                const isClient = user?.id === booking.client_id;
                const otherProfile = isClient ? booking.provider_profile : booking.client_profile;
                const lastMessage = booking.last_message;
                const isUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== user?.id;

                return (
                    <button
                        key={booking.id}
                        onClick={() => onSelectBooking(booking)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-white transition-all text-left rounded-3xl group ${isUnread ? 'bg-white shadow-sm ring-1 ring-secondary-orange/10' : 'hover:shadow-md bg-transparent'
                            }`}
                    >
                        {/* Avatar */}
                        <div className="relative">
                            {otherProfile.avatar_url ? (
                                <img
                                    src={otherProfile.avatar_url}
                                    alt={otherProfile.full_name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary-orange to-secondary-cyan flex items-center justify-center border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                                    <span className="font-black text-white text-lg">
                                        {otherProfile.full_name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            {isUnread && (
                                <div className="absolute top-0 right-0 w-4 h-4 bg-secondary-orange rounded-full border-2 border-white ring-2 ring-secondary-orange/20 animate-pulse" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className={`font-black truncate text-lg ${isUnread ? 'text-secondary-black' : 'text-secondary-black/80'}`}>
                                    {otherProfile.full_name}
                                </h3>
                                {lastMessage && (
                                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 ml-2 uppercase tracking-wide">
                                        {new Date(lastMessage.created_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary-cyan/10 text-secondary-cyan rounded-full uppercase tracking-wider">
                                    {booking.skill_categories.name}
                                </span>
                                <p className={`text-sm truncate flex-1 ${isUnread ? 'font-bold text-secondary-black' : 'font-medium text-gray-400'}`}>
                                    {lastMessage ? lastMessage.message : <span className="italic opacity-70">Start a conversation</span>}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
