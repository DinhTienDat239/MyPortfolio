import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { asset, content, projects } from '../../data';
import { CATEGORY_LABEL, type ProjectCategory } from '../../types/content';
import { cn } from '../../lib/utils';
import SectionHeading from '../fx/SectionHeading';
import ProjectCard from '../projects/ProjectCard';

type Filter = 'all' | ProjectCategory;
const ORDER: ProjectCategory[] = ['game', 'playable', 'webapp'];

function NetworksMarquee() {
  const list = [...content.networks, ...content.networks];
  return (
    <div className="relative mb-14 overflow-hidden border-y border-ash py-5">
      <motion.div
        className="flex w-max items-center gap-14"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {list.map((n, i) => (
          <div key={`${n.name}-${i}`} className="flex shrink-0 items-center gap-3 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
            {n.logo && <img src={asset(n.logo)} alt="" className="h-6 w-auto" loading="lazy" />}
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-fog">{n.name}</span>
            <span className="ml-11 text-blood-700">✦</span>
          </div>
        ))}
      </motion.div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-abyss to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-abyss to-transparent" />
    </div>
  );
}

export default function Crypt() {
  const [filter, setFilter] = useState<Filter>('all');

  // Chỉ hiện tab có project (Web Apps tự hiện khi bạn thêm project category "webapp")
  const tabs = useMemo(() => {
    const counts = ORDER.map((c) => ({ id: c as Filter, label: CATEGORY_LABEL[c] + 's', count: projects.filter((p) => p.category === c).length }));
    return [{ id: 'all' as Filter, label: 'All', count: projects.length }, ...counts.filter((t) => t.count > 0)];
  }, []);

  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="work" className="relative px-5 py-28 md:px-8 md:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px blood-line" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          chapter="II"
          kicker="Selected work"
          title="The Crypt"
          intro="Games and playable ads I've raised from the dark. Every playable here is the real build — open one and play it."
        />

        {/* Tabs lọc */}
        <div role="tablist" className="mb-10 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                'relative px-5 py-2.5 font-mono text-xs uppercase tracking-[0.25em] transition-colors',
                filter === t.id ? 'text-void' : 'text-fog hover:text-bone',
              )}
            >
              {filter === t.id && (
                <motion.span layoutId="crypt-tab" className="absolute inset-0 bg-blood-500" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              <span className="relative">
                {t.label} <span className={filter === t.id ? 'text-void/60' : 'text-blood-500'}>{t.count}</span>
              </span>
            </button>
          ))}
        </div>

        {(filter === 'all' || filter === 'playable') && content.networks.length > 0 && <NetworksMarquee />}

        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {visible.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} className={cn(p.featured && filter === 'all' && i === 0 && 'lg:col-span-2')} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
