import React, { useState } from 'react';
import { Check, X, Edit2, Trash2 } from 'lucide-react';
import type { ShoppingListItem as ShoppingListItemType } from './shoppingListTypes';
import { checkItem, uncheckItem, deleteItem, updateItem } from './shoppingListApi';
import { toast } from 'react-toastify';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  darkMode: boolean;
  onUpdate: () => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, darkMode, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.item_name);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckToggle = async () => {
    // Optimistic update - don't show loading state
    try {
      if (item.is_checked) {
        await uncheckItem(item.id);
      } else {
        await checkItem(item.id);
      }
      // Trigger parent to refresh data in background
      onUpdate();
    } catch (error) {
      toast.error('Failed to update item');
      console.error(error);
      // Trigger update to revert on error
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this item?')) return;
    
    setIsLoading(true);
    try {
      await deleteItem(item.id);
      toast.success('Item deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete item');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editName.trim() === '') {
      toast.error('Item name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateItem(item.id, { item_name: editName.trim() });
      toast.success('Item updated');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update item');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(item.item_name);
    setIsEditing(false);
  };

  return (
    <div
      className={`flex items-start space-x-3 p-3 rounded-lg ${
        darkMode ? 'bg-zinc-700' : 'bg-gray-50'
      } ${item.is_checked ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckToggle}
        disabled={isLoading}
        className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.is_checked
            ? 'bg-green-600 border-green-600'
            : darkMode
            ? 'border-zinc-500 hover:border-purple-500'
            : 'border-gray-400 hover:border-purple-500'
        }`}
      >
        {item.is_checked && <Check className="h-4 w-4 text-white" />}
      </button>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={`flex-1 px-2 py-1 rounded border focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-zinc-600 border-zinc-500' : 'bg-white border-gray-300'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isLoading}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className={`font-medium ${item.is_checked ? 'line-through' : ''}`}>
              {item.item_name}
              {item.quantity && item.quantity > 1 && (
                <span className="ml-2 text-sm text-gray-500">?{item.quantity}</span>
              )}
            </div>
            {item.target_price && item.unit_type && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Target: ${item.target_price.toFixed(2)}/{item.unit_type}
              </div>
            )}
            {item.notes && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                {item.notes}
              </div>
            )}
            {item.added_by && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Added by {item.added_by}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      {!isEditing && !item.is_checked && (
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-purple-600"
            title="Edit item"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-red-600"
            title="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingListItem;
