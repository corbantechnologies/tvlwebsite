'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  fill,
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackImage = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80';
  const resolvedSrc = hasError || !src ? fallbackImage : src;

  if (fill) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover duration-500 ease-in-out ${
            isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      </div>
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      priority={priority}
      sizes={sizes}
      className={`duration-500 ease-in-out ${
        isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'
      } ${className}`}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setHasError(true);
        setIsLoading(false);
      }}
    />
  );
}
