import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { setScrollLocked } from './SmoothScroll';

const KEY = 'vamp-awakened';

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/** "Awakening": chỉ chạy lần đầu trong phiên, ~1.6s, đếm 0→100. */
export default function Preloader({ name }: { name: string }) {
  const [visible, setVisible] = useState(() => !seen());
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setScrollLocked(true);
    const start = performance.now();
    const DURATION = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // ease-out để số chạy nhanh rồi chậm dần
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem(KEY, '1');
          } catch {
            /* ignore */
          }
        }, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={() => setScrollLocked(false)}>
      {visible && (
        <motion.div
          key="preloader"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-void"
          style={{ clipPath: 'inset(0 0 0% 0)' }}
        >
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.6em', filter: 'blur(10px)' }}
            animate={{ opacity: 1, letterSpacing: '0.25em', filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl font-black uppercase text-bone md:text-6xl"
          >
            {name}
          </motion.div>
          <div className="mt-8 h-px w-56 overflow-hidden bg-ash">
            <div className="h-full bg-blood-500 shadow-blood" style={{ width: `${count}%` }} />
          </div>
          <div className="mt-4 font-mono text-xs tracking-[0.4em] text-fog">
            AWAKENING <span className="text-blood-400 tabular-nums">{String(count).padStart(3, '0')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
