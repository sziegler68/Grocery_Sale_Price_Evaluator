/**
 * Paste List Modal Component
 * 
 * Allows users to paste grocery lists and preview parsed items before adding.
 */

import React, { useState, useEffect } from 'react';
import { X, ClipboardPaste, Check, AlertCircle, Plus } from 'lucide-react';
import { parseListText, type ParsedItem, normalizeUnit } from '../../../utils/listParser';
import { findBestFuzzyMatch } from '../../../shared/utils/fuzzyMatch';
import { SHOPPING_LIST_CATEGORIES } from '../types';

interface Item {
    id: string;
    name: string;
    category: string;
    target_price: number | null;
    unit_type?: string;
}

interface PasteListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItems: (items: MatchedItem[]) => void;
    availableItems: Item[];
    initialText?: string;
}

export interface MatchedItem extends ParsedItem {
    matchedItem: Item | null;
    matchScore: number;
    suggestions: Item[];
    useOriginal: boolean; // User chose to use original text instead of match
    selectedCategory: string; // Category for unmatched items
}

export const PasteListModal: React.FC<PasteListModalProps> = ({
    isOpen,
    onClose,
    onAddItems,
    availableItems,
    initialText = '',
}) => {
    const [pastedText, setPastedText] = useState(initialText);
    const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);

    // Update text if initialText changes (e.g. when reopening with new scan)
    useEffect(() => {
        if (isOpen && initialText) {
            setPastedText(initialText);
        }
    }, [isOpen, initialText]);

    // Parse text whenever it changes
    useEffect(() => {
        if (pastedText.trim()) {
            const parsed = parseListText(pastedText);

            // Match against available items
            const matched = parsed.map(item => matchItem(item, availableItems));
            setMatchedItems(matched);
        } else {
            setMatchedItems([]);
        }
    }, [pastedText, availableItems]);

    const matchItem = (parsedItem: ParsedItem, items: Item[]): MatchedItem => {
        const result = findBestFuzzyMatch(
            parsedItem.itemName,
            items.map(i => i.name),
            0.7 // 70% threshold
        );

        const matchedItem = result ? items[result.index] : null;
        const matchScore = result ? result.similarity : 0;

        // Get top 3 suggestions
        const suggestions = items
            .map((item, index) => ({ item, index, similarity: findBestFuzzyMatch(parsedItem.itemName, [item.name], 0)?.similarity || 0 }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(x => x.item);

        return {
            ...parsedItem,
            matchedItem,
            matchScore,
            suggestions,
            useOriginal: matchScore < 0.7, // Default to original if no good match
            selectedCategory: 'Other', // Default category for new items
        };
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPastedText(text);
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            // Fallback: user can paste manually
        }
    };

    const handleAddItems = () => {
        const itemsToAdd = matchedItems;

        if (itemsToAdd.length > 0) {
            onAddItems(itemsToAdd);
            setPastedText('');
            onClose();
        }
    };

    const getMatchIcon = (score: number) => {
        if (score >= 0.9) return <Check className="h-4 w-4 text-green-500" />;
        if (score >= 0.7) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        return <Plus className="h-4 w-4 text-gray-400" />;
    };

    const getMatchColor = (score: number) => {
        if (score >= 0.9) return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900';
        if (score >= 0.7) return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900';
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Paste Grocery List
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Paste Area */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Paste your list
                            </label>
                            <button
                                onClick={handlePasteFromClipboard}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <ClipboardPaste className="h-4 w-4" />
                                Paste from Clipboard
                            </button>
                        </div>
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Paste your grocery list here...&#10;&#10;Examples:&#10;• 2 lbs chicken&#10;- 3 apples&#10;1. Milk&#10;Bread&#10;5x eggs"
                            className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    {/* Preview */}
                    {matchedItems.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Preview ({matchedItems.length} items found)
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {matchedItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start gap-3 p-3 border rounded-lg ${getMatchColor(item.matchScore)}`}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getMatchIcon(item.matchScore)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {item.useOriginal || !item.matchedItem ? item.itemName : item.matchedItem.name}
                                                </span>
                                                {item.quantity && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {item.quantity} {normalizeUnit(item.unit)}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Uncertain match: let user choose */}
                                            {item.matchScore >= 0.5 && item.matchScore < 0.9 && item.matchedItem && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...matchedItems];
                                                            updated[index] = { ...item, useOriginal: false };
                                                            setMatchedItems(updated);
                                                        }}
                                                        className={`text-xs px-2 py-1 rounded-full transition-colors ${!item.useOriginal
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        Use: {item.matchedItem.name} ({Math.round(item.matchScore * 100)}%)
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const updated = [...matchedItems];
                                                            updated[index] = { ...item, useOriginal: true };
                                                            setMatchedItems(updated);
                                                        }}
                                                        className={`text-xs px-2 py-1 rounded-full transition-colors ${item.useOriginal
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        Keep: "{item.itemName}"
                                                    </button>
                                                </div>
                                            )}
                                            {item.matchScore >= 0.9 && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                    Exact match ✓
                                                </p>
                                            )}
                                            {item.matchScore < 0.5 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    No match found - will add as "{item.itemName}"
                                                </p>
                                            )}
                                            {/* Category selector for unmatched or original items */}
                                            {(item.useOriginal || item.matchScore < 0.5) && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Category:</span>
                                                    <select
                                                        value={item.selectedCategory}
                                                        onChange={(e) => {
                                                            const updated = [...matchedItems];
                                                            updated[index] = { ...item, selectedCategory: e.target.value };
                                                            setMatchedItems(updated);
                                                        }}
                                                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                        title="Select category"
                                                    >
                                                        {SHOPPING_LIST_CATEGORIES.map((cat) => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {pastedText.trim() && matchedItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No items found in the pasted text.</p>
                            <p className="text-sm mt-1">Try pasting a list with item names.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {matchedItems.length > 0 && (
                            <>
                                {matchedItems.filter(i => i.matchScore >= 0.9).length} exact matches, {' '}
                                {matchedItems.filter(i => i.matchScore >= 0.7 && i.matchScore < 0.9).length} partial
                            </>
                        )}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddItems}
                            disabled={matchedItems.length === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add {matchedItems.length} Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
