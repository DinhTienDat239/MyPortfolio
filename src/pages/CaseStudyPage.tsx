import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { asset, findProject, nextProject } from '../data';
import { CATEGORY_LABEL, type CaseStudyBlock, type Project } from '../types/content';
import { goToSection } from '../lib/router';
import ProjectArt from '../components/projects/ProjectArt';
import PlayableFrame from '../components/projects/PlayableFrame';
import Counter from '../components/fx/Counter';

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: EASE },
} as const;

function Block({ block }: { block: CaseStudyBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <motion.div {...reveal} className="mx-auto max-w-3xl">
          {block.heading && <h2 className="mb-6 font-display text-3xl font-bold text-bone md:text-4xl">{block.heading}</h2>}
          <p className="whitespace-pre-line text-lg leading-relaxed text-bone/80">{block.body}</p>
        </motion.div>
      );
    case 'image':
      return (
        <motion.figure {...reveal} className="mx-auto max-w-5xl">
          <img src={asset(block.src)} alt={block.caption ?? ''} loading="lazy" className="w-full border border-ash" />
          {block.caption && <figcaption className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-fog">{block.caption}</figcaption>}
        </motion.figure>
      );
    case 'stats':
      return (
        <motion.div {...reveal} className="mx-auto grid max-w-5xl grid-cols-2 gap-px border border-ash bg-ash md:grid-cols-4">
          {block.items.map((s) => (
            <div key={s.label} className="bg-abyss p-6">
              <div className="font-display text-4xl font-black text-blood-400">
                <Counter value={s.value} />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog">{s.label}</div>
            </div>
          ))}
        </motion.div>
      );
    case 'quote':
      return (
        <motion.blockquote {...reveal} className="mx-auto max-w-4xl text-center font-serif text-3xl italic leading-snug text-bone md:text-5xl">
          “{block.text}”
        </motion.blockquote>
      );
  }
}

export default function CaseStudyPage({ slug }: { slug: string }) {
  const project = findProject(slug);
  if (!project) return <NotFound />;
  return <CaseStudy project={project} />;
}

function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-blood-400">404 · Lost in the dark</p>
      <h1 className="mt-6 font-display text-5xl font-black text-bone md:text-7xl">Nothing sleeps here.</h1>
      <button onClick={() => goToSection('work')} className="mt-10 border border-blood-500 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-blood-400 hover:bg-blood-500 hover:text-void">
        Back to the crypt
      </button>
    </section>
  );
}

function CaseStudy({ project }: { project: Project }) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgScale = useTransform(heroProgress, [0, 1], [1.05, 1.3]);
  const titleY = useTransform(heroProgress, [0, 1], ['0%', '60%']);
  const fade = useTransform(heroProgress, [0, 0.8], [1, 0]);

  const next = nextProject(project.slug);
  const cover = asset(project.cover || project.thumbnail);
  const meta = [
    { k: 'Category', v: CATEGORY_LABEL[project.category] },
    { k: 'Role', v: project.role },
    { k: 'Year', v: project.year },
    { k: 'Stack', v: project.tags.join(' · ') },
  ].filter((m) => m.v);

  return (
    <article>
      {/* Thanh tiến độ đọc */}
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-blood-500 shadow-blood" />

      <button
        onClick={() => goToSection('work')}
        className="group fixed left-5 top-24 z-40 flex items-center gap-2 border border-ash bg-void/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-fog backdrop-blur transition-colors hover:border-blood-600 hover:text-bone md:left-8"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Crypt
      </button>

      {/* ---- Hero toàn màn hình ---- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] items-end overflow-hidden px-5 pb-20 md:px-8">
        <motion.div style={{ scale: bgScale }} className="absolute inset-0">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover opacity-50 grayscale-[40%]" />
          ) : (
            <ProjectArt title={project.title} seed={project.slug} className="opacity-70" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/60 to-abyss/20" />
        <div className="vignette pointer-events-none absolute inset-0" />

        <motion.div style={{ y: titleY, opacity: fade }} className="relative mx-auto w-full max-w-7xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-blood-400"
          >
            {CATEGORY_LABEL[project.category]} · Case file {String(project.order + 1).padStart(2, '0')}
          </motion.p>
          <h1 className="font-display text-[clamp(3rem,11vw,9rem)] font-black leading-[0.9] text-bone">
            {project.title.split(' ').map((w, i) => (
              <span key={i} className="mr-[0.2em] inline-block overflow-hidden align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1, ease: EASE, delay: 0.7 + i * 0.08 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          {project.tagline && <p className="mt-4 font-serif text-2xl italic text-bone/80">{project.tagline}</p>}

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-12 grid max-w-4xl grid-cols-2 gap-6 border-t border-ash pt-6 md:grid-cols-4"
          >
            {meta.map((m) => (
              <div key={m.k}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog">{m.k}</dt>
                <dd className="mt-1 text-sm text-bone">{m.v}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </section>

      {/* ---- Nội dung ---- */}
      <div className="space-y-28 px-5 py-28 md:space-y-40 md:px-8">
        <motion.p {...reveal} className="mx-auto max-w-3xl font-serif text-2xl italic leading-relaxed text-bone md:text-3xl">
          {project.summary}
        </motion.p>

        {project.playableUrl && (
          <motion.section {...reveal} className="mx-auto max-w-5xl">
            <p className="mb-10 text-center font-mono text-xs uppercase tracking-[0.4em] text-blood-400">Play the real build</p>
            <PlayableFrame src={project.playableUrl} title={project.title} orientation={project.orientation} />
          </motion.section>
        )}

        {project.caseStudy?.map((b, i) => <Block key={i} block={b} />)}

        {project.externalLink && (
          <motion.div {...reveal} className="text-center">
            <a
              href={project.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-blood-500 bg-blood-500 px-10 py-5 font-mono text-xs uppercase tracking-[0.3em] text-void transition-colors hover:bg-transparent hover:text-blood-400"
            >
              {project.category === 'game' ? 'Play now' : 'Visit'} <ExternalLink className="h-4 w-4" />
            </a>
          </motion.div>
        )}
      </div>

      {/* ---- Project kế tiếp ---- */}
      {next && next.slug !== project.slug && (
        <a href={`#/work/${next.slug}`} data-cursor="view" className="group relative block overflow-hidden border-t border-ash px-5 py-24 md:px-8 md:py-32">
          <span className="absolute inset-0 origin-bottom scale-y-0 bg-blood-600 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-y-100" />
          <div className="relative mx-auto flex max-w-7xl items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-fog transition-colors group-hover:text-void">Next case file</p>
              <p className="mt-4 font-display text-5xl font-black text-bone transition-colors group-hover:text-void md:text-8xl">{next.title}</p>
            </div>
            <ArrowRight className="h-10 w-10 shrink-0 text-blood-500 transition-all duration-500 group-hover:translate-x-3 group-hover:text-void md:h-16 md:w-16" />
          </div>
        </a>
      )}
    </article>
  );
}
