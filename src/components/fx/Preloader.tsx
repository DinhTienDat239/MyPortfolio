import { AnimatePresence, animate, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { content } from '../../data';
import { lockScroll } from '../../lib/scroll';

/**
 * Màn mở đầu ~1.4s: số đếm 0 → 100, rồi màn đen kéo lên để lộ trang.
 * Chỉ chạy một lần mỗi phiên (sessionStorage), bỏ qua khi bật reduce-motion.
 */
export default function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('seen-intro') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return true;
    }
  });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!show) return;
    lockScroll(true);
    const c = animate(0, 100, {
      duration: 1.4,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setN(Math.round(v)),
      onComplete: () => {
        try {
          sessionStorage.setItem('seen-intro', '1');
        } catch {
          /* ignore */
        }
        setTimeout(() => setShow(false), 150);
      },
    });
    return () => {
      c.stop();
      lockScroll(false);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="pre"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] flex flex-col justify-between bg-fg p-5 text-bg sm:p-8"
          style={{ clipPath: 'inset(0 0 0% 0)' }}
        >
          <p className="text-[15px]">{content.profile.fullName}</p>
          <div className="flex items-end justify-between">
            <p className="max-w-[16ch] text-[15px] text-bg/60">Playable ads developer & creative director</p>
            <p className="text-[clamp(5rem,16vw,14rem)] font-medium leading-[0.8] tracking-[-0.05em] tabular-nums">{n}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
