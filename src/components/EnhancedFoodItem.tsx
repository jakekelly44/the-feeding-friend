'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface FoodItem {
  id: string;
  brand: string;
  name: string;
  item_type: string;
  calories_per_unit: number;
  serving_unit: string;
  serving_grams: number | null;
  image_url: string | null;
}

interface MealFoodItem {
  id: string;
  meal_id: string;
  item_id: string;
  portion_quantity: number;
  portion_unit: string;
  portion_grams: number | null;
  calculated_calories: number;
  manually_adjusted: boolean;
  food: FoodItem;
}

interface Props {
  item: MealFoodItem;
  mealId: string;
  onPortionChange: (mealId: string, itemId: string, quantity: number, unit: string) => void;
  onDelete: (mealId: string, itemId: string) => void;
  onClick: () => void;
}

const FOOD_TYPE_STYLES: Record<string, { bg: string; emoji: string }> = {
  dry: { bg: 'bg-amber-100', emoji: '🥣' },
  wet: { bg: 'bg-red-100', emoji: '🥫' },
  raw: { bg: 'bg-orange-100', emoji: '🥩' },
  treat: { bg: 'bg-yellow-100', emoji: '🦴' },
  supplement: { bg: 'bg-blue-100', emoji: '💊' },
};

const SERVING_UNITS = ['cup', 'can', 'oz', 'g', 'piece', 'scoop', 'pump'];

// Unit conversion constants
const GRAMS_PER_OZ = 28.3495;
const GRAMS_PER_CUP_DRY = 120;
const GRAMS_PER_CUP_WET = 240;
const GRAMS_PER_CAN = 85; // Typical 3oz can

/**
 * Convert portion to grams for calorie calculation
 */
function convertToGrams(
  quantity: number,
  unit: string,
  foodType: string,
  servingGrams: number | null
): number {
  switch (unit.toLowerCase()) {
    case 'g':
      return quantity;
    
    case 'oz':
      return quantity * GRAMS_PER_OZ;
    
    case 'cup':
      // Use serving_grams if available, otherwise estimate by food type
      if (servingGrams) {
        return quantity * servingGrams;
      }
      return quantity * (foodType === 'wet' ? GRAMS_PER_CUP_WET : GRAMS_PER_CUP_DRY);
    
    case 'can':
      // Estimate: 1 can = 3oz = ~85g
      return quantity * GRAMS_PER_CAN;
    
    case 'piece':
    case 'scoop':
    case 'pump':
      // Use serving_grams if available, otherwise can't convert accurately
      if (servingGrams) {
        return quantity * servingGrams;
      }
      // Fallback: assume 1 piece/scoop/pump = 1 serving unit
      return quantity * (foodType === 'wet' ? GRAMS_PER_CUP_WET : GRAMS_PER_CUP_DRY);
    
    default:
      return quantity;
  }
}

/**
 * Calculate calories with proper unit conversion
 */
function calculateCalories(
  quantity: number,
  currentUnit: string,
  food: FoodItem
): number {
  const baseUnit = food.serving_unit; // Unit that calories_per_unit is measured in
  const caloriesPerUnit = food.calories_per_unit;
  
  // If same unit, simple multiplication
  if (currentUnit === baseUnit) {
    return Math.round(quantity * caloriesPerUnit);
  }
  
  // Different units - need conversion via grams
  // 1. Convert current portion to grams
  const portionGrams = convertToGrams(quantity, currentUnit, food.item_type, food.serving_grams);
  
  // 2. Convert base unit (1 serving) to grams
  const baseUnitGrams = convertToGrams(1, baseUnit, food.item_type, food.serving_grams);
  
  // 3. Calculate how many base units the portion represents
  const portionInBaseUnits = portionGrams / baseUnitGrams;
  
  // 4. Calculate calories
  return Math.round(portionInBaseUnits * caloriesPerUnit);
}

export default function EnhancedFoodItem({ item, mealId, onPortionChange, onDelete, onClick }: Props) {
  const [quantity, setQuantity] = useState(item.portion_quantity);
  const [unit, setUnit] = useState(item.portion_unit);
  const [calories, setCalories] = useState(item.calculated_calories);
  
  const style = FOOD_TYPE_STYLES[item.food.item_type] || FOOD_TYPE_STYLES.dry;
  
  // Recalculate calories when quantity or unit changes
  useEffect(() => {
    const newCalories = calculateCalories(quantity, unit, item.food);
    setCalories(newCalories);
  }, [quantity, unit, item.food]);
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    setQuantity(newQuantity);
  };
  
  const handleSliderRelease = () => {
    onPortionChange(mealId, item.id, quantity, unit);
  };
  
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    onPortionChange(mealId, item.id, quantity, newUnit);
  };
  
  // Determine slider range based on typical portions
  // ALL units now use 0.25 increments (except g and piece)
  const getSliderConfig = () => {
    switch (unit) {
      case 'cup':
        return { max: 5, step: 0.25 };
      case 'can':
        return { max: 3, step: 0.25 }; // FIXED: was 0.5
      case 'oz':
        return { max: 20, step: 0.25 }; // FIXED: was 0.5
      case 'g':
        return { max: 500, step: 10 };
      case 'piece':
        return { max: 20, step: 1 };
      case 'scoop':
        return { max: 10, step: 0.25 };
      case 'pump':
        return { max: 10, step: 1 };
      default:
        return { max: 10, step: 0.25 };
    }
  };
  
  const { max, step } = getSliderConfig();
  
  // Format display based on unit type
  const formatQuantity = () => {
    if (unit === 'piece' || unit === 'pump') {
      return quantity.toFixed(0);
    } else if (unit === 'g') {
      return quantity.toFixed(0);
    } else {
      return quantity.toFixed(2);
    }
  };
  
  return (
    <div 
      onClick={onClick}
      className="print-food-item group cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Food Icon */}
        <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
          {item.food.image_url ? (
            <img 
              src={item.food.image_url} 
              alt={item.food.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            style.emoji
          )}
        </div>

        {/* Food Info & Controls */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-charcoal text-sm truncate group-hover:text-deep-teal transition-colors">
            {item.food.name}
          </h4>
          <p className="text-xs text-gray-500 truncate mb-3">{item.food.brand}</p>
          
          {/* Unit Dropdown & Quantity Display */}
          <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={unit}
              onChange={handleUnitChange}
              className="px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:border-deep-teal focus:ring-1 focus:ring-deep-teal focus:outline-none"
            >
              {SERVING_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <span className="text-xs text-gray-600 font-medium">
              {formatQuantity()} {unit}
            </span>
          </div>
          
          {/* Slider */}
          <div className="no-print flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="range"
              min={step}
              max={max}
              step={step}
              value={quantity}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-deep-teal
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-deep-teal
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* Calories & Delete */}
        <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="font-bold text-deep-teal text-sm whitespace-nowrap">
            {calories} kcal
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(mealId, item.id);
            }}
            className="no-print p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
