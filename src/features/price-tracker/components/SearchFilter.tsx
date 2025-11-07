import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  allItems: Array<{ itemName: string; targetPrice?: number }>;
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
  darkMode,
  allItems
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ itemName: string; targetPrice?: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions (trigger on 1+ letters, show max 3)
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 1) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allItems.filter(item =>
      item.itemName.toLowerCase().includes(term)
    );

    // Get unique item names
    const uniqueItems = new Map<string, typeof allItems[0]>();
    filtered.forEach(item => {
      const existing = uniqueItems.get(item.itemName);
      if (!existing || (item.targetPrice && !existing.targetPrice)) {
        uniqueItems.set(item.itemName, item);
      }
    });

    setSuggestions(Array.from(uniqueItems.values()).slice(0, 3));
  }, [searchTerm, allItems]);

  // Update dropdown position
  useEffect(() => {
    if (showSuggestions && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, suggestions]);

  const handleSelectSuggestion = (item: typeof allItems[0]) => {
    onSearchChange(item.itemName);
    setSuggestions([]);
    setShowSuggestions(false);
  };
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
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search items, stores, or notes..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
            }`}
          />
        </div>

        {/* Autocomplete Dropdown - Rendered via Portal */}
        {showSuggestions && suggestions.length > 0 && createPortal(
          <div
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
            className="rounded-lg shadow-2xl border-2 bg-white dark:bg-zinc-800 border-purple-500 max-h-60 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {suggestions.map((item, idx) => (
              <button
                key={`${item.itemName}-${idx}`}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-zinc-600 border-b border-gray-200 dark:border-zinc-600 last:border-0 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">{item.itemName}</div>
                {item.targetPrice && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Target: ${item.targetPrice.toFixed(2)}
                  </div>
                )}
              </button>
            ))}
          </div>,
          document.body
        )}

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