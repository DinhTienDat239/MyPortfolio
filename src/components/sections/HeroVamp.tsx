import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { content } from '../../data';
import { goToSection } from '../../lib/router';
import { bloodMode } from '../../lib/bloodMode';
import { useStore } from '../../lib/store';

const BloodMoonScene = lazy(() => import('../three/BloodMoonScene'));

const EASE = [0.22, 1, 0.36, 1] as const;

/** WebGL có chạy được không (máy yếu / bị tắt GPU → dùng nền gradient). */
const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

export default function HeroVamp() {
  const { profile } = content;
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const intense = useStore(bloodMode);
  const [inView, setInView] = useState(true);
  const [webgl] = useState(hasWebGL);

  // Dừng render 3D khi Hero cuộn khuất
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Parallax: chữ trôi lên + mờ dần khi cuộn
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  const title = profile.alias.toUpperCase();
  const fallbackBg = <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgb(255_0_51/0.22),transparent_55%)]" />;

  return (
    <section ref={sectionRef} id="top" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-abyss">
      {/* ---- Lớp nền 3D ---- */}
      <motion.div style={{ scale: sceneScale }} className="absolute inset-0">
        {reduced || !webgl ? (
          fallbackBg
        ) : (
          <Suspense fallback={fallbackBg}>
            <BloodMoonScene active={inView} intense={intense} eventSource={sectionRef} />
          </Suspense>
        )}
      </motion.div>
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* ---- Nội dung ---- */}
      <motion.div style={{ y: titleY, opacity: fade }} className="relative z-10 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.5em' }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
          className="mb-6 font-mono text-[10px] uppercase text-blood-400 md:text-xs"
        >
          {profile.location} · after dark
        </motion.p>

        <h1
          className="glitch text-glow font-display text-[clamp(3.5rem,15vw,12rem)] font-black leading-[0.85] text-bone"
          data-text={title}
          aria-label={`${profile.alias} — ${profile.fullName}`}
        >
          {title.split('').map((char, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="inline-block"
              initial={{ opacity: 0, y: '60%', filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.4 + i * 0.07 }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 1.1 }}
          className="blood-line mx-auto my-8 w-64 origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.3 }}
          className="font-serif text-2xl italic text-bone/90 md:text-4xl"
        >
          {profile.tagline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.5 }}
          className="mx-auto mt-4 max-w-xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.3em] text-fog md:text-xs"
        >
          {profile.fullName} — {profile.roles}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 1.7 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            onClick={() => goToSection('work')}
            className="border border-blood-500 bg-blood-500 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-void transition-colors hover:bg-transparent hover:text-blood-400 animate-pulse-blood"
          >
            Enter the crypt
          </button>
          <button
            onClick={() => goToSection('contact')}
            className="border border-ash px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-bone/80 transition-colors hover:border-blood-500 hover:text-bone"
          >
            Summon me
          </button>
        </motion.div>
      </motion.div>

      {/* ---- Scroll hint: giọt máu chảy ---- */}
      <motion.button
        onClick={() => goToSection('origin')}
        aria-label="Scroll down"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-fog hover:text-bone"
      >
        Descend
        <span className="relative h-14 w-px overflow-hidden bg-ash">
          <span className="absolute left-0 top-0 h-1/2 w-px bg-blood-500 animate-drip" />
        </span>
      </motion.button>
    </section>
  );
}
