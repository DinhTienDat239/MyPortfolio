import { useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { toggleBloodMode } from '../../lib/bloodMode';

export default function Footer() {
  const clicks = useRef<number[]>([]);

  // Easter egg: click 3 lần liên tiếp (trong 1.2s) vào dấu ✝
  const onSigil = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1200), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      toggleBloodMode();
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-ash bg-void px-5 pb-10 pt-20 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Chữ outline khổng lồ */}
        <p
          aria-hidden
          className="select-none text-center font-display text-[22vw] font-black leading-none text-transparent md:text-[17vw]"
          style={{ WebkitTextStroke: '1px rgb(255 0 51 / 0.25)' }}
        >
          {content.profile.alias.toUpperCase()}
        </p>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 font-mono text-xs uppercase tracking-[0.25em] text-fog md:flex-row">
          <p>
            © {new Date().getFullYear()} {content.profile.fullName}
            <button onClick={onSigil} aria-label="A strange mark" className="ml-3 cursor-default select-none text-blood-700 transition-colors hover:text-blood-500">
              ✝
            </button>
          </p>
          <p className="text-fog/60">Built with React, Three.js &amp; a little blood.</p>
          <button onClick={() => goToSection('top')} className="group flex items-center gap-2 transition-colors hover:text-bone">
            Rise
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-1" />
          </button>
        </div>
        <p aria-hidden className="mt-8 text-center font-mono text-[10px] tracking-[0.5em] text-ash">
          ↑ ↑ ↓ ↓ ← → ← → B A
        </p>
      </div>
    </footer>
  );
}
