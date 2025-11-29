import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import type { ShoppingTrip, CartItem } from '../types';
import type { ShoppingListItem } from '../../shopping-lists/types';
import { calculateBudgetStatus } from '../types';
import { useShoppingTripStore } from '../store/useShoppingTripStore';
import { updateItem as updateListItem } from '../../shopping-lists/api';
import { SHOPPING_LIST_CATEGORIES } from '../../shopping-lists/types';
import QuickPriceInput from '../../price-tracker/components/QuickPriceInput';
import { toast } from 'react-toastify';
import { getSalesTaxRate } from '../../../shared/components/Settings';
import { BudgetMeter } from './BudgetMeter';
import { TripHeader } from './TripHeader';
import { CartItemCard } from './CartItemCard';
import EditBudgetModal from './EditBudgetModal';
import { TripScanner } from '../../price-tracker/components/TripScanner';

interface ShoppingTripViewProps {
  trip: ShoppingTrip;
  listItems: ShoppingListItem[];
  onBack: () => void;
  onComplete: (trip: ShoppingTrip, cartItems: CartItem[]) => void;
}

const ShoppingTripView: React.FC<ShoppingTripViewProps> = ({
  trip: initialTrip,
  listItems,
  onBack,
  onComplete
}) => {
  // Use store for ALL trip state - no local duplication
  const {
    currentTrip,
    cartItems, // Use store cartItems directly
    isLoading,
    addToCart,
    updateCartItem: updateCartItemStore,
    removeFromCart,
    finishTrip,
    loadTrip,
    subscribeToCartUpdates,
    subscribeToTripUpdates
  } = useShoppingTripStore();

  // Use current trip from store or initial prop
  const trip = currentTrip || initialTrip;
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);

  const budgetStatus = calculateBudgetStatus(trip.total_spent, trip.budget);

  // Load trip into store on mount
  useEffect(() => {
    if (initialTrip) {
      loadTrip(initialTrip.id);
    }
  }, [initialTrip.id, loadTrip]);

  // Subscribe to real-time updates for BOTH cart items AND trip total via store
  useEffect(() => {
    // Subscribe to cart_items changes
    const unsubscribeCart = subscribeToCartUpdates(trip.id);

    // Subscribe to shopping_trips changes (for budget meter)
    const unsubscribeTrip = subscribeToTripUpdates(trip.id);

    return () => {
      unsubscribeCart();
      unsubscribeTrip();
    };
  }, [trip.id, subscribeToCartUpdates, subscribeToTripUpdates]);

  const handleItemClick = (item: ShoppingListItem) => {
    // Check if already in cart
    const inCart = cartItems.some(ci => ci.list_item_id === item.id);
    if (inCart) {
      toast.info('Item already in cart. Click on the cart item to edit it.');
      return;
    }

    setSelectedItem(item);
    setEditingCartItem(null);
    setShowPriceInput(true);
  };

  const handleAddNewItem = () => {
    setSelectedItem({
      id: '', // Empty ID for new item
      list_id: trip.list_id,
      item_name: 'New Item',
      category: 'Other',
      quantity: 1,
      unit_type: null,
      target_price: null,
      is_checked: false,
      checked_at: null,
      notes: null,
      added_by: 'user',
      added_at: new Date().toISOString()
    });
    setEditingCartItem(null);
    setIsAddingNewItem(true);
    setShowPriceInput(true);
  };

  const handleCartItemClick = (cartItem: CartItem) => {
    // Find the corresponding list item for metadata
    const listItem = listItems.find(li => li.id === cartItem.list_item_id);

    setEditingCartItem(cartItem);
    setSelectedItem(listItem || {
      id: cartItem.list_item_id || '',
      item_name: cartItem.item_name,
      unit_type: cartItem.unit_type,
      category: cartItem.category,
      target_price: cartItem.target_price
    } as ShoppingListItem);
    setShowPriceInput(true);
  };

  const handleAddPrice = async (data: {
    price: number;
    quantity: number;
    taxAmount: number;  // Calculated tax from QuickPriceInput
    crvAmount: number;
    updateTargetPrice: boolean;
    name?: string;
    unitType?: string;
    onSale: boolean;
  }) => {
    if (!selectedItem) return;

    try {
      // Store TOTAL price (user's input), calculated tax, and CRV
      if (editingCartItem) {
        // Update existing cart item using store action
        await updateCartItemStore(editingCartItem.id, {
          price_paid: data.price, // Store total price as entered
          tax_amount: data.taxAmount, // Store calculated tax
          quantity: data.quantity,
          crv_amount: data.crvAmount,
          item_name: data.name, // Update name if changed
          unit_type: data.unitType, // Update unit if changed
          on_sale: data.onSale
        });
        toast.success(`Updated ${data.name || selectedItem.item_name}`);
      } else {
        // Add new item to cart using store action
        await addToCart({
          trip_id: trip.id,
          list_item_id: selectedItem.id || undefined, // Undefined for new items
          item_name: data.name || selectedItem.item_name,
          price_paid: data.price, // Store total price as entered
          tax_amount: data.taxAmount, // Store calculated tax
          quantity: data.quantity,
          unit_type: data.unitType || selectedItem.unit_type || undefined,
          category: selectedItem.category || undefined,
          target_price: selectedItem.target_price || undefined,
          crv_amount: data.crvAmount,
          on_sale: data.onSale
        });
        toast.success(`Added ${data.name || selectedItem.item_name} to cart`);
      }

      // Update target price if requested
      if (data.updateTargetPrice && data.quantity > 0 && selectedItem.id) {
        const newTargetPrice = data.price / data.quantity;
        try {
          await updateListItem(selectedItem.id, { target_price: newTargetPrice });
          toast.success(`Updated target price to $${newTargetPrice.toFixed(2)}/${selectedItem.unit_type || 'unit'}`);
        } catch (error) {
          console.error('Failed to update target price:', error);
          toast.error('Failed to update target price');
        }
      }

      // Reload trip data to update budget meter
      await loadTrip(trip.id);

      setSelectedItem(null);
      setEditingCartItem(null);
      setIsAddingNewItem(false);
      setShowPriceInput(false);
    } catch (error) {
      console.error('Error saving cart item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleRemoveFromCart = async (cartItem: CartItem) => {
    try {
      // Use store action to remove item
      await removeFromCart(cartItem.id);
      toast.success(`Removed ${cartItem.item_name} from cart (price saved to history)`);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleCompleteTrip = async () => {
    if (window.confirm('Complete this shopping trip?')) {
      try {
        // Use store action to complete trip
        await finishTrip(trip.id);
        toast.success('Trip completed!');
        // Call the callback with the trip data
        onComplete(trip, cartItems);
      } catch (error) {
        console.error('Error completing trip:', error);
        toast.error('Failed to complete trip');
      }
    }
  };

  const itemsInCart = new Set(cartItems.map(ci => ci.list_item_id));
  const availableItems = listItems.filter(item => !itemsInCart.has(item.id) && !item.is_checked);

  // Group available items by category (same sorting as shopping list)
  const groupedAvailableItems = useMemo(() => {
    const groups = availableItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    // Return in category order
    return SHOPPING_LIST_CATEGORIES.map(category => ({
      category,
      items: groups[category] || [],
    })).filter(group => group.items.length > 0);
  }, [availableItems]);

  // Cart items: keep in order added (no sorting)

  return (
    <div className="h-full flex flex-col relative bg-primary">
      {/* Subtle moon and stars background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-8 right-12 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200/20 to-yellow-300/10 dark:from-blue-200/10 dark:to-purple-200/5 blur-sm" />
        <div className="absolute top-24 left-8 w-1 h-1 rounded-full bg-yellow-400/30 dark:bg-blue-300/20" />
        <div className="absolute top-32 right-24 w-1 h-1 rounded-full bg-yellow-400/30 dark:bg-blue-300/20" />
        <div className="absolute top-48 left-20 w-1.5 h-1.5 rounded-full bg-yellow-400/40 dark:from-purple-300/20" />
        <div className="absolute top-64 right-16 w-1 h-1 rounded-full bg-yellow-400/30 dark:bg-blue-300/20" />
        <div className="absolute bottom-32 left-12 w-1 h-1 rounded-full bg-yellow-400/30 dark:bg-blue-300/20" />
        <div className="absolute bottom-48 right-20 w-1.5 h-1.5 rounded-full bg-yellow-400/40 dark:bg-purple-300/20" />
      </div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-primary shadow-sm relative">
        <div className="p-4">
          <TripHeader
            storeName={trip.store_name}
            itemCount={cartItems.length}
            onBack={onBack}
            onComplete={handleCompleteTrip}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleAddNewItem}
              className="flex items-center space-x-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors px-3 py-1.5 rounded-lg bg-brand-light/50 hover:bg-brand-light"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>
          <BudgetMeter
            totalSpent={trip.total_spent}
            budget={trip.budget}
            budgetStatus={budgetStatus}
            onEditBudget={() => setShowEditBudget(true)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : (
          <>
            {/* Available Items (grouped by category) */}
            {groupedAvailableItems.length > 0 && (
              <div className="p-4 space-y-6">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <ShoppingCartIcon className="h-5 w-5 text-brand" />
                  <span>On the List ({availableItems.length})</span>
                </h3>
                {groupedAvailableItems.map(({ category, items: categoryItems }) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-brand mb-2 uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="w-full p-3 rounded-lg border text-left transition-all active:scale-95 bg-card border-primary hover-bg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{item.item_name}</div>
                              {item.quantity && (
                                <div className="text-xs text-secondary">
                                  {item.quantity} {item.unit_type || 'units'}
                                </div>
                              )}
                              {item.target_price && (
                                <div className="text-xs text-secondary mt-1">
                                  Target: ${item.target_price.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <Plus className="h-5 w-5 text-brand" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Items (below available items, unsorted) */}
            {cartItems.length > 0 && (
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center space-x-2">
                  <ShoppingCartIcon className="h-5 w-5 text-brand" />
                  <span>In Cart ({cartItems.length})</span>
                </h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} onClick={() => handleCartItemClick(item)}>
                      <CartItemCard
                        item={item}
                        onEdit={handleCartItemClick}
                        onRemove={(itemId) => {
                          const item = cartItems.find(ci => ci.id === itemId);
                          if (item) handleRemoveFromCart(item);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableItems.length === 0 && cartItems.length > 0 && (
              <div className="p-8 text-center text-secondary">
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
            setEditingCartItem(null);
          }}
          onConfirm={handleAddPrice}
          itemName={selectedItem.item_name}
          unitType={selectedItem.unit_type || undefined}
          targetPrice={selectedItem.target_price || undefined}
          salesTaxRate={trip.sales_tax_rate || getSalesTaxRate()}
          category={selectedItem.category || undefined}
          initialPrice={editingCartItem?.price_paid}
          initialQuantity={editingCartItem?.quantity}
          initialCrv={editingCartItem?.crv_amount}
          isEditable={isAddingNewItem || !!editingCartItem}
          initialOnSale={editingCartItem?.on_sale}
        />
      )}

      {/* Edit Budget Modal */}
      <EditBudgetModal
        isOpen={showEditBudget}
        onClose={() => setShowEditBudget(false)}
        tripId={trip.id}
        currentBudget={trip.budget}
        onBudgetUpdated={async (newBudget) => {
          await loadTrip(trip.id);
          toast.success(`Budget updated to $${newBudget.toFixed(2)}`);
        }}
      />

      {/* Trip Scanner (AI-powered price tag scanning) */}
      <TripScanner
        shoppingList={availableItems}
        onItemScanned={(item, priceData) => {
          // Auto-populate QuickPriceInput with scanned data
          setSelectedItem(item);
          setEditingCartItem(null);
          setShowPriceInput(true);

          toast.info(`Scanned: ${priceData.itemName} - $${priceData.totalPrice?.toFixed(2)}`);
        }}
        onCreateNewItem={(priceData) => {
          // Create new item from scanned data
          setSelectedItem({
            id: '',
            list_id: trip.list_id,
            item_name: priceData.itemName,
            category: 'Other',
            quantity: 1,
            unit_type: priceData.unitPriceUnit || null,
            target_price: priceData.unitPrice || null,
            is_checked: false,
            checked_at: null,
            notes: null,
            added_by: 'user',
            added_at: new Date().toISOString()
          });
          setEditingCartItem(null);
          setIsAddingNewItem(true);
          setShowPriceInput(true);
          toast.info(`Creating new item: ${priceData.itemName}`);
        }}
      />
    </div>
  );
};

export default ShoppingTripView;
