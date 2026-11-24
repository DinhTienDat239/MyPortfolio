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
            <div key={s.label} className="flex flex-col pr-4">
              <dd className="order-first text-4xl font-medium leading-none tracking-[-0.03em] md:text-5xl">{s.value}</dd>
              <dt className="mt-2 text-sm leading-snug text-muted">{s.label}</dt>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

/**
 * Ba điện thoại xếp lớp: máy giữa là playable đang chọn, hai máy sau là bản trước/sau.
 * Vuốt ngang (hoặc bấm máy bên, chấm, phím ←/→ khi focus) để đổi; tự chạy vòng khi để yên.
 * Mỗi lớp lệch theo chuột với độ sâu khác nhau (parallax) và tách ra khi cuộn xuống.
 */
const START = Math.max(0, reel.findIndex((p) => p.slug === 'bead-fill'));
const SWIPE = 45;

function PhoneStage({ onPlay, progress }: { onPlay: (slug: string) => void; progress: MotionValue<number> }) {
  const [i, setI] = useState(START);
  const n = reel.length;
  const go = (d: number) => {
    first.current = false;
    setI((k) => (k + d + n) % n);
  };
  const cur = reel[i];
  const left = reel[(i + n - 1) % n];
  const right = reel[(i + 1) % n];
  const panned = useRef(false);
  const first = useRef(true);

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
  // máy chính đi theo ngón tay khi vuốt, nhả ra thì bật về
  const dragX = useMotionValue(0);
  const dragXs = useSpring(dragX, { stiffness: 400, damping: 32 });
  const dragRot = useTransform(dragXs, [-200, 200], [-6, 6]);

  // Tự chuyển sau mỗi 3.6s; mọi lần đổi (kể cả do người dùng) đều đặt lại đồng hồ.
  // Lần đầu giữ Bead Fill lâu hơn (cộng cả thời gian intro) vì đó là bản mở màn.
  useEffect(() => {
    if (n < 2) return;
    const wait = first.current ? D * 1000 + 6500 : 3600;
    const id = setTimeout(() => {
      first.current = false;
      setI((k) => (k + 1) % n);
    }, wait);
    return () => clearTimeout(id);
  }, [i, n]);

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
    <div className="mx-auto w-full max-w-[340px] sm:max-w-[460px] lg:max-w-[520px]">
      <motion.div
        className="relative aspect-[1/1.08] cursor-grab touch-pan-y select-none [perspective:1400px] active:cursor-grabbing"
        onPanStart={() => {
          panned.current = true;
        }}
        onPan={(_, info) => dragX.set(info.offset.x)}
        onPanEnd={(_, info) => {
          dragX.set(0);
          if (info.offset.x < -SWIPE || info.velocity.x < -400) go(1);
          else if (info.offset.x > SWIPE || info.velocity.x > 400) go(-1);
          // click phát sinh ngay sau pan không được tính là "Tap to play"
          setTimeout(() => (panned.current = false), 0);
        }}
      >
        {/* hai máy phía sau */}
        <motion.div
          initial={{ opacity: 0, rotate: 0, x: 0 }}
          animate={{ opacity: 1, rotate: -9 }}
          transition={{ duration: 1.4, ease: EASE, delay: D + 0.45 }}
          style={{ x: leftX, y: farY }}
          className="absolute left-[3%] top-[13%] w-[39%]"
        >
          <button tabIndex={-1} aria-hidden onClick={() => !panned.current && go(-1)} className="block w-full">
            <PhoneFrame className="opacity-90 shadow-[0_40px_60px_-30px_rgb(0_0_0/0.35)]">
              <Screen src={asset(left.thumbnail)!} k={left.id} dim />
            </PhoneFrame>
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 0, x: 0 }}
          animate={{ opacity: 1, rotate: 9 }}
          transition={{ duration: 1.4, ease: EASE, delay: D + 0.5 }}
          style={{ x: rightX, y: farY }}
          className="absolute right-[3%] top-[13%] w-[39%]"
        >
          <button tabIndex={-1} aria-hidden onClick={() => !panned.current && go(1)} className="block w-full">
            <PhoneFrame className="opacity-90 shadow-[0_40px_60px_-30px_rgb(0_0_0/0.35)]">
              <Screen src={asset(right.thumbnail)!} k={right.id} dim />
            </PhoneFrame>
          </button>
        </motion.div>

        {/* bóng đổ trên "sàn" */}
        <div aria-hidden className="absolute bottom-0 left-1/2 h-4 w-[38%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-md" />

        {/* máy chính */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, ease: EASE, delay: D + 0.25 }}
          className="absolute left-1/2 top-0 w-[50%] -translate-x-1/2"
        >
          <motion.div style={{ rotateX: rotX, rotateY: rotY, x: dragXs, rotate: dragRot }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <button
                onClick={() => !panned.current && onPlay(cur.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') go(1);
                  if (e.key === 'ArrowLeft') go(-1);
                }}
                data-cursor="Play"
                aria-label={`Play ${cur.title}`}
                className="block w-full rounded-[13%/6%]"
              >
                <PhoneFrame className="shadow-[0_50px_70px_-35px_rgb(0_0_0/0.55)]">
                  <Screen src={asset(cur.thumbnail)!} k={cur.id} />
                </PhoneFrame>
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* chú thích + chấm chọn */}
      <div className="mt-5 text-center text-sm">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={cur.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="font-medium"
          >
            {cur.title}
          </motion.p>
        </AnimatePresence>
        <p className="text-muted">Tap to play · swipe to browse</p>
        <div className="mt-3 flex justify-center" role="tablist" aria-label="Playables">
          {reel.map((p, k) => (
            <button key={p.id} role="tab" aria-selected={k === i} aria-label={p.title} onClick={() => setI(k)} className="grid h-6 w-5 place-items-center">
              <span className={`block h-1.5 rounded-full bg-fg transition-all duration-300 ${k === i ? 'w-4' : 'w-1.5 opacity-25'}`} />
            </button>
          ))}
        </div>
      </div>
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
