import { useRef, useState, type PointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { CATEGORY_LABEL, type Project } from '../../types/content';
import { asset, CATEGORY_ICON, RARITY_COLOR, RARITY_LABEL, rarityOf } from '../../data';
import { rememberHomeScroll } from '../../lib/router';
import { cn } from '../../lib/utils';
import { Sparkle, Sprite } from '../pixel/Sprite';
import PixelScene from '../pixel/PixelScene';

const MAX_TILT = 8;

/** Thẻ project kiểu "vật phẩm" RPG: viền theo độ hiếm, nghiêng 3D, video khi hover. */
export default function ItemCard({ project, index, className }: { project: Project; index: number; className?: string }) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const rarity = rarityOf(project);
  const color = RARITY_COLOR[rarity];

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 260, damping: 20 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onEnter = () => {
    videoRef.current?.play().catch(() => {});
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const thumb = asset(project.thumbnail);
  const video = asset(project.previewVideo);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.06 }}
      style={{ perspective: 900 }}
      className={cn('group', className)}
    >
      <motion.a
        href={`#/work/${project.slug}`}
        onClick={rememberHomeScroll}
        onPointerMove={onMove}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ['--rarity' as string]: color }}
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn('px-panel relative block h-full p-3', rarity === 'legendary' && 'rarity-glow')}
      >
        {/* dải màu độ hiếm */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

        <div className="px-slot relative aspect-[16/10] overflow-hidden">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <PixelScene seed={project.slug} icon={CATEGORY_ICON[project.category]} className="transition duration-500 group-hover:scale-105" />
          )}
          {video && (
            <video
              ref={videoRef}
              src={video}
              muted
              loop
              playsInline
              preload="none"
              onPlaying={() => setVideoReady(true)}
              className={cn('absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300', videoReady && 'group-hover:opacity-100')}
            />
          )}
          <span className="absolute left-2 top-2 font-label text-[10px] text-parchment/80 pixel-shadow">#{String(index + 1).padStart(2, '0')}</span>
          {/* lấp lánh khi hover */}
          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Sparkle className="absolute left-[18%] top-[22%]" color={color} />
            <Sparkle className="absolute right-[16%] top-[40%]" delay={0.4} />
            <Sparkle className="absolute bottom-[18%] left-[45%]" delay={0.8} color="var(--color-crystal)" />
          </span>
        </div>

        {/* Thông tin kiểu tooltip vật phẩm */}
        <div className="relative px-1 pb-1 pt-4" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-start gap-3">
            <span className="px-slot flex h-11 w-11 shrink-0 items-center justify-center">
              <Sprite name={CATEGORY_ICON[project.category]} size={28} className="transition-transform group-hover:-translate-y-0.5 group-hover:rotate-6" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-bold leading-tight" style={{ color }}>
                {project.title}
              </h3>
              <p className="font-label text-[10px] uppercase text-mist">
                {RARITY_LABEL[rarity]} · {CATEGORY_LABEL[project.category]}
              </p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-mist">{project.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {project.tags.slice(0, 4).map((t) => (
              <li key={t} className="font-label text-[10px] uppercase text-uncommon">
                + {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center justify-between font-label text-[10px] uppercase text-torch opacity-70 transition-opacity group-hover:opacity-100">
            {project.playableUrl ? 'Equip & play' : 'Inspect'}
            <span className="transition-transform group-hover:translate-x-1">▶</span>
          </p>
        </div>
      </motion.a>
    </motion.article>
  );
}
