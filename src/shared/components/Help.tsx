import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ShoppingCart, DollarSign, Bell, Settings as SettingsIcon, ArrowRight } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useDarkMode } from '../hooks/useDarkMode';

const Help: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <HelpCircle className="h-8 w-8 text-brand" />
            <h1 className="text-3xl font-bold">Help & Guide</h1>
          </div>
          <p className="text-primary">
            Learn how to use LunaCart to illuminate the best deals and organize your shopping
          </p>
        </div>

        {/* What is this app */}
        <div className="p-6 rounded-xl shadow-lg mb-6 bg-card">
          <h2 className="text-2xl font-bold mb-4">🌙 What is LunaCart?</h2>
          <p className="text-primary mb-4">
            This app has <strong>three main features</strong> that work together:
          </p>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg bg-brand-light`}>
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">1. Price Checker</h3>
              </div>
              <p className="text-sm text-primary">
                Check if the current price of an item is a good deal by comparing it to your target price. 
                Build a database of target prices for items you buy regularly.
              </p>
            </div>
            <div className={`p-4 rounded-lg bg-secondary`}>
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">2. Shopping Lists</h3>
              </div>
              <p className="text-sm text-primary">
                Create and share shopping lists with family and friends. See target prices while shopping 
                to quickly determine if something is a good deal.
              </p>
            </div>
            <div className={`p-4 rounded-lg bg-secondary`}>
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">3. Active Shopping Trip</h3>
              </div>
              <p className="text-sm text-primary">
                Track your spending in real-time with a budget meter. Add items to your cart, compare actual prices to targets, 
                and stay on budget. Automatically checks off items when you complete the trip.
              </p>
            </div>
          </div>
        </div>

        {/* Price Tracker Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <span>Price Checker</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How to Check Prices:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>At the store, click <strong>"Price Checker"</strong></li>
                <li>Start typing item name - it auto-suggests from database</li>
                <li>Select category (Beef, Chicken, Produce, etc.)</li>
                <li>Select quality if applicable (e.g., Organic, Choice)</li>
                <li>Choose store from dropdown</li>
                <li>Enter price - just type numbers, it auto-formats (type "1234" ? "$12.34")</li>
                <li>Enter quantity and unit type</li>
                <li>Set target price (optional) - this auto-fills for future checks</li>
                <li>See if it's above/below/at target - decide if it's a good deal!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Comparing Prices:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Items are automatically normalized to your preferred units (set in Settings)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Red border = Above target price 🔴</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Cyan border = Below target price 🔵</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Green border = Best price ever! 🟢</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Amber flag 🚩 = Price converted using estimated weight</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Smart Features:</h3>
              <ul className="space-y-2 text-sm text-primary">
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
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
            <span>Shopping Lists</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Creating a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Click <strong>"Shopping Lists"</strong> in navigation</li>
                <li>Click <strong>"Create New List"</strong></li>
                <li>Enter a name (e.g., "Smith Family Groceries")</li>
                <li>You'll get a share code like <code className="bg-purple-100 dark:bg-zinc-700 px-2 py-1 rounded text-purple-900 dark:text-purple-300 font-semibold">SHOP-K7P2M9</code></li>
                <li>Copy and share the code with family/friends</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Joining a List:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Get a share code from someone</li>
                <li>Click <strong>"Join Existing List"</strong></li>
                <li>Enter the code</li>
                <li>You'll see their list and can add/edit items!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Adding Items to List:</h3>
              <ul className="space-y-2 text-sm text-primary">
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
              <ul className="space-y-2 text-sm text-primary">
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
              <ul className="space-y-2 text-sm text-primary">
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

        {/* Active Shopping Trip Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span>Active Shopping Trip (Budget Tracking)</span>
          </h2>

          <div className="space-y-6">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <p className="text-sm text-primary">
                <strong>NEW!</strong> Track your spending in real-time while shopping. Set a budget, add items to your cart, 
                and watch the budget meter update instantly. Compare actual prices to target prices and stay on budget!
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Starting a Shopping Trip:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Open a shopping list</li>
                <li>Click <strong>"Start Shopping Trip"</strong> button</li>
                <li>Set your budget in whole dollars (e.g., type "150" for $150)</li>
                <li>Select the store you're shopping at</li>
                <li>Set sales tax rate (defaults from Settings, can override)</li>
                <li>Click <strong>"Start Shopping"</strong></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Adding Items to Cart:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Click any item from "On the List" section</li>
                <li>Enter the <strong>total price</strong> you see on the shelf (type numbers like 699 → $6.99)</li>
                <li>Enter the <strong>quantity</strong> (how many units)</li>
                <li>See <strong>unit price comparison</strong>:</li>
              </ol>
              <ul className="space-y-2 text-sm text-primary ml-8 mt-2">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600">✓</span>
                  <span><strong className="text-green-600">Green</strong> = At or below target price (Good deal!)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600">✗</span>
                  <span><strong className="text-red-600">Red</strong> = Above target price (Expensive!)</span>
                </li>
              </ul>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4 mt-2" start={5}>
                <li>(Optional) Check "Item has CRV" and enter CRV amount (e.g., $0.05 per bottle)</li>
                <li>(Optional) Check "Update target price" if you want to save this as your new target</li>
                <li>Click <strong>"Add to Cart"</strong></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Budget Meter:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span><strong className="text-green-600">Green (0-89%)</strong> - Under budget, you're good!</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span><strong className="text-yellow-600">Yellow (90-99%)</strong> - Approaching limit, slow down</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span><strong className="text-red-600">Red (100%+)</strong> - Over budget! Remove items or increase budget</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Updates instantly after every add/remove</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Managing Cart Items:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span><strong>Edit:</strong> Click any item in cart to change price/quantity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span><strong>Remove:</strong> Click the X button to take item out of cart (goes back to list)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Items in cart show Target vs Actual price for easy comparison</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Completing the Trip:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Click the <strong>checkmark</strong> button (top right)</li>
                <li>Confirm "Complete this shopping trip?"</li>
                <li>Choose whether to save prices to Price Tracker database</li>
                <li>All cart items automatically check off in the shopping list</li>
                <li>See trip summary (total spent, over/under budget)</li>
                <li>Return to shopping list view</li>
              </ol>
            </div>

            <div className={`p-4 rounded-lg bg-secondary`}>
              <h3 className="font-semibold text-sm mb-3">Pro Tips:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>Cart total includes item prices + sales tax + CRV (just like at checkout!)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>CRV is NOT taxed - it's added after sales tax calculation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>If you go over budget, remove items by clicking the X to get back under</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>Saving prices to database helps build better target prices over time</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Bell className="h-6 w-6 text-purple-600" />
            <span>Notifications</span>
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-primary">
              Get notified when others update shared shopping lists. Notifications are smart and throttled to prevent spam.
            </p>

            <div className={`p-4 rounded-lg bg-secondary`}>
              <h3 className="font-semibold text-sm mb-3">How Throttling Works:</h3>
              <ul className="space-y-2 text-sm text-primary">
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
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
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
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <span>Settings</span>
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Unit Preferences:</h3>
              <p className="text-sm text-primary mb-3">
                Set your preferred units for each category so prices are normalized for easy comparison:
              </p>
              <ul className="space-y-2 text-sm text-primary">
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

            <div>
              <h3 className="font-semibold mb-2">Sales Tax Rate:</h3>
              <p className="text-sm text-primary mb-3">
                Set your local sales tax rate (e.g., 8.5 for 8.5%). This is used by the Active Shopping Trip feature 
                to calculate accurate cart totals including tax. You can override it per-trip if shopping in a different area.
              </p>
            </div>

            <div className={`p-4 rounded-lg bg-brand-light`}>
              <p className="text-sm text-primary">
                <strong>Example:</strong> If you set meat to "pound", a $3.99 steak sold in 8 oz will show as 
                <strong> $7.98/lb</strong> for easy comparison with a 2 lb steak at $12.99 (<strong>$6.50/lb</strong>).
              </p>
            </div>
          </div>
        </div>

        {/* Tips & Tricks */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 bg-card`}>
          <h2 className="text-2xl font-bold mb-4">💡 Tips & Tricks</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Best Workflow (With Shopping Trip):</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Use <strong>Price Checker</strong> to build target prices for items you buy regularly</li>
                <li>Create a <strong>Shopping List</strong> with those target prices</li>
                <li>Share list with family so everyone can add forgotten items</li>
                <li>At the store, tap <strong>"Start Shopping Trip"</strong> and set your budget</li>
                <li>Add items to cart - see instant unit price comparison (green = good deal!)</li>
                <li>Watch the budget meter - remove items if you go over</li>
                <li>Tap checkmark when done - items auto-check off the list</li>
                <li>Choose to save prices to database for better target prices next time</li>
                <li>Clear the list and reuse it next week!</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Alternative Workflow (Without Shopping Trip):</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-primary ml-4">
                <li>Use <strong>Price Checker</strong> to build target prices for items you buy</li>
                <li>Create a <strong>Shopping List</strong> with those target prices</li>
                <li>At the store, compare shelf prices to targets shown on the list</li>
                <li>Check off items as you buy them</li>
                <li>Click "Mark as Complete" when done</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Smart Filtering:</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-start space-x-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  <span>Use "Below Target Only" to find the best deals in Search Database</span>
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
              <p className="text-sm text-primary">
                <strong>Price Database:</strong> Public - everyone can see and add prices (crowdsourced)
              </p>
              <p className="text-sm text-primary mt-2">
                <strong>Shopping Lists:</strong> Private - only people with the share code can see them
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className={`p-6 rounded-xl shadow-lg bg-card`}>
          <h2 className="text-2xl font-bold mb-4">📚 Quick Reference</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg bg-secondary`}>
              <h3 className="font-semibold mb-2 text-sm">Navigation</h3>
              <ul className="space-y-1 text-xs text-primary">
                <li><strong>Home:</strong> Quick access to all features</li>
                <li><strong>Price Checker:</strong> Check if prices are good deals</li>
                <li><strong>Shopping Lists:</strong> Your shared lists</li>
                <li><strong>Search Database:</strong> Browse all tracked prices</li>
                <li><strong>Settings:</strong> Preferences & notifications</li>
                <li><strong>Help:</strong> This guide</li>
              </ul>
            </div>

            <div className={`p-4 rounded-lg bg-secondary`}>
              <h3 className="font-semibold mb-2 text-sm">Color Codes</h3>
              <ul className="space-y-1 text-xs text-primary">
                <li><span className="text-red-600">🔴</span> Red = Above target price</li>
                <li><span className="text-cyan-600">🔵</span> Cyan = Below target price</li>
                <li><span className="text-green-600">🟢</span> Green = Best price ever</li>
                <li><span className="text-purple-600">🟣</span> Purple = Normal</li>
                <li><span className="text-amber-500">🚩</span> Flag = Estimated weight used</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={`p-6 rounded-xl shadow-lg text-center ${darkMode ? 'bg-gradient-to-r from-purple-900 to-pink-900' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
          <h2 className="text-2xl font-bold mb-4">Ready to Illuminate the Best Deals?</h2>
          <p className="text-primary mb-6">
            Start using LunaCart to never overpay again!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/add-item"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Check Your First Price
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
