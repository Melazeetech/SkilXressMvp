import { useState, useEffect } from 'react';
import { Search, X, Play, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

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

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onLocationFilter: (location: string) => void;
  onClose: () => void;
}

export function SearchBar({ onSearch, onClose }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
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
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSuggestions(data as any[] || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // We don't call onSearch immediately to avoid filtering the main feed while typing, 
    // unless that's the desired behavior. The user asked for "suggestions", 
    // implying they want to see a list first.
  };

  const handleSuggestionClick = (video: Video) => {
    // When a suggestion is clicked, we want to "play" it. 
    // The best way in the current architecture is to filter the feed to this specific video 
    // or set the search query to its title so it appears first.
    // The user said "when that video suggestion is clicked it will start playing".
    // We'll set the search query to the exact title to filter the feed.
    onSearch(video.title);
    onClose();
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch(searchQuery);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-0 sm:pt-20">
      <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-white sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header / Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search for skills, videos, or providers..."
                className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </form>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-base font-medium text-gray-600 hover:text-gray-900 px-2"
          >
            Cancel
          </button>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {suggestions.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleSuggestionClick(video)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white transition-colors text-left group"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <Play className="w-6 h-6 text-white fill-white opacity-80" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{video.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{video.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {video.skill_categories?.name}
                      </span>
                      {video.profiles?.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {video.profiles.location}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>No videos found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              Type to search for videos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
