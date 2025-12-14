import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Search } from 'lucide-react';
import { ALL_UNITS, type UnitPreferences } from '../../../shared/utils/settings';

interface CustomUnitPreferencesProps {
    preferences: UnitPreferences;
    onUpdate: (updated: UnitPreferences) => void;
    onBack: () => void;
}

export function CustomUnitPreferences({ preferences, onUpdate, onBack }: CustomUnitPreferencesProps) {
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('pound');
    const [searchQuery, setSearchQuery] = useState('');

    const customItems = preferences.customItems || {};

    const handleAdd = () => {
        if (!newItemName.trim()) return;

        const updated = {
            ...preferences,
            customItems: {
                ...customItems,
                [newItemName.trim()]: newItemUnit
            }
        };
        onUpdate(updated);
        setNewItemName('');
    };

    const handleDelete = (name: string) => {
        const newCustomItems = { ...customItems };
        delete newCustomItems[name];

        onUpdate({
            ...preferences,
            customItems: newCustomItems
        });
    };

    const filteredItems = Object.entries(customItems).filter(([name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-primary">Custom Item Units</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Set specific units for individual items (overrides category defaults)
                    </p>
                </div>
            </div>

            {/* Add New Item */}
            <div className="bg-card p-4 rounded-lg border border-primary shadow-sm">
                <h3 className="font-medium text-sm mb-3 text-primary">Add New Item Override</h3>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Item Name (e.g. Strawberries)"
                        className="flex-1 px-3 py-2 rounded-lg border bg-input border-input text-sm"
                    />
                    <select
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        className="px-3 py-2 rounded-lg border bg-input border-input text-sm"
                    >
                        {ALL_UNITS.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!newItemName.trim()}
                        className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </button>
                </div>
            </div>

            {/* List Items */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search custom items..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border bg-input border-input text-sm"
                    />
                </div>

                <div className="bg-card rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            {searchQuery ? 'No items found matching search' : 'No custom item overrides yet'}
                        </div>
                    ) : (
                        filteredItems.map(([name, unit]) => (
                            <div key={name} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div>
                                    <div className="font-medium text-primary">{name}</div>
                                    <div className="text-xs text-secondary">Normalized to: {unit}</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(name)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove override"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
