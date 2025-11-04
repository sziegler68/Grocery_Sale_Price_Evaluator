import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Trash2, RotateCcw, Check, ShoppingCart } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ShoppingListItem from './ShoppingListItem';
import AddItemToListModal from './AddItemToListModal';
import { useDarkMode } from './useDarkMode';
import { 
  getShoppingListByCode, 
  getItemsForList, 
  deleteShoppingList, 
  clearAllItems 
} from './shoppingListApi';
import { removeShareCode } from './shoppingListStorage';
import { SHOPPING_LIST_CATEGORIES } from './shoppingListTypes';
import type { ShoppingList, ShoppingListItem as ShoppingListItemType } from './shoppingListTypes';
import { toast } from 'react-toastify';

const ShoppingListDetail: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadListData = async () => {
    if (!shareCode) return;

    setIsLoading(true);
    try {
      const [loadedList, loadedItems] = await Promise.all([
        getShoppingListByCode(shareCode),
        getShoppingListByCode(shareCode).then(list => 
          list ? getItemsForList(list.id) : []
        )
      ]);

      if (!loadedList) {
        toast.error('Shopping list not found');
        navigate('/shopping-lists');
        return;
      }

      setList(loadedList);
      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
      toast.error('Failed to load shopping list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListData();
  }, [shareCode]);

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
      toast.success('Shopping list deleted');
      navigate('/shopping-lists');
    } catch (error) {
      toast.error('Failed to delete list');
      console.error(error);
    }
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

        {/* Add Item Button */}
        <button
          onClick={() => setShowAddItemModal(true)}
          className="w-full mb-6 flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Item to List</span>
        </button>

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
                        onUpdate={loadListData}
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
                        onUpdate={loadListData}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {items.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={handleClearAll}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Clear All Items</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete List</span>
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Add Item Modal */}
      {showAddItemModal && (
        <AddItemToListModal
          listId={list.id}
          darkMode={darkMode}
          onClose={() => setShowAddItemModal(false)}
          onAdded={loadListData}
        />
      )}
    </div>
  );
};

export default ShoppingListDetail;
