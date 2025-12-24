export const ALL_UNITS = [
    { value: 'pound', label: 'Pound (lb)' },
    { value: 'ounce', label: 'Ounce (oz)' },
    { value: 'gallon', label: 'Gallon' },
    { value: 'quart', label: 'Quart' },
    { value: 'pint', label: 'Pint' },
    { value: 'liter', label: 'Liter' },
    { value: 'ml', label: 'Milliliter (ml)' },
    { value: 'can', label: 'Can' },
    { value: 'each', label: 'Each' },
    { value: 'box', label: 'Box' },
    { value: 'bag', label: 'Bag' },
    { value: 'pkg', label: 'Package' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'cup', label: 'Cup' },
    { value: 'tbsp', label: 'Tablespoon' },
    { value: 'tsp', label: 'Teaspoon' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'bunch', label: 'Bunch' },
];

export interface UnitPreferences {
    meat: string;
    fruit: string;
    veggies: string;
    milk: string;
    soda: string;
    drinks: string;
    dairy: string;
    [key: string]: string | Record<string, string> | undefined;
    customItems?: Record<string, string>;
}

export const defaultPreferences: UnitPreferences = {
    meat: 'pound',
    fruit: 'pound',
    veggies: 'pound',
    milk: 'gallon',
    soda: 'liter',
    drinks: 'gallon',
    dairy: 'pound',
    customItems: {},
};

const STORAGE_KEY = 'grocery-unit-preferences';
const SALES_TAX_KEY = 'grocery-sales-tax';
const USER_NAME_KEY = 'grocery-user-name';
const ZIP_CODE_KEY = 'grocery-zip-code';

export const getUnitPreferences = (): UnitPreferences => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...defaultPreferences, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load preferences:', error);
    }
    return defaultPreferences;
};

export const saveUnitPreferences = (preferences: UnitPreferences): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('Failed to save preferences:', error);
    }
};

export const getUserName = (): string => {
    try {
        const stored = localStorage.getItem(USER_NAME_KEY);
        return stored || '';
    } catch (error) {
        console.error('Failed to load user name:', error);
        return '';
    }
};

export const saveUserName = (name: string): void => {
    try {
        localStorage.setItem(USER_NAME_KEY, name.trim());
    } catch (error) {
        console.error('Failed to save user name:', error);
    }
};

export const getSalesTaxRate = (): number => {
    try {
        const stored = localStorage.getItem(SALES_TAX_KEY);
        if (stored) {
            return parseFloat(stored);
        }
    } catch (error) {
        console.error('Failed to load sales tax:', error);
    }
    return 0; // Default: 0%
};

export const saveSalesTaxRate = (rate: number): void => {
    try {
        localStorage.setItem(SALES_TAX_KEY, rate.toString());
    } catch (error) {
        console.error('Failed to save sales tax:', error);
    }
};

export const getZipCode = (): string => {
    try {
        const stored = localStorage.getItem(ZIP_CODE_KEY);
        return stored || '';
    } catch (error) {
        console.error('Failed to load zip code:', error);
        return '';
    }
};

export const saveZipCode = (zipCode: string): void => {
    try {
        localStorage.setItem(ZIP_CODE_KEY, zipCode.trim());
    } catch (error) {
        console.error('Failed to save zip code:', error);
    }
};

const TAX_OVERRIDE_KEY = 'grocery-tax-override';

export const getTaxRateOverride = (): boolean => {
    try {
        const stored = localStorage.getItem(TAX_OVERRIDE_KEY);
        return stored === 'true';
    } catch (error) {
        console.error('Failed to load tax override flag:', error);
        return false;
    }
};

export const saveTaxRateOverride = (isOverridden: boolean): void => {
    try {
        localStorage.setItem(TAX_OVERRIDE_KEY, isOverridden.toString());
    } catch (error) {
        console.error('Failed to save tax override flag:', error);
    }
};

// Luna suggestions setting
const LUNA_SUGGESTIONS_KEY = 'luna-suggestions-enabled';

export const getLunaSuggestionsEnabled = (): boolean => {
    try {
        const stored = localStorage.getItem(LUNA_SUGGESTIONS_KEY);
        // Default to true if not set
        return stored === null ? true : stored === 'true';
    } catch (error) {
        console.error('Failed to load Luna suggestions setting:', error);
        return true;
    }
};

export const saveLunaSuggestionsEnabled = (enabled: boolean): void => {
    try {
        localStorage.setItem(LUNA_SUGGESTIONS_KEY, enabled.toString());
    } catch (error) {
        console.error('Failed to save Luna suggestions setting:', error);
    }
};
