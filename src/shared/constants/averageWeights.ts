export interface ItemWeight {
    itemName: string;
    category: string;
    averageWeight: number; // in pounds
    unit: 'pound' | 'ounce';
    confidence: 'high' | 'medium' | 'low';
    source: 'usda' | 'user_aggregate' | 'estimate';
}

export const DEFAULT_WEIGHTS: ItemWeight[] = [
    // Produce
    { itemName: 'white onion', category: 'Produce', averageWeight: 0.5, unit: 'pound', confidence: 'high', source: 'usda' },
    { itemName: 'red onion', category: 'Produce', averageWeight: 0.4, unit: 'pound', confidence: 'high', source: 'usda' },
    { itemName: 'yellow onion', category: 'Produce', averageWeight: 0.45, unit: 'pound', confidence: 'high', source: 'usda' },
    { itemName: 'tomato', category: 'Produce', averageWeight: 0.3, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'apple', category: 'Produce', averageWeight: 0.4, unit: 'pound', confidence: 'high', source: 'usda' },
    { itemName: 'banana', category: 'Produce', averageWeight: 0.25, unit: 'pound', confidence: 'high', source: 'usda' },
    { itemName: 'orange', category: 'Produce', averageWeight: 0.35, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'lemon', category: 'Produce', averageWeight: 0.2, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'lime', category: 'Produce', averageWeight: 0.15, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'potato', category: 'Produce', averageWeight: 0.5, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'sweet potato', category: 'Produce', averageWeight: 0.6, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'bell pepper', category: 'Produce', averageWeight: 0.35, unit: 'pound', confidence: 'medium', source: 'usda' },
    { itemName: 'avocado', category: 'Produce', averageWeight: 0.35, unit: 'pound', confidence: 'high', source: 'usda' },

    // Meat (individual cuts)
    { itemName: 'ribeye steak', category: 'Meat', averageWeight: 0.75, unit: 'pound', confidence: 'medium', source: 'estimate' },
    { itemName: 'new york strip', category: 'Meat', averageWeight: 0.7, unit: 'pound', confidence: 'medium', source: 'estimate' },
    { itemName: 'chicken breast', category: 'Meat', averageWeight: 0.5, unit: 'pound', confidence: 'medium', source: 'estimate' },
    { itemName: 'pork chop', category: 'Meat', averageWeight: 0.4, unit: 'pound', confidence: 'medium', source: 'estimate' },
];
