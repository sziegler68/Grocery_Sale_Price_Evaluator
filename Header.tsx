import React, { useState } from 'react';
import { Menu, X, ShoppingCart, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className={`sticky top-0 z-50 ${darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-800'} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold">PriceTracker</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <Link to="/shopping-lists" className="hover:text-purple-600 transition-colors">Shopping Lists</Link>
            <Link to="/items" className="hover:text-purple-600 transition-colors">Price Tracker</Link>
            <Link to="/add-item" className="hover:text-purple-600 transition-colors">Add Item</Link>
            <Link to="/analytics" className="hover:text-purple-600 transition-colors">Analytics</Link>
            <Link to="/settings" className="hover:text-purple-600 transition-colors">Settings</Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-zinc-700">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Home</Link>
              <Link to="/shopping-lists" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Shopping Lists</Link>
              <Link to="/items" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Price Tracker</Link>
              <Link to="/add-item" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Add Item</Link>
              <Link to="/analytics" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Analytics</Link>
              <Link to="/settings" className="hover:text-purple-600 transition-colors" onClick={toggleMenu}>Settings</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;