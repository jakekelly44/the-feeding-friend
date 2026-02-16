// Food recommendations extracted from live site

export interface FoodItem {
  food_id: string;
  species: 'dog' | 'cat';
  brand: string;
  sku_name: string;
  category: 'budget' | 'balanced' | 'sensitive' | 'premium';
  style: 'dry' | 'wet' | 'freeze-dried' | 'cooked';
  protein_source: string;
  aafco_complete: boolean;
  amazon_url: string;
  kcal_per_cup: number;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  package_size_lb: number;
  package_price_usd: number;
  cost_per_1000_kcal: number;
}

export interface TreatItem {
  treat_id: string;
  species: 'dog' | 'cat';
  brand: string;
  sku_name: string;
  category: 'training' | 'dental' | 'functional';
  calories_per_treat: number;
  amazon_url: string;
}

export const foodRecommendations: FoodItem[] = [
  // Dog Foods
  {
    food_id: 'DOG_OPENFARM_TURKEY',
    species: 'dog',
    brand: 'Open Farm',
    sku_name: 'Ancient Grains Dry Dog Food – Homestead Turkey',
    category: 'budget',
    style: 'dry',
    protein_source: 'turkey',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/8wdebrW',
    kcal_per_cup: 425,
    protein_pct: 26,
    fat_pct: 15,
    fiber_pct: 4.5,
    package_size_lb: 22,
    package_price_usd: 83,
    cost_per_1000_kcal: 2.22,
  },
  {
    food_id: 'DOG_NWNAT_BEEF_FD',
    species: 'dog',
    brand: 'Northwest Naturals',
    sku_name: 'Freeze-Dried Beef Dog Food',
    category: 'budget',
    style: 'freeze-dried',
    protein_source: 'beef',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/ge0PCx9',
    kcal_per_cup: 182,
    protein_pct: 41,
    fat_pct: 34,
    fiber_pct: 6,
    package_size_lb: 1.56,
    package_price_usd: 47.66,
    cost_per_1000_kcal: 13,
  },
  {
    food_id: 'DOG_JFFD_CHICKEN_RICE',
    species: 'dog',
    brand: 'JustFoodForDogs',
    sku_name: 'Chicken & White Rice',
    category: 'balanced',
    style: 'cooked',
    protein_source: 'chicken',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/1CujrXA',
    kcal_per_cup: 248,
    protein_pct: 6.5,
    fat_pct: 2.5,
    fiber_pct: 1,
    package_size_lb: 4.6875,
    package_price_usd: 44.94,
    cost_per_1000_kcal: 19.34,
  },
  {
    food_id: 'DOG_HONEST_TURKEY',
    species: 'dog',
    brand: 'Honest Kitchen',
    sku_name: 'Turkey Recipe',
    category: 'balanced',
    style: 'cooked',
    protein_source: 'turkey',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/ennwk10',
    kcal_per_cup: 488,
    protein_pct: 29,
    fat_pct: 18,
    fiber_pct: 9.6,
    package_size_lb: 4,
    package_price_usd: 59.99,
    cost_per_1000_kcal: 7.68,
  },
  {
    food_id: 'DOG_CARU_CHICKEN_STEW',
    species: 'dog',
    brand: 'Caru',
    sku_name: 'Daily Dish Chicken Stew',
    category: 'sensitive',
    style: 'wet',
    protein_source: 'chicken',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/2zzNfPn',
    kcal_per_cup: 179,
    protein_pct: 5,
    fat_pct: 1.5,
    fiber_pct: 2,
    package_size_lb: 9.375,
    package_price_usd: 46.98,
    cost_per_1000_kcal: 13.47,
  },
  {
    food_id: 'DOG_ORIJEN_ORIGINAL',
    species: 'dog',
    brand: 'Orijen',
    sku_name: 'Original Dry Dog Food',
    category: 'premium',
    style: 'dry',
    protein_source: 'chicken/turkey',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/example',
    kcal_per_cup: 449,
    protein_pct: 38,
    fat_pct: 18,
    fiber_pct: 4,
    package_size_lb: 23.5,
    package_price_usd: 129.99,
    cost_per_1000_kcal: 3.24,
  },
  
  // Cat Foods
  {
    food_id: 'CAT_OPENFARM_SALMON',
    species: 'cat',
    brand: 'Open Farm',
    sku_name: 'Wild-Caught Salmon Dry Cat Food',
    category: 'budget',
    style: 'dry',
    protein_source: 'fish',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/fPCkOsj',
    kcal_per_cup: 470,
    protein_pct: 37,
    fat_pct: 18,
    fiber_pct: 3,
    package_size_lb: 8,
    package_price_usd: 49.99,
    cost_per_1000_kcal: 3.59,
  },
  {
    food_id: 'CAT_NWNAT_CHICKEN_FD',
    species: 'cat',
    brand: 'Northwest Naturals',
    sku_name: 'Freeze-Dried Chicken Cat Food',
    category: 'budget',
    style: 'freeze-dried',
    protein_source: 'chicken',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/5tHPBaS',
    kcal_per_cup: 134,
    protein_pct: 45,
    fat_pct: 15,
    fiber_pct: 5,
    package_size_lb: 0.6875,
    package_price_usd: 28.99,
    cost_per_1000_kcal: 24.42,
  },
  {
    food_id: 'CAT_SMALLBATCH_CHICKEN',
    species: 'cat',
    brand: 'smallbatch Pets',
    sku_name: 'Freeze-Dried Raw Cat Food – Chicken',
    category: 'balanced',
    style: 'freeze-dried',
    protein_source: 'chicken',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/39AScD7',
    kcal_per_cup: 190,
    protein_pct: 63.7,
    fat_pct: 24.9,
    fiber_pct: 1.22,
    package_size_lb: 0.625,
    package_price_usd: 27.99,
    cost_per_1000_kcal: 22.96,
  },
  {
    food_id: 'CAT_JFFD_FISH_CHICKEN',
    species: 'cat',
    brand: 'JustFoodForDogs',
    sku_name: 'Frozen Fresh Cat Food – Fish & Chicken',
    category: 'premium',
    style: 'cooked',
    protein_source: 'fish/chicken',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/1nkCuex',
    kcal_per_cup: 336,
    protein_pct: 12,
    fat_pct: 4.5,
    fiber_pct: 0.5,
    package_size_lb: 7.875,
    package_price_usd: 111.99,
    cost_per_1000_kcal: 21.34,
  },
  {
    food_id: 'CAT_TIKI_PATE',
    species: 'cat',
    brand: 'Tiki Cat',
    sku_name: 'Luau Variety Pack Wet Food',
    category: 'sensitive',
    style: 'wet',
    protein_source: 'fish',
    aafco_complete: true,
    amazon_url: 'https://a.co/d/example2',
    kcal_per_cup: 120,
    protein_pct: 14,
    fat_pct: 2,
    fiber_pct: 0.5,
    package_size_lb: 2.1,
    package_price_usd: 29.99,
    cost_per_1000_kcal: 17.85,
  },
];

