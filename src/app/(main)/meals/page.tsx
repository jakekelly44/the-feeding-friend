'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, X, ChevronLeft, ChevronRight, Trash2, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import {
  formatPortion,
  parseFraction,
  calculateCalories,
  calculatePortion,
  redistributeCalories,
  formatWeight,
} from '@/lib/meal-utils';
import { calculateDailyCost, calculatePeriodCost, formatCost } from '@/lib/cost-utils';
import EnhancedFoodItem from '@/components/EnhancedFoodItem';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  daily_calories: number;
  photo_url: string | null;
}

interface Meal {
  id: string;
  name: string;
  target_calories: number;
  target_percent: number;
  sort_order: number;
}

interface FoodItem {
  id: string;
  brand: string;
  name: string;
  item_type: string;
  calories_per_unit: number;
  serving_unit: string;
  serving_grams: number | null;
  protein_percent: number | null;
  fat_percent: number | null;
  image_url: string | null;
  package_price: number | null;
  package_size: number | null;
  package_unit: string | null;
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

const FOOD_TYPE_STYLES: Record<string, { bg: string; emoji: string }> = {
  dry: { bg: 'bg-amber-100', emoji: '🥣' },
  wet: { bg: 'bg-red-100', emoji: '🥫' },
  raw: { bg: 'bg-orange-100', emoji: '🥩' },
  treat: { bg: 'bg-yellow-100', emoji: '🦴' },
  supplement: { bg: 'bg-blue-100', emoji: '💊' },
};

export default function MealsPage() {
  const router = useRouter();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  
  const [mealItems, setMealItems] = useState<Record<string, MealFoodItem[]>>({});
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFood, setAddingFood] = useState(false);

  const currentPet = pets[currentPetIndex];

