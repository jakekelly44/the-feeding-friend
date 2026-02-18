'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import {
  formatPortion,
  parseFraction,
  calculateCalories,
  calculatePortion,
  redistributeCalories,
  formatWeight,
} from '@/lib/meal-utils';

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
  // Joined from items table
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
  
  // Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);

  // Meals
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const [loadingMeals, setLoadingMeals] = useState(true);

  // Meal Items
  const [mealItems, setMealItems] = useState<MealFoodItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Add Food Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFood, setAddingFood] = useState(false);

  const currentPet = pets[currentPetIndex];
  const currentMeal = meals[activeMealIndex];

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

      // Get meal plan
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

      // Get meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData } = await (supabase as any)
        .from('meals')
        .select('*')
        .eq('meal_plan_id', mealPlan.id)
        .order('sort_order', { ascending: true });

      if (mealsData) {
        setMeals(mealsData);
      }
      setLoadingMeals(false);
    }

    fetchMeals();
  }, [currentPet]);

  // Fetch meal items for current meal
  useEffect(() => {
    if (!currentMeal) return;

    async function fetchMealItems() {
      setLoadingItems(true);
      const supabase = createClient();

      // Get meal items with food details
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
            image_url
          )
        `)
        .eq('meal_id', currentMeal.id);

      if (!error && data) {
        setMealItems(data);
      }
      setLoadingItems(false);
    }

    fetchMealItems();
  }, [currentMeal]);

  // Fetch available foods when modal opens
  useEffect(() => {
    if (!showAddModal) return;

    async function fetchFoods() {
      const supabase = createClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('items')
        .select('id, brand, name, item_type, calories_per_unit, serving_unit, serving_grams, protein_percent, fat_percent, image_url')
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
      setActiveMealIndex(0);
    } else if (direction === 'next' && currentPetIndex < pets.length - 1) {
      setCurrentPetIndex(currentPetIndex + 1);
      setActiveMealIndex(0);
    }
  };

  const handleAddFood = async (food: FoodItem) => {
    if (!currentMeal || addingFood) return;

    setAddingFood(true);

    try {
      const supabase = createClient();

      // Calculate target calories for this new item
      const existingCalories = mealItems.reduce((sum, item) => {
        return sum + (item.manually_adjusted ? item.calculated_calories : 0);
      }, 0);

      const remainingCalories = currentMeal.target_calories - existingCalories;
      const autoItemCount = mealItems.filter(item => !item.manually_adjusted).length + 1;
      const targetCalories = remainingCalories / autoItemCount;

      // Calculate portion
      const portion = calculatePortion(targetCalories, food.calories_per_unit);
      const calculatedCalories = calculateCalories(portion, food.calories_per_unit);

      // Calculate grams if available
      let portionGrams = null;
      if (food.serving_grams) {
        portionGrams = Math.round(food.serving_grams * portion);
      }

      // Insert meal item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_items')
        .insert({
          meal_id: currentMeal.id,
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
            image_url
          )
        `)
        .eq('meal_id', currentMeal.id);

      if (newItems) {
        // Redistribute calories among all items
        const redistributed = redistributeCalories(
          currentMeal.target_calories,
          newItems.map((item: any) => ({
            id: item.id,
            portion_quantity: item.portion_quantity,
            calories_per_unit: item.food.calories_per_unit,
            calculated_calories: item.calculated_calories,
            manually_adjusted: item.manually_adjusted,
          }))
        );

        // Update all auto items with new portions
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

        // Fetch updated items
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
              image_url
            )
          `)
          .eq('meal_id', currentMeal.id);

        if (finalItems) {
          setMealItems(finalItems);
        }
      }

      setShowAddModal(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Error adding food:', err);
      alert('Failed to add food. Please try again.');
    } finally {
      setAddingFood(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentMeal) return;

    try {
      const supabase = createClient();

      // Delete item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('meal_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Refresh and redistribute
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
            image_url
          )
        `)
        .eq('meal_id', currentMeal.id);

      if (remainingItems && remainingItems.length > 0) {
        // Redistribute calories
        const redistributed = redistributeCalories(
          currentMeal.target_calories,
          remainingItems.map((item: any) => ({
            id: item.id,
            portion_quantity: item.portion_quantity,
            calories_per_unit: item.food.calories_per_unit,
            calculated_calories: item.calculated_calories,
            manually_adjusted: item.manually_adjusted,
          }))
        );

        // Update portions
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

      // Refresh items
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
            image_url
          )
        `)
        .eq('meal_id', currentMeal.id);

      if (finalItems) {
        setMealItems(finalItems);
      } else {
        setMealItems([]);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handlePortionChange = async (itemId: string, newPortionStr: string) => {
    const item = mealItems.find(i => i.id === itemId);
    if (!item) return;

    const newPortion = parseFraction(newPortionStr);
    if (isNaN(newPortion) || newPortion <= 0) return;

    const newCalories = calculateCalories(newPortion, item.food.calories_per_unit);

    try {
      const supabase = createClient();

      // Update with manually_adjusted flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('meal_items')
        .update({
          portion_quantity: newPortion,
          calculated_calories: newCalories,
          manually_adjusted: true,
        })
        .eq('id', itemId);

      // Refresh items
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
            image_url
          )
        `)
        .eq('meal_id', currentMeal.id);

      if (updatedItems) {
        setMealItems(updatedItems);
      }
    } catch (err) {
      console.error('Error updating portion:', err);
    }
  };

  // Filter foods for search
  const filteredFoods = availableFoods.filter(food => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      food.brand.toLowerCase().includes(query) ||
      food.name.toLowerCase().includes(query)
    );
  });

  // Calculate totals
  const totalCalories = mealItems.reduce((sum, item) => sum + item.calculated_calories, 0);
  const totalFat = mealItems.reduce((sum, item) => {
    if (!item.food.fat_percent) return sum;
    const portionGrams = item.portion_grams || (item.portion_quantity * 100);
    return sum + (portionGrams * item.food.fat_percent / 100);
  }, 0);
  const totalProtein = mealItems.reduce((sum, item) => {
    if (!item.food.protein_percent) return sum;
    const portionGrams = item.portion_grams || (item.portion_quantity * 100);
    return sum + (portionGrams * item.food.protein_percent / 100);
  }, 0);

  const monthlyCost = 0; // TODO: Implement

  const calorieStatus = 
    totalCalories > (currentMeal?.target_calories || 0) * 1.1 ? 'over' :
    totalCalories < (currentMeal?.target_calories || 0) * 0.9 ? 'under' : 
    'good';

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
      <div className="min-h-screen bg-light-cream pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-light-cream z-10 px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-charcoal">Meal Plan</h1>
            <span className="text-sm text-deep-teal font-semibold">
              {currentPet?.daily_calories} kcal/day
            </span>
          </div>

          {/* Pet Carousel */}
          {pets.length > 1 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => handlePetSwitch('prev')}
                disabled={currentPetIndex === 0}
                className="p-2 text-gray-400 hover:text-charcoal disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-soft-peach-100 flex items-center justify-center mb-2">
                  {currentPet?.photo_url ? (
                    <img src={currentPet.photo_url} alt={currentPet.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl">🐾</span>
                  )}
                </div>
                <p className="font-semibold text-charcoal">{currentPet?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentPet?.breed || currentPet?.species}</p>
              </div>

              <button
                onClick={() => handlePetSwitch('next')}
                disabled={currentPetIndex === pets.length - 1}
                className="p-2 text-gray-400 hover:text-charcoal disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Meal Tabs */}
          {loadingMeals ? (
            <div className="h-12 bg-gray-100 rounded-button animate-pulse" />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {meals.map((meal, index) => (
                <button
                  key={meal.id}
                  onClick={() => setActiveMealIndex(index)}
                  className={`px-4 py-2.5 rounded-button font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeMealIndex === index
                      ? 'bg-deep-teal text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-deep-teal-200'
                  }`}
                >
                  <div className="text-sm">{meal.name}</div>
                  <div className="text-xs opacity-75">{meal.target_percent.toFixed(0)}%</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meal Items */}
        <div className="px-4 space-y-3 mb-6">
          {loadingItems ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-card p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : mealItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🍽️</span>
              </div>
              <p className="text-gray-500 text-sm italic mb-6">No food added yet</p>
            </div>
          ) : (
            mealItems.map((item) => {
              const style = FOOD_TYPE_STYLES[item.food.item_type] || FOOD_TYPE_STYLES.dry;
              return (
                <div key={item.id} className="bg-white rounded-card p-4 shadow-card">
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

                    {/* Food Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-charcoal text-sm truncate">{item.food.name}</h3>
                      <p className="text-xs text-gray-500 truncate mb-2">{item.food.brand}</p>
                      
                      {/* Portion Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={formatPortion(item.portion_quantity, item.portion_unit)}
                          onBlur={(e) => handlePortionChange(item.id, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-200 rounded focus:border-deep-teal focus:ring-1 focus:ring-deep-teal focus:outline-none"
                        />
                        {item.portion_grams && (
                          <span className="text-xs text-gray-400">
                            {formatWeight(item.portion_grams, item.portion_unit)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Calories & Delete */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-deep-teal text-sm">
                        {item.calculated_calories}
                        <span className="text-xs font-normal text-gray-400 ml-1">kcal</span>
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Food Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-card text-gray-400 hover:border-deep-teal-200 hover:text-deep-teal transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Food</span>
          </button>
        </div>

        {/* Summary Footer */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
          <div className="grid grid-cols-4 gap-2 text-center mb-2">
            <div>
              <div className="text-xs text-gray-500">Total Kcal</div>
              <div className={`font-bold ${
                calorieStatus === 'over' ? 'text-red-500' :
                calorieStatus === 'under' ? 'text-orange-500' :
                'text-green-600'
              }`}>
                {totalCalories}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Fat</div>
              <div className="font-bold text-charcoal">{totalFat.toFixed(0)}g</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Protein</div>
              <div className="font-bold text-charcoal">{totalProtein.toFixed(0)}g</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Monthly</div>
              <div className="font-bold text-charcoal">${monthlyCost.toFixed(2)}</div>
            </div>
          </div>
          {currentMeal && (
            <div className="text-xs text-center text-gray-500">
              Target: {currentMeal.target_calories} kcal
            </div>
          )}
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg sm:max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-charcoal">
                Add Food to {currentMeal?.name}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                }}
                className="p-2 text-gray-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
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

            {/* Food List */}
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
