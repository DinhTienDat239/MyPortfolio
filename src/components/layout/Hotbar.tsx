import { useEffect } from 'react';
import { motion } from 'motion/react';
import { goToSection } from '../../lib/router';
import { currentLayer, LAYERS } from '../../lib/game';
import { useStore } from '../../lib/store';
import { play } from '../../lib/sound';
import { cn } from '../../lib/utils';
import { Sprite } from '../pixel/Sprite';

/** Thanh hotbar kiểu game ở đáy màn hình — bấm số 1…N để nhảy tầng. */
export default function Hotbar() {
  const active = useStore(currentLayer);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= LAYERS.length) {
        play('tick');
        goToSection(LAYERS[n - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <motion.nav
      aria-label="Sections"
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
      className="px-panel fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 gap-1.5 p-1.5 md:bottom-5 md:gap-2 md:p-2"
    >
      {LAYERS.map((l, i) => {
        const on = active === l.id;
        return (
          <button
            key={l.id}
            onClick={() => goToSection(l.id)}
            aria-label={l.label}
            aria-current={on ? 'true' : undefined}
            className={cn('px-slot group relative flex h-11 w-11 items-center justify-center md:h-14 md:w-14', on && 'bg-torch/15')}
            style={on ? { borderColor: 'var(--color-gold)', boxShadow: 'inset 0 2px 0 rgb(0 0 0 / 0.45), 0 0 16px rgb(242 193 78 / 0.45)' } : undefined}
          >
            <Sprite name={l.icon} size={28} className={cn('transition-transform md:hidden', on && 'animate-bob')} />
            <Sprite name={l.icon} size={36} className={cn('hidden transition-transform group-hover:-translate-y-0.5 md:block', on && 'animate-bob')} />
            <span className="absolute left-1 top-0.5 font-label text-[11px] text-parchment/70">{i + 1}</span>
            {/* tooltip */}
            <span className="px-panel pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap px-2.5 py-1 font-label text-[12px] uppercase text-parchment group-hover:block">
              {l.label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
