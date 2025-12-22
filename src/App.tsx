import { useState, useEffect } from 'react';
import { Home, User, LogOut, Menu, X, MessageSquare, Bell, Search, Shield, ArrowLeft } from 'lucide-react';
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
import { notificationService } from './lib/notificationService';
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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
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
  useBackHandler(currentView === 'dashboard' || currentView === 'messages' || currentView === 'notifications' || currentView === 'admin', () => {
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
    let channel: any;

    if (user) {
      checkUnreadNotifications();

      // Global notification listener for browser push notifications
      channel = supabase
        .channel(`global-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new;
            // Show browser notification
            notificationService.showNotification(newNotif.title, {
              body: newNotif.message,
              data: newNotif.data,
              tag: newNotif.id, // Prevent duplicate notifications
            });
            // Update unread count
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

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
      setAuthMode('signin');
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
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-secondary-black/80 backdrop-blur-lg border-b border-white/10 shadow-xl">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleHomeClick}
                className="p-2.5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-3 group px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="w-10 h-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white tracking-tight leading-none">
                    SkilXpress
                  </span>
                  <span className="text-[10px] text-secondary-cyan font-bold uppercase tracking-[0.2em]">
                    Pro Connect
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <nav className="hidden md:flex items-center gap-1 mr-4 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                      onClick={handleHomeClick}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                    <button
                      onClick={() => setCurrentView('messages')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'messages' ? 'bg-white text-secondary-black shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => setCurrentView('notifications')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${currentView === 'notifications' ? 'bg-secondary-orange text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    >
                      <Bell className="w-4 h-4" />
                      App Alerts
                      {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-secondary-black"></span>}
                    </button>
                  </nav>

                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="p-2.5 rounded-xl transition-all text-white bg-white/5 hover:bg-white/20 border border-white/10"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`p-2.5 rounded-xl transition-all ${menuOpen ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  {menuOpen && (
                    <div className="absolute top-14 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[220px] z-[60] animate-in fade-in zoom-in duration-200">
                      <div className="px-5 py-3 border-b border-gray-100 mb-2">
                        <p className="font-bold text-gray-900">{profile?.full_name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                          {profile?.user_type}
                        </p>
                      </div>
                      <div className="px-2 space-y-1">
                        <button
                          onClick={() => {
                            setProfileModalOpen(true);
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors rounded-xl font-medium"
                        >
                          <User className="w-4 h-4" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            setPrivacyOpen(true);
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors rounded-xl font-medium"
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
                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-secondary-cyan/10 text-secondary-cyan transition-colors rounded-xl font-bold"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Hub
                          </button>
                        )}
                        <div className="h-px bg-gray-100 my-2" />
                        <button
                          onClick={() => {
                            signOut();
                            setMenuOpen(false);
                            setCurrentView('feed');
                            setIsGuest(false);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors rounded-xl font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="bg-primary text-secondary-black px-6 py-2 rounded-lg font-bold hover:bg-secondary-yellow transition-colors shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {currentView === 'feed' && (user || isGuest || sharedVideoId) && (
        <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {(isGuest || sharedVideoId) && (
              <button
                onClick={() => {
                  setIsGuest(false);
                  setSharedVideoId(null);
                  setCurrentView('feed'); // This will trigger LandingPage if user is null
                }}
                className="p-2.5 bg-black/20 backdrop-blur-md rounded-2xl text-white hover:bg-black/40 transition-all shadow-lg active:scale-95 border border-white/10"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-3 group px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all shadow-lg pointer-events-auto"
            >
              <div className="w-8 h-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-white leading-none tracking-tight">SkilXpress</span>
                <span className="text-[8px] text-secondary-cyan font-bold uppercase tracking-wider">Video Hub</span>
              </div>
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
            <div className="absolute top-20 right-0 bg-secondary-black/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 py-4 min-w-[260px] pointer-events-auto animate-in fade-in zoom-in slide-in-from-top-4 duration-300 overflow-hidden ring-1 ring-white/20">
              <div className="px-6 py-4 border-b border-white/5 mb-2 bg-gradient-to-br from-white/10 to-transparent">
                <p className="font-black text-white text-lg leading-none mb-1.5">{profile?.full_name || 'Guest User'}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  <p className="text-[10px] text-secondary-cyan uppercase tracking-[0.2em] font-black">
                    {profile?.user_type || 'Guest'}
                  </p>
                </div>
              </div>
              <div className="px-2 space-y-1">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setCurrentView('dashboard');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-white/10 text-white/90 hover:text-white transition-all rounded-2xl group"
                    >
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-secondary-cyan/20 transition-colors">
                        <User className="w-4 h-4 text-secondary-cyan" />
                      </div>
                      <span className="text-sm font-bold">Account Hub</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('messages');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-white/10 text-white/90 hover:text-white transition-all rounded-2xl group"
                    >
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-secondary-cyan/20 transition-colors">
                        <MessageSquare className="w-4 h-4 text-secondary-cyan" />
                      </div>
                      <span className="text-sm font-bold">Conversations</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('notifications');
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-white/10 text-white/90 hover:text-white transition-all rounded-2xl group relative"
                    >
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-secondary-cyan/20 transition-colors">
                        <Bell className="w-4 h-4 text-secondary-cyan" />
                      </div>
                      <span className="text-sm font-bold">App Alerts</span>
                      {unreadCount > 0 && <span className="absolute top-4 left-10 w-2 h-2 bg-red-500 rounded-full border-2 border-secondary-black"></span>}
                    </button>
                    <div className="h-px bg-white/5 mx-4 my-2" />
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-white/10 text-white/90 hover:text-white transition-all rounded-2xl group"
                    >
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-secondary-cyan/20 transition-colors">
                        <Shield className="w-4 h-4 text-secondary-cyan" />
                      </div>
                      <span className="text-sm font-bold">Privacy Settings</span>
                    </button>
                    {profile?.user_type === 'admin' && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-secondary-cyan/10 text-secondary-cyan transition-colors rounded-2xl"
                      >
                        <div className="p-2 rounded-lg bg-secondary-cyan/10">
                          <Shield className="w-4 h-4 text-secondary-cyan" />
                        </div>
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
                      className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-red-500/10 text-red-500 transition-colors rounded-2xl"
                    >
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-sm font-bold">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center gap-4 hover:bg-secondary-cyan/10 text-secondary-cyan font-bold transition-all rounded-2xl"
                  >
                    <div className="p-2 rounded-lg bg-secondary-cyan/10">
                      <User className="w-5 h-5" />
                    </div>
                    Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <main className={`${currentView === 'feed' && (user || isGuest || sharedVideoId) ? 'pt-0 h-[100dvh] overflow-hidden' : 'pt-[72px] min-h-[calc(100vh-72px)] pb-20 sm:pb-0'}`}>
        {currentView === 'admin' ? (
          <AdminPanel onBack={handleHomeClick} />
        ) : currentView === 'feed' ? (
          user || sharedVideoId || isGuest ? (
            <VideoFeed
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              locationFilter={locationFilter}
              onBookClick={handleBookClick}
              onProviderClick={(providerId) => {
                setSelectedProviderId(providerId);
                setProviderProfileOpen(true);
              }}
              onAuthRequired={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              sharedVideoId={sharedVideoId}
              isActive={currentView === 'feed' && !menuOpen && !profileModalOpen && !authModalOpen && !bookingModalOpen && !providerProfileOpen && !searchModalOpen}
            />
          ) : (
            <LandingPage
              onGetStarted={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              onBrowse={(catId) => {
                if (catId) setCategoryFilter(catId);
                setIsGuest(true);
              }}
              onShowPrivacy={() => setPrivacyOpen(true)}
            />
          )
        ) : currentView === 'messages' ? (
          <MessagesView activeBookingId={activeBookingId} />
        ) : currentView === 'notifications' ? (
          <NotificationsView />
        ) : (
          profile?.user_type === 'provider' ? <ProviderDashboard onBack={handleHomeClick} /> : <ClientDashboard onBack={handleHomeClick} />
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
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
          onAuthRequired={() => {
            setAuthMode('signin');
            setAuthModalOpen(true);
          }}
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
