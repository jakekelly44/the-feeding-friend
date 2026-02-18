'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ItemType = 'dry' | 'wet' | 'raw' | 'treat' | 'supplement';
type ServingUnit = 'cup' | 'can' | 'oz' | 'g' | 'piece' | 'scoop' | 'pump';

const FOOD_TYPES: { value: ItemType; label: string }[] = [
  { value: 'dry', label: 'Dry Food (Kibble)' },
  { value: 'wet', label: 'Wet Food (Canned)' },
  { value: 'raw', label: 'Raw / Freeze-Dried' },
  { value: 'treat', label: 'Treats' },
  { value: 'supplement', label: 'Supplement' },
];

const SERVING_UNITS: { value: ServingUnit; label: string }[] = [
  { value: 'cup', label: 'Cup' },
  { value: 'can', label: 'Can' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'piece', label: 'Piece / Treat' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'pump', label: 'Pump' },
];

interface FormData {
  brand: string;
  name: string;
  itemType: ItemType;
  caloriesPerUnit: string;
  servingUnit: ServingUnit;
  proteinPercent: string;
  fatPercent: string;
  fiberPercent: string;
  // Cost fields (optional section)
  packagePrice: string;
  packageSize: string;
  packageUnit: string;
}

const initialFormData: FormData = {
  brand: '',
  name: '',
  itemType: 'dry',
  caloriesPerUnit: '',
  servingUnit: 'cup',
  proteinPercent: '',
  fatPercent: '',
  fiberPercent: '',
  packagePrice: '',
  packageSize: '',
  packageUnit: 'lb',
};

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params.id as string;
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCostSection, setShowCostSection] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [foodCreatorId, setFoodCreatorId] = useState<string | null>(null);

  // Fetch food data
  useEffect(() => {
    async function fetchFood() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('items')
        .select('*')
        .eq('id', foodId)
        .single();

      if (fetchError || !data) {
        console.error('Error fetching food:', fetchError);
        router.push('/foods');
        return;
      }

      // Check if user owns this food
      if (user && data.created_by !== user.id) {
        alert('You can only edit foods you created');
        router.push(`/foods/${foodId}`);
        return;
      }

      setFoodCreatorId(data.created_by);

      // Populate form with existing data
      setFormData({
        brand: data.brand || '',
        name: data.name || '',
        itemType: data.item_type || 'dry',
        caloriesPerUnit: data.calories_per_unit?.toString() || '',
        servingUnit: data.serving_unit || 'cup',
        proteinPercent: data.protein_percent?.toString() || '',
        fatPercent: data.fat_percent?.toString() || '',
        fiberPercent: data.fiber_percent?.toString() || '',
        packagePrice: data.package_price?.toString() || '',
        packageSize: data.package_size?.toString() || '',
        packageUnit: data.package_unit || 'lb',
      });

      // Show cost section if data exists
      if (data.package_price || data.package_size) {
        setShowCostSection(true);
      }

      setLoading(false);
    }

    fetchFood();
  }, [foodId, router]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const canSave = () => {
    return (
      formData.brand.trim() !== '' &&
      formData.name.trim() !== '' &&
      formData.caloriesPerUnit !== '' &&
      parseFloat(formData.caloriesPerUnit) > 0
    );
  };

  const handleSave = async () => {
    if (!canSave()) return;
    
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to edit foods');
      setSaving(false);
      return;
    }

    // Verify ownership again
    if (foodCreatorId !== user.id) {
      setError('You can only edit foods you created');
      setSaving(false);
      return;
    }

    // Calculate cost per serving if cost data provided
    let costPerServing: number | null = null;
    let costPerCalorie: number | null = null;
    
    if (formData.packagePrice && formData.packageSize) {
      const price = parseFloat(formData.packagePrice);
      const size = parseFloat(formData.packageSize);
      const calories = parseFloat(formData.caloriesPerUnit);
      
      // Estimate servings per package (simplified - assumes 1 serving unit per serving)
      // This is a rough estimate; more accurate would require serving_grams
      const estimatedServingsPerPackage = size * 4; // Rough estimate for lb -> cups
      costPerServing = price / estimatedServingsPerPackage;
      costPerCalorie = costPerServing / calories;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('items')
      .update({
        brand: formData.brand.trim(),
        name: formData.name.trim(),
        item_type: formData.itemType,
        calories_per_unit: parseFloat(formData.caloriesPerUnit),
        serving_unit: formData.servingUnit,
        protein_percent: formData.proteinPercent ? parseFloat(formData.proteinPercent) : null,
        fat_percent: formData.fatPercent ? parseFloat(formData.fatPercent) : null,
        fiber_percent: formData.fiberPercent ? parseFloat(formData.fiberPercent) : null,
        package_price: formData.packagePrice ? parseFloat(formData.packagePrice) : null,
        package_size: formData.packageSize ? parseFloat(formData.packageSize) : null,
        package_unit: formData.packageSize ? formData.packageUnit : null,
        cost_per_serving: costPerServing,
        cost_per_calorie: costPerCalorie,
      })
      .eq('id', foodId);

    if (updateError) {
      console.error('Update error:', updateError);
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/foods/${foodId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading food details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push(`/foods/${foodId}`)} 
            className="p-2 -ml-2 text-gray-500 hover:text-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-charcoal">Edit Food</h1>
          <button
            onClick={handleSave}
            disabled={!canSave() || saving}
            className="text-deep-teal font-semibold disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-card text-sm">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <section>
          <h2 className="text-base font-semibold text-charcoal mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Brand Name</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="e.g. Royal Canin"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
              />
            </div>

            {/* Food Name / Variety */}
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Food Name / Variety</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Adult Large Breed"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
              />
            </div>

            {/* Food Type */}
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Food Type</label>
              <select
                value={formData.itemType}
                onChange={(e) => updateField('itemType', e.target.value as ItemType)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
              >
                {FOOD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Nutrition Facts */}
        <section>
          <h2 className="text-base font-semibold text-charcoal mb-4">Nutrition Facts</h2>
          
          <div className="space-y-4">
            {/* Calories + Unit Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1.5">Calories (kcal)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.caloriesPerUnit}
                  onChange={(e) => updateField('caloriesPerUnit', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm text-gray-600 mb-1.5">Per Unit</label>
                <select
                  value={formData.servingUnit}
                  onChange={(e) => updateField('servingUnit', e.target.value as ServingUnit)}
                  className="w-full px-3 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                >
                  {SERVING_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Protein / Fat / Fiber Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1.5">Protein (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.proteinPercent}
                  onChange={(e) => updateField('proteinPercent', e.target.value)}
                  placeholder="Optional"
                  min="0"
                  max="100"
                  className="w-full px-3 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1.5">Fat (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.fatPercent}
                  onChange={(e) => updateField('fatPercent', e.target.value)}
                  placeholder="Optional"
                  min="0"
                  max="100"
                  className="w-full px-3 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1.5">Fiber (%)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.fiberPercent}
                  onChange={(e) => updateField('fiberPercent', e.target.value)}
                  placeholder="Optional"
                  min="0"
                  max="100"
                  className="w-full px-3 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Cost Information (Collapsible) */}
        <section>
          <button
            type="button"
            onClick={() => setShowCostSection(!showCostSection)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-base font-semibold text-charcoal">
              Cost Information
              <span className="text-sm font-normal text-gray-400 ml-2">(Optional)</span>
            </h2>
            <span className="text-gray-400 text-xl">{showCostSection ? '−' : '+'}</span>
          </button>
          
          {showCostSection && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1.5">Package Price ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.packagePrice}
                    onChange={(e) => updateField('packagePrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1.5">Package Size</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.packageSize}
                    onChange={(e) => updateField('packageSize', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-button text-charcoal placeholder:text-gray-400 focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-sm text-gray-600 mb-1.5">Unit</label>
                  <select
                    value={formData.packageUnit}
                    onChange={(e) => updateField('packageUnit', e.target.value)}
                    className="w-full px-2 py-3 bg-white border border-gray-200 rounded-button text-charcoal focus:outline-none focus:border-deep-teal focus:ring-1 focus:ring-deep-teal appearance-none text-sm"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '14px' }}
                  >
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                    <option value="can">can</option>
                    <option value="bag">bag</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Adding cost info enables cost tracking and analytics.
              </p>
            </div>
          )}
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!canSave() || saving}
          className="w-full py-4 bg-deep-teal text-white font-semibold rounded-button disabled:opacity-40 hover:bg-deep-teal-600 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Food'}
        </button>
      </div>
    </div>
  );
}
