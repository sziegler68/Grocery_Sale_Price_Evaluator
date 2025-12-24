import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Trash2, RotateCcw, Check, ShoppingCart, CheckCircle, AlertCircle, Receipt, CheckSquare, Square, ClipboardPaste, Camera } from 'lucide-react';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import ShoppingListItem from './ShoppingListItem';
import AddItemToListModal from './AddItemToListModal';
import { PasteListModal, type MatchedItem } from './PasteListModal';
import { ScanListModal } from './ScanListModal';
import { ListStats } from './ListStats';
import { CategoryGroup } from './CategoryGroup';
import { useLuna } from '../../../shared/components/Luna';
import SetNameModal from '../../../shared/components/SetNameModal';
import StartShoppingTripModal from '../../shopping-trips/components/StartShoppingTripModal';
import ShoppingTripView from '../../shopping-trips/components/ShoppingTripView';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';
import { getUserNameForList, setUserNameForList, removeUserNameForList } from '../../../shared/utils/listUserNames';
import { notifyShoppingComplete, notifyMissingItems, notifyItemsPurchased, sendLiveNotification } from '../../notifications/api';
import { getSalesTaxRate, getZipCode, saveZipCode, saveSalesTaxRate } from '../../../shared/utils/settings';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { useShoppingTripStore } from '../../shopping-trips/store/useShoppingTripStore';
import { getActiveTrip, createShoppingTrip } from '../../shopping-trips/api';
import { ingestGroceryItem } from '../../price-tracker/services/itemIngestion';
import { getStoredShareCodes } from '../../../shared/utils/shoppingListStorage';
import { getShoppingListByCode, addItemToList } from '../api';
import { fetchAllItems } from '../../price-tracker/api/groceryData';
import { normalizeUnit } from '../../../utils/listParser';
import { getUnitPreferences } from '../../../shared/utils/settings';
import { getPreferredUnit, convertPrice } from '../../../utils/unitConversion';
import { removeShareCode } from '../../../shared/utils/shoppingListStorage';
import { SHOPPING_LIST_CATEGORIES } from '../types';
import type { ShoppingListItem as ShoppingListItemType } from '../types';
import type { ShoppingTrip, CartItem } from '../../shopping-trips/types';
import { toast } from 'react-toastify';

