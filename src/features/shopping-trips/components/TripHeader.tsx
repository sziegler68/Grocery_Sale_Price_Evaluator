import React from 'react';
import { ArrowLeft, ShoppingCart, Info } from 'lucide-react';

interface TripHeaderProps {
  storeName: string;
  itemCount: number;
  onBack: () => void;
  onComplete: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  storeName,
  itemCount,
  onBack,
  onComplete,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Shopping Trip</h1>
            <p className="text-sm text-secondary">{storeName}</p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Complete Trip</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <p className="text-sm text-secondary">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
        </p>
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 cursor-help" />
          <div className="hidden group-hover:block absolute left-0 top-6 z-50 w-72 p-3 rounded-lg shadow-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-xs">
            <p className="text-primary font-medium mb-1">📊 Price History</p>
            <p className="text-secondary">
              Items added to your cart are automatically saved to your price database. 
              Even if you remove them from the cart, they stay in your price history for future reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
