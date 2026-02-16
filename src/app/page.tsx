import Link from 'next/link';
import { PawPrint } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="w-24 h-24 bg-deep-teal-50 rounded-3xl flex items-center justify-center mb-8">
        <PawPrint className="w-12 h-12 text-deep-teal" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-deep-teal text-center mb-3">
        The Feeding Friend
      </h1>
      <p className="text-lg text-gray-500 text-center mb-16">
        Professional nutrition planning for the pets you love.
      </p>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/auth/signup"
          className="block w-full py-4 px-6 bg-deep-teal text-white text-center font-semibold rounded-button hover:bg-deep-teal-600 transition-colors"
        >
          Create Account
        </Link>
        <Link
          href="/auth/login"
          className="block w-full py-4 px-6 bg-white text-charcoal text-center font-semibold rounded-button border-2 border-gray-200 hover:border-deep-teal-200 transition-colors"
        >
          Log In
        </Link>
      </div>

      {/* Terms */}
      <p className="mt-8 text-sm text-gray-400 text-center max-w-xs">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="text-deep-teal hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-deep-teal hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
