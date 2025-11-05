import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Edit, Target, TrendingDown, Calendar, Store, Tag } from 'lucide-react';
import { format } from 'date-fns';
import Header from './Header';
import Footer from './Footer';
import PriceChart from './PriceChart';
import { useDarkMode } from './useDarkMode';
import { formatPrice } from './priceUtils';
import {
  fetchItemWithHistory,
  isUsingMockData,
  updateTargetPrice,
  type DataSource,
  type GroceryItem,
} from './groceryData';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [item, setItem] = useState<GroceryItem | null>(null);
  const [priceHistory, setPriceHistory] = useState<GroceryItem[]>([]);
  const [targetPrice, setTargetPrice] = useState<number | undefined>();
  const [targetPriceDisplay, setTargetPriceDisplay] = useState<string>('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dataSourceBanner = isUsingMockData(dataSource)
    ? 'Supabase not configured ? showing demo data. Add your Supabase keys to enable live sync.'
    : 'Synced with Supabase in real time.';

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadItem = async () => {
      setIsLoading(true);
      const result = await fetchItemWithHistory(id);

      if (!isMounted) return;

      setItem(result.item);
      setPriceHistory(result.priceHistory);
      setTargetPrice(result.item?.targetPrice);
      setTargetPriceDisplay(result.item?.targetPrice ? result.item.targetPrice.toFixed(2) : '');
      setDataSource(result.source);
      setErrorMessage(result.error ?? null);
      setIsLoading(false);
    };

    void loadItem();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className={`mx-auto max-w-md rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'} p-6 text-center text-sm text-gray-500 dark:text-gray-400`}>
            Loading item details?
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Item not found.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const historyEntries = priceHistory.length > 0 ? priceHistory : [item];
  const bestPrice = Math.min(...historyEntries.map(entry => entry.unitPrice));
  const lastEntry = historyEntries[0];
  const lastPrice = lastEntry.unitPrice;
  const isBelowTarget = typeof targetPrice === 'number' && lastPrice <= targetPrice;
  const lastPurchaseDate = lastEntry.datePurchased;

  // Handle target price input with auto-formatting (fills from right to left)
  const handleTargetPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setTargetPriceDisplay('');
      setTargetPrice(undefined);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setTargetPriceDisplay(formatted);
    setTargetPrice(parseFloat(formatted));
  };

  const handleTargetPriceUpdate = async () => {
    if (!item) return;

    try {
      const updated = await updateTargetPrice(item.id, targetPrice);
      setItem(updated);
      setTargetPrice(updated.targetPrice);
      setTargetPriceDisplay(updated.targetPrice ? updated.targetPrice.toFixed(2) : '');
      setPriceHistory((prev) => {
        if (prev.length === 0) {
          return [updated];
        }
        return prev.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry));
      });
      toast.success('Target price saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update target price.';
      toast.error(message);
    } finally {
      setIsEditingTarget(false);
    }
  };

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

        <div className="mb-6">
          <Link
            to="/items"
            className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Items</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{item.itemName}</h1>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                  {item.category}
                </span>
                {item.meatQuality && (
                  <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm">
                    {item.meatQuality}
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/edit-item/${item.id}`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Item</span>
            </Link>
          </div>
        </div>

        {/* Summary Panel */}
        <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">Price Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${formatPrice(lastPrice)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Last Price</div>
              <div className="text-xs text-gray-400 mt-1">
                {format(lastPurchaseDate, 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-bold ${isBelowTarget ? 'text-cyan-600' : 'text-gray-600'}`}>
                {targetPrice ? `$${formatPrice(targetPrice)}` : 'Not Set'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Target Price</div>
              <button
                onClick={() => setIsEditingTarget(true)}
                className="text-xs text-purple-600 hover:text-purple-700 mt-1 flex items-center space-x-1 mx-auto"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${formatPrice(bestPrice)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Best Price</div>
              <div className="text-xs text-gray-400 mt-1">
                All-time low
              </div>
            </div>
          </div>

          {isBelowTarget && (
            <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900 rounded-lg border border-cyan-200 dark:border-cyan-700">
              <div className="flex items-center space-x-2 text-cyan-800 dark:text-cyan-200">
                <Target className="h-5 w-5" />
                <span className="font-medium">Great deal! This item is below your target price.</span>
              </div>
            </div>
          )}

          {lastPrice === bestPrice && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <TrendingDown className="h-5 w-5" />
                <span className="font-medium">New best price! This is the lowest you've seen.</span>
              </div>
            </div>
          )}
        </div>

        {/* Target Price Edit Modal */}
        {isEditingTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full p-6 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
              <h3 className="text-lg font-bold mb-4">Set Target Price</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Target Price (per {item.unitType})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetPriceDisplay}
                    onChange={handleTargetPriceInput}
                    className={`w-full pl-8 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                    }`}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleTargetPriceUpdate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="flex-1 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Chart */}
        <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">Price Trend</h2>
          <PriceChart
            data={historyEntries.map(entry => ({
              date: entry.datePurchased,
              price: entry.price,
              unitPrice: entry.unitPrice,
              storeName: entry.storeName
            }))}
            darkMode={darkMode}
          />
        </div>

        {/* Price History */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-4">Price History</h2>
          
          <div className="space-y-4">
            {historyEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  darkMode ? 'border-zinc-700 bg-zinc-700' : 'border-gray-200 bg-gray-50'
                } ${entry.unitPrice === bestPrice ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {format(entry.datePurchased, 'MMM dd, yyyy')}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                        Latest
                      </span>
                    )}
                    {entry.unitPrice === bestPrice && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                        Best Price
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      ${formatPrice(entry.unitPrice)}
                    </div>
                    <div className="text-sm text-gray-500">
                      per {entry.unitType}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Store className="h-4 w-4" />
                      <span>{entry.storeName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="h-4 w-4" />
                      <span>${entry.price.toFixed(2)} total</span>
                    </div>
                  </div>
                  <div>
                    {entry.quantity} {entry.unitType}
                  </div>
                </div>
                
                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <strong>Notes:</strong> {entry.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ItemDetail;