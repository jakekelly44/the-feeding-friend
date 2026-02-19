/**
 * Unit conversion utilities for cost calculations
 */

// Conversion constants
export const CONVERSIONS = {
  // Weight conversions to grams
  LB_TO_G: 453.592,
  KG_TO_G: 1000,
  OZ_TO_G: 28.3495,
  
  // Approximate cup to gram conversions by food type
  // These are estimates based on food density
  CUP_TO_G: {
    dry: 120,      // Dry kibble: ~120g per cup
    wet: 240,      // Wet food: ~240g per cup (closer to water density)
    raw: 225,      // Raw food: ~225g per cup
    treat: 100,    // Treats: ~100g per cup (varies widely)
    supplement: 150, // Supplements: ~150g per cup (estimate)
  },
};

/**
 * Convert package size to grams
 */
export function convertToGrams(
  size: number,
  unit: string,
  foodType?: string
): { grams: number; isEstimate: boolean } {
  let grams: number;
  let isEstimate = false;

  switch (unit.toLowerCase()) {
    case 'lb':
      grams = size * CONVERSIONS.LB_TO_G;
      break;
    case 'kg':
      grams = size * CONVERSIONS.KG_TO_G;
      break;
    case 'oz':
      grams = size * CONVERSIONS.OZ_TO_G;
      break;
    case 'g':
      grams = size;
      break;
    case 'cup':
      // Cup conversions are estimates based on food type
      const cupWeight = foodType && CONVERSIONS.CUP_TO_G[foodType as keyof typeof CONVERSIONS.CUP_TO_G]
        ? CONVERSIONS.CUP_TO_G[foodType as keyof typeof CONVERSIONS.CUP_TO_G]
        : 150; // Default estimate
      grams = size * cupWeight;
      isEstimate = true;
      break;
    default:
      // Unknown unit, use as-is and mark as estimate
      grams = size;
      isEstimate = true;
  }

  return { grams, isEstimate };
}

/**
 * Calculate cost per gram
 */
export function calculateCostPerGram(
  packagePrice: number,
  packageSize: number,
  packageUnit: string,
  foodType?: string
): { costPerGram: number; isEstimate: boolean } {
  const { grams, isEstimate } = convertToGrams(packageSize, packageUnit, foodType);
  
  return {
    costPerGram: packagePrice / grams,
    isEstimate,
  };
}

/**
 * Calculate daily cost for a food item
 */
export function calculateDailyCost(
  portionQuantity: number,
  portionUnit: string,
  servingGrams: number | null,
  packagePrice: number | null,
  packageSize: number | null,
  packageUnit: string | null,
  foodType: string
): { cost: number; isEstimate: boolean } | null {
  if (!packagePrice || !packageSize || !packageUnit) {
    return null;
  }

  // Convert portion to grams
  let portionGrams: number;
  let isEstimate = false;

  if (servingGrams && portionUnit === 'cup') {
    // If we have serving_grams for cups, use it
    portionGrams = servingGrams * portionQuantity;
  } else if (portionUnit === 'g') {
    portionGrams = portionQuantity;
  } else {
    // Use conversion
    const converted = convertToGrams(portionQuantity, portionUnit, foodType);
    portionGrams = converted.grams;
    isEstimate = converted.isEstimate;
  }

  // Get cost per gram
  const { costPerGram, isEstimate: costIsEstimate } = calculateCostPerGram(
    packagePrice,
    packageSize,
    packageUnit,
    foodType
  );

  return {
    cost: portionGrams * costPerGram,
    isEstimate: isEstimate || costIsEstimate,
  };
}

/**
 * Calculate cost for a time period
 */
export function calculatePeriodCost(
  dailyCost: number,
  period: 'daily' | 'weekly' | 'monthly'
): number {
  switch (period) {
    case 'daily':
      return dailyCost;
    case 'weekly':
      return dailyCost * 7;
    case 'monthly':
      return dailyCost * 30;
  }
}

/**
 * Format cost with currency
 */
export function formatCost(cost: number, showCents: boolean = true): string {
  if (showCents) {
    return `$${cost.toFixed(2)}`;
  }
  return `$${Math.round(cost)}`;
}

/**
 * Get warning message for estimate
 */
export function getEstimateWarning(isEstimate: boolean): string | null {
  if (!isEstimate) return null;
  
  return '⚠️ Cost is estimated due to unit conversions. Add serving_grams to items for more accuracy.';
}
