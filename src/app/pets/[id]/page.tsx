'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, PawPrint, Download, Pencil, Trash2 } from 'lucide-react';
import MealConfigurationSection from '@/components/MealConfigurationSection';
import PhotoUpload from '@/components/PhotoUpload';

interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string | null;
  weight_value: number;
  weight_unit: 'lb' | 'kg';
  life_stage: string;
  activity_category: string | null;
  bcs: string;
  daily_calories: number;
  calculation_breakdown: Record<string, { label: string; value: number }> | null;
  photo_url: string | null;
}

export default function PetProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration - only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    async function fetchPet() {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pets')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        router.push('/home');
        return;
      }
      setPet(data);
      setLoading(false);
    }
    fetchPet();
  }, [params.id, router, mounted]);

  const handleDownloadPDF = async () => {
    if (!pet) return;
    setDownloading(true);
    
    try {
      // Dynamic import to avoid SSR issues with jspdf
      const { generateFeedingPlanPDF } = await import('@/lib/pdf-generator');
      generateFeedingPlanPDF({
        petName: pet.name,
        species: pet.species,
        breed: pet.breed,
        weight: pet.weight_value,
        weightUnit: pet.weight_unit,
        dailyCalories: pet.daily_calories,
        breakdown: pet.calculation_breakdown,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleEdit = () => {
    if (!pet) return;
    // Store ALL pet data in sessionStorage for edit mode
    // Must include all fields to avoid losing data on edit
    const editData = {
      petId: pet.id,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight_value,
      weightUnit: pet.weight_unit,
      isNeutered: (pet as any).is_neutered,
      activityMethod: (pet as any).activity_method || 'categories',
      activityCategory: pet.activity_category,
      activityMinutes: (pet as any).activity_minutes,
      activityPace: (pet as any).activity_pace,
      dailySteps: (pet as any).daily_steps,
      lifeStage: pet.life_stage,
      outdoorExposure: (pet as any).outdoor_exposure,
      climate: (pet as any).climate,
      bcs: pet.bcs,
      weightGoal: (pet as any).weight_goal || 'maintain',
      healthStatus: (pet as any).health_status || 'healthy',
      healthConditions: (pet as any).health_conditions || [],
    };
    sessionStorage.setItem('editPetData', JSON.stringify(editData));
    router.push('/calculator?edit=true');
  };

  const handleDelete = async () => {
    if (!pet) return;
    if (!confirm(`Are you sure you want to delete ${pet.name}'s profile? This cannot be undone.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('pets')
        .delete()
        .eq('id', pet.id);
      
      if (error) throw error;
      router.push('/home');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete pet. Please try again.');
      setDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/home');
  };

  const handlePhotoUpload = async (url: string) => {
    if (!pet) return;
    
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('pets')
        .update({ photo_url: url })
        .eq('id', pet.id);
      
      // Update local state
      setPet({ ...pet, photo_url: url });
    } catch (err) {
      console.error('Error updating pet photo:', err);
      alert('Failed to update photo. Please try again.');
    }
  };

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-cream">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal"></div>
      </div>
    );
  }

  if (!pet) return null;

  const breakdown = pet.calculation_breakdown;
  const multiplier = breakdown 
    ? Object.values(breakdown).reduce((a, b) => a * (b?.value || 1), 1)
    : 1;
  const rer = breakdown ? Math.round(pet.daily_calories / multiplier) : 0;

  return (
    <div className="min-h-screen bg-light-cream pb-8">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <span className="font-semibold text-charcoal">Pet Profile</span>
        <button onClick={handleEdit} className="text-deep-teal font-semibold flex items-center gap-1">
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Pet Info */}
      <div className="px-6 text-center mb-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-soft-peach-100 flex items-center justify-center mb-4">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <PawPrint className="w-12 h-12 text-soft-peach" />
          )}
        </div>
        <h1 className="text-xl font-bold text-charcoal">{pet.name}</h1>
        <p className="text-gray-500 capitalize">{pet.breed?.replace(/-/g, ' ') || pet.species}</p>
      </div>

      {/* Photo Upload */}
      <div className="px-6 mb-6">
        <PhotoUpload
          currentPhotoUrl={pet.photo_url}
          onUploadComplete={handlePhotoUpload}
          bucket="pet-photos"
          size="large"
        />
      </div>

      {/* Stats Grid */}
      <div className="px-6 space-y-4">
        <div className="bg-white rounded-card p-4 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Current Weight</label>
              <p className="font-bold text-charcoal">{pet.weight_value} {pet.weight_unit}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Life Stage</label>
              <p className="font-bold text-charcoal capitalize">{pet.life_stage?.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Activity</label>
              <p className="font-bold text-charcoal capitalize">{pet.activity_category?.replace(/-/g, ' ') || 'Normal'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">BCS</label>
              <p className="font-bold text-charcoal">{pet.bcs}</p>
            </div>
          </div>
        </div>

        {/* Calorie Calculation */}
        <div className="bg-white rounded-card p-4 shadow-card">
          <h3 className="font-semibold text-deep-teal mb-4">Calorie Calculation</h3>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400">RER</div>
              <div className="font-bold text-charcoal">{rer}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400">Factor</div>
              <div className="font-bold text-charcoal">{multiplier.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
              <div className="text-xs text-green-600">MER</div>
              <div className="font-bold text-green-600">{pet.daily_calories}</div>
            </div>
          </div>

          {breakdown && (
            <div className="space-y-2 text-sm">
              {Object.entries(breakdown).map(([key, detail]) => (
                detail && detail.label ? (
                  <div key={key} className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-600">{detail.label}</span>
                    <span className="font-mono text-charcoal">{detail.value?.toFixed(2) || '1.00'}</span>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* Meal Configuration */}
        <MealConfigurationSection petId={pet.id} dailyCalories={pet.daily_calories} />

        {/* PDF Download */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full py-3 bg-soft-peach text-charcoal rounded-button font-semibold hover:bg-soft-peach-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-charcoal"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download Feeding Plan
            </>
          )}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 bg-white text-red-500 border border-red-200 rounded-button font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {deleting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              Delete Pet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
