export type Species = 'dog' | 'cat';
export type ActivityMethod = 'steps' | 'time' | 'categories';
export type ActivityCategory = 'sedentary' | 'low' | 'normal' | 'active' | 'highly-active';
export type ActivityPace = 'slow' | 'moderate' | 'fast';
export type LifeStage = 'young-puppy' | 'older-puppy' | 'kitten' | 'adult' | 'senior';
export type OutdoorExposure = 'indoor' | 'less-than-2' | '2-4' | '4-8' | '8-12' | '12-plus';
export type Climate = 'mild' | 'cold' | 'hot';
export type BCS = '1-2' | '3' | '4-5' | '6-7' | '8-9';
export type WeightGoal = 'maintain' | 'gain' | 'lose';
export type WeightUnit = 'lb' | 'kg';
export type CoatType = 'short' | 'long';

export interface CalculatorInput {
  species: Species;
  breed: string | null;
  weight: number;
  weightUnit: WeightUnit;
  isNeutered: boolean;
  activityMethod: ActivityMethod;
  dailySteps: number | null;
  activityMinutes: number | null;
  activityPace: ActivityPace | null;
  activityCategory: ActivityCategory | null;
  lifeStage: LifeStage;
  outdoorExposure: OutdoorExposure;
  climate: Climate | null;
  bcs: BCS;
  weightGoal: WeightGoal;
  healthStatus: 'healthy' | 'has-conditions';
  healthConditions: string[];
}

export interface MultiplierDetail {
  value: number;
  label: string;
}

export interface CalculationBreakdown {
  baseline: MultiplierDetail;
  activity: MultiplierDetail;
  lifeStage: MultiplierDetail;
  environment: MultiplierDetail;
  bodyCondition: MultiplierDetail;
  health: MultiplierDetail;
}

export interface CalculationResult {
  rer: number;
  multiplier: number;
  mer: number;
  breakdown: CalculationBreakdown;
}
