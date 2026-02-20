'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, LogOut, User, ChevronRight, Edit2 } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  preferred_unit: 'lb' | 'kg';
  is_premium: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          email: user.email || '',
          avatar_url: data.avatar_url,
          preferred_unit: data.preferred_unit || 'lb',
          is_premium: data.is_premium || false,
        });
        setNewName(data.full_name || '');
      }
      setLoading(false);
    }

    fetchProfile();
  }, [router]);

  const handlePhotoUpload = async (url: string) => {
    if (!profile) return;
    
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', profile.id);
      
      setProfile({ ...profile, avatar_url: url });
    } catch (err) {
      console.error('Error updating avatar:', err);
      alert('Failed to update photo. Please try again.');
    }
  };

  const handleSaveName = async () => {
    if (!profile || !newName.trim()) return;
    
    setSavingName(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', profile.id);
      
      setProfile({ ...profile, full_name: newName.trim() });
      setEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleUnitChange = async (unit: 'lb' | 'kg') => {
    if (!profile) return;
    
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ preferred_unit: unit })
        .eq('id', profile.id);
      
      setProfile({ ...profile, preferred_unit: unit });
    } catch (err) {
      console.error('Error updating unit preference:', err);
      alert('Failed to update unit preference.');
    }
  };

  const handleSignOut = async () {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-teal"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-light-cream px-6 py-6 pb-24">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Account</h1>

      {/* User Profile Card */}
      <div className="bg-white rounded-card p-6 shadow-card mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
                  placeholder="Your name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="px-4 py-1.5 bg-deep-teal text-white rounded-button text-sm font-medium disabled:opacity-50"
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(profile.full_name || '');
                    }}
                    className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-button text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal">
                    {profile.full_name || 'User'}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-400 hover:text-deep-teal"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </>
            )}
          </div>
        </div>
        
        {!editingName && (
          <PhotoUpload
            currentPhotoUrl={profile.avatar_url}
            onUploadComplete={handlePhotoUpload}
            bucket="user-photos"
            size="medium"
          />
        )}
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-card p-4 shadow-card mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Preferences</h2>
        
        {/* Unit Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-charcoal">Weight Unit</p>
                <p className="text-xs text-gray-500">Choose your preferred unit</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-button p-1">
              <button
                onClick={() => handleUnitChange('lb')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  profile.preferred_unit === 'lb'
                    ? 'bg-white text-deep-teal shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                lb
              </button>
              <button
                onClick={() => handleUnitChange('kg')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  profile.preferred_unit === 'kg'
                    ? 'bg-white text-deep-teal shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                kg
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Premium Upgrade */}
      <div className="bg-gradient-to-br from-deep-teal to-deep-teal-600 rounded-card p-6 shadow-card mb-4 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Upgrade to Premium</h2>
            <p className="text-sm text-deep-teal-50">One-time purchase • $9.99</p>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
            Free Plan
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">✓</span>
            <span>Unlimited pets</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">✓</span>
            <span>OCR food scanning</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">✓</span>
            <span>Advanced cost analytics</span>
          </div>
        </div>

        <button className="w-full py-3 bg-white text-deep-teal font-semibold rounded-button hover:bg-gray-50 transition-colors">
          Upgrade Now
        </button>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-card p-4 shadow-card mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">App Information</h2>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/about')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-charcoal">About The Feeding Friend</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => router.push('/privacy')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-charcoal">Privacy Policy</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={() => router.push('/terms')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-charcoal">Terms of Service</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <div className="py-2">
            <p className="text-sm text-gray-400">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 bg-white text-red-500 border border-red-200 rounded-button font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
