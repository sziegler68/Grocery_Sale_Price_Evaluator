import React, { useState } from 'react';
import { X, ShoppingCart, DollarSign } from 'lucide-react';

interface StartShoppingTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (budget: number, storeName: string) => void;
  listName: string;
  defaultStore?: string;
  darkMode: boolean;
}

const StartShoppingTripModal: React.FC<StartShoppingTripModalProps> = ({
  isOpen,
  onClose,
  onStart,
  listName,
  defaultStore = '',
  darkMode
}) => {
  const [budget, setBudget] = useState<string>('150.00');
  const [storeName, setStoreName] = useState<string>(defaultStore);

  if (!isOpen) return null;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBudget(value);
  };

  const adjustBudget = (amount: number) => {
    const current = parseFloat(budget) || 0;
    const newBudget = Math.max(0, current + amount);
    setBudget(newBudget.toFixed(2));
  };

  const handleStart = () => {
    const budgetValue = parseFloat(budget);
    if (budgetValue <= 0) {
      alert('Please enter a valid budget');
      return;
    }
    if (!storeName.trim()) {
      alert('Please select a store');
      return;
    }
    onStart(budgetValue, storeName);
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => adjustBudget(-10)}
                className="px-4 py-3 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg font-medium transition-colors"
              >
                -$10
              </button>
              <div className="flex-1 relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={budget}
                  onChange={handleBudgetChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-zinc-700 border-zinc-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-center`}
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={() => adjustBudget(10)}
                className="px-4 py-3 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg font-medium transition-colors"
              >
                +$10
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Set your target budget for this shopping trip
            </p>
          </div>

          {/* Quick Budget Presets */}
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 150, 200].map(amount => (
              <button
                key={amount}
                onClick={() => setBudget(amount.toFixed(2))}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-zinc-700 hover:bg-zinc-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                ${amount}
              </button>
            ))}
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
