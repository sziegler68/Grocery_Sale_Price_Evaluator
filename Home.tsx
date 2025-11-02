import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingDown, Target, ShoppingCart, BarChart3 } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ItemCard from './ItemCard';
import { fetchAllItems, isUsingMockData, type DataSource, type GroceryItem } from './groceryData';

const Home: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      const result = await fetchAllItems();

      if (!isMounted) return;

      setItems(result.items);
      setDataSource(result.source);
      setErrorMessage(result.error ?? null);
      setIsLoading(false);
    };

    void loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentItems = useMemo(() => items.slice(0, 6), [items]);

  const belowTargetItems = useMemo(
    () =>
      items.filter(
        (item) => typeof item.targetPrice === 'number' && item.targetPrice !== undefined && item.unitPrice <= item.targetPrice
      ),
    [items]
  );

  const dataSourceBanner = isUsingMockData(dataSource)
    ? 'Supabase not configured ? showing demo data. Add your Supabase keys to enable live sync.'
    : 'Synced with Supabase in real time.';

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

        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-cyan-500 to-pink-400 bg-clip-text text-transparent">
            Track Grocery Prices
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Never overpay again. Track prices across stores, set targets, and find the best deals on your favorite items.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/add-item"
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add First Item</span>
            </Link>
            <Link
              to="/items"
              className="inline-flex items-center space-x-2 border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>View All Items</span>
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{isLoading ? '?' : recentItems.length}</h3>
                <p className="text-gray-600 dark:text-gray-300">Items Tracked</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <Target className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{isLoading ? '?' : belowTargetItems.length}</h3>
                <p className="text-gray-600 dark:text-gray-300">Below Target</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">$24.50</h3>
                <p className="text-gray-600 dark:text-gray-300">Total Saved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Below Target Items */}
        {!isLoading && belowTargetItems.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Items Below Target This Week</h2>
              <Link
                to="/items?filter=below-target"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {belowTargetItems.slice(0, 3).map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Items */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Items</h2>
            <Link
              to="/items"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className={`rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'} p-6 text-center text-sm text-gray-500 dark:text-gray-400`}>
              Loading latest items?
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No grocery items yet. Add your first item to start tracking prices!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.slice(0, 6).map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              to="/add-item"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Plus className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Add New Item</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Track a new grocery item and its price
              </p>
            </Link>

            <Link
              to="/analytics"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-8 w-8 text-cyan-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">View Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                See price trends and savings insights
              </p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;