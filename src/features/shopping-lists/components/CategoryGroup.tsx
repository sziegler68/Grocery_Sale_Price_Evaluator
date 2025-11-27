import React from 'react';
import ShoppingListItem from './ShoppingListItem';
import type { ShoppingListItem as ShoppingListItemType } from '../types';

interface CategoryGroupProps {
  category: string;
  items: ShoppingListItemType[];
  darkMode: boolean;
  onUpdate: () => void;
  onOptimisticCheck?: (itemId: string, newCheckedState: boolean) => void;
  listId?: string;
  listName?: string;
  shareCode?: string;
}

export const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  items,
  darkMode,
  onUpdate,
  onOptimisticCheck,
  listId,
  listName,
  shareCode,
}) => {
  const checkedCount = items.filter(item => item.is_checked).length;
  const totalCount = items.length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
          {category}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {checkedCount}/{totalCount}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            darkMode={darkMode}
            onUpdate={onUpdate}
            onOptimisticCheck={onOptimisticCheck}
            listId={listId}
            listName={listName}
            shareCode={shareCode}
          />
        ))}
      </div>
    </div>
  );
};
