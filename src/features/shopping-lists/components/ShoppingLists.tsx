import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserPlus, ShoppingCart, RotateCcw, Trash2, Download } from 'lucide-react';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import ShoppingListCard from './ShoppingListCard';
import CreateListModal from './CreateListModal';
import JoinListModal from './JoinListModal';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import { getStoredShareCodes, removeShareCode } from '../../../shared/utils/shoppingListStorage';
import {
  getShoppingListsByCodes,
  getItemsForList,
  updateShoppingList,
  softDeleteList,
  getDeletedLists,
  restoreList,
  deleteShoppingList
} from '../api';
import { syncAlexaLists } from '../../../shared/api/alexaApi';
import type { ShoppingList } from '../types';
import { toast } from 'react-toastify';

const ShoppingLists: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [deletedLists, setDeletedLists] = useState<ShoppingList[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [hasAlexaCode, setHasAlexaCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAlexa = async () => {
    setIsSyncing(true);
    try {
      const result = await syncAlexaLists();
      if (result.success) {
        if (result.newListsCount > 0) {
          toast.success(`Synced ${result.newListsCount} new list(s) from Alexa!`);
          loadLists(); // Refresh lists
        } else {
          toast.info('All Alexa lists are already synced.');
        }
      } else {
        toast.error(result.error || 'Failed to sync lists');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      toast.error('Failed to sync lists');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    try {
      // Auto-sync from Alexa on load
      try {
        await syncAlexaLists();
      } catch (e) {
        console.warn('Background Alexa sync failed:', e);
      }

      const shareCodes = getStoredShareCodes();

      if (shareCodes.length === 0) {
        setLists([]);
        setDeletedLists([]);
        setIsLoading(false);
        return;
      }

      // Check if user has Alexa sync code
      const alexaCode = localStorage.getItem('alexa-sync-code');
      setHasAlexaCode(!!alexaCode);

      // Load active lists
      const loadedLists = await getShoppingListsByCodes(shareCodes);
      setLists(loadedLists);

      // Load deleted lists (for recovery)
      const deleted = await getDeletedLists(shareCodes);
      // Filter out lists that are more than 24 hours old
      const now = new Date();
      const recoverableLists = deleted.filter(list => {
        if (!list.deleted_at) return false;
        const deletedAt = new Date(list.deleted_at);
        const hoursSinceDelete = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceDelete < 24;
      });
      setDeletedLists(recoverableLists);

      // Clean up lists older than 24 hours (permanently delete)
      const expiredLists = deleted.filter(list => {
        if (!list.deleted_at) return false;
        const deletedAt = new Date(list.deleted_at);
        const hoursSinceDelete = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceDelete >= 24;
      });
      for (const expired of expiredLists) {
        try {
          await deleteShoppingList(expired.id);
          removeShareCode(expired.share_code);
        } catch (e) {
          console.error('Failed to permanently delete expired list:', e);
        }
      }

      // Load item counts for active lists
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
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleListCreated = () => {
    setShowCreateModal(false);
    loadLists();
  };

  const handleListJoined = () => {
    setShowJoinModal(false);
    loadLists();
  };

  const handleRename = async (listId: string, newName: string) => {
    try {
      await updateShoppingList(listId, { name: newName });
      toast.success('List renamed!');
      loadLists();
    } catch (error) {
      console.error('Failed to rename list:', error);
      toast.error('Could not rename list');
    }
  };

  const handleDelete = async (listId: string) => {
    try {
      await softDeleteList(listId);
      toast.success('List deleted. You can restore it within 24 hours.');
      loadLists();
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error('Could not delete list');
    }
  };

  const handleRestore = async (listId: string) => {
    try {
      await restoreList(listId);
      toast.success('List restored!');
      loadLists();
    } catch (error) {
      console.error('Failed to restore list:', error);
      toast.error('Could not restore list');
    }
  };

  const handlePermanentDelete = async (listId: string, shareCode: string) => {
    try {
      await deleteShoppingList(listId);
      removeShareCode(shareCode);
      toast.success('List permanently deleted');
      loadLists();
    } catch (error) {
      console.error('Failed to permanently delete list:', error);
      toast.error('Could not delete list');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shopping Lists</h1>
          <p className="text-primary">
            Create and share grocery lists with family and friends
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-brand hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create New List</span>
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center space-x-2 px-6 py-3 border border-brand text-brand hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span>Join Existing List</span>
          </button>

          {hasAlexaCode && (
            <button
              onClick={handleSyncAlexa}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              title="Sync lists from Alexa"
            >
              <Download className={`h-5 w-5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Alexa Lists'}</span>
            </button>
          )}
        </div>

        {/* Active Lists */}
        {isLoading ? (
          <div
            className={`rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'
              } p-6 text-center text-sm text-secondary`}
          >
            Loading lists...
          </div>
        ) : lists.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed ${darkMode ? 'border-zinc-700' : 'border-gray-300'
              } p-12 text-center`}
          >
            <ShoppingCart className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shopping Lists Yet</h3>
            <p className="text-secondary mb-6">
              Create your first shopping list or join one shared with you
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-brand hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Create List
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-2 border border-brand text-brand hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
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
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Recently Deleted Section */}
        {deletedLists.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-secondary">Recently Deleted</h2>
            <p className="text-sm text-secondary mb-4">
              These lists will be permanently deleted after 24 hours
            </p>
            <div className="space-y-3">
              {deletedLists.map((list) => {
                const deletedAt = list.deleted_at ? new Date(list.deleted_at) : new Date();
                const hoursRemaining = Math.max(0, 24 - ((Date.now() - deletedAt.getTime()) / (1000 * 60 * 60)));

                return (
                  <div
                    key={list.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'
                      }`}
                  >
                    <div>
                      <span className="font-medium">{list.name}</span>
                      <span className="text-sm text-secondary ml-3">
                        ({Math.ceil(hoursRemaining)}h remaining)
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRestore(list.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        title="Restore list"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(list.id, list.share_code)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
