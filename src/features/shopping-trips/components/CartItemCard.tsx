import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import type { CartItem } from '../types';

interface CartItemCardProps {
  item: CartItem;
  onEdit: (item: CartItem) => void;
  onRemove: (itemId: string) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onEdit,
  onRemove,
}) => {
  // Display stored values - NO CALCULATION!
  // Tax was calculated once and stored in the database
  const total = item.price_paid + item.tax_amount + item.crv_amount;
  
  return (
    <div className="p-3 rounded-lg bg-card border border-primary flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{item.item_name}</span>
          {item.category && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              {item.category}
            </span>
          )}
        </div>
        <div className="text-sm text-secondary mt-1">
          ${item.price_paid.toFixed(2)} + ${item.tax_amount.toFixed(2)} tax for {item.quantity} {item.unit_type || 'unit'}{item.quantity !== 1 ? 's' : ''}
          {item.crv_amount > 0 && ` + $${item.crv_amount.toFixed(2)} CRV`}
        </div>
        {item.target_price && (
          <div className={`text-xs mt-1 ${
            item.price_paid / item.quantity <= item.target_price
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            Target: ${item.target_price.toFixed(2)}/{item.unit_type}
            {item.price_paid / item.quantity <= item.target_price ? ' ✓' : ' ⚠'}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 ml-3">
        <span className="text-lg font-bold">
          ${total.toFixed(2)}
        </span>
        <button
          onClick={() => onEdit(item)}
          className="p-1 text-gray-500 hover:text-brand"
          title="Edit item"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 text-gray-500 hover:text-red-600"
          title="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
