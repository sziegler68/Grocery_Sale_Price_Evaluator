import React, { useEffect, useState } from 'react';
import Header from '../../../shared/components/Header';
import Footer from '../../../shared/components/Footer';
import { toast } from 'react-toastify';
import AddItemForm from './AddItemForm';
import { fetchAllItems, type GroceryItem } from '../api/groceryData';
import { ingestGroceryItem } from '../services/itemIngestion';
import { useDarkMode } from '../../../shared/hooks/useDarkMode';

const AddItem: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [existingItems, setExistingItems] = useState<GroceryItem[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const result = await fetchAllItems();
      setExistingItems(result.items);
    };
    void loadItems();
  }, []);

  const handleSubmit = async (data: any) => {
    // Use ingestion service with validation, normalization, and fuzzy matching
    const result = await ingestGroceryItem({
      itemName: data.itemName,
      price: data.price,
      quantity: data.quantity,
      storeName: data.storeName,
      unitType: data.unitType,
      category: data.category,
      targetPrice: data.targetPrice,
      // New quality fields
      organic: data.quality?.organic,
      grassFed: data.quality?.grassFed,
      freshness: data.quality?.freshness,
      meatGrade: data.quality?.meatGrade,
      seafoodSource: data.quality?.seafoodSource,
      // Legacy field (kept for backwards compatibility)
      meatQuality: data.meatQuality,
      notes: data.notes,
      datePurchased: data.datePurchased,
    }, {
      skipDuplicateCheck: false, // Enable smart duplicate detection
      fuzzyThreshold: 0.85, // 85% similarity threshold
    });

    if (result.success) {
      toast.success('Item added successfully!');
      // Reload items to show the new one
      const refreshed = await fetchAllItems();
      setExistingItems(refreshed.items);
    } else if (result.matchFound) {
      // Duplicate detected - show warning with match info
      const { existingItem, similarity, suggestedAction } = result.matchFound;
      const matchPercent = Math.round(similarity * 100);
      
      if (suggestedAction === 'update') {
        toast.warning(
          `Similar item found: "${existingItem.itemName}" (${matchPercent}% match). This looks like a duplicate. Consider updating the existing item instead.`,
          { autoClose: 8000 }
        );
      } else {
        toast.info(
          `Possible duplicate: "${existingItem.itemName}" (${matchPercent}% match). If this is a new item, try again with a more specific name.`,
          { autoClose: 8000 }
        );
      }
    } else {
      // Validation or creation error
      toast.error(result.error || 'Failed to save item');
    }
  };

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Price Checker</h1>
          <p className="text-primary mt-2">
            Check if the current price of an item is a good deal compared to your target price.
          </p>
        </div>
        <AddItemForm onSubmit={handleSubmit} existingItems={existingItems} />
      </main>

      <Footer />
    </div>
  );
};

export default AddItem;