'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit2, Check, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import OCRScanner from '@/components/OCRScanner';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

type ItemType = 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';

interface FoodItem {
  id: string;
  created_by: string;
  brand: string;
  name: string;
  item_type: ItemType;
  calories_per_unit: number;
  serving_unit: string;
  serving_grams: number | null;
  protein_percent: number | null;
  fat_percent: number | null;
  fiber_percent: number | null;
  moisture_percent: number | null;
  package_price: number | null;
  package_size: number | null;
  package_unit: string | null;
  currency: string | null;
  cost_per_serving: number | null;
  cost_per_calorie: number | null;
  source: string | null;
  barcode: string | null;
  image_url: string | null;
}

interface Pet {
  id: string;
  name: string;
  daily_calories: number;
}

interface Meal {
  id: string;
  name: string;
  target_calories: number;
}

interface MealPlan {
  id: string;
  pet_id: string;
  meals: Meal[];
}

// Food type styles
const FOOD_TYPE_STYLES: Record<ItemType, { bg: string; emoji: string; label: string }> = {
  dry: { bg: 'bg-amber-100', emoji: '🥣', label: 'Dry Food (Kibble)' },
  wet: { bg: 'bg-red-100', emoji: '🥫', label: 'Wet Food' },
  raw: { bg: 'bg-orange-100', emoji: '🥩', label: 'Raw Food' },
  treat: { bg: 'bg-yellow-100', emoji: '🦴', label: 'Treat' },
  supplement: { bg: 'bg-blue-100', emoji: '💊', label: 'Supplement' },
};

