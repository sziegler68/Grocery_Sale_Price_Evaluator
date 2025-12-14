import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Scale } from 'lucide-react';
import { DEFAULT_WEIGHTS } from '../../../shared/constants/averageWeights';
import type { UserWeightOverride } from '../types/userWeights';
import { toast } from 'react-toastify';

export const WeightPreferences: React.FC = () => {
    const [userOverrides, setUserOverrides] = useState<UserWeightOverride[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemWeight, setNewItemWeight] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Load overrides from local storage (mocking backend for now)
    useEffect(() => {
        const stored = localStorage.getItem('userWeightOverrides');
        if (stored) {
            setUserOverrides(JSON.parse(stored));
        }
    }, []);

    const saveOverrides = (overrides: UserWeightOverride[]) => {
        localStorage.setItem('userWeightOverrides', JSON.stringify(overrides));
        setUserOverrides(overrides);
    };

    const handleAddOverride = () => {
        if (!newItemName || !newItemWeight) return;

        const weight = parseFloat(newItemWeight);
        if (isNaN(weight) || weight <= 0) {
            toast.error('Please enter a valid weight');
            return;
        }

        const newOverride: UserWeightOverride = {
            id: crypto.randomUUID(),
            user_id: 'current-user', // Placeholder
            item_name: newItemName.toLowerCase(),
            category: 'Produce', // Default
            average_weight: weight,
            unit: 'pound',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Remove existing if any
        const filtered = userOverrides.filter(o => o.item_name !== newOverride.item_name);
        const updated = [...filtered, newOverride];

        saveOverrides(updated);
        setNewItemName('');
        setNewItemWeight('');
        setIsAdding(false);
        toast.success(`Saved average weight for ${newItemName}`);
    };

    const handleRemoveOverride = (id: string) => {
        const updated = userOverrides.filter(o => o.id !== id);
        saveOverrides(updated);
        toast.info('Removed custom weight');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-primary">Average Weights</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage custom average weights for produce items.
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Custom Weight
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-secondary rounded-lg border border-primary animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-medium mb-3 text-sm">Add New Weight</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Item Name (e.g. Large Apple)"
                            className="px-3 py-2 rounded border bg-input border-input text-sm"
                        />
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={newItemWeight}
                                onChange={(e) => setNewItemWeight(e.target.value)}
                                placeholder="Weight"
                                className="w-full px-3 py-2 rounded border bg-input border-input text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">lbs</span>
                        </div>
                        <button
                            onClick={handleAddOverride}
                            disabled={!newItemName || !newItemWeight}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            {/* User Overrides List */}
            {userOverrides.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Your Custom Weights</h4>
                    <div className="bg-card rounded-lg border border-primary divide-y divide-gray-200 dark:divide-gray-700">
                        {userOverrides.map((override) => (
                            <div key={override.id} className="p-3 flex items-center justify-between hover:bg-secondary transition-colors">
                                <div className="flex items-center gap-3">
                                    <Scale className="h-4 w-4 text-brand" />
                                    <span className="font-medium capitalize">{override.item_name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {override.average_weight} lbs
                                    </span>
                                    <button
                                        onClick={() => handleRemoveOverride(override.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Default Weights Reference */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">System Defaults (Reference)</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Avg Weight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {DEFAULT_WEIGHTS.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300 capitalize">{item.itemName}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 text-right font-mono">{item.averageWeight} lbs</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
