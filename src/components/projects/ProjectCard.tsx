import { useRef, useState, type PointerEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_LABEL, type Project } from '../../types/content';
import { asset } from '../../data';
import { rememberHomeScroll } from '../../lib/router';
import { cn } from '../../lib/utils';
import ProjectArt from './ProjectArt';

interface ProjectCardProps {
  project: Project;
  index: number;
  className?: string;
}

const MAX_TILT = 9; // độ

export default function ProjectCard({ project, index, className }: ProjectCardProps) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Vị trí chuột trong card, chuẩn hoá 0..1
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring);

  // Vệt sáng đỏ chạy theo con trỏ
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgb(255 0 51 / 0.28), transparent 45%)`;

  const handleMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const handleEnter = () => {
    videoRef.current?.play().catch(() => {}); // preload="none" → chỉ tải khi hover lần đầu
  };

  const handleLeave = () => {
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
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.08 }}
      style={{ perspective: 1000 }}
      className={cn('group', className)}
    >
      <motion.a
        href={`#/work/${project.slug}`}
        onClick={rememberHomeScroll}
        onPointerMove={handleMove}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        data-cursor={project.category === 'playable' ? 'play' : 'view'}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative block h-full w-full border border-ash bg-crypt text-left transition-[border-color,box-shadow] duration-500 hover:border-blood-600/70 hover:shadow-blood"
      >
        {/* ---- Media ---- */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {thumb ? (
            <img
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover grayscale-[60%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
          ) : (
            <ProjectArt title={project.title} seed={project.slug} className="transition duration-700 group-hover:scale-105" />
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
              className={cn(
                'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500',
                videoReady && 'group-hover:opacity-100',
              )}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-crypt via-crypt/10 to-transparent" />
          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="absolute left-5 top-4 font-mono text-xs tracking-[0.3em] text-bone/60">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="absolute right-5 top-4 border border-blood-500/50 bg-void/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-blood-400 backdrop-blur">
            {CATEGORY_LABEL[project.category]}
          </span>
        </div>

        {/* ---- Text: nổi ra trước theo trục Z (cần preserve-3d, không để overflow-hidden ở thẻ a) ---- */}
        <div className="relative p-6" style={{ transform: 'translateZ(40px)' }}>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-2xl font-bold leading-tight text-bone transition-colors group-hover:text-blood-400">
              {project.title}
            </h3>
            <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-fog transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blood-500" />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fog">{project.summary}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.tags.slice(0, 4).map((tag) => (
              <li key={tag} className="border border-ash px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-fog">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </motion.a>
    </motion.article>
  );
}
