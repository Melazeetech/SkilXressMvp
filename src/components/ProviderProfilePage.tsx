import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Star, Video as VideoIcon, Briefcase, MessageCircle, Loader2, MoreVertical, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { FollowButton } from './FollowButton';
import { useAuth } from '../contexts/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Video = Database['public']['Tables']['skill_videos']['Row'] & {
    skill_categories: {
        name: string;
    };
};
type WorkSample = Database['public']['Tables']['work_samples']['Row'];
type Rating = Database['public']['Tables']['ratings']['Row'] & {
    client_profile: {
        full_name: string;
        avatar_url: string | null;
    };
};

interface ProviderProfilePageProps {
    providerId: string;
    onClose: () => void;
    onBookClick?: () => void;
    onMessageClick?: (bookingId: string) => void;
    onAuthRequired?: () => void;
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function formatViews(views: number) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

export function ProviderProfilePage({ providerId, onClose, onBookClick, onMessageClick, onAuthRequired }: ProviderProfilePageProps) {
    const [provider, setProvider] = useState<Profile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [workSamples, setWorkSamples] = useState<WorkSample[]>([]);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [activeTab, setActiveTab] = useState<'videos' | 'portfolio' | 'reviews'>('videos');
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [messageLoading, setMessageLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadProviderData();
    }, [providerId]);

