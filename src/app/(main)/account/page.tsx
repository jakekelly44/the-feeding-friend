'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, CreditCard, Bell, LogOut, User } from 'lucide-react';
import PhotoUpload from '@/components/PhotoUpload';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        setProfile(data);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Account</h1>

      {/* User Profile */}
      {loading ? (
        <div className="bg-white rounded-card p-6 shadow-card mb-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-48" />
            </div>
          </div>
        </div>
      ) : profile && (
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
              <h2 className="text-xl font-bold text-charcoal">{profile.full_name || 'User'}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <PhotoUpload
            currentPhotoUrl={profile.avatar_url}
            onUploadComplete={handlePhotoUpload}
            bucket="user-photos"
            size="medium"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-card p-4 shadow-card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Preferences</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 py-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 py-2">
              <Bell className="w-5 h-5 text-gray-400" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-card p-4 shadow-card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Subscription</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span>Current Plan</span>
            </div>
            <span className="text-sm font-medium text-deep-teal">Free Plan</span>
          </div>
          <button className="w-full mt-4 py-3 bg-deep-teal text-white rounded-button font-semibold">
            Upgrade to Premium
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-500 border border-red-200 rounded-card"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
