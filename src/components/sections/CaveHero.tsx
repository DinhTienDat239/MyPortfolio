import { useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { content, projects, RARITY_COLOR, RARITY_LABEL, rarityOf } from '../../data';
import { CATEGORY_LABEL } from '../../types/content';
import { goToSection, rememberHomeScroll } from '../../lib/router';
import { addOre, currentLayer, ores, QUEST_GOAL, treasure } from '../../lib/game';
import { useStore } from '../../lib/store';
import { play } from '../../lib/sound';
import { CaveWorld, type HoverInfo, type Interaction } from '../../engine/CaveWorld';
import { Sprite } from '../pixel/Sprite';

const CHEST_PROJECTS = projects.slice(0, 3);

type Event = { kind: 'chest'; index: number } | { kind: 'sign' } | { kind: 'relic' };

/** Thông báo nhỏ khi tương tác với thế giới (rương = dự án, biển = hướng dẫn). */
function EventCard({ event, onClose }: { event: Event; onClose: () => void }) {
  if (event.kind === 'chest') {
    const p = CHEST_PROJECTS[event.index];
    if (!p) return null;
    const rarity = rarityOf(p);
    return (
      <div className="px-panel w-[min(340px,calc(100vw-2rem))] p-4">
        <div className="flex items-start gap-3">
          <span className="px-slot flex h-12 w-12 shrink-0 items-center justify-center">
            <Sprite name="chestOpen" size={32} />
          </span>
          <div className="min-w-0">
            <p className="font-label text-[9px] uppercase text-mist">You found</p>
            <p className="truncate font-display text-3xl leading-none" style={{ color: RARITY_COLOR[rarity] }}>
              {p.title}
            </p>
            <p className="font-label text-[9px] uppercase text-mist">
              {RARITY_LABEL[rarity]} · {CATEGORY_LABEL[p.category]}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-mist">{p.summary}</p>
        <div className="mt-3 flex items-center justify-between">
          <a href={`#/work/${p.slug}`} onClick={rememberHomeScroll} className="px-btn !px-3 !py-2 !text-[10px]">
            Inspect item ▶
          </a>
          <button onClick={onClose} className="font-label text-[10px] uppercase text-mist hover:text-parchment">
            Close
          </button>
        </div>
      </div>
    );
  }
  const sign = event.kind === 'sign';
  return (
    <div className="w-[min(340px,calc(100vw-2rem))] rounded-lg border-2 border-[#6e4a2a] bg-gradient-to-b from-[#f6ead0] to-[#e3cfa4] p-4 text-ink shadow-[0_10px_30px_rgb(0_0_0/0.5)]">
      <p className="font-display text-3xl leading-none">{sign ? 'Welcome, explorer' : 'The relic hums…'}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#4a3220]">
        {sign
          ? 'Click the floor to walk, click a wall to dig. Three chests are hidden in this cave — each holds one of my projects. Desktop: WASD works too.'
          : 'A wave of old light rolls through the cave. Somewhere, a slime is impressed.'}
      </p>
      <button onClick={onClose} className="mt-3 font-label text-[10px] uppercase text-[#6e4a2a] hover:text-ink">
        Got it
      </button>
    </div>
  );
}

function CaveCanvas({ sectionRef, onEvent, onHover }: { sectionRef: RefObject<HTMLElement | null>; onEvent: (e: Event) => void; onHover: (h: HoverInfo | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const rich = useStore(treasure).on;
  const world = useRef<CaveWorld | null>(null);
  const cb = useRef({ onEvent, onHover });
  cb.current = { onEvent, onHover };

  useEffect(() => {
    const canvas = ref.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const wide = window.innerWidth >= 900;
    const w = new CaveWorld(canvas, {
      biome: 'burrow',
      interactive: true,
      calm: !!reduced,
      focus: wide ? { x: 0.66, y: 0.48 } : { x: 0.5, y: 0.22 },
      chestLabels: CHEST_PROJECTS.map((p) => p.title),
      onMine: addOre,
      onHit: () => play('mine'),
      onHover: (h) => cb.current.onHover(h),
      onInteract: (i: Interaction) => {
        if (i.type === 'chest') {
          play('chime');
          cb.current.onEvent({ kind: 'chest', index: i.index });
        } else if (i.type === 'sign') {
          play('tick');
          cb.current.onEvent({ kind: 'sign' });
        } else if (i.type === 'relic') {
          play('chime');
          cb.current.onEvent({ kind: 'relic' });
        } else if (i.type === 'slime') play('pickup');
        else if (i.type === 'torch') play(i.lit ? 'pickup' : 'thud');
        else play('key');
      },
    });
    world.current = w;
    (window as unknown as { __cave?: CaveWorld }).__cave = w;

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      w.resize(r.width, r.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        w.start();
        currentLayer.set('top');
      } else w.stop();
    }, { threshold: 0.05 });
    io.observe(section);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') w.pointerMove(e.clientX, e.clientY);
    };
    const onLeave = () => w.pointerLeave();
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-ui]')) return;
      w.click(e.clientX, e.clientY);
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (!visible || (e.target as HTMLElement).closest('input, textarea')) return;
      const k = e.key.toLowerCase();
      if ('wasd'.includes(k) && k.length === 1) w.setKey(k, down);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    section.addEventListener('click', onClick);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    return () => {
      ro.disconnect();
      io.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      section.removeEventListener('click', onClick);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      w.destroy();
    };
  }, [reduced, sectionRef]);

  useEffect(() => world.current?.setIntense(rich), [rich]);

  return <canvas ref={ref} aria-label="An explorable, torch-lit cave" className="absolute inset-0 h-full w-full" />;
}

