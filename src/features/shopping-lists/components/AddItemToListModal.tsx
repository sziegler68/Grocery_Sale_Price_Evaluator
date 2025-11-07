import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Search } from 'lucide-react';
import { addItemToList } from '../api';
import { fetchAllItems } from '../../price-tracker/api/groceryData';
import { mapToShoppingListCategory, SHOPPING_LIST_CATEGORIES } from '../types';
import { getUserNameForList } from '../../../shared/utils/listUserNames';
import { notifyItemsAdded } from '../../notifications/api';
import { toast } from 'react-toastify';
import type { GroceryItem } from '../../price-tracker/api/groceryData';

interface AddItemToListModalProps {
  listId: string;
  shareCode: string;
  listName: string;
  onClose: () => void;
  onAdded: () => void;
}

const AddItemToListModal: React.FC<AddItemToListModalProps> = ({
  listId,
  shareCode,
  listName,
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Load items from price database for autocomplete
  useEffect(() => {
    const loadItems = async () => {
      try {
        const result = await fetchAllItems();
        console.log('[AddItemModal] Loaded price database items:', result.items.length, 'items');
        setPriceDbItems(result.items);
      } catch (error) {
        console.error('[AddItemModal] Failed to load price database:', error);
      }
    };
    loadItems();
  }, []);

  // Filter suggestions based on item name (trigger on 1+ letters, show max 3)
  useEffect(() => {
    if (itemName.length < 1) {
      setSuggestions([]);
      return;
    }

    const searchTerm = itemName.toLowerCase();
    const filtered = priceDbItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm)
    );

    console.log('[AddItemModal] Search term:', searchTerm, 'Filtered:', filtered.length);

    // Get unique item names with their most common target price
    const uniqueItems = new Map<string, GroceryItem>();
    filtered.forEach(item => {
      const existing = uniqueItems.get(item.itemName);
      if (!existing || (item.targetPrice && !existing.targetPrice)) {
        uniqueItems.set(item.itemName, item);
      }
    });

    const suggestionsList = Array.from(uniqueItems.values()).slice(0, 3);
    console.log('[AddItemModal] Suggestions:', suggestionsList.length, 'items');
    setSuggestions(suggestionsList);
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

  // Update dropdown position when showing
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, suggestions]);

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
        className="w-full max-w-md rounded-xl shadow-xl max-h-[90vh] flex flex-col bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary bg-inherit">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto overflow-x-visible">
          {/* Item Name with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              Item Name * 
              <span className="text-xs text-gray-500 ml-2">
                ({priceDbItems.length} items loaded)
              </span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Start typing..."
                className="w-full px-4 py-3 pr-10 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                autoFocus
                disabled={isAdding}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Debug info */}
            {itemName.length >= 2 && (
              <div className="text-xs text-gray-500 mt-1">
                Showing {suggestions.length} suggestions for "{itemName}"
              </div>
            )}
          </div>

          {/* Suggestions Dropdown - Rendered via Portal */}
          {showSuggestions && suggestions.length > 0 && createPortal(
            <div
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999,
              }}
              className="rounded-lg shadow-2xl border-2 bg-white dark:bg-zinc-800 border-purple-500 max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
            >
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-zinc-600 border-b border-gray-200 dark:border-zinc-600 last:border-0 transition-colors`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{item.itemName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {item.category}
                    {item.targetPrice && ` • Target: $${item.targetPrice.toFixed(2)}/${item.unitType}`}
                  </div>
                </button>
              ))}
            </div>,
            document.body
          )}

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
