export interface UnitPreferences {
    meat: 'pound' | 'ounce';
    fruit: 'pound' | 'ounce';
    veggies: 'pound' | 'ounce';
    milk: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
    soda: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml' | 'can' | 'each';
    drinks: 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
    dairy: 'pound' | 'ounce' | 'gallon' | 'quart' | 'pint' | 'liter' | 'ml';
    [key: string]: string;
}

export const defaultPreferences: UnitPreferences = {
    meat: 'pound',
    fruit: 'pound',
    veggies: 'pound',
    milk: 'gallon',
    soda: 'liter',
    drinks: 'gallon',
    dairy: 'pound',
};

const STORAGE_KEY = 'grocery-unit-preferences';
const SALES_TAX_KEY = 'grocery-sales-tax';
const USER_NAME_KEY = 'grocery-user-name';

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
