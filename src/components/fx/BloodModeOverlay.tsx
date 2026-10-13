import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { bloodMode } from '../../lib/bloodMode';
import { useStore } from '../../lib/store';

/** Hiệu ứng khi kích hoạt easter egg: chớp đỏ + viền đập theo nhịp tim + thông báo. */
export default function BloodModeOverlay() {
  const on = useStore(bloodMode);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (flash === 0 && !on) return;
    setFlash((f) => f + 1);
    setToast(on ? 'You found the vein. Blood Mode awakened.' : 'The hunger fades… for now.');
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  return (
    <>
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            aria-hidden
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-[95] bg-blood-600 mix-blend-multiply"
          />
        )}
      </AnimatePresence>

      {on && <div aria-hidden className="blood-heartbeat pointer-events-none fixed inset-0 z-[55]" />}

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[96] border border-blood-600 bg-void/90 px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-blood-400 shadow-blood backdrop-blur"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
