import { useEffect, useRef, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { addOre, currentLayer, ores, QUEST_GOAL, treasure } from '../../lib/game';
import { useStore } from '../../lib/store';
import { play } from '../../lib/sound';
import { CaveWorld } from '../../engine/CaveWorld';
import { Sprite } from '../pixel/Sprite';

function QuestTracker() {
  const { total } = useStore(ores);
  const done = total >= QUEST_GOAL;
  const n = Math.min(total, QUEST_GOAL);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6 }}
      className="px-panel pointer-events-auto absolute right-4 top-24 z-10 hidden w-64 p-3.5 sm:block md:right-8 md:top-28"
    >
      <div className="flex items-center gap-2">
        <Sprite name={done ? 'chest' : 'pickaxe'} size={20} />
        <p className="font-label text-[10px] uppercase text-gold">{done ? 'Quest complete' : 'Quest'}</p>
      </div>
      <p className="mt-1.5 text-sm leading-snug text-parchment">Mine {QUEST_GOAL} blocks from the cave walls</p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-sm bg-black/50">
        <motion.div className="h-full bg-gold" animate={{ width: `${(n / QUEST_GOAL) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
      </div>
      <p className="mt-1.5 font-label text-[9px] uppercase text-mist">
        {n}/{QUEST_GOAL} · {done ? 'reward claimed' : 'hit a wall 3× to break it'}
      </p>
    </motion.div>
  );
}

/** Canvas hang động 2D có ánh sáng động — click tường để đào. */
function CaveCanvas({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const rich = useStore(treasure).on;
  const world = useRef<CaveWorld | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const wide = () => window.innerWidth >= 900;
    const w = new CaveWorld(canvas, {
      biome: 'burrow',
      interactive: true,
      calm: !!reduced,
      focus: wide() ? { x: 0.68, y: 0.5 } : { x: 0.5, y: 0.3 },
      onMine: addOre,
    });
    world.current = w;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      w.resize(r.width, r.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        w.start();
        currentLayer.set('top');
      } else w.stop();
    }, { threshold: 0.05 });
    io.observe(section);

    // Nghe sự kiện trên cả section (chữ nằm đè lên canvas)
    const onMove = (e: PointerEvent) => w.pointerMove(e.clientX, e.clientY);
    const onLeave = () => w.pointerLeave();
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      if (w.click(e.clientX, e.clientY)) play('mine');
    };
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    section.addEventListener('click', onClick);

    return () => {
      ro.disconnect();
      io.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      section.removeEventListener('click', onClick);
      w.destroy();
    };
  }, [reduced, sectionRef]);

  useEffect(() => world.current?.setIntense(rich), [rich]);

  return <canvas ref={ref} aria-label="A torch-lit cave you can mine" className="absolute inset-0 h-full w-full" />;
}

export default function CaveHero() {
  const { profile } = content;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] items-end overflow-hidden bg-night md:items-center" style={{ zIndex: 0 }}>
      <CaveCanvas sectionRef={ref} />
      {/* bóng tối để chữ dễ đọc: bên trái trên desktop, phía dưới trên mobile */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/70 to-transparent md:bg-gradient-to-r md:from-night/95 md:via-night/55 md:to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-transparent" />

      <QuestTracker />

      <motion.div style={{ y: contentY, opacity: fade }} className="pointer-events-none relative z-10 w-full px-6 pb-36 md:px-12 md:pb-0 lg:px-20">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5 inline-flex items-center gap-2 rounded-md border border-edge/70 bg-night/70 px-3 py-1.5 font-label text-[10px] uppercase text-mist backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]" />
            {profile.location} · Ember Burrow
          </motion.p>

          <h1 aria-label={`${profile.alias} — ${profile.fullName}`} className="title-glow font-display text-[clamp(5.5rem,16vw,11rem)] leading-[0.8] text-parchment">
            {profile.alias.split('').map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block"
                initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.45 + i * 0.07 }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="soft-shadow mt-5 text-2xl text-parchment md:text-[1.7rem]">
            {profile.tagline}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-3 text-base text-mist">
            {profile.fullName} — {profile.roles}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} className="pointer-events-auto mt-9 flex flex-wrap gap-4">
            <button onClick={() => goToSection('origin')} className="px-btn">
              <Sprite name="lantern" size={18} /> Start expedition
            </button>
            <button onClick={() => goToSection('contact')} className="px-btn-stone">
              <Sprite name="scroll" size={18} /> Send a message
            </button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-8 hidden items-center gap-2 font-label text-[10px] uppercase text-mist/80 md:flex">
            <Sprite name="pickaxe" size={14} /> Tip: click the cave walls to mine
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
