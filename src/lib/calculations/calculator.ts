import type { CalculatorInput, CalculationResult, CalculationBreakdown } from './types';

export function convertWeight(weight: number, from: 'lb' | 'kg', to: 'lb' | 'kg'): number {
  if (from === to) return weight;
  return from === 'lb' ? weight / 2.20462 : weight * 2.20462;
}

export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

function getBaselineMultiplier(input: CalculatorInput) {
  const m = { dog: { neutered: 1.6, intact: 1.8 }, cat: { neutered: 1.2, intact: 1.4 } };
  const value = m[input.species][input.isNeutered ? 'neutered' : 'intact'];
  return { value, label: `${input.isNeutered ? 'Neutered' : 'Intact'} ${input.species === 'dog' ? 'Dog' : 'Cat'}` };
}

function getActivityMultiplier(input: CalculatorInput) {
  if (input.activityMethod === 'categories' && input.activityCategory) {
    const values: Record<string, number> = { sedentary: 0.75, low: 0.9, normal: 1.0, active: 1.15, 'highly-active': 1.25 };
    const labels: Record<string, string> = { sedentary: 'Sedentary', low: 'Low', normal: 'Normal', active: 'Active', 'highly-active': 'Highly Active' };
    return { value: values[input.activityCategory], label: labels[input.activityCategory] };
  }
  if (input.activityMethod === 'steps' && input.dailySteps !== null) {
    const steps = input.dailySteps;
    if (input.species === 'dog') {
      if (steps < 3000) return { value: 0.75, label: 'Sedentary' };
      if (steps < 7000) return { value: 0.9, label: 'Low' };
      if (steps < 10000) return { value: 1.0, label: 'Normal' };
      if (steps < 13000) return { value: 1.15, label: 'Active' };
      return { value: 1.25, label: 'Highly Active' };
    } else {
      if (steps < 1000) return { value: 0.75, label: 'Sedentary' };
      if (steps < 2500) return { value: 0.9, label: 'Low' };
      if (steps < 4000) return { value: 1.0, label: 'Normal' };
      if (steps < 6000) return { value: 1.15, label: 'Active' };
      return { value: 1.25, label: 'Highly Active' };
    }
  }
  if (input.activityMethod === 'time' && input.activityMinutes && input.activityPace) {
    const pace = { slow: 0.8, moderate: 1.0, fast: 1.2 };
    const adjusted = input.activityMinutes * pace[input.activityPace];
    if (input.species === 'dog') {
      if (adjusted < 15) return { value: 0.75, label: 'Sedentary' };
      if (adjusted < 30) return { value: 0.9, label: 'Low' };
      if (adjusted < 45) return { value: 1.0, label: 'Normal' };
      if (adjusted < 60) return { value: 1.15, label: 'Active' };
      return { value: 1.25, label: 'Highly Active' };
    } else {
      if (adjusted < 10) return { value: 0.75, label: 'Sedentary' };
      if (adjusted < 20) return { value: 0.9, label: 'Low' };
      if (adjusted < 30) return { value: 1.0, label: 'Normal' };
      if (adjusted < 45) return { value: 1.15, label: 'Active' };
      return { value: 1.25, label: 'Highly Active' };
    }
  }
  return { value: 1.0, label: 'Normal' };
}

function getLifeStageMultiplier(input: CalculatorInput) {
  const m: Record<string, Record<string, { value: number; label: string }>> = {
    dog: {
      'young-puppy': { value: 1.875, label: 'Young Puppy (0-4mo)' },
      'older-puppy': { value: 1.25, label: 'Older Puppy (4-12mo)' },
      adult: { value: 1.0, label: 'Adult' },
      senior: { value: 0.95, label: 'Senior' },
    },
    cat: {
      kitten: { value: 2.08, label: 'Kitten' },
      adult: { value: 1.0, label: 'Adult' },
      senior: { value: 0.95, label: 'Senior' },
    },
  };
  return m[input.species][input.lifeStage] || { value: 1.0, label: 'Adult' };
}

