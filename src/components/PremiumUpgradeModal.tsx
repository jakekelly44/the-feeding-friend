'use client';

import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  feature?: string;
}

export default function PremiumUpgradeModal({ onClose, feature = 'this feature' }: Props) {
  const handleUpgrade = () => {
    // TODO: Integrate with ConvertKit or payment processor
    alert('Payment integration coming soon!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">Upgrade to Premium</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {feature} is available with Premium.
          </p>

          <div className="bg-gradient-to-br from-deep-teal to-deep-teal-600 rounded-xl p-6 text-white mb-6">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">$9.99</div>
              <div className="text-sm text-deep-teal-50">One-time purchase</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">✓</span>
                <span>Unlimited pets</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">✓</span>
                <span>OCR nutrition label scanning</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">✓</span>
                <span>Advanced cost analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">✓</span>
                <span>Lifetime access</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-3 bg-deep-teal text-white font-semibold rounded-button hover:bg-deep-teal-600 transition-colors"
          >
            Upgrade Now
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm mt-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
