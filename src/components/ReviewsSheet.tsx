import { Star, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Rating = Database['public']['Tables']['ratings']['Row'] & {
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
};

interface ReviewsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    providerId: string;
}

export function ReviewsSheet({ isOpen, onClose, providerId }: ReviewsSheetProps) {
    const [reviews, setReviews] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && providerId) {
            loadReviews();
            if (user) {
                checkReviewEligibility();
            }
        }
    }, [isOpen, providerId, user]);

    const checkReviewEligibility = async () => {
        if (!user) return;

        // Check if user has a completed booking with this provider
        const { data: completedBookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('client_id', user.id)
            .eq('provider_id', providerId)
            .eq('status', 'completed');

        if (!completedBookings || completedBookings.length === 0) {
            setCanReview(false);
            return;
        }

        // Check if user has already reviewed this provider
        const { data: existingReview } = await supabase
            .from('ratings')
            .select('id')
            .eq('client_id', user.id)
            .eq('provider_id', providerId)
            .limit(1);

        // User can review if they have completed booking AND haven't already reviewed
        setCanReview(!existingReview || existingReview.length === 0);
    };

    const loadReviews = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ratings')
                .select(`
          *,
          profiles:client_id (
            full_name,
            avatar_url
          )
        `)
                .eq('provider_id', providerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data as any || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reviewText.trim()) return;

        setSubmitting(true);
        try {
            // Get a booking ID to link the review to
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id')
                .eq('client_id', user.id)
                .eq('provider_id', providerId)
                .eq('status', 'completed')
                .limit(1)
                .maybeSingle();

            if (bookingError) {
                throw new Error(`Booking error: ${bookingError.message}`);
            }

            if (!bookingData) {
                throw new Error('You must complete a booking before leaving a review');
            }

            const { error } = await supabase
                .from('ratings')
                .insert({
                    provider_id: providerId,
                    client_id: user.id,
                    booking_id: bookingData.id,
                    rating: userRating,
                    review: reviewText.trim(),
                } as any);

            if (error) throw error;

            // Reset and reload
            setIsWriting(false);
            setReviewText('');
            setUserRating(5);
            loadReviews();
            // Re-check eligibility (user can no longer review)
            checkReviewEligibility();
        } catch (error: any) {
            console.error('Error submitting review:', error);
            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
            });
            alert(`Failed to submit review: ${error?.message || 'Unknown error'}. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
            <div className="relative w-full sm:w-[500px] bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col pointer-events-auto animate-slide-up">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Reviews</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!user && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
                            Please log in to write a review
                        </div>
                    )}

                    {user && canReview && !isWriting && (
                        <button
                            onClick={() => setIsWriting(true)}
                            className="w-full mb-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                        >
                            Write a Review
                        </button>
                    )}

                    {user && !canReview && !isWriting && (
                        <div className="mb-6 p-4 bg-amber-50 rounded-xl text-center text-sm text-amber-700">
                            Complete a booking with this provider to leave a review
                        </div>
                    )}

                    {isWriting && (
                        <form onSubmit={handleSubmitReview} className="mb-6 bg-gray-50 p-4 rounded-xl">
                            <div className="flex gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setUserRating(star)}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Share your experience..."
                                className="w-full p-3 rounded-lg border border-gray-200 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsWriting(false)}
                                    className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !reviewText.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Posting...' : 'Post Review'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No reviews yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        {review.profiles?.avatar_url ? (
                                            <img
                                                src={review.profiles.avatar_url}
                                                alt={review.profiles.full_name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {review.profiles?.full_name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{review.profiles?.full_name}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="ml-auto text-xs text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {review.review && <p className="text-gray-600 text-sm">{review.review}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
