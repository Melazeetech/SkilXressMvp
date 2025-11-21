import { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Star, Loader2, Share2, Volume2, VolumeX, MessageCircle, Plus, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ShareModal } from './ShareModal';
import { HeartOverlay } from './HeartOverlay';
import { ReviewsSheet } from './ReviewsSheet';
import { useBackHandler } from '../hooks/useBackHandler';

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
  is_following?: boolean;
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [heartAnimations, setHeartAnimations] = useState<{ id: number; x: number; y: number }[]>([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { user } = useAuth();

  useBackHandler(reviewsOpen, () => setReviewsOpen(false), 'reviews-sheet');

  useEffect(() => {
    loadVideos();
  }, [categoryFilter, searchQuery, locationFilter]);

  useEffect(() => {
    if (videos.length > 0) {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log("Autoplay prevented:", error);
                if (!video.muted) {
                  setIsMuted(true);
                  video.muted = true;
                  video.play().catch(e => console.error("Muted autoplay failed:", e));
                }
              });
            }
            setIsPlaying(true);
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    }
  }, [currentIndex, videos]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

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
        ((data as any[]) || []).map(async (video) => {
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
            ? (ratingsData as any[]).reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
            : 0;

          let isFollowing = false;
          if (user) {
            const { data: followData } = await supabase
              .from('followers')
              .select('id')
              .eq('follower_id', user.id)
              .eq('provider_id', video.provider_id)
              .maybeSingle();
            isFollowing = !!followData;
          }

          return {
            ...video,
            user_liked: userLiked,
            average_rating: averageRating,
            is_following: isFollowing,
          };
        })
      );

      const filteredVideos = locationFilter
        ? videosWithLikes.filter((v: Video) =>
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
          } as any);
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

  const handleDoubleTap = (e: React.MouseEvent, video: Video) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHeartAnimations(prev => [...prev, { id: Date.now(), x, y }]);

    if (!video.user_liked) {
      handleLike(video);
    }
  };

  const handleFollow = async (video: Video) => {
    if (!user) return;

    try {
      if (video.is_following) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('provider_id', video.provider_id);
      } else {
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            provider_id: video.provider_id,
          } as any);
      }

      setVideos(prev =>
        prev.map(v =>
          v.provider_id === video.provider_id
            ? { ...v, is_following: !v.is_following }
            : v
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
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
      className="h-screen overflow-y-auto snap-y snap-proximity scrollbar-hide"
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
            muted={isMuted}
            onClick={handleVideoClick}
            onPlay={() => index === currentIndex && setIsPlaying(true)}
            onPause={() => index === currentIndex && setIsPlaying(false)}
            onDoubleClick={(e) => handleDoubleTap(e, video)}
          />

          {/* Play Icon Overlay */}
          {!isPlaying && index === currentIndex && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}

          {/* Heart Animations */}
          {heartAnimations.map(anim => (
            <HeartOverlay
              key={anim.id}
              x={anim.x}
              y={anim.y}
              onComplete={() => setHeartAnimations(prev => prev.filter(a => a.id !== anim.id))}
            />
          ))}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Right Side Actions */}
          <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6 z-20">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleLike(video)}
                disabled={liking}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all"
              >
                <Heart
                  className={`w-8 h-8 ${video.user_liked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                />
              </button>
              <span className="text-white text-xs font-medium drop-shadow-md">{video.likes_count}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  setSelectedVideo(video);
                  setReviewsOpen(true);
                }}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all"
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </button>
              <span className="text-white text-xs font-medium drop-shadow-md">Reviews</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  setSelectedVideo(video);
                  setShareModalOpen(true);
                }}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all"
              >
                <Share2 className="w-8 h-8 text-white" />
              </button>
              <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
            </div>

            <button
              onClick={toggleMute}
              className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all"
            >
              {isMuted ? <VolumeX className="w-8 h-8 text-white" /> : <Volume2 className="w-8 h-8 text-white" />}
            </button>
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 sm:pb-8 text-white z-10">
            <div className="flex items-end justify-between max-w-[85%]">
              <div className="flex-1">
                <div className="flex items-center mb-3 cursor-pointer" onClick={() => onProviderClick?.(video.provider_id)}>
                  <div className="relative mr-3">
                    {video.profiles?.avatar_url ? (
                      <img
                        src={video.profiles.avatar_url}
                        alt={video.profiles.full_name}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">
                          {video.profiles?.full_name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {!video.is_following && user?.id !== video.provider_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(video);
                        }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg drop-shadow-md hover:underline decoration-2 underline-offset-2">
                      {video.profiles?.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-100 font-medium drop-shadow-sm">
                      <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {video.skill_categories?.name}
                      </span>
                      {video.profiles?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {video.profiles.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-base mb-1 drop-shadow-md">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-gray-100 line-clamp-2 drop-shadow-sm max-w-prose">
                      {video.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onBookClick(video)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg hover:shadow-blue-500/30"
                  >
                    Book Now
                  </button>
                  {(video.average_rating || 0) > 0 && (
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm">{(video.average_rating || 0).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {selectedVideo && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedVideo(null);
          }}
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
        />
      )}

      {selectedVideo && (
        <ReviewsSheet
          isOpen={reviewsOpen}
          onClose={() => setReviewsOpen(false)}
          providerId={selectedVideo.provider_id}
        />
      )}
    </div>
  );
}
