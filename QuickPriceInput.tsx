import React, { useState } from 'react';
import { X, Delete, Check } from 'lucide-react';

interface QuickPriceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
  itemName: string;
  targetPrice?: number;
  darkMode: boolean;
}

const QuickPriceInput: React.FC<QuickPriceInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  targetPrice,
  darkMode
}) => {
  const [value, setValue] = useState<string>('');

  if (!isOpen) return null;

  const display = value ? `$${(parseFloat(value) / 100).toFixed(2)}` : '$0.00';
  const priceValue = value ? parseFloat(value) / 100 : 0;

  const handleNumberClick = (num: string) => {
    if (value.length < 6) { // Max $9999.99
      setValue(value + num);
    }
  };

  const handleBackspace = () => {
    setValue(value.slice(0, -1));
  };

  const handleClear = () => {
    setValue('');
  };

  const handleConfirm = () => {
    if (priceValue > 0) {
      onConfirm(priceValue);
      setValue('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Enter' && priceValue > 0) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const priceDifference = targetPrice ? priceValue - targetPrice : null;
  const isAboveTarget = priceDifference !== null && priceDifference > 0;
  const isBelowTarget = priceDifference !== null && priceDifference < 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={`w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl ${
        darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex-1">
            <h3 className="font-semibold truncate">{itemName}</h3>
            {targetPrice && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Target: ${targetPrice.toFixed(2)}
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

        {/* Display */}
        <div className="p-6">
          <div className={`text-5xl font-bold text-center py-8 rounded-xl ${
            darkMode ? 'bg-zinc-900' : 'bg-gray-50'
          }`}>
            {display}
          </div>
          
          {/* Price comparison */}
          {priceDifference !== null && priceValue > 0 && (
            <div className={`mt-3 p-3 rounded-lg text-center text-sm ${
              isAboveTarget
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : isBelowTarget
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}>
              {isAboveTarget ? '?? ' : isBelowTarget ? '?? ' : ''}
              {Math.abs(priceDifference).toFixed(2)} {isAboveTarget ? 'over' : isBelowTarget ? 'under' : 'at'} target
            </div>
          )}
        </div>

        {/* Number Pad */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className={`py-4 text-2xl font-semibold rounded-xl transition-all active:scale-95 ${
                darkMode
                  ? 'bg-zinc-700 hover:bg-zinc-600'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleClear}
            className={`py-4 rounded-xl transition-all active:scale-95 ${
              darkMode
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Delete className="h-6 w-6 mx-auto" />
          </button>
          
          <button
            onClick={() => handleNumberClick('0')}
            className={`py-4 text-2xl font-semibold rounded-xl transition-all active:scale-95 ${
              darkMode
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            0
          </button>
          
          <button
            onClick={handleBackspace}
            className={`py-4 rounded-xl transition-all active:scale-95 ${
              darkMode
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <svg className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 p-4 border-t border-gray-200 dark:border-zinc-700">
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
            disabled={priceValue === 0}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
              priceValue > 0
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
  );
};

export default QuickPriceInput;
