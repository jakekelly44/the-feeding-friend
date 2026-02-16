'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, CreditCard, Bell, LogOut } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Account</h1>

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
