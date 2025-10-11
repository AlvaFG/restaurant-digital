/**
 * Types for menu item customization and modifiers
 */

export interface ModifierOption {
  /** Unique identifier for the modifier option */
  id: string
  /** Display name (e.g., "Grande", "Extra queso") */
  name: string
  /** Additional price in cents (can be 0 for free options) */
  priceCents: number
  /** Whether this option is currently available */
  available: boolean
  /** Optional description for the option */
  description?: string
}

export interface ModifierGroup {
  /** Unique identifier for the modifier group */
  id: string
  /** Display name (e.g., "Tamaño", "Extras", "Cocción") */
  name: string
  /** Whether customer must make a selection from this group */
  required: boolean
  /** Minimum number of selections required (e.g., 1 for "choose your size") */
  minSelection: number
  /** Maximum number of selections allowed (e.g., 1 for single choice, 3 for multiple) */
  maxSelection: number
  /** Available options in this group */
  options: ModifierOption[]
  /** Optional description/instructions for the group */
  description?: string
}

export interface CartItemModifier {
  /** ID of the modifier group this belongs to */
  groupId: string
  /** Name of the modifier group (for display) */
  groupName: string
  /** ID of the selected option */
  optionId: string
  /** Name of the selected option (for display) */
  optionName: string
  /** Price cents for this modifier */
  priceCents: number
}

export interface CustomizedCartItem {
  /** Menu item ID */
  menuItemId: string
  /** Quantity of this customized item */
  quantity: number
  /** Selected modifiers */
  modifiers: CartItemModifier[]
  /** Special instructions or notes */
  specialNotes?: string
  /** Unique ID to differentiate items with different customizations */
  customizationId: string
}

/**
 * Validation result for modifier selections
 */
export interface ModifierValidationResult {
  /** Whether the selections are valid */
  isValid: boolean
  /** Validation errors by group ID */
  errors: Record<string, string>
  /** Warning messages (non-blocking) */
  warnings?: string[]
}

/**
 * Helper type for tracking modifier selections in UI
 */
export interface ModifierSelection {
  /** Group ID */
  groupId: string
  /** Selected option IDs */
  selectedOptionIds: string[]
}
