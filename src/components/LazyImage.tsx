import React, { useState } from 'react';
import { motion } from 'motion/react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function LazyImage({ src, alt, className = '', containerClassName = '', ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
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
        className={`w-full h-full object-cover ${className}`}
        {...props}
      />
    </div>
  );
}
