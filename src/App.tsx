import { useState } from 'react';
import { Home, User, LogOut, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { VideoFeed } from './components/VideoFeed';
import { BookingModal } from './components/BookingModal';
import { SearchBar } from './components/SearchBar';
import { ProviderDashboard } from './components/ProviderDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { Database } from './lib/database.types';

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
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'dashboard'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBookClick = (video: Video) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedVideo(video);
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold text-blue-600">
          SkilXpress
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('feed')}
              className="text-2xl font-bold text-blue-600"
            >
              SkilXpress
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('feed')}
                  className={`p-2 rounded-lg transition-colors ${
                    currentView === 'feed'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`p-2 rounded-lg transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-14">
        {currentView === 'feed' ? (
          <>
            {user && (
              <SearchBar
                onSearch={setSearchQuery}
                onCategoryFilter={setCategoryFilter}
                onLocationFilter={setLocationFilter}
              />
            )}
            {user ? (
              <VideoFeed
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                locationFilter={locationFilter}
                onBookClick={handleBookClick}
              />
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-56px)] px-4">
                <div className="text-center max-w-md">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to SkilXpress
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Discover and book skilled service providers through engaging videos
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </>
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
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        video={selectedVideo}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
