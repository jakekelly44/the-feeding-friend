'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-charcoal">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="prose prose-lg">
          <p className="text-xl font-semibold text-charcoal mb-6">Your privacy matters.</p>

          <p className="text-gray-700 mb-6">
            Feeding Friend is designed to collect only the information necessary to provide accurate feeding guidance and improve the experience.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-4">When you use Feeding Friend, we may collect:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li>• Your email address (used to create your account and deliver feeding plans)</li>
            <li>• Pet profile information you choose to provide (weight, breed, activity level, health factors)</li>
            <li>• Basic usage analytics through Google Analytics to understand how the app is used and improve performance</li>
          </ul>
          <p className="text-gray-700 mb-6">We do not collect unnecessary personal information.</p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">How Your Information Is Used</h2>
          <p className="text-gray-700 mb-4">Your information is used only to:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li>• Generate personalized feeding calculations</li>
            <li>• Save your pet profiles</li>
            <li>• Deliver downloadable feeding plans</li>
            <li>• Improve the product through aggregated analytics</li>
          </ul>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Data Sharing</h2>
          <p className="text-gray-700 mb-4">
            We do not sell, rent, or share your personal data with third parties.
          </p>
          <p className="text-gray-700 mb-6">
            Your information is never used for advertising resale or external marketing lists.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Data Storage</h2>
          <p className="text-gray-700 mb-6">
            Pet profiles and account data are securely stored with your account so you can access your feeding plans at any time.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Third-Party Services</h2>
          <p className="text-gray-700 mb-4">Feeding Friend uses:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li>• Google Analytics for anonymized usage insights</li>
          </ul>
          <p className="text-gray-700 mb-6">
            These services may collect technical data such as device type or interaction patterns.
          </p>

          <h2 className="text-2xl font-bold text-charcoal mt-8 mb-4">Your Control</h2>
          <p className="text-gray-700 mb-4">
            You can request account deletion at any time by contacting:
          </p>
          <p className="text-gray-700 mb-6">
            <a href="mailto:jakekelly@gmail.com" className="text-deep-teal font-medium underline">
              jakekelly@gmail.com
            </a>
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