  // Fetch user's pets
  useEffect(() => {
    async function fetchPets() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pets')
        .select('id, name, species, breed, daily_calories, photo_url')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (!error && data) {
        setPets(data);
      }
      setLoadingPets(false);
    }

    fetchPets();
  }, [router]);

  // Fetch meals for current pet
  useEffect(() => {
    if (!currentPet) return;

    async function fetchMeals() {
      setLoadingMeals(true);
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealPlan } = await (supabase as any)
        .from('meal_plans')
        .select('id')
        .eq('pet_id', currentPet.id)
        .eq('is_active', true)
        .single();

      if (!mealPlan) {
        setMeals([]);
        setLoadingMeals(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData } = await (supabase as any)
        .from('meals')
        .select('*')
        .eq('meal_plan_id', mealPlan.id)
        .order('sort_order', { ascending: true });

      if (mealsData) {
        setMeals(mealsData);
        // Expand first meal by default
        if (mealsData.length > 0) {
          setExpandedMeals(new Set([mealsData[0].id]));
        }
      }
      setLoadingMeals(false);
    }

    fetchMeals();
  }, [currentPet]);

  // Fetch items for all meals
  useEffect(() => {
    if (meals.length === 0) return;

    async function fetchAllMealItems() {
      const supabase = createClient();
      const itemsMap: Record<string, MealFoodItem[]> = {};

      for (const meal of meals) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('meal_items')
          .select(`
            *,
            food:items (
              id,
              brand,
              name,
              item_type,
              calories_per_unit,
              serving_unit,
              serving_grams,
              protein_percent,
              fat_percent,
              image_url,
              package_price,
              package_size,
              package_unit
            )
          `)
          .eq('meal_id', meal.id);

        if (!error && data) {
          itemsMap[meal.id] = data;
        }
      }

      setMealItems(itemsMap);
    }

    fetchAllMealItems();
  }, [meals]);

  // Fetch available foods when modal opens
  useEffect(() => {
    if (!showAddModal) return;

    async function fetchFoods() {
      const supabase = createClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('items')
        .select('*')
        .order('use_count', { ascending: false })
        .limit(100);

      if (data) {
        setAvailableFoods(data);
      }
    }

    fetchFoods();
  }, [showAddModal]);

  const handlePetSwitch = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPetIndex > 0) {
      setCurrentPetIndex(currentPetIndex - 1);
    } else if (direction === 'next' && currentPetIndex < pets.length - 1) {
      setCurrentPetIndex(currentPetIndex + 1);
    }
  };

  const toggleMeal = (mealId: string) => {
    const newExpanded = new Set(expandedMeals);
    if (newExpanded.has(mealId)) {
      newExpanded.delete(mealId);
    } else {
      newExpanded.add(mealId);
    }
    setExpandedMeals(newExpanded);
  };

  const handleAddFood = async (food: FoodItem) => {
    if (!selectedMealId || addingFood) return;

    const meal = meals.find(m => m.id === selectedMealId);
    if (!meal) return;

    setAddingFood(true);

    try {
      const supabase = createClient();
      const items = mealItems[selectedMealId] || [];

      const existingCalories = items.reduce((sum, item) => {
        return sum + (item.manually_adjusted ? item.calculated_calories : 0);
      }, 0);

      const remainingCalories = meal.target_calories - existingCalories;
      const autoItemCount = items.filter(item => !item.manually_adjusted).length + 1;
      const targetCalories = remainingCalories / autoItemCount;

      const portion = calculatePortion(targetCalories, food.calories_per_unit);
      const calculatedCalories = calculateCalories(portion, food.calories_per_unit);

      let portionGrams = null;
      if (food.serving_grams) {
        portionGrams = Math.round(food.serving_grams * portion);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_items')
        .insert({
          meal_id: selectedMealId,
          item_id: food.id,
          portion_quantity: portion,
          portion_unit: food.serving_unit,
          portion_grams: portionGrams,
          calculated_calories: calculatedCalories,
          manually_adjusted: false,
        });

      if (error) throw error;

      // Refresh meal items
      const { data: newItems } = await (supabase as any)
        .from('meal_items')
        .select(`
          *,
          food:items (
            id,
            brand,
            name,
            item_type,
            calories_per_unit,
            serving_unit,
            serving_grams,
            protein_percent,
            fat_percent,
            image_url,
            package_price,
            package_size,
            package_unit
          )
        `)
        .eq('meal_id', selectedMealId);

      if (newItems) {
        const redistributed = redistributeCalories(
          meal.target_calories,
          newItems.map((item: any) => ({
            id: item.id,
            portion_quantity: item.portion_quantity,
            calories_per_unit: item.food.calories_per_unit,
            calculated_calories: item.calculated_calories,
            manually_adjusted: item.manually_adjusted,
          }))
        );

        for (const item of redistributed.filter(r => !r.manually_adjusted)) {
          const dbItem = newItems.find((ni: any) => ni.id === item.id);
          if (dbItem && Math.abs(dbItem.portion_quantity - item.portion_quantity) > 0.01) {
            await (supabase as any)
              .from('meal_items')
              .update({
                portion_quantity: item.portion_quantity,
                calculated_calories: item.calculated_calories,
              })
              .eq('id', item.id);
          }
        }

        // Refresh all items for this meal
        const { data: finalItems } = await (supabase as any)
          .from('meal_items')
          .select(`
            *,
            food:items (
              id,
              brand,
              name,
              item_type,
              calories_per_unit,
              serving_unit,
              serving_grams,
              protein_percent,
              fat_percent,
              image_url,
              package_price,
              package_size,
              package_unit
            )
          `)
          .eq('meal_id', selectedMealId);

        if (finalItems) {
          setMealItems(prev => ({
            ...prev,
            [selectedMealId]: finalItems,
          }));
        }
      }

      setShowAddModal(false);
      setSearchQuery('');
      setSelectedMealId(null);
    } catch (err) {
      console.error('Error adding food:', err);
      alert('Failed to add food. Please try again.');
    } finally {
      setAddingFood(false);
    }
  };

  const handleDeleteItem = async (mealId: string, itemId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      const { data: remainingItems } = await (supabase as any)
        .from('meal_items')
        .select(`
          *,
          food:items (
            id,
            brand,
            name,
            item_type,
            calories_per_unit,
            serving_unit,
            serving_grams,
            protein_percent,
            fat_percent,
            image_url,
            package_price,
            package_size,
            package_unit
          )
        `)
        .eq('meal_id', mealId);

      if (remainingItems && remainingItems.length > 0) {
        const redistributed = redistributeCalories(
          meal.target_calories,
          remainingItems.map((item: any) => ({
            id: item.id,
            portion_quantity: item.portion_quantity,
            calories_per_unit: item.food.calories_per_unit,
            calculated_calories: item.calculated_calories,
            manually_adjusted: item.manually_adjusted,
          }))
        );

        for (const item of redistributed.filter(r => !r.manually_adjusted)) {
          const dbItem = remainingItems.find((ri: any) => ri.id === item.id);
          if (dbItem && Math.abs(dbItem.portion_quantity - item.portion_quantity) > 0.01) {
            await (supabase as any)
              .from('meal_items')
              .update({
                portion_quantity: item.portion_quantity,
                calculated_calories: item.calculated_calories,
              })
              .eq('id', item.id);
          }
        }
      }

      const { data: finalItems } = await (supabase as any)
        .from('meal_items')
        .select(`
          *,
          food:items (
            id,
            brand,
            name,
            item_type,
            calories_per_unit,
            serving_unit,
            serving_grams,
            protein_percent,
            fat_percent,
            image_url,
            package_price,
            package_size,
            package_unit
          )
        `)
        .eq('meal_id', mealId);

      setMealItems(prev => ({
        ...prev,
        [mealId]: finalItems || [],
      }));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handlePortionChange = async (mealId: string, itemId: string, quantity: number, unit: string) => {
    const items = mealItems[mealId] || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (isNaN(quantity) || quantity <= 0) return;

    const newCalories = calculateCalories(quantity, item.food.calories_per_unit);

    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('meal_items')
        .update({
          portion_quantity: quantity,
          portion_unit: unit,
          calculated_calories: newCalories,
          manually_adjusted: true,
        })
        .eq('id', itemId);

      const { data: updatedItems } = await (supabase as any)
        .from('meal_items')
        .select(`
          *,
          food:items (
            id,
            brand,
            name,
            item_type,
            calories_per_unit,
            serving_unit,
            serving_grams,
            protein_percent,
            fat_percent,
            image_url,
            package_price,
            package_size,
            package_unit
          )
        `)
        .eq('meal_id', mealId);

      if (updatedItems) {
        setMealItems(prev => ({
          ...prev,
          [mealId]: updatedItems,
        }));
      }
    } catch (err) {
      console.error('Error updating portion:', err);
    }
  };

  const handleFoodClick = (foodId: string) => {
    router.push(`/foods/${foodId}`);
  };

  // Calculate totals across all meals
  const allMealItems = Object.values(mealItems).flat();
  const totalCalories = allMealItems.reduce((sum, item) => sum + item.calculated_calories, 0);
  
  // Calculate monthly cost using cost-utils
  const { dailyCostTotal, hasEstimates } = (() => {
    let total = 0;
    let hasEstimates = false;
    
    allMealItems.forEach(item => {
      const result = calculateDailyCost(
        item.portion_quantity,
        item.portion_unit,
        item.food.serving_grams,
        item.food.package_price,
        item.food.package_size,
        item.food.package_unit,
        item.food.item_type
      );
      
      if (result) {
        total += result.cost;
        if (result.isEstimate) {
          hasEstimates = true;
        }
      }
    });
    
    return { dailyCostTotal: total, hasEstimates };
  })();
  
  const monthlyCost = calculatePeriodCost(dailyCostTotal, 'monthly');

  const filteredFoods = availableFoods.filter(food => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      food.brand.toLowerCase().includes(query) ||
      food.name.toLowerCase().includes(query)
    );
  });

  if (loadingPets) {
    return (
      <div className="min-h-screen bg-light-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pets...</p>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-light-cream px-6 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🐾</span>
          </div>
          <h2 className="text-xl font-bold text-charcoal mb-2">No Pets Yet</h2>
          <p className="text-gray-500 mb-6">Add a pet to start planning meals</p>
          <button
            onClick={() => router.push('/calculator')}
            className="px-6 py-3 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600"
          >
            Add Your First Pet
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Page setup - FIX FOR BLANK FIRST PAGE */
          @page {
            margin: 0.5in;
            size: auto;
          }
          
          @page :first {
            margin-top: 0.5in;
          }
          
          body {
            margin: 0;
            padding: 0;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }
          
          /* Prevent blank first page */
          .print-container {
            page-break-before: avoid !important;
            page-break-inside: avoid;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
            border: 3px solid #000;
            border-radius: 24px;
          }
          
          .print-meal-plan {
            page-break-before: avoid !important;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-meal-section {
            page-break-inside: avoid;
            margin-bottom: 24px;
          }
          
          .print-food-item {
            page-break-inside: avoid;
          }
          
          input {
            border: none !important;
            pointer-events: none;
            background: transparent !important;
            padding: 0 !important;
          }
          
          /* Hide screen-only elements */
          .screen-only {
            display: none !important;
          }
          
          /* Ensure colors print correctly */
          .bg-deep-teal {
            background-color: #2d7d7b !important;
            color: white !important;
          }
          
          .text-deep-teal {
            color: #2d7d7b !important;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Print-Only Layout */}
      <div className="print-only print-container">
        <div className="print-meal-plan">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">{currentPet?.name}'s Meal Plan</h1>
            <p className="text-gray-600 text-lg capitalize mb-4">
              {currentPet?.breed?.replace(/-/g, ' ') || currentPet?.species}
            </p>
            <div className="inline-block border-2 border-black rounded-lg px-6 py-3">
              <span className="font-bold">Daily Target: {currentPet?.daily_calories} kcal</span>
            </div>
          </div>

          <hr className="border-t-2 border-gray-300 my-6" />

          {/* Meals */}
          {meals.map((meal) => {
            const items = mealItems[meal.id] || [];
            if (items.length === 0) return null;
            
            return (
              <div key={meal.id} className="print-meal-section">
                <h2 className="text-xl font-bold mb-1">
                  {meal.name.toUpperCase()}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    Target: {meal.target_calories} kcal ({meal.target_percent.toFixed(0)}%)
                  </span>
                </h2>
                
                <div className="space-y-3 mt-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-1">
                          {formatPortion(item.portion_quantity, item.portion_unit)}
                        </div>
                        <div className="font-semibold">{item.food.name}</div>
                        <div className="text-sm text-gray-600">{item.food.brand}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{item.calculated_calories} kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <hr className="border-t-2 border-gray-300 my-6" />

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            Generated by The Feeding Friend •<br />
            Consult your vet for specific dietary needs.
          </div>
        </div>
      </div>
      
      {/* Screen Layout */}
      <div className="screen-only min-h-screen bg-light-cream pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-light-cream z-10 px-4 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-charcoal">Meal Plan</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-button hover:bg-gray-50 text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Daily Target</div>
                <div className="text-lg font-bold text-deep-teal">{currentPet?.daily_calories} kcal</div>
              </div>
            </div>
          </div>

          {/* Pet Carousel */}
          {pets.length > 1 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => handlePetSwitch('prev')}
                disabled={currentPetIndex === 0}
                className="no-print p-2 text-gray-400 hover:text-charcoal disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-soft-peach-100 flex items-center justify-center mb-2 relative">
                  {currentPet?.photo_url ? (
                    <img src={currentPet.photo_url} alt={currentPet.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl">🐾</span>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full no-print" />
                </div>
                <p className="font-semibold text-charcoal">{currentPet?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentPet?.breed || currentPet?.species}</p>
              </div>

              <button
                onClick={() => handlePetSwitch('next')}
                disabled={currentPetIndex === pets.length - 1}
                className="no-print p-2 text-gray-400 hover:text-charcoal disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">{totalCalories} kcal</span>
              <span className="text-gray-500">{currentPet && Math.round((totalCalories / currentPet.daily_calories) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalCalories > (currentPet?.daily_calories || 0) ? 'bg-red-500' :
                  totalCalories >= (currentPet?.daily_calories || 0) * 0.9 ? 'bg-green-500' :
                  'bg-deep-teal'
                }`}
                style={{ width: `${Math.min(100, (totalCalories / (currentPet?.daily_calories || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Meal Sections */}
        <div className="px-4 py-4 space-y-4">
          {loadingMeals ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-card p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-2 bg-gray-200 rounded mb-3" />
                  <div className="h-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            meals.map((meal) => {
              const items = mealItems[meal.id] || [];
              const mealTotal = items.reduce((sum, item) => sum + item.calculated_calories, 0);
              const isExpanded = expandedMeals.has(meal.id);
              const progress = (mealTotal / meal.target_calories) * 100;

              return (
                <div key={meal.id} className="bg-white rounded-card shadow-card overflow-hidden">
                  {/* Meal Header */}
                  <button
                    onClick={() => toggleMeal(meal.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-charcoal">{meal.name}</h3>
                        <span className="text-xs text-gray-500">{meal.target_percent.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-deep-teal">
                          {mealTotal} / {meal.target_calories} kcal
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Progress Bar */}
                  <div className="px-4 pb-3">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progress > 110 ? 'bg-red-500' :
                          progress >= 90 ? 'bg-green-500' :
                          'bg-deep-teal'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                      {items.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm italic py-6">No food added yet</p>
                      ) : (
                        items.map((item) => {
                          const style = FOOD_TYPE_STYLES[item.food.item_type] || FOOD_TYPE_STYLES.dry;
                          return (
                            <EnhancedFoodItem
                              key={item.id}
                              item={item}
                              mealId={meal.id}
                              onPortionChange={handlePortionChange}
                              onDelete={handleDeleteItem}
                              onClick={() => handleFoodClick(item.food.id)}
                            />
                          );
                        })
                      )}

                      <button
                        onClick={() => {
                          setSelectedMealId(meal.id);
                          setShowAddModal(true);
                        }}
                        className="no-print w-full py-3 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-deep-teal-200 hover:text-deep-teal transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        {items.length > 0 ? 'Add Another Food' : 'Add Food'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        <div className="no-print fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Kcal</div>
              <div className={`text-xl font-bold ${
                totalCalories > (currentPet?.daily_calories || 0) * 1.1 ? 'text-red-500' :
                totalCalories < (currentPet?.daily_calories || 0) * 0.9 ? 'text-orange-500' :
                'text-green-600'
              }`}>
                {totalCalories}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Cost</div>
              <div className="text-xl font-bold text-charcoal">
                {formatCost(monthlyCost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddModal && selectedMealId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg sm:max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-charcoal">
                Add Food to {meals.find(m => m.id === selectedMealId)?.name}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSelectedMealId(null);
                }}
                className="p-2 text-gray-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search foods..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredFoods.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No foods found</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      router.push('/foods/new');
                    }}
                    className="text-deep-teal font-semibold"
                  >
                    Add New Food
                  </button>
                </div>
              ) : (
                filteredFoods.map((food) => {
                  const style = FOOD_TYPE_STYLES[food.item_type] || FOOD_TYPE_STYLES.dry;
                  return (
                    <button
                      key={food.id}
                      onClick={() => handleAddFood(food)}
                      disabled={addingFood}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                        {food.image_url ? (
                          <img 
                            src={food.image_url} 
                            alt={food.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          style.emoji
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-charcoal text-sm truncate">{food.name}</p>
                        <p className="text-xs text-gray-500 truncate">{food.brand}</p>
                        <p className="text-xs text-gray-400">
                          {food.calories_per_unit} kcal/{food.serving_unit}
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-deep-teal flex-shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
