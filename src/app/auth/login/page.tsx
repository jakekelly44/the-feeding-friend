'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/home');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-charcoal mb-12">
        <ArrowLeft className="w-5 h-5 mr-1" />
      </Link>

      <h1 className="text-3xl font-bold text-charcoal mb-2">Welcome Back</h1>
      <p className="text-gray-500 mb-8">Log in to continue managing your pet's meals.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-card text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full px-4 py-3 bg-white rounded-card border border-gray-200 focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-charcoal">Password</label>
            <Link href="/auth/forgot-password" className="text-sm text-deep-teal hover:underline">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-card border border-gray-200 focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-8 text-center text-gray-500">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-deep-teal font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
