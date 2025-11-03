import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export interface UnitPreferences {
  weight: 'pound' | 'ounce';
  volume: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
  [key: string]: string;
}

const defaultPreferences: UnitPreferences = {
  weight: 'pound',
  volume: 'gallon',
};

const STORAGE_KEY = 'grocery-unit-preferences';

export const getUnitPreferences = (): UnitPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
  return defaultPreferences;
};

export const saveUnitPreferences = (preferences: UnitPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
};

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [preferences, setPreferences] = useState<UnitPreferences>(getUnitPreferences());

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSave = () => {
    saveUnitPreferences(preferences);
    toast.success('Settings saved successfully!');
  };

  const handleChange = (category: keyof UnitPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gray-50'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`max-w-2xl mx-auto p-6 rounded-xl shadow-lg ${
          darkMode ? 'bg-zinc-800' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Unit Preferences</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Set your preferred units for comparing prices. Items will be normalized to these units when displaying price comparisons.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Weight Items (Meat, Produce, etc.)
              </label>
              <select
                value={preferences.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Prices will be normalized to price per {preferences.weight}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Volume Items (Milk, Drinks, etc.)
              </label>
              <select
                value={preferences.volume}
                onChange={(e) => handleChange('volume', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="gallon">Gallon</option>
                <option value="quart">Quart</option>
                <option value="pint">Pint</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Prices will be normalized to price per {preferences.volume}
              </p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-purple-50'} border border-purple-200`}>
            <h3 className="font-medium text-sm mb-2">Example:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If you set weight to "pound", then a $12.99 steak weighing 2.5 lbs will show as <strong>$5.20/lb</strong>, 
              and a $3.99 steak weighing 8 oz will show as <strong>$7.98/lb</strong> for easy comparison.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
