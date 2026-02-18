'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDefaultMealConfig, validateMealPercentages } from '@/lib/meal-utils';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

interface Meal {
  id: string;
  name: string;
  target_calories: number;
  target_percent: number;
  sort_order: number;
}

interface MealConfigurationProps {
  petId: string;
  dailyCalories: number;
}

export default function MealConfigurationSection({ petId, dailyCalories }: MealConfigurationProps) {
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealCount, setMealCount] = useState<1 | 2 | 3>(2);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch current meal plan
  useEffect(() => {
    async function fetchMealPlan() {
      const supabase = createClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealPlan } = await (supabase as any)
        .from('meal_plans')
        .select('id')
        .eq('pet_id', petId)
        .eq('is_active', true)
        .single();

      if (!mealPlan) {
        setLoading(false);
        return;
      }

      setMealPlanId(mealPlan.id);

      // Fetch meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData } = await (supabase as any)
        .from('meals')
        .select('*')
        .eq('meal_plan_id', mealPlan.id)
        .order('sort_order', { ascending: true });

      if (mealsData) {
        setMeals(mealsData);
        // Determine meal count (exclude treats which has sort_order 99)
        const regularMeals = mealsData.filter((m: Meal) => m.sort_order < 90);
        setMealCount(regularMeals.length as 1 | 2 | 3);
      }

      setLoading(false);
    }

    fetchMealPlan();
  }, [petId]);

  const handleMealCountChange = async (newCount: 1 | 2 | 3) => {
    if (newCount === mealCount) return;

    const config = getDefaultMealConfig(newCount);
    
    // Calculate new calorie targets
    const newMeals = config.map(meal => ({
      id: '',
      name: meal.name,
      target_percent: meal.percent,
      target_calories: Math.round((dailyCalories * meal.percent) / 100),
      sort_order: meal.sortOrder,
    }));

    setMealCount(newCount);
    setMeals(newMeals as Meal[]);
    setEditing(true);
  };

  const handlePercentChange = (index: number, newPercent: number) => {
    const newMeals = [...meals];
    newMeals[index].target_percent = newPercent;
    newMeals[index].target_calories = Math.round((dailyCalories * newPercent) / 100);
    setMeals(newMeals);
  };

  const handleNameChange = (index: number, newName: string) => {
    const newMeals = [...meals];
    newMeals[index].name = newName;
    setMeals(newMeals);
  };

  const handleSave = async () => {
    // Validate percentages
    const percents = meals.map(m => m.target_percent);
    if (!validateMealPercentages(percents)) {
      setError('Meal percentages must total 100%');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();

      if (!mealPlanId) {
        throw new Error('No meal plan found');
      }

      // Delete existing meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('meals')
        .delete()
        .eq('meal_plan_id', mealPlanId);

      // Insert new meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('meals')
        .insert(
          meals.map(meal => ({
            meal_plan_id: mealPlanId,
            name: meal.name,
            target_calories: meal.target_calories,
            target_percent: meal.target_percent,
            sort_order: meal.sort_order,
          }))
        );

      if (insertError) throw insertError;

      setEditing(false);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save meal configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-card p-4 shadow-card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalPercent = meals.reduce((sum, m) => sum + m.target_percent, 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;
  const treatsPercent = meals.find(m => m.sort_order === 99)?.target_percent || 0;

  return (
    <div className="bg-white rounded-card p-4 shadow-card">
      <h3 className="font-semibold text-charcoal mb-4">Meal Configuration</h3>

      {/* Meals per Day */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
          Meals per Day
        </label>
        <div className="flex gap-2">
          {[1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => handleMealCountChange(count as 1 | 2 | 3)}
              disabled={saving}
              className={`flex-1 py-2 rounded-button font-semibold transition-colors ${
                mealCount === count
                  ? 'bg-deep-teal text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Treat Allocation */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500 uppercase tracking-wide">
            Treat Allocation
          </label>
          <span className="text-sm font-semibold text-deep-teal">
            {treatsPercent.toFixed(0)}% ({Math.round((dailyCalories * treatsPercent) / 100)} kcal)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={treatsPercent}
          onChange={(e) => {
            const treatsIndex = meals.findIndex(m => m.sort_order === 99);
            if (treatsIndex !== -1) {
              handlePercentChange(treatsIndex, parseFloat(e.target.value));
              setEditing(true);
            }
          }}
          disabled={saving}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-teal"
        />
      </div>

      {/* Meal Distribution */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-3">
          Meal Distribution
        </label>
        <div className="space-y-3">
          {meals
            .filter(m => m.sort_order < 90)
            .map((meal, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <input
                    type="text"
                    value={meal.name}
                    onChange={(e) => {
                      handleNameChange(index, e.target.value);
                      setEditing(true);
                    }}
                    disabled={saving}
                    className="text-sm font-medium text-charcoal bg-transparent border-b border-transparent hover:border-gray-300 focus:border-deep-teal focus:outline-none transition-colors"
                  />
                  <span className="text-sm font-semibold text-deep-teal">
                    {meal.target_percent.toFixed(0)}% ({meal.target_calories} kcal)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={meal.target_percent}
                  onChange={(e) => {
                    handlePercentChange(index, parseFloat(e.target.value));
                    setEditing(true);
                  }}
                  disabled={saving}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-deep-teal"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Validation */}
      {!isValid && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">
            Total must equal 100% (currently {totalPercent.toFixed(1)}%)
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Save Button */}
      {editing && (
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full py-2.5 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      )}
    </div>
  );
}
