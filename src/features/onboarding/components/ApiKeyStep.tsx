import React, { useState } from 'react';
import { Key, ExternalLink, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface ApiKeyStepProps {
    onNext: (apiKey: string | null) => void;
}

export const ApiKeyStep: React.FC<ApiKeyStepProps> = ({ onNext }) => {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const validateApiKey = async (key: string): Promise<boolean> => {
        if (!key || key.trim().length < 20) return false;
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
            );
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    const handleVerify = async () => {
        setIsValidating(true);
        const valid = await validateApiKey(apiKey);
        setIsValid(valid);
        setIsValidating(false);

        if (valid) {
            toast.success('API key verified!');
        } else {
            toast.error('Invalid API key');
        }
    };

    const handleContinue = () => {
        if (apiKey && isValid) {
            onNext(apiKey);
        } else {
            onNext(null); // Skip
        }
    };

    return (
        <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Enable AI Scanning</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Get a free Google Gemini API key to scan price tags with 95%+ accuracy.
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                    It's free and takes 30 seconds:
                </h3>
                <ol className="text-sm space-y-2 text-blue-800 dark:text-blue-200 list-decimal list-inside mb-4">
                    <li>Open Google AI Studio</li>
                    <li>Sign in with Google</li>
                    <li>Click "Get API Key"</li>
                </ol>
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
                >
                    <ExternalLink className="h-4 w-4" />
                    Get Free API Key
                </a>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setIsValid(null);
                        }}
                        placeholder="Paste your API key here (AIza...)"
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow font-mono text-sm"
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

                {apiKey && !isValid && (
                    <button
                        onClick={handleVerify}
                        disabled={isValidating}
                        className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-primary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                        {isValidating ? 'Verifying...' : 'Verify Key'}
                    </button>
                )}

                <button
                    onClick={handleContinue}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors mt-4 ${apiKey && isValid
                            ? 'bg-brand text-white hover:bg-brand-dark'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    {apiKey && isValid ? 'Continue' : 'Skip for now'}
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};
