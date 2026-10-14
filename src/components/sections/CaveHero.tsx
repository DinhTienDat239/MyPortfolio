import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { addOre, currentLayer, ores, QUEST_GOAL, treasure } from '../../lib/game';
import { useStore } from '../../lib/store';
import { Sprite, Sparkle, Torch } from '../pixel/Sprite';

const CaveScene = lazy(() => import('../three/CaveScene'));

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

function QuestTracker() {
  const { total } = useStore(ores);
  const done = total >= QUEST_GOAL;
  const n = Math.min(total, QUEST_GOAL);
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.6 }}
      className="px-panel pointer-events-auto absolute right-3 top-24 z-10 hidden w-60 p-3 sm:block md:right-6 md:top-28"
    >
      <p className="font-label text-[10px] uppercase text-torch">{done ? 'Quest complete!' : 'Quest'}</p>
      <p className="mt-1 text-sm text-parchment">Mine {QUEST_GOAL} blocks from the cave walls</p>
      <div className="px-slot mt-2 flex gap-0.5 p-1">
        {Array.from({ length: QUEST_GOAL }).map((_, i) => (
          <span key={i} className="h-2.5 flex-1" style={{ background: i < n ? 'var(--color-gold)' : 'transparent' }} />
        ))}
      </div>
      <p className="mt-1.5 font-label text-[10px] text-mist">
        {n}/{QUEST_GOAL} · {done ? 'reward claimed ✦' : 'click a wall block'}
      </p>
    </motion.div>
  );
}

export default function CaveHero() {
  const { profile } = content;
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const rich = useStore(treasure).on;
  const [inView, setInView] = useState(true);
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (e.isIntersecting) currentLayer.set('top');
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const title = profile.alias.toUpperCase();

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-void" style={{ zIndex: 0 }}>
      {/* ---- Hang động 3D ---- */}
      <div className="absolute inset-0">
        {reduced || !webgl ? (
          <div className="bg-tile-stone absolute inset-0" />
        ) : (
          <Suspense fallback={<div className="bg-tile-stone absolute inset-0" />}>
            <CaveScene active={inView} intense={rich} eventSource={ref} onMine={addOre} />
          </Suspense>
        )}
      </div>
      {/* tối dần ở mép + vùng tối sau chữ cho dễ đọc */}
      <div aria-hidden className="cave-dark pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(7_7_13/0.55),transparent_55%)]" />

      <QuestTracker />

      {/* ---- Nội dung ---- */}
      <motion.div style={{ y: contentY, opacity: fade }} className="pointer-events-none relative z-10 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-panel mx-auto mb-8 inline-flex items-center gap-2 px-3 py-1.5 font-label text-[10px] uppercase text-parchment"
        >
          <Sprite name="lantern" size={16} /> {profile.location} · Surface · 0m
        </motion.p>

        <h1 className="relative text-[clamp(4rem,17vw,13rem)] font-bold leading-[0.85] text-parchment" aria-label={`${profile.alias} — ${profile.fullName}`}>
          <span aria-hidden className="pixel-extrude inline-block">
            {title.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: '-120%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.4 + i * 0.08 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
          <Sparkle className="absolute -left-3 top-2 md:-left-6" size={18} />
          <Sparkle className="absolute -right-2 bottom-6 md:-right-5" size={14} delay={0.6} color="var(--color-crystal)" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="pixel-shadow mx-auto mt-10 max-w-2xl text-2xl text-parchment md:text-3xl"
        >
          {profile.tagline}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-3 font-label text-[11px] uppercase text-mist md:text-xs">
          {profile.fullName} · {profile.roles}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="pointer-events-auto mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row"
        >
          <button onClick={() => goToSection('origin')} className="px-btn">
            <Sprite name="pickaxe" size={20} /> Start expedition
          </button>
          <button onClick={() => goToSection('contact')} className="px-btn-stone">
            <Sprite name="scroll" size={20} /> Send a message
          </button>
        </motion.div>
      </motion.div>

      {/* Đuốc hai bên + gợi ý đào */}
      <Torch size={56} className="pointer-events-none absolute bottom-24 left-6 hidden md:inline-block" />
      <Torch size={56} className="pointer-events-none absolute bottom-24 right-6 hidden md:inline-block" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="pointer-events-none absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 font-label text-[10px] uppercase text-mist md:bottom-28"
      >
        <Sprite name="pickaxe" size={16} className="animate-bob" /> click the walls to mine · scroll to dig deeper
      </motion.p>
    </section>
  );
}
