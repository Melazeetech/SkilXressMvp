import { useState, useEffect } from 'react';
import { MapPin, Star, Video as VideoIcon, Briefcase, MessageCircle, Loader2, Play } from 'lucide-react';
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
}

export function ProviderProfilePage({ providerId, onClose, onBookClick }: ProviderProfilePageProps) {
    const [provider, setProvider] = useState<Profile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [workSamples, setWorkSamples] = useState<WorkSample[]>([]);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [activeTab, setActiveTab] = useState<'videos' | 'portfolio' | 'reviews'>('videos');
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
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

            setVideos(videosData || []);

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

            setRatings(ratingsData || []);

            // Calculate average rating
            if (ratingsData && ratingsData.length > 0) {
                const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
                setAverageRating(avg);
            }
        } catch (error) {
            console.error('Error loading provider data:', error);
        } finally {
            setLoading(false);
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
                        className="mt-4 text-blue-600 hover:underline"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <button
                        onClick={onClose}
                        className="mb-4 text-white/80 hover:text-white transition-colors"
                    >
                        ← Back
                    </button>

                    <div className="flex items-start gap-6">
                        {provider.avatar_url ? (
                            <img
                                src={provider.avatar_url}
                                alt={provider.full_name}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center text-4xl font-bold">
                                {provider.full_name.charAt(0)}
                            </div>
                        )}

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{provider.full_name}</h1>

                            {provider.location && (
                                <div className="flex items-center gap-2 text-white/90 mb-3">
                                    <MapPin className="w-4 h-4" />
                                    <span>{provider.location}</span>
                                </div>
                            )}

                            {provider.bio && (
                                <p className="text-white/90 mb-4 max-w-2xl">{provider.bio}</p>
                            )}

                            <div className="flex items-center gap-6 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{provider.followers_count || 0}</div>
                                    <div className="text-sm text-white/80">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{videos.length}</div>
                                    <div className="text-sm text-white/80">Videos</div>
                                </div>
                                {averageRating > 0 && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold flex items-center gap-1">
                                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                            {averageRating.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-white/80">{ratings.length} Reviews</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <FollowButton
                                    providerId={providerId}
                                    initialFollowersCount={provider.followers_count || 0}
                                />
                                {user && user.id !== providerId && (
                                    <button
                                        onClick={onBookClick}
                                        className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Book Service
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b sticky top-0 bg-white z-10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`py-4 px-2 font-medium transition-colors relative ${activeTab === 'videos'
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <VideoIcon className="w-4 h-4" />
                                Videos ({videos.length})
                            </div>
                            {activeTab === 'videos' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`py-4 px-2 font-medium transition-colors relative ${activeTab === 'portfolio'
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Portfolio ({workSamples.length})
                            </div>
                            {activeTab === 'portfolio' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`py-4 px-2 font-medium transition-colors relative ${activeTab === 'reviews'
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Reviews ({ratings.length})
                            </div>
                            {activeTab === 'reviews' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === 'videos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="group cursor-pointer rounded-xl overflow-hidden bg-gray-100 hover:shadow-lg transition-all duration-200"
                            >
                                <div className="relative aspect-video bg-gray-200">
                                    <video
                                        src={video.video_url}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Play className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        {video.views_count || 0} views
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                                        {video.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {video.skill_categories?.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {videos.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No videos yet
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workSamples.map((sample) => (
                            <div
                                key={sample.id}
                                className="group rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-200"
                            >
                                <div className="aspect-square bg-gray-200">
                                    <img
                                        src={sample.image_url}
                                        alt={sample.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">{sample.title}</h3>
                                    {sample.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {sample.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {workSamples.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No portfolio items yet
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-4 max-w-3xl">
                        {ratings.map((rating) => (
                            <div key={rating.id} className="bg-white rounded-xl p-6 shadow-md">
                                <div className="flex items-start gap-4">
                                    {rating.client_profile?.avatar_url ? (
                                        <img
                                            src={rating.client_profile.avatar_url}
                                            alt={rating.client_profile.full_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                                            {rating.client_profile?.full_name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">
                                                {rating.client_profile?.full_name}
                                            </h4>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rating.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {rating.review && (
                                            <p className="text-gray-700">{rating.review}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(rating.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {ratings.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No reviews yet
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
