export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          weight_unit?: 'lb' | 'kg';
          currency?: string;
          is_premium?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
          meals_per_day: 1 | 2 | 3;
          treat_allowance_percent: number;
          meal_distribution: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pets']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['pets']['Insert']>;
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
          package_price: number | null;
          package_size: number | null;
          package_unit: string | null;
          use_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at' | 'use_count'>;
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
      };
      recommended_foods: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          category: 'budget' | 'balanced' | 'premium' | 'sensitive';
          style: string;
          kcal_per_kg: number;
          kcal_per_cup: number | null;
          protein_percent: number | null;
          fat_percent: number | null;
          amazon_url: string | null;
          is_primary: boolean;
          is_active: boolean;
        };
        Insert: Database['public']['Tables']['recommended_foods']['Row'];
        Update: Partial<Database['public']['Tables']['recommended_foods']['Insert']>;
      };
      recommended_treats: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          brand: string;
          name: string;
          calories_per_treat: number;
          amazon_url: string | null;
          is_default: boolean;
        };
        Insert: Database['public']['Tables']['recommended_treats']['Row'];
        Update: Partial<Database['public']['Tables']['recommended_treats']['Insert']>;
      };
      recommendation_rules: {
        Row: {
          id: string;
          species: 'dog' | 'cat';
          priority: string;
          primary_food_id: string;
          secondary_food_id: string | null;
          default_treat_id: string | null;
        };
        Insert: Database['public']['Tables']['recommendation_rules']['Row'];
        Update: Partial<Database['public']['Tables']['recommendation_rules']['Insert']>;
      };
    };
    Functions: {
      get_food_recommendation: {
        Args: { p_species: string; p_priority: string };
        Returns: { primary_food: Json; secondary_food: Json; recommended_treat: Json }[];
      };
    };
  };
};

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Pet = Database['public']['Tables']['pets']['Row'];
export type PetInsert = Database['public']['Tables']['pets']['Insert'];
export type Item = Database['public']['Tables']['items']['Row'];
export type RecommendedFood = Database['public']['Tables']['recommended_foods']['Row'];
export type RecommendedTreat = Database['public']['Tables']['recommended_treats']['Row'];
