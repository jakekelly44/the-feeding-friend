import { create } from 'zustand';
import type { CalculatorInput, CalculationResult } from '@/lib/calculations/types';
import { calculateMER } from '@/lib/calculations/calculator';

interface CalculatorState {
  step: number;
  input: Partial<CalculatorInput>;
  result: CalculationResult | null;
  petName: string;
  setStep: (step: number) => void;
  updateInput: (partial: Partial<CalculatorInput>) => void;
  calculate: () => void;
  setPetName: (name: string) => void;
  reset: () => void;
}

const defaultInput: Partial<CalculatorInput> = {
  species: undefined,
  breed: null,
  weight: undefined,
  weightUnit: 'lb',
  isNeutered: true,
  activityMethod: 'categories',
  activityCategory: 'normal',
  lifeStage: 'adult',
  outdoorExposure: 'indoor',
  climate: 'mild',
  bcs: '4-5',
  weightGoal: 'maintain',
  healthStatus: 'healthy',
  healthConditions: [],
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  step: 0,
  input: defaultInput,
  result: null,
  petName: '',
  
  setStep: (step) => set({ step }),
  
  updateInput: (partial) => set((state) => ({
    input: { ...state.input, ...partial },
  })),
  
  calculate: () => {
    const { input } = get();
    if (input.species && input.weight) {
      const result = calculateMER(input as CalculatorInput);
      set({ result });
    }
  },
  
  setPetName: (petName) => set({ petName }),
  
  reset: () => set({
    step: 0,
    input: defaultInput,
    result: null,
    petName: '',
  }),
}));
