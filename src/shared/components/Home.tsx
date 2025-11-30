import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ShoppingCart, Search, Settings, HelpCircle } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useDarkMode } from '../hooks/useDarkMode';
import { isSupabaseConfigured } from '@shared/api/supabaseClient';
import { getUserName } from '../utils/settings';

const Home: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [isOnline, setIsOnline] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      setIsOnline(isSupabaseConfigured);
    };

    checkConnection();

    // Check if user name is set
    const userName = getUserName();
    if (!userName) {
      // Show prompt after a short delay
      setTimeout(() => {
        setShowNamePrompt(true);
      }, 2000);
    }
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <section className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-cyan-500 to-pink-400 bg-clip-text text-transparent">
              LunaCart
            </h1>
            <p className="text-lg text-primary mb-4 max-w-2xl mx-auto">
              Illuminate the Best Deals
            </p>

            {/* Connection Status */}
            <div className="flex items-center justify-center space-x-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-secondary">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </section>

          {/* User Name Prompt for New Users */}
          {showNamePrompt && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    👋 Welcome! Set Your Name
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Please set your name in Settings. It will be used for database entries (price checker, shopping trips) to help with sorting and tracking.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to="/settings"
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                      onClick={() => setShowNamePrompt(false)}
                    >
                      Go to Settings
                    </Link>
                    <button
                      onClick={() => setShowNamePrompt(false)}
                      className="px-4 py-2 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      Remind Me Later
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowNamePrompt(false)}
                  className="ml-4 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Quick Access Buttons */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Price Checker */}
            <Link
              to="/add-item"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <Calculator className="h-10 w-10 text-brand mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Price Checker</h3>
              <p className="text-sm text-secondary">
                Check if an item is a good deal
              </p>
            </Link>

            {/* Shopping Lists */}
            <Link
              to="/shopping-lists"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <ShoppingCart className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Shopping Lists</h3>
              <p className="text-sm text-secondary">
                Create and share grocery lists
              </p>
            </Link>

            {/* Search Database */}
            <Link
              to="/items"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <Search className="h-10 w-10 text-cyan-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Search Database</h3>
              <p className="text-sm text-secondary">
                Browse all tracked prices
              </p>
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <Settings className="h-10 w-10 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Settings</h3>
              <p className="text-sm text-secondary">
                Preferences and configuration
              </p>
            </Link>

            {/* Help */}
            <Link
              to="/help"
              className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
              <HelpCircle className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Help</h3>
              <p className="text-sm text-secondary">
                How to use this app
              </p>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;