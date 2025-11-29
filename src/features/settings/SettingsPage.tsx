import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Key, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { WeightPreferences } from './components/WeightPreferences';

export function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
        // Load saved API key
        const savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
            setApiKey(savedKey);
            setIsValid(true); // Assume valid if saved
        }
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

                {/* Weight Preferences Section */}
                <div className="bg-card rounded-lg shadow-lg p-6 border border-primary mt-6">
                    <WeightPreferences />
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
