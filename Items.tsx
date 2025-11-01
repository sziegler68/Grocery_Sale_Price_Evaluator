import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ItemCard from '../components/ItemCard';
import SearchFilter from '../components/SearchFilter';

interface GroceryItem {
  id: string;
  itemName: string;
  category: string;
  meatQuality?: string;
  storeName: string;
  price: number;
  unitType: string;
  quantity: number;
  unitPrice: number;
  datePurchased: Date;
  notes?: string;
  targetPrice?: number;
}

const Items: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GroceryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [showBelowTarget, setShowBelowTarget] = useState(false);
  const [showBestPrices, setShowBestPrices] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    // Mock data for demonstration
    const mockItems: GroceryItem[] = [
      {
        id: '1',
        itemName: 'Chicken Breast',
        category: 'Meat',
        meatQuality: 'Choice',
        storeName: 'Walmart',
        price: 12.99,
        unitType: 'pound',
        quantity: 2.5,
        unitPrice: 0.325,
        datePurchased: new Date('2025-01-15'),
        targetPrice: 0.35
      },
      {
        id: '2',
        itemName: 'Organic Milk',
        category: 'Dairy',
        storeName: 'Whole Foods',
        price: 4.99,
        unitType: 'gallon',
        quantity: 1,
        unitPrice: 4.99,
        datePurchased: new Date('2025-01-14'),
        targetPrice: 5.50
      },
      {
        id: '3',
        itemName: 'Bananas',
        category: 'Produce',
        storeName: 'Kroger',
        price: 2.49,
        unitType: 'pound',
        quantity: 3,
        unitPrice: 0.052,
        datePurchased: new Date('2025-01-13'),
        targetPrice: 0.06
      }
    ];

    setItems(mockItems);
    setFilteredItems(mockItems);
  }, []);

  useEffect(() => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Store filter
    if (selectedStore) {
      filtered = filtered.filter(item => item.storeName === selectedStore);
    }

    // Below target filter
    if (showBelowTarget) {
      filtered = filtered.filter(item => 
        item.targetPrice && item.unitPrice <= item.targetPrice
      );
    }

    // Best prices filter
    if (showBestPrices) {
      const itemGroups = filtered.reduce((acc, item) => {
        if (!acc[item.itemName]) {
          acc[item.itemName] = [];
        }
        acc[item.itemName].push(item);
        return acc;
      }, {} as Record<string, GroceryItem[]>);

      filtered = Object.values(itemGroups).map(group => 
        group.reduce((best, current) => 
          current.unitPrice < best.unitPrice ? current : best
        )
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory, selectedStore, showBelowTarget, showBestPrices]);

  const categories = [...new Set(items.map(item => item.category))];
  const stores = [...new Set(items.map(item => item.storeName))];

  const getBestPrice = (itemName: string): number => {
    const itemPrices = items
      .filter(item => item.itemName === itemName)
      .map(item => item.unitPrice);
    return Math.min(...itemPrices);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Grocery Items</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track and compare prices across different stores
          </p>
        </div>

        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStore={selectedStore}
          onStoreChange={setSelectedStore}
          showBelowTarget={showBelowTarget}
          onBelowTargetChange={setShowBelowTarget}
          showBestPrices={showBestPrices}
          onBestPricesChange={setShowBestPrices}
          categories={categories}
          stores={stores}
          darkMode={darkMode}
        />

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No items found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                bestPrice={getBestPrice(item.itemName)}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Items;