'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-charcoal mb-12">
        <ArrowLeft className="w-5 h-5 mr-1" />
      </Link>

      <h1 className="text-3xl font-bold text-charcoal mb-2">Create Account</h1>
      <p className="text-gray-500 mb-8">Start your journey to better pet nutrition.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-card text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-white rounded-card border border-gray-200 focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            required
          />
        </div>

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
          <label className="block text-sm font-medium text-charcoal mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-card border border-gray-200 focus:border-deep-teal focus:ring-1 focus:ring-deep-teal outline-none"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-8 text-center text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-deep-teal font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
