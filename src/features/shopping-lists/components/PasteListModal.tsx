/**
 * Paste List Modal Component
 * 
 * Allows users to paste grocery lists and preview parsed items before adding.
 */

import React, { useState, useEffect } from 'react';
import { X, ClipboardPaste, Check, AlertCircle, Plus } from 'lucide-react';
import { parseListText, type ParsedItem, normalizeUnit } from '../../../utils/listParser';
import { findBestFuzzyMatch } from '../../../shared/utils/fuzzyMatch';

interface Item {
    id: string;
    name: string;
    category: string;
    target_price: number | null;
}

interface PasteListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItems: (items: MatchedItem[]) => void;
    availableItems: Item[];
}

export interface MatchedItem extends ParsedItem {
    matchedItem: Item | null;
    matchScore: number;
    suggestions: Item[];
}

export const PasteListModal: React.FC<PasteListModalProps> = ({
    isOpen,
    onClose,
    onAddItems,
    availableItems,
}) => {
    const [pastedText, setPastedText] = useState('');
    const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);

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
        if (score >= 0.9) return 'border-green-200 bg-green-50';
        if (score >= 0.7) return 'border-yellow-200 bg-yellow-50';
        return 'border-gray-200 bg-gray-50';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Paste Grocery List
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Paste Area */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
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
                            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                        />
                    </div>

                    {/* Preview */}
                    {matchedItems.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
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
                                                <span className="font-medium text-gray-900">
                                                    {item.matchedItem?.name || item.itemName}
                                                </span>
                                                {item.quantity && (
                                                    <span className="text-sm text-gray-600">
                                                        {item.quantity} {normalizeUnit(item.unit)}
                                                    </span>
                                                )}
                                            </div>
                                            {item.matchScore < 0.9 && item.matchScore >= 0.7 && (
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Partial match ({Math.round(item.matchScore * 100)}%)
                                                </p>
                                            )}
                                            {item.matchScore < 0.7 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    No match found - will create new item
                                                </p>
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
                <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
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
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
