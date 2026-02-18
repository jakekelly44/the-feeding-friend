/**
 * Utility functions for meal plan calculations and fraction handling
 */

// Common fractions for cup measurements
const FRACTIONS = [
  { decimal: 0.125, display: '1/8' },
  { decimal: 0.25, display: '1/4' },
  { decimal: 0.333, display: '1/3' },
  { decimal: 0.375, display: '3/8' },
  { decimal: 0.5, display: '1/2' },
  { decimal: 0.625, display: '5/8' },
  { decimal: 0.667, display: '2/3' },
  { decimal: 0.75, display: '3/4' },
  { decimal: 0.875, display: '7/8' },
];

/**
 * Convert decimal to fraction display
 * @param value - Decimal number
 * @param unit - Unit of measurement (e.g., 'cup', 'g', 'piece')
 * @returns Formatted string with fraction or decimal
 */
export function formatPortion(value: number, unit: string): string {
  if (value === 0) return `0 ${unit}s`;
  
  // For non-cup measurements, use simple decimal
  if (unit !== 'cup') {
    return `${value.toFixed(1)} ${unit}${value !== 1 ? 's' : ''}`;
  }

  // For cups, convert to fractions
  const wholePart = Math.floor(value);
  const fractionalPart = value - wholePart;

  if (fractionalPart === 0) {
    return `${wholePart} cup${wholePart !== 1 ? 's' : ''}`;
  }

  // Find closest fraction
  let closestFraction = FRACTIONS[0];
  let smallestDiff = Math.abs(fractionalPart - closestFraction.decimal);

  for (const fraction of FRACTIONS) {
    const diff = Math.abs(fractionalPart - fraction.decimal);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestFraction = fraction;
    }
  }

  // If difference is too large, use decimal
  if (smallestDiff > 0.05) {
    return `${value.toFixed(2)} cups`;
  }

  if (wholePart === 0) {
    return `${closestFraction.display} cup`;
  }

  return `${wholePart} ${closestFraction.display} cups`;
}

/**
 * Parse fraction string to decimal
 * @param input - String like "1 1/2", "1/4", "2.5", "2"
 * @returns Decimal number
 */
export function parseFraction(input: string): number {
  input = input.trim();
  
  // Handle simple decimal
  if (!input.includes('/')) {
    return parseFloat(input) || 0;
  }

  // Handle mixed fraction (e.g., "1 1/2")
  const parts = input.split(' ');
  let whole = 0;
  let fractionStr = input;

  if (parts.length === 2) {
    whole = parseFloat(parts[0]) || 0;
    fractionStr = parts[1];
  }

  // Parse fraction (e.g., "1/2")
  const [numerator, denominator] = fractionStr.split('/').map(s => parseFloat(s));
  
  if (!numerator || !denominator || denominator === 0) {
    return whole;
  }

  return whole + (numerator / denominator);
}

/**
 * Calculate portion size to meet target calories
 * @param targetCalories - Desired calories for this portion
 * @param caloriesPerUnit - Calories per serving unit
 * @returns Portion quantity
 */
export function calculatePortion(targetCalories: number, caloriesPerUnit: number): number {
  if (caloriesPerUnit === 0) return 0;
  return targetCalories / caloriesPerUnit;
}

/**
 * Calculate calories from portion
 * @param portion - Portion quantity
 * @param caloriesPerUnit - Calories per serving unit
 * @returns Total calories
 */
export function calculateCalories(portion: number, caloriesPerUnit: number): number {
  return Math.round(portion * caloriesPerUnit);
}

/**
 * Convert grams to display format based on serving unit
 * @param grams - Weight in grams
 * @param servingUnit - Unit of measurement
 * @returns Formatted weight string
 */
export function formatWeight(grams: number | null, servingUnit: string): string {
  if (!grams) return '';
  
  if (servingUnit === 'g') {
    return `${Math.round(grams)}g`;
  }
  
  // For other units, show in parentheses
  return `(${Math.round(grams)}g)`;
}

/**
 * Distribute calories evenly among items, respecting manual portions
 * @param mealTargetCalories - Total calories for the meal
 * @param items - Array of food items with portions and calories
 * @returns Updated items with recalculated portions
 */
export interface MealItem {
  id: string;
  portion_quantity: number;
  calories_per_unit: number;
  calculated_calories: number;
  manually_adjusted: boolean;
}

export function redistributeCalories(
  mealTargetCalories: number,
  items: MealItem[]
): MealItem[] {
  if (items.length === 0) return items;

  // Separate manual and auto items
  const manualItems = items.filter(item => item.manually_adjusted);
  const autoItems = items.filter(item => !item.manually_adjusted);

  // Calculate calories used by manual items
  const manualCalories = manualItems.reduce(
    (sum, item) => sum + item.calculated_calories,
    0
  );

  // Remaining calories to distribute
  const remainingCalories = Math.max(0, mealTargetCalories - manualCalories);

  // If no auto items, return as is
  if (autoItems.length === 0) return items;

  // Distribute remaining calories evenly among auto items
  const caloriesPerAutoItem = remainingCalories / autoItems.length;

  return items.map(item => {
    if (item.manually_adjusted) {
      return item;
    }

    const newPortion = calculatePortion(caloriesPerAutoItem, item.calories_per_unit);
    return {
      ...item,
      portion_quantity: newPortion,
      calculated_calories: calculateCalories(newPortion, item.calories_per_unit),
    };
  });
}

/**
 * Get default meal percentages based on number of meals
 * @param mealCount - 1, 2, or 3
 * @returns Array of meal configurations
 */
export function getDefaultMealConfig(mealCount: number): Array<{
  name: string;
  percent: number;
  sortOrder: number;
}> {
  switch (mealCount) {
    case 1:
      return [
        { name: 'Meal', percent: 90, sortOrder: 1 },
        { name: 'Treats', percent: 10, sortOrder: 99 },
      ];
    case 2:
      return [
        { name: 'Breakfast', percent: 45, sortOrder: 1 },
        { name: 'Dinner', percent: 45, sortOrder: 2 },
        { name: 'Treats', percent: 10, sortOrder: 99 },
      ];
    case 3:
      return [
        { name: 'Breakfast', percent: 30, sortOrder: 1 },
        { name: 'Lunch', percent: 35, sortOrder: 2 },
        { name: 'Dinner', percent: 30, sortOrder: 3 },
        { name: 'Treats', percent: 5, sortOrder: 99 },
      ];
    default:
      return getDefaultMealConfig(2);
  }
}

/**
 * Validate meal percentages sum to 100
 * @param percents - Array of percentage values
 * @returns true if sum equals 100
 */
export function validateMealPercentages(percents: number[]): boolean {
  const sum = percents.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01; // Allow tiny floating point errors
}
