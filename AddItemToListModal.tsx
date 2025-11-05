import React, { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { addItemToList } from './shoppingListApi';
import { fetchAllItems } from './groceryData';
import { mapToShoppingListCategory, SHOPPING_LIST_CATEGORIES } from './shoppingListTypes';
import { getUserNameForList } from './listUserNames';
import { notifyItemsAdded } from './notificationService';
import { toast } from 'react-toastify';
import type { GroceryItem } from './groceryData';

interface AddItemToListModalProps {
  listId: string;
  shareCode: string;
  listName: string;
  darkMode: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddItemToListModal: React.FC<AddItemToListModalProps> = ({
  listId,
  shareCode,
  listName,
  darkMode,
  onClose,
  onAdded,
}) => {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitType, setUnitType] = useState('');
  const [targetPrice, setTargetPrice] = useState<number | undefined>();
  const [targetPriceDisplay, setTargetPriceDisplay] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [priceDbItems, setPriceDbItems] = useState<GroceryItem[]>([]);
  const [suggestions, setSuggestions] = useState<GroceryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load items from price database for autocomplete
  useEffect(() => {
    const loadItems = async () => {
      try {
        const result = await fetchAllItems();
        setPriceDbItems(result.items);
      } catch (error) {
        console.error('Failed to load price database:', error);
      }
    };
    loadItems();
  }, []);

  // Filter suggestions based on item name
  useEffect(() => {
    if (itemName.length < 2) {
      setSuggestions([]);
      return;
    }

    const searchTerm = itemName.toLowerCase();
    const filtered = priceDbItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm)
    );

    // Get unique item names with their most common target price
    const uniqueItems = new Map<string, GroceryItem>();
    filtered.forEach(item => {
      const existing = uniqueItems.get(item.itemName);
      if (!existing || (item.targetPrice && !existing.targetPrice)) {
        uniqueItems.set(item.itemName, item);
      }
    });

    setSuggestions(Array.from(uniqueItems.values()).slice(0, 5));
  }, [itemName, priceDbItems]);

  // Handle target price input with auto-formatting (fills from right to left)
  const handleTargetPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setTargetPriceDisplay('');
      setTargetPrice(undefined);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setTargetPriceDisplay(formatted);
    setTargetPrice(parseFloat(formatted));
  };

  const handleSelectSuggestion = (item: GroceryItem) => {
    setItemName(item.itemName);
    setCategory(mapToShoppingListCategory(item.category));
    setUnitType(item.unitType);
    if (item.targetPrice) {
      setTargetPrice(item.targetPrice);
      setTargetPriceDisplay(item.targetPrice.toFixed(2));
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemName.trim() === '') {
      toast.error('Please enter an item name');
      return;
    }

    if (category === '') {
      toast.error('Please select a category');
      return;
    }

    setIsAdding(true);
    try {
      const userName = getUserNameForList(shareCode);
      
      await addItemToList({
        list_id: listId,
        item_name: itemName.trim(),
        category,
        quantity: parseFloat(quantity) || 1,
        unit_type: unitType || undefined,
        target_price: targetPrice,
        notes: notes.trim() || undefined,
        added_by: userName || undefined,
      });

      // Send notification (throttled) - don't block on this
      if (userName) {
        notifyItemsAdded(listId, listName, 1, userName).catch(err => {
          console.warn('Failed to send notification:', err);
        });
      }

      toast.success('Item added!');
      onAdded();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add item';
      toast.error(errorMessage);
      console.error('Error adding item:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="w-full max-w-md rounded-xl shadow-xl max-h-[90vh] overflow-y-auto bg-card"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-primary bg-inherit">
          <div className="flex items-center space-x-2">
            <Plus className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold">Add Item</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Name with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Item Name *</label>
            <div className="relative">
              <input
                type="text"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Start typing..."
                className="w-full px-4 py-3 pr-10 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                autoFocus
                disabled={isAdding}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute z-20 w-full mt-1 rounded-lg shadow-lg border bg-input border-primary max-h-60 overflow-y-auto"
              >
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-zinc-600 border-b border-gray-100 dark:border-zinc-600 last:border-0`}
                  >
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-secondary">
                      {item.category}
                      {item.targetPrice && ` ? Target: $${item.targetPrice.toFixed(2)}/${item.unitType}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              disabled={isAdding}
            >
              <option value="">Select category</option>
              {SHOPPING_LIST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={isAdding}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <input
                type="text"
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                placeholder="lb, gal, each"
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={isAdding}
              />
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Target Price (per unit)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetPriceDisplay}
                onChange={handleTargetPriceInput}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={isAdding}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Get the organic one"
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              disabled={isAdding}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdding}
              className="flex-1 px-4 py-3 rounded-lg border border-input hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || itemName.trim() === '' || category === ''}
              className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemToListModal;
