import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { Chat } from './Chat';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useBackHandler } from '../hooks/useBackHandler';

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

export function MessagesView({ activeBookingId }: { activeBookingId?: string | null }) {
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Handle back button when in chat view
    useBackHandler(!!selectedBooking, () => setSelectedBooking(null), 'chat-view');

    useEffect(() => {
        if (activeBookingId) {
            loadBooking(activeBookingId);
        }
    }, [activeBookingId]);

    const loadBooking = async (id: string) => {
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
            .eq('id', id)
            .single();

        if (!error && data) {
            setSelectedBooking(data as any);
        }
    };

    if (selectedBooking) {
        return (
            <div className="h-[calc(100vh-3.5rem)] bg-white">
                <Chat
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white min-h-[calc(100vh-3.5rem)]">
            <div className="p-4 border-b border-gray-100 sticky top-14 bg-white z-10">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            <ConversationList onSelectBooking={setSelectedBooking} />
        </div>
    );
}
