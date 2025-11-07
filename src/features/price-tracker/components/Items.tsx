import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import ItemCard from './ItemCard';
import SearchFilter from './SearchFilter';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import { getBestPriceByItemName, isUsingMockData, type GroceryItem } from '../api/groceryData';
import { usePriceTrackerStore } from '../store/usePriceTrackerStore';

const Items: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  // Use store for data
  const { items, isLoading, error, dataSource, loadItems } = usePriceTrackerStore();
  
  // Local UI state for filtering
  const [filteredItems, setFilteredItems] = useState(items);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [showBelowTarget, setShowBelowTarget] = useState(false);
  const [showAboveTarget, setShowAboveTarget] = useState(false);
  const [showBestPrices, setShowBestPrices] = useState(false);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Store filter
    if (selectedStore) {
      filtered = filtered.filter(item => item.storeName === selectedStore);
    }

    // Below target filter
    if (showBelowTarget) {
      filtered = filtered.filter(item => 
        item.targetPrice && item.unitPrice <= item.targetPrice
      );
    }

    // Above target filter
    if (showAboveTarget) {
      filtered = filtered.filter(item => 
        item.targetPrice && item.unitPrice > item.targetPrice
      );
    }

    // Best prices filter
    if (showBestPrices) {
      const itemGroups = filtered.reduce((acc, item) => {
        if (!acc[item.itemName]) {
          acc[item.itemName] = [];
        }
        acc[item.itemName].push(item);
        return acc;
      }, {} as Record<string, GroceryItem[]>);

      filtered = Object.values(itemGroups).map(group => 
        group.reduce((best, current) => 
          current.unitPrice < best.unitPrice ? current : best
        )
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory, selectedStore, showBelowTarget, showAboveTarget, showBestPrices]);

  const categories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);
  const stores = useMemo(() => [...new Set(items.map(item => item.storeName))], [items]);

  const dataSourceBanner = isUsingMockData(dataSource)
    ? 'Supabase not configured ? showing demo data. Add your Supabase keys to enable live sync.'
    : 'Synced with Supabase in real time.';

  const getBestPrice = (itemName: string): number => getBestPriceByItemName(items, itemName);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            isUsingMockData(dataSource)
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {dataSourceBanner}
          {error && (
            <span className="ml-2 text-xs font-medium">(Error: {error})</span>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Grocery Items</h1>
          <p className="text-primary">
            Track and compare prices across different stores
          </p>
        </div>

        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStore={selectedStore}
          onStoreChange={setSelectedStore}
          showBelowTarget={showBelowTarget}
          onBelowTargetChange={setShowBelowTarget}
          showAboveTarget={showAboveTarget}
          onAboveTargetChange={setShowAboveTarget}
          showBestPrices={showBestPrices}
          onBestPricesChange={setShowBestPrices}
          categories={categories}
          stores={stores}
          darkMode={darkMode}
          allItems={items}
        />

        {isLoading ? (
          <div className={`rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'} p-6 text-center text-sm text-secondary`}>
            Loading items?
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-secondary text-lg">
            No items found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                bestPrice={getBestPrice(item.itemName)}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Items;