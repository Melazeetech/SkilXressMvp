import { useState, useEffect } from 'react';
import { Home, User, LogOut, Menu, X, MessageSquare, Bell, Search } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { VideoFeed } from './components/VideoFeed';
import { BookingModal } from './components/BookingModal';
import { SearchBar } from './components/SearchBar';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { ProfileModal } from './components/ProfileModal';
import { LandingPage } from './components/LandingPage';
import { ProviderProfilePage } from './components/ProviderProfilePage';
import { MessagesView } from './components/MessagesView';
import { NotificationsView } from './components/NotificationsView';
import { Database } from './lib/database.types';
import { useBackHandler } from './hooks/useBackHandler';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';

type Video = Database['public']['Tables']['skill_videos']['Row'] & {
  profiles: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
  };
  skill_categories: {
    name: string;
  };
};

function AppContent() {
  const { user, profile, signOut, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [providerProfileOpen, setProviderProfileOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'dashboard' | 'messages' | 'notifications'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle back button for modals and views
  useBackHandler(authModalOpen, () => setAuthModalOpen(false), 'auth-modal');
  useBackHandler(bookingModalOpen, () => setBookingModalOpen(false), 'booking-modal');
  useBackHandler(profileModalOpen, () => setProfileModalOpen(false), 'profile-modal');
  useBackHandler(searchModalOpen, () => setSearchModalOpen(false), 'search-modal');
  useBackHandler(providerProfileOpen, () => {
    setProviderProfileOpen(false);
    setSelectedProviderId(null);
  }, 'provider-profile');
  useBackHandler(currentView === 'dashboard' || currentView === 'messages' || currentView === 'notifications', () => {
    setCurrentView('feed');
    setActiveBookingId(null);
  }, 'main-view');

  useEffect(() => {
    // Check for deep links
    const params = new URLSearchParams(window.location.search);
    const providerId = params.get('provider');
    const videoId = params.get('video');

    if (providerId) {
      setSelectedProviderId(providerId);
      setProviderProfileOpen(true);
    }

    if (videoId) {
      // If we have a video ID, we might want to scroll to it or open it
      // For now, let's just ensure we're on the feed
      setCurrentView('feed');
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkUnreadNotifications();
    }
  }, [user, currentView]); // Re-check when view changes (e.g. leaving notifications view)

  const checkUnreadNotifications = async () => {
    if (!user) return;
    try {
      let lastReadAt = new Date(0).toISOString();

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('last_read_notifications_at')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          lastReadAt = (profile as any).last_read_notifications_at || lastReadAt;
        }
      } catch (e) {
        // Column might not exist yet, ignore
        console.log('Could not fetch last_read_notifications_at, defaulting to 0');
      }

      let totalUnread = 0;

      // 1. Likes
      const { data: myVideos } = await supabase
        .from('skill_videos')
        .select('id')
        .eq('provider_id', user.id);

      if (myVideos && myVideos.length > 0) {
        const videoIds = (myVideos as any[]).map(v => v.id);
        const { count } = await supabase
          .from('video_likes')
          .select('id', { count: 'exact', head: true })
          .in('video_id', videoIds)
          .gt('created_at', lastReadAt);
        totalUnread += (count || 0);
      }

      // 2. Followers
      const { count: followersCount } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', user.id)
        .gt('created_at', lastReadAt);
      totalUnread += (followersCount || 0);

      // 3. Bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .gt('created_at', lastReadAt);
      totalUnread += (bookingsCount || 0);

      setUnreadCount(totalUnread);

    } catch (error) {
      console.error("Error checking unread notifications:", error);
    }
  };

  const handleBookClick = (video: Video) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedVideo(video);
    setBookingModalOpen(true);
  };

  const handleHomeClick = () => {
    setCurrentView('feed');
    setSearchQuery('');
    setCategoryFilter('');
    setLocationFilter('');
    setSearchModalOpen(false);
    // Force a re-render of VideoFeed by resetting key or similar if needed, 
    // but clearing filters should trigger useEffect in VideoFeed.
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${currentView === 'feed' && user ? 'bg-transparent' : 'bg-blue-600 shadow-md'
        }`}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleHomeClick}
              className={`text-xl font-bold text-white drop-shadow-md`}
            >
              SkilXpress
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={handleHomeClick}
                  className={`p-2 rounded-full transition-colors text-white hover:bg-white/20`}
                >
                  <Home className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className={`p-2 rounded-full transition-colors text-white hover:bg-white/20`}
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentView('messages')}
                  className={`p-2 rounded-full transition-colors ${currentView === 'messages'
                    ? 'bg-white/20 text-white'
                    : 'text-white hover:bg-white/20'
                    }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentView('notifications')}
                  className={`p-2 rounded-full transition-colors relative ${currentView === 'notifications'
                    ? 'bg-blue-50 text-blue-600'
                    : currentView === 'feed' ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`p-2 rounded-full transition-colors ${currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-600'
                    : currentView === 'feed' ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`p-2 rounded-full transition-colors ${currentView === 'feed' ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {menuOpen && (
                  <div className="absolute top-14 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold">{profile?.full_name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {profile?.user_type}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                        setCurrentView('feed');
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`${currentView === 'feed' && user ? 'pt-0' : 'pt-14'}`}>
        {currentView === 'feed' ? (
          <>

            {user ? (
              <VideoFeed
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                locationFilter={locationFilter}
                onBookClick={handleBookClick}
                onProviderClick={(providerId) => {
                  setSelectedProviderId(providerId);
                  setProviderProfileOpen(true);
                }}
                onAuthRequired={() => setAuthModalOpen(true)}
              />
            ) : (
              <LandingPage onGetStarted={() => setAuthModalOpen(true)} />
            )}
          </>
        ) : currentView === 'messages' ? (
          <MessagesView activeBookingId={activeBookingId} />
        ) : currentView === 'notifications' ? (
          <NotificationsView />
        ) : (
          <>
            {profile?.user_type === 'provider' ? (
              <ProviderDashboard />
            ) : (
              <ClientDashboard />
            )}
          </>
        )}
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        video={selectedVideo}
      />

      {selectedProviderId && (
        <ProviderProfilePage
          providerId={selectedProviderId}
          onClose={() => {
            setSelectedProviderId(null);
            setProviderProfileOpen(false);
            // Clear URL param when closing
            const url = new URL(window.location.href);
            url.searchParams.delete('provider');
            window.history.pushState({}, '', url);
          }}
          onBookClick={() => {
            setSelectedProviderId(null);
            setProviderProfileOpen(false);
            if (selectedVideo) {
              setBookingModalOpen(true);
            }
          }}
          onMessageClick={(bookingId) => {
            setSelectedProviderId(null);
            setProviderProfileOpen(false);
            setActiveBookingId(bookingId);
            setCurrentView('messages');
          }}
          onAuthRequired={() => setAuthModalOpen(true)}
        />
      )}

      {searchModalOpen && (
        <SearchBar
          onSearch={setSearchQuery}
          onCategoryFilter={setCategoryFilter}
          onLocationFilter={setLocationFilter}
          onClose={() => setSearchModalOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-center" />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
