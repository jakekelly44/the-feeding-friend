// Health conditions extracted from live site

export interface HealthCondition {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  multiplier: number;
  description: string;
}

export const healthConditions: HealthCondition[] = [
  // Dog conditions
  { id: 'dog-hypothyroid', name: 'Hypothyroidism', species: 'dog', multiplier: 0.85, description: 'Decreased metabolism due to low thyroid hormone' },
  { id: 'dog-ckd-early', name: 'Chronic Kidney Disease (Early Stage)', species: 'dog', multiplier: 0.95, description: 'Mild reduction in energy needs' },
  { id: 'dog-ckd-advanced', name: 'Chronic Kidney Disease (Advanced)', species: 'dog', multiplier: 0.85, description: 'Significant reduction in energy needs' },
  { id: 'dog-diabetes-controlled', name: 'Diabetes (Well-Controlled)', species: 'dog', multiplier: 1.0, description: 'Standard energy needs with controlled diabetes' },
  { id: 'dog-diabetes-uncontrolled', name: 'Diabetes (Uncontrolled)', species: 'dog', multiplier: 1.1, description: 'Increased energy needs due to poor glucose control' },
  { id: 'dog-cushings', name: "Cushing's Disease", species: 'dog', multiplier: 0.9, description: 'Slightly reduced energy needs' },
  { id: 'dog-cancer-active', name: 'Cancer (Active Treatment)', species: 'dog', multiplier: 1.2, description: 'Increased energy needs during treatment' },
  { id: 'dog-cancer-recovery', name: 'Cancer (Recovery/Remission)', species: 'dog', multiplier: 1.1, description: 'Moderately increased energy needs' },
  { id: 'dog-heart-disease', name: 'Heart Disease', species: 'dog', multiplier: 0.95, description: 'Slightly reduced energy needs' },
  
  // Cat conditions
  { id: 'cat-hyperthyroid', name: 'Hyperthyroidism', species: 'cat', multiplier: 1.3, description: 'Increased metabolism and energy needs' },
  { id: 'cat-ckd-early', name: 'Chronic Kidney Disease (Early Stage)', species: 'cat', multiplier: 1.0, description: 'Maintain adequate energy intake' },
  { id: 'cat-ckd-advanced', name: 'Chronic Kidney Disease (Advanced)', species: 'cat', multiplier: 0.95, description: 'Slightly reduced energy needs' },
  { id: 'cat-diabetes-controlled', name: 'Diabetes (Well-Controlled)', species: 'cat', multiplier: 1.0, description: 'Standard energy needs with controlled diabetes' },
  { id: 'cat-diabetes-uncontrolled', name: 'Diabetes (Uncontrolled)', species: 'cat', multiplier: 1.1, description: 'Increased energy needs due to poor glucose control' },
  { id: 'cat-ibd', name: 'Inflammatory Bowel Disease', species: 'cat', multiplier: 1.05, description: 'Slightly increased energy needs' },
  { id: 'cat-cancer-active', name: 'Cancer (Active Treatment)', species: 'cat', multiplier: 1.2, description: 'Increased energy needs during treatment' },
  { id: 'cat-cancer-recovery', name: 'Cancer (Recovery/Remission)', species: 'cat', multiplier: 1.1, description: 'Moderately increased energy needs' },
  { id: 'cat-heart-disease', name: 'Heart Disease', species: 'cat', multiplier: 0.95, description: 'Slightly reduced energy needs' },
];

export function getConditionsBySpecies(species: 'dog' | 'cat'): HealthCondition[] {
  return healthConditions.filter(c => c.species === species);
}

export function getConditionById(id: string): HealthCondition | undefined {
  return healthConditions.find(c => c.id === id);
}
