import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { currentLayer, LAYERS } from '../../lib/game';
import { BIOMES, rgb, type BiomeId } from '../../engine/biomes';
import { Sprite, Torch } from '../pixel/Sprite';
import type { SpriteName } from '../pixel/sprites';

const TILE_TO_BIOME = { stone: 'burrow', dirt: 'clay', gold: 'ruins', crystal: 'crystal', moss: 'garden' } as const;
type TileName = keyof typeof TILE_TO_BIOME;

/** Vị trí đuốc trên dải tường (tỉ lệ ngang) */
const TORCH_X = [0.08, 0.36, 0.64, 0.92];

/**
 * Dải tường nhìn 3/4 (mặt trên + mặt đứng) có gắn đuốc — ngăn cách giữa các "phòng".
 * Ánh đuốc đổ xuống sàn phía dưới bằng các vũng sáng.
 */
export function WallBand({ biome, torches = true, className }: { biome: BiomeId; torches?: boolean; className?: string }) {
  const light = BIOMES[biome].light;
  return (
    <div aria-hidden className={cn('pointer-events-none relative', className)}>
      <div className={cn('wall-band w-full', `wall-${biome}`)} />
      {torches &&
        TORCH_X.map((x, i) => (
          <div key={i} className={cn('absolute', i % 3 === 1 && 'hidden md:block')} style={{ left: `${x * 100}%`, top: 44 }}>
            <div className="-translate-x-1/2">
              <Torch size={48} />
            </div>
            {/* vũng sáng đổ xuống sàn */}
            <div
              className="animate-flicker absolute left-0 top-10 h-[420px] w-[520px] -translate-x-1/2"
              style={{ background: `radial-gradient(closest-side, ${rgb(light, 0.24)}, ${rgb(light, 0.09)} 55%, transparent)`, mixBlendMode: 'screen', animationDelay: `${i * 0.4}s` }}
            />
          </div>
        ))}
    </div>
  );
}

interface LayerProps {
  id: string;
  tile: TileName;
  children: ReactNode;
  className?: string;
}

/** 1 "phòng" = 1 section: dải tường + sàn biome + ánh sáng; báo HUD biết đang ở tầng nào. */
export function LayerSection({ id, tile, children, className }: LayerProps) {
  const ref = useRef<HTMLElement>(null);
  const biome = TILE_TO_BIOME[tile];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && currentLayer.set(id), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  return (
    <section ref={ref} id={id} className={cn('relative overflow-hidden', `bg-floor-${biome}`, className)}>
      <WallBand biome={biome} />
      {/* bóng tối hai mép như tầm sáng có hạn */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_45%,transparent_45%,rgb(6_7_14/0.7)_100%)]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-28 pt-14 md:px-8 md:pb-36 md:pt-20">{children}</div>
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

/** Tiêu đề phòng: chip tên biome + độ sâu, tiêu đề lớn có quầng đuốc. */
export function LayerHeading({ id, title, intro, icon, align = 'left' }: HeadingProps) {
  const idx = LAYERS.findIndex((l) => l.id === id);
  const layer = LAYERS[idx];
  return (
    <div className={cn('mb-14 md:mb-16', align === 'center' && 'flex flex-col items-center text-center')}>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4 }}
        className="mb-4 inline-flex items-center gap-2 rounded-md border border-edge/70 bg-night/70 px-3 py-1.5 font-label text-[10px] uppercase text-mist backdrop-blur-sm"
      >
        <span className="text-gold">B{idx}</span>
        <span className="h-3 w-px bg-edge" />
        {layer?.biome} · -{layer?.depth}m
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn('title-glow flex items-center gap-4 text-6xl leading-[0.85] md:text-8xl', align === 'center' && 'justify-center')}
      >
        {icon && <Sprite name={icon} size={48} className="animate-bob hidden sm:block" />}
        {title}
      </motion.h2>
      {intro && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={cn('soft-shadow mt-5 max-w-2xl text-lg leading-relaxed text-mist', align === 'center' && 'mx-auto')}
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}
