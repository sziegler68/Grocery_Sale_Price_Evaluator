import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStore: string;
  onStoreChange: (store: string) => void;
  showBelowTarget: boolean;
  onBelowTargetChange: (show: boolean) => void;
  showAboveTarget: boolean;
  onAboveTargetChange: (show: boolean) => void;
  showBestPrices: boolean;
  onBestPricesChange: (show: boolean) => void;
  categories: string[];
  stores: string[];
  darkMode: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStore,
  onStoreChange,
  showBelowTarget,
  onBelowTargetChange,
  showAboveTarget,
  onAboveTargetChange,
  showBestPrices,
  onBestPricesChange,
  categories,
  stores,
  darkMode
}) => {
  return (
    <div className={`p-4 rounded-xl shadow-lg mb-6 ${
      darkMode ? 'bg-zinc-800' : 'bg-white'
    }`}>
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-brand" />
        <h3 className="font-semibold">Search & Filter</h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, stores, or notes..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedStore}
            onChange={(e) => onStoreChange(e.target.value)}
            className={`px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All Stores</option>
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showBelowTarget}
              onChange={(e) => onBelowTargetChange(e.target.checked)}
              className="rounded border-gray-300 text-brand focus:ring-purple-500"
            />
            <span className="text-sm">Below Target Only</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAboveTarget}
              onChange={(e) => onAboveTargetChange(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-red-600">Above Target Only ??</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showBestPrices}
              onChange={(e) => onBestPricesChange(e.target.checked)}
              className="rounded border-gray-300 text-brand focus:ring-purple-500"
            />
            <span className="text-sm">Best Prices Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;