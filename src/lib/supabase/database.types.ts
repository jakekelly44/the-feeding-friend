// Database types for The Feeding Friend
// Generated from Supabase schema
// To regenerate: npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          weight_unit: 'lb' | 'kg';
          currency: string;
          language: string;
          is_premium: boolean;
          premium_purchased_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          weight_unit?: 'lb' | 'kg';
          currency?: string;
          language?: string;
          is_premium?: boolean;
          premium_purchased_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          weight_unit?: 'lb' | 'kg';
          currency?: string;
          language?: string;
          is_premium?: boolean;
          premium_purchased_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          photo_url: string | null;
          species: 'dog' | 'cat';
          breed: string | null;
          weight_value: number;
          weight_unit: 'lb' | 'kg';
          target_weight_value: number | null;
          activity_method: 'steps' | 'time' | 'categories';
          daily_steps: number | null;
          activity_minutes: number | null;
          activity_pace: 'slow' | 'moderate' | 'fast' | null;
          activity_category: 'sedentary' | 'low' | 'normal' | 'active' | 'highly-active' | null;
          life_stage: 'young-puppy' | 'older-puppy' | 'kitten' | 'adult' | 'senior';
          date_of_birth: string | null;
          outdoor_exposure: 'indoor' | 'less-than-2' | '2-4' | '4-8' | '8-12' | '12-plus';
          climate: 'mild' | 'cold' | 'hot' | null;
          bcs: '1-2' | '3' | '4-5' | '6-7' | '8-9';
          weight_goal: 'maintain' | 'gain' | 'lose';
          health_status: 'healthy' | 'has-conditions';
          health_conditions: string[];
          is_neutered: boolean;
          daily_calories: number;
          calculation_breakdown: Json;
          calories_override: number | null;
          meals_per_day: 1 | 2 | 3;
          treat_allowance_percent: number;
          meal_distribution: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          photo_url?: string | null;
          species: 'dog' | 'cat';
          breed?: string | null;
          weight_value: number;
          weight_unit?: 'lb' | 'kg';
          target_weight_value?: number | null;
          activity_method: 'steps' | 'time' | 'categories';
          daily_steps?: number | null;
          activity_minutes?: number | null;
          activity_pace?: 'slow' | 'moderate' | 'fast' | null;
          activity_category?: 'sedentary' | 'low' | 'normal' | 'active' | 'highly-active' | null;
          life_stage: 'young-puppy' | 'older-puppy' | 'kitten' | 'adult' | 'senior';
          date_of_birth?: string | null;
          outdoor_exposure?: 'indoor' | 'less-than-2' | '2-4' | '4-8' | '8-12' | '12-plus';
          climate?: 'mild' | 'cold' | 'hot' | null;
          bcs: '1-2' | '3' | '4-5' | '6-7' | '8-9';
          weight_goal?: 'maintain' | 'gain' | 'lose';
          health_status?: 'healthy' | 'has-conditions';
          health_conditions?: string[];
          is_neutered?: boolean;
          daily_calories: number;
          calculation_breakdown: Json;
          calories_override?: number | null;
          meals_per_day?: 1 | 2 | 3;
          treat_allowance_percent?: number;
          meal_distribution?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          photo_url?: string | null;
          species?: 'dog' | 'cat';
          breed?: string | null;
          weight_value?: number;
          weight_unit?: 'lb' | 'kg';
          target_weight_value?: number | null;
          activity_method?: 'steps' | 'time' | 'categories';
          daily_steps?: number | null;
          activity_minutes?: number | null;
          activity_pace?: 'slow' | 'moderate' | 'fast' | null;
          activity_category?: 'sedentary' | 'low' | 'normal' | 'active' | 'highly-active' | null;
          life_stage?: 'young-puppy' | 'older-puppy' | 'kitten' | 'adult' | 'senior';
          date_of_birth?: string | null;
          outdoor_exposure?: 'indoor' | 'less-than-2' | '2-4' | '4-8' | '8-12' | '12-plus';
          climate?: 'mild' | 'cold' | 'hot' | null;
          bcs?: '1-2' | '3' | '4-5' | '6-7' | '8-9';
          weight_goal?: 'maintain' | 'gain' | 'lose';
          health_status?: 'healthy' | 'has-conditions';
          health_conditions?: string[];
          is_neutered?: boolean;
          daily_calories?: number;
          calculation_breakdown?: Json;
          calories_override?: number | null;
          meals_per_day?: 1 | 2 | 3;
          treat_allowance_percent?: number;
          meal_distribution?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      weight_entries: {
        Row: {
          id: string;
          pet_id: string;
          weight_value: number;
          weight_unit: 'lb' | 'kg';
          recorded_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          weight_value: number;
          weight_unit: 'lb' | 'kg';
          recorded_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pet_id?: string;
          weight_value?: number;
          weight_unit?: 'lb' | 'kg';
          recorded_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          created_by: string | null;
          brand: string;
          name: string;
          item_type: 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
          calories_per_unit: number;
          serving_unit: 'cup' | 'can' | 'oz' | 'g' | 'piece' | 'scoop' | 'pump';
          serving_grams: number | null;
          protein_percent: number | null;
          fat_percent: number | null;
          fiber_percent: number | null;
          moisture_percent: number | null;
          package_price: number | null;
          package_size: number | null;
          package_unit: 'oz' | 'lb' | 'kg' | 'g' | 'can' | 'bag' | 'box' | 'piece' | null;
          currency: string | null;
          cost_per_serving: number | null;
          cost_per_calorie: number | null;
          source: 'manual' | 'ocr' | 'barcode';
          barcode: string | null;
          image_url: string | null;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          brand: string;
          name: string;
          item_type: 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
          calories_per_unit: number;
          serving_unit: 'cup' | 'can' | 'oz' | 'g' | 'piece' | 'scoop' | 'pump';
          serving_grams?: number | null;
          protein_percent?: number | null;
          fat_percent?: number | null;
          fiber_percent?: number | null;
          moisture_percent?: number | null;
          package_price?: number | null;
          package_size?: number | null;
          package_unit?: 'oz' | 'lb' | 'kg' | 'g' | 'can' | 'bag' | 'box' | 'piece' | null;
          currency?: string | null;
          cost_per_serving?: number | null;
          cost_per_calorie?: number | null;
          source?: 'manual' | 'ocr' | 'barcode';
          barcode?: string | null;
          image_url?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string | null;
          brand?: string;
          name?: string;
          item_type?: 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
          calories_per_unit?: number;
          serving_unit?: 'cup' | 'can' | 'oz' | 'g' | 'piece' | 'scoop' | 'pump';
          serving_grams?: number | null;
          protein_percent?: number | null;
          fat_percent?: number | null;
          fiber_percent?: number | null;
          moisture_percent?: number | null;
          package_price?: number | null;
          package_size?: number | null;
          package_unit?: 'oz' | 'lb' | 'kg' | 'g' | 'can' | 'bag' | 'box' | 'piece' | null;
          currency?: string | null;
          cost_per_serving?: number | null;
          cost_per_calorie?: number | null;
          source?: 'manual' | 'ocr' | 'barcode';
          barcode?: string | null;
          image_url?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      recommended_foods: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          category: 'budget' | 'balanced' | 'premium' | 'sensitive';
          style: 'dry' | 'wet' | 'cooked' | 'freeze-dried' | 'raw';
          protein_source: string | null;
          is_aafco_complete: boolean;
          kcal_per_kg: number;
          kcal_per_cup: number | null;
          kcal_per_can: number | null;
          grams_per_cup: number | null;
          protein_percent: number | null;
          fat_percent: number | null;
          fiber_percent: number | null;
          moisture_percent: number | null;
          package_size_lb: number | null;
          package_price_usd: number | null;
          cost_per_1000_kcal: number | null;
          retailer: string | null;
          price_last_checked: string | null;
          amazon_asin: string | null;
          amazon_url: string | null;
          amazon_search_query: string | null;
          is_primary: boolean;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          category: 'budget' | 'balanced' | 'premium' | 'sensitive';
          style: 'dry' | 'wet' | 'cooked' | 'freeze-dried' | 'raw';
          protein_source?: string | null;
          is_aafco_complete?: boolean;
          kcal_per_kg: number;
          kcal_per_cup?: number | null;
          kcal_per_can?: number | null;
          grams_per_cup?: number | null;
          protein_percent?: number | null;
          fat_percent?: number | null;
          fiber_percent?: number | null;
          moisture_percent?: number | null;
          package_size_lb?: number | null;
          package_price_usd?: number | null;
          cost_per_1000_kcal?: number | null;
          retailer?: string | null;
          price_last_checked?: string | null;
          amazon_asin?: string | null;
          amazon_url?: string | null;
          amazon_search_query?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          species?: 'dog' | 'cat';
          brand?: string;
          name?: string;
          category?: 'budget' | 'balanced' | 'premium' | 'sensitive';
          style?: 'dry' | 'wet' | 'cooked' | 'freeze-dried' | 'raw';
          protein_source?: string | null;
          is_aafco_complete?: boolean;
          kcal_per_kg?: number;
          kcal_per_cup?: number | null;
          kcal_per_can?: number | null;
          grams_per_cup?: number | null;
          protein_percent?: number | null;
          fat_percent?: number | null;
          fiber_percent?: number | null;
          moisture_percent?: number | null;
          package_size_lb?: number | null;
          package_price_usd?: number | null;
          cost_per_1000_kcal?: number | null;
          retailer?: string | null;
          price_last_checked?: string | null;
          amazon_asin?: string | null;
          amazon_url?: string | null;
          amazon_search_query?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recommended_treats: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          category: 'training' | 'everyday' | 'dental';
          style: 'soft-chew' | 'freeze-dried' | 'biscuit' | 'dental' | 'lickable';
          calories_per_treat: number;
          amazon_asin: string | null;
          amazon_url: string | null;
          amazon_search_query: string | null;
          is_default: boolean;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          category: 'training' | 'everyday' | 'dental';
          style: 'soft-chew' | 'freeze-dried' | 'biscuit' | 'dental' | 'lickable';
          calories_per_treat: number;
          amazon_asin?: string | null;
          amazon_url?: string | null;
          amazon_search_query?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          species?: 'dog' | 'cat';
          brand?: string;
          name?: string;
          category?: 'training' | 'everyday' | 'dental';
          style?: 'soft-chew' | 'freeze-dried' | 'biscuit' | 'dental' | 'lickable';
          calories_per_treat?: number;
          amazon_asin?: string | null;
          amazon_url?: string | null;
          amazon_search_query?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recommendation_rules: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          priority: 'budget' | 'balanced' | 'premium' | 'weight-control' | 'sensitive';
          primary_food_id: string;
          secondary_food_id: string | null;
          default_treat_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          species: 'dog' | 'cat';
          priority: 'budget' | 'balanced' | 'premium' | 'weight-control' | 'sensitive';
          primary_food_id: string;
          secondary_food_id?: string | null;
          default_treat_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          species?: 'dog' | 'cat';
          priority?: 'budget' | 'balanced' | 'premium' | 'weight-control' | 'sensitive';
          primary_food_id?: string;
          secondary_food_id?: string | null;
          default_treat_id?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_default_meal_plan: {
        Args: { p_pet_id: string };
        Returns: string;
      };
      search_items: {
        Args: { search_query: string; type_filter?: string };
        Returns: Database['public']['Tables']['items']['Row'][];
      };
      get_food_recommendation: {
        Args: { p_species: string; p_priority: string };
        Returns: {
          primary_food: Json;
          secondary_food: Json;
          recommended_treat: Json;
        }[];
      };
    };
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Pet = Database['public']['Tables']['pets']['Row'];
export type PetInsert = Database['public']['Tables']['pets']['Insert'];
export type PetUpdate = Database['public']['Tables']['pets']['Update'];
export type WeightEntry = Database['public']['Tables']['weight_entries']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type RecommendedFood = Database['public']['Tables']['recommended_foods']['Row'];
export type RecommendedTreat = Database['public']['Tables']['recommended_treats']['Row'];
export type RecommendationRule = Database['public']['Tables']['recommendation_rules']['Row'];
