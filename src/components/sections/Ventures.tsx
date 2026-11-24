import { motion } from 'motion/react';
import { asset, content } from '../../data';
import type { Venture } from '../../types/content';
import { cn } from '../../lib/utils';
import { EASE, MaskLine, Reveal, Section } from '../ui/Reveal';

export default function Ventures() {
  const { ventures } = content;
  return (
    <Section
      id="ventures"
      index="05"
      label="Beyond ads"
      note="Startup · B2B · community"
      title={
        <>
          <MaskLine inView>Products I built</MaskLine>
          <MaskLine inView delay={0.08}>
            <span className="em">beyond</span> the ads.
          </MaskLine>
        </>
      }
    >
      <div className="space-y-24 md:space-y-32">
        {ventures.map((v, i) => (
          <VentureRow key={v.id} v={v} flip={i % 2 === 1} />
        ))}
      </div>
    </Section>
  );
}

function VentureRow({ v, flip }: { v: Venture; flip: boolean }) {
  const visual = v.nda ? <NdaMock modules={v.modules ?? []} /> : v.image && <img src={asset(v.image)} alt={v.title} loading="lazy" className="h-full w-full object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0" />;

  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
      <Reveal className={cn('lg:col-span-7', flip && 'lg:order-2 lg:col-start-6')}>
        {v.link ? (
          <a href={v.link} target="_blank" rel="noopener noreferrer" data-cursor="Visit" className="group block aspect-[1200/680] overflow-hidden bg-soft">
            <div className="h-full w-full transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]">{visual}</div>
          </a>
        ) : (
          <div className="aspect-[1200/680] overflow-hidden bg-soft">{visual}</div>
        )}
      </Reveal>

      <Reveal className={cn('lg:col-span-4', flip ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-9')} delay={0.1}>
        <p className="text-sm text-muted">{v.kind}</p>
        <h3 className="mt-3 text-[clamp(1.75rem,2.8vw,2.6rem)] font-medium leading-tight tracking-[-0.03em]">{v.title}</h3>
        <p className="mt-4 leading-relaxed text-fg/75">{v.body}</p>
        <ul className="mt-6 border-t border-line text-[15px]">
          {v.facts.map((f) => (
            <li key={f} className="border-b border-line py-2.5">
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{v.stack.join(' · ')}</p>
        {v.link && (
          <a href={v.link} target="_blank" rel="noopener noreferrer" className="link mt-6 inline-block text-[15px]">
            Visit {v.title} ↗
          </a>
        )}
      </Reveal>
    </article>
  );
}

/**
 * Mô phỏng giao diện hệ thống B2B (đã ẩn danh tính khách hàng):
 * sidebar với tên module thật, bảng KPI, pipeline Kanban — toàn bộ là khối xám trừu tượng.
 */
function NdaMock({ modules }: { modules: string[] }) {
  const cols = ['Lead', 'Qualified', 'Quote', 'Won'];
  const cards = [3, 2, 2, 1];
  return (
    <div className="flex h-full w-full flex-col bg-[#f7f7f7] p-[3%]">
      <div className="flex h-full overflow-hidden border border-line bg-bg shadow-[0_30px_60px_-30px_rgb(0_0_0/0.25)]">
        {/* sidebar */}
        <aside className="hidden w-[22%] shrink-0 flex-col gap-1 border-r border-line p-3 text-[clamp(8px,0.85vw,12px)] sm:flex">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-4 bg-fg" />
            <span className="h-2 w-14 bg-line" />
          </div>
          {modules.map((m, i) => (
            <span key={m} className={cn('px-2 py-1', i === 2 ? 'bg-fg text-bg' : 'text-fg/60')}>
              {m}
            </span>
          ))}
        </aside>
        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[clamp(10px,1.1vw,15px)] font-medium">Pipeline</span>
            <span className="h-5 w-20 border border-line" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Open deals', 'Win rate', 'Revenue'].map((k) => (
              <div key={k} className="border border-line p-2">
                <p className="text-[clamp(7px,0.75vw,11px)] text-muted">{k}</p>
                <span className="mt-1.5 block h-3 w-3/5 bg-fg/80" />
              </div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
            {cols.map((c, ci) => (
              <div key={c} className="flex flex-col gap-1.5 bg-[#f7f7f7] p-1.5">
                <p className="text-[clamp(7px,0.75vw,11px)] text-muted">{c}</p>
                {Array.from({ length: cards[ci] }, (_, k) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.2 + ci * 0.1 + k * 0.08 }}
                    className="border border-line bg-bg p-1.5"
                  >
                    <span className="block h-1.5 w-4/5 bg-fg/70" />
                    <span className="mt-1 block h-1.5 w-1/2 bg-line" />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-right text-[clamp(8px,0.8vw,12px)] text-muted">Interface recreated · client identity removed (NDA)</p>
    </div>
  );
}
