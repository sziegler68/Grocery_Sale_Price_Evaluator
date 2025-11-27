import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Settings as SettingsIcon, Save, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDarkMode } from '../hooks/useDarkMode';
import { 
  requestPushPermission, 
  isPushNotificationSupported 
} from '../../features/notifications/api';
import { useNotificationStore } from '../../features/notifications/store/useNotificationStore';

export interface UnitPreferences {
  meat: 'pound' | 'ounce';
  fruit: 'pound' | 'ounce';
  veggies: 'pound' | 'ounce';
  milk: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
  soda: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml' | 'can' | 'each';
  drinks: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
  dairy: 'pound' | 'ounce' | 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
  [key: string]: string;
}

const defaultPreferences: UnitPreferences = {
  meat: 'pound',
  fruit: 'pound',
  veggies: 'pound',
  milk: 'gallon',
  soda: 'liter',
  drinks: 'gallon',
  dairy: 'pound',
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

const SALES_TAX_KEY = 'grocery-sales-tax';
const USER_NAME_KEY = 'grocery-user-name';

export const getUserName = (): string => {
  try {
    const stored = localStorage.getItem(USER_NAME_KEY);
    return stored || '';
  } catch (error) {
    console.error('Failed to load user name:', error);
    return '';
  }
};

export const saveUserName = (name: string): void => {
  try {
    localStorage.setItem(USER_NAME_KEY, name.trim());
  } catch (error) {
    console.error('Failed to save user name:', error);
  }
};

export const getSalesTaxRate = (): number => {
  try {
    const stored = localStorage.getItem(SALES_TAX_KEY);
    if (stored) {
      return parseFloat(stored);
    }
  } catch (error) {
    console.error('Failed to load sales tax:', error);
  }
  return 0; // Default: 0%
};

export const saveSalesTaxRate = (rate: number): void => {
  try {
    localStorage.setItem(SALES_TAX_KEY, rate.toString());
  } catch (error) {
    console.error('Failed to save sales tax:', error);
  }
};

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [preferences, setPreferences] = useState<UnitPreferences>(getUnitPreferences());
  const [salesTax, setSalesTax] = useState<number>(getSalesTaxRate());
  const [salesTaxDisplay, setSalesTaxDisplay] = useState<string>(getSalesTaxRate() > 0 ? getSalesTaxRate().toFixed(2) : '');
  const [userName, setUserName] = useState<string>(getUserName());
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(isPushNotificationSupported());
  
  // Use notification store
  const { 
    isEnabled: notifEnabled, 
    isPushEnabled: pushEnabled, 
    types: notifTypes,
    loadSettings,
    setEnabled: setNotifEnabled,
    setPushEnabled,
    updateTypes 
  } = useNotificationStore();

  // Load notification settings and check permission on mount
  useEffect(() => {
    loadSettings();
    setHasNotificationPermission(isPushNotificationSupported());
  }, [loadSettings]);

  // Handle sales tax input - calculator style with decimal point
  const handleSalesTaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (input === '') {
      setSalesTaxDisplay('');
      setSalesTax(0);
      return;
    }
    
    const numValue = parseInt(input, 10);
    const dollars = Math.floor(numValue / 100);
    const cents = numValue % 100;
    const formatted = `${dollars}.${cents.toString().padStart(2, '0')}`;
    
    setSalesTaxDisplay(formatted);
    setSalesTax(parseFloat(formatted));
  };

  const handleSave = () => {
    saveUnitPreferences(preferences);
    // Notification settings are saved automatically by store
    saveSalesTaxRate(salesTax);
    saveUserName(userName);
    toast.success('Settings saved successfully!');
  };

  const handleRequestPushPermission = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      setPushEnabled(true);
      setHasNotificationPermission(true);
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Push notification permission denied');
    }
  };

  const handleChange = (category: keyof UnitPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  return (
    <div className={`min-h-screen bg-secondary ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg bg-card">
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Unit Preferences</h2>
          </div>

          <p className="text-primary mb-6">
            Set your preferred units for comparing prices. Items will be normalized to these units when displaying price comparisons.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Meat (Beef, Pork, Chicken, Seafood)
              </label>
              <select
                value={preferences.meat}
                onChange={(e) => handleChange('meat', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.meat}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fruit
              </label>
              <select
                value={preferences.fruit}
                onChange={(e) => handleChange('fruit', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.fruit}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Vegetables
              </label>
              <select
                value={preferences.veggies}
                onChange={(e) => handleChange('veggies', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.veggies}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Milk
              </label>
              <select
                value={preferences.milk}
                onChange={(e) => handleChange('milk', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="gallon">Gallon</option>
                <option value="quart">Quart</option>
                <option value="pint">Pint</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.milk}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Soda
              </label>
              <select
                value={preferences.soda}
                onChange={(e) => handleChange('soda', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="gallon">Gallon</option>
                <option value="quart">Quart</option>
                <option value="pint">Pint</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="can">Can</option>
                <option value="each">Each</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.soda}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Drinks (Juice, Tea, etc.)
              </label>
              <select
                value={preferences.drinks}
                onChange={(e) => handleChange('drinks', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="gallon">Gallon</option>
                <option value="quart">Quart</option>
                <option value="pint">Pint</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.drinks}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dairy (Cheese, Yogurt, Sour Cream, etc.)
              </label>
              <select
                value={preferences.dairy}
                onChange={(e) => handleChange('dairy', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="pound">Pound (lb)</option>
                <option value="ounce">Ounce (oz)</option>
                <option value="gallon">Gallon</option>
                <option value="quart">Quart</option>
                <option value="pint">Pint</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter (ml)</option>
              </select>
              <p className="text-xs text-secondary mt-1">
                Prices will be normalized to price per {preferences.dairy}
              </p>
            </div>
          </div>

          <div className={`mt-6 p-4 rounded-lg bg-brand-light border border-purple-200`}>
            <h3 className="font-medium text-sm mb-2">Example:</h3>
            <p className="text-sm text-primary">
              If you set meat to "pound", then a $12.99 steak weighing 2.5 lbs will show as <strong>$5.20/lb</strong>, 
              and a $3.99 steak weighing 8 oz will show as <strong>$7.98/lb</strong> for easy comparison.
            </p>
            <p className="text-sm text-primary mt-2">
              If you set milk to "gallon", then a $1.50 quart will show as <strong>$6.00/gallon</strong> 
              alongside a $4.99 gallon for easy price comparison.
            </p>
          </div>

        </div>

        {/* User Name Setting */}
        <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg mt-8 bg-card">
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Your Name</h2>
          </div>

          <p className="text-primary mb-6">
            Your name will be used for database entries (price checker, shopping trips) to help with sorting and tracking.
            This is separate from list names - you can still use fun names when creating or joining lists!
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Enter your name"
            />
            <p className="text-xs text-secondary mt-2">
              This name will be stored with your price database entries and shopping trip items.
            </p>
            {!userName && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>No name set.</strong> Please set your name to help with database organization.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Tax Setting */}
        <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg mt-8 bg-card">
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Sales Tax</h2>
          </div>

          <p className="text-primary mb-6">
            Set your local sales tax rate. This will be used when calculating cart totals during shopping trips.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sales Tax Rate
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={salesTaxDisplay}
                onChange={handleSalesTaxInput}
                className="w-full pl-4 pr-8 py-3 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="8.50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-secondary mt-2">
              Type 850 for 8.50% sales tax (calculator style)
            </p>
          </div>

          <div className={`mt-6 p-4 rounded-lg bg-brand-light`}>
            <p className="text-sm text-primary">
              <strong>Example:</strong> With 8.5% sales tax, a $10.00 item will cost <strong>$10.85</strong> total.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="max-w-2xl mx-auto p-6 rounded-xl shadow-lg mt-8 bg-card">
          <div className="flex items-center space-x-2 mb-6">
            <Bell className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Notification Settings</h2>
          </div>

          <p className="text-primary mb-6">
            Get notified when others update shared shopping lists. Notifications are throttled to prevent spam.
          </p>

          <div className="space-y-6">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Notifications</span>
              <input
                type="checkbox"
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
              />
            </label>

            {notifEnabled && (
              <>
                <div className="pl-6 space-y-4 border-l-2 border-purple-200 dark:border-purple-800">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Push Notifications</div>
                        <div className="text-xs text-secondary">
                          Get notified even when app is closed
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushEnabled}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setPushEnabled(newValue);
                          
                          // If enabling and permission not granted, auto-request
                          if (newValue && !hasNotificationPermission) {
                            handleRequestPushPermission();
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                      />
                    </label>

                    {pushEnabled && !hasNotificationPermission && (
                      <div className={`p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-amber-300`}>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                          Push notifications require browser permission
                        </p>
                        <button
                          onClick={handleRequestPushPermission}
                          className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          Grant Permission
                        </button>
                      </div>
                    )}

                    {pushEnabled && hasNotificationPermission && (
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border border-green-300`}>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          ✓ Push notifications enabled
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                  <h3 className="text-sm font-semibold mb-3">Notify me when:</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">Items are added</div>
                        <div className="text-xs text-secondary">
                          Max 1 notification per hour
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifTypes.itemsAdded}
                        onChange={(e) => updateTypes({ itemsAdded: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">Items are checked off</div>
                        <div className="text-xs text-secondary">
                          Max 1 notification per hour
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifTypes.itemsPurchased}
                        onChange={(e) => updateTypes({ itemsPurchased: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="text-sm">Shopping is complete</div>
                        <div className="text-xs text-secondary">
                          Not throttled (manual trigger)
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifTypes.shoppingComplete}
                        onChange={(e) => updateTypes({ shoppingComplete: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>Save All Settings</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
