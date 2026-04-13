import React, { useState } from 'react';

interface FooterProps {
  brandName: string;
  onHiddenTrigger: () => void;
}

export default function Footer({ brandName, onHiddenTrigger }: FooterProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) {
      onHiddenTrigger();
      setClickCount(0);
    }
    // Reset count after 2 seconds of inactivity
    setTimeout(() => setClickCount(0), 2000);
  };

  return (
    <footer className="py-12 px-6 border-t border-white/5 bg-ocean-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-2xl font-bold font-display text-ocean-400">
          {brandName}
        </div>

        <div className="text-ocean-400 text-sm font-medium">
          © {new Date().getFullYear()} {brandName}. All rights reserved.
          <span 
            className="ml-2 cursor-default select-none opacity-50 hover:opacity-100 transition-opacity"
            onClick={handleClick}
          >
            •
          </span>
        </div>

        <div className="flex gap-6 text-ocean-200 text-sm">
          <a href="#about" className="hover:text-ocean-400 transition-colors">About</a>
          <a href="#playables" className="hover:text-ocean-400 transition-colors">Playables</a>
          <a href="#games" className="hover:text-ocean-400 transition-colors">Games</a>
        </div>
      </div>
    </footer>
  );
}
