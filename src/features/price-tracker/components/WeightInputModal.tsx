import React, { useState } from 'react';
import { Scale, X, ArrowRight, Save } from 'lucide-react';

interface WeightInputModalProps {
    itemName: string;
    isOpen: boolean;
    onClose: () => void;
    onWeigh: (weight: number) => void;
    onSkipTotal: () => void;
    onSetAverage: (avgWeight: number, saveToProfile: boolean) => void;
}

export const WeightInputModal: React.FC<WeightInputModalProps> = ({
    itemName,
    isOpen,
    onClose,
    onWeigh,
    onSkipTotal,
    onSetAverage,
}) => {
    const [activeTab, setActiveTab] = useState<'weigh' | 'average'>('weigh');
    const [weightInput, setWeightInput] = useState('');
    const [saveToProfile, setSaveToProfile] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const weight = parseFloat(weightInput);
        if (isNaN(weight) || weight <= 0) return;

        if (activeTab === 'weigh') {
            onWeigh(weight);
        } else {
            onSetAverage(weight, saveToProfile);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-primary flex items-center justify-between bg-secondary">
                    <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-brand" />
                        <h2 className="text-lg font-bold text-primary">Weight Needed</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        <span className="font-semibold text-primary">{itemName}</span> is sold by weight, but we need to know how much you're buying to calculate the total price.
                    </p>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'weigh'
                                    ? 'text-brand border-b-2 border-brand'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('weigh')}
                        >
                            Weigh Items
                        </button>
                        <button
                            className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'average'
                                    ? 'text-brand border-b-2 border-brand'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('average')}
                        >
                            Set Average Weight
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {activeTab === 'weigh' ? 'Total Weight (lbs)' : 'Average Weight per Item (lbs)'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-lg"
                                placeholder="0.00"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                lbs
                            </span>
                        </div>

                        {activeTab === 'average' && (
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="saveProfile"
                                    checked={saveToProfile}
                                    onChange={(e) => setSaveToProfile(e.target.checked)}
                                    className="rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                <label htmlFor="saveProfile" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Save className="h-3 w-3" />
                                    Save as default for {itemName}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!weightInput}
                            className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowRight className="h-5 w-5" />
                            {activeTab === 'weigh' ? 'Calculate Total' : 'Use Average'}
                        </button>

                        <button
                            onClick={onSkipTotal}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                        >
                            Skip Total Calculation (Unit Price Only)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
