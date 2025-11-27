import React from 'react';
import { CheckSquare, Square, Trash2, Receipt, AlertCircle } from 'lucide-react';

interface BulkActionsProps {
  hasItems: boolean;
  hasCheckedItems: boolean;
  hasUncheckedItems: boolean;
  onCheckAll: () => void;
  onUncheckAll: () => void;
  onClearAll: () => void;
  onMarkComplete: () => void;
  onMissingItems: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  hasItems,
  hasCheckedItems,
  hasUncheckedItems,
  onCheckAll,
  onUncheckAll,
  onClearAll,
  onMarkComplete,
  onMissingItems,
}) => {
  if (!hasItems) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {hasUncheckedItems && (
        <button
          onClick={onCheckAll}
          className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm flex items-center space-x-2"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Check All</span>
        </button>
      )}

      {hasCheckedItems && (
        <button
          onClick={onUncheckAll}
          className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm flex items-center space-x-2"
        >
          <Square className="h-4 w-4" />
          <span>Uncheck All</span>
        </button>
      )}

      <button
        onClick={onClearAll}
        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Clear All Items</span>
      </button>

      <button
        onClick={onMarkComplete}
        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center space-x-2"
      >
        <Receipt className="h-4 w-4" />
        <span>Mark Complete</span>
      </button>

      {hasUncheckedItems && (
        <button
          onClick={onMissingItems}
          className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm flex items-center space-x-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Report Missing</span>
        </button>
      )}
    </div>
  );
};
