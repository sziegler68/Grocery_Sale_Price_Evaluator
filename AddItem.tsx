import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { toast } from 'react-toastify';
import AddItemForm from './AddItemForm';
import { createGroceryItem, fetchAllItems, type GroceryItem } from './groceryData';
import { useDarkMode } from './useDarkMode';

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
    try {
      await createGroceryItem({
        itemName: data.itemName,
        category: data.category,
        meatQuality: data.meatQuality,
        storeName: data.storeName,
        price: data.price,
        quantity: data.quantity,
        unitType: data.unitType,
        unitPrice: data.unitPrice,
        datePurchased: data.datePurchased,
        notes: data.notes,
        targetPrice: data.targetPrice,
        userId: data.userId,
      });

      toast.success('Item added successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save item. Check your Supabase configuration and try again.';
      toast.error(message);
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