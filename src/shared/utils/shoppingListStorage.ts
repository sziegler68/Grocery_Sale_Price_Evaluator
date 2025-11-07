/**
 * Local storage helpers for Shopping Lists
 * Stores share codes and user preferences on device
 */

const STORAGE_KEY_SHARE_CODES = 'shopping-list-share-codes';
const STORAGE_KEY_USER_NAME = 'shopping-list-user-name';

/**
 * Get all share codes from local storage
 */
export const getStoredShareCodes = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SHARE_CODES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load share codes:', error);
  }
  return [];
};

/**
 * Add a share code to local storage
 */
export const addShareCode = (shareCode: string): void => {
  try {
    const codes = getStoredShareCodes();
    
    // Don't add if already exists
    if (codes.includes(shareCode)) {
      return;
    }
    
    codes.push(shareCode);
    localStorage.setItem(STORAGE_KEY_SHARE_CODES, JSON.stringify(codes));
  } catch (error) {
    console.error('Failed to save share code:', error);
  }
};

/**
 * Remove a share code from local storage
 */
export const removeShareCode = (shareCode: string): void => {
  try {
    const codes = getStoredShareCodes();
    const filtered = codes.filter(code => code !== shareCode);
    localStorage.setItem(STORAGE_KEY_SHARE_CODES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove share code:', error);
  }
};

/**
 * Get stored user name (for "Added by" field)
 */
export const getStoredUserName = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY_USER_NAME);
  } catch (error) {
    console.error('Failed to load user name:', error);
    return null;
  }
};

/**
 * Set user name in local storage
 */
export const setStoredUserName = (name: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_USER_NAME, name);
  } catch (error) {
    console.error('Failed to save user name:', error);
  }
};

/**
 * Clear all shopping list data from local storage
 */
export const clearAllShoppingListData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_SHARE_CODES);
    localStorage.removeItem(STORAGE_KEY_USER_NAME);
  } catch (error) {
    console.error('Failed to clear shopping list data:', error);
  }
};
