import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { asset, content, projects } from '../../data';
import { INTRO_DELAY } from '../../lib/intro';
import { scrollTo } from '../../lib/scroll';
import PhoneFrame from '../ui/PhoneFrame';
import { EASE, MaskLine } from '../ui/Reveal';

const reel = projects.filter((p) => p.thumbnail);
const D = INTRO_DELAY;

export default function Hero({ onPlay }: { onPlay: (slug: string) => void }) {
  const { hero, profile, stats } = content;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const xL = useTransform(scrollYProgress, [0, 1], ['0%', '-5%']);
  const xR = useTransform(scrollYProgress, [0, 1], ['0%', '5%']);

  const fade = (d: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay: D + d },
  });

  return (
    <section ref={ref} id="top" className="relative overflow-x-clip">
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-28 sm:px-8 md:pt-36">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* ---------- Chữ ---------- */}
          <div className="lg:col-span-7">
            <motion.p {...fade(0)} className="mb-8 flex items-center gap-3 text-[15px] text-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-fg" />
              </span>
              {profile.available ? 'Available for new projects' : profile.location}
            </motion.p>

            <h1 className="text-[clamp(3rem,7.4vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.045em]">
              <motion.span style={{ x: xL }} className="block">
                <MaskLine delay={D}>Bridging code,</MaskLine>
              </motion.span>
              <motion.span style={{ x: xR }} className="block">
                <MaskLine delay={D + 0.08}>
                  <span className="em text-[1.08em]">creativity</span> &amp;
                </MaskLine>
              </motion.span>
              <motion.span style={{ x: xL }} className="block">
                <MaskLine delay={D + 0.16}>conversion.</MaskLine>
              </motion.span>
            </h1>

            <motion.div {...fade(0.5)} className="mt-10 max-w-xl">
              <p className="text-xl font-medium tracking-tight">{hero.headlineAccent}</p>
              <p className="mt-3 leading-relaxed text-fg/70">{hero.subheadline}</p>
            </motion.div>
            <motion.div {...fade(0.6)} className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-[15px] sm:gap-x-8">
              <button onClick={() => scrollTo('#work', -20)} className="rounded-full bg-fg px-5 py-3 text-bg transition-opacity hover:opacity-80 sm:px-6">
                Play my playables
              </button>
              <button onClick={() => scrollTo('#experience', -20)} className="link">
                Experience
              </button>
              <button onClick={() => scrollTo('#contact', -20)} className="link">
                Contact
              </button>
            </motion.div>
          </div>

          {/* ---------- Bộ ba điện thoại ---------- */}
          <div className="lg:col-span-5">
            <PhoneStage onPlay={onPlay} progress={scrollYProgress} />
          </div>
        </div>

        <motion.dl {...fade(0.7)} className="mt-20 grid grid-cols-2 gap-y-8 border-t border-line pt-8 md:mt-24 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse pr-4">
              <dt className="mt-1 text-sm text-muted">{s.label}</dt>
              <dd className="text-4xl font-medium tracking-[-0.03em] md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

/**
 * Ba điện thoại xếp lớp: máy giữa chạy vòng các playable, hai máy sau nghiêng ra hai bên.
 * Mỗi lớp lệch theo chuột với độ sâu khác nhau (parallax) và tách ra khi cuộn xuống.
 */
function PhoneStage({ onPlay, progress }: { onPlay: (slug: string) => void; progress: MotionValue<number> }) {
  const [i, setI] = useState(0);
  const cur = reel[i];
  const left = reel[(i + reel.length - 1) % reel.length];
  const right = reel[(i + 1) % reel.length];

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const rotX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const farX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const farY = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const spread = useTransform(progress, [0, 0.6], [0, 40]);
  const leftX = useTransform(() => farX.get() - spread.get());
  const rightX = useTransform(() => farX.get() + spread.get());

  useEffect(() => {
    if (reel.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % reel.length), 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx.set(e.clientX / innerWidth - 0.5);
      my.set(e.clientY / innerHeight - 0.5);
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [mx, my]);

  if (!cur) return null;
  return (
    <div className="relative mx-auto aspect-[1/1.05] w-full max-w-[520px] [perspective:1400px]">
      {/* hai máy phía sau */}
      <motion.div
        initial={{ opacity: 0, rotate: 0, x: 0 }}
        animate={{ opacity: 1, rotate: -9 }}
        transition={{ duration: 1.4, ease: EASE, delay: D + 0.45 }}
        style={{ x: leftX, y: farY }}
        className="absolute left-[2%] top-[12%] w-[40%]"
      >
        <PhoneFrame className="opacity-90 shadow-[0_40px_60px_-30px_rgb(0_0_0/0.35)]">
          <Screen src={asset(left.thumbnail)!} k={left.id} dim />
        </PhoneFrame>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, rotate: 0, x: 0 }}
        animate={{ opacity: 1, rotate: 9 }}
        transition={{ duration: 1.4, ease: EASE, delay: D + 0.5 }}
        style={{ x: rightX, y: farY }}
        className="absolute right-[2%] top-[12%] w-[40%]"
      >
        <PhoneFrame className="opacity-90 shadow-[0_40px_60px_-30px_rgb(0_0_0/0.35)]">
          <Screen src={asset(right.thumbnail)!} k={right.id} dim />
        </PhoneFrame>
      </motion.div>

      {/* máy chính */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, ease: EASE, delay: D + 0.25 }}
        className="absolute left-1/2 top-0 w-[50%] -translate-x-1/2"
      >
        <motion.div style={{ rotateX: rotX, rotateY: rotY }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <button onClick={() => onPlay(cur.slug)} data-cursor="Play" aria-label={`Play ${cur.title}`} className="block w-full rounded-[13%/6%]">
              <PhoneFrame className="shadow-[0_50px_70px_-35px_rgb(0_0_0/0.55)]">
                <Screen src={asset(cur.thumbnail)!} k={cur.id} />
              </PhoneFrame>
            </button>
          </motion.div>
        </motion.div>
        {/* bóng đổ trên "sàn" */}
        <div aria-hidden className="mx-auto mt-6 h-4 w-[70%] rounded-[50%] bg-black/15 blur-md" />
        <div className="mt-4 text-center text-sm">
          <AnimatePresence mode="wait">
            <motion.p key={cur.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              {cur.title}
            </motion.p>
          </AnimatePresence>
          <p className="text-muted">Tap to play</p>
        </div>
      </motion.div>
    </div>
  );
}

function Screen({ src, k, dim }: { src: string; k: string; dim?: boolean }) {
  return (
    <>
      <AnimatePresence initial={false}>
        <motion.img
          key={k}
          src={src}
          alt=""
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      {dim && <span aria-hidden className="absolute inset-0 bg-white/25" />}
    </>
  );
}
