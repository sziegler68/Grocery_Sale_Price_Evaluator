import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Trash2, Plus, ShoppingCart } from 'lucide-react';

interface ListHeaderProps {
  listName: string;
  shareCode: string;
  copied: boolean;
  hasActiveTrip: boolean;
  onCopyShareCode: () => void;
  onDeleteList: () => void;
  onAddItem: () => void;
  onStartTrip: () => void;
  onViewTrip: () => void;
}

export const ListHeader: React.FC<ListHeaderProps> = ({
  listName,
  shareCode,
  copied,
  hasActiveTrip,
  onCopyShareCode,
  onDeleteList,
  onAddItem,
  onStartTrip,
  onViewTrip,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/shopping-lists"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">{listName}</h1>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onCopyShareCode}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center space-x-2"
          >
            <Copy className="h-4 w-4" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={onDeleteList}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            title="Delete list"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAddItem}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>

        {hasActiveTrip ? (
          <button
            onClick={onViewTrip}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>View Active Trip</span>
          </button>
        ) : (
          <button
            onClick={onStartTrip}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Start Shopping Trip</span>
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Share Code: <span className="font-mono">{shareCode}</span>
      </p>
    </div>
  );
};
