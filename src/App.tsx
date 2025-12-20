import { useState, useEffect } from 'react';
import { Home, User, LogOut, Menu, X, MessageSquare, Bell, Search, Shield } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { VideoFeed } from './components/VideoFeed';
import { BookingModal } from './components/BookingModal';
import { SearchBar } from './components/SearchBar';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { ProfileModal } from './components/ProfileModal';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { ProviderProfilePage } from './components/ProviderProfilePage';
import { MessagesView } from './components/MessagesView';
import { NotificationsView } from './components/NotificationsView';
import { AdminPanel } from './components/AdminPanel';
import { Database } from './lib/database.types';
import { useBackHandler } from './hooks/useBackHandler';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';

type Video = Database['public']['Tables']['skill_videos']['Row'] & {
  public_profiles: {
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
  const [isGuest, setIsGuest] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [providerProfileOpen, setProviderProfileOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [sharedVideoId, setSharedVideoId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'dashboard' | 'messages' | 'notifications' | 'admin'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Handle back button for modals and views
  useBackHandler(authModalOpen, () => setAuthModalOpen(false), 'auth-modal');
  useBackHandler(bookingModalOpen, () => setBookingModalOpen(false), 'booking-modal');
  useBackHandler(profileModalOpen, () => setProfileModalOpen(false), 'profile-modal');
  useBackHandler(searchModalOpen, () => setSearchModalOpen(false), 'search-modal');
  useBackHandler(privacyOpen, () => setPrivacyOpen(false), 'privacy-policy');
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
      setSharedVideoId(videoId);
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
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        // If table doesn't exist yet, fail silently
        console.log('Notifications table check failed - likely not created yet');
        return;
      }

      setUnreadCount(count || 0);
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
    setSharedVideoId(null);
    // Force a re-render of VideoFeed by resetting key or similar if needed, 
    // but clearing filters should trigger useEffect in VideoFeed.
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {currentView !== 'feed' && (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-secondary-black shadow-md">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 group"
              >
                <div className="w-10 h-10 group-hover:scale-105 transition-transform">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <span className="text-xl font-bold text-white drop-shadow-md">
                  SkilXpress
                </span>
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
                      ? 'bg-secondary-orange/20 text-secondary-orange'
                      : 'text-white hover:bg-white/20'
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
                      ? 'bg-secondary-orange/20 text-secondary-orange'
                      : 'text-white hover:bg-white/20'
                      }`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`p-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-white/10`}
                  >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  {menuOpen && (
                    <div className="absolute top-14 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{profile?.full_name}</p>
                        <p className="text-sm text-gray-500 capitalize">
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
                          setPrivacyOpen(true);
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-bold"
                      >
                        <Shield className="w-4 h-4" />
                        Privacy Policy
                      </button>
                      {profile?.user_type === 'admin' && (
                        <button
                          onClick={() => {
                            setCurrentView('admin');
                            setMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 font-bold ${currentView === 'admin'
                            ? 'bg-secondary-cyan/10 text-secondary-cyan'
                            : 'hover:bg-gray-50 text-secondary-black'
                            }`}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Hub
                        </button>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                          setCurrentView('feed');
                          setIsGuest(false);
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
                  className="bg-primary text-secondary-black px-6 py-2 rounded-lg font-bold hover:bg-secondary-yellow transition-colors shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {currentView === 'feed' && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-2 group p-1 bg-black/20 backdrop-blur-md rounded-lg"
            >
              <div className="w-8 h-8 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <span className="text-lg font-bold text-white drop-shadow-md hidden sm:block">
                SkilXpress
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all shadow-lg active:scale-95"
            >
              <Search className="w-6 h-6" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all shadow-lg active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {menuOpen && (
            <div className="absolute top-16 right-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 min-w-[220px] pointer-events-auto animate-in fade-in zoom-in duration-200">
              <div className="px-5 py-3 border-b border-gray-100 mb-2">
                <p className="font-bold text-gray-900 leading-none mb-1">{profile?.full_name || 'Guest User'}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  {profile?.user_type || 'Viewer'}
                </p>
              </div>
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setMenuOpen(false);
                    }}
                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('messages');
                      setMenuOpen(false);
                    }}
                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Messages</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('notifications');
                      setMenuOpen(false);
                    }}
                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-sm font-medium">Notifications</span>
                    {unreadCount > 0 && <span className="absolute top-2.5 left-8 w-2 h-2 bg-red-500 rounded-full"></span>}
                  </button>
                  <div className="h-px bg-gray-100 my-2" />
                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </button>
                  {profile?.user_type === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentView('admin');
                        setMenuOpen(false);
                      }}
                      className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-secondary-cyan/10 text-secondary-cyan transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-bold">Admin Hub</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                      setCurrentView('feed');
                      setIsGuest(false);
                    }}
                    className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full px-5 py-3 text-left flex items-center gap-3 hover:bg-primary/10 text-primary font-bold transition-colors"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <main className={`${currentView === 'feed' ? 'pt-0 h-[100dvh]' : 'pt-14 min-h-[calc(100vh-56px)] pb-20 sm:pb-0'}`}>
        {currentView === 'admin' ? (
          <AdminPanel />
        ) : currentView === 'feed' ? (
          <>
            {user || sharedVideoId || isGuest ? (
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
                sharedVideoId={sharedVideoId}
                isActive={currentView === 'feed' && !menuOpen && !profileModalOpen && !authModalOpen && !bookingModalOpen && !providerProfileOpen && !searchModalOpen}
              />
            ) : (
              <LandingPage
                onGetStarted={() => setAuthModalOpen(true)}
                onBrowse={() => setIsGuest(true)}
              />
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
      <PrivacyPolicy isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
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
      <Analytics />
      <SpeedInsights />
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
