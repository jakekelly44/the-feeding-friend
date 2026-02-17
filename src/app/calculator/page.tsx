'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Smartphone, Clock, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getBreedsBySpecies, isLongHaired } from '@/data/breeds';
import { getConditionsBySpecies } from '@/data/health-conditions';
import { calculateMER, convertWeight } from '@/lib/calculations/calculator';
import type { 
  Species, ActivityMethod, ActivityCategory, ActivityPace, 
  LifeStage, OutdoorExposure, Climate, BCS, WeightGoal 
} from '@/lib/calculations/types';
import type { PetInsert, Json } from '@/lib/supabase/database.types';

const STEPS = ['Baseline', 'Activity', 'Life Stage', 'Environment', 'Body Condition', 'Health'];

interface FormData {
  species: Species | null;
  petName: string;
  breed: string | null;
  weight: number | null;
  weightUnit: 'lb' | 'kg';
  isNeutered: boolean | null;
  activityMethod: ActivityMethod;
  dailySteps: number | null;
  activityMinutes: number | null;
  activityPace: ActivityPace | null;
  activityCategory: ActivityCategory | null;
  lifeStage: LifeStage | null;
  outdoorExposure: OutdoorExposure | null;
  climate: Climate | null;
  bcs: BCS | null;
  weightGoal: WeightGoal;
  healthStatus: 'healthy' | 'has-conditions';
  healthConditions: string[];
}

const initialFormData: FormData = {
  species: null,
  petName: '',
  breed: null,
  weight: null,
  weightUnit: 'lb',
  isNeutered: null,
  activityMethod: 'categories',
  dailySteps: null,
  activityMinutes: null,
  activityPace: null,
  activityCategory: null,
  lifeStage: null,
  outdoorExposure: null,
  climate: null,
  bcs: null,
  weightGoal: 'maintain',
  healthStatus: 'healthy',
  healthConditions: [],
};

