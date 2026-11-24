import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';

/**
 * Con trỏ: chấm nhỏ (blend difference → tự đảo màu trên nền trắng/đen).
 * Trên phần tử có data-cursor="Play" nở thành vòng tròn có chữ.
 */
export default function Cursor() {
  const [on, setOn] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [link, setLink] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setOn(true);
    document.documentElement.classList.add('has-cursor');
    const pick = (t: Element | null) => {
      const el = t?.closest?.<HTMLElement>('[data-cursor], a, button, input, textarea, label');
      setLabel(el?.dataset.cursor ?? null);
      setLink(!!el && !el.dataset.cursor);
    };
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      pick(e.target as Element);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pick(document.elementFromPoint(x.get(), y.get()));
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [x, y]);

  if (!on) return null;
  const size = label ? 88 : link ? 36 : 10;
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[150] mix-blend-difference" style={{ x: sx, y: sy }}>
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {label && <span className="text-[13px] font-medium text-black">{label}</span>}
      </motion.div>
    </motion.div>
  );
}
