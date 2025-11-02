import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Target, Calendar, Store } from 'lucide-react';
import { format } from 'date-fns';
import type { GroceryItem } from './groceryData';

interface ItemCardProps {
  item: GroceryItem;
  bestPrice?: number;
  darkMode: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, bestPrice, darkMode }) => {
  const isBelowTarget = item.targetPrice && item.unitPrice <= item.targetPrice;
  const isBestPrice = bestPrice && item.unitPrice === bestPrice;

  return (
    <Link to={`/item/${item.id}`}>
      <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
        darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
      } border-l-4 ${
        isBestPrice ? 'border-green-500' : isBelowTarget ? 'border-cyan-500' : 'border-purple-600'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{item.itemName}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                {item.category}
              </span>
              {item.meatQuality && (
                <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-xs">
                  {item.meatQuality}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-purple-600">
              ${item.unitPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              per {item.unitType}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
            <Store className="h-4 w-4" />
            <span>{item.storeName}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            <span>{format(item.datePurchased, 'MMM dd')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-4">
            {isBestPrice && (
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Best Price</span>
              </div>
            )}
            {isBelowTarget && !isBestPrice && (
              <div className="flex items-center space-x-1 text-cyan-600">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Below Target</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ${item.price.toFixed(2)} total
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;