// Wrapper component to handle Suspense for useSearchParams
export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light-cream">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal"></div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editPetId, setEditPetId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load edit data from sessionStorage
  useEffect(() => {
    setMounted(true);
    if (isEditMode && typeof window !== 'undefined') {
      const editDataStr = sessionStorage.getItem('editPetData');
      if (editDataStr) {
        try {
          const editData = JSON.parse(editDataStr);
          setEditPetId(editData.petId);
          setFormData(prev => ({
            ...prev,
            species: editData.species,
            petName: editData.petName,
            breed: editData.breed,
            weight: editData.weight,
            weightUnit: editData.weightUnit,
            isNeutered: editData.isNeutered,
            activityMethod: editData.activityMethod || 'categories',
            activityCategory: editData.activityCategory,
            activityMinutes: editData.activityMinutes,
            activityPace: editData.activityPace,
            dailySteps: editData.dailySteps,
            lifeStage: editData.lifeStage,
            outdoorExposure: editData.outdoorExposure,
            climate: editData.climate,
            bcs: editData.bcs,
            weightGoal: editData.weightGoal || 'maintain',
            healthStatus: editData.healthStatus || 'healthy',
            healthConditions: editData.healthConditions || [],
          }));
          // Clear the sessionStorage after loading
          sessionStorage.removeItem('editPetData');
        } catch (e) {
          console.error('Failed to parse edit data:', e);
        }
      }
    }
  }, [isEditMode]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const breeds = useMemo(() => {
    return formData.species ? getBreedsBySpecies(formData.species) : [];
  }, [formData.species]);

  const healthConditionOptions = useMemo(() => {
    return formData.species ? getConditionsBySpecies(formData.species) : [];
  }, [formData.species]);

  const weightInKg = formData.weight 
    ? convertWeight(formData.weight, formData.weightUnit, 'kg') 
    : null;

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.species && formData.petName.trim() && formData.weight && formData.weight > 0 && formData.isNeutered !== null;
      case 1:
        if (formData.activityMethod === 'categories') return formData.activityCategory;
        if (formData.activityMethod === 'steps') return formData.dailySteps && formData.dailySteps > 0;
        if (formData.activityMethod === 'time') return formData.activityMinutes && formData.activityMinutes > 0 && formData.activityPace;
        return false;
      case 2:
        return formData.lifeStage;
      case 3:
        return formData.outdoorExposure && (formData.outdoorExposure === 'indoor' || formData.outdoorExposure === 'less-than-2' || formData.climate);
      case 4:
        return formData.bcs;
      case 5:
        return formData.healthStatus === 'healthy' || formData.healthConditions.length > 0;
      default:
        return true;
    }
  };

  const result = useMemo(() => {
    if (step < 6 || !formData.species || !formData.weight || formData.isNeutered === null || !formData.bcs || !formData.lifeStage || !formData.outdoorExposure) {
      return null;
    }
    
    return calculateMER({
      species: formData.species,
      breed: formData.breed,
      weight: formData.weight,
      weightUnit: formData.weightUnit,
      isNeutered: formData.isNeutered,
      activityMethod: formData.activityMethod,
      dailySteps: formData.dailySteps,
      activityMinutes: formData.activityMinutes,
      activityPace: formData.activityPace,
      activityCategory: formData.activityCategory,
      lifeStage: formData.lifeStage,
      outdoorExposure: formData.outdoorExposure,
      climate: formData.climate,
      bcs: formData.bcs,
      weightGoal: formData.weightGoal,
      healthStatus: formData.healthStatus,
      healthConditions: formData.healthConditions,
    }, isLongHaired(formData.breed));
  }, [step, formData]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      setStep(6);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.push('/home');
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('Not authenticated');
      setSaving(false);
      return;
    }

    const petData: PetInsert = {
      user_id: user.id,
      name: formData.petName,
      species: formData.species!,
      breed: formData.breed,
      weight_value: formData.weight!,
      weight_unit: formData.weightUnit,
      is_neutered: formData.isNeutered!,
      activity_method: formData.activityMethod,
      activity_category: formData.activityCategory,
      activity_minutes: formData.activityMinutes,
      activity_pace: formData.activityPace,
      daily_steps: formData.dailySteps,
      life_stage: formData.lifeStage!,
      outdoor_exposure: formData.outdoorExposure!,
      climate: formData.climate,
      bcs: formData.bcs!,
      weight_goal: formData.weightGoal,
      health_status: formData.healthStatus,
      health_conditions: formData.healthConditions,
      daily_calories: result.mer,
      calculation_breakdown: result.breakdown as unknown as Json,
    };

    let dbError;
    
    if (editPetId) {
      // Update existing pet
      const { error: updateError } = await supabase
        .from('pets')
        .update(petData)
        .eq('id', editPetId);
      dbError = updateError;
    } else {
      // Insert new pet
      const { error: insertError } = await supabase.from('pets').insert(petData);
      dbError = insertError;
    }

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream border-b border-gray-100 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={handleBack} className="p-2 -ml-2 text-gray-500 hover:text-charcoal">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {step < 6 && (
            <span className="text-sm text-gray-500">Section {step + 1} of 6</span>
          )}
          {step < 6 && (
            <span className="text-sm text-gray-400">{Math.round(((step + 1) / 6) * 100)}% Complete</span>
          )}
          {step === 6 && <span className="text-sm text-deep-teal font-medium">Results</span>}
        </div>
        
        {step < 6 && (
          <div className="max-w-2xl mx-auto mt-3">
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-deep-teal rounded-full transition-all duration-300" 
                style={{ width: `${((step + 1) / 6) * 100}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {step === 0 && <Section1Baseline formData={formData} updateField={updateField} breeds={breeds} weightInKg={weightInKg} />}
        {step === 1 && <Section2Activity formData={formData} updateField={updateField} />}
        {step === 2 && <Section3LifeStage formData={formData} updateField={updateField} />}
        {step === 3 && <Section4Environment formData={formData} updateField={updateField} />}
        {step === 4 && <Section5BodyCondition formData={formData} updateField={updateField} />}
        {step === 5 && <Section6Health formData={formData} updateField={updateField} conditions={healthConditionOptions} />}
        {step === 6 && result && <ResultsSection result={result} formData={formData} onSave={handleSave} saving={saving} error={error} isEditMode={!!editPetId} />}
      </div>

      {/* Footer */}
      {step < 6 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={handleBack} className="text-gray-500 hover:text-charcoal font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 bg-deep-teal text-white font-semibold rounded-button disabled:opacity-40 hover:bg-deep-teal-600 transition-colors flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section1Baseline({ formData, updateField, breeds, weightInKg }: any) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 1: Baseline Characteristics</h1>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">What type of pet do you have?</label>
        <div className="grid grid-cols-2 gap-4 mt-3">
          {(['dog', 'cat'] as const).map((species) => (
            <button
              key={species}
              onClick={() => { updateField('species', species); updateField('breed', null); }}
              className={`p-6 rounded-card border-2 flex flex-col items-center gap-3 transition-all ${
                formData.species === species ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-4xl">{species === 'dog' ? '🐕' : '😺'}</span>
              <span className="font-semibold capitalize">{species}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">What's your pet's name?</label>
        <p className="text-sm text-gray-500 mb-2">We'll personalize your feeding plan with their name</p>
        <input
          type="text"
          value={formData.petName}
          onChange={(e) => updateField('petName', e.target.value)}
          placeholder="e.g., Max, Luna, Bella"
          className="w-full px-4 py-3 rounded-card border border-gray-200 focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
        />
      </div>

      {formData.species && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">What breed is your pet?</label>
          <p className="text-sm text-gray-500 mb-2">Breed helps us account for size and coat type. Select 'Mixed Breed' or 'Unknown' if unsure.</p>
          <select
            value={formData.breed || ''}
            onChange={(e) => updateField('breed', e.target.value || null)}
            className="w-full px-4 py-3 rounded-card border border-gray-200 focus:border-deep-teal outline-none bg-white"
          >
            <option value="">Select a breed...</option>
            {breeds.map((breed: any) => (
              <option key={breed.id} value={breed.id}>{breed.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">What is your pet's current body weight?</label>
        <p className="text-sm text-gray-500 mb-2">Enter your pet's most recent weight from a veterinary visit or home scale</p>
        <div className="flex gap-3">
          <input
            type="number"
            value={formData.weight || ''}
            onChange={(e) => updateField('weight', parseFloat(e.target.value) || null)}
            placeholder="Enter weight"
            className="flex-1 px-4 py-3 rounded-card border border-gray-200 focus:border-deep-teal outline-none"
          />
          <div className="flex rounded-card border border-gray-200 overflow-hidden">
            {(['lb', 'kg'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => updateField('weightUnit', unit)}
                className={`px-4 py-3 font-medium transition-colors ${
                  formData.weightUnit === unit ? 'bg-deep-teal text-white' : 'bg-white text-gray-600'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
        {weightInKg && formData.weightUnit === 'lb' && (
          <p className="text-sm text-gray-400 mt-2">{weightInKg.toFixed(1)} kg</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">Is your pet neutered/spayed?</label>
        <p className="text-sm text-gray-500 mb-3">Neutered/spayed pets have lower energy needs due to hormonal changes</p>
        <div className="space-y-2">
          {[{ val: true, label: '✓ Yes, neutered/spayed' }, { val: false, label: '✗ No, intact' }].map(({ val, label }) => (
            <button
              key={String(val)}
              onClick={() => updateField('isNeutered', val)}
              className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 transition-all ${
                formData.isNeutered === val ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.isNeutered === val ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
              }`}>
                {formData.isNeutered === val && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section2Activity({ formData, updateField }: any) {
  const methods = [
    { id: 'steps', label: "📱 I track daily steps with a device" },
    { id: 'time', label: "🏃 I'll describe activity by time and intensity" },
    { id: 'categories', label: "📊 I'll choose from activity categories" },
  ];
  const categories = [
    { value: 'sedentary', label: '🛋️ Sedentary', desc: 'Minimal movement, mostly sleeping or resting' },
    { value: 'low', label: '🚶 Low Activity', desc: 'Short walks, some light play' },
    { value: 'normal', label: '🐕 Normal Activity', desc: 'Regular daily walks and moderate play' },
    { value: 'active', label: '🏃 Active', desc: 'Long walks, running, frequent active play' },
    { value: 'highly-active', label: '⚡ Highly Active', desc: 'Intense exercise, working dog, athletic training' },
  ];
  const paces = [
    { value: 'slow', label: '🚶 Slow/Leisurely', desc: 'gentle walking, light play' },
    { value: 'moderate', label: '🏃 Moderate', desc: 'brisk walking, regular play' },
    { value: 'fast', label: '🏃‍♀️ Fast/Vigorous', desc: 'running, intense play' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 2: Activity Level</h1>

      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">How would you like to describe your pet's activity level?</label>
        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => updateField('activityMethod', m.id)}
              className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
                formData.activityMethod === m.id ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.activityMethod === m.id ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
              }`}>
                {formData.activityMethod === m.id && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {formData.activityMethod === 'steps' && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">How many steps per day does your pet take?</label>
          <input
            type="number"
            value={formData.dailySteps || ''}
            onChange={(e) => updateField('dailySteps', parseInt(e.target.value) || null)}
            placeholder="e.g., 8000"
            className="w-full px-4 py-3 rounded-card border border-gray-200 focus:border-deep-teal outline-none"
          />
        </div>
      )}

      {formData.activityMethod === 'time' && (
        <>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">How many minutes per day is your pet active?</label>
            <p className="text-sm text-gray-500 mb-2">Include walks, play time, and other physical activity</p>
            <input
              type="number"
              value={formData.activityMinutes || ''}
              onChange={(e) => updateField('activityMinutes', parseInt(e.target.value) || null)}
              placeholder="e.g., 45"
              className="w-full px-4 py-3 rounded-card border border-gray-200 focus:border-deep-teal outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-3">What is the typical pace of this activity?</label>
            <div className="space-y-2">
              {paces.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateField('activityPace', p.value)}
                  className={`w-full p-4 rounded-card border-2 text-left ${
                    formData.activityPace === p.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.activityPace === p.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
                    }`}>
                      {formData.activityPace === p.value && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-sm text-gray-500">{p.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {formData.activityMethod === 'categories' && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-3">Select your pet's typical activity level</label>
          <div className="space-y-2">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => updateField('activityCategory', c.value)}
                className={`w-full p-4 rounded-card border-2 text-left ${
                  formData.activityCategory === c.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.activityCategory === c.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
                  }`}>
                    {formData.activityCategory === c.value && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-sm text-gray-500">{c.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section3LifeStage({ formData, updateField }: any) {
  const dogStages = [
    { value: 'young-puppy', label: '🍼 Young Puppy (0-4 months)' },
    { value: 'older-puppy', label: '🐕 Older Puppy (4-12 months)' },
    { value: 'adult', label: '🦮 Adult (1-7 years)' },
    { value: 'senior', label: '👴 Senior (7+ years)' },
  ];
  const catStages = [
    { value: 'kitten', label: '🐱 Kitten (0-12 months)' },
    { value: 'adult', label: '😺 Adult (1-7 years)' },
    { value: 'senior', label: '👴 Senior (7+ years)' },
  ];
  const stages = formData.species === 'cat' ? catStages : dogStages;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 3: Life Stage</h1>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">What life stage is your pet in?</label>
        <div className="space-y-2">
          {stages.map((s) => (
            <button
              key={s.value}
              onClick={() => updateField('lifeStage', s.value)}
              className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
                formData.lifeStage === s.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.lifeStage === s.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
              }`}>
                {formData.lifeStage === s.value && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section4Environment({ formData, updateField }: any) {
  const exposures = [
    { value: 'indoor', label: '🏠 Indoor only' },
    { value: 'less-than-2', label: '⏱️ Less than 2 hours outdoors' },
    { value: '2-4', label: '⏱️ 2-4 hours outdoors' },
    { value: '4-8', label: '⏱️ 4-8 hours outdoors' },
    { value: '8-12', label: '⏱️ 8-12 hours outdoors' },
    { value: '12-plus', label: '🌳 12+ hours (mostly outdoor pet)' },
  ];
  const climates = [
    { value: 'cold', label: '❄️ Cold (< 50°F / 10°C)' },
    { value: 'mild', label: '🌤️ Mild (50-86°F / 10-30°C)' },
    { value: 'hot', label: '☀️ Hot (> 86°F / 30°C)' },
  ];
  const showClimate = formData.outdoorExposure && !['indoor', 'less-than-2'].includes(formData.outdoorExposure);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 4: Environment</h1>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">How much time does your pet spend outdoors daily?</label>
        <div className="space-y-2">
          {exposures.map((e) => (
            <button
              key={e.value}
              onClick={() => updateField('outdoorExposure', e.value)}
              className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
                formData.outdoorExposure === e.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.outdoorExposure === e.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
              }`}>
                {formData.outdoorExposure === e.value && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{e.label}</span>
            </button>
          ))}
        </div>
      </div>
      {showClimate && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-3">What is the typical outdoor climate?</label>
          <div className="space-y-2">
            {climates.map((c) => (
              <button
                key={c.value}
                onClick={() => updateField('climate', c.value)}
                className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
                  formData.climate === c.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.climate === c.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
                }`}>
                  {formData.climate === c.value && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section5BodyCondition({ formData, updateField }: any) {
  const bcsOptions = [
    { value: '1-2', label: 'BCS 1-2', desc: 'Severely Underweight', subdesc: 'Ribs, spine, and bones easily visible' },
    { value: '3', label: 'BCS 3', desc: 'Underweight', subdesc: 'Ribs easily felt, minimal fat' },
    { value: '4-5', label: 'BCS 4-5', desc: 'Ideal', subdesc: 'Ribs palpable, visible waist', star: true },
    { value: '6-7', label: 'BCS 6-7', desc: 'Overweight', subdesc: 'Ribs difficult to feel, no waist' },
    { value: '8-9', label: 'BCS 8-9', desc: 'Obese', subdesc: 'Heavy fat deposits, distended abdomen' },
  ];
  const goals = [
    { value: 'maintain', label: 'Maintain current weight' },
    { value: 'gain', label: 'Weight gain (increase muscle/body mass)' },
    { value: 'lose', label: 'Weight loss (reduce body fat)' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 5: Body Condition</h1>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">What is your pet's body condition score (BCS)?</label>
        <p className="text-sm text-gray-500 mb-4">Select the image that best matches your pet's body shape. BCS 4-5 is ideal.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {bcsOptions.map((bcs) => (
            <button
              key={bcs.value}
              onClick={() => updateField('bcs', bcs.value)}
              className={`p-3 rounded-card border-2 text-left transition-all ${
                formData.bcs === bcs.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
              }`}
            >
              <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                <Image src={`/images/bcs/bcs-${bcs.value}-realistic.png`} alt={`BCS ${bcs.value}`} fill className="object-contain" />
              </div>
              <div className="font-semibold text-sm flex items-center gap-1">
                {bcs.label} {bcs.star && <span className="text-yellow-500">⭐</span>}
              </div>
              <div className="text-sm text-charcoal">{bcs.desc}</div>
              <div className="text-xs text-gray-500">{bcs.subdesc}</div>
            </button>
          ))}
        </div>
        <a href="#" className="text-deep-teal text-sm mt-3 inline-block hover:underline">View detailed BCS chart →</a>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">What is your weight goal for this pet?</label>
        <div className="space-y-2">
          {goals.map((g) => (
            <button
              key={g.value}
              onClick={() => updateField('weightGoal', g.value)}
              className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
                formData.weightGoal === g.value ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.weightGoal === g.value ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
              }`}>
                {formData.weightGoal === g.value && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section6Health({ formData, updateField, conditions }: any) {
  const toggleCondition = (id: string) => {
    const current = formData.healthConditions;
    updateField('healthConditions', current.includes(id) ? current.filter((c: string) => c !== id) : [...current, id]);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-charcoal">Section 6: Health Status</h1>
      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">Does your pet have any health conditions that affect metabolism?</label>
        <div className="space-y-2">
          <button
            onClick={() => { updateField('healthStatus', 'healthy'); updateField('healthConditions', []); }}
            className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
              formData.healthStatus === 'healthy' ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              formData.healthStatus === 'healthy' ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
            }`}>
              {formData.healthStatus === 'healthy' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span>No, my pet is healthy</span>
          </button>
          <button
            onClick={() => updateField('healthStatus', 'has-conditions')}
            className={`w-full p-4 rounded-card border-2 text-left flex items-center gap-3 ${
              formData.healthStatus === 'has-conditions' ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              formData.healthStatus === 'has-conditions' ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
            }`}>
              {formData.healthStatus === 'has-conditions' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span>Yes, my pet has health condition(s)</span>
          </button>
        </div>
      </div>
      {formData.healthStatus === 'has-conditions' && (
        <div>
          <label className="block text-sm font-medium text-charcoal mb-3">Select all conditions that apply:</label>
          <div className="space-y-2">
            {conditions.map((c: any) => (
              <button
                key={c.id}
                onClick={() => toggleCondition(c.id)}
                className={`w-full p-4 rounded-card border-2 text-left ${
                  formData.healthConditions.includes(c.id) ? 'border-deep-teal bg-deep-teal-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                    formData.healthConditions.includes(c.id) ? 'border-deep-teal bg-deep-teal' : 'border-gray-300'
                  }`}>
                    {formData.healthConditions.includes(c.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-card">
        <p className="text-sm text-amber-800"><strong>⚠️ Important:</strong> Always consult your veterinarian for pets with health conditions.</p>
      </div>
    </div>
  );
}

function ResultsSection({ result, formData, onSave, saving, error, isEditMode }: any) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Dynamic import to avoid SSR issues with jspdf
      const { generateFeedingPlanPDF } = await import('@/lib/pdf-generator');
      generateFeedingPlanPDF({
        petName: formData.petName,
        species: formData.species,
        breed: formData.breed,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        dailyCalories: result.mer,
        breakdown: result.breakdown,
      });
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-deep-teal mb-2">Calculation Results</h1>
        <p className="text-gray-500">Here's {formData.petName}'s personalized calorie calculation</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-card p-4 text-center shadow-card">
          <div className="text-xs text-gray-400 uppercase">RER</div>
          <div className="text-2xl font-bold text-charcoal mt-1">{result.rer}</div>
          <div className="text-xs text-gray-400">kcal/day</div>
        </div>
        <div className="bg-white rounded-card p-4 text-center shadow-card">
          <div className="text-xs text-gray-400 uppercase">Multiplier</div>
          <div className="text-2xl font-bold text-charcoal mt-1">{result.multiplier}</div>
          <div className="text-xs text-gray-400">Factor</div>
        </div>
        <div className="bg-green-50 rounded-card p-4 text-center shadow-card border-2 border-green-300">
          <div className="text-xs text-green-600 uppercase">MER</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{result.mer}</div>
          <div className="text-xs text-green-600">kcal/day</div>
        </div>
      </div>
      <div className="bg-white rounded-card p-5 shadow-card">
        <h3 className="font-semibold text-deep-teal mb-4">Calculation Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(result.breakdown).map(([key, detail]: [string, any]) => (
            <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{detail.label}</span>
              <span className="font-mono font-semibold">{detail.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* PDF Download Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="w-full py-4 bg-soft-peach text-charcoal rounded-button font-semibold hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {downloading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            Download Feeding Plan (PDF)
          </>
        )}
      </button>
      
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-card text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button onClick={() => window.location.reload()} className="py-4 border-2 border-gray-200 rounded-button font-semibold">
          {isEditMode ? 'Cancel' : 'Start New'}
        </button>
        <button onClick={onSave} disabled={saving} className="py-4 bg-deep-teal text-white rounded-button font-semibold disabled:opacity-50">
          {saving ? 'Saving...' : isEditMode ? 'Update Profile' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
