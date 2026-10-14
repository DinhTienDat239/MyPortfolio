import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { currentLayer, LAYERS } from '../../lib/game';
import { Sprite } from '../pixel/Sprite';
import type { SpriteName } from '../pixel/sprites';

/** Mép trên lởm chởm kiểu khối pixel (clip-path bậc thang, tất định theo seed). */
function jagged(seed: number, steps = 48) {
  const pts: string[] = ['0% 100%', '0% 16px'];
  for (let i = 0; i < steps; i++) {
    const r = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1;
    const y = r < 0.33 ? 0 : r < 0.66 ? 8 : 16;
    const x0 = (i / steps) * 100;
    const x1 = ((i + 1) / steps) * 100;
    pts.push(`${x0}% ${y}px`, `${x1}% ${y}px`);
  }
  pts.push('100% 16px', '100% 100%');
  return `polygon(${pts.join(',')})`;
}

const TILE = {
  stone: 'bg-tile-stone',
  dirt: 'bg-tile-dirt',
  gold: 'bg-tile-gold',
  crystal: 'bg-tile-crystal',
  moss: 'bg-tile-moss',
} as const;

interface LayerProps {
  id: string;
  tile: keyof typeof TILE;
  children: ReactNode;
  className?: string;
}

/** 1 "tầng đất" = 1 section: nền tile riêng, mép lởm chởm, báo cho HUD biết đang ở tầng nào. */
export function LayerSection({ id, tile, children, className }: LayerProps) {
  const ref = useRef<HTMLElement>(null);
  const idx = LAYERS.findIndex((l) => l.id === id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && currentLayer.set(id), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  return (
    <section
      ref={ref}
      id={id}
      className={cn('relative -mt-4 px-5 pb-28 pt-24 md:px-8 md:pb-36 md:pt-32', TILE[tile], className)}
      style={{ clipPath: jagged(idx + 3), zIndex: idx }}
    >
      <div aria-hidden className="cave-dark pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

interface HeadingProps {
  id: string;
  title: string;
  intro?: string;
  icon?: SpriteName;
  align?: 'left' | 'center';
}

/** Tiêu đề tầng: "B2 · Golden Vault · -48m" + tiêu đề pixel lớn. */
export function LayerHeading({ id, title, intro, icon, align = 'left' }: HeadingProps) {
  const idx = LAYERS.findIndex((l) => l.id === id);
  const layer = LAYERS[idx];
  return (
    <div className={cn('mb-14 md:mb-20', align === 'center' && 'flex flex-col items-center text-center')}>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-4 inline-flex items-center gap-3 font-label text-[11px] uppercase text-torch"
      >
        <span className="px-slot px-2 py-1 text-parchment">B{idx}</span>
        {layer?.biome} · -{layer?.depth}m
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pixel-shadow flex items-center gap-4 text-5xl font-bold leading-none text-parchment md:text-7xl"
      >
        {icon && <Sprite name={icon} size={56} className="animate-bob hidden sm:block" />}
        {title}
      </motion.h2>
      {intro && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={cn('mt-6 max-w-2xl text-lg leading-relaxed text-mist', align === 'center' && 'mx-auto')}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
