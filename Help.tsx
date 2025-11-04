import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ShoppingCart, DollarSign, Bell, Settings as SettingsIcon, ArrowRight } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useDarkMode } from './useDarkMode';

const Help: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Help & Guide</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Learn how to use Grocery Price Tracker to save money and organize your shopping
          </p>
        </div>

        {/* What is this app */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4">?? What is this app?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This app has <strong>two main features</strong> that work together:
          </p>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Price Tracker</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track grocery prices over time to identify good deals. Everyone who uses the app contributes 
                to a shared database of prices, so the more people use it, the better it gets!
              </p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-green-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Shopping Lists</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Create and share shopping lists with family and friends. See target prices while shopping 
                to quickly determine if something is a good deal.
              </p>
            </div>
          </div>
        </div>

        {/* Price Tracker Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <span>Price Tracker</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How to Add Prices:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                <li>After shopping, click <strong>"Add Item"</strong></li>
                <li>Enter item name (e.g., "Bananas")</li>
                <li>Select category (Beef, Chicken, Produce, etc.)</li>
                <li>Select quality if applicable (e.g., Organic, Choice)</li>
                <li>Choose store from dropdown</li>
                <li>Enter price - just type numbers, it auto-formats (type "1234" ? "$12.34")</li>
                <li>Enter quantity and unit type</li>
                <li>Set target price (optional) - this auto-fills for future entries</li>
                <li>Click "Add Item"</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Comparing Prices:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Items are automatically normalized to your preferred units (set in Settings)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Red border = Above target price ??</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Cyan border = Below target price ??</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Green border = Best price ever! ??</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Amber flag ?? = Price converted using estimated weight</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Smart Features:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Target Price Memory:</strong> Set it once for "Milk", it auto-fills next time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Unit Conversion:</strong> Compare 1 quart vs 1 gallon easily</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Smart Estimates:</strong> Bananas priced "each" convert to per-pound automatically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shopping Lists Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
            <span>Shopping Lists</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Creating a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                <li>Click <strong>"Shopping Lists"</strong> in navigation</li>
                <li>Click <strong>"Create New List"</strong></li>
                <li>Enter a name (e.g., "Smith Family Groceries")</li>
                <li>You'll get a share code like <code className="bg-gray-200 dark:bg-zinc-700 px-2 py-1 rounded">SHOP-K7P2M9</code></li>
                <li>Copy and share the code with family/friends</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Joining a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                <li>Get a share code from someone</li>
                <li>Click <strong>"Join Existing List"</strong></li>
                <li>Enter the code</li>
                <li>You'll see their list and can add/edit items!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Adding Items to List:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Click <strong>"Add Item to List"</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Start typing and it suggests items from the price database</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Target prices auto-fill from your price history</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Or type manually if item isn't in database yet</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">While Shopping:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Items are grouped by category (Meats, Dairy, Produce, etc.)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Check off items as you buy them - they move to bottom</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Target price shown for quick reference</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Compare shelf price to target - buy if it's lower!</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">After Shopping:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span><strong>"Mark as Complete"</strong> - Notify others you're done</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span><strong>"Missing Items - Notify"</strong> - Alert others items weren't available</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span><strong>"Clear All Items"</strong> - Remove items, keep list & share code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span><strong>"Delete List"</strong> - Permanently delete (careful!)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Bell className="h-6 w-6 text-purple-600" />
            <span>Notifications</span>
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get notified when others update shared shopping lists. Notifications are smart and throttled to prevent spam.
            </p>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              <h3 className="font-semibold text-sm mb-3">How Throttling Works:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Someone adds 10 items in 30 minutes ? You get <strong>1 notification</strong> ("Added 10 items")</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Someone checks off 15 items at the store ? You get <strong>1 notification</strong> ("Checked off 15 items")</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>"Mark Complete" button ? <strong>Always sends</strong> notification (not throttled)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">To Enable Notifications:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                <li>Go to <Link to="/settings" className="text-purple-600 hover:underline">Settings</Link></li>
                <li>Scroll to "Notification Settings"</li>
                <li>Toggle "Enable Notifications" ON</li>
                <li>(Optional) Enable "Push Notifications" for alerts when app is closed</li>
                <li>Choose which notification types you want</li>
                <li>Click "Save All Settings"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <span>Settings</span>
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Unit Preferences:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Set your preferred units for each category so prices are normalized for easy comparison:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Meat:</strong> Choose pound or ounce</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Fruit & Veggies:</strong> Separate preferences for each</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span><strong>Milk, Dairy, Drinks, Soda:</strong> Choose gallon, quart, pint, liter, or ml</span>
                </li>
              </ul>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'}`}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Example:</strong> If you set meat to "pound", a $3.99 steak sold in 8 oz will show as 
                <strong> $7.98/lb</strong> for easy comparison with a 2 lb steak at $12.99 (<strong>$6.50/lb</strong>).
              </p>
            </div>
          </div>
        </div>

        {/* Tips & Tricks */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4">?? Tips & Tricks</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Best Workflow:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                <li>Check <strong>Price Tracker</strong> to see average prices for items</li>
                <li>Create a <strong>Shopping List</strong> with target prices from the tracker</li>
                <li>Share list with family so everyone can add forgotten items</li>
                <li>At the store, compare shelf prices to your targets</li>
                <li>Check off items as you buy them</li>
                <li>Click "Mark as Complete" when done</li>
                <li>(Optional) Add actual prices to Price Tracker for future reference</li>
                <li>Clear the list and reuse it next week!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Smart Filtering:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Use "Below Target Only" to find the best deals in your price tracker</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Use "Above Target Only" to review overpriced purchases</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Use "Best Prices Only" to see the lowest price for each item</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Security Note:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Price Database:</strong> Public - everyone can see and add prices (crowdsourced)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                <strong>Shopping Lists:</strong> Private - only people with the share code can see them
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4">?? Quick Reference</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2 text-sm">Navigation</h3>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <li><strong>Home:</strong> Dashboard overview</li>
                <li><strong>Shopping Lists:</strong> Your shared lists</li>
                <li><strong>Price Tracker:</strong> Historical prices</li>
                <li><strong>Add Item:</strong> Log a price</li>
                <li><strong>Analytics:</strong> Coming soon</li>
                <li><strong>Settings:</strong> Preferences & notifications</li>
              </ul>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2 text-sm">Color Codes</h3>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <li><span className="text-red-600">?</span> Red = Above target price</li>
                <li><span className="text-cyan-600">?</span> Cyan = Below target price</li>
                <li><span className="text-green-600">?</span> Green = Best price ever</li>
                <li><span className="text-purple-600">?</span> Purple = Normal</li>
                <li><span className="text-amber-500">??</span> Flag = Estimated weight used</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={`p-6 rounded-xl shadow-lg text-center ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
          <h2 className="text-2xl font-bold mb-4">Ready to Save Money?</h2>
          <p className="text-gray-700 dark:text-gray-200 mb-6">
            Start tracking prices and creating shopping lists to never overpay again!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/add-item"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Your First Price
            </Link>
            <Link
              to="/shopping-lists"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Shopping List
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
