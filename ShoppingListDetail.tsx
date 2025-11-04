import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Trash2, RotateCcw, Check, ShoppingCart, CheckCircle, AlertCircle, Receipt } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ShoppingListItem from './ShoppingListItem';
import AddItemToListModal from './AddItemToListModal';
import SetNameModal from './SetNameModal';
import StartShoppingTripModal from './StartShoppingTripModal';
import ShoppingTripView from './ShoppingTripView';
import { useDarkMode } from './useDarkMode';
import { getUserNameForList, setUserNameForList, removeUserNameForList } from './listUserNames';
import { notifyShoppingComplete, notifyMissingItems } from './notificationService';
import { 
  getShoppingListByCode, 
  getItemsForList, 
  deleteShoppingList, 
  clearAllItems 
} from './shoppingListApi';
import { getActiveTrip, createShoppingTrip } from './shoppingTripApi';
import { createGroceryItem } from './groceryData';
import { removeShareCode } from './shoppingListStorage';
import { SHOPPING_LIST_CATEGORIES } from './shoppingListTypes';
import type { ShoppingList, ShoppingListItem as ShoppingListItemType } from './shoppingListTypes';
import type { ShoppingTrip, CartItem } from './shoppingTripTypes';
import { toast } from 'react-toastify';

const ShoppingListDetail: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<ShoppingTrip | null>(null);
  const [viewingTrip, setViewingTrip] = useState(false);

  const loadListData = async (showLoading = true) => {
    if (!shareCode) return;

    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const loadedList = await getShoppingListByCode(shareCode);
      
      if (!loadedList) {
        toast.error('Shopping list not found');
        navigate('/shopping-lists');
        return;
      }

      const loadedItems = await getItemsForList(loadedList.id);
      
      // Try to load active trip, but don't fail if tables don't exist yet
      let trip: ShoppingTrip | null = null;
      try {
        trip = await getActiveTrip(loadedList.id);
      } catch (tripError) {
        console.warn('Could not load active trip (tables may not exist yet):', tripError);
        // Silently ignore - trip feature not available yet
      }

      setList(loadedList);
      setItems(loadedItems);
      setActiveTrip(trip);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
      toast.error('Failed to load shopping list');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleItemUpdate = () => {
    // Refresh data without showing loading spinner
    loadListData(false);
  };

  const handleOptimisticCheck = (itemId: string, newCheckedState: boolean) => {
    // Immediately update UI (optimistic) - keep item in same position initially
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, is_checked: newCheckedState, checked_at: newCheckedState ? new Date().toISOString() : null }
          : item
      )
    );
    
    // Delay the database refresh to allow animations to complete
    // Don't reload at all - let next natural refresh handle it, or manual refresh
    setTimeout(() => {
      loadListData(false);
    }, 600);
  };

  useEffect(() => {
    loadListData();
    
    // Check if user has set their name for this list
    if (shareCode) {
      const savedName = getUserNameForList(shareCode);
      if (savedName) {
        setUserName(savedName);
      } else {
        // Show name prompt after a brief delay
        setTimeout(() => setShowNameModal(true), 500);
      }
    }
  }, [shareCode]);

  const handleSaveName = (name: string) => {
    if (shareCode) {
      setUserNameForList(shareCode, name);
      setUserName(name);
    }
    setShowNameModal(false);
  };

  const handleCopyCode = () => {
    if (list) {
      navigator.clipboard.writeText(list.share_code);
      setCopied(true);
      toast.success('Share code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearAll = async () => {
    if (!list) return;
    
    if (!window.confirm('Clear all items from this list? This cannot be undone.')) {
      return;
    }

    try {
      await clearAllItems(list.id);
      toast.success('All items cleared');
      loadListData();
    } catch (error) {
      toast.error('Failed to clear items');
      console.error(error);
    }
  };

  const handleDeleteList = async () => {
    if (!list) return;

    if (!window.confirm(`Delete "${list.name}"? This will delete the list for everyone and the share code will stop working. This cannot be undone.`)) {
      return;
    }

    try {
      await deleteShoppingList(list.id);
      removeShareCode(list.share_code);
      if (shareCode) {
        removeUserNameForList(shareCode);
      }
      toast.success('Shopping list deleted');
      navigate('/shopping-lists');
    } catch (error) {
      toast.error('Failed to delete list');
      console.error(error);
    }
  };

  const handleMarkComplete = async () => {
    if (!list || !userName) return;

    const allChecked = items.every(item => item.is_checked);
    
    try {
      await notifyShoppingComplete(list.id, list.name, userName, allChecked);
      toast.success('Shopping marked as complete!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleMissingItems = async () => {
    if (!list || !userName) return;

    const uncheckedCount = items.filter(item => !item.is_checked).length;
    
    if (uncheckedCount === 0) {
      toast.info('All items have been purchased!');
      return;
    }

    try {
      await notifyMissingItems(list.id, list.name, userName, uncheckedCount);
      toast.success('Notification sent!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleStartTrip = async (budget: number, storeName: string) => {
    if (!list) return;

    try {
      const trip = await createShoppingTrip({
        list_id: list.id,
        budget,
        store_name: storeName
      });
      
      setActiveTrip(trip);
      setViewingTrip(true);
      setShowStartTripModal(false);
      toast.success('Shopping trip started!');
    } catch (error) {
      console.error('Failed to start trip:', error);
      toast.error('Failed to start trip. Make sure you\'ve run the database migration (shopping_trip_schema.sql)');
    }
  };

  const handleCompleteTrip = async (completedTrip: ShoppingTrip, cartItems: CartItem[]) => {
    if (!list) return;

    // Ask if user wants to save prices to database
    if (cartItems.length > 0) {
      const shouldSave = window.confirm(
        `Save ${cartItems.length} item price${cartItems.length !== 1 ? 's' : ''} to Price Tracker?\n\nThis will add today's prices to your price history for comparison.`
      );

      if (shouldSave) {
        let savedCount = 0;
        let errorCount = 0;

        for (const item of cartItems) {
          try {
            // Map shopping list categories to grocery item categories
            const categoryMap: Record<string, 'Beef' | 'Pork' | 'Chicken' | 'Seafood' | 'Dairy' | 'Produce' | 'Snacks' | 'Drinks' | 'Household' | 'Other'> = {
              'Meats': 'Chicken',
              'Dairy': 'Dairy',
              'Produce': 'Produce',
              'Snacks': 'Snacks',
              'Drinks': 'Drinks',
              'Household': 'Household'
            };
            const groceryCategory = item.category ? (categoryMap[item.category] || 'Other') : 'Other';
            
            // Calculate unit price
            const unitPrice = item.price_paid / item.quantity;
            
            await createGroceryItem({
              itemName: item.item_name,
              price: item.price_paid,
              quantity: item.quantity,
              unitType: item.unit_type || 'each',
              unitPrice: unitPrice,
              datePurchased: new Date(),
              storeName: completedTrip.store_name,
              category: groceryCategory,
              targetPrice: item.target_price || undefined,
              meatQuality: undefined
            });
            savedCount++;
          } catch (error) {
            console.error(`Failed to save ${item.item_name}:`, error);
            errorCount++;
          }
        }

        if (savedCount > 0) {
          toast.success(`Saved ${savedCount} price${savedCount !== 1 ? 's' : ''} to Price Tracker!`);
        }
        if (errorCount > 0) {
          toast.warning(`Failed to save ${errorCount} item${errorCount !== 1 ? 's' : ''}`);
        }
      }
    }

    // Show trip summary
    const overBudget = completedTrip.total_spent > completedTrip.budget;
    const difference = Math.abs(completedTrip.total_spent - completedTrip.budget);
    
    toast.success(
      `Trip complete! Spent $${completedTrip.total_spent.toFixed(2)}. ` +
      (overBudget 
        ? `$${difference.toFixed(2)} over budget.`
        : `Saved $${difference.toFixed(2)}!`
      ),
      { autoClose: 5000 }
    );

    // Return to list view
    setViewingTrip(false);
    setActiveTrip(null);
    loadListData(false);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const key = item.is_checked ? 'checked' : item.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItemType[]>);

  const uncheckedItems = SHOPPING_LIST_CATEGORIES.map(category => ({
    category,
    items: groupedItems[category] || [],
  })).filter(group => group.items.length > 0);

  const checkedItems = groupedItems['checked'] || [];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!list) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">List not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/shopping-lists"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shopping Lists</span>
        </Link>

        {/* List Header */}
        <div
          className={`p-6 rounded-xl shadow-lg mb-6 ${
            darkMode ? 'bg-zinc-800' : 'bg-white'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{list.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span>?</span>
                <span>{checkedItems.length} purchased</span>
              </div>
            </div>
          </div>

          {/* Share Code */}
          <div className="flex items-center space-x-2">
            <div className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Share Code:</div>
              <div className="font-mono font-bold text-purple-600">{list.share_code}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Add Item to List</span>
          </button>
          
          {activeTrip ? (
            <button
              onClick={() => setViewingTrip(true)}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              <Receipt className="h-5 w-5" />
              <span>View Active Trip</span>
            </button>
          ) : (
            <button
              onClick={() => setShowStartTripModal(true)}
              disabled={items.length === 0}
              className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-medium transition-colors shadow-lg ${
                items.length === 0
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Start Shopping Trip</span>
            </button>
          )}
        </div>

        {/* Items by Category */}
        <div className="space-y-6">
          {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed ${
                darkMode ? 'border-zinc-700' : 'border-gray-300'
              } p-12 text-center`}
            >
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start adding items to your shopping list
              </p>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Add First Item
              </button>
            </div>
          ) : (
            <>
              {/* Unchecked Items (grouped by category) */}
              {uncheckedItems.map(({ category, items: categoryItems }) => (
                <div key={category}>
                  <h2 className="text-lg font-bold text-purple-600 mb-3 uppercase tracking-wide">
                    {category}
                  </h2>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        darkMode={darkMode}
                        onUpdate={handleItemUpdate}
                        onOptimisticCheck={handleOptimisticCheck}
                        listId={list.id}
                        listName={list.name}
                        shareCode={shareCode}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Checked Items (at bottom) */}
              {checkedItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-1 border-t border-gray-300 dark:border-zinc-700" />
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Purchased
                    </h2>
                    <div className="flex-1 border-t border-gray-300 dark:border-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    {checkedItems.map((item) => (
                      <ShoppingListItem
                        key={item.id}
                        item={item}
                        darkMode={darkMode}
                        onUpdate={handleItemUpdate}
                        onOptimisticCheck={handleOptimisticCheck}
                        listId={list.id}
                        listName={list.name}
                        shareCode={shareCode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notification Buttons */}
        {items.length > 0 && userName && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleMarkComplete}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Mark as Complete</span>
            </button>
            <button
              onClick={handleMissingItems}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Missing Items - Notify</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-4">
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Clear All Items</span>
            </button>
          )}
          <button
            onClick={handleDeleteList}
            className={`${items.length === 0 ? 'w-full' : 'flex-1'} flex items-center justify-center space-x-2 px-6 py-3 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors`}
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete List</span>
          </button>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      {showNameModal && list && (
        <SetNameModal
          darkMode={darkMode}
          listName={list.name}
          onSave={handleSaveName}
        />
      )}

      {showAddItemModal && list && shareCode && (
        <AddItemToListModal
          listId={list.id}
          shareCode={shareCode}
          listName={list.name}
          darkMode={darkMode}
          onClose={() => setShowAddItemModal(false)}
          onAdded={handleItemUpdate}
        />
      )}

      {showStartTripModal && list && (
        <StartShoppingTripModal
          isOpen={showStartTripModal}
          onClose={() => setShowStartTripModal(false)}
          onStart={handleStartTrip}
          listName={list.name}
          defaultStore=""
          darkMode={darkMode}
        />
      )}

      {/* Shopping Trip View (full screen overlay) */}
      {viewingTrip && activeTrip && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900">
          <ShoppingTripView
            trip={activeTrip}
            listItems={items}
            darkMode={darkMode}
            onBack={() => setViewingTrip(false)}
            onComplete={handleCompleteTrip}
          />
        </div>
      )}
    </div>
  );
};

export default ShoppingListDetail;
