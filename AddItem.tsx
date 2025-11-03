import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { toast } from 'react-toastify';
import AddItemForm from './AddItemForm';
import { createGroceryItem, fetchAllItems, type GroceryItem } from './groceryData';

const AddItem: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [existingItems, setExistingItems] = useState<GroceryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadItems = async () => {
      const result = await fetchAllItems();
      setExistingItems(result.items);
    };
    void loadItems();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

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
      navigate('/items');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save item. Check your Supabase configuration and try again.';
      toast.error(message);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddItemForm darkMode={darkMode} onSubmit={handleSubmit} existingItems={existingItems} />
      </main>

      <Footer />
    </div>
  );
};

export default AddItem;