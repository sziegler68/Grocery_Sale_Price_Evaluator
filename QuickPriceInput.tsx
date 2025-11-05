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
  // For editing existing cart items
  initialPrice?: number; // Total price
  initialQuantity?: number;
  initialCrv?: number; // Total CRV
}

const QuickPriceInput: React.FC<QuickPriceInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  unitType = '',
  targetPrice,
  salesTaxRate,
  darkMode,
  initialPrice,
  initialQuantity,
  initialCrv
}) => {
  const [priceDisplay, setPriceDisplay] = useState<string>(
    initialPrice ? initialPrice.toFixed(2) : ''
  );
  const [quantity, setQuantity] = useState<string>(
    initialQuantity ? initialQuantity.toString() : '1'
  );
  const [crvEnabled, setCrvEnabled] = useState<boolean>(!!initialCrv && initialCrv > 0);
  const [crvDisplay, setCrvDisplay] = useState<string>(
    initialCrv && initialCrv > 0 ? (initialCrv / (initialQuantity || 1)).toFixed(2) : ''
  );
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
  
  // Calculate cart addition
  // IMPORTANT: CRV is NOT taxed! It's added AFTER sales tax
  const totalCrv = crvPerItem * quantityNum; // CRV is per-item, so multiply by quantity
  const taxAmount = totalPrice * (salesTaxRate / 100); // Tax ONLY on item price, NOT CRV
  const cartAddition = totalPrice + taxAmount + totalCrv; // Item + Tax + CRV

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
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl bg-card text-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary">
          <div className="flex-1">
            <h3 className="font-bold truncate">{itemName}</h3>
            {targetPrice && unitType && (
              <p className="text-xs text-secondary">
                Target: ${formatPrice(targetPrice)}/{unitType}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover-bg rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total Price Input */}
          <div>
            <label className="block text-xs font-medium mb-2 text-secondary">
              Total Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceInput}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input text-xl font-semibold focus:ring-2 focus:ring-brand"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-medium mb-2 text-secondary">
              Quantity{unitType ? ` (${unitType})` : ''}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input text-center text-lg font-semibold focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Unit Price Display */}
          {unitPrice > 0 && unitType && (
            <div className={`p-3 rounded-lg ${
              isGoodDeal
                ? 'bg-green-100 dark:bg-green-900/30'
                : isBadDeal
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-secondary'
            }`}>
              <div className="text-center">
                <div className="text-xs text-secondary mb-1">Unit Price</div>
                <div className={`text-2xl font-bold ${
                  isGoodDeal
                    ? 'text-success'
                    : isBadDeal
                    ? 'text-error'
                    : 'text-primary'
                }`}>
                  ${formatPrice(unitPrice)}/{unitType}
                </div>
                {priceDifference !== null && (
                  <div className="flex items-center justify-center space-x-1 mt-1 text-sm">
                    {isGoodDeal ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-success" />
                        <span className="text-success">
                          ${formatPrice(Math.abs(priceDifference))} under target
                        </span>
                      </>
                    ) : isBadDeal ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-error" />
                        <span className="text-error">
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
              className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
            />
            <label htmlFor="crv-checkbox" className="text-sm font-medium cursor-pointer flex-1">
              Item has CRV (California Redemption Value)
            </label>
          </div>

          {/* CRV Amount Input */}
          {crvEnabled && (
            <div>
              <label className="block text-xs font-medium mb-2 text-secondary">
                CRV Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={crvDisplay}
                  onChange={handleCrvInput}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand"
                  placeholder="0.10"
                />
              </div>
              <p className="text-xs text-secondary mt-1">
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
                className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
              />
              <label htmlFor="update-target-checkbox" className="text-sm font-medium cursor-pointer flex-1">
                Update target price to ${formatPrice(unitPrice)}/{unitType}
              </label>
            </div>
          )}

          {/* Cart Addition Summary */}
          <div className="p-3 rounded-lg border-2 bg-brand-light border-brand">
            <div className="text-xs font-medium text-secondary mb-2">
              Adding to Cart:
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Item Total:</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
              {totalCrv > 0 && (
                <div className="flex justify-between">
                  <span className="text-secondary">CRV ({quantityNum} × ${crvPerItem.toFixed(2)}):</span>
                  <span className="font-semibold">${totalCrv.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({salesTaxRate.toFixed(2)}%):</span>
                <span className="font-semibold">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary font-bold text-base">
                <span>Cart Addition:</span>
                <span className="text-brand">${cartAddition.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium transition-colors bg-secondary hover-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalPrice === 0 || quantityNum === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                totalPrice > 0 && quantityNum > 0
                  ? 'bg-brand hover-bg-brand text-white active:scale-95'
                  : 'bg-secondary text-tertiary cursor-not-allowed'
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
