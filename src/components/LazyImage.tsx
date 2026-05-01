import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export default function LazyImage({ src, alt, className, containerClassName, containerStyle, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div 
      className={cn("relative overflow-hidden", containerClassName)} 
      style={containerStyle}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
      )}
      <motion.img
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.05 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={cn("w-full h-full object-cover", className)}
        {...(props as any)}
      />
    </div>
  );
}
