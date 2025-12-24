/**
 * Luna Context - Global state and actions for the Luna assistant
 * 
 * Provides Luna with access to navigation, list operations, and app state.
 */

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredShareCodes, addShareCode } from '@shared/utils/shoppingListStorage';
import { getShoppingListByCode, createShoppingList, addItemToList } from '@features/shopping-lists/api';
import { useShoppingListStore } from '@features/shopping-lists/store/useShoppingListStore';
import { fetchAllItems } from '@features/price-tracker/api/groceryData';
import { convertPrice } from '../../../utils/unitConversion';
import type { ParsedShoppingItem } from '@shared/lib/ai/geminiChat';

export interface LunaContextValue {
    // Navigation
    navigateTo: (path: string) => void;
    openList: (listName: string) => Promise<{ success: boolean; message: string }>;

    // List operations
    createList: (name: string) => Promise<{ success: boolean; message: string; shareCode?: string }>;
    addItemsToCurrentList: (items: ParsedShoppingItem[]) => Promise<{ success: boolean; message: string }>;

    // Price operations
    checkPrice: (item: string, price: number, unit: string) => Promise<{ success: boolean; message: string }>;
    comparePrices: (priceA: number, unitA: string, priceB: number, unitB: string) => { message: string };

    // State
    currentListId: string | null;
    setCurrentListId: (id: string | null) => void;
}

const LunaContext = createContext<LunaContextValue | null>(null);

export function useLuna() {
    const context = useContext(LunaContext);
    if (!context) {
        throw new Error('useLuna must be used within a LunaProvider');
    }
    return context;
}

interface LunaProviderProps {
    children: ReactNode;
}

