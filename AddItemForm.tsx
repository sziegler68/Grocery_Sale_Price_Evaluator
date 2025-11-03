import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Plus, Calculator } from 'lucide-react';

const categories = ['Meat', 'Dairy', 'Produce', 'Snacks', 'Drinks', 'Household', 'Other'];
const meatQualities = ['Choice', 'Prime', 'Wagyu'];
const unitTypes = ['pound', 'ounce', 'can', 'each', 'liter', 'ml', 'gallon', 'quart', 'pint', 'cup', 'tablespoon', 'teaspoon'];

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  meatQuality: z.string().optional(),
  storeName: z.string().min(1, 'Store name is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  unitType: z.string().min(1, 'Unit type is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
  targetPrice: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemFormProps {
  darkMode: boolean;
  onSubmit: (data: FormData & { unitPrice: number; datePurchased: Date }) => void;
  existingItems?: Array<{ itemName: string; targetPrice?: number }>;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ darkMode, onSubmit, existingItems = [] }) => {
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(null);
  const [priceDisplay, setPriceDisplay] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const watchedCategory = watch('category');
  const watchedPrice = watch('price');
  const watchedQuantity = watch('quantity');
  const watchedUnitType = watch('unitType');
  const watchedItemName = watch('itemName');

  // Unit price calculator - simply divide price by quantity
  const calculateUnitPrice = (price: number, quantity: number): number => {
    return price / quantity;
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

  // Auto-fill target price from existing items with same name
  React.useEffect(() => {
    if (watchedItemName && existingItems.length > 0) {
      const matchingItem = existingItems.find(
        item => item.itemName.toLowerCase() === watchedItemName.toLowerCase() && item.targetPrice != null
      );
      if (matchingItem && matchingItem.targetPrice) {
        setValue('targetPrice', matchingItem.targetPrice);
      }
    }
  }, [watchedItemName, existingItems, setValue]);

  React.useEffect(() => {
    if (watchedPrice && watchedQuantity && watchedUnitType) {
      const unitPrice = calculateUnitPrice(watchedPrice, watchedQuantity);
      setCalculatedUnitPrice(unitPrice);
    }
  }, [watchedPrice, watchedQuantity, watchedUnitType]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const unitPrice = calculateUnitPrice(data.price, data.quantity);
      
      await onSubmit({
        ...data,
        unitPrice,
        datePurchased: new Date()
      });

      reset();
      setCalculatedUnitPrice(null);
      setPriceDisplay('');
    } catch {
      toast.error('Failed to add item. Please try again.');
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 rounded-xl shadow-lg ${
      darkMode ? 'bg-zinc-800' : 'bg-white'
    }`}>
      <div className="flex items-center space-x-2 mb-6">
        <Plus className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Add New Item</h2>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Item Name *</label>
            <input
              {...register('itemName')}
              type="text"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
              placeholder="e.g., Chicken Breast"
            />
            {errors.itemName && (
              <p className="text-red-500 text-sm mt-1">{errors.itemName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              {...register('category')}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
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

          {watchedCategory === 'Meat' && (
            <div>
              <label className="block text-sm font-medium mb-2">Meat Quality</label>
              <select
                {...register('meatQuality')}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select quality</option>
                {meatQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Store Name *</label>
            <input
              {...register('storeName')}
              type="text"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
              placeholder="e.g., Walmart"
            />
            {errors.storeName && (
              <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceInput}
                className={`w-full pl-8 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                }`}
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
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
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
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
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
            <input
              {...register('targetPrice', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
        </div>

        {calculatedUnitPrice && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'} border border-purple-200`}>
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Calculated Unit Price:</span>
              <span className="text-lg font-bold text-purple-600">
                ${calculatedUnitPrice.toFixed(4)} per {watchedUnitType}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
            }`}
            placeholder="Optional notes about this purchase..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding Item...' : 'Add Item'}
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;