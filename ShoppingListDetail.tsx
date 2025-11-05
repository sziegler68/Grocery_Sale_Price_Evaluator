import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Trash2, RotateCcw, Check, ShoppingCart, CheckCircle, AlertCircle, Receipt, CheckSquare, Square } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ShoppingListItem from './ShoppingListItem';
import AddItemToListModal from './AddItemToListModal';
import SetNameModal from './SetNameModal';
import StartShoppingTripModal from './StartShoppingTripModal';
import ShoppingTripView from './ShoppingTripView';
import { useDarkMode } from './useDarkMode';
import { getUserNameForList, setUserNameForList, removeUserNameForList } from './listUserNames';
import { notifyShoppingComplete, notifyMissingItems, notifyItemsPurchased, sendLiveNotification } from './notificationService';
import { getSalesTaxRate } from './Settings';
import { 
  getShoppingListByCode, 
  getItemsForList, 
  deleteShoppingList, 
  clearAllItems,
  subscribeToListItems,
  checkItem,
  uncheckItem
} from './shoppingListApi';
import { getSupabaseClient } from './supabaseClient';
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
  
  // Debug: Verify component is loading
  console.log('🏁 ShoppingListDetail component loaded. Share code:', shareCode);
  
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
  const loadDataTimeoutRef = useRef<number | null>(null);
  const subscriptionBatchRef = useRef<Map<string, ShoppingListItemType>>(new Map());
  const subscriptionTimeoutRef = useRef<number | null>(null);
  const optimisticUpdatesRef = useRef<Set<string>>(new Set()); // Track items with pending optimistic updates
  
  // Batched checkbox sync queue
  const checkboxSyncQueueRef = useRef<Map<string, boolean>>(new Map()); // itemId -> newCheckedState
  const checkboxSyncTimeoutRef = useRef<number | null>(null);
  const notificationBatchRef = useRef<{count: number, lastUpdate: number}>({count: 0, lastUpdate: 0});
  
  // Delayed re-grouping to prevent visual glitching
  const [displayItems, setDisplayItems] = useState<ShoppingListItemType[]>([]);
  const regroupTimeoutRef = useRef<number | null>(null);

  const loadListData = useCallback(async (showLoading = true) => {
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
  }, [shareCode, navigate]);

  // Debounced version of loadListData to prevent rapid successive calls
  const debouncedLoadListData = useCallback(() => {
    // Clear any pending reload
    if (loadDataTimeoutRef.current !== null) {
      clearTimeout(loadDataTimeoutRef.current);
    }
    
    // Schedule a new reload
    loadDataTimeoutRef.current = window.setTimeout(() => {
      loadListData(false);
    }, 300);
  }, [loadListData]);

  const handleItemUpdate = () => {
    // Use debounced reload to prevent excessive database calls
    debouncedLoadListData();
  };

  // Sync batched checkbox changes to Supabase
  const syncCheckboxChanges = useCallback(async () => {
    if (checkboxSyncQueueRef.current.size === 0) return;
    
    const updates = new Map(checkboxSyncQueueRef.current);
    checkboxSyncQueueRef.current.clear();
    
    console.log('[CHECKBOX] Syncing', updates.size, 'checkbox changes to Supabase');
    
    // Batch update to Supabase in background
    try {
      const promises = Array.from(updates.entries()).map(([itemId, isChecked]) => {
        if (isChecked) {
          return checkItem(itemId);
        } else {
          return uncheckItem(itemId);
        }
      });
      
      await Promise.all(promises);
      console.log('[CHECKBOX] ✅ Synced to database');
      
      // Send notification for first checkbox activity in 1 hour window
      const checkedCount = Array.from(updates.values()).filter(v => v).length;
      if (checkedCount > 0 && list && shareCode) {
        const userName = getUserNameForList(shareCode);
        console.log('[CHECKBOX] Checked count:', checkedCount, 'User:', userName);
        
        if (userName) {
          // Check if we should send notification (1 hour throttle for checkbox activity)
          const now = Date.now();
          const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
          const timeSinceLast = now - notificationBatchRef.current.lastUpdate;
          
          console.log('[CHECKBOX] Last notification:', 
            notificationBatchRef.current.lastUpdate === 0 
              ? 'Never' 
              : `${Math.round(timeSinceLast / 1000)}s ago`);
          
          // Only send if first activity or more than 1 hour since last notification
          if (notificationBatchRef.current.lastUpdate === 0 || 
              now - notificationBatchRef.current.lastUpdate > oneHour) {
            
            console.log('[CHECKBOX] ✅ Sending notification (1 hour passed or first activity)');
            notificationBatchRef.current = {count: checkedCount, lastUpdate: now};
            
            // Send notification: "User started shopping" (first check) or "User is shopping"
            const message = `${userName} started checking items off ${list.name}`;
            
            // Fire and forget - don't block
            notifyItemsPurchased(list.id, list.name, checkedCount, userName, message).catch((err) => {
              console.error('[CHECKBOX] ❌ Failed to send notification:', err);
            });
          } else {
            console.log('[CHECKBOX] ⏱️ Skipping notification (within 1 hour window)');
          }
          // Otherwise, silently check items without notification (already notified in past hour)
        } else {
          console.log('[CHECKBOX] ⚠️ No user name set - cannot send notification');
        }
      }
      
      // Clear optimistic flags
      updates.forEach((_, itemId) => {
        optimisticUpdatesRef.current.delete(itemId);
      });
    } catch (error) {
      console.error('[CHECKBOX] ❌ Failed to sync checkbox changes:', error);
      // Don't revert UI - real-time subscription will sync eventually
    }
  }, [list, shareCode]);

  const handleOptimisticCheck = useCallback((itemId: string, newCheckedState: boolean) => {
    // Mark this item as having a pending optimistic update
    optimisticUpdatesRef.current.add(itemId);
    
    // Immediately update UI (optimistic) - instant response!
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, is_checked: newCheckedState, checked_at: newCheckedState ? new Date().toISOString() : null }
          : item
      )
    );
    
    // Immediately update display items (no re-grouping yet - keep in place)
    setDisplayItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, is_checked: newCheckedState, checked_at: newCheckedState ? new Date().toISOString() : null }
          : item
      )
    );
    
    // Queue for batched background sync
    checkboxSyncQueueRef.current.set(itemId, newCheckedState);
    
    // Clear any existing sync timeout
    if (checkboxSyncTimeoutRef.current !== null) {
      clearTimeout(checkboxSyncTimeoutRef.current);
    }
    
    // Schedule batched sync (1 second delay to batch multiple rapid clicks)
    checkboxSyncTimeoutRef.current = window.setTimeout(() => {
      syncCheckboxChanges();
    }, 1000);
    
    // Delay re-grouping to prevent visual glitching during rapid clicks
    if (regroupTimeoutRef.current !== null) {
      clearTimeout(regroupTimeoutRef.current);
    }
    
    regroupTimeoutRef.current = window.setTimeout(() => {
      // After 2 seconds of no activity, trigger re-grouping by syncing displayItems with items
      setItems(latestItems => {
        setDisplayItems(latestItems);
        return latestItems;
      });
    }, 2000);
  }, [syncCheckboxChanges]);

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

  // Batched update function for subscription
  const processBatchedUpdates = useCallback(() => {
    if (subscriptionBatchRef.current.size === 0) return;

    const updates = new Map(subscriptionBatchRef.current);
    subscriptionBatchRef.current.clear();

    // Direct update - no startTransition to avoid delays
    setItems(prevItems => {
      const newItems = [...prevItems];
      let hasChanges = false;

      updates.forEach((updatedItem, itemId) => {
        // Skip updates for items with pending optimistic updates to prevent conflicts
        if (optimisticUpdatesRef.current.has(itemId)) {
          return;
        }
        
        const itemIndex = newItems.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          const existingItem = newItems[itemIndex];
          // Shallow comparison (much faster than JSON.stringify)
          if (existingItem.is_checked !== updatedItem.is_checked ||
              existingItem.item_name !== updatedItem.item_name ||
              existingItem.checked_at !== updatedItem.checked_at) {
            newItems[itemIndex] = updatedItem;
            hasChanges = true;
          }
        } else {
          // New item
          newItems.push(updatedItem);
          hasChanges = true;
        }
      });

      return hasChanges ? newItems : prevItems;
    });
  }, []);

  // Real-time subscription for list items
  useEffect(() => {
    if (!list) return;

    const unsubscribe = subscribeToListItems(
      list.id,
      // Handle updates and inserts - batch them
      (updatedItem) => {
        // Add to batch
        subscriptionBatchRef.current.set(updatedItem.id, updatedItem);

        // Clear existing timeout
        if (subscriptionTimeoutRef.current !== null) {
          clearTimeout(subscriptionTimeoutRef.current);
        }

        // Schedule batched update with reduced delay for faster response
        subscriptionTimeoutRef.current = window.setTimeout(() => {
          processBatchedUpdates();
        }, 50); // Batch updates within 50ms window (reduced from 100ms)
      },
      // Handle deletes - immediate
      (deletedItemId) => {
        setItems(prevItems => prevItems.filter(item => item.id !== deletedItemId));
      }
    );

    return () => {
      unsubscribe();
      if (subscriptionTimeoutRef.current !== null) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
    };
  }, [list?.id, processBatchedUpdates]);

  // Flush pending checkbox changes on unmount
  useEffect(() => {
    return () => {
      // Flush any pending checkbox syncs before unmounting
      if (checkboxSyncQueueRef.current.size > 0) {
        if (checkboxSyncTimeoutRef.current !== null) {
          clearTimeout(checkboxSyncTimeoutRef.current);
        }
        syncCheckboxChanges();
      }
    };
  }, [syncCheckboxChanges]);

  // Subscribe to live notifications
  useEffect(() => {
    if (!list) return;

    console.log('[NOTIF] 📡 Setting up notification subscription for list:', list.id.substring(0, 8) + '...');
    console.log('[NOTIF] 👤 Current user:', userName || 'No name set');

    const client = getSupabaseClient();
    
    const channel = client
      .channel(`notifications-${list.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_notifications',
          filter: `list_id=eq.${list.id}`,
        },
        (payload) => {
          console.log('[NOTIF] 📬 Received notification:', payload);
          
          const notification = payload.new as any;
          
          console.log('[NOTIF] 📝 Notification details:', {
            type: notification.notification_type,
            triggeredBy: notification.triggered_by,
            message: notification.message
          });
          
          // Don't show notifications triggered by yourself
          if (userName && notification.triggered_by === userName) {
            console.log('[NOTIF] ⏭️ Skipping - triggered by current user');
            return;
          }
          
          console.log('[NOTIF] 🎉 Showing notification to user');
          
          // Show toast notification
          toast.info(notification.message, {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Also send browser notification if enabled
          if ('Notification' in window && Notification.permission === 'granted') {
            console.log('[NOTIF] 🔔 Sending browser notification');
            new Notification('Shopping List Update', {
              body: notification.message,
              icon: '/icons/192x192.png',
              tag: 'shopping-list-notification',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[NOTIF] Subscription status:', status);
      });

    return () => {
      console.log('[NOTIF] 🔌 Unsubscribing from notifications');
      channel.unsubscribe();
    };
  }, [list?.id, userName]);

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

  const handleCheckAll = async () => {
    if (!list || items.length === 0) return;

    const unchecked = items.filter(item => !item.is_checked);
    if (unchecked.length === 0) {
      toast.info('All items already checked');
      return;
    }

    try {
      // Check all unchecked items in parallel
      await Promise.all(unchecked.map(item => handleOptimisticCheck(item.id, true)));
      toast.success(`Checked ${unchecked.length} items`);
    } catch (error) {
      toast.error('Failed to check all items');
      console.error(error);
    }
  };

  const handleUncheckAll = async () => {
    if (!list || items.length === 0) return;

    const checked = items.filter(item => item.is_checked);
    if (checked.length === 0) {
      toast.info('No items to uncheck');
      return;
    }

    try {
      // Uncheck all checked items in parallel
      await Promise.all(checked.map(item => handleOptimisticCheck(item.id, false)));
      toast.success(`Unchecked ${checked.length} items`);
    } catch (error) {
      toast.error('Failed to uncheck all items');
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
      
      // Send notification that shopping trip started
      if (userName && shareCode) {
        const message = `${userName} started a shopping trip at ${storeName} (Budget: $${Math.round(budget)})`;
        sendLiveNotification(list.id, message, 'trip_started', userName).catch(() => {
          // Silently fail
        });
      }
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
    
    const summaryMessage = overBudget 
      ? `$${difference.toFixed(2)} over budget`
      : `Saved $${difference.toFixed(2)}!`;
    
    toast.success(
      `Trip complete! Spent $${completedTrip.total_spent.toFixed(2)}. ${summaryMessage}`,
      { autoClose: 5000 }
    );

    // Send notification that shopping trip ended
    if (userName && shareCode) {
      const notifMessage = `${userName} completed shopping trip. Spent $${completedTrip.total_spent.toFixed(2)} (${summaryMessage})`;
      sendLiveNotification(list.id, notifMessage, 'trip_completed', userName).catch(() => {
        // Silently fail
      });
    }

    // Return to list view
    setViewingTrip(false);
    setActiveTrip(null);
    loadListData(false);
  };

  // Sync displayItems with items when items change from external sources
  useEffect(() => {
    // Only update if not from user interaction (i.e., from initial load or subscription)
    if (optimisticUpdatesRef.current.size === 0) {
      setDisplayItems(items);
    }
  }, [items]);

  // Group items by category (memoized to prevent recalculation on every render)
  // Use displayItems instead of items to control when re-grouping happens
  const groupedItems = useMemo(() => {
    return displayItems.reduce((acc, item) => {
      const key = item.is_checked ? 'checked' : item.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItemType[]>);
  }, [displayItems]);

  const uncheckedItems = useMemo(() => {
    return SHOPPING_LIST_CATEGORIES.map(category => ({
      category,
      items: groupedItems[category] || [],
    })).filter(group => group.items.length > 0);
  }, [groupedItems]);

  // Checked items stay in the order they were checked off (sort by checked_at timestamp)
  const checkedItems = useMemo(() => {
    const checked = groupedItems['checked'] || [];
    return checked.sort((a, b) => {
      // Sort by checked_at timestamp (most recently checked at bottom)
      const timeA = a.checked_at ? new Date(a.checked_at).getTime() : 0;
      const timeB = b.checked_at ? new Date(b.checked_at).getTime() : 0;
      return timeA - timeB;
    });
  }, [groupedItems]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
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
      <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">List not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
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
            bg-card
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{list.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span>?</span>
                <span>{checkedItems.length} purchased</span>
              </div>
            </div>
          </div>

          {/* Share Code */}
          <div className="flex items-center space-x-2">
            <div className={`flex-1 px-4 py-2 rounded-lg bg-secondary`}>
              <div className="text-xs text-secondary mb-1">Share Code:</div>
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
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Check All / Uncheck All */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckAll}
                disabled={items.every(item => item.is_checked)}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Check All</span>
              </button>
              <button
                onClick={handleUncheckAll}
                disabled={items.every(item => !item.is_checked)}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="h-4 w-4" />
                <span>Uncheck All</span>
              </button>
            </div>
          )}
        </div>

        {/* Items by Category */}
        <div className="space-y-6">
          {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed ${
                border-primary
              } p-12 text-center`}
            >
              <ShoppingCart className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
              <p className="text-secondary mb-4">
                Start adding items to your shopping list
              </p>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Item
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
                    <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
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
          salesTaxRate={getSalesTaxRate()}
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
