import React, { useState } from 'react';
import { X, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice, calculateUnitPrice } from './priceUtils';

interface QuickPriceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    price: number;
    quantity: number;
    crvAmount: number;
    updateTargetPrice: boolean;
  }) => void;
  itemName: string;
  unitType?: string;
  targetPrice?: number; // Target price PER UNIT
  salesTaxRate: number;
  darkMode: boolean;
}

const QuickPriceInput: React.FC<QuickPriceInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  unitType = '',
  targetPrice,
  salesTaxRate,
  darkMode
}) => {
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [crvEnabled, setCrvEnabled] = useState<boolean>(false);
  const [crvDisplay, setCrvDisplay] = useState<string>('');
  const [updateTarget, setUpdateTarget] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle price input - calculator style
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input === '') {
      setPriceDisplay('');
      return;
    }
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    setPriceDisplay(`${dollars}.${cents.toString().padStart(2, '0')}`);
  };

  // Handle CRV input - calculator style
  const handleCrvInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input === '') {
      setCrvDisplay('');
      return;
    }
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    setCrvDisplay(`${dollars}.${cents.toString().padStart(2, '0')}`);
  };

  // Display values
  const totalPrice = priceDisplay ? parseFloat(priceDisplay) : 0;
  const crvPerItem = crvEnabled && crvDisplay ? parseFloat(crvDisplay) : 0;
  const quantityNum = parseFloat(quantity) || 1;
  
  // Calculate unit price (price per item, NOT including CRV)
  const unitPrice = totalPrice > 0 ? calculateUnitPrice(totalPrice, quantityNum) : 0;
  
  // Calculate cart addition (total price + total CRV + tax)
  const totalCrv = crvPerItem * quantityNum; // CRV is per-item, so multiply by quantity
  const itemTotal = totalPrice + totalCrv;
  const taxAmount = itemTotal * (salesTaxRate / 100);
  const cartAddition = itemTotal + taxAmount;

  // Compare to target
  const priceDifference = targetPrice && unitPrice > 0 ? unitPrice - targetPrice : null;
  const isGoodDeal = priceDifference !== null && priceDifference <= 0;
  const isBadDeal = priceDifference !== null && priceDifference > 0;

  const handleConfirm = () => {
    if (totalPrice > 0 && quantityNum > 0) {
      onConfirm({
        price: totalPrice,
        quantity: quantityNum,
        crvAmount: totalCrv, // Pass total CRV (already multiplied by quantity)
        updateTargetPrice: updateTarget
      });
      setPriceDisplay('');
      setQuantity('1');
      setCrvDisplay('');
      setCrvEnabled(false);
      setUpdateTarget(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl ${
        darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex-1">
            <h3 className="font-bold truncate">{itemName}</h3>
            {targetPrice && unitType && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Target: ${formatPrice(targetPrice)}/{unitType}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total Price Input */}
          <div>
            <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
              Total Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceInput}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border text-xl font-semibold ${
                  darkMode
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500`}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
              Quantity{unitType ? ` (${unitType})` : ''}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border text-center text-lg font-semibold ${
                darkMode
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* Unit Price Display */}
          {unitPrice > 0 && unitType && (
            <div className={`p-3 rounded-lg ${
              isGoodDeal
                ? 'bg-green-100 dark:bg-green-900/30'
                : isBadDeal
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-gray-100 dark:bg-zinc-700'
            }`}>
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Unit Price</div>
                <div className={`text-2xl font-bold ${
                  isGoodDeal
                    ? 'text-green-700 dark:text-green-400'
                    : isBadDeal
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  ${formatPrice(unitPrice)}/{unitType}
                </div>
                {priceDifference !== null && (
                  <div className="flex items-center justify-center space-x-1 mt-1 text-sm">
                    {isGoodDeal ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 dark:text-green-400">
                          ${formatPrice(Math.abs(priceDifference))} under target
                        </span>
                      </>
                    ) : isBadDeal ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span className="text-red-700 dark:text-red-400">
                          ${formatPrice(priceDifference)} over target
                        </span>
                      </>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-400">At target price</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CRV Checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="crv-checkbox"
              checked={crvEnabled}
              onChange={(e) => {
                setCrvEnabled(e.target.checked);
                if (!e.target.checked) setCrvDisplay('');
              }}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="crv-checkbox" className="text-sm font-medium cursor-pointer flex-1">
              Item has CRV (California Redemption Value)
            </label>
          </div>

          {/* CRV Amount Input */}
          {crvEnabled && (
            <div>
              <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
                CRV Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={crvDisplay}
                  onChange={handleCrvInput}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500`}
                  placeholder="0.10"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                CRV per item: ${crvPerItem.toFixed(2)} × {quantityNum} = ${totalCrv.toFixed(2)} total
              </p>
            </div>
          )}

          {/* Update Target Price Checkbox */}
          {unitPrice > 0 && targetPrice && unitPrice !== targetPrice && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="update-target-checkbox"
                checked={updateTarget}
                onChange={(e) => setUpdateTarget(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="update-target-checkbox" className="text-sm font-medium cursor-pointer flex-1">
                Update target price to ${formatPrice(unitPrice)}/{unitType}
              </label>
            </div>
          )}

          {/* Cart Addition Summary */}
          <div className={`p-3 rounded-lg border-2 ${
            darkMode ? 'bg-zinc-900 border-purple-600' : 'bg-purple-50 border-purple-300'
          }`}>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Adding to Cart:
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Item Total:</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
              {totalCrv > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CRV ({quantityNum} × ${crvPerItem.toFixed(2)}):</span>
                  <span className="font-semibold">${totalCrv.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({salesTaxRate.toFixed(2)}%):</span>
                <span className="font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-zinc-600 font-bold text-base">
                <span>Cart Addition:</span>
                <span className="text-purple-600">${cartAddition.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2 pb-4">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                darkMode
                  ? 'bg-zinc-700 hover:bg-zinc-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalPrice === 0 || quantityNum === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                totalPrice > 0 && quantityNum > 0
                  ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
                  : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Check className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickPriceInput;
