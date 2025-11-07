import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { toast } from 'react-toastify';
import AddItemForm from './AddItemForm';
import { fetchAllItems, updateGroceryItem, type GroceryItem } from './src/features/price-tracker/api/groceryData';
import { useDarkMode } from './useDarkMode';

const EditItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [existingItems, setExistingItems] = useState<GroceryItem[]>([]);
  const [currentItem, setCurrentItem] = useState<GroceryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const result = await fetchAllItems();
      setExistingItems(result.items);
      
      // Find the item to edit
      const itemToEdit = result.items.find(item => item.id === id);
      setCurrentItem(itemToEdit || null);
      setIsLoading(false);
    };
    void loadData();
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!currentItem) return;

    try {
      await updateGroceryItem({
        id: currentItem.id,
        item_name: data.itemName,
        category: data.category,
        meat_quality: data.meatQuality,
        store_name: data.storeName,
        price: data.price,
        quantity: data.quantity,
        unit_type: data.unitType,
        unit_price: data.unitPrice,
        date_purchased: data.datePurchased,
        notes: data.notes,
        target_price: data.targetPrice,
      });

      toast.success('Item updated successfully!');
      navigate(`/item/${currentItem.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update item. Check your Supabase configuration and try again.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-error">Item not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Edit Item</h1>
        </div>
        <AddItemForm 
          onSubmit={handleSubmit} 
          existingItems={existingItems}
          initialData={currentItem}
          isEditMode={true}
        />
      </main>

      <Footer />
    </div>
  );
};

export default EditItem;