    const loadProviderData = async () => {
        try {
            // Load provider profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', providerId)
                .single();

            if (profileError) throw profileError;
            setProvider(profileData);

            // Load videos
            const { data: videosData } = await supabase
                .from('skill_videos')
                .select(`
          *,
          skill_categories (name)
        `)
                .eq('provider_id', providerId)
                .order('created_at', { ascending: false });

            setVideos(videosData as Video[] || []);

            // Load work samples
            const { data: samplesData } = await supabase
                .from('work_samples')
                .select('*')
                .eq('provider_id', providerId)
                .order('created_at', { ascending: false });

            setWorkSamples(samplesData || []);

            // Load ratings
            const { data: ratingsData } = await supabase
                .from('ratings')
                .select(`
          *,
          client_profile:profiles!ratings_client_id_fkey (
            full_name,
            avatar_url
          )
        `)
                .eq('provider_id', providerId)
                .order('created_at', { ascending: false });

            // Cast ratingsData to Rating[] to avoid type errors
            const typedRatings = (ratingsData as unknown as Rating[]) || [];
            setRatings(typedRatings);

            // Calculate average rating
            if (typedRatings.length > 0) {
                const avg = typedRatings.reduce((acc, curr) => acc + curr.rating, 0) / typedRatings.length;
                setAverageRating(avg);
            }
        } catch (error) {
            console.error('Error loading provider data:', error);
            toast.error('Failed to load provider profile');
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClick = async () => {
        if (!user || !onMessageClick) return;

        setMessageLoading(true);
        try {
            // Check if there's an existing conversation (booking)
            const { data: existingBooking } = await supabase
                .from('bookings')
                .select('id')
                .eq('client_id', user.id)
                .eq('provider_id', providerId)
                .order('created_at', { ascending: false })
                .maybeSingle();

            if (existingBooking) {
                // @ts-ignore
                onMessageClick(existingBooking.id);
            } else {
                // Create a new "inquiry" booking to start conversation
                if (videos.length === 0) {
                    toast.error('Cannot start conversation: Provider has no service categories');
                    setMessageLoading(false);
                    return;
                }

                const { data: newBooking, error } = await supabase
                    .from('bookings')
                    .insert({
                        // @ts-ignore
                        client_id: user.id,
                        provider_id: providerId,
                        category_id: videos[0]?.category_id,
                        status: 'pending',
                        preferred_date: new Date().toISOString().split('T')[0],
                        preferred_time: '12:00 PM',
                        location: 'To be determined',
                        notes: 'Inquiry started from profile'
                    })
                    .select()
                    .single();

                if (error) throw error;

                if (newBooking) {
                    // @ts-ignore
                    onMessageClick(newBooking.id);
                    toast.success('Conversation started!');
                }
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            toast.error('Failed to start conversation');
        } finally {
            setMessageLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Provider not found</p>
                    <button
                        onClick={onClose}
                        className="mt-4 text-red-600 hover:underline"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Navigation Bar */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 border-b px-4 py-3 flex items-center gap-4">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h2 className="font-semibold text-lg truncate">{provider.full_name}</h2>
            </div>

            {/* Channel Banner */}
            <div className="h-32 sm:h-48 bg-gradient-to-r from-gray-800 to-gray-900 w-full relative">
                {/* Optional: Add a banner image here if available in the future */}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Channel Header Info */}
                <div className="flex flex-col sm:flex-row gap-6 -mt-12 mb-8 relative z-10">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {provider.avatar_url ? (
                            <img
                                src={provider.avatar_url}
                                alt={provider.full_name}
                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md object-cover bg-white"
                            />
                        ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center text-5xl font-bold text-gray-400">
                                {provider.full_name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left pt-2 sm:pt-14">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center justify-center sm:justify-start gap-2">
                            {provider.full_name}
                            {provider.is_verified && (
                                <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500" />
                            )}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-gray-600 text-sm mb-4">
                            <span className="font-medium text-black">@{provider.full_name.toLowerCase().replace(/\s+/g, '')}</span>
                            <span>•</span>
                            <span>{provider.followers_count || 0} subscribers</span>
                            <span>•</span>
                            <span>{videos.length} videos</span>
                            {provider.location && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {provider.location}
                                    </span>
                                </>
                            )}
                        </div>

                        {provider.bio && (
                            <p className="text-gray-600 text-sm max-w-2xl mb-4 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                                {provider.bio}
                            </p>
                        )}

                        {(provider.experience || provider.specialty) && (
                            <div className="flex flex-wrap gap-4 mb-6 text-sm">
                                {provider.specialty && (
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                                        <Star className="w-4 h-4" />
                                        <span className="font-medium">{provider.specialty}</span>
                                    </div>
                                )}
                                {provider.experience && (
                                    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{provider.experience}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <FollowButton
                                providerId={providerId}
                                initialFollowersCount={provider.followers_count || 0}
                                onFollowChange={(isFollowing, newCount) => {
                                    setProvider(prev => prev ? { ...prev, followers_count: newCount } : null);
                                }}
                                onAuthRequired={onAuthRequired}
                                className="!bg-black !text-white hover:!bg-gray-800 !rounded-full !px-6 !py-2 !font-medium !text-sm"
                            />

                            {user && user.id !== providerId && (
                                <>
                                    <button
                                        onClick={handleMessageClick}
                                        disabled={messageLoading}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {messageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                        Message
                                    </button>
                                    <button
                                        onClick={onBookClick}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        Book
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`pb-3 px-1 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'videos'
                                ? 'text-black border-b-2 border-black'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            VIDEOS
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`pb-3 px-1 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'portfolio'
                                ? 'text-black border-b-2 border-black'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            PORTFOLIO
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-3 px-1 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'reviews'
                                ? 'text-black border-b-2 border-black'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            REVIEWS
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="pb-12">
                    {activeTab === 'videos' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                            {videos.map((video) => (
                                <div key={video.id} className="group cursor-pointer flex flex-col gap-2">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200">
                                        <video
                                            src={video.video_url}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            muted
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.pause();
                                                e.currentTarget.currentTime = 0;
                                            }}
                                        />
                                        {/* Duration Badge (Mock) */}
                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded font-medium">
                                            0:30
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight mb-1 group-hover:text-black">
                                                {video.title}
                                            </h3>
                                            <div className="text-xs text-gray-600 flex flex-col">
                                                <span>{formatViews(video.views_count || 0)} views • {formatTimeAgo(video.created_at)}</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                    {video.skill_categories?.name}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition-all">
                                            <MoreVertical className="w-4 h-4 text-gray-900" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {videos.length === 0 && (
                                <div className="col-span-full text-center py-20">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <VideoIcon className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
                                    <p className="text-gray-500 text-sm">This provider hasn't uploaded any videos.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                            {workSamples.map((sample) => (
                                <div key={sample.id} className="group relative aspect-square bg-gray-100 cursor-pointer overflow-hidden">
                                    <img
                                        src={sample.image_url}
                                        alt={sample.title}
                                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-4">
                                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <h3 className="font-medium text-sm line-clamp-1">{sample.title}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {workSamples.length === 0 && (
                                <div className="col-span-full text-center py-20">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Briefcase className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No portfolio items</h3>
                                    <p className="text-gray-500 text-sm">This provider hasn't showcased any work yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="max-w-4xl mx-auto">
                            {averageRating > 0 && (
                                <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                                    <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < Math.round(averageRating)
                                                        ? 'fill-gray-900 text-gray-900'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600">{ratings.length} reviews</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {ratings.map((rating) => (
                                    <div key={rating.id} className="flex gap-4">
                                        {rating.client_profile?.avatar_url ? (
                                            <img
                                                src={rating.client_profile.avatar_url}
                                                alt={rating.client_profile.full_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                                {rating.client_profile?.full_name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-sm text-gray-900">
                                                    {rating.client_profile?.full_name}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {formatTimeAgo(rating.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i < rating.rating
                                                            ? 'fill-gray-900 text-gray-900'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            {rating.review && (
                                                <p className="text-sm text-gray-700 leading-relaxed">{rating.review}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {ratings.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Star className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
                                        <p className="text-gray-500 text-sm">This provider hasn't received any reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
