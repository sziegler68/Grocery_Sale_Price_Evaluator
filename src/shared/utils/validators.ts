/**
 * Input validation utilities
 * Validate prices, quantities, names, and other inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate item name
 * - Must not be empty
 * - Must be between 1 and 100 characters
 * - Should contain at least one letter
 */
export function validateItemName(name: string): ValidationResult {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Item name is required' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Item name must be 100 characters or less' };
  }
  
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Item name must contain at least one letter' };
  }
  
  return { isValid: true };
}

/**
 * Validate price
 * - Must be a positive number
 * - Must be less than $10,000
 * - Must have at most 2 decimal places
 */
export function validatePrice(price: number): ValidationResult {
  if (isNaN(price) || price === null || price === undefined) {
    return { isValid: false, error: 'Price must be a valid number' };
  }
  
  if (price <= 0) {
    return { isValid: false, error: 'Price must be greater than zero' };
  }
  
  if (price > 10000) {
    return { isValid: false, error: 'Price must be less than $10,000' };
  }
  
  // Check for more than 2 decimal places
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Price can have at most 2 decimal places' };
  }
  
  return { isValid: true };
}

/**
 * Validate quantity
 * - Must be a positive number
 * - Must be less than 1000
 */
export function validateQuantity(quantity: number): ValidationResult {
  if (isNaN(quantity) || quantity === null || quantity === undefined) {
    return { isValid: false, error: 'Quantity must be a valid number' };
  }
  
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than zero' };
  }
  
  if (quantity > 1000) {
    return { isValid: false, error: 'Quantity must be less than 1000' };
  }
  
  return { isValid: true };
}

/**
 * Validate store name
 * - Must not be empty
 * - Must be between 1 and 50 characters
 */
export function validateStoreName(storeName: string): ValidationResult {
  const trimmed = storeName.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Store name is required' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Store name must be 50 characters or less' };
  }
  
  return { isValid: true };
}

/**
 * Validate unit type
 * - Must not be empty
 * - Should be a recognized unit
 */
export function validateUnitType(unit: string): ValidationResult {
  const trimmed = unit.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Unit type is required' };
  }
  
  const validUnits = [
    'lb', 'oz', 'g', 'kg', 'l', 'ml', 'gal', 'qt', 'pt', 'cup',
    'each', 'dozen', 'pack', 'bag', 'box', 'can', 'bottle', 'jar'
  ];
  
  const normalized = unit.toLowerCase();
  if (!validUnits.includes(normalized) && trimmed.length > 20) {
    return { isValid: false, error: 'Unit type must be 20 characters or less' };
  }
  
  return { isValid: true };
}

/**
 * Validate budget
 * - Must be a positive number
 * - Must be less than $100,000
 */
export function validateBudget(budget: number): ValidationResult {
  if (isNaN(budget) || budget === null || budget === undefined) {
    return { isValid: false, error: 'Budget must be a valid number' };
  }
  
  if (budget <= 0) {
    return { isValid: false, error: 'Budget must be greater than zero' };
  }
  
  if (budget > 100000) {
    return { isValid: false, error: 'Budget must be less than $100,000' };
  }
  
  return { isValid: true };
}

/**
 * Validate category
 * - Must not be empty
 * - Should be a recognized category
 */
export function validateCategory(category: string): ValidationResult {
  const trimmed = category.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Category is required' };
  }
  
  return { isValid: true };
}

/**
 * Validate all required fields for adding an item
 */
export interface ItemInput {
  itemName: string;
  price: number;
  quantity: number;
  storeName: string;
  unitType?: string;
  category?: string;
}

export function validateItemInput(input: ItemInput): ValidationResult {
  // Validate item name
  const nameValidation = validateItemName(input.itemName);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  // Validate price
  const priceValidation = validatePrice(input.price);
  if (!priceValidation.isValid) {
    return priceValidation;
  }
  
  // Validate quantity
  const quantityValidation = validateQuantity(input.quantity);
  if (!quantityValidation.isValid) {
    return quantityValidation;
  }
  
  // Validate store name
  const storeValidation = validateStoreName(input.storeName);
  if (!storeValidation.isValid) {
    return storeValidation;
  }
  
  // Validate unit type if provided
  if (input.unitType) {
    const unitValidation = validateUnitType(input.unitType);
    if (!unitValidation.isValid) {
      return unitValidation;
    }
  }
  
  // Validate category if provided
  if (input.category) {
    const categoryValidation = validateCategory(input.category);
    if (!categoryValidation.isValid) {
      return categoryValidation;
    }
  }
  
  return { isValid: true };
}
