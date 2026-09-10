import React, { useState, useRef } from 'react';
import { uploadImageFile } from '../../lib/storage';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, Loader2, CheckCircle2, Image as ImageIcon, Camera } from 'lucide-react';

interface DeviceImageUploadProps {
  onImageUploaded: (url: string) => void;
  folder?: 'logos' | 'products';
  label?: string;
  helperText?: string;
  className?: string;
  compact?: boolean;
}

export const DeviceImageUpload: React.FC<DeviceImageUploadProps> = ({
  onImageUploaded,
  folder = 'products',
  label = 'Upload From Device',
  helperText = 'Select JPG, PNG, WEBP, or SVG from your device',
  className = '',
  compact = false,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [justUploadedName, setJustUploadedName] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, WEBP, or SVG).', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('Image size exceeds 20MB limit.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadImageFile(file, folder);
      onImageUploaded(publicUrl);
      setJustUploadedName(file.name);
      showToast(`Uploaded "${file.name}" successfully!`, 'success');
      setTimeout(() => setJustUploadedName(null), 4000);
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast(err.message || 'Failed to upload image.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleTriggerClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-sky-300 bg-sky-50/70 hover:bg-sky-100/70 text-sky-800 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>Uploading...</span>
            </>
          ) : justUploadedName ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Uploaded!</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={handleTriggerClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all select-none relative overflow-hidden group ${
          isDragging
            ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
            : isUploading
            ? 'border-sky-300 bg-sky-50/30'
            : 'border-slate-200 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isUploading
                ? 'bg-sky-100 text-sky-700'
                : isDragging
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white text-slate-600 shadow-2xs group-hover:text-brand-600 group-hover:scale-105'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : justUploadedName ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {isUploading
                ? 'Optimizing & Uploading to Cloud...'
                : justUploadedName
                ? `Uploaded "${justUploadedName}"!`
                : label}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {isUploading ? 'Please wait a moment' : helperText}
            </span>
          </div>

          <span className="text-[10px] font-bold text-brand-600 group-hover:underline mt-0.5">
            Browse files or drop image here &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
