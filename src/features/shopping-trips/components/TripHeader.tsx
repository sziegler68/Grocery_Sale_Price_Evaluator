import React from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

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

      <p className="text-sm text-secondary mt-2">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
      </p>
    </div>
  );
};
