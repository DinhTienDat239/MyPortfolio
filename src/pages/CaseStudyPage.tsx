import { motion, useScroll, useSpring } from 'motion/react';
import { asset, CATEGORY_ICON, findProject, nextProject, RARITY_COLOR, RARITY_LABEL, rarityOf } from '../data';
import { CATEGORY_LABEL, type CaseStudyBlock, type Project } from '../types/content';
import { goToSection } from '../lib/router';
import PlayableFrame from '../components/projects/PlayableFrame';
import PixelScene from '../components/pixel/PixelScene';
import Counter from '../components/fx/Counter';
import { Sparkle, Sprite, Torch } from '../components/pixel/Sprite';

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
} as const;

function Block({ block }: { block: CaseStudyBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <motion.div {...reveal} className="px-panel mx-auto max-w-3xl p-6 md:p-8">
          {block.heading && <h2 className="pixel-shadow mb-4 text-3xl font-bold text-parchment">{block.heading}</h2>}
          <p className="whitespace-pre-line text-lg leading-relaxed text-mist">{block.body}</p>
        </motion.div>
      );
    case 'image':
      return (
        <motion.figure {...reveal} className="px-panel mx-auto max-w-5xl p-3">
          <img src={asset(block.src)} alt={block.caption ?? ''} loading="lazy" className="w-full" />
          {block.caption && <figcaption className="mt-3 font-label text-[10px] uppercase text-mist">{block.caption}</figcaption>}
        </motion.figure>
      );
    case 'stats':
      return (
        <motion.div {...reveal} className="mx-auto grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-4">
          {block.items.map((s) => (
            <div key={s.label} className="px-panel p-5">
              <div className="pixel-shadow text-4xl font-bold text-gold">
                <Counter value={s.value} />
              </div>
              <div className="mt-1 font-label text-[9px] uppercase text-mist">{s.label}</div>
            </div>
          ))}
        </motion.div>
      );
    case 'quote':
      return (
        <motion.blockquote {...reveal} className="mx-auto max-w-3xl bg-parchment p-8 text-center text-2xl text-ink md:text-3xl">
          “{block.text}”
        </motion.blockquote>
      );
  }
}

export default function CaseStudyPage({ slug }: { slug: string }) {
  const project = findProject(slug);
  if (!project) return <NotFound />;
  return <Codex project={project} />;
}

function NotFound() {
  return (
    <section className="bg-tile-stone flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <Sprite name="slime" size={96} className="animate-bob" />
      <p className="mt-6 font-label text-xs uppercase text-torch">404 · Unexplored tile</p>
      <h1 className="pixel-shadow mt-3 text-5xl font-bold text-parchment">Nothing here but slime.</h1>
      <button onClick={() => goToSection('work')} className="px-btn mt-10">
        <Sprite name="chest" size={20} /> Back to the Vault
      </button>
    </section>
  );
}

function Codex({ project }: { project: Project }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const rarity = rarityOf(project);
  const color = RARITY_COLOR[rarity];
  const next = nextProject(project.slug);
  const cover = asset(project.cover || project.thumbnail);
  const stats = [
    { k: 'Rarity', v: RARITY_LABEL[rarity], c: color },
    { k: 'Type', v: CATEGORY_LABEL[project.category] },
    { k: 'Role', v: project.role },
    { k: 'Year', v: project.year },
  ].filter((s) => s.v);

  return (
    <article className="bg-tile-gold min-h-screen pb-10">
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-torch" />

      <button onClick={() => goToSection('work')} className="px-btn-stone fixed left-3 top-24 z-40 !px-3 !py-2 md:left-6">
        ◀ Vault
      </button>

      {/* ---- Đầu trang: vật phẩm + bảng chỉ số ---- */}
      <section className="relative px-5 pb-16 pt-36 md:px-8">
        <div className="cave-dark pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }} className="px-panel relative p-3" style={{ ['--rarity' as string]: color }}>
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
            <div className="px-slot aspect-[16/10] overflow-hidden">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <PixelScene seed={project.slug} icon={CATEGORY_ICON[project.category]} />}
            </div>
            <Sparkle className="absolute -right-2 -top-2" size={16} color={color} />
            <Sparkle className="absolute -bottom-2 -left-2" size={12} delay={0.5} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <p className="font-label text-[11px] uppercase text-torch">Item codex · #{String(project.order + 1).padStart(2, '0')}</p>
            <h1 className="pixel-shadow mt-3 flex items-center gap-4 text-5xl font-bold leading-none md:text-7xl" style={{ color }}>
              <Sprite name={CATEGORY_ICON[project.category]} size={56} className="hidden shrink-0 sm:block" />
              {project.title}
            </h1>
            {project.tagline && <p className="mt-3 text-xl text-parchment">{project.tagline}</p>}
            <p className="mt-5 text-lg leading-relaxed text-mist">“{project.summary}”</p>

            <dl className="px-panel mt-7 grid grid-cols-2 gap-4 p-4">
              {stats.map((s) => (
                <div key={s.k}>
                  <dt className="font-label text-[9px] uppercase text-mist">{s.k}</dt>
                  <dd className="text-lg" style={{ color: s.c ?? 'var(--color-parchment)' }}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
            {project.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {project.tags.map((t) => (
                  <li key={t} className="font-label text-[10px] uppercase text-uncommon">
                    + {t}
                  </li>
                ))}
              </ul>
            )}
            {project.externalLink && (
              <a href={project.externalLink} target="_blank" rel="noopener noreferrer" className="px-btn mt-7">
                <Sprite name="sword" size={20} /> {project.category === 'game' ? 'Play now' : 'Visit'}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ---- Chơi thử ---- */}
      <div className="space-y-24 px-5 py-16 md:px-8">
        {project.playableUrl && (
          <motion.section {...reveal} className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-center justify-center gap-4">
              <Torch size={40} />
              <p className="pixel-shadow text-center text-3xl font-bold text-parchment">Try it yourself</p>
              <Torch size={40} />
            </div>
            <PlayableFrame src={project.playableUrl} title={project.title} orientation={project.orientation} />
          </motion.section>
        )}
        {project.caseStudy?.map((b, i) => <Block key={i} block={b} />)}
      </div>

      {/* ---- Vật phẩm kế tiếp ---- */}
      {next && next.slug !== project.slug && (
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <a href={`#/work/${next.slug}`} className="px-panel group flex items-center justify-between gap-6 p-6 md:p-8">
            <div className="flex items-center gap-5">
              <span className="px-slot flex h-16 w-16 items-center justify-center">
                <Sprite name={CATEGORY_ICON[next.category]} size={40} className="transition-transform group-hover:-translate-y-1" />
              </span>
              <div>
                <p className="font-label text-[10px] uppercase text-mist">Next item</p>
                <p className="text-3xl font-bold md:text-5xl" style={{ color: RARITY_COLOR[rarityOf(next)] }}>
                  {next.title}
                </p>
              </div>
            </div>
            <span className="font-label text-2xl text-torch transition-transform group-hover:translate-x-2">▶</span>
          </a>
        </div>
      )}
    </article>
  );
}
