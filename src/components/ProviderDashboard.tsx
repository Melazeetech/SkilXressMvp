import { useState, useEffect } from 'react';
import { Plus, Video, Calendar, CheckCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  client_profile: {
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

export function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<'videos' | 'bookings'>('videos');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
      } else {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            client_profile:profiles!bookings_client_id_fkey (
              full_name,
              avatar_url
            ),
            skill_categories (name)
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

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

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'videos'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="w-5 h-5" />
            My Videos
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Bookings
          </button>
        </div>

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
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'pending'
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

                      {booking.status === 'pending' && (
                        <div className="mt-4 flex gap-3">
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
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Completed
                          </button>
                        </div>
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
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('skill_videos').insert({
        provider_id: user.id,
        category_id: categoryId,
        video_url: videoUrl,
        title,
        description,
      });

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Upload Video</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For demo purposes, use a public video URL
            </p>
          </div>

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
