import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Key, ExternalLink, CheckCircle, XCircle, MapPin, Calculator, Bell, User, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { WeightPreferences } from './components/WeightPreferences';
import { useNotificationStore } from '../notifications/store/useNotificationStore';
import { taxService } from '../../shared/services/taxService';
import {
    type UnitPreferences,
    getUnitPreferences,
    saveUnitPreferences,
    getZipCode,
    saveZipCode,
    getSalesTaxRate,
    saveSalesTaxRate,
    getUserName,
    saveUserName,
    getTaxRateOverride,
    saveTaxRateOverride
} from '../../shared/utils/settings';

export function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [userName, setUserName] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [taxRate, setTaxRate] = useState(0);
    const [isSyncingTax, setIsSyncingTax] = useState(false);
    const [taxOverride, setTaxOverride] = useState(false);
    const [zipValidationWarning, setZipValidationWarning] = useState('');
    const [unitPreferences, setUnitPreferences] = useState<UnitPreferences>(getUnitPreferences());

    // Notification Store
    const {
        isEnabled: notificationsEnabled,
        isPushEnabled,
        types: notificationTypes,
        loadSettings: loadNotificationSettings,
        setEnabled: setNotificationsEnabled,
        setPushEnabled,
        updateTypes
    } = useNotificationStore();

    useEffect(() => {
        // Load saved settings
        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
            setApiKey(savedKey);
            setIsValid(true); // Assume valid if saved
        }
        setUserName(getUserName());
        setZipCode(getZipCode());
        setTaxRate(getSalesTaxRate() * 100); // Convert to percentage for display
        setTaxOverride(getTaxRateOverride());
        loadNotificationSettings();
    }, []);

    const validateApiKey = async (key: string): Promise<boolean> => {
        if (!key || key.trim().length < 20) {
            return false;
        }

        try {
            // Test the API key with a simple request
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
            );
            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    };

    const handleSave = async () => {
        setIsValidating(true);
        const valid = await validateApiKey(apiKey);
        setIsValid(valid);
        setIsValidating(false);

        if (valid) {
            localStorage.setItem('geminiApiKey', apiKey);
            toast.success('API key saved successfully!');
        } else {
            toast.error('Invalid API key. Please check and try again.');
        }
    };

    const handleClear = () => {
        if (confirm('Remove API key? You will need to add it again to use AI scanning.')) {
            localStorage.removeItem('geminiApiKey');
            setApiKey('');
            setIsValid(null);
            toast.success('API key removed');
        }
    };

    const handleSyncTax = async () => {
        if (!zipCode || zipCode.length < 5) {
            toast.error('Please enter a valid zip code');
            return;
        }

        setIsSyncingTax(true);
        setZipValidationWarning('');
        try {
            const { jurisdiction } = await taxService.fetchTaxJurisdiction(zipCode);

            if (jurisdiction) {
                const percentageRate = Number((jurisdiction.total_rate * 100).toFixed(3));
                setTaxRate(percentageRate);
                saveZipCode(zipCode);
                saveSalesTaxRate(jurisdiction.total_rate);
                setTaxOverride(false);
                saveTaxRateOverride(false);
                toast.success(`Found tax rate for ${jurisdiction.city}: ${percentageRate}%`);
            } else {
                setZipValidationWarning('Zip code not found in our database. You can still save it and manually set the tax rate.');
                toast.warning('Zip code not found in database. Please set tax rate manually.');
            }
        } catch (error) {
            console.error('Failed to sync tax:', error);
            toast.error('Failed to sync tax rate');
        } finally {
            setIsSyncingTax(false);
        }
    };

    const handleManualTaxChange = (value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setTaxRate(num);
            saveSalesTaxRate(num / 100);
        } else if (value === '') {
            setTaxRate(0);
            saveSalesTaxRate(0);
        }
    };

    const handleUserNameSave = () => {
        saveUserName(userName);
        toast.success('Name saved!');
    };

    const handleTaxOverrideToggle = (checked: boolean) => {
        setTaxOverride(checked);
        saveTaxRateOverride(checked);
        if (checked) {
            toast.info('Manual tax override enabled. You can now edit the tax rate directly.');
        }
    };

    const handleResetOnboarding = () => {
        if (confirm('Reset the welcome walkthrough? The app will reload and show the onboarding wizard.')) {
            localStorage.removeItem('hasCompletedOnboarding');
            toast.success('Onboarding reset! Reloading app...');
            // Use window.location.replace with full URL to force complete reload
            setTimeout(() => {
                window.location.replace(window.location.origin);
            }, 1000);
        }
    };

    const handleUnitPreferenceChange = (category: keyof UnitPreferences, value: string) => {
        const updated = {
            ...unitPreferences,
            [category]: value,
        };
        setUnitPreferences(updated);
        saveUnitPreferences(updated);
        toast.success('Unit preference saved!');
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-primary mb-2">Settings</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Configure your AI scanning preferences
                    </p>
                </div>

                {/* API Key Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary">
                    <div className="flex items-center gap-2 mb-4">
                        <Key className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">Google Gemini API Key</h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Add your free Google Gemini API key to enable AI-powered price tag scanning with 95%+ accuracy.
                    </p>

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                            How to get your free API key:
                        </h3>
                        <ol className="text-sm space-y-2 text-blue-800 dark:text-blue-200 list-decimal list-inside">
                            <li>Click the button below to open Google AI Studio</li>
                            <li>Sign in with your Google account</li>
                            <li>Click "Get API Key" → "Create API key"</li>
                            <li>Copy the key and paste it below</li>
                        </ol>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Get Free API Key
                        </a>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setIsValid(null); // Reset validation on change
                                }}
                                placeholder="AIza..."
                                className="w-full px-4 py-3 pr-12 rounded-lg border bg-input border-input font-mono text-sm"
                            />
                            {isValid !== null && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isValid ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isValidating || !apiKey}
                                className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isValidating ? 'Validating...' : 'Save & Test'}
                            </button>
                            {apiKey && (
                                <button
                                    onClick={handleClear}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Messages */}
                    {isValid === true && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ API key is valid and ready to use!
                            </p>
                        </div>
                    )}
                    {isValid === false && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                ✗ Invalid API key. Please check and try again.
                            </p>
                        </div>
                    )}
                </div>

                {/* User Profile Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">User Profile</h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Set your name for a personalized experience.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="flex-1 px-4 py-2 rounded-lg border bg-input border-input text-sm"
                            />
                            <button
                                onClick={handleUserNameSave}
                                disabled={!userName.trim()}
                                className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Location & Tax Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">Location & Tax</h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Enter your zip code to automatically sync local sales tax rates, or manually adjust the rate below.
                    </p>

                    {/* Zip Validation Warning */}
                    {zipValidationWarning && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                {zipValidationWarning}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Zip Code
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                    placeholder="12345"
                                    className="flex-1 px-4 py-2 rounded-lg border bg-input border-input text-sm"
                                />
                                <button
                                    onClick={handleSyncTax}
                                    disabled={isSyncingTax || zipCode.length < 5}
                                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                                >
                                    {isSyncingTax ? 'Syncing...' : 'Sync Tax'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Sales Tax Rate (%)
                            </label>

                            {/* Manual Override Checkbox */}
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="taxOverride"
                                    checked={taxOverride}
                                    onChange={(e) => handleTaxOverrideToggle(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                <label htmlFor="taxOverride" className="text-xs text-gray-600 dark:text-gray-400">
                                    Manual Override
                                </label>
                            </div>

                            <input
                                type="number"
                                value={taxRate}
                                onChange={(e) => handleManualTaxChange(e.target.value)}
                                step="0.01"
                                min="0"
                                max="100"
                                disabled={!taxOverride}
                                className={`w-full px-4 py-2 rounded-lg border text-sm ${taxOverride
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                    : 'bg-input border-input cursor-not-allowed'
                                    }`}
                            />
                            {taxOverride && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                    ⚠️ Manual override enabled
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notification Settings Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">Notification Settings</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-primary">Enable Notifications</h3>
                                <p className="text-xs text-secondary">Receive updates about shared lists</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notificationsEnabled}
                                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 dark:peer-focus:ring-brand/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                            </label>
                        </div>

                        {notificationsEnabled && (
                            <div className="pl-4 border-l-2 border-brand/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-primary">Push Notifications</h3>
                                        <p className="text-xs text-secondary">Receive alerts even when app is closed</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isPushEnabled}
                                            onChange={(e) => setPushEnabled(e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                                    </label>
                                </div>

                                <div className="pt-2">
                                    <h3 className="text-sm font-medium text-primary mb-2">Notify me when:</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationTypes.itemsAdded}
                                                onChange={(e) => updateTypes({ itemsAdded: e.target.checked })}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <span className="text-sm text-primary">Items are added to list</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationTypes.itemsPurchased}
                                                onChange={(e) => updateTypes({ itemsPurchased: e.target.checked })}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <span className="text-sm text-primary">Items are purchased</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notificationTypes.shoppingComplete}
                                                onChange={(e) => updateTypes({ shoppingComplete: e.target.checked })}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            <span className="text-sm text-primary">Shopping trip is completed</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Unit Preferences Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">Unit Preferences</h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Set your preferred units for comparing prices. Items will be normalized to these units when displaying price comparisons.
                    </p>

                    <div className="space-y-4">
                        {/* Meat */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Meat (Beef, Pork, Chicken, Seafood)
                            </label>
                            <select
                                value={unitPreferences.meat}
                                onChange={(e) => handleUnitPreferenceChange('meat', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="pound">Pound (lb)</option>
                                <option value="ounce">Ounce (oz)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.meat}
                            </p>
                        </div>

                        {/* Fruit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fruit
                            </label>
                            <select
                                value={unitPreferences.fruit}
                                onChange={(e) => handleUnitPreferenceChange('fruit', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="pound">Pound (lb)</option>
                                <option value="ounce">Ounce (oz)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.fruit}
                            </p>
                        </div>

                        {/* Vegetables */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Vegetables
                            </label>
                            <select
                                value={unitPreferences.veggies}
                                onChange={(e) => handleUnitPreferenceChange('veggies', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="pound">Pound (lb)</option>
                                <option value="ounce">Ounce (oz)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.veggies}
                            </p>
                        </div>

                        {/* Milk */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Milk
                            </label>
                            <select
                                value={unitPreferences.milk}
                                onChange={(e) => handleUnitPreferenceChange('milk', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="gallon">Gallon</option>
                                <option value="quart">Quart</option>
                                <option value="pint">Pint</option>
                                <option value="liter">Liter</option>
                                <option value="ml">Milliliter (ml)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.milk}
                            </p>
                        </div>

                        {/* Soda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Soda
                            </label>
                            <select
                                value={unitPreferences.soda}
                                onChange={(e) => handleUnitPreferenceChange('soda', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="gallon">Gallon</option>
                                <option value="quart">Quart</option>
                                <option value="pint">Pint</option>
                                <option value="liter">Liter</option>
                                <option value="ml">Milliliter (ml)</option>
                                <option value="can">Can</option>
                                <option value="each">Each</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.soda}
                            </p>
                        </div>

                        {/* Drinks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Drinks (Juice, Tea, etc.)
                            </label>
                            <select
                                value={unitPreferences.drinks}
                                onChange={(e) => handleUnitPreferenceChange('drinks', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="gallon">Gallon</option>
                                <option value="quart">Quart</option>
                                <option value="pint">Pint</option>
                                <option value="liter">Liter</option>
                                <option value="ml">Milliliter (ml)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.drinks}
                            </p>
                        </div>

                        {/* Dairy */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dairy (Cheese, Yogurt, Sour Cream, etc.)
                            </label>
                            <select
                                value={unitPreferences.dairy}
                                onChange={(e) => handleUnitPreferenceChange('dairy', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-input border-input focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                            >
                                <option value="pound">Pound (lb)</option>
                                <option value="ounce">Ounce (oz)</option>
                                <option value="gallon">Gallon</option>
                                <option value="quart">Quart</option>
                                <option value="pint">Pint</option>
                                <option value="liter">Liter</option>
                                <option value="ml">Milliliter (ml)</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Prices will be normalized to price per {unitPreferences.dairy}
                            </p>
                        </div>
                    </div>

                    {/* Example */}
                    <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Example:</h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            If you set meat to "pound", then a $12.99 steak weighing 2.5 lbs will show as <strong>$5.20/lb</strong>,
                            and a $3.99 steak weighing 8 oz will show as <strong>$7.98/lb</strong> for easy comparison.
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                            If you set milk to "gallon", then a $1.50 quart will show as <strong>$6.00/gallon</strong>
                            alongside a $4.99 gallon for easy price comparison.
                        </p>
                    </div>
                </div>

                {/* Weight Preferences Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <WeightPreferences />
                </div>

                {/* App Settings Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <SettingsIcon className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-semibold text-primary">App Settings</h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Advanced app configuration and reset options.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-sm font-medium text-primary">Reset Welcome Walkthrough</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Re-trigger the onboarding wizard to see the welcome guide again
                                </p>
                            </div>
                            <button
                                onClick={handleResetOnboarding}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-sm mb-2 text-primary">About API Keys</h3>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                        <li>• Your API key is stored locally on your device</li>
                        <li>• Free tier: 1,500 scans per day (plenty for personal use)</li>
                        <li>• Your key is never shared with anyone</li>
                        <li>• You can revoke it anytime from Google AI Studio</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
