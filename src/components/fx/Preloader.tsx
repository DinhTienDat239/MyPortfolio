import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { setScrollLocked } from './SmoothScroll';
import { Sprite } from '../pixel/Sprite';
import { LAYERS } from '../../lib/game';

const KEY = 'cave-world-generated';
const STEPS = ['Carving caverns', 'Scattering ores', 'Lighting torches', 'Growing glowshrooms', 'Waking the slimes'];
const TIPS = [`Tip: press 1–${LAYERS.length} to jump between layers.`, 'Tip: click the cave walls to mine ore.', 'Tip: some secrets only open with the right key sequence.'];
const SEGMENTS = 20;

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/** Màn "Generating world…" — chỉ chạy lần đầu trong phiên, ~1.8s. */
export default function Preloader() {
  const [visible, setVisible] = useState(() => !seen());
  const [progress, setProgress] = useState(0);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    if (!visible) return;
    setScrollLocked(true);
    const start = performance.now();
    const DURATION = 1700;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem(KEY, '1');
          } catch {
            /* ignore */
          }
        }, 300);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const filled = Math.round(progress * SEGMENTS);
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))];

  return (
    <AnimatePresence onExitComplete={() => setScrollLocked(false)}>
      {visible && (
        <motion.div
          key="preloader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'linear' }}
          className="bg-tile-stone fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
        >
          <div className="cave-dark pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col items-center">
            <Sprite name="pickaxe" size={64} className="animate-bob" />
            <p className="mt-6 font-label text-xs uppercase tracking-widest text-mist">World seed · 239</p>
            <h1 className="pixel-shadow mt-2 text-3xl font-bold text-parchment md:text-4xl">Generating world…</h1>

            <div className="px-slot mt-8 flex gap-1 p-2">
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <span
                  key={i}
                  className="h-4 w-2.5 sm:w-3.5"
                  style={{ background: i < filled ? (i % 5 === 4 ? 'var(--color-crystal)' : 'var(--color-torch)') : 'transparent' }}
                />
              ))}
            </div>
            <p className="mt-4 font-label text-xs text-torch">
              {step}
              <span className="animate-blink">_</span>
            </p>
            <p className="mt-10 max-w-xs text-center text-sm text-mist">{tip}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
