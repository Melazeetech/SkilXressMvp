import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['skill_categories']['Row'];

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onLocationFilter: (location: string) => void;
  onClose: () => void;
}

export function SearchBar({ onSearch, onCategoryFilter, onLocationFilter, onClose }: SearchBarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('skill_categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryFilter(categoryId);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onLocationFilter(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setLocation('');
    onSearch('');
    onCategoryFilter('');
    onLocationFilter('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:bg-black sm:bg-opacity-50">
      <div className="w-full h-full sm:h-auto sm:max-w-lg bg-white sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Mobile Header / Search Input Area */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-base font-medium text-gray-900 hover:text-gray-700 whitespace-nowrap"
          >
            Cancel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Enter city or area"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || location || searchQuery) && (
            <button
              onClick={clearFilters}
              className="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Reset all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
