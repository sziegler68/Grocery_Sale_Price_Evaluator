import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Trash2, ShoppingCart as ShoppingCartIcon, AlertCircle } from 'lucide-react';
import type { ShoppingTrip, CartItem } from './shoppingTripTypes';
import type { ShoppingListItem } from './shoppingListTypes';
import { calculateBudgetStatus } from './shoppingTripTypes';
import { getCartItems, removeCartItem, addItemToCart, completeTrip, subscribeToCartUpdates, getTripById } from './shoppingTripApi';
import QuickPriceInput from './QuickPriceInput';
import { toast } from 'react-toastify';

interface ShoppingTripViewProps {
  trip: ShoppingTrip;
  listItems: ShoppingListItem[];
  darkMode: boolean;
  onBack: () => void;
  onComplete: (trip: ShoppingTrip, cartItems: CartItem[]) => void;
}

const ShoppingTripView: React.FC<ShoppingTripViewProps> = ({
  trip: initialTrip,
  listItems,
  darkMode,
  onBack,
  onComplete
}) => {
  const [trip, setTrip] = useState<ShoppingTrip>(initialTrip);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
  const [showPriceInput, setShowPriceInput] = useState(false);

  const budgetStatus = calculateBudgetStatus(trip.total_spent, trip.budget);

  // Load cart items
  useEffect(() => {
    const loadCart = async () => {
      try {
        const items = await getCartItems(trip.id);
        setCartItems(items);
      } catch (error) {
        console.error('Error loading cart:', error);
        toast.error('Failed to load cart');
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [trip.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = subscribeToCartUpdates(trip.id, async (payload) => {
      console.log('Cart update:', payload);
      
      // Reload both cart items and trip data
      try {
        const [items, updatedTrip] = await Promise.all([
          getCartItems(trip.id),
          getTripById(trip.id)
        ]);
        
        setCartItems(items);
        if (updatedTrip) {
          setTrip(updatedTrip);
        }
      } catch (error) {
        console.error('Failed to reload cart data:', error);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [trip.id]);

  const handleItemClick = (item: ShoppingListItem) => {
    // Check if already in cart
    const inCart = cartItems.some(ci => ci.list_item_id === item.id);
    if (inCart) {
      toast.info('Item already in cart');
      return;
    }

    setSelectedItem(item);
    setShowPriceInput(true);
  };

  const handleAddPrice = async (price: number) => {
    if (!selectedItem) return;

    try {
      await addItemToCart({
        trip_id: trip.id,
        list_item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        price_paid: price,
        quantity: selectedItem.quantity || 1,
        unit_type: selectedItem.unit_type || undefined,
        category: selectedItem.category || undefined,
        target_price: selectedItem.target_price || undefined
      });

      toast.success(`Added ${selectedItem.item_name} to cart`);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item');
    }
  };

  const handleRemoveFromCart = async (cartItem: CartItem) => {
    try {
      await removeCartItem(cartItem.id);
      toast.success(`Removed ${cartItem.item_name}`);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCompleteTrip = async () => {
    if (window.confirm('Complete this shopping trip?')) {
      try {
        const completedTrip = await completeTrip(trip.id);
        toast.success('Trip completed!');
        onComplete(completedTrip, cartItems);
      } catch (error) {
        console.error('Error completing trip:', error);
        toast.error('Failed to complete trip');
      }
    }
  };

  const itemsInCart = new Set(cartItems.map(ci => ci.list_item_id));
  const itemsNotInCart = listItems.filter(item => !itemsInCart.has(item.id) && !item.is_checked);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-zinc-800' : 'bg-white'} border-b border-gray-200 dark:border-zinc-700 shadow-sm`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">Shopping Trip</h2>
          <button
            onClick={handleCompleteTrip}
            className="p-2 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 rounded-lg transition-colors"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>

        {/* Budget Meter */}
        <div className="p-4">
          <div className={`p-4 rounded-xl ${
            budgetStatus.color === 'green'
              ? 'bg-green-50 dark:bg-green-900/20'
              : budgetStatus.color === 'yellow'
              ? 'bg-yellow-50 dark:bg-yellow-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {trip.store_name}
              </span>
              <span className={`text-xs font-medium ${
                budgetStatus.color === 'green'
                  ? 'text-green-700 dark:text-green-400'
                  : budgetStatus.color === 'yellow'
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {budgetStatus.percentage.toFixed(0)}% of budget
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetStatus.color === 'green'
                    ? 'bg-green-600'
                    : budgetStatus.color === 'yellow'
                    ? 'bg-yellow-600'
                    : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${trip.total_spent.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                / ${trip.budget.toFixed(2)}
              </span>
            </div>

            {budgetStatus.remaining < 0 ? (
              <div className="flex items-center space-x-2 mt-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ${Math.abs(budgetStatus.remaining).toFixed(2)} over budget!
                </span>
              </div>
            ) : budgetStatus.status === 'approaching' ? (
              <div className="flex items-center space-x-2 mt-2 text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ${budgetStatus.remaining.toFixed(2)} remaining - Almost there!
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-2 block">
                ${budgetStatus.remaining.toFixed(2)} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            {cartItems.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <ShoppingCartIcon className="h-5 w-5 text-purple-600" />
                  <span>In Cart ({cartItems.length})</span>
                </h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.item_name}</div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} {item.unit_type}
                            </div>
                          )}
                          {item.target_price && (
                            <div className={`text-xs mt-1 ${
                              item.price_paid > item.target_price
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              Target: ${item.target_price.toFixed(2)} ({item.price_paid > item.target_price ? '+' : ''}${(item.price_paid - item.target_price).toFixed(2)})
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg">
                            ${(item.price_paid * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Items */}
            {itemsNotInCart.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  <span>Add Items ({itemsNotInCart.length})</span>
                </h3>
                <div className="space-y-2">
                  {itemsNotInCart.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full p-3 rounded-lg border text-left transition-all active:scale-95 ${
                        darkMode
                          ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.item_name}</div>
                          {item.quantity && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.quantity} {item.unit_type || 'units'}
                            </div>
                          )}
                          {item.target_price && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Target: ${item.target_price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <Plus className="h-5 w-5 text-purple-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {itemsNotInCart.length === 0 && cartItems.length > 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>All list items added to cart!</p>
                <p className="text-sm mt-1">Tap the checkmark above to complete your trip</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Price Input Modal */}
      {showPriceInput && selectedItem && (
        <QuickPriceInput
          isOpen={showPriceInput}
          onClose={() => {
            setShowPriceInput(false);
            setSelectedItem(null);
          }}
          onConfirm={handleAddPrice}
          itemName={selectedItem.item_name}
          targetPrice={selectedItem.target_price || undefined}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default ShoppingTripView;
