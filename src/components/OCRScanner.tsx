'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';

interface OCRResult {
  calories?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  moisture?: number;
  servingSize?: string;
  servingUnit?: string;
  brand?: string;
  productName?: string;
  confidence?: string;
}

interface Props {
  onExtract: (data: OCRResult) => void;
  onClose: () => void;
}

export default function OCRScanner({ onExtract, onClose }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for API
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR API
      const response = await fetch('/api/ocr/extract-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract nutrition data');
      }

      // Success - pass data to parent
      onExtract(result.data);
      
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan label');
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">Scan Nutrition Label</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain bg-gray-100" />
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center py-8">
            <Loader className="w-8 h-8 text-deep-teal animate-spin mb-3" />
            <p className="text-gray-600">Scanning nutrition label...</p>
            <p className="text-xs text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-red-500 underline mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Upload Options */}
        {!isProcessing && !error && (
          <div className="space-y-3">
            {/* Camera Button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-4 bg-deep-teal text-white rounded-button font-semibold hover:bg-deep-teal-600 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-gray-100 text-charcoal rounded-button font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload from Library
            </button>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Instructions */}
            <div className="bg-soft-peach-50 rounded-lg p-4 mt-4">
              <p className="text-xs text-gray-600 font-medium mb-2">Tips for best results:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Ensure good lighting</li>
                <li>• Keep camera steady</li>
                <li>• Center the nutrition facts panel</li>
                <li>• Avoid glare or shadows</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
