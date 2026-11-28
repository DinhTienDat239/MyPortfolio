import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { asset, content } from '../../data';
import { cn } from '../../lib/utils';
import { EASE, MaskLine, Reveal, Section } from '../ui/Reveal';

/**
 * Kinh nghiệm dạng sơ đồ: một tâm (tôi) toả ra 4 nhánh — in-house, freelance, AI, ventures.
 * Rê/bấm một nhánh → đường nối đậm lên, chấm sáng chạy dọc đường, khung chi tiết đổi theo.
 */
const POS = [
  { x: 290, y: 95 },
  { x: 710, y: 95 },
  { x: 290, y: 425 },
  { x: 710, y: 425 },
];
const C = { x: 500, y: 260 };
const curve = (p: { x: number; y: number }) => `M${C.x} ${C.y} C ${C.x} ${p.y}, ${(C.x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`;

export default function Experience() {
  const { experience, profile } = content;
  const [active, setActive] = useState(0);
  const b = experience.branches[active];

  return (
    <Section
      id="experience"
      index="04"
      label="Experience"
      note="In-house · freelance · AI · ventures"
      title={
        <>
          <MaskLine inView>One person,</MaskLine>
          <MaskLine inView delay={0.08}>
            many <span className="em">fields.</span>
          </MaskLine>
        </>
      }
    >
      <Reveal>
        <p className="max-w-2xl text-lg leading-relaxed text-fg/70">{experience.intro}</p>
      </Reveal>

      {/* ---------- Sơ đồ (desktop/tablet) ---------- */}
      <Reveal className="relative mt-14 hidden aspect-[1000/520] md:block">
        <svg viewBox="0 0 1000 520" className="absolute inset-0 h-full w-full" aria-hidden>
          {/* vòng tròn đồng tâm làm nền */}
          {[80, 150, 220].map((r) => (
            <circle key={r} cx={C.x} cy={C.y} r={r} fill="none" stroke="var(--color-line)" strokeDasharray="2 6" />
          ))}
          {POS.map((p, i) => {
            const on = i === active;
            return (
              <g key={i}>
                <motion.path
                  d={curve(p)}
                  fill="none"
                  stroke="var(--color-fg)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.2 + i * 0.12 }}
                  animate={{ strokeWidth: on ? 1.6 : 1, opacity: on ? 1 : 0.22 }}
                />
                {on && (
                  <circle r="4" fill="var(--color-fg)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={curve(p)} />
                  </circle>
                )}
                <circle cx={p.x} cy={p.y} r={on ? 5 : 3.5} fill="var(--color-fg)" opacity={on ? 1 : 0.35} />
              </g>
            );
          })}
        </svg>

        {/* tâm */}
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          {profile.profilePic ? (
            <img src={asset(profile.profilePic)} alt={profile.fullName} className="h-24 w-24 rounded-full object-cover grayscale ring-8 ring-bg" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full bg-fg text-bg ring-8 ring-bg">{experience.center}</span>
          )}
          <span className="mt-3 text-sm font-medium">{profile.fullName}</span>
        </div>

        {/* các nhánh */}
        {experience.branches.map((br, i) => {
          const p = POS[i];
          const on = i === active;
          const leftSide = p.x < C.x;
          return (
            <button
              key={br.id}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={on}
              className={cn('absolute w-[min(17rem,26%)] -translate-y-1/2 text-left', leftSide ? '-translate-x-[calc(100%+1.25rem)] text-right' : 'translate-x-5')}
              style={{ left: `${p.x / 10}%`, top: `${(p.y / 520) * 100}%` }}
            >
              <span className={cn('block text-[clamp(1.25rem,2vw,1.75rem)] font-medium tracking-tight transition-colors duration-300', on ? 'text-fg' : 'text-fg/35')}>{br.label}</span>
              <span className={cn('mt-1 block text-sm transition-colors duration-300', on ? 'text-muted' : 'text-fg/25')}>{br.leaves.join(' · ')}</span>
            </button>
          );
        })}
      </Reveal>

      {/* ---------- Tab (mobile) ---------- */}
      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 md:hidden">
        {experience.branches.map((br, i) => (
          <button
            key={br.id}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn('border-b pb-1 text-[15px] transition-colors', i === active ? 'border-fg text-fg' : 'border-transparent text-muted')}
          >
            {br.label}
          </button>
        ))}
      </div>

      {/* ---------- Chi tiết ---------- */}
      <div className="mt-10 border-t border-line pt-8 md:mt-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="grid gap-6 md:grid-cols-12 md:gap-8"
          >
            <div className="md:col-span-5">
              <p className="text-sm text-muted">{b.meta}</p>
              <h3 className="mt-2 text-[clamp(1.6rem,2.6vw,2.4rem)] font-medium leading-tight tracking-[-0.025em]">{b.title}</h3>
              {b.highlight && (
                <p className="em mt-6 border-l-2 border-fg pl-5 text-[clamp(1.35rem,2.1vw,1.9rem)] leading-[1.2] text-fg">{b.highlight}</p>
              )}
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <p className="leading-relaxed text-fg/75">{b.body}</p>
              <ul className="mt-5 grid gap-x-6 border-t border-line sm:grid-cols-3">
                {b.leaves.map((l, k) => (
                  <li key={l} className="flex gap-3 border-b border-line py-3 text-[15px]">
                    <span className="tabular-nums text-muted">{String(k + 1).padStart(2, '0')}</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
