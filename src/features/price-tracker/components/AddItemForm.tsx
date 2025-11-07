import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Plus, Calculator, Search } from 'lucide-react';
import { calculateUnitPrice as calcUnitPrice, formatPrice } from '../../../shared/utils/priceUtils';

const categories = ['Beef', 'Pork', 'Chicken', 'Seafood', 'Dairy', 'Produce', 'Snacks', 'Drinks', 'Household', 'Other'];
const beefQualities = ['Choice', 'Prime', 'Wagyu', 'Grassfed', 'Organic'];
const porkQualities = ['Regular', 'Organic'];
const chickenQualities = ['Regular', 'Organic', 'Free Range'];
const seafoodQualities = ['Fresh', 'Farm Raised', 'Frozen'];
const stores = ['Costco', 'Farmers Market', 'FoodMaxx', 'Lucky', 'Mexican Market', 'Raley', 'Ranch 99', 'Safeway', 'Sprouts', 'Trader Joes', 'Whole Foods', 'WinCo', 'Other'];
const unitTypes = ['pound', 'ounce', 'can', 'each', 'liter', 'ml', 'gallon', 'quart', 'pint', 'cup', 'tablespoon', 'teaspoon'];

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  meatQuality: z.string().optional().nullable(),
  storeName: z.string().min(1, 'Store name is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  unitType: z.string().min(1, 'Unit type is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
  targetPrice: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemFormProps {
  onSubmit: (data: FormData & { unitPrice: number; datePurchased: Date }) => void;
  existingItems?: Array<{ itemName: string; targetPrice?: number }>;
  initialData?: any;
  isEditMode?: boolean;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSubmit, existingItems = [], initialData, isEditMode = false }) => {
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(initialData?.unitPrice || null);
  const [priceDisplay, setPriceDisplay] = useState<string>(initialData?.price ? initialData.price.toFixed(2) : '');
  const [targetPriceDisplay, setTargetPriceDisplay] = useState<string>(initialData?.targetPrice ? initialData.targetPrice.toFixed(2) : '');
  const [selectedStore, setSelectedStore] = useState<string>(initialData?.storeName || '');
  const [customStoreName, setCustomStoreName] = useState<string>('');
  const [isOrganic, setIsOrganic] = useState<boolean>(initialData?.meatQuality === 'Organic' || false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{ itemName: string; targetPrice?: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      itemName: initialData.itemName,
      category: initialData.category,
      meatQuality: initialData.meatQuality,
      storeName: initialData.storeName,
      price: initialData.price,
      quantity: initialData.quantity,
      unitType: initialData.unitType,
      notes: initialData.notes,
      targetPrice: initialData.targetPrice,
    } : undefined
  });

  const watchedCategory = watch('category');
  const watchedPrice = watch('price');
  const watchedQuantity = watch('quantity');
  const watchedUnitType = watch('unitType');
  const watchedItemName = watch('itemName');
  const watchedTargetPrice = watch('targetPrice');

  // Unit price calculator - rounds up to 2 decimal places
  const calculateUnitPrice = (price: number, quantity: number): number => {
    return calcUnitPrice(price, quantity);
  };

  // Handle price input with auto-formatting
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setPriceDisplay('');
      setValue('price', 0);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setPriceDisplay(formatted);
    setValue('price', parseFloat(formatted));
  };

  // Handle target price input with auto-formatting
  const handleTargetPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setTargetPriceDisplay('');
      setValue('targetPrice', undefined);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setTargetPriceDisplay(formatted);
    setValue('targetPrice', parseFloat(formatted));
  };

  // Filter suggestions based on item name (trigger on 1+ letters, show max 3)
  useEffect(() => {
    if (!watchedItemName || watchedItemName.length < 1) {
      setSuggestions([]);
      return;
    }

    const searchTerm = watchedItemName.toLowerCase();
    const filtered = existingItems.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm)
    );

    // Get unique item names
    const uniqueItems = new Map<string, typeof existingItems[0]>();
    filtered.forEach(item => {
      const existing = uniqueItems.get(item.itemName);
      if (!existing || (item.targetPrice && !existing.targetPrice)) {
        uniqueItems.set(item.itemName, item);
      }
    });

    setSuggestions(Array.from(uniqueItems.values()).slice(0, 3));
  }, [watchedItemName, existingItems]);

  // Update dropdown position when showing
  useEffect(() => {
    if (showSuggestions && itemNameInputRef.current) {
      const rect = itemNameInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions, suggestions]);

  const handleSelectSuggestion = (item: typeof existingItems[0]) => {
    setValue('itemName', item.itemName);
    if (item.targetPrice) {
      setValue('targetPrice', item.targetPrice);
      setTargetPriceDisplay(item.targetPrice.toFixed(2));
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Auto-fill target price from existing items with same name
  React.useEffect(() => {
    if (watchedItemName && existingItems.length > 0) {
      const matchingItem = existingItems.find(
        item => item.itemName.toLowerCase() === watchedItemName.toLowerCase() && item.targetPrice != null
      );
      if (matchingItem && matchingItem.targetPrice) {
        const targetValue = matchingItem.targetPrice;
        setValue('targetPrice', targetValue);
        setTargetPriceDisplay(targetValue.toFixed(2));
      }
    }
  }, [watchedItemName, existingItems, setValue]);

  React.useEffect(() => {
    if (watchedPrice && watchedQuantity && watchedUnitType) {
      const unitPrice = calculateUnitPrice(watchedPrice, watchedQuantity);
      setCalculatedUnitPrice(unitPrice);
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [watchedPrice, watchedQuantity, watchedUnitType]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const unitPrice = calculateUnitPrice(data.price, data.quantity);
      
      // Use custom store name if "Other" is selected
      const finalStoreName = selectedStore === 'Other' ? customStoreName : data.storeName;
      
      if (!finalStoreName || finalStoreName.trim() === '') {
        toast.error('Please enter a store name');
        return;
      }
      
      // Set meatQuality to "Organic" if organic checkbox is checked and no specific quality is selected
      const finalMeatQuality = isOrganic && !data.meatQuality ? 'Organic' : data.meatQuality;
      
      await onSubmit({
        ...data,
        storeName: finalStoreName,
        meatQuality: finalMeatQuality,
        unitPrice,
        datePurchased: new Date()
      });

      reset();
      setCalculatedUnitPrice(null);
      setPriceDisplay('');
      setTargetPriceDisplay('');
      setSelectedStore('');
      setCustomStoreName('');
      setIsOrganic(false);
    } catch {
      toast.error('Failed to add item. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg bg-card">
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="h-6 w-6 text-brand" />
        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Item' : 'Check Price'}</h2>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Item Name *</label>
            <div className="relative">
              <input
                {...register('itemName')}
                ref={(e) => {
                  register('itemName').ref(e);
                  itemNameInputRef.current = e;
                }}
                type="text"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 pr-10 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="e.g., Chicken Breast"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.itemName && (
              <p className="text-red-500 text-sm mt-1">{errors.itemName.message}</p>
            )}
          </div>

          {/* Autocomplete Dropdown - Rendered via Portal */}
          {showSuggestions && suggestions.length > 0 && createPortal(
            <div
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999,
              }}
              className="rounded-lg shadow-2xl border-2 bg-white dark:bg-zinc-800 border-purple-500 max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.itemName}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-3 hover:bg-purple-100 dark:hover:bg-zinc-600 border-b border-gray-200 dark:border-zinc-600 last:border-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{item.itemName}</div>
                  {item.targetPrice && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Target: ${item.targetPrice.toFixed(2)}
                    </div>
                  )}
                </button>
              ))}
            </div>,
            document.body
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {watchedCategory === 'Beef' && (
            <div>
              <label className="block text-sm font-medium mb-2">Beef Quality</label>
              <select
                {...register('meatQuality')}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select quality (optional)</option>
                {beefQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          )}

          {watchedCategory === 'Pork' && (
            <div>
              <label className="block text-sm font-medium mb-2">Pork Quality</label>
              <select
                {...register('meatQuality')}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select quality (optional)</option>
                {porkQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          )}

          {watchedCategory === 'Chicken' && (
            <div>
              <label className="block text-sm font-medium mb-2">Chicken Quality</label>
              <select
                {...register('meatQuality')}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select quality (optional)</option>
                {chickenQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          )}

          {watchedCategory === 'Seafood' && (
            <div>
              <label className="block text-sm font-medium mb-2">Seafood Quality</label>
              <select
                {...register('meatQuality')}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select quality (optional)</option>
                {seafoodQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Store Name *</label>
            <select
              {...register('storeName')}
              value={selectedStore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStore(value);
                setValue('storeName', value);
                if (value !== 'Other') {
                  setCustomStoreName('');
                }
              }}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select store</option>
              {stores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            {errors.storeName && (
              <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>
            )}
          </div>

          {selectedStore === 'Other' && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom Store Name *</label>
              <input
                type="text"
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Enter store name"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="organic-checkbox"
              checked={isOrganic}
              onChange={(e) => setIsOrganic(e.target.checked)}
              className="w-5 h-5 rounded border-input text-brand focus:ring-2 focus:ring-brand"
            />
            <label htmlFor="organic-checkbox" className="text-sm font-medium cursor-pointer">
              Organic Product
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceInput}
                className="w-full pl-8 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Unit Type *</label>
            <select
              {...register('unitType')}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select unit</option>
              {unitTypes.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            {errors.unitType && (
              <p className="text-red-500 text-sm mt-1">{errors.unitType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Price (per unit)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={targetPriceDisplay}
                onChange={handleTargetPriceInput}
                className="w-full pl-8 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {calculatedUnitPrice && (
          <div className={`p-4 rounded-lg border ${
            watchedTargetPrice && calculatedUnitPrice > watchedTargetPrice
              ? 'bg-red-100 dark:bg-red-900/20 border-error'
              : 'bg-brand-light border-brand'
          }`}>
            <div className="flex items-center space-x-2">
              <Calculator className={`h-5 w-5 ${
                watchedTargetPrice && calculatedUnitPrice > watchedTargetPrice
                  ? 'text-error'
                  : 'text-brand'
              }`} />
              <span className="font-medium">Calculated Unit Price:</span>
              <span className={`text-lg font-bold ${
                watchedTargetPrice && calculatedUnitPrice > watchedTargetPrice
                  ? 'text-error'
                  : 'text-brand'
              }`}>
                ${formatPrice(calculatedUnitPrice)} per {watchedUnitType}
              </span>
            </div>
            {watchedTargetPrice && calculatedUnitPrice > watchedTargetPrice && (
              <div className="mt-2 flex items-start space-x-2">
                <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-600">Warning: Price Above Target!</p>
                  <p className="text-sm text-red-600">
                    This price (${formatPrice(calculatedUnitPrice)}) is higher than your target (${formatPrice(watchedTargetPrice)}) by ${formatPrice(calculatedUnitPrice - watchedTargetPrice)}.
                  </p>
                </div>
              </div>
            )}
            {watchedTargetPrice && calculatedUnitPrice <= watchedTargetPrice && (
              <div className="mt-2 flex items-center space-x-2 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Great deal! Under target price.</span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="Optional notes about this purchase..."
          />
        </div>

          <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover-bg-brand text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (isEditMode ? 'Updating Item...' : 'Adding Item...') : (isEditMode ? 'Update Item' : 'Add Item')}
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;