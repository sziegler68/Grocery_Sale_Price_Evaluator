import React, { useState } from 'react';
import { X, ShoppingCart, DollarSign } from 'lucide-react';

interface StartShoppingTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (budget: number, storeName: string, salesTaxRate: number) => void;
  listName: string;
  defaultStore?: string;
  salesTaxRate: number;
  darkMode: boolean;
}

const StartShoppingTripModal: React.FC<StartShoppingTripModalProps> = ({
  isOpen,
  onClose,
  onStart,
  listName,
  defaultStore = '',
  salesTaxRate,
  darkMode
}) => {
  const [budget, setBudget] = useState<string>('');
  const [budgetDisplay, setBudgetDisplay] = useState<string>('');
  const [storeName, setStoreName] = useState<string>(defaultStore);
  const [customSalesTax, setCustomSalesTax] = useState<number>(salesTaxRate);
  const [salesTaxDisplay, setSalesTaxDisplay] = useState<string>(salesTaxRate > 0 ? salesTaxRate.toFixed(2) : '');

  if (!isOpen) return null;

  // Handle budget input - whole dollars only
  const handleBudgetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setBudgetDisplay('');
      setBudget('');
      return;
    }
    
    const numValue = parseInt(input, 10);
    setBudgetDisplay(numValue.toString());
    setBudget(numValue.toString());
  };

  // Handle sales tax input - calculator style with decimal point
  const handleSalesTaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setSalesTaxDisplay('');
      setCustomSalesTax(0);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setSalesTaxDisplay(formatted);
    setCustomSalesTax(parseFloat(formatted));
  };

  const handleStart = () => {
    const budgetValue = parseInt(budget) || 0;
    if (budgetValue <= 0) {
      alert('Please enter a valid budget');
      return;
    }
    if (!storeName.trim()) {
      alert('Please select a store');
      return;
    }
    onStart(budgetValue, storeName, customSalesTax);
  };

  const stores = [
    'Costco',
    'Farmers Market',
    'FoodMaxx',
    'Lucky',
    'Mexican Market',
    'Raley',
    'Ranch 99',
    'Safeway',
    'Sprouts',
    'Trader Joes',
    'Whole Foods',
    'WinCo'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-xl shadow-2xl ${
        darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold">Start Shopping Trip</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* List Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Shopping List</label>
            <div className={`px-4 py-3 rounded-lg ${
              darkMode ? 'bg-zinc-700' : 'bg-gray-100'
            }`}>
              {listName}
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Store <span className="text-red-500">*</span>
            </label>
            <select
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            >
              <option value="">Select a store</option>
              {stores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Trip Budget <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="text"
                inputMode="numeric"
                value={budgetDisplay}
                onChange={handleBudgetInput}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold`}
                placeholder="250"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-400 mt-2">
              Whole dollars only (e.g., type 250 for $250)
            </p>
          </div>

          {/* Sales Tax */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sales Tax Rate
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={salesTaxDisplay}
                onChange={handleSalesTaxInput}
                className={`w-full pl-4 pr-8 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="10.25"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700">%</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-400 mt-2">
              Default: {salesTaxRate.toFixed(2)}% (from settings). Type {(salesTaxRate * 100).toFixed(0)} for calculator entry.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartShoppingTripModal;
