import { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Video = Database['public']['Tables']['skill_videos']['Row'] & {
  profiles: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
  };
  skill_categories: {
    name: string;
  };
  user_liked?: boolean;
  average_rating?: number;
};

interface VideoFeedProps {
  categoryFilter?: string;
  searchQuery?: string;
  locationFilter?: string;
  onBookClick: (video: Video) => void;
  onProviderClick?: (providerId: string) => void;
}

export function VideoFeed({ categoryFilter, searchQuery, locationFilter, onBookClick, onProviderClick }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liking, setLiking] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadVideos();
  }, [categoryFilter, searchQuery, locationFilter]);

  useEffect(() => {
    if (videos.length > 0) {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            video.play();
          } else {
            video.pause();
          }
        }
      });
    }
  }, [currentIndex, videos]);

  const loadVideos = async () => {
    try {
      let query = supabase
        .from('skill_videos')
        .select(`
          *,
          profiles!skill_videos_provider_id_fkey (
            full_name,
            avatar_url,
            location
          ),
          skill_categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const videosWithLikes = await Promise.all(
        (data || []).map(async (video) => {
          let userLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('video_likes')
              .select('id')
              .eq('video_id', video.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!likeData;
          }

          const { data: ratingsData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('provider_id', video.provider_id);

          const averageRating = ratingsData && ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
            : 0;

          return {
            ...video,
            user_liked: userLiked,
            average_rating: averageRating,
          };
        })
      );

      const filteredVideos = locationFilter
        ? videosWithLikes.filter(v =>
          v.profiles?.location?.toLowerCase().includes(locationFilter.toLowerCase())
        )
        : videosWithLikes;

      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (video: Video) => {
    if (!user || liking) return;

    setLiking(true);
    try {
      if (video.user_liked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('video_likes')
          .insert({
            video_id: video.id,
            user_id: user.id,
          });
      }

      setVideos(prev =>
        prev.map(v =>
          v.id === video.id
            ? {
              ...v,
              user_liked: !v.user_liked,
              likes_count: v.user_liked ? v.likes_count - 1 : v.likes_count + 1,
            }
            : v
        )
      );
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">No videos found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      onScroll={handleScroll}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="h-screen snap-start relative flex items-center justify-center bg-black"
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.video_url}
            className="h-full w-full object-cover"
            loop
            playsInline
            muted
            onDoubleClick={() => handleLike(video)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {video.profiles?.avatar_url ? (
                    <img
                      src={video.profiles.avatar_url}
                      alt={video.profiles.full_name}
                      className="w-12 h-12 rounded-full border-2 border-white mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-white mr-3 flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {video.profiles?.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3
                      className="font-semibold text-lg cursor-pointer hover:underline"
                      onClick={() => onProviderClick?.(video.provider_id)}
                    >
                      {video.profiles?.full_name}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {video.skill_categories?.name}
                    </p>
                  </div>
                </div>

                <h4 className="font-medium text-base mb-2">{video.title}</h4>

                {video.description && (
                  <p className="text-sm text-gray-200 mb-3 line-clamp-2">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  {video.profiles?.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {video.profiles.location}
                    </div>
                  )}
                  {video.average_rating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {video.average_rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onBookClick(video)}
                  className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  Book Now
                </button>
              </div>

              <div className="flex flex-col items-center gap-6 ml-4">
                <button
                  onClick={() => handleLike(video)}
                  disabled={liking}
                  className="flex flex-col items-center disabled:opacity-50"
                >
                  <Heart
                    className={`w-8 h-8 ${video.user_liked ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                  />
                  <span className="text-xs mt-1">{video.likes_count}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
