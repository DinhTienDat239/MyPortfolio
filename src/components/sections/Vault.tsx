import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CATEGORY_ICON, content, projects, RARITY_COLOR, RARITY_LABEL, rarityOf } from '../../data';
import { CATEGORY_LABEL, type Project, type ProjectCategory } from '../../types/content';
import { rememberHomeScroll } from '../../lib/router';
import { cn } from '../../lib/utils';
import { play } from '../../lib/sound';
import { LayerHeading, LayerSection } from '../fx/Layer';
import { Sprite } from '../pixel/Sprite';
import PixelScene from '../pixel/PixelScene';
import { asset } from '../../data';

type Filter = 'all' | ProjectCategory;
const ORDER: ProjectCategory[] = ['game', 'playable', 'webapp'];
const SIZE_CAP_KB = 5 * 1024; // giới hạn phổ biến của các ad network cho 1 playable

const mb = (kb: number) => (kb / 1024).toFixed(1);

/** 1 dòng trong bảng inventory — số liệu thật của build. */
function Row({ p, i }: { p: Project; i: number }) {
  const rarity = rarityOf(p);
  const color = RARITY_COLOR[rarity];
  const thumb = asset(p.thumbnail);
  const pct = p.sizeKB ? Math.min(100, (p.sizeKB / SIZE_CAP_KB) * 100) : 0;
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (i % 6) * 0.04 }}
    >
      <a
        href={`#/work/${p.slug}`}
        onClick={rememberHomeScroll}
        className="group grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-2 border-b border-edge/60 px-2 py-4 transition-colors hover:bg-gold/[0.06] md:grid-cols-[28px_132px_1fr_150px_170px_70px] md:gap-x-6 md:px-3"
      >
        <span className="hidden font-label text-[10px] text-mist/70 md:block">{String(i + 1).padStart(2, '0')}</span>
        <span className="relative block aspect-[16/10] overflow-hidden rounded-md border border-edge/80">
          {thumb ? <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" /> : <PixelScene seed={p.slug} icon={CATEGORY_ICON[p.category]} className="transition-transform duration-500 group-hover:scale-110" />}
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline gap-3">
            <span className="truncate font-display text-[2rem] leading-none transition-colors" style={{ color }}>
              {p.title}
            </span>
            {p.featured && <Sprite name="star" size={14} className="shrink-0" />}
          </span>
          <span className="mt-1 block font-label text-[9px] uppercase text-mist">
            {RARITY_LABEL[rarity]} · {CATEGORY_LABEL[p.category]}
          </span>
          <span className="mt-1.5 hidden text-sm text-mist/90 md:line-clamp-1">{p.summary}</span>
        </span>
        <span className="col-start-2 font-label text-[10px] uppercase text-parchment/80 md:col-start-auto">
          {p.playableUrl ? 'HTML5 · single file' : p.tags.slice(0, 2).join(' · ')}
          <span className="block text-mist/70">{p.orientation === 'landscape' ? 'Landscape' : 'Portrait'} · {p.year ?? 'tap to play'}</span>
        </span>
        <span className="col-start-2 md:col-start-auto">
          {p.sizeKB ? (
            <>
              <span className="flex items-baseline justify-between font-label text-[10px] text-parchment/90">
                <span>{mb(p.sizeKB)} MB</span>
                <span className="text-mist/60">/ 5 MB</span>
              </span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/50">
                <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: pct > 85 ? 'var(--color-copper)' : 'var(--color-uncommon)' }} />
              </span>
            </>
          ) : (
            <span className="font-label text-[10px] text-mist/60">—</span>
          )}
        </span>
        <span className="col-start-2 font-label text-[10px] uppercase text-gold transition-transform group-hover:translate-x-1 md:col-start-auto md:text-right">
          {p.playableUrl ? 'Play ▶' : 'Open ▶'}
        </span>
      </a>
    </motion.li>
  );
}

export default function Vault() {
  const [filter, setFilter] = useState<Filter>('all');

  const tabs = useMemo(() => {
    const cats = ORDER.map((c) => ({ id: c as Filter, label: CATEGORY_LABEL[c] + 's', icon: CATEGORY_ICON[c], count: projects.filter((p) => p.category === c).length })).filter((t) => t.count > 0);
    return cats.length > 1 ? [{ id: 'all' as Filter, label: 'Everything', icon: 'chest' as const, count: projects.length }, ...cats] : [];
  }, []);

  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
  const totalKB = visible.reduce((s, p) => s + (p.sizeKB ?? 0), 0);

  return (
    <LayerSection id="work" tile="gold">
      <LayerHeading
        id="work"
        title="The Vault"
        icon="chest"
        intro="Every row below is a real build that shipped. Click one to play it right here — same file that ran on the ad networks."
      />

      {tabs.length > 0 && (
        <div role="tablist" className="mb-8 flex flex-wrap gap-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => {
                play('tick');
                setFilter(t.id);
              }}
              className={cn('px-btn-stone !py-2', filter === t.id && '!border-gold !text-gold')}
            >
              <Sprite name={t.icon} size={18} /> {t.label} <span className="text-mist">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="px-panel overflow-hidden">
        <div className="hidden grid-cols-[28px_132px_1fr_150px_170px_70px] gap-x-6 border-b border-edge px-3 py-3 font-label text-[9px] uppercase text-mist md:grid">
          <span>#</span>
          <span>Preview</span>
          <span>Item</span>
          <span>Build</span>
          <span>Size vs network cap</span>
          <span className="text-right">Play</span>
        </div>
        <ul>
          {visible.map((p, i) => (
            <Row key={p.id} p={p} i={i} />
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 font-label text-[9px] uppercase text-mist">
          <span>
            {visible.length} builds · {mb(totalKB)} MB total
          </span>
          {content.networks.length > 0 && <span>Shipped to {content.networks.map((n) => n.name).join(' · ')}</span>}
        </div>
      </div>
    </LayerSection>
  );
}
