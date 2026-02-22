'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, X, Upload } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  onUploadComplete: (url: string) => void;
  bucket: 'pet-photos' | 'user-photos' | 'food-photos';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  buttonOnly?: boolean;
}

export default function PhotoUpload({
  currentPhotoUrl,
  onUploadComplete,
  bucket,
  className = '',
  size = 'medium',
  buttonOnly = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        onUploadComplete(urlData.publicUrl);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentPhotoUrl) return;

    try {
      const supabase = createClient();
      
      // Extract file path from URL
      const urlParts = currentPhotoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage.from(bucket).remove([fileName]);

      setPreviewUrl(null);
      onUploadComplete('');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Button-only mode: just show the upload button
  if (buttonOnly) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-deep-teal hover:text-deep-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : (currentPhotoUrl ? 'Change Photo' : 'Add Photo')}
        </button>

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        {/* Preview */}
        <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!uploading && (
                <button
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-deep-teal border border-deep-teal rounded-button hover:bg-deep-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          {previewUrl ? 'Change Photo' : 'Upload Photo'}
        </button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <p className="text-xs text-gray-500 text-center">
          Max 5MB • JPG, PNG, GIF
        </p>
      </div>
    </div>
  );
}
