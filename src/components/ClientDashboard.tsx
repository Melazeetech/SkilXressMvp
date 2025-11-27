import { useState, useEffect } from 'react';
import { Calendar, MessageCircle, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { Chat } from './Chat';
import { ClientStatsHeader } from './ClientStatsHeader';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  provider_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  client_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  skill_categories: {
    name: string;
  };
};

export function ClientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalReviews: 0,
  });
  const { user, profile } = useAuth();

  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('status')
        .eq('client_id', user.id);

      const totalBookings = bookingsData?.length || 0;
      const completedBookings = bookingsData?.filter((b: any) => b.status === 'completed').length || 0;
      const pendingBookings = bookingsData?.filter((b: any) => b.status === 'pending').length || 0;

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('id')
        .eq('client_id', user.id);

      const totalReviews = ratingsData?.length || 0;

      setStats({
        totalBookings,
        completedBookings,
        pendingBookings,
        totalReviews,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          provider_profile:profiles!bookings_provider_id_fkey (
            full_name,
            avatar_url
          ),
          client_profile:profiles!bookings_client_id_fkey (
            full_name,
            avatar_url
          ),
          skill_categories (name)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      setBookings(data || []);
      loadStats(); // Refresh stats when bookings are loaded
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowChat(true);
  };

  const handleSubmitRating = async (bookingId: string, providerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('ratings').insert({
        booking_id: bookingId,
        provider_id: providerId,
        client_id: user.id,
        rating,
        review: review.trim() || null,
      } as any);

      if (error) throw error;
      setRatingBooking(null);
      setRating(5);
      setReview('');
      loadStats(); // Refresh stats to show updated review count
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showChat && selectedBooking) {
    return <Chat booking={selectedBooking} onClose={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Client Stats Header */}
        <ClientStatsHeader profile={profile} stats={stats} />

        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No bookings yet</p>
              <p className="text-sm mt-2">Start exploring services!</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {booking.provider_profile.avatar_url ? (
                      <img
                        src={booking.provider_profile.avatar_url}
                        alt={booking.provider_profile.full_name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                        <span className="font-bold text-gray-600">
                          {booking.provider_profile.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {booking.provider_profile.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.skill_categories.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : booking.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(booking.preferred_date).toLocaleDateString()} at{' '}
                    {booking.preferred_time}
                  </p>
                  <p>
                    <strong>Location:</strong> {booking.location}
                  </p>
                  {booking.notes && (
                    <p className="bg-gray-50 p-3 rounded mt-2">{booking.notes}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleOpenChat(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>

                  {booking.status === 'completed' && (
                    <button
                      onClick={() => setRatingBooking(booking.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      Rate Service
                    </button>
                  )}
                </div>

                {ratingBooking === booking.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Rate this service</h4>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Write a review (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleSubmitRating(booking.id, booking.provider_id)
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Submit Rating
                      </button>
                      <button
                        onClick={() => {
                          setRatingBooking(null);
                          setRating(5);
                          setReview('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
