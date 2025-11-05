import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, ShoppingCart } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ShoppingListCard from './ShoppingListCard';
import CreateListModal from './CreateListModal';
import JoinListModal from './JoinListModal';
import { useDarkMode } from './useDarkMode';
import { getStoredShareCodes } from './shoppingListStorage';
import { getShoppingListsByCodes, getItemsForList } from './shoppingListApi';
import type { ShoppingList } from './shoppingListTypes';

const ShoppingLists: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const shareCodes = getStoredShareCodes();
      
      if (shareCodes.length === 0) {
        setLists([]);
        setIsLoading(false);
        return;
      }

      const loadedLists = await getShoppingListsByCodes(shareCodes);
      setLists(loadedLists);

      // Load item counts for each list
      const counts: Record<string, number> = {};
      await Promise.all(
        loadedLists.map(async (list) => {
          const items = await getItemsForList(list.id);
          counts[list.id] = items.length;
        })
      );
      setItemCounts(counts);
    } catch (error) {
      console.error('Failed to load shopping lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const handleListCreated = () => {
    setShowCreateModal(false);
    loadLists();
  };

  const handleListJoined = () => {
    setShowJoinModal(false);
    loadLists();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Lists</h1>
          <p className="text-gray-800 dark:text-gray-300">
            Create and share grocery lists with family and friends
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create New List</span>
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center space-x-2 px-6 py-3 border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span>Join Existing List</span>
          </button>
        </div>

        {/* Lists */}
        {isLoading ? (
          <div
            className={`rounded-xl border border-dashed ${
              darkMode ? 'border-zinc-700' : 'border-gray-300'
            } p-6 text-center text-sm text-gray-500 dark:text-gray-400`}
          >
            Loading lists...
          </div>
        ) : lists.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed ${
              darkMode ? 'border-zinc-700' : 'border-gray-300'
            } p-12 text-center`}
          >
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shopping Lists Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first shopping list or join one shared with you
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Create List
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
              >
                Join List
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <ShoppingListCard
                key={list.id}
                list={list}
                itemCount={itemCounts[list.id] || 0}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {showCreateModal && (
        <CreateListModal
          darkMode={darkMode}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleListCreated}
        />
      )}
      {showJoinModal && (
        <JoinListModal
          darkMode={darkMode}
          onClose={() => setShowJoinModal(false)}
          onJoined={handleListJoined}
        />
      )}
    </div>
  );
};

export default ShoppingLists;