const ShoppingListDetail: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Debug: Verify component is loading
  console.log('🏁 ShoppingListDetail component loaded. Share code:', shareCode);

  // Use store for ALL list data - no local state duplication
  const {
    currentList: list,
    items, // Use store items directly
    isLoading,
    loadListByShareCode,
    optimisticToggleItem,
    toggleItem,
    subscribeToList,
    subscribeToNotifications,
    deleteList,
    clearItems
  } = useShoppingListStore();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedListText, setScannedListText] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<ShoppingTrip | null>(null);
  const [viewingTrip, setViewingTrip] = useState(false);
  const [conflictingTrip, setConflictingTrip] = useState<ShoppingTrip | null>(null);
  const [showTripConflictModal, setShowTripConflictModal] = useState(false);
  const [allGroceryItems, setAllGroceryItems] = useState<{ id: string; name: string; category: string; target_price: number | null; unit_type?: string }[]>([]);
  const loadDataTimeoutRef = useRef<number | null>(null);
  const optimisticUpdatesRef = useRef<Set<string>>(new Set()); // Track items with pending optimistic updates

  // Luna context - sync current list ID for global assistant
  const { setCurrentListId } = useLuna();

  // Batched checkbox sync queue
  const checkboxSyncQueueRef = useRef<Map<string, boolean>>(new Map()); // itemId -> newCheckedState
  const checkboxSyncTimeoutRef = useRef<number | null>(null);
  const notificationBatchRef = useRef<{ count: number, lastUpdate: number }>({ count: 0, lastUpdate: 0 });

  const loadListData = useCallback(async () => {
    if (!shareCode) return;

    try {
      // Use store action to load list by share code
      const loadedList = await loadListByShareCode(shareCode);

      if (!loadedList) {
        toast.error('Shopping list not found');
        navigate('/shopping-lists');
        return;
      }

      // Try to load active trip, but don't fail if tables don't exist yet
      let trip: ShoppingTrip | null = null;
      try {
        trip = await getActiveTrip(loadedList.id);
      } catch (tripError) {
        console.warn('Could not load active trip (tables may not exist yet):', tripError);
        // Silently ignore - trip feature not available yet
      }

      setActiveTrip(trip);

      // Check for viewTrip in location state (passed from ActiveTripRedirect)
      const viewTripFromState = (location.state as any)?.viewTrip || false;
      console.log('[TRIP] Checking for trip view trigger:', {
        viewTripFromState,
        hasTrip: !!trip,
        locationState: location.state,
        currentURL: window.location.href
      });

      if (viewTripFromState && trip) {
        console.log('[TRIP] ✅ Switching to trip view from navigation state');
        setViewingTrip(true);
        console.log('[TRIP] setViewingTrip(true) called');
      } else if (viewTripFromState && !trip) {
        console.log('[TRIP] ⚠️ viewTrip state present but no active trip found');
      }
    } catch (error) {
      console.error('Failed to load shopping list:', error);
      toast.error('Failed to load shopping list');
    }
  }, [shareCode, navigate, loadListByShareCode, location.state]);

  // Debug: Log when viewingTrip changes
  useEffect(() => {
    console.log('[TRIP] viewingTrip state changed to:', viewingTrip);
  }, [viewingTrip]);

  // Debounced version of loadListData to prevent rapid successive calls
  const debouncedLoadListData = useCallback(() => {
    // Clear any pending reload
    if (loadDataTimeoutRef.current !== null) {
      clearTimeout(loadDataTimeoutRef.current);
    }

    // Schedule a new reload
    loadDataTimeoutRef.current = window.setTimeout(() => {
      loadListData();
    }, 300);
  }, [loadListData]);

  const handleItemUpdate = () => {
    // Use debounced reload to prevent excessive database calls
    debouncedLoadListData();
  };

  const handleScanComplete = (text: string) => {
    setScannedListText(text);
    setShowScanModal(false);
    setShowPasteModal(true);
  };

  // Sync batched checkbox changes to Supabase
  const syncCheckboxChanges = useCallback(async () => {
    if (checkboxSyncQueueRef.current.size === 0) return;

    const updates = new Map(checkboxSyncQueueRef.current);
    checkboxSyncQueueRef.current.clear();

    console.log('[CHECKBOX] Syncing', updates.size, 'checkbox changes to Supabase');

    // Batch update to Supabase in background using store action
    try {
      const promises = Array.from(updates.entries()).map(([itemId, isChecked]) => {
        return toggleItem(itemId, isChecked);
      });

      await Promise.all(promises);
      console.log('[CHECKBOX] ✅ Synced to database via store');

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
            notificationBatchRef.current = { count: checkedCount, lastUpdate: now };

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

    // Immediately update UI using store (optimistic) - instant response!
    optimisticToggleItem(itemId, newCheckedState);

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
  }, [optimisticToggleItem, syncCheckboxChanges]);

  useEffect(() => {
    loadListData();

    // Load all grocery items for fuzzy matching
    const loadGroceryItems = async () => {
      try {
        const result = await fetchAllItems();
        if (result.items) {
          console.log('[DEBUG] Loaded allGroceryItems:', result.items.length);
          setAllGroceryItems(result.items.map(item => ({
            id: item.id,
            name: item.itemName,
            category: item.category,
            target_price: item.targetPrice || null,
            unit_type: item.unitType,
          })));
        }
      } catch (error) {
        console.error('Failed to load grocery items for matching:', error);
      }
    };
    loadGroceryItems();

    // Check if user has set their name for this list
    if (shareCode) {
      const savedName = getUserNameForList(shareCode);
      if (savedName) {
        setUserName(savedName);
      } else {
        // Check if we should skip the name modal (e.g., navigating from Luna)
        const skipNameModal = (location.state as any)?.skipNameModal || false;
        if (!skipNameModal) {
          // Show name prompt after a brief delay
          setTimeout(() => setShowNameModal(true), 500);
        }
      }
    }
  }, [shareCode, loadListData]);

  // Handle view=trip query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('view') === 'trip' && activeTrip) {
      console.log('[TRIP] Query param view=trip detected, switching to trip view');
      setViewingTrip(true);
    }
  }, [activeTrip]);

  // Sync current list ID with Luna context for global add-to-list
  useEffect(() => {
    if (list?.id) {
      setCurrentListId(list.id);
    }
    return () => setCurrentListId(null);
  }, [list?.id, setCurrentListId]);

  // Real-time subscription for list items using store
  useEffect(() => {
    if (!list) return;

    // Use the store's subscription which properly reloads items
    const unsubscribe = subscribeToList(list.id);

    return () => {
      unsubscribe();
    };
  }, [list?.id, subscribeToList]);

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

  // Subscribe to live notifications via store
  useEffect(() => {
    if (!list) return;

    const unsubscribe = subscribeToNotifications(list.id, userName, (notification) => {
      console.log('[NOTIF] 📝 Notification details:', {
        type: notification.notification_type,
        triggeredBy: notification.triggered_by,
        message: notification.message
      });

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
    });

    return unsubscribe;
  }, [list?.id, userName, subscribeToNotifications]);

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
      await clearItems(list.id);
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
      await deleteList(list.id);
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

  const handleStartTrip = async (budget: number, storeName: string, salesTaxRate: number, zipCode: string, overridesUsed: { zip: boolean; tax: boolean }) => {
    if (!list) return;

    // Helper to actually create the trip
    const createTrip = async () => {
      try {
        // Check if there's already an active trip for any of the user's lists
        const shareCodes = getStoredShareCodes();
        let existingTrip: ShoppingTrip | null = null;

        for (const code of shareCodes) {
          try {
            const userList = await getShoppingListByCode(code);
            if (userList && userList.id !== list.id) {
              const trip = await getActiveTrip(userList.id);
              if (trip) {
                existingTrip = trip;
                break;
              }
            }
          } catch (error) {
            console.warn(`Failed to check trip for list ${code}:`, error);
          }
        }

        if (existingTrip) {
          setConflictingTrip(existingTrip);
          setShowTripConflictModal(true);
          setShowStartTripModal(false);
          return;
        }

        const trip = await createShoppingTrip({
          list_id: list.id,
          budget,
          store_name: storeName,
          sales_tax_rate: salesTaxRate
        });

        setActiveTrip(trip);
        setViewingTrip(true);
        setShowStartTripModal(false);
        toast.success('Shopping trip started!');

        if (userName && shareCode) {
          const message = `${userName} started a shopping trip at ${storeName} (Budget: $${Math.round(budget)})`;
          sendLiveNotification(list.id, message, 'trip_started', userName).catch(() => { });
        }
      } catch (error) {
        console.error('Failed to start trip:', error);
        toast.error('Failed to start trip. Make sure you\'ve run the database migration (shopping_trip_schema.sql)');
      }
    };

    // Check if we need to update default settings
    if (overridesUsed.zip || overridesUsed.tax) {
      const shouldUpdate = window.confirm(
        `You changed the ${overridesUsed.zip ? 'zip code' : ''}${overridesUsed.zip && overridesUsed.tax ? ' and ' : ''}${overridesUsed.tax ? 'tax rate' : ''} for this trip.\n\nWould you like to update your default settings?`
      );

      if (shouldUpdate) {
        if (overridesUsed.zip) saveZipCode(zipCode);
        if (overridesUsed.tax) saveSalesTaxRate(salesTaxRate);
        toast.success('Default settings updated');
      }
    }

    await createTrip();
  };

  const handleEndConflictingTrip = async () => {
    if (!conflictingTrip || !list) return;

    try {
      // End the conflicting trip using the store action
      await useShoppingTripStore.getState().finishTrip(conflictingTrip.id);
      toast.success('Previous trip ended');
      setShowTripConflictModal(false);
      setConflictingTrip(null);
      // Show start trip modal again
      setShowStartTripModal(true);
    } catch (error) {
      console.error('Failed to end conflicting trip:', error);
      toast.error('Failed to end previous trip');
    }
  };

  const handleCompleteTrip = async (completedTrip: ShoppingTrip, cartItems: CartItem[]) => {
    if (!list) return;

    // Always save prices to database (mandatory for price tracking)
    if (cartItems.length > 0) {
      let savedCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;

      for (const item of cartItems) {
        // Map shopping list categories to grocery item categories
        const categoryMap: Record<string, string> = {
          'Meats': 'Meat',
          'Meat': 'Meat',
          'Seafood': 'Seafood',
          'Dairy': 'Dairy',
          'Produce': 'Produce',
          'Bakery': 'Bakery',
          'Frozen': 'Frozen',
          'Pantry': 'Pantry',
          'Condiments': 'Condiments',
          'Beverages': 'Beverages',
          'Drinks': 'Beverages', // Legacy - map to Beverages
          'Snacks': 'Snacks',
          'Household': 'Household',
          'Personal Care': 'Personal Care',
          'Baby': 'Baby',
          'Pet': 'Pet',
          'Electronics': 'Electronics',
          'Other': 'Other',
        };
        const groceryCategory = item.category ? (categoryMap[item.category] || 'Other') : 'Other';

        // Use ingestion service for validation, normalization, and duplicate detection
        const result = await ingestGroceryItem({
          itemName: item.item_name,
          price: item.price_paid,
          quantity: item.quantity,
          unitType: item.unit_type || 'each',
          storeName: completedTrip.store_name,
          category: groceryCategory,
          targetPrice: item.target_price || undefined,
          notes: undefined,
          datePurchased: new Date(),
        }, {
          skipDuplicateCheck: false, // Enable duplicate detection for trip exports
          autoMerge: true, // Allow saving price history (different dates/prices)
          fuzzyThreshold: 0.85,
        });

        if (result.success) {
          savedCount++;
        } else if (result.matchFound) {
          // Item was an exact duplicate (same day + same price) - skip to avoid duplicate entry
          duplicateCount++;
          console.log(`[DUPLICATE] Skipped: ${item.item_name} - exact match found for today`);
        } else {
          console.error(`Failed to save ${item.item_name}:`, result.error);
          errorCount++;
        }
      }

      // Show summary with duplicate info
      if (savedCount > 0) {
        toast.success(`Saved ${savedCount} price${savedCount !== 1 ? 's' : ''} to Price Tracker!`);
      }
      if (duplicateCount > 0) {
        toast.info(`Skipped ${duplicateCount} exact duplicate${duplicateCount !== 1 ? 's' : ''} (same item/store/date/price)`);
      }
      if (errorCount > 0) {
        toast.warning(`Failed to save ${errorCount} item${errorCount !== 1 ? 's' : ''}`);
      }
    }

    // Show trip summary
    const overBudget = completedTrip.total_spent > completedTrip.budget;
    const difference = Math.abs(completedTrip.total_spent - completedTrip.budget);

    const summaryMessage = overBudget
      ? `$${difference.toFixed(2)} over budget`
      : `Saved $${difference.toFixed(2)}!`;

    toast.success(
      `Trip complete! Spent $${completedTrip.total_spent.toFixed(2)}. ${summaryMessage} Prices saved to database.`,
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
    loadListData();
  };

  const handlePastedItems = async (matchedItems: MatchedItem[]) => {
    if (!list) return;

    const prefs = getUnitPreferences();

    try {
      // Add each matched item to the list
      for (const item of matchedItems) {
        if (item.matchedItem) {
          // 1. Determine the Final Unit
          // Priority: User Input > User Preference > Database Default
          const userUnit = item.unit ? normalizeUnit(item.unit) : null;
          const dbUnit = item.matchedItem.unit_type;
          const prefUnit = getPreferredUnit(item.matchedItem.name, item.matchedItem.category, prefs);

          const finalUnit = userUnit || prefUnit || dbUnit;

          // 2. Determine Display Name
          // Use parsed name from user input, but append unit for clarity
          const displayName = finalUnit ? `${item.itemName} (${finalUnit})` : item.itemName;

          // 3. Convert Target Price if needed
          // DB Target Price is per 'dbUnit'. We need it per 'finalUnit'.
          let finalTargetPrice = item.matchedItem.target_price;
          if (finalTargetPrice && dbUnit && finalUnit && dbUnit !== finalUnit) {
            const converted = convertPrice(finalTargetPrice, dbUnit, finalUnit);
            if (converted) {
              finalTargetPrice = converted.price;
            }
          }

          // Use existing item from database - call API directly
          await addItemToList({
            list_id: list.id,
            item_name: displayName,
            category: item.matchedItem.category,
            quantity: item.quantity || 1,
            unit_type: finalUnit || undefined,
            target_price: finalTargetPrice || undefined,
          });
        } else {
          // Create new item (no match found)
          const unit = item.unit ? normalizeUnit(item.unit) : null;
          const displayName = unit ? `${item.itemName} (${unit})` : item.itemName;

          await addItemToList({
            list_id: list.id,
            item_name: displayName,
            category: 'Other', // Default category
            quantity: item.quantity || 1,
            unit_type: unit || undefined,
          });
        }
      }

      toast.success(`Added ${matchedItems.length} items to list`);
      loadListData();
    } catch (error) {
      console.error('Failed to add pasted items:', error);
      toast.error('Failed to add some items');
    }
  };

  // Group items by category (memoized to prevent recalculation on every render)
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const key = item.is_checked ? 'checked' : item.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItemType[]>);
  }, [items]);

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
        <div className="p-6 rounded-xl shadow-lg mb-6 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{list.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span>•</span>
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${copied
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

        {/* List Stats */}
        {items.length > 0 && (
          <ListStats
            totalItems={items.length}
            checkedItems={checkedItems.length}
            completionPercentage={Math.round((checkedItems.length / items.length) * 100)}
          />
        )}

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

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              <ClipboardPaste className="h-5 w-5" />
              <span>Paste Items</span>
            </button>

            <button
              onClick={() => setShowScanModal(true)}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              <Camera className="h-5 w-5" />
              <span>Scan List</span>
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
                className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-medium transition-colors shadow-lg ${items.length === 0
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
              className="rounded-xl border border-dashed border-primary p-12 text-center"
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
                <CategoryGroup
                  key={category}
                  category={category}
                  items={categoryItems}
                  darkMode={darkMode}
                  onUpdate={handleItemUpdate}
                  onOptimisticCheck={handleOptimisticCheck}
                  listId={list.id}
                  listName={list.name}
                  shareCode={shareCode}
                />
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
          onClose={() => setShowAddItemModal(false)}
          onAdded={handleItemUpdate}
        />
      )}

      {showPasteModal && list && (
        <>
          {console.log('[DEBUG] Passing to PasteListModal, allGroceryItems:', allGroceryItems.length, 'items:', items.length)}
          <PasteListModal
            isOpen={showPasteModal}
            onClose={() => {
              setShowPasteModal(false);
              setScannedListText(''); // Clear scanned text on close
            }}
            onAddItems={handlePastedItems}
            initialText={scannedListText}

            availableItems={allGroceryItems.length > 0 ? allGroceryItems : items.map(item => ({
              id: item.id,
              name: item.item_name,
              category: item.category,
              target_price: item.target_price,
              unit_type: item.unit_type || undefined
            }))}
          />
        </>
      )}

      {showStartTripModal && list && (
        <StartShoppingTripModal
          isOpen={showStartTripModal}
          onClose={() => setShowStartTripModal(false)}
          onStart={handleStartTrip}
          listName={list.name}
          defaultStore=""
          salesTaxRate={getSalesTaxRate()}
          defaultZipCode={getZipCode()}
        />
      )}

      {showScanModal && (
        <ScanListModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          onScanComplete={handleScanComplete}
        />
      )}

      {/* Trip Conflict Modal */}
      {showTripConflictModal && conflictingTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border border-primary">
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg text-primary">Active Trip in Progress</h3>
                <p className="text-secondary text-sm mt-1">
                  You already have an active shopping trip at <span className="font-semibold">{conflictingTrip.store_name}</span>.
                </p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 mb-4">
              <p className="text-xs text-secondary mb-2">Current Trip:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Store:</span>
                  <span className="font-medium text-primary">{conflictingTrip.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Budget:</span>
                  <span className="font-medium text-primary">${conflictingTrip.budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Spent:</span>
                  <span className="font-medium text-primary">${conflictingTrip.total_spent.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-secondary mb-6">
              You can only have one active trip at a time. Would you like to end the current trip and start a new one?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTripConflictModal(false);
                  setConflictingTrip(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-primary hover:bg-secondary transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEndConflictingTrip}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
              >
                End & Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Trip View (full screen overlay) */}
      {viewingTrip && activeTrip && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900">
          <ShoppingTripView
            trip={activeTrip}
            listItems={items}
            onBack={() => setViewingTrip(false)}
            onComplete={handleCompleteTrip}
          />
        </div>
      )}
    </div>
  );
};

export default ShoppingListDetail;