export function LunaProvider({ children }: LunaProviderProps) {
    const navigate = useNavigate();
    const [currentListId, setCurrentListId] = useState<string | null>(null);

    // Navigate to a path
    const navigateTo = useCallback((path: string) => {
        navigate(path);
    }, [navigate]);

    // Open a list by name (fuzzy match)
    const openList = useCallback(async (listName: string): Promise<{ success: boolean; message: string }> => {
        try {
            const shareCodes = getStoredShareCodes();

            if (shareCodes.length === 0) {
                return { success: false, message: "You don't have any lists yet. Say 'create a list' to make one." };
            }

            // Load all lists and find best match
            const lists: Array<{ code: string; name: string }> = [];
            for (const code of shareCodes) {
                try {
                    const list = await getShoppingListByCode(code);
                    if (list) {
                        lists.push({ code, name: list.name });
                    }
                } catch {
                    // Skip invalid codes
                }
            }

            if (lists.length === 0) {
                return { success: false, message: "Couldn't load your lists. Please try again." };
            }

            // Simple fuzzy match: find list whose name contains the search term
            const searchLower = listName.toLowerCase();
            const match = lists.find(l => l.name.toLowerCase().includes(searchLower));

            if (match) {
                // Need to get the list ID to set currentListId
                const fullList = await getShoppingListByCode(match.code);
                if (fullList) {
                    setCurrentListId(fullList.id);
                    console.log('[Luna] Opened list, set currentListId to:', fullList.id);
                }
                navigate(`/shopping-lists/${match.code}`);
                return { success: true, message: `Opening ${match.name}` };
            }

            // No match - list available options
            const availableNames = lists.map(l => l.name).join(', ');
            return {
                success: false,
                message: `I couldn't find a list called "${listName}". Your lists are: ${availableNames}`
            };
        } catch (error) {
            console.error('[Luna] Error opening list:', error);
            return { success: false, message: "Something went wrong. Please try again." };
        }
    }, [navigate]);

    // Create a new list
    const createListFn = useCallback(async (name: string): Promise<{ success: boolean; message: string; shareCode?: string }> => {
        try {
            const list = await createShoppingList({ name });
            addShareCode(list.share_code);
            // Set currentListId immediately so Luna can add items right away
            setCurrentListId(list.id);
            console.log('[Luna] Created list, set currentListId to:', list.id);
            // Navigate with flag to skip name modal (Luna handles name prompt itself)
            navigate(`/shopping-lists/${list.share_code}`, { state: { skipNameModal: true } });
            return {
                success: true,
                message: `Created "${name}"! Your share code is ${list.share_code}`,
                shareCode: list.share_code
            };
        } catch (error) {
            console.error('[Luna] Error creating list:', error);
            return { success: false, message: "Couldn't create the list. Please try again." };
        }
    }, [navigate]);

    // Add items to current list
    const addItemsToCurrentList = useCallback(async (items: ParsedShoppingItem[]): Promise<{ success: boolean; message: string }> => {
        console.log('[Luna] addItemsToCurrentList called with', items.length, 'items');
        console.log('[Luna] currentListId:', currentListId);

        if (!currentListId) {
            console.log('[Luna] ❌ No currentListId - cannot add items');
            return { success: false, message: "You need to open a list first. Say 'open [list name]' or go to Shopping Lists." };
        }

        try {
            console.log('[Luna] Adding items to list:', currentListId);
            for (const item of items) {
                console.log('[Luna] Adding item:', item.name);
                await addItemToList({
                    list_id: currentListId,
                    item_name: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    unit_type: item.unit || undefined,
                });
            }
            console.log('[Luna] ✅ Successfully added', items.length, 'items');

            // Refresh the store's items so UI updates immediately
            const { loadListItems } = useShoppingListStore.getState();
            await loadListItems(currentListId);
            console.log('[Luna] 🔄 Refreshed store items');

            return {
                success: true,
                message: `Added ${items.length} item${items.length > 1 ? 's' : ''} to your list!`
            };
        } catch (error) {
            console.error('[Luna] Error adding items:', error);
            return { success: false, message: "Couldn't add those items. Please try again." };
        }
    }, [currentListId]);

    // Check if a price is good
    const checkPrice = useCallback(async (item: string, price: number, unit: string): Promise<{ success: boolean; message: string }> => {
        try {
            const result = await fetchAllItems();
            if (!result.items || result.items.length === 0) {
                return { success: false, message: "No price history found. Add some prices first using the Price Checker." };
            }

            // Find matching items
            const searchLower = item.toLowerCase();
            const matches = result.items.filter(i =>
                i.itemName.toLowerCase().includes(searchLower)
            );

            if (matches.length === 0) {
                return { success: false, message: `I don't have any price history for "${item}". Use the Price Checker to add some.` };
            }

            // Calculate average price from target prices
            const prices = matches.filter(m => m.targetPrice).map(m => m.targetPrice!);
            if (prices.length === 0) {
                return { success: false, message: `Found ${matches.length} items matching "${item}" but no target prices set.` };
            }

            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const diff = price - avgPrice;
            const percentDiff = (diff / avgPrice) * 100;

            if (diff < 0) {
                return {
                    success: true,
                    message: `$${price.toFixed(2)}/${unit} is a great deal! That's ${Math.abs(percentDiff).toFixed(0)}% below your average of $${avgPrice.toFixed(2)}.`
                };
            } else if (diff < avgPrice * 0.1) {
                return {
                    success: true,
                    message: `$${price.toFixed(2)}/${unit} is about average. Your typical price is $${avgPrice.toFixed(2)}.`
                };
            } else {
                return {
                    success: true,
                    message: `$${price.toFixed(2)}/${unit} is ${percentDiff.toFixed(0)}% above your average of $${avgPrice.toFixed(2)}. Consider waiting for a sale.`
                };
            }
        } catch (error) {
            console.error('[Luna] Error checking price:', error);
            return { success: false, message: "Couldn't check that price. Please try again." };
        }
    }, []);

    // Compare two prices
    const comparePrices = useCallback((priceA: number, unitA: string, priceB: number, unitB: string): { message: string } => {
        // Normalize to same unit if possible
        if (unitA === unitB) {
            if (priceA < priceB) {
                return { message: `$${priceA.toFixed(2)}/${unitA} is the better deal by $${(priceB - priceA).toFixed(2)}.` };
            } else if (priceB < priceA) {
                return { message: `$${priceB.toFixed(2)}/${unitB} is the better deal by $${(priceA - priceB).toFixed(2)}.` };
            } else {
                return { message: `They're the same price at $${priceA.toFixed(2)}/${unitA}.` };
            }
        }

        // Try to convert
        const converted = convertPrice(priceB, unitB, unitA);
        if (converted) {
            const normalizedB = converted.price;
            if (priceA < normalizedB) {
                return { message: `$${priceA.toFixed(2)}/${unitA} is better. The other option equals $${normalizedB.toFixed(2)}/${unitA}.` };
            } else if (normalizedB < priceA) {
                return { message: `$${priceB.toFixed(2)}/${unitB} is better. That equals $${normalizedB.toFixed(2)}/${unitA}.` };
            } else {
                return { message: `They're about the same. $${priceB.toFixed(2)}/${unitB} equals $${normalizedB.toFixed(2)}/${unitA}.` };
            }
        }

        return { message: `I can't compare ${unitA} to ${unitB} directly. Try using the same units.` };
    }, []);

    const value: LunaContextValue = {
        navigateTo,
        openList,
        createList: createListFn,
        addItemsToCurrentList,
        checkPrice,
        comparePrices,
        currentListId,
        setCurrentListId,
    };

    return (
        <LunaContext.Provider value={value}>
            {children}
        </LunaContext.Provider>
    );
}
