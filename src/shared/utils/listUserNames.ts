/**
 * Helper functions for managing user names per shopping list
 */

const STORAGE_KEY = 'shopping-list-user-names';

interface ListUserNames {
  [shareCode: string]: string;
}

/**
 * Get all user names for all lists
 */
export const getAllListUserNames = (): ListUserNames => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load user names:', error);
  }
  return {};
};

/**
 * Get user name for a specific list
 */
export const getUserNameForList = (shareCode: string): string | null => {
  const names = getAllListUserNames();
  return names[shareCode] || null;
};

/**
 * Set user name for a specific list
 */
export const setUserNameForList = (shareCode: string, userName: string): void => {
  try {
    const names = getAllListUserNames();
    names[shareCode] = userName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch (error) {
    console.error('Failed to save user name:', error);
  }
};

/**
 * Remove user name when list is deleted
 */
export const removeUserNameForList = (shareCode: string): void => {
  try {
    const names = getAllListUserNames();
    delete names[shareCode];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch (error) {
    console.error('Failed to remove user name:', error);
  }
};