function getEnvironmentMultiplier(input: CalculatorInput, isLongHaired: boolean = false) {
  if (input.outdoorExposure === 'indoor' || input.outdoorExposure === 'less-than-2') {
    return { value: 1.0, label: 'Indoor' };
  }
  if (!input.climate) return { value: 1.0, label: 'Indoor' };
  
  const m: Record<string, Record<string, number>> = {
    '2-4': { mild: 1.0, cold: 1.05, hot: 1.0 },
    '4-8': { mild: 1.05, cold: 1.15, hot: 1.05 },
    '8-12': { mild: 1.1, cold: 1.25, hot: 1.1 },
    '12-plus': { mild: 1.15, cold: 1.4, hot: 1.15 },
  };
  let value = m[input.outdoorExposure]?.[input.climate] ?? 1.0;
  
  // Reduce cold multiplier by 20% for long-haired breeds
  if (input.climate === 'cold' && isLongHaired) {
    const reduction = (value - 1.0) * 0.2;
    value = value - reduction;
  }
  
  const labels: Record<string, string> = { mild: 'Mild', cold: 'Cold', hot: 'Hot' };
  return { value, label: `${labels[input.climate]} Climate` };
}

function getBodyConditionMultiplier(input: CalculatorInput) {
  const base: Record<string, number> = { '1-2': 1.2, '3': 1.1, '4-5': 1.0, '6-7': 0.9, '8-9': 0.8 };
  const labels: Record<string, string> = { '1-2': 'Severely Underweight', '3': 'Underweight', '4-5': 'Ideal', '6-7': 'Overweight', '8-9': 'Obese' };
  let value = base[input.bcs];
  
  if (input.weightGoal === 'gain' && input.bcs !== '8-9') value = Math.min(value + 0.1, 1.2);
  if (input.weightGoal === 'lose' && input.bcs !== '1-2') value = Math.max(value - 0.1, 0.7);
  
  return { value, label: labels[input.bcs] };
}

const healthMultipliers: Record<string, number> = {
  'dog-hypothyroid': 0.85, 'dog-ckd-early': 0.95, 'dog-ckd-advanced': 0.85,
  'dog-diabetes-controlled': 1.0, 'dog-diabetes-uncontrolled': 1.1,
  'dog-cushings': 0.9, 'dog-cancer-active': 1.2, 'dog-cancer-recovery': 1.1, 'dog-heart-disease': 0.95,
  'cat-hyperthyroid': 1.3, 'cat-ckd-early': 1.0, 'cat-ckd-advanced': 0.95,
  'cat-diabetes-controlled': 1.0, 'cat-diabetes-uncontrolled': 1.1,
  'cat-ibd': 1.05, 'cat-cancer-active': 1.2, 'cat-cancer-recovery': 1.1, 'cat-heart-disease': 0.95,
};

function getHealthMultiplier(input: CalculatorInput) {
  if (input.healthStatus === 'healthy' || input.healthConditions.length === 0) {
    return { value: 1.0, label: 'Healthy' };
  }
  const values = input.healthConditions.map(c => healthMultipliers[c] || 1.0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { value: avg, label: 'Health Conditions' };
}

export function calculateMER(input: CalculatorInput, isLongHaired: boolean = false): CalculationResult {
  const weightKg = convertWeight(input.weight, input.weightUnit, 'kg');
  const rer = calculateRER(weightKg);
  
  const baseline = getBaselineMultiplier(input);
  const activity = getActivityMultiplier(input);
  const lifeStage = getLifeStageMultiplier(input);
  const environment = getEnvironmentMultiplier(input, isLongHaired);
  const bodyCondition = getBodyConditionMultiplier(input);
  const health = getHealthMultiplier(input);
  
  const multiplier = baseline.value * activity.value * lifeStage.value * 
                     environment.value * bodyCondition.value * health.value;
  
  const mer = rer * multiplier;
  
  return {
    rer: Math.round(rer),
    multiplier: Math.round(multiplier * 100) / 100,
    mer: Math.round(mer),
    breakdown: { baseline, activity, lifeStage, environment, bodyCondition, health },
  };
}
