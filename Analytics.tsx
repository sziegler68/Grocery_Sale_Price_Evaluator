import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useDarkMode } from './useDarkMode';

const Analytics: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-primary mb-8">
            Coming soon... Ask Meku to generate content for this page.
          </p>
          <div className={`max-w-md mx-auto p-6 rounded-xl shadow-lg ${
            darkMode ? 'bg-zinc-800' : 'bg-white'
          }`}>
            <p className="text-sm text-gray-900 dark:text-gray-400">
              This page will include:
            </p>
            <ul className="text-left mt-4 space-y-2 text-sm">
              <li>• Spending trends by category</li>
              <li>• Store comparison charts</li>
              <li>• Savings tracking</li>
              <li>• Price alerts and notifications</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;