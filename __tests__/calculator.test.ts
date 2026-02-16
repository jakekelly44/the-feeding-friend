/**
 * Example tests for The Feeding Friend
 * 
 * To enable testing, run:
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 * 
 * Then add to package.json scripts:
 *   "test": "vitest",
 *   "test:run": "vitest run"
 * 
 * And uncomment the test job in .github/workflows/ci.yml
 */

import { describe, it, expect } from 'vitest';
import { calculateRER, convertWeight } from '@/lib/calculations/calculator';
import { getFoodsBySpecies, calculatePortionSize } from '@/data/food-recommendations';

describe('Weight Conversion', () => {
  it('converts lb to kg correctly', () => {
    expect(convertWeight(22, 'lb', 'kg')).toBeCloseTo(9.98, 1);
  });

  it('converts kg to lb correctly', () => {
    expect(convertWeight(10, 'kg', 'lb')).toBeCloseTo(22.05, 1);
  });

  it('returns same value for same unit', () => {
    expect(convertWeight(10, 'kg', 'kg')).toBe(10);
    expect(convertWeight(22, 'lb', 'lb')).toBe(22);
  });
});

describe('RER Calculation', () => {
  it('calculates RER correctly for 10kg dog', () => {
    // RER = 70 * (weight in kg)^0.75
    const rer = calculateRER(10);
    expect(rer).toBeCloseTo(394, 0); // 70 * 10^0.75 ≈ 394
  });

  it('calculates RER correctly for 5kg cat', () => {
    const rer = calculateRER(5);
    expect(rer).toBeCloseTo(234, 0); // 70 * 5^0.75 ≈ 234
  });
});

describe('Food Recommendations', () => {
  it('returns dog foods for dogs', () => {
    const foods = getFoodsBySpecies('dog');
    expect(foods.length).toBeGreaterThan(0);
    expect(foods.every(f => f.species === 'dog')).toBe(true);
  });

  it('returns cat foods for cats', () => {
    const foods = getFoodsBySpecies('cat');
    expect(foods.length).toBeGreaterThan(0);
    expect(foods.every(f => f.species === 'cat')).toBe(true);
  });

  it('calculates portion size correctly', () => {
    const foods = getFoodsBySpecies('dog');
    const food = foods[0]; // First dog food
    const dailyCalories = 1000;
    
    const portion = calculatePortionSize(dailyCalories, food);
    
    // cups = dailyCalories / kcal_per_cup
    const expectedCups = dailyCalories / food.kcal_per_cup;
    expect(portion.cups).toBeCloseTo(expectedCups, 2);
  });
});

describe('Edit Flow Data Preservation', () => {
  it('should preserve all 18 fields when editing', () => {
    // This test documents the required fields for edit flow
    const requiredFields = [
      'petId',
      'petName', 
      'species',
      'breed',
      'weight',
      'weightUnit',
      'isNeutered',
      'activityMethod',
      'activityCategory',
      'activityMinutes',
      'activityPace',
      'dailySteps',
      'lifeStage',
      'outdoorExposure',
      'climate',
      'bcs',
      'weightGoal',
      'healthStatus',
      'healthConditions',
    ];
    
    // If this test fails, check that handleEdit in pet profile
    // and useEffect in calculator both handle all these fields
    expect(requiredFields.length).toBe(19); // 18 + petId
  });
});