export default function FoodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params.id as string;

  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Add to meal state
  const [pets, setPets] = useState<Pet[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [portionAmount, setPortionAmount] = useState<string>('1');
  const [portionUnit, setPortionUnit] = useState<string>('');
  const [addingToMeal, setAddingToMeal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  // Available portion units
  const PORTION_UNITS = ['cup', 'can', 'oz', 'g', 'piece', 'scoop', 'pump'];

  // Unit conversion constants for calorie calculations
  const GRAMS_PER_OZ = 28.3495;
  const GRAMS_PER_CUP: Record<ItemType, number> = {
    dry: 120,
    wet: 240,
    raw: 225,
    treat: 100,
    supplement: 150,
  };
  const GRAMS_PER_CAN = 85;
  const GRAMS_PER_PIECE = 30;

  // Convert a serving unit to grams (for base calorie calculation)
  function servingUnitToGrams(unit: string, foodType: ItemType, servingGrams: number | null): number {
    if (servingGrams && (unit === 'cup' || unit === food?.serving_unit)) {
      return servingGrams;
    }
    switch (unit) {
      case 'cup':
        return GRAMS_PER_CUP[foodType];
      case 'can':
        return GRAMS_PER_CAN;
      case 'oz':
        return GRAMS_PER_OZ;
      case 'g':
        return 1;
      case 'piece':
        return GRAMS_PER_PIECE;
      case 'scoop':
        return 15;
      case 'pump':
        return 5;
      default:
        return GRAMS_PER_CUP[foodType];
    }
  }

  // Calculate calories for a given portion quantity and unit
  function calculatePortionCalories(quantity: number, unit: string, foodItem: FoodItem): number {
    // Get the food's base serving size in grams
    const baseServingGrams = servingUnitToGrams(foodItem.serving_unit, foodItem.item_type, foodItem.serving_grams);

    // Calculate calories per gram
    const caloriesPerGram = foodItem.calories_per_unit / baseServingGrams;

    // Get grams for the selected portion unit
    const portionGrams = servingUnitToGrams(unit, foodItem.item_type, null) * quantity;

    // Calculate total calories
    return Math.round(caloriesPerGram * portionGrams);
  }

  // Fetch food details
  useEffect(() => {
    async function fetchFood() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('items')
        .select('*')
        .eq('id', foodId)
        .single();

      if (error || !data) {
        console.error('Error fetching food:', error);
        router.push('/foods');
        return;
      }

      setFood(data);
      setPortionUnit(data.serving_unit); // Default to food's serving unit
      setLoading(false);
    }

    fetchFood();
  }, [foodId, router]);

  // Fetch user's pets
  useEffect(() => {
    async function fetchPets() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pets')
        .select('id, name, daily_calories')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!error && data) {
        setPets(data);
      }
    }

    fetchPets();
  }, []);

  // Fetch meals when pet is selected
  useEffect(() => {
    if (!selectedPetId) {
      setMeals([]);
      setSelectedMealId('');
      return;
    }

    async function fetchMeals() {
      const supabase = createClient();
      
      // Get the meal plan for this pet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealPlan, error: planError } = await (supabase as any)
        .from('meal_plans')
        .select('id')
        .eq('pet_id', selectedPetId)
        .eq('is_active', true)
        .single();

      if (planError || !mealPlan) {
        setMeals([]);
        return;
      }

      // Get meals for this plan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData, error: mealsError } = await (supabase as any)
        .from('meals')
        .select('id, name, target_calories')
        .eq('meal_plan_id', mealPlan.id)
        .order('sort_order', { ascending: true });

      if (!mealsError && mealsData) {
        setMeals(mealsData);
      }
    }

    fetchMeals();
  }, [selectedPetId]);

  const handleOCRClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowOCRScanner(true);
  };

  const handleOCRExtract = (data: any) => {
    console.log('Extracted nutrition data:', data);
    setShowOCRScanner(false);
    
    const message = `OCR Scan Complete!\n\nExtracted:\n` +
      `Calories: ${data.calories || 'N/A'} kcal\n` +
      `Protein: ${data.protein || 'N/A'}%\n` +
      `Fat: ${data.fat || 'N/A'}%\n` +
      `Fiber: ${data.fiber || 'N/A'}%\n\n` +
      `Note: This is a food detail page. For auto-fill,\nuse "Add New Food" page.`;
    
    alert(message);
  };

  const handleAddToMeal = async () => {
    if (!selectedPetId || !selectedMealId || !food || !portionAmount || !portionUnit) return;

    const portion = parseFloat(portionAmount);
    if (isNaN(portion) || portion <= 0) {
      alert('Please enter a valid portion amount');
      return;
    }

    // Calculate calories for this portion with unit conversion
    const calculatedCalories = calculatePortionCalories(portion, portionUnit, food);

    // Get selected pet to check against daily calories
    const selectedPet = pets.find(p => p.id === selectedPetId);
    if (selectedPet && calculatedCalories > selectedPet.daily_calories) {
      const confirmAdd = confirm(
        `This portion (${calculatedCalories.toFixed(0)} kcal) exceeds ${selectedPet.name}'s daily calorie target (${selectedPet.daily_calories} kcal). Add anyway?`
      );
      if (!confirmAdd) return;
    }

    setAddingToMeal(true);

    try {
      const supabase = createClient();

      // Add item to meal_items table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_items')
        .insert({
          meal_id: selectedMealId,
          item_id: food.id,
          portion_quantity: portion,
          portion_unit: portionUnit,
          calculated_calories: calculatedCalories,
        });

      if (error) throw error;

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setPortionAmount('1');
      setSelectedMealId('');
    } catch (err) {
      console.error('Error adding to meal:', err);
      alert('Failed to add food to meal. Please try again.');
    } finally {
      setAddingToMeal(false);
    }
  };

  const calculateCostPerServing = () => {
    if (!food?.package_price || !food?.package_size || !food?.serving_grams) {
      return null;
    }

    // Convert package size to grams if needed
    let packageGrams = food.package_size;
    if (food.package_unit === 'lb') {
      packageGrams = food.package_size * 453.592; // lb to grams
    } else if (food.package_unit === 'kg') {
      packageGrams = food.package_size * 1000;
    } else if (food.package_unit === 'oz') {
      packageGrams = food.package_size * 28.3495;
    }

    const costPerGram = food.package_price / packageGrams;
    return costPerGram * food.serving_grams;
  };

  const canEdit = food && currentUserId && food.created_by === currentUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-light-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading food details...</p>
        </div>
      </div>
    );
  }

  if (!food) {
    return null;
  }

  const style = FOOD_TYPE_STYLES[food.item_type];
  const costPerServing = calculateCostPerServing();

  return (
    <div className="min-h-screen bg-light-cream pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/foods')}
            className="flex items-center gap-2 text-gray-600 hover:text-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Food Details</span>
          </button>
          {canEdit && (
            <button
              onClick={() => router.push(`/foods/${foodId}/edit`)}
              className="text-deep-teal font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Food Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Food Image */}
          <div className={`w-20 h-20 ${style.bg} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0`}>
            {food.image_url ? (
              <img 
                src={food.image_url} 
                alt={food.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              style.emoji
            )}
          </div>

          {/* Food Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-1">{food.brand}</p>
            <h1 className="text-xl font-bold text-charcoal mb-2">{food.name}</h1>
            <span className="inline-block px-3 py-1 bg-deep-teal-50 text-deep-teal text-xs font-medium rounded-full">
              {style.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Calories */}
          <div className="bg-white rounded-card p-4 text-center">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-500 text-lg">🔥</span>
            </div>
            <p className="text-2xl font-bold text-charcoal">{food.calories_per_unit}</p>
            <p className="text-xs text-gray-500">kcal / {food.serving_unit}</p>
          </div>

          {/* Cost */}
          {costPerServing !== null && (
            <div className="bg-white rounded-card p-4 text-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 text-lg">💵</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">
                ${costPerServing.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">per {food.serving_unit}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add to Meal Section */}
      <div className="px-4 pb-6">
        <div className="bg-deep-teal-50 rounded-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-deep-teal rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-charcoal">Add to Meal</h2>
          </div>

          {/* Pet Selection */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
              Select Pet
            </label>
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
            >
              <option value="">Choose pet...</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Meal Selection */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
              Select Meal
            </label>
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(e.target.value)}
              disabled={!selectedPetId || meals.length === 0}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Choose meal...</option>
              {meals.map(meal => (
                <option key={meal.id} value={meal.id}>
                  {meal.name} ({meal.target_calories} kcal target)
                </option>
              ))}
            </select>
          </div>

          {/* Portion Amount and Unit */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
              Portion Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={portionAmount}
                onChange={(e) => setPortionAmount(e.target.value)}
                placeholder="1"
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
              />
              <select
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
              >
                {PORTION_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            {portionAmount && parseFloat(portionAmount) > 0 && portionUnit && (
              <p className="text-xs text-gray-500 mt-1">
                = {calculatePortionCalories(parseFloat(portionAmount), portionUnit, food)} kcal
              </p>
            )}
          </div>

          {/* OCR Scan Option */}
          <div className="text-center py-2 mb-4">
            <button
              type="button"
              onClick={handleOCRClick}
              disabled={premiumLoading}
              className="text-sm text-deep-teal hover:text-deep-teal-600 underline font-medium flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Scan nutrition label
              {!isPremium && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">
                  Premium
                </span>
              )}
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToMeal}
            disabled={!selectedPetId || !selectedMealId || !portionAmount || addingToMeal}
            className="w-full py-3 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {addingToMeal ? 'Adding...' : 'Add to Meal Plan'}
          </button>

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium text-center">
                ✓ Food successfully added to meal plan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nutrition Facts */}
      {(food.protein_percent || food.fat_percent || food.fiber_percent) && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">ℹ️</span>
              <h2 className="font-bold text-charcoal">Nutrition Facts</h2>
            </div>

            <div className="space-y-3">
              {food.protein_percent && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Protein</span>
                  <span className="font-semibold text-charcoal">{food.protein_percent}%</span>
                </div>
              )}
              {food.fat_percent && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Fat</span>
                  <span className="font-semibold text-charcoal">{food.fat_percent}%</span>
                </div>
              )}
              {food.fiber_percent && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Fiber</span>
                  <span className="font-semibold text-charcoal">{food.fiber_percent}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {food.package_price && food.package_size && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💵</span>
              <h2 className="font-bold text-charcoal">Cost Breakdown</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Package Price</span>
                <span className="font-semibold text-charcoal">
                  ${food.package_price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Package Size</span>
                <span className="font-semibold text-charcoal">
                  {food.package_size} {food.package_unit}
                </span>
              </div>
              {costPerServing !== null && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Cost per {food.serving_unit}</span>
                  <span className="font-bold text-deep-teal">
                    ${costPerServing.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      {showOCRScanner && (
        <OCRScanner
          onExtract={handleOCRExtract}
          onClose={() => setShowOCRScanner(false)}
        />
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <PremiumUpgradeModal
          onClose={() => setShowPremiumModal(false)}
          feature="OCR nutrition label scanning"
        />
      )}
    </div>
  );
}
