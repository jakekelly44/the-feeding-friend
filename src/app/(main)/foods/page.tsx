'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ScanLine } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ItemType = 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
type FilterType = 'all' | ItemType;

interface FoodItem {
  id: string;
  brand: string;
  name: string;
  item_type: ItemType;
  calories_per_unit: number;
  serving_unit: string;
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
];

export default function FoodsPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    async function fetchFoods() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('items')
        .select('id, brand, name, item_type, calories_per_unit, serving_unit, image_url')
        .order('use_count', { ascending: false })
        .order('brand', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching foods:', error);
      } else {
        setFoods(data || []);
      }
      setLoading(false);
    }

    fetchFoods();
  }, []);

  // Filter and search
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

    return result;
  }, [foods, activeFilter, searchQuery]);

  const handleAddToMeal = (foodId: string) => {
    // TODO: Implement add to meal flow
    // For now, navigate to food detail or show modal
    console.log('Add to meal:', foodId);
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
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
          />
          {/* OCR Scan Button (Premium) */}
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-deep-teal"
            onClick={() => {
              // TODO: Check premium status and show OCR or upsell
              alert('OCR scanning is a premium feature');
            }}
          >
            <ScanLine className="w-5 h-5" />
          </button>
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
                className="bg-white rounded-card p-4 shadow-card hover:shadow-card-hover transition-shadow"
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
                  </div>

                  {/* Calories + Add Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-semibold text-deep-teal">{food.calories_per_unit}</span>
                      <p className="text-xs text-gray-400">kcal/{food.serving_unit}</p>
                    </div>
                    <button
                      onClick={() => handleAddToMeal(food.id)}
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
      </div>
    </div>
  );
}
