import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['skill_categories']['Row'];

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onLocationFilter: (location: string) => void;
}

export function SearchBar({ onSearch, onCategoryFilter, onLocationFilter }: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for services..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border border-gray-300 ${
              showFilters ? 'bg-blue-50 border-blue-500' : ''
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Enter city or area"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(selectedCategory || location || searchQuery) && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 py-2"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
