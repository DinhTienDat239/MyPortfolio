import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sprite } from '../pixel/Sprite';
import type { SpriteName } from '../pixel/sprites';
import { treasure } from '../../lib/game';
import { useStore } from '../../lib/store';

/** Đèn lồng ấm đi theo chuột trên toàn trang (chỉ khi dùng chuột). */
export function LanternLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    const onMove = (e: PointerEvent) => {
      el?.style.setProperty('--lx', `${e.clientX}px`);
      el?.style.setProperty('--ly', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return <div ref={ref} aria-hidden className="lantern-light pointer-events-none fixed inset-0 z-[45]" />;
}

/** Mảnh đá văng ra mỗi lần click — cảm giác như đang cầm cuốc. */
export function ClickDebris() {
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let id = 0;
    const onDown = (e: PointerEvent) => {
      const b = { id: ++id, x: e.clientX, y: e.clientY };
      setBursts((list) => [...list.slice(-6), b]);
      setTimeout(() => setBursts((list) => list.filter((x) => x.id !== b.id)), 650);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9997]">
      {bursts.map((b) =>
        Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + b.id;
          const dist = 18 + ((b.id * 7 + i * 13) % 14);
          return (
            <motion.span
              key={`${b.id}-${i}`}
              className="absolute block h-1.5 w-1.5"
              style={{ left: b.x, top: b.y, background: i % 3 === 0 ? 'var(--color-torch)' : '#6b6f93' }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist + 14, opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          );
        }),
      )}
    </div>
  );
}

const LOOT: { name: SpriteName; recolor?: Record<string, string> }[] = [
  { name: 'coin' },
  { name: 'gem' },
  { name: 'gem', recolor: { c: '#b77cff', C: '#e6ccff', b: '#6d3fb3' } },
  { name: 'gem', recolor: { c: '#e8434f', C: '#ff9aa4', b: '#8f1d2a' } },
  { name: 'ore' },
  { name: 'star' },
];

/** Easter egg: mưa kho báu (Konami, đủ quest đào quặng, hoặc dấu bí mật ở footer). */
export function TreasureRain() {
  const t = useStore(treasure);
  const message = t.reason === 'quest' ? 'Quest complete! The cave rewards you.' : 'Secret found! Treasure Rain!';

  return (
    <>
      <AnimatePresence>
        {t.on && (
          <motion.div key={t.n} aria-hidden className="pointer-events-none fixed inset-0 z-[95] overflow-hidden" exit={{ opacity: 0 }}>
            {Array.from({ length: 42 }).map((_, i) => {
              const item = LOOT[i % LOOT.length];
              const left = (i * 37) % 100;
              const delay = ((i * 53) % 100) / 60;
              return (
                <motion.div
                  key={i}
                  className="absolute top-0"
                  style={{ left: `${left}%` }}
                  initial={{ y: -60, rotate: 0 }}
                  animate={{ y: '110vh', rotate: (i % 2 ? 1 : -1) * 180 }}
                  transition={{ duration: 2.2 + (i % 5) * 0.25, delay, ease: 'easeIn' }}
                >
                  <Sprite name={item.name} recolor={item.recolor} size={32} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {t.on && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="px-panel fixed bottom-28 left-1/2 z-[96] flex items-center gap-3 px-5 py-3"
          >
            <Sprite name="chest" size={32} />
            <span className="font-label text-xs uppercase text-gold">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
