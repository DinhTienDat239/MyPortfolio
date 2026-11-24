import { motion, useMotionValue, useScroll, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { asset, formatSize, projects } from '../../data';
import { GENRE_LABEL, type Project } from '../../types/content';
import { scrollTo } from '../../lib/scroll';
import { MaskLine, Reveal } from '../ui/Reveal';

function useDesktop() {
  const [d, setD] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setD(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return d;
}

/**
 * Showcase nền đen. Desktop: cuộn dọc → dải playable trượt ngang (sticky + translateX).
 * Mobile: vuốt ngang tự nhiên có snap.
 */
export default function PlayableShowcase({ onPlay }: { onPlay: (slug: string) => void }) {
  const desktop = useDesktop();
  const puzzle = projects.filter((p) => p.genre === 'puzzle').length;

  return (
    <section id="work" className="bg-fg text-bg">
      <div className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-8 md:pt-32">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6 border-t border-bg/15 pt-4 text-sm text-bg/50">
            <span>
              <span className="tabular-nums">(01)</span>
              <span className="ml-4">Playable ads</span>
            </span>
            <span className="hidden sm:block">{projects.length} real builds · click to play</span>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:items-end lg:gap-8">
          <h2 className="text-[clamp(2.4rem,5.2vw,5rem)] font-medium leading-[0.98] tracking-[-0.04em] lg:col-span-8">
            <MaskLine inView>Don&apos;t watch the ads.</MaskLine>
            <MaskLine inView delay={0.08}>
              <span className="em">Play</span> them.
            </MaskLine>
          </h2>
          <Reveal className="lg:col-span-4" delay={0.1}>
            <p className="leading-relaxed text-bg/65">
              I build every genre — but my deepest experience is <span className="text-bg">mobile puzzle</span>: {puzzle} of the {projects.length} builds here are puzzles, the kind of mechanic that has to teach itself in one tap.
            </p>
          </Reveal>
        </div>
      </div>

      {desktop ? <HorizontalTrack list={projects} onPlay={onPlay} /> : <SwipeTrack list={projects} onPlay={onPlay} />}
    </section>
  );
}

function HorizontalTrack({ list, onPlay }: { list: Project[]; onPlay: (slug: string) => void }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dist = useMotionValue(0);
  const [height, setHeight] = useState<number>();
  const { scrollYProgress } = useScroll({ target: outer, offset: ['start start', 'end end'] });
  const x = useTransform(() => -scrollYProgress.get() * dist.get());
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return;
      const d = Math.max(0, track.current.scrollWidth - innerWidth);
      dist.set(d);
      setHeight(d + innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      removeEventListener('resize', measure);
    };
  }, [dist, list.length]);

  return (
    <div ref={outer} style={{ height }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div ref={track} style={{ x }} className="group/track flex items-end gap-12 pl-8 pr-[10vw] will-change-transform xl:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]">
          {list.map((p, i) => (
            <Card key={p.id} project={p} index={i + 1} onPlay={onPlay} width="calc(min(58vh, 560px) * 9 / 19)" />
          ))}
          <div className="flex w-[20rem] shrink-0 flex-col justify-end self-stretch pb-20 pl-4">
            <p className="text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.05] tracking-tight">
              {list.length} of <span className="em">1000+.</span>
            </p>
            <p className="mt-3 text-bg/60">The rest live inside client campaigns.</p>
            <button onClick={() => scrollTo('#contact', -20)} className="link mt-6 w-fit text-[15px]">
              Ask for the full reel →
            </button>
          </div>
        </motion.div>
        {/* thanh tiến độ dải ngang */}
        <div className="mx-auto mt-10 h-px w-[min(1336px,calc(100vw-4rem))] bg-bg/15">
          <motion.div style={{ width: bar }} className="h-px bg-bg" />
        </div>
      </div>
    </div>
  );
}

function SwipeTrack({ list, onPlay }: { list: Project[]; onPlay: (slug: string) => void }) {
  return (
    <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-24 sm:px-8" data-lenis-prevent>
      {list.map((p, i) => (
        <div key={p.id} className="snap-start">
          <Card project={p} index={i + 1} onPlay={onPlay} width="min(60vw, 240px)" />
        </div>
      ))}
    </div>
  );
}

function Card({ project: p, index, onPlay, width }: { project: Project; index: number; onPlay: (slug: string) => void; width: string }) {
  const video = useRef<HTMLVideoElement>(null);
  return (
    <button
      onClick={() => onPlay(p.slug)}
      onPointerEnter={() => video.current?.play().catch(() => {})}
      onPointerLeave={() => {
        if (!video.current) return;
        video.current.pause();
        video.current.currentTime = 0;
      }}
      data-cursor="Play"
      aria-label={`Play ${p.title}`}
      style={{ width }}
      className="group block shrink-0 text-left transition-opacity duration-500 group-hover/track:opacity-35 hover:!opacity-100"
    >
      <div className="mb-4 flex items-baseline justify-between text-sm text-bg/45">
        <span className="tabular-nums">{String(index).padStart(2, '0')}</span>
        <span>{GENRE_LABEL[p.genre]}</span>
      </div>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.4rem] bg-white/5" style={{ clipPath: 'inset(0 round 1.4rem)' }}>
        {p.thumbnail && (
          <img
            src={asset(p.thumbnail)}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
          />
        )}
        {p.previewVideo && (
          <video ref={video} src={asset(p.previewVideo)} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight">{p.title}</h3>
      <p className="mt-0.5 text-sm text-bg/50">
        Single HTML · <span className="whitespace-nowrap">{formatSize(p.sizeKB)}</span>
        {p.installs && ` · ${p.installs} installs`}
      </p>
    </button>
  );
}
