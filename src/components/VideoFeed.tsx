import { useState, useEffect, useRef } from 'react';
import { Heart, MapPin, Star, Loader2, Share2, MessageCircle, Plus, Play, Calendar, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ShareModal } from './ShareModal';
import { HeartOverlay } from './HeartOverlay';
import { ReviewsSheet } from './ReviewsSheet';
import { useBackHandler } from '../hooks/useBackHandler';
import { VideoViewsModal } from './VideoViewsModal';

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
  onAuthRequired?: () => void;
  sharedVideoId?: string | null;
}

export function VideoFeed({ categoryFilter, searchQuery, locationFilter, onBookClick, onProviderClick, onAuthRequired, sharedVideoId }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [heartAnimations, setHeartAnimations] = useState<{ id: number; x: number; y: number }[]>([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [videoForViews, setVideoForViews] = useState<Video | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastViewedVideoId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollIndexRef = useRef<number>(0);
  const { user } = useAuth();

  useBackHandler(reviewsOpen, () => setReviewsOpen(false), 'reviews-sheet');

  useEffect(() => {
    loadVideos();
  }, [categoryFilter, searchQuery, locationFilter]);

  // Handle initial scroll to shared video
  useEffect(() => {
    if (videos.length > 0 && sharedVideoId && !initialScrollDone.current) {
      const index = videos.findIndex(v => v.id === sharedVideoId);
      if (index !== -1) {
        // Use a small timeout to ensure DOM is ready
        setTimeout(() => {
          scrollToIndex(index);
          setCurrentIndex(index);
          initialScrollDone.current = true;
        }, 100);
      }
    }
  }, [videos, sharedVideoId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (videos.length === 0) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(Math.max(0, currentIndex - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(Math.min(videos.length - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Cleanup scroll timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentIndex, videos.length]);

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (videos.length > 0) {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log("Autoplay prevented:", error);
                // Try to play anyway, browser might block unmuted autoplay until interaction
                // We removed the auto-mute fallback to respect user's wish for sound
              });
            }
            setIsPlaying(true);

            // Increment view count if not already viewed in this session
            const currentVideo = videos[index];
            if (currentVideo && currentVideo.id !== lastViewedVideoId.current) {
              lastViewedVideoId.current = currentVideo.id;
              incrementView(currentVideo.id);
            }
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    }
  }, [currentIndex, videos]);

  const incrementView = async (videoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_views')
        .insert({
          video_id: videoId,
          user_id: user.id
        } as any);

      if (!error) {
        // Successfully recorded a new unique view
        // Update local state to reflect the change immediately
        setVideos(prev => prev.map(v =>
          v.id === videoId
            ? { ...v, views_count: (v.views_count || 0) + 1 }
            : v
        ));
      } else if (error.code !== '23505') { // Ignore unique constraint violation
        console.error('Error recording view:', error);
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const [error, setError] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      setError(null);
      console.log('VideoFeed: Loading videos...');
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
        console.log('VideoFeed: Applying category filter', categoryFilter);
        query = query.eq('category_id', categoryFilter);
      }

      if (searchQuery) {
        console.log('VideoFeed: Applying search query', searchQuery);
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Video load timeout')), 15000)
      );

      // Race the supabase query against the timeout
      let { data, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('VideoFeed: Error fetching videos', error);
        throw error;
      }

      // If we have a shared video ID, ensure it's loaded
      if (sharedVideoId) {
        const sharedVideoExists = data?.some((v: any) => v.id === sharedVideoId);
        if (!sharedVideoExists) {
          console.log('VideoFeed: Shared video not in list, fetching specifically:', sharedVideoId);
          const { data: specificVideo, error: specificError } = await supabase
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
            .eq('id', sharedVideoId)
            .maybeSingle();

          if (specificError) {
            console.error('VideoFeed: Error fetching shared video', specificError);
          } else if (specificVideo) {
            data = [specificVideo, ...(data || [])];
          }
        }
      }

      console.log('VideoFeed: Fetched videos count:', data?.length);

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
              .eq('following_id', video.provider_id)
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

      // Filter out videos with missing profiles (e.g. due to RLS or deleted users)
      const validVideos = videosWithLikes.filter((v: any) => v.profiles);

      const filteredVideos = locationFilter
        ? validVideos.filter((v: Video) =>
          v.profiles?.location?.toLowerCase().includes(locationFilter.toLowerCase())
        )
        : validVideos;

      console.log('VideoFeed: Final filtered videos count:', filteredVideos.length);
      setVideos(filteredVideos);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      setError(error.message || 'Failed to load videos');
    } finally {
      console.log('VideoFeed: Finished loading');
      setLoading(false);
    }
  };

  const handleLike = async (video: Video) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (processingLikes.has(video.id)) {
      return;
    }

    setProcessingLikes(prev => new Set(prev).add(video.id));

    // Optimistic update
    const wasLiked = video.user_liked;
    const oldLikesCount = video.likes_count || 0;
    const newLikesCount = wasLiked ? Math.max(0, oldLikesCount - 1) : oldLikesCount + 1;

    setVideos(prev =>
      prev.map(v =>
        v.id === video.id
          ? {
            ...v,
            user_liked: !wasLiked,
            likes_count: newLikesCount,
          }
          : v
      )
    );

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('video_likes')
          .insert({
            video_id: video.id,
            user_id: user.id,
          } as any);

        if (error) throw error;
      }

      // Update the count in skill_videos table
      await supabase
        .from('skill_videos')
        .update({ likes_count: newLikesCount } as any)
        .eq('id', video.id);

    } catch (error) {
      console.error('Error liking video:', error);
      // Revert optimistic update
      setVideos(prev =>
        prev.map(v =>
          v.id === video.id
            ? {
              ...v,
              user_liked: wasLiked,
              likes_count: oldLikesCount,
            }
            : v
        )
      );
    } finally {
      setProcessingLikes(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
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
    if (!user) {
      onAuthRequired?.();
      return;
    }

    // Optimistic update
    const wasFollowing = video.is_following;
    setVideos(prev =>
      prev.map(v =>
        v.provider_id === video.provider_id
          ? { ...v, is_following: !wasFollowing }
          : v
      )
    );

    try {
      // Get current counts first
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', video.provider_id)
        .single();

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('following_count')
        .eq('id', user.id)
        .single();

      let newFollowerCount = (providerProfile as any)?.followers_count || 0;
      let newFollowingCount = (userProfile as any)?.following_count || 0;

      if (wasFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', video.provider_id);

        newFollowerCount = Math.max(0, newFollowerCount - 1);
        newFollowingCount = Math.max(0, newFollowingCount - 1);
      } else {
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: video.provider_id,
          } as any);

        newFollowerCount += 1;
        newFollowingCount += 1;
      }

      // Update provider's followers count
      await supabase
        .from('profiles')
        .update({ followers_count: newFollowerCount } as any)
        .eq('id', video.provider_id);

      // Update user's following count
      await supabase
        .from('profiles')
        .update({ following_count: newFollowingCount } as any)
        .eq('id', user.id);

    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update on error
      setVideos(prev =>
        prev.map(v =>
          v.provider_id === video.provider_id
            ? { ...v, is_following: wasFollowing }
            : v
        )
      );
    }
  };


  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce the index update to prevent rapid changes
    scrollTimeoutRef.current = setTimeout(() => {
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
        // Snap to the exact position after user stops scrolling
        container.scrollTo({
          top: newIndex * itemHeight,
          behavior: 'smooth'
        });
        setCurrentIndex(newIndex);
        lastScrollIndexRef.current = newIndex;
      }
    }, 150); // 150ms debounce - adjust if needed
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
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center p-6">
          <p className="text-xl font-medium mb-2">{error ? 'Error loading videos' : 'No videos found'}</p>
          <p className="text-sm text-gray-400 mb-4">{error || 'Try adjusting your filters'}</p>
          {!user && (
            <div className="max-w-xs mx-auto text-xs text-gray-500 border-t border-gray-800 pt-4 mt-4">
              <p className="mb-2">Viewing as guest</p>
              <p>If you are the developer: Ensure 'skill_videos' and 'profiles' tables have public read access policies in Supabase.</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      onScroll={handleScroll}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="h-screen snap-start relative flex items-center justify-center bg-black"
          style={{ scrollSnapStop: 'always' }}
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.video_url}
            className="h-full w-full object-cover"
            loop
            playsInline
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
                onClick={() => {
                  setVideoForViews(video);
                  setViewsModalOpen(true);
                }}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all hover:bg-black/30"
              >
                <Eye className="w-8 h-8 text-white" />
              </button>
              <span className="text-white text-xs font-medium drop-shadow-md">{video.views_count || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleLike(video)}
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

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => onBookClick(video)}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all"
              >
                <Calendar className="w-8 h-8 text-white" />
              </button>
              <span className="text-white text-xs font-medium drop-shadow-md">Book</span>
            </div>
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-0 text-white z-10">
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg drop-shadow-md hover:underline decoration-2 underline-offset-2">
                        {video.profiles?.full_name}
                      </h3>
                      {(video.average_rating || 0) > 0 && (
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-xs">{(video.average_rating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
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
                    <div>
                      <p
                        className={`text-sm text-gray-100 drop-shadow-sm max-w-prose transition-all duration-200 ${expandedDescriptions.has(video.id) ? '' : 'line-clamp-2'
                          }`}
                      >
                        {video.description}
                      </p>
                      {video.description.length > 60 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDescriptions(prev => {
                              const next = new Set(prev);
                              if (next.has(video.id)) {
                                next.delete(video.id);
                              } else {
                                next.add(video.id);
                              }
                              return next;
                            });
                          }}
                          className="text-xs font-semibold text-white mt-1 hover:underline drop-shadow-md"
                        >
                          {expandedDescriptions.has(video.id) ? 'Show less' : 'more'}
                        </button>
                      )}
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

      {videoForViews && (
        <VideoViewsModal
          isOpen={viewsModalOpen}
          onClose={() => {
            setViewsModalOpen(false);
            setVideoForViews(null);
          }}
          videoId={videoForViews.id}
          onProfileClick={(userId) => {
            setViewsModalOpen(false);
            setVideoForViews(null);
            onProviderClick?.(userId);
          }}
        />
      )}
    </div>
  );
}
