'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateDailyCost, calculatePeriodCost, formatCost } from '@/lib/cost-utils';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
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
  portion_quantity: number;
  portion_unit: string;
  portion_grams: number | null;
  calculated_calories: number;
  food: FoodItem;
}

type Period = 'daily' | 'weekly' | 'monthly';

const FOOD_TYPE_COLORS: Record<string, string> = {
  dry: '#F59E0B',      // Amber/Orange
  wet: '#8B5CF6',      // Purple
  raw: '#EF4444',      // Red
  treat: '#10B981',    // Green
  supplement: '#3B82F6', // Blue
};

const FOOD_TYPE_LABELS: Record<string, string> = {
  dry: 'Dry Food',
  wet: 'Wet Food',
  raw: 'Raw Food',
  treat: 'Treats',
  supplement: 'Supplements',
};

export default function CostsPage() {
  const router = useRouter();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);
  
  const [mealItems, setMealItems] = useState<MealFoodItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const [period, setPeriod] = useState<Period>('monthly');

  const currentPet = pets[currentPetIndex];

  // Fetch pets
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
        .select('id, name, species, breed, photo_url')
        .eq('user_id', user.id)
        .order('name', { ascending: true});

      if (!error && data) {
        setPets(data);
      }
      setLoadingPets(false);
    }

    fetchPets();
  }, [router]);

  // Fetch meal items for current pet
  useEffect(() => {
    if (!currentPet) return;

    async function fetchMealItems() {
      setLoadingItems(true);
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
        setMealItems([]);
        setLoadingItems(false);
        return;
      }

      // Get all meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meals } = await (supabase as any)
        .from('meals')
        .select('id')
        .eq('meal_plan_id', mealPlan.id);

      if (!meals || meals.length === 0) {
        setMealItems([]);
        setLoadingItems(false);
        return;
      }

      // Get all meal items across all meals
      const mealIds = meals.map((m: any) => m.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: items } = await (supabase as any)
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
        .in('meal_id', mealIds);

      if (items) {
        setMealItems(items);
      }
      setLoadingItems(false);
    }

    fetchMealItems();
  }, [currentPet]);

  // Calculate costs
  const { itemCosts, typeBreakdown, totalCost, hasEstimates } = useMemo(() => {
    const itemCosts: Array<{
      id: string;
      name: string;
      brand: string;
      type: string;
      dailyCost: number;
      isEstimate: boolean;
    }> = [];

    const typeBreakdown: Record<string, number> = {};
    let totalDailyCost = 0;
    let hasEstimates = false;

    mealItems.forEach(item => {
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
        itemCosts.push({
          id: item.food.id,
          name: item.food.name,
          brand: item.food.brand,
          type: item.food.item_type,
          dailyCost: result.cost,
          isEstimate: result.isEstimate,
        });

        totalDailyCost += result.cost;

        // Accumulate by type
        if (!typeBreakdown[item.food.item_type]) {
          typeBreakdown[item.food.item_type] = 0;
        }
        typeBreakdown[item.food.item_type] += result.cost;

        if (result.isEstimate) {
          hasEstimates = true;
        }
      }
    });

    // Sort items by cost (highest first)
    itemCosts.sort((a, b) => b.dailyCost - a.dailyCost);

    // Convert to period cost
    const totalCost = calculatePeriodCost(totalDailyCost, period);

    return { itemCosts, typeBreakdown, totalCost, hasEstimates };
  }, [mealItems, period]);

  // Calculate chart data
  const chartData = useMemo(() => {
    if (totalCost === 0) return [];

    return Object.entries(typeBreakdown).map(([type, cost]) => ({
      type,
      label: FOOD_TYPE_LABELS[type] || type,
      value: cost,
      percent: (cost / (totalCost / calculatePeriodCost(1, period))) * 100,
      color: FOOD_TYPE_COLORS[type] || '#6B7280',
    }));
  }, [typeBreakdown, totalCost, period]);

  const handlePetSwitch = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPetIndex > 0) {
      setCurrentPetIndex(currentPetIndex - 1);
    } else if (direction === 'next' && currentPetIndex < pets.length - 1) {
      setCurrentPetIndex(currentPetIndex + 1);
    }
  };

  // Calculate donut chart path
  const createDonutPath = () => {
    if (chartData.length === 0) return [];

    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    const innerRadius = 65;
    
    let currentAngle = -90; // Start at top
    
    return chartData.map(data => {
      const angleSize = (data.percent / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSize;
      
      currentAngle = endAngle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const ix1 = centerX + innerRadius * Math.cos(startRad);
      const iy1 = centerY + innerRadius * Math.sin(startRad);
      const ix2 = centerX + innerRadius * Math.cos(endRad);
      const iy2 = centerY + innerRadius * Math.sin(endRad);
      
      const largeArc = angleSize > 180 ? 1 : 0;
      
      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
        'Z',
      ].join(' ');
      
      return {
        ...data,
        path,
      };
    });
  };

  const donutPaths = createDonutPath();
  const maxItemCost = itemCosts.length > 0 ? itemCosts[0].dailyCost : 0;

  if (loadingPets) {
    return (
      <div className="min-h-screen bg-light-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
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
          <p className="text-gray-500 mb-6">Add a pet to track costs</p>
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
    <div className="min-h-screen bg-light-cream pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-charcoal mb-4">Cost Analytics</h1>

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

        {/* Total Cost Display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-charcoal">
            {formatCost(totalCost)}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 bg-gray-100 rounded-button p-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-button text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-deep-teal text-white'
                  : 'text-gray-600 hover:text-charcoal'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {loadingItems ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : itemCosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🍽️</span>
            </div>
            <p className="text-gray-500 text-sm">No meals configured yet</p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="bg-white rounded-card p-6 shadow-card">
              <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
                {donutPaths.map((segment, index) => (
                  <path
                    key={index}
                    d={segment.path}
                    fill={segment.color}
                    opacity={0.9}
                  />
                ))}
                
                {/* Center text */}
                <text
                  x="150"
                  y="145"
                  textAnchor="middle"
                  fontSize="32"
                  fontWeight="bold"
                  fill="#1F2937"
                >
                  100%
                </text>
                <text
                  x="150"
                  y="165"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#6B7280"
                >
                  Total
                </text>
              </svg>

              {/* Legend */}
              <div className="mt-6 space-y-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <span className="text-gray-600">{data.label}</span>
                    </div>
                    <span className="font-medium text-charcoal">{data.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost by Item */}
            <div className="bg-white rounded-card p-4 shadow-card">
              <h2 className="font-semibold text-charcoal mb-4">Cost by Item</h2>
              
              <div className="space-y-3">
                {itemCosts.map((item, index) => {
                  const periodCost = calculatePeriodCost(item.dailyCost, period);
                  const barWidth = maxItemCost > 0 ? (item.dailyCost / maxItemCost) * 100 : 0;
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                        </div>
                        <span className="font-bold text-charcoal ml-3">{formatCost(periodCost)}</span>
                      </div>
                      
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: FOOD_TYPE_COLORS[item.type] || '#6B7280',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
