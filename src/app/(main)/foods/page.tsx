'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ScanLine } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { convertToGrams, calculateCostPerGram } from '@/lib/cost-utils';

type ItemType = 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
type FilterType = 'all' | ItemType;

interface FoodItem {
  id: string;
  brand: string;
  name: string;
  item_type: ItemType;
  calories_per_unit: number;
  serving_unit: string;
  serving_grams: number | null;
  package_price: number | null;
  package_size: number | null;
  package_unit: string | null;
  image_url: string | null;
}

// Food type icons/colors
const FOOD_TYPE_STYLES: Record<ItemType, { bg: string; emoji: string }> = {
  dry: { bg: 'bg-amber-100', emoji: '🥣' },
  wet: { bg: 'bg-red-100', emoji: '🥫' },
  raw: { bg: 'bg-orange-100', emoji: '🥩' },
  treat: { bg: 'bg-yellow-100', emoji: '🦴' },
  supplement: { bg: 'bg-blue-100', emoji: '💊' },
};

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'dry', label: 'Dry' },
  { value: 'wet', label: 'Wet' },
  { value: 'raw', label: 'Raw' },
  { value: 'treat', label: 'Treats' },
  { value: 'supplement', label: 'Supplements' },
];

export default function FoodsPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedDisplayUnit, setSelectedDisplayUnit] = useState<string>('cup');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'calories'>('name');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    async function fetchFoods() {
      const supabase = createClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('items')
        .select('id, brand, name, item_type, calories_per_unit, serving_unit, serving_grams, package_price, package_size, package_unit, image_url')
        .order('use_count', { ascending: false })
        .order('brand', { ascending: true })
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching foods:', error);
      } else {
        setFoods(data || []);
        setHasMore(data && data.length === ITEMS_PER_PAGE);
      }
      setLoading(false);
    }

    fetchFoods();
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const supabase = createClient();
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('items')
      .select('id, brand, name, item_type, calories_per_unit, serving_unit, serving_grams, package_price, package_size, package_unit, image_url')
      .order('use_count', { ascending: false })
      .order('brand', { ascending: true })
      .range(start, end);

    if (!error && data) {
      setFoods(prev => [...prev, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);
      setPage(prev => prev + 1);
    }
    setLoadingMore(false);
  };

  // Unit conversion constants
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

  // Convert a food's serving unit to grams (for base calorie calculation)
  // When serving_unit is 'g', calories_per_unit is per 1 gram
  function servingUnitToGrams(unit: string, foodType: ItemType): number {
    switch (unit) {
      case 'cup':
        return GRAMS_PER_CUP[foodType];
      case 'can':
        return GRAMS_PER_CAN;
      case 'oz':
        return GRAMS_PER_OZ;
      case 'g':
        return 1; // calories_per_unit is per 1 gram when serving_unit is 'g'
      case 'piece':
        return GRAMS_PER_PIECE;
      case 'scoop':
        return 15; // Approximate scoop size
      case 'pump':
        return 5; // Approximate pump size
      default:
        return GRAMS_PER_CUP[foodType];
    }
  }

  // Convert display unit to grams (for showing calories/cost per selected unit)
  // When display is 'g', we show per 100g
  function displayUnitToGrams(unit: string, foodType: ItemType): number {
    switch (unit) {
      case 'cup':
        return GRAMS_PER_CUP[foodType];
      case 'can':
        return GRAMS_PER_CAN;
      case 'oz':
        return GRAMS_PER_OZ;
      case 'g':
        return 100; // Display "per 100g"
      case 'piece':
        return GRAMS_PER_PIECE;
      default:
        return GRAMS_PER_CUP[foodType];
    }
  }

  // Check if a display unit is compatible with a food's serving unit
  // Can and Piece are only valid if the food was entered with that unit
  function isUnitCompatible(food: FoodItem, displayUnit: string): boolean {
    // Can and piece require the food to have been entered with that serving unit
    if (displayUnit === 'can') {
      return food.serving_unit === 'can';
    }
    if (displayUnit === 'piece') {
      return food.serving_unit === 'piece';
    }
    // Other units (cup, oz, g) can be converted for any food
    return true;
  }

  // Calculate cost in selected unit
  function calculateCostInUnit(food: FoodItem, displayUnit: string): number | null {
    if (!food.package_price || !food.package_size || !food.package_unit) {
      return null;
    }

    try {
      // Get grams for the display unit
      const displayGrams = displayUnitToGrams(displayUnit, food.item_type);

      const { costPerGram } = calculateCostPerGram(
        food.package_price,
        food.package_size,
        food.package_unit,
        food.item_type
      );

      return displayGrams * costPerGram;
    } catch {
      return null;
    }
  }

  // Calculate calories in selected unit
  function calculateCaloriesInUnit(food: FoodItem, displayUnit: string): number {
    // Get the food's serving size in grams
    // If serving_grams is provided, use it; otherwise convert serving_unit to grams
    const servingGrams = food.serving_grams || servingUnitToGrams(food.serving_unit, food.item_type);

    // Calculate calories per gram
    const caloriesPerGram = food.calories_per_unit / servingGrams;

    // Get grams for the display unit
    const displayGrams = displayUnitToGrams(displayUnit, food.item_type);

    // Calculate calories for the display unit
    return Math.round(caloriesPerGram * displayGrams);
  }

  // Filter and search with sorting
  const filteredFoods = useMemo(() => {
    let result = foods;

    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter(food => food.item_type === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        food =>
          food.brand.toLowerCase().includes(query) ||
          food.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        
        case 'cost':
          const costA = calculateCostInUnit(a, selectedDisplayUnit);
          const costB = calculateCostInUnit(b, selectedDisplayUnit);
          // Items without cost go to end
          if (costA === null && costB === null) return 0;
          if (costA === null) return 1;
          if (costB === null) return -1;
          return costA - costB;
        
        case 'calories':
          return a.calories_per_unit - b.calories_per_unit;
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [foods, activeFilter, searchQuery, sortBy, selectedDisplayUnit]);

  const handleFoodClick = (foodId: string) => {
    router.push(`/foods/${foodId}`);
  };

  const handleAddToMeal = (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/foods/${foodId}`);
  };

  return (
    <div className="min-h-screen bg-light-cream pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-charcoal">Food Database</h1>
          <button
            onClick={() => router.push('/foods/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-deep-teal text-white text-sm font-semibold rounded-button hover:bg-deep-teal-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
          />
        </div>

        {/* Unit Selector & Sort */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Display sizes as:</label>
            <select
              value={selectedDisplayUnit}
              onChange={(e) => setSelectedDisplayUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-button bg-white focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            >
              <option value="cup">Per Cup</option>
              <option value="can">Per Can</option>
              <option value="oz">Per Ounce</option>
              <option value="g">Per 100g</option>
              <option value="piece">Per Piece</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'cost' | 'calories')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-button bg-white focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            >
              <option value="name">Name (A-Z)</option>
              <option value="cost">Cost (Low to High)</option>
              <option value="calories">Calories</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.value
                  ? 'bg-deep-teal text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-deep-teal-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food List */}
      <div className="px-4 space-y-3">
        {loading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-12 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              {searchQuery ? 'No foods found' : 'No foods yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Be the first to add a food to the database!'}
            </p>
            <button
              onClick={() => router.push('/foods/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Food
            </button>
          </div>
        ) : (
          // Food cards
          filteredFoods.map((food) => {
            const style = FOOD_TYPE_STYLES[food.item_type];
            return (
              <div
                key={food.id}
                onClick={() => handleFoodClick(food.id)}
                className="bg-white rounded-card p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Food Type Icon */}
                  <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center text-xl`}>
                    {food.image_url ? (
                      <img 
                        src={food.image_url} 
                        alt={food.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      style.emoji
                    )}
                  </div>

                  {/* Food Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-charcoal truncate">{food.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{food.brand}</p>
                    {/* Show cost in selected unit */}
                    {(() => {
                      // Check if unit is compatible with this food
                      if (!isUnitCompatible(food, selectedDisplayUnit)) {
                        return (
                          <p className="text-xs text-gray-400 italic mt-0.5">
                            Per {selectedDisplayUnit} data not available
                          </p>
                        );
                      }
                      const cost = calculateCostInUnit(food, selectedDisplayUnit);
                      return cost ? (
                        <p className="text-xs text-deep-teal font-medium mt-0.5">
                          ${cost.toFixed(2)}/{selectedDisplayUnit}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Calories + Add Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {isUnitCompatible(food, selectedDisplayUnit) ? (
                        <>
                          <span className="font-semibold text-deep-teal">{calculateCaloriesInUnit(food, selectedDisplayUnit)}</span>
                          <p className="text-xs text-gray-400">kcal/{selectedDisplayUnit === 'g' ? '100g' : selectedDisplayUnit}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">N/A</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleAddToMeal(e, food.id)}
                      className="w-9 h-9 flex items-center justify-center bg-deep-teal-50 text-deep-teal rounded-full hover:bg-deep-teal-100 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load More Button */}
        {!loading && hasMore && filteredFoods.length > 0 && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-deep-teal text-white rounded-button font-semibold hover:bg-deep-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
