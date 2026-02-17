import Link from 'next/link';
import { Plus, Bell, ChevronRight, PawPrint } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pets } = await (supabase as any)
    .from('pets')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true });

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-deep-teal-50 rounded-xl flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-deep-teal" />
          </div>
          <span className="text-deep-teal font-bold text-lg">The Feeding Friend</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
          <Link href="/account" className="w-10 h-10 rounded-full bg-deep-teal-100 flex items-center justify-center">
            <span className="text-deep-teal font-semibold text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </span>
          </Link>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-charcoal mb-2">My Pets</h1>
      <p className="text-gray-500 mb-6">Select a pet to manage their profile and meals.</p>

      {/* Pet Cards */}
      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {pets?.map((pet: any) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="block bg-white rounded-card p-4 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-soft-peach-100 flex items-center justify-center">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <PawPrint className="w-8 h-8 text-soft-peach" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-charcoal">{pet.name}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 capitalize">{pet.breed?.replace(/-/g, ' ') || pet.species}</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-400">Life Stage</p>
                <p className="font-bold text-charcoal capitalize">{pet.life_stage?.replace(/-/g, ' ') || 'Adult'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Target</p>
                <p className="font-bold text-green-600">{pet.daily_calories} kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Weight</p>
                <p className="font-bold text-charcoal">
                  {pet.weight_value} {pet.weight_unit}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {/* Add Pet Button */}
        <Link
          href="/calculator"
          className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-card text-gray-400 hover:border-deep-teal-200 hover:text-deep-teal transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Another Pet</span>
        </Link>
      </div>

      {/* Empty State */}
      {(!pets || pets.length === 0) && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-deep-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-10 h-10 text-deep-teal" />
          </div>
          <h3 className="font-bold text-charcoal mb-2">No pets yet</h3>
          <p className="text-gray-500 mb-6">Add your first pet to get started with meal planning.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Pet
          </Link>
        </div>
      )}
    </div>
  );
}
