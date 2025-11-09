import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Target, Calendar, Store, AlertTriangle, Flag } from 'lucide-react';
import { format } from 'date-fns';
import type { GroceryItem } from '../api/groceryData';
import { getUnitPreferences } from '../../../shared/components/Settings';
import { normalizePrice } from '../../../shared/utils/unitConversion';

interface ItemCardProps {
  item: GroceryItem;
  bestPrice?: number;
  darkMode: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, bestPrice, darkMode }) => {
  const [showEstimateTooltip, setShowEstimateTooltip] = useState(false);
  const preferences = getUnitPreferences();
  const normalized = normalizePrice(item.price, item.quantity, item.unitType, preferences, item.category, item.itemName);
  
  const isBelowTarget = item.targetPrice && item.unitPrice <= item.targetPrice;
  const isAboveTarget = item.targetPrice && item.unitPrice > item.targetPrice;
  const isBestPrice = bestPrice && item.unitPrice === bestPrice;

  return (
    <Link to={`/item/${item.id}`}>
      <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
        darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-gray-50'
      } border-l-4 ${
        isAboveTarget ? 'border-red-500' : isBelowTarget ? 'border-cyan-500' : isBestPrice ? 'border-green-500' : 'border-brand'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{item.itemName}</h3>
            <div className="flex items-center space-x-2 text-sm text-secondary">
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
            <div className="flex items-center justify-end space-x-1">
              <div className="text-xl font-bold text-brand">
                ${normalized.price.toFixed(2)}
              </div>
              {normalized.usedEstimate && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEstimateTooltip(!showEstimateTooltip);
                    }}
                    className="text-amber-500 hover:text-amber-600"
                    title="Using estimated weight"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                  {showEstimateTooltip && (
                    <div className={`absolute right-0 top-6 z-50 w-64 p-3 rounded-lg shadow-xl border ${
                      darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <Flag className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-semibold mb-1">Estimated Weight Used</p>
                          <p className="text-primary mb-1">
                            This item was priced "per each" and converted using an estimated weight of <strong>{normalized.estimate?.weight} lb</strong> per item.
                          </p>
                          <p className="text-secondary italic">
                            {normalized.estimate?.notes}
                          </p>
                          <p className="text-secondary mt-1 text-[10px]">
                            Confidence: {normalized.estimate?.confidence}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-secondary">
              per {normalized.unit}
            </div>
            {normalized.isNormalized && normalized.originalPrice && normalized.originalUnit && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                (${normalized.originalPrice.toFixed(2)}/{normalized.originalUnit})
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-primary">
            <Store className="h-4 w-4" />
            <span>{item.storeName}</span>
          </div>
          <div className="flex items-center space-x-1 text-primary">
            <Calendar className="h-4 w-4" />
            <span>{format(item.datePurchased, 'MMM dd')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary">
          <div className="flex items-center space-x-4">
            {isAboveTarget && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Above Target</span>
              </div>
            )}
            {isBelowTarget && (
              <div className="flex items-center space-x-1 text-cyan-600">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Below Target</span>
              </div>
            )}
            {isBestPrice && !isAboveTarget && !isBelowTarget && (
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Best Price</span>
              </div>
            )}
          </div>
          <div className="text-xs text-secondary">
            ${item.price.toFixed(2)} total
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;