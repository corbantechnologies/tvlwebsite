'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Check, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export interface MediaDropzoneProps {
  value?: string;
  currentUrl?: string;
  onChange?: (url: string) => void;
  onUploadComplete?: (url: string) => void;
  folder?: string;
  label?: string;
  helperText?: string;
  maxFiles?: number;
  accept?: string;
}

export default function MediaDropzone({
  value,
  currentUrl,
  onChange,
  onUploadComplete,
  folder = 'uploads',
  label = 'Media Asset (MinIO MAM)',
  helperText = 'Drag & drop image here or paste URL directly',
  maxFiles,
  accept,
}: MediaDropzoneProps) {
  const activeValue = currentUrl !== undefined ? currentUrl : (value || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inputUrl, setInputUrl] = useState(activeValue);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notifyChange = (url: string) => {
    if (onChange) onChange(url);
    if (onUploadComplete) onUploadComplete(url);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const compressImage = async (
    file: File,
    quality = 0.78,
    maxDimension = 1600
  ): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    // If already under 400KB, no compression needed
    if (file.size <= 400 * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              // If still over 900KB, compress further once
              if (compressedFile.size > 900 * 1024 && quality > 0.6) {
                compressImage(compressedFile, 0.65, 1280).then(resolve);
              } else {
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (rawFile: File) => {
    setUploading(true);

    try {
      const file = await compressImage(rawFile);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          // If server proxy returned 413 Payload Too Large, retry with ultra compression
          toast.loading('Optimizing image for server limits...', { id: 'recompress' });
          const ultraFile = await compressImage(rawFile, 0.60, 1200);
          const retryData = new FormData();
          retryData.append('file', ultraFile);
          retryData.append('folder', folder);

          const retryRes = await fetch('/api/media/upload', {
            method: 'POST',
            body: retryData,
          });
          toast.dismiss('recompress');

          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.url) {
              notifyChange(data.url);
              setInputUrl(data.url);
              toast.success('Asset uploaded to MinIO Media Store!');
              return;
            }
          }
          toast.error('File exceeds server size limit (413). Please select a smaller photo or paste direct link.');
          return;
        }

        if (res.status === 401 || res.status === 403) {
          toast.error('Media storage unauthorized (401/403). Check MinIO credentials.');
          return;
        }

        let errMsg = 'Failed to upload to MinIO storage';
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch {
          // Non-JSON response (e.g. proxy HTML error)
        }
        toast.error(errMsg);
        return;
      }

      const data = await res.json();
      if (data.url) {
        notifyChange(data.url);
        setInputUrl(data.url);
        toast.success(data.note ? `Uploaded: ${data.note}` : 'Asset uploaded to MinIO Media Store!');
      } else {
        toast.error(data.error || 'Failed to upload to MinIO storage');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error during media upload');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlBlur = () => {
    if (inputUrl !== activeValue) {
      notifyChange(inputUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C59B27]">
          {label}
        </label>
        {activeValue && (
          <button
            type="button"
            onClick={() => {
              notifyChange('');
              setInputUrl('');
            }}
            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear Media
          </button>
        )}
      </div>

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[130px] ${
          isDragging
            ? 'border-[#821124] bg-[#821124]/10 scale-[1.01]'
            : 'border-white/15 bg-black/30 hover:border-[#C59B27]/50 hover:bg-black/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/mp4,video/webm"
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4 text-xs text-[#C59B27]">
            <Loader2 className="w-7 h-7 animate-spin text-[#821124]" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Streaming to MinIO Media Storage...</span>
          </div>
        ) : activeValue ? (
          <div className="w-full flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#C59B27]/40 shrink-0 bg-black/50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeValue}
                alt="Uploaded media preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <ImageIcon className="w-6 h-6 text-white/40 absolute -z-10" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Active Media Asset
              </span>
              <span className="font-mono text-[10px] text-[#C59B27] truncate block mt-0.5 select-all">
                {activeValue}
              </span>
              <span className="text-[10px] text-white/50 block mt-0.5">
                Click or drop another file to replace
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-2 space-y-1">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#C59B27] mb-1">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">
              Drag &amp; drop media asset from desktop
            </span>
            <span className="text-[10px] text-white/50">
              MinIO MAM Store: tvl-website-assets (PNG, JPG, WebP up to 25MB)
            </span>
          </div>
        )}
      </div>

      {/* Direct URL input fallback */}
      <div className="relative">
        <LinkIcon className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
        <input
          type="url"
          placeholder="Or paste media.tamarind.co.ke asset URL directly..."
          value={inputUrl}
          onChange={(e) => {
            setInputUrl(e.target.value);
            notifyChange(e.target.value);
          }}
          onBlur={handleUrlBlur}
          className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C59B27]"
        />
      </div>
    </div>
  );
}
