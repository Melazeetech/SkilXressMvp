import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Heart, MapPin, Star, Share2, MessageCircle, Plus, Play, Pause, Calendar, Eye, VolumeX, BadgeCheck, MoreVertical, Flag, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { ShareModal } from './ShareModal';
import { HeartOverlay } from './HeartOverlay';
import { ReviewsSheet } from './ReviewsSheet';
import { useBackHandler } from '../hooks/useBackHandler';
import { VideoViewsModal } from './VideoViewsModal';
import { VideoCommentsSheet } from './VideoCommentsSheet';
import { VideoSkeleton } from './Skeleton';
import { VideoUploadModal } from './VideoUploadModal';

type Video = Database['public']['Tables']['skill_videos']['Row'] & {
  public_profiles: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
    is_verified?: boolean;
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
  onProviderClick: (providerId: string) => void;
  onAuthRequired?: () => void;
  sharedVideoId?: string | null;
  isActive?: boolean;
}

export function VideoFeed({ categoryFilter, searchQuery, locationFilter, onBookClick, onProviderClick, onAuthRequired, sharedVideoId, isActive = true }: VideoFeedProps) {
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
  const [isMuted, setIsMuted] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastViewedVideoId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const { user, profile } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [videoForOptions, setVideoForOptions] = useState<Video | null>(null);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

  const closeAllModals = () => {
    setCommentsOpen(false);
    setReviewsOpen(false);
    setViewsModalOpen(false);
    setShareModalOpen(false);
    setOptionsMenuOpen(false);
  };

  useBackHandler(reviewsOpen, () => setReviewsOpen(false), 'reviews-sheet');
  useBackHandler(commentsOpen, () => setCommentsOpen(false), 'comments-sheet');
  useBackHandler(optionsMenuOpen, () => setOptionsMenuOpen(false), 'options-menu');
  useBackHandler(shareModalOpen, () => setShareModalOpen(false), 'share-modal');
  useBackHandler(viewsModalOpen, () => setViewsModalOpen(false), 'views-modal');

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
        const newIndex = Math.max(0, currentIndex - 1);
        scrollToIndex(newIndex);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = Math.min(videos.length - 1, currentIndex + 1);
        scrollToIndex(newIndex);
      } else if (e.key === 'm') {
        // Toggle mute with keyboard
        const video = videoRefs.current[currentIndex];
        if (video) {
          video.muted = !video.muted;
          setIsMuted(video.muted);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, videos.length]);

  // Intersection Observer for active video detection
  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.7, // Trigger when 70% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = videoRefs.current.findIndex((ref) => ref === entry.target);
          if (index !== -1 && index !== currentIndex) {
            setCurrentIndex(index);
          }
        }
      });
    }, options);

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos, currentIndex]);

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
          if (index === currentIndex && isActive) {
            // Reset mute state for new video if needed, or persist user preference.
            // For now, let's persist the 'isMuted' state across videos if we want, 
            // OR reset it. Usually feeds persist mute state. 
            // But we need to sync the video element with the state.
            // However, browsers block unmuted autoplay.

            // Try playing
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                setIsPlaying(true);
              }).catch((error) => {
                console.log("Autoplay prevented:", error);
                // Fallback to muted autoplay
                video.muted = true;
                video.play().then(() => {
                  setIsMuted(true);
                  setIsPlaying(true);
                }).catch(e => {
                  console.error("Muted autoplay also failed", e);
                  setIsPlaying(false);
                });
              });
            } else {
              setIsPlaying(true);
            }

            // Increment view count if not already viewed in this session
            const currentVideo = videos[index];
            if (currentVideo && currentVideo.id !== lastViewedVideoId.current) {
              lastViewedVideoId.current = currentVideo.id;
              incrementView(currentVideo.id);
            }
          } else {
            video.pause();
            video.currentTime = 0; // Reset to start when scrolled away
            if (index === currentIndex) {
              setIsPlaying(false);
            }
          }
        }
      });
    }

    // Cleanup: pause all videos when unmounting or becoming inactive
    return () => {
      videoRefs.current.forEach(video => {
        if (video) video.pause();
      });
    };
  }, [currentIndex, videos, isActive]);

  const incrementView = async (videoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('video_views')
        // @ts-ignore
        .insert({
          video_id: videoId,
          user_id: user.id
        });

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
    // If any modal is open, close them first and resume?
    // User said: "hide when i click the other part of the scrren and continue playing the video i was watching"
    if (optionsMenuOpen || commentsOpen || reviewsOpen || viewsModalOpen || shareModalOpen) {
      closeAllModals();
      return;
    }

    const video = e.currentTarget;

    // Clear any existing timeout (handling double click case)
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      return;
    }

    // Set a new timeout to delay the single click action
    clickTimeoutRef.current = setTimeout(() => {
      // Toggle play/pause only if menu wasn't just closed (handled by early return above)
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
        setShowPauseIcon(true);
        setTimeout(() => setShowPauseIcon(false), 500);
      }

      // Also unmute if playing
      if (video.muted) {
        video.muted = false;
        setIsMuted(false);
      }

      clickTimeoutRef.current = null;
    }, 250); // 250ms delay to wait for potential double click
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
          public_profiles:profiles!skill_videos_provider_id_fkey (
            full_name,
            avatar_url,
            location,
            is_verified
          ),
          skill_categories (
            name
          )
        `)
        .eq('status', 'approved')
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
              public_profiles:profiles!skill_videos_provider_id_fkey (
                full_name,
                avatar_url,
                location,
                is_verified
              ),
              skill_categories (
                name
              )
            `)
            .eq('id', sharedVideoId)
            .eq('status', 'approved')
            .maybeSingle();

          if (specificError) {
            console.error('VideoFeed: Error fetching shared video', specificError);
          } else if (specificVideo) {
            data = [specificVideo, ...(data || [])];
          } else {
            console.warn('VideoFeed: Shared video not found or not approved.');
          }
        }
      }

      console.log('VideoFeed: Fetched videos count:', data?.length);

      // Fetch user preferences (e.g. not interested) if logged in
      let notInterestedIds: string[] = [];
      if (user) {
        const { data: prefsData } = await supabase
          .from('user_video_preferences')
          .select('video_id')
          .eq('user_id', user.id)
          .eq('preference_type', 'not_interested');

        if (prefsData) {
          notInterestedIds = prefsData.map(p => p.video_id);
        }
      }

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

          // Fallback: If public_profiles is missing (due to RLS on 'profiles'), fetch from 'public_profiles' view
          let publicProfile = video.public_profiles;
          if (!publicProfile && video.provider_id) {
            const { data: profileData } = await supabase
              .from('public_profiles')
              .select('full_name, avatar_url, location, is_verified')
              .eq('id', video.provider_id)
              .maybeSingle();

            if (profileData) {
              publicProfile = profileData;
            }
          }

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
            public_profiles: publicProfile,
            user_liked: userLiked,
            average_rating: averageRating,
            is_following: isFollowing,
          };
        })
      );

      // Filter out videos with missing profiles (e.g. due to RLS or deleted users)
      // AND filter out 'not_interested' videos
      const validVideos = videosWithLikes.filter((v: any) =>
        v.public_profiles && !notInterestedIds.includes(v.id)
      );

      const filteredVideos = locationFilter
        ? validVideos.filter((v: Video) =>
          v.public_profiles?.location?.toLowerCase().includes(locationFilter.toLowerCase())
        )
        : validVideos;

      // Final safety check: Only show approved videos
      const finalVideos = filteredVideos.filter((v: any) => v.status === 'approved');

      console.log('VideoFeed: Final approved videos count:', finalVideos.length);
      // Diagnostic log
      finalVideos.forEach((v: any) => console.log(`Live Video: "${v.title}" | Status: ${v.status}`));

      setVideos(finalVideos);
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
          // @ts-ignore
          .insert({
            video_id: video.id,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // No need to manually update likes_count anymore, the DB trigger handles it.
      // But we keep the optimistic update in the state for responsiveness.

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

  const handleReportVideo = async (video: Video) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    const reason = window.prompt('Please provide a reason for reporting this video (e.g. Inappropriate content, Spam, Harassment):');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('video_reports')
        // @ts-ignore
        .insert({
          video_id: video.id,
          user_id: user.id,
          reason: reason
        });

      if (error) throw error;
      toast.success('Thank you for reporting. Our team will review it.');
      setOptionsMenuOpen(false);
    } catch (error) {
      console.error('Error reporting video:', error);
      toast.error('Failed to submit report. Please try again.');
    }
  };

  const handleNotInterested = async (video: Video) => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    try {
      // Record preference
      const { error } = await supabase
        .from('user_video_preferences')
        // @ts-ignore
        .insert({
          user_id: user.id,
          video_id: video.id,
          preference_type: 'not_interested'
        });

      if (error && error.code !== '23505') throw error;

      // Optimistic filter from local state
      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast.success('We will show you fewer videos like this.');
      setOptionsMenuOpen(false);
    } catch (error) {
      console.error('Error recording preference:', error);
      toast.error('Failed to save preference.');
    }
  };

  const handleDoubleTap = (e: React.MouseEvent, video: Video) => {
    // Clear any pending single click action
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

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
          // @ts-ignore
          .insert({
            follower_id: user.id,
            following_id: video.provider_id,
          });
      }
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




  if (loading) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-black">
        <VideoSkeleton />
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
            preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "none"}
            onClick={handleVideoClick}
            onPlay={() => index === currentIndex && setIsPlaying(true)}
            onPause={() => index === currentIndex && setIsPlaying(false)}
            onDoubleClick={(e) => handleDoubleTap(e, video)}
          />

          {/* Play/Pause Icon Overlay */}
          {!isPlaying && index === currentIndex && !showPauseIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}

          {showPauseIcon && index === currentIndex && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm animate-out fade-out zoom-out duration-500">
                <Pause className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}

          {/* Mute Icon Overlay - Small indicator */}
          {isMuted && index === currentIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const el = videoRefs.current[index];
                if (el) {
                  el.muted = false;
                  setIsMuted(false);
                }
              }}
              className="absolute top-20 right-4 p-2 bg-black/40 rounded-full backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-200"
            >
              <VolumeX className="w-6 h-6 text-white" />
            </button>
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
          <div className="absolute top-1/2 -translate-y-[40%] right-4 flex flex-col items-center gap-4 z-20">
            <button
              onClick={() => handleLike(video)}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
              title="Like"
            >
              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <Heart
                  className={`w-4 h-4 ${video.user_liked ? 'fill-secondary-orange text-secondary-orange' : 'text-white'}`}
                />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">{video.likes_count}</span>
            </button>

            <button
              onClick={() => {
                closeAllModals();
                setSelectedVideo(video);
                setCommentsOpen(true);
              }}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
              title="Comments"
            >

              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">Comments</span>
            </button>

            <button
              onClick={() => {
                closeAllModals();
                setSelectedVideo(video);
                setReviewsOpen(true);
              }}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">Reviews</span>
            </button>

            <button
              onClick={() => {
                closeAllModals();
                setSelectedVideo(video);
                setViewsModalOpen(true);
              }}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">{video.views_count || 0}</span>
            </button>

            <button
              onClick={() => {
                closeAllModals();
                setSelectedVideo(video);
                setShareModalOpen(true);
              }}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">Share</span>
            </button>

            <button
              onClick={() => onBookClick(video)}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <div className="p-2 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-[10px] font-medium drop-shadow-md">Book</span>
            </button>

            {profile?.user_type === 'provider' && (
              <button
                onClick={() => {
                  closeAllModals();
                  setUploadModalOpen(true);
                }}
                className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <div className="p-2 bg-secondary-orange/80 backdrop-blur-md rounded-full transition-all group-hover:bg-secondary-orange shadow-lg shadow-secondary-orange/20">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-md">Post</span>
              </button>
            )}

            {/* More Options Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeAllModals();
                setVideoForOptions(video);
                setOptionsMenuOpen(true);
              }}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <div className="p-2.5 bg-black/20 backdrop-blur-md rounded-full transition-all group-hover:bg-black/30">
                <MoreVertical className="w-5 h-5 text-white" />
              </div>
            </button>
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-0 text-white z-10">
            <div className="flex items-end justify-between max-w-[85%]">
              <div className="flex-1">
                <div className="flex items-center mb-3 cursor-pointer" onClick={() => onProviderClick?.(video.provider_id)}>
                  <div className="relative mr-3">
                    {video.public_profiles?.avatar_url ? (
                      <img
                        src={video.public_profiles.avatar_url}
                        alt={video.public_profiles.full_name}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-orange to-secondary-cyan border-2 border-white flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">
                          {video.public_profiles?.full_name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {!video.is_following && user?.id !== video.provider_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(video);
                        }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary-orange text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg drop-shadow-md hover:underline decoration-2 underline-offset-2 flex items-center gap-1">
                        {video.public_profiles?.full_name}
                        {video.public_profiles?.is_verified && (
                          <BadgeCheck className="w-4 h-4 text-secondary-cyan fill-white drop-shadow-md" />
                        )}
                      </h3>
                      {(video.average_rating || 0) > 0 && (
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-secondary-yellow text-secondary-yellow" />
                          <span className="font-bold text-xs">{(video.average_rating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-100 font-medium drop-shadow-sm">
                      <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {video.skill_categories?.name}
                      </span>
                      {video.public_profiles?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {video.public_profiles.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-base mb-1 drop-shadow-md">{video.title}</h4>
                  {video.description && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {selectedVideo && (
        <>
          <VideoCommentsSheet
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            videoId={selectedVideo.id}
          />
          <ReviewsSheet
            isOpen={reviewsOpen}
            onClose={() => setReviewsOpen(false)}
            providerId={selectedVideo.provider_id}
          />
          <ShareModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            videoId={selectedVideo.id}
            videoTitle={selectedVideo.title}
          />
          <VideoViewsModal
            isOpen={viewsModalOpen}
            onClose={() => setViewsModalOpen(false)}
            videoId={selectedVideo.id}
            onProfileClick={(userId) => {
              setViewsModalOpen(false);
              onProviderClick?.(userId);
            }}
          />
        </>
      )}

      <VideoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          loadVideos(); // Refresh feed after upload
        }}
      />

      {/* Side Options Menu */}
      {optionsMenuOpen && videoForOptions && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={(e) => {
              e.stopPropagation();
              setOptionsMenuOpen(false);
            }}
          />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-black/80 backdrop-blur-xl border-l border-white/10 p-6 z-50 animate-in slide-in-from-right duration-300">
            <h3 className="text-white font-bold text-lg mb-6">Options</h3>
            <div className="space-y-4">
              <button
                onClick={() => handleReportVideo(videoForOptions)}
                className="w-full flex items-center gap-3 text-white hover:bg-white/10 p-3 rounded-xl transition-colors"
              >
                <Flag className="w-5 h-5" />
                <span className="font-medium">Report Video</span>
              </button>
              <button
                onClick={() => handleNotInterested(videoForOptions)}
                className="w-full flex items-center gap-3 text-white hover:bg-white/10 p-3 rounded-xl transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Not Interested</span>
              </button>
              {/* Add more options as needed */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
