'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-charcoal">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-6">
            By using Feeding Friend, you agree to the following terms.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Educational Use Only — Not Veterinary Advice</h2>
          <p className="text-gray-700 mb-4">
            Feeding Friend provides educational tools and decision-support resources.
          </p>
          <p className="text-gray-700 mb-6 font-semibold">
            It is not a substitute for professional veterinary care.
          </p>
          <p className="text-gray-700 mb-6">
            Always consult your veterinarian before making significant dietary or health changes for your pet.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Accounts</h2>
          <p className="text-gray-700 mb-4">
            An account is required to create and save pet profiles.
          </p>
          <p className="text-gray-700 mb-4">
            Free accounts include full functionality for one pet.
          </p>
          <p className="text-gray-700 mb-6">
            You are responsible for maintaining the confidentiality of your account.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Premium Purchase</h2>
          <p className="text-gray-700 mb-4">
            Premium upgrades are a one-time purchase that unlock additional features.
          </p>
          <p className="text-gray-700 mb-6">
            If you are not satisfied with your purchase, you may request a full refund by contacting:{' '}
            <a href="mailto:jakekelly@gmail.com" className="text-deep-teal font-medium underline">
              jakekelly@gmail.com
            </a>
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Acceptable Use</h2>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li>• misuse the platform</li>
            <li>• attempt to disrupt services</li>
            <li>• upload harmful or misleading information</li>
          </ul>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Age Requirement</h2>
          <p className="text-gray-700 mb-6">
            You must be at least 13 years old to use Feeding Friend.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            Feeding Friend provides calculated estimates based on user-provided information.
          </p>
          <p className="text-gray-700 mb-4 font-semibold">
            We are not responsible for outcomes related to feeding decisions, health changes, or veterinary conditions.
          </p>
          <p className="text-gray-700 mb-6">
            Use of the platform is at your own discretion.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Updates</h2>
          <p className="text-gray-700 mb-6">
            Terms may be updated as the product evolves. Continued use indicates acceptance of any revisions.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
            <p className="text-sm text-gray-600">
              Last updated: February 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
