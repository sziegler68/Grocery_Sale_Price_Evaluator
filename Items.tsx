import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ItemCard from './ItemCard';
import SearchFilter from './SearchFilter';
import { useDarkMode } from './useDarkMode';
import {
  fetchAllItems,
  getBestPriceByItemName,
  isUsingMockData,
  type DataSource,
  type GroceryItem,
} from './groceryData';

const Items: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GroceryItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [showBelowTarget, setShowBelowTarget] = useState(false);
  const [showBestPrices, setShowBestPrices] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      const result = await fetchAllItems();

      if (!isMounted) return;

      setItems(result.items);
      setFilteredItems(result.items);
      setDataSource(result.source);
      setErrorMessage(result.error ?? null);
      setIsLoading(false);
    };

    void loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

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
  }, [items, searchTerm, selectedCategory, selectedStore, showBelowTarget, showBestPrices]);

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
          {errorMessage && (
            <span className="ml-2 text-xs font-medium">(Error: {errorMessage})</span>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Grocery Items</h1>
          <p className="text-gray-600 dark:text-gray-300">
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
          showBestPrices={showBestPrices}
          onBestPricesChange={setShowBestPrices}
          categories={categories}
          stores={stores}
          darkMode={darkMode}
        />

        {isLoading ? (
          <div className={`rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'} p-6 text-center text-sm text-gray-500 dark:text-gray-400`}>
            Loading items?
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-lg">
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