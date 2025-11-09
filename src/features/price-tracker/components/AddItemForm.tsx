import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Plus, Calculator, Search } from 'lucide-react';
import { calculateUnitPrice as calcUnitPrice, formatPrice } from '../../../shared/utils/priceUtils';
import { QualitySelector } from '../../../shared/components/QualitySelector';
import { CATEGORIES, STORE_NAMES, UNIT_TYPES, type QualityFlags } from '../../../shared/constants/categories';

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  storeName: z.string().min(1, 'Store name is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  unitType: z.string().min(1, 'Unit type is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
  targetPrice: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemFormProps {
  onSubmit: (data: FormData & { unitPrice: number; datePurchased: Date; quality: QualityFlags }) => void;
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
  
  // Quality state
  const [quality, setQuality] = useState<QualityFlags>({
    organic: initialData?.organic || false,
    grassFed: initialData?.grassFed || false,
    freshness: initialData?.freshness || undefined,
    meatGrade: initialData?.meatGrade || undefined,
    seafoodSource: initialData?.seafoodSource || undefined,
  });
  
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

  // Unit price calculator
  const calculateUnitPrice = (price: number, quantity: number): number => {
    return calcUnitPrice(price, quantity);
  };

  // Handle price input with auto-formatting
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
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

  // Handle target price input
  const handleTargetPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
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

  // Calculate unit price when price or quantity changes
  useEffect(() => {
    if (watchedPrice > 0 && watchedQuantity > 0) {
      const unitPrice = calculateUnitPrice(watchedPrice, watchedQuantity);
      setCalculatedUnitPrice(unitPrice);
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [watchedPrice, watchedQuantity]);

  // Auto-suggest logic
  useEffect(() => {
    if (watchedItemName && watchedItemName.length >= 2) {
      const filtered = existingItems.filter(item =>
        item.itemName.toLowerCase().includes(watchedItemName.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [watchedItemName, existingItems]);

  // Update dropdown position
  useEffect(() => {
    if (showSuggestions && itemNameInputRef.current) {
      const rect = itemNameInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showSuggestions, watchedItemName]);

  const handleSelectSuggestion = (item: { itemName: string; targetPrice?: number }) => {
    setValue('itemName', item.itemName);
    if (item.targetPrice) {
      setValue('targetPrice', item.targetPrice);
      setTargetPriceDisplay(item.targetPrice.toFixed(2));
    }
    setShowSuggestions(false);
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      if (!calculatedUnitPrice) {
        toast.error('Please enter valid price and quantity');
        return;
      }

      const unitPrice = calculatedUnitPrice;
      const finalStoreName = selectedStore === 'Other' ? customStoreName : selectedStore;
      
      if (!finalStoreName || finalStoreName.trim() === '') {
        toast.error('Please enter a store name');
        return;
      }
      
      await onSubmit({
        ...data,
        storeName: finalStoreName,
        quality,
        unitPrice,
        datePurchased: new Date()
      });

      reset();
      setCalculatedUnitPrice(null);
      setPriceDisplay('');
      setTargetPriceDisplay('');
      setSelectedStore('');
      setCustomStoreName('');
      setQuality({});
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
          {/* Item Name with Autocomplete */}
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
                placeholder="e.g., Ribeye Steak"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.itemName && (
              <p className="text-red-500 text-sm mt-1">{errors.itemName.message}</p>
            )}
          </div>

          {/* Autocomplete Dropdown */}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Quality Selector - Shows based on category */}
        {watchedCategory && (
          <div className="p-4 rounded-lg bg-secondary border border-primary">
            <QualitySelector
              category={watchedCategory}
              quality={quality}
              onChange={setQuality}
            />
          </div>
        )}

        {/* Store and Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store */}
          <div>
            <label className="block text-sm font-medium mb-2">Store *</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select store</option>
              {STORE_NAMES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            {selectedStore === 'Other' && (
              <input
                type="text"
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                placeholder="Enter store name"
                className="w-full px-4 py-3 mt-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand"
              />
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Total Price *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceInput}
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
            )}
          </div>
        </div>

        {/* Quantity and Unit Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <input
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand"
              placeholder="1"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Unit *</label>
            <select
              {...register('unitType')}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select unit</option>
              {UNIT_TYPES.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            {errors.unitType && (
              <p className="text-red-500 text-sm mt-1">{errors.unitType.message}</p>
            )}
          </div>
        </div>

        {/* Unit Price Calculator */}
        {calculatedUnitPrice !== null && watchedUnitType && (
          <div className="p-4 rounded-lg bg-brand/10 border border-brand flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-brand" />
              <span className="font-medium">Unit Price:</span>
            </div>
            <span className="text-xl font-bold text-brand">
              ${formatPrice(calculatedUnitPrice)}/{watchedUnitType}
            </span>
          </div>
        )}

        {/* Target Price */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Price (optional)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={targetPriceDisplay}
              onChange={handleTargetPriceInput}
              className="w-full pl-10 pr-20 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand"
              placeholder="0.00"
            />
            {watchedUnitType && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary">
                /{watchedUnitType}
              </span>
            )}
          </div>
          <p className="text-xs text-secondary mt-1">
            Set your ideal price per {watchedUnitType || 'unit'} for this item
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Notes (optional)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand resize-none"
            placeholder="e.g., On sale, bulk buy, etc."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-lg bg-brand hover-bg-brand text-white font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>{isEditMode ? 'Update Item' : 'Add Item'}</span>
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;