export default function CaveHero() {
  const { profile } = content;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const [event, setEvent] = useState<Event | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const { total } = useStore(ores);

  return (
    <section ref={ref} id="top" className="relative flex min-h-[100svh] items-end overflow-hidden bg-night md:items-center" style={{ zIndex: 0 }}>
      <CaveCanvas sectionRef={ref} onEvent={setEvent} onHover={setHover} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent md:bg-gradient-to-r md:from-night/90 md:via-night/40 md:to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(6_7_14/0.6)_100%)]" />

      {/* tooltip theo con trỏ */}
      {hover && (
        <div className="pointer-events-none fixed z-[60] rounded-md border border-edge bg-night/90 px-2 py-1 font-label text-[10px] uppercase text-parchment shadow-lg" style={{ left: hover.x + 16, top: hover.y + 18 }}>
          {hover.label}
        </div>
      )}

      {/* thẻ sự kiện */}
      <div data-ui className="absolute bottom-28 right-4 z-20 md:bottom-10 md:right-8">
        <AnimatePresence mode="wait">
          {event && (
            <motion.div key={JSON.stringify(event)} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
              <EventCard event={event} onClose={() => setEvent(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* nhiệm vụ nhỏ góc phải trên */}
      <div data-ui className="pointer-events-none absolute right-4 top-24 z-10 hidden items-center gap-2 rounded-md border border-edge/70 bg-night/70 px-3 py-1.5 font-label text-[10px] uppercase text-mist backdrop-blur-sm sm:flex md:right-8">
        <Sprite name="ore" size={14} /> {Math.min(total, QUEST_GOAL)}/{QUEST_GOAL} blocks mined · 3 chests hidden
      </div>

      <motion.div style={{ y: contentY, opacity: fade }} className="pointer-events-none relative z-10 w-full px-6 pb-36 md:px-12 md:pb-0 lg:px-20">
        <div className="max-w-xl">
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
            <button onClick={() => goToSection('work')} className="px-btn">
              <Sprite name="chest" size={18} /> See the work
            </button>
            <button onClick={() => goToSection('contact')} className="px-btn-stone">
              <Sprite name="scroll" size={18} /> Send a message
            </button>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-8 flex items-center gap-2 font-label text-[10px] uppercase text-mist/80">
            <Sprite name="hand" size={14} className="animate-bob" /> This cave is playable — tap around
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