export const treatRecommendations: TreatItem[] = [
  {
    treat_id: 'DOG_OPENFARM_FD_TREATS',
    species: 'dog',
    brand: 'Open Farm',
    sku_name: 'Freeze-Dried Raw Dog Treats',
    category: 'training',
    calories_per_treat: 2,
    amazon_url: 'https://a.co/d/4cq4t3o',
  },
  {
    treat_id: 'DOG_WHIMZEES_DENTAL',
    species: 'dog',
    brand: 'Whimzees',
    sku_name: 'Natural Dental Chews',
    category: 'dental',
    calories_per_treat: 15,
    amazon_url: 'https://a.co/d/example3',
  },
  {
    treat_id: 'CAT_SMALLBATCH_FD_TREATS',
    species: 'cat',
    brand: 'smallbatch Pets',
    sku_name: 'Freeze-Dried Raw Cat Treats',
    category: 'training',
    calories_per_treat: 8,
    amazon_url: 'https://a.co/d/cJa8eHK',
  },
  {
    treat_id: 'CAT_OPENFARM_FD_TREATS',
    species: 'cat',
    brand: 'Open Farm',
    sku_name: 'Freeze-Dried Raw Cat Treats',
    category: 'training',
    calories_per_treat: 3,
    amazon_url: 'https://a.co/d/ffeqnd7',
  },
];

export function getFoodsBySpecies(species: 'dog' | 'cat'): FoodItem[] {
  return foodRecommendations.filter(f => f.species === species);
}

export function getTreatsBySpecies(species: 'dog' | 'cat'): TreatItem[] {
  return treatRecommendations.filter(t => t.species === species);
}

export function calculatePortionSize(dailyCalories: number, food: FoodItem): { cups: number; grams: number } {
  const cups = dailyCalories / food.kcal_per_cup;
  const grams = cups * 227; // ~227g per cup
  return { cups: Math.round(cups * 100) / 100, grams: Math.round(grams) };
}

export function calculateDailyCost(dailyCalories: number, food: FoodItem): number {
  return (dailyCalories / 1000) * food.cost_per_1000_kcal;
}
