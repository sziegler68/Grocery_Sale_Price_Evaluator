/**
 * Alexa Settings Component
 * Allows users to generate and manage their Alexa sync code
 */

import { useState, useEffect } from 'react';
import { Mic, RefreshCw, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateAlexaSyncCode, getAlexaSyncCode } from '@shared/api/alexaApi';

interface AlexaSettingsProps {
    darkMode?: boolean;
}

export function AlexaSettings({ darkMode }: AlexaSettingsProps) {
    const [syncCode, setSyncCode] = useState<string | null>(null);
    const [isLinked, setIsLinked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadSyncCode();
    }, []);

    const loadSyncCode = async () => {
        setIsLoading(true);
        try {
            const result = await getAlexaSyncCode();
            setSyncCode(result.syncCode);
            setIsLinked(result.isLinked);
        } catch (error) {
            console.error('Failed to load sync code:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        setIsGenerating(true);
        try {
            const result = await generateAlexaSyncCode();
            if (result.success && result.syncCode) {
                setSyncCode(result.syncCode);
                setIsLinked(false);
                toast.success('Sync code generated!');
            } else {
                toast.error(result.error || 'Failed to generate code');
            }
        } catch (error) {
            console.error('Failed to generate sync code:', error);
            toast.error('Failed to generate sync code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyCode = () => {
        if (syncCode) {
            navigator.clipboard.writeText(syncCode);
            toast.success('Code copied!');
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-lg p-6 border border-primary">
            <div className="flex items-center gap-2 mb-4">
                <Mic className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-primary">Alexa Integration</h2>
                {isLinked && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Linked
                    </span>
                )}
            </div>

            <p className="text-sm text-secondary mb-4">
                Connect your shopping lists to Alexa to add items by voice.
            </p>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
            ) : syncCode ? (
                <div className="space-y-4">
                    {/* Sync Code Display */}
                    <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-zinc-800' : 'bg-purple-50'
                        }`}>
                        <p className="text-xs text-secondary mb-2">Your Alexa Sync Code</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-bold text-brand tracking-wider">
                                {syncCode}
                            </span>
                            <button
                                onClick={handleCopyCode}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                title="Copy code"
                            >
                                <Copy className="h-4 w-4 text-secondary" />
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'
                        }`}>
                        <p className="font-medium mb-2">How to link:</p>
                        <ol className="list-decimal list-inside space-y-1 text-secondary">
                            <li>"Alexa, open Luna Cart"</li>
                            <li>"Link my account with code {syncCode}"</li>
                            <li>Done! Say "add milk to my list"</li>
                        </ol>
                    </div>

                    {/* Regenerate Button */}
                    <button
                        onClick={handleGenerateCode}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-brand text-brand rounded-lg hover:bg-purple-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'Generate New Code'}
                    </button>
                    <p className="text-xs text-secondary text-center">
                        This will unlink current Alexa devices
                    </p>
                </div>
            ) : (
                /* No code yet - show generate button */
                <div className="space-y-4">
                    <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'
                        }`}>
                        <Mic className="h-12 w-12 text-secondary mx-auto mb-3" />
                        <p className="text-sm text-secondary mb-4">
                            Generate a sync code to connect your Echo or Alexa device
                        </p>
                        <button
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-brand hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </span>
                            ) : (
                                'Generate Alexa Sync Code'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AlexaSettings;
