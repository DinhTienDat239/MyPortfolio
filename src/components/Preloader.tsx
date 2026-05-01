import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lock scroll while loading
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = 'unset';
    }, 2500);
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background subtle grid/noise could go here, but keeping it minimal black */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase font-display mix-blend-difference"
            >
              Tibber Dinh
            </motion.div>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-[2px] bg-white mt-6"
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="absolute -bottom-10 text-xs font-mono text-neutral-500 tracking-widest uppercase"
            >
              Loading Experience
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
