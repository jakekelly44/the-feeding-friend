import { createClient } from '@/lib/supabase/client';

export type Priority = 'weight_control' | 'digestive_health' | 'ingredient_quality' | 'budget';
export type FoodCategory = 'budget' | 'balanced' | 'premium' | 'sensitive';

export interface RecommendedFood {
  id: string;
  brand: string;
  name: string;
  category: FoodCategory;
  style: string;
  species: string;
  amazon_url?: string;
  calories_per_cup?: number;
  price_per_bag?: number;
  bag_size_cups?: number;
}

export interface GroupedRecommendations {
  budget: RecommendedFood[];
  balanced: RecommendedFood[];
  premium: RecommendedFood[];
  sensitive: RecommendedFood[];
}

/**
 * Get recommended foods for a pet based on their priority
 */
export async function getRecommendedFoods(
  species: string,
  priority: Priority
): Promise<GroupedRecommendations> {
  const supabase = createClient();
  
  // Map user priority to food categories
  const categoryMap: Record<Priority, FoodCategory[]> = {
    budget: ['budget', 'balanced'],
    weight_control: ['balanced', 'sensitive'],
    digestive_health: ['sensitive', 'balanced'],
    ingredient_quality: ['premium', 'balanced'],
  };
  
  const relevantCategories = categoryMap[priority] || ['balanced'];
  
  // Fetch foods from database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: foods, error } = await (supabase as any)
    .from('recommended_foods')
    .select('*')
    .eq('species', species.toLowerCase())
    .in('category', relevantCategories)
    .limit(20);
  
  if (error) {
    console.error('Error fetching recommended foods:', error);
    return { budget: [], balanced: [], premium: [], sensitive: [] };
  }
  
  // Group by category
  const grouped: GroupedRecommendations = {
    budget: [],
    balanced: [],
    premium: [],
    sensitive: [],
  };
  
  foods?.forEach((food: RecommendedFood) => {
    if (food.category in grouped) {
      grouped[food.category].push(food);
    }
  });
  
  return grouped;
}

/**
 * Calculate daily cost for a food
 */
export function calculateDailyCost(
  food: RecommendedFood,
  dailyCalories: number
): { cupsPerDay: number; costPerDay: number } {
  if (!food.calories_per_cup || !food.price_per_bag || !food.bag_size_cups) {
    return { cupsPerDay: 0, costPerDay: 0 };
  }
  
  const cupsPerDay = dailyCalories / food.calories_per_cup;
  const costPerCup = food.price_per_bag / food.bag_size_cups;
  const costPerDay = cupsPerDay * costPerCup;
  
  return {
    cupsPerDay: parseFloat(cupsPerDay.toFixed(2)),
    costPerDay: parseFloat(costPerDay.toFixed(2)),
  };
}

/**
 * Get section metadata for PDF rendering
 */
export function getSectionInfo(category: FoodCategory): {
  title: string;
  description: string;
} {
  const sections = {
    budget: {
      title: 'Budget-Friendly',
      description: 'Great nutrition at a lower cost',
    },
    balanced: {
      title: 'Balanced Choice',
      description: 'Optimal balance of quality and price',
    },
    premium: {
      title: 'Premium Quality',
      description: 'High-quality ingredients and formulations',
    },
    sensitive: {
      title: 'Sensitive Stomach',
      description: 'Gentle formulas for digestive health',
    },
  };
  
  return sections[category];
}
