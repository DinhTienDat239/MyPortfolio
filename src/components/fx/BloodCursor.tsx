import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

type Variant = 'default' | 'hover' | 'view' | 'play';

const LABEL: Partial<Record<Variant, string>> = { view: 'VIEW', play: 'PLAY' };

/**
 * Con trỏ tuỳ biến: chấm đỏ bám sát + vòng tròn trễ theo spring.
 * - Chỉ bật với chuột (pointer: fine), tự tắt trên mobile/touch.
 * - Gắn data-cursor="view" | "play" vào bất kỳ element nào để đổi trạng thái.
 * - Cập nhật vị trí qua MotionValue → không re-render React mỗi lần chuột di chuyển.
 */
export default function BloodCursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<Variant>('default');
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button');
      if (!el) return setVariant('default');
      setVariant((el.dataset.cursor as Variant) || 'hover');
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [x, y]);

  if (!enabled) return null;

  const ringSize = variant === 'view' || variant === 'play' ? 88 : variant === 'hover' ? 52 : 34;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9998]">
      {/* Vòng ngoài – trễ */}
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-blood-500/70"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: ringSize,
          height: ringSize,
          scale: pressed ? 0.8 : 1,
          backgroundColor: variant === 'default' ? 'rgba(255,0,51,0)' : 'rgba(255,0,51,0.12)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <AnimatePresence>
          {LABEL[variant] && (
            <motion.span
              key={variant}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="font-mono text-[10px] tracking-[0.3em] text-bone"
            >
              {LABEL[variant]}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chấm trong – bám sát */}
      <motion.div
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-blood-500 shadow-blood"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: variant === 'default' ? 1 : 0 }}
      />
    </div>
  );
}
