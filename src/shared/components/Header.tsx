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
    <header className="sticky top-0 z-50 bg-card text-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-brand" />
            <span className="text-xl font-bold">LunaCart</span>
            <span className="ml-2 px-2 py-1 text-xs font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full animate-pulse">
              DEV VERSION
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-brand transition-colors">Home</Link>
            <Link to="/add-item" className="hover:text-brand transition-colors">Price Checker</Link>
            <Link to="/shopping-lists" className="hover:text-brand transition-colors">Shopping Lists</Link>
            <Link to="/items" className="hover:text-brand transition-colors">Search Database</Link>
            <Link to="/settings" className="hover:text-brand transition-colors">Settings</Link>
            <Link to="/help" className="hover:text-brand transition-colors">Help</Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover-bg-brand transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover-bg-brand transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover-bg-brand transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="hover:text-brand transition-colors" onClick={toggleMenu}>Home</Link>
              <Link to="/add-item" className="hover:text-brand transition-colors" onClick={toggleMenu}>Price Checker</Link>
              <Link to="/shopping-lists" className="hover:text-brand transition-colors" onClick={toggleMenu}>Shopping Lists</Link>
              <Link to="/items" className="hover:text-brand transition-colors" onClick={toggleMenu}>Search Database</Link>
              <Link to="/settings" className="hover:text-brand transition-colors" onClick={toggleMenu}>Settings</Link>
              <Link to="/help" className="hover:text-brand transition-colors" onClick={toggleMenu}>Help</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;