import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { asset, CATEGORY_ICON, content, projects } from '../../data';
import { CATEGORY_LABEL, type ProjectCategory } from '../../types/content';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';
import { LayerHeading, LayerSection } from '../fx/Layer';
import ItemCard from '../projects/ItemCard';
import { Sprite } from '../pixel/Sprite';

type Filter = 'all' | ProjectCategory;
const ORDER: ProjectCategory[] = ['game', 'playable', 'webapp'];

function TradingPartners() {
  const list = [...content.networks, ...content.networks];
  return (
    <div className="px-slot relative mb-12 overflow-hidden py-3">
      <motion.div className="flex w-max items-center gap-10" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
        {list.map((n, i) => (
          <div key={`${n.name}-${i}`} className="flex shrink-0 items-center gap-3">
            {n.logo && <img src={asset(n.logo)} alt="" className="h-5 w-auto opacity-80" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <span className="font-label text-[11px] uppercase text-parchment/80">{n.name}</span>
            <Sprite name="coin" size={16} className="ml-7" />
          </div>
        ))}
      </motion.div>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 bg-rock px-2 font-label text-[9px] uppercase text-torch">Trading partners</span>
    </div>
  );
}

export default function Vault() {
  const [filter, setFilter] = useState<Filter>('all');

  const tabs = useMemo(() => {
    const cats = ORDER.map((c) => ({ id: c as Filter, label: CATEGORY_LABEL[c] + 's', icon: CATEGORY_ICON[c], count: projects.filter((p) => p.category === c).length })).filter((t) => t.count > 0);
    return [{ id: 'all' as Filter, label: 'All loot', icon: 'chest' as const, count: projects.length }, ...cats];
  }, []);

  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);

  return (
    <LayerSection id="work" tile="gold">
      <LayerHeading
        id="work"
        title="The Vault"
        icon="chest"
        intro="Loot from past expeditions. Every playable here is the real build — pick one up and play it."
      />

      <div role="tablist" className="mb-10 flex flex-wrap gap-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => {
              play('tick');
              setFilter(t.id);
            }}
            className={cn('px-btn-stone !py-2', filter === t.id && '!bg-torch !text-ink')}
          >
            <Sprite name={t.icon} size={20} /> {t.label}
            <span className={filter === t.id ? 'text-ink/60' : 'text-torch'}>×{t.count}</span>
          </button>
        ))}
      </div>

      {(filter === 'all' || filter === 'playable') && content.networks.length > 0 && <TradingPartners />}

      <motion.div layout className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {visible.map((p, i) => (
            <ItemCard key={p.id} project={p} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
    </LayerSection>
  );
}
