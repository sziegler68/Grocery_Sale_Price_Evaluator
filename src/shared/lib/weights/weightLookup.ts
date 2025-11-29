import { DEFAULT_WEIGHTS, ItemWeight } from '../../constants/averageWeights';
import { UserWeightOverride } from '../../../features/settings/types/userWeights';

// Helper to normalize strings for comparison
const normalizeItemName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export function getAverageWeight(
    itemName: string,
    userOverrides: UserWeightOverride[] = []
): ItemWeight | null {
    if (!itemName) return null;

    const normalizedInput = normalizeItemName(itemName);

    // 1. Check user overrides first
    const userOverride = userOverrides.find(w =>
        normalizeItemName(w.item_name) === normalizedInput
    );

    if (userOverride) {
        return {
            itemName: userOverride.item_name,
            category: userOverride.category,
            averageWeight: userOverride.average_weight,
            unit: userOverride.unit,
            confidence: 'high',
            source: 'user_aggregate' // Using 'user_aggregate' as a proxy for user override
        };
    }

    // 2. Check default table with exact match
    const defaultWeight = DEFAULT_WEIGHTS.find(w =>
        normalizeItemName(w.itemName) === normalizedInput
    );
    if (defaultWeight) return defaultWeight;

    // 3. Try partial matches (input contains item name or vice versa)
    // We prioritize longer matches to be more specific (e.g. "sweet potato" over "potato")
    const partialMatch = DEFAULT_WEIGHTS
        .filter(w => {
            const normalizedDbItem = normalizeItemName(w.itemName);
            return normalizedInput.includes(normalizedDbItem) || normalizedDbItem.includes(normalizedInput);
        })
        .sort((a, b) => b.itemName.length - a.itemName.length)[0];

    return partialMatch || null;
}

export function calculateTotalPrice(
    pricePerPound: number,
    quantity: number,
    averageWeight: number
): number {
    return pricePerPound * averageWeight * quantity;
}
