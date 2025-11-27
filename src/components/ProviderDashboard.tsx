import { useState, useEffect } from 'react';
import { Plus, Video, Calendar, CheckCircle, X, Loader2, MessageCircle, Star, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import { Chat } from './Chat';
import { PortfolioManager } from './PortfolioManager';
import { ProviderStatsHeader } from './ProviderStatsHeader';

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

type Video = Database['public']['Tables']['skill_videos']['Row'] & {
  skill_categories: {
    name: string;
  };
};

type Category = Database['public']['Tables']['skill_categories']['Row'];

type Rating = Database['public']['Tables']['ratings']['Row'] & {
  client_profile: {
    full_name: string;
    avatar_url: string | null;
  };
};

export function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<'videos' | 'bookings' | 'reviews' | 'portfolio'>('videos');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const { user, profile } = useAuth();

  useEffect(() => {
    loadData();
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: videoData } = await supabase
        .from('skill_videos')
        .select('views_count')
        .eq('provider_id', user.id);

      const totalVideos = videoData?.length || 0;
      const totalViews = videoData?.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0) || 0;

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('rating')
        .eq('provider_id', user.id);

      const totalReviews = ratingsData?.length || 0;
      const averageRating = totalReviews > 0 && ratingsData
        ? ratingsData.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0;

      setStats({
        totalVideos,
        totalViews,
        averageRating,
        totalReviews,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      if (activeTab === 'videos') {
        const { data: videosData } = await supabase
          .from('skill_videos')
          .select(`
            *,
            skill_categories (name)
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        const { data: categoriesData } = await supabase
          .from('skill_categories')
          .select('*')
          .order('name');

        setVideos(videosData || []);
        setCategories(categoriesData || []);
      } else if (activeTab === 'bookings') {
        const { data: bookingsData } = await supabase
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
            skill_categories (name)
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        setBookings(bookingsData || []);
      } else if (activeTab === 'reviews') {
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select(`
            *,
            client_profile:profiles!ratings_client_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        setRatings(ratingsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Database['public']['Tables']['bookings']['Row']['status']) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('bookings') as any)
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      loadData();
      loadStats(); // Refresh stats when booking status changes
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleOpenChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowChat(true);
  };

  if (showChat && selectedBooking) {
    return <Chat booking={selectedBooking} onClose={() => setShowChat(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Provider Dashboard</h1>
          {activeTab === 'videos' && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Video
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'videos'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Video className="w-5 h-5" />
            My Videos
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'bookings'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Calendar className="w-5 h-5" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'reviews'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Star className="w-5 h-5" />
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'portfolio'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Briefcase className="w-5 h-5" />
            Portfolio
          </button>
        </div>

        {/* Provider Stats Header */}
        <ProviderStatsHeader profile={profile} stats={stats} />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No videos yet. Upload your first video!</p>
                  </div>
                ) : (
                  videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <video
                        src={video.video_url}
                        className="w-full h-48 object-cover"
                        controls
                      />
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{video.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {video.skill_categories.name}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{video.likes_count} likes</span>
                          <span>{video.views_count} views</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <PortfolioManager />
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {booking.client_profile.avatar_url ? (
                            <img
                              src={booking.client_profile.avatar_url}
                              alt={booking.client_profile.full_name}
                              className="w-12 h-12 rounded-full mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                              <span className="font-bold text-gray-600">
                                {booking.client_profile.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">
                              {booking.client_profile.full_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {booking.skill_categories.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(booking.preferred_date).toLocaleDateString()} at{' '}
                              {booking.preferred_time}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.location}
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

                      {booking.notes && (
                        <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {booking.notes}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleOpenChat(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </button>

                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Decline
                            </button>
                          </>
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {ratings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="bg-white rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {rating.client_profile.avatar_url ? (
                            <img
                              src={rating.client_profile.avatar_url}
                              alt={rating.client_profile.full_name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <span className="font-bold text-gray-600">
                                {rating.client_profile.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">
                              {rating.client_profile.full_name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= rating.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-gray-600 mt-2">{rating.review}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showUploadForm && (
        <VideoUploadForm
          categories={categories}
          onClose={() => {
            setShowUploadForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function VideoUploadForm({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      let finalVideoUrl = videoUrl;

      // If uploading a file, upload it first
      if (uploadMethod === 'file' && videoFile) {
        const { uploadVideo } = await import('../lib/uploadHelpers');
        finalVideoUrl = await uploadVideo(videoFile, user.id, (progress) => {
          setUploadProgress(progress);
        });
      }

      const videoData: Database['public']['Tables']['skill_videos']['Insert'] = {
        provider_id: user.id,
        category_id: categoryId,
        video_url: finalVideoUrl,
        title,
        description: description || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('skill_videos') as any).insert(videoData);

      if (error) throw error;

      // Clean up preview URL
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }

      onClose();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Upload Video</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Method Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`px-3 sm:px-4 py-2 rounded-lg border-2 font-medium transition-colors text-sm sm:text-base ${uploadMethod === 'file'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`px-3 sm:px-4 py-2 rounded-lg border-2 font-medium transition-colors text-sm sm:text-base ${uploadMethod === 'url'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                Use URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {uploadMethod === 'file' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video File
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={uploadMethod === 'file'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 50MB. Supported formats: MP4, WebM, MOV
              </p>

              {videoPreview && (
                <div className="mt-3">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={uploadMethod === 'url'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a public video URL
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Upload Video'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
