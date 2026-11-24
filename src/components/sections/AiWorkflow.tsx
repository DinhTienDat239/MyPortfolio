import { motion } from 'motion/react';
import { content } from '../../data';
import { cn } from '../../lib/utils';
import { EASE, MaskLine, Reveal, Section } from '../ui/Reveal';

/**
 * Quy trình AI: brief → orchestrator → workers (song song) → skills → ship.
 * Một chấm chạy liên tục dọc đường nối cho thấy dòng việc đang chảy.
 */
export default function AiWorkflow() {
  const { ai } = content;
  return (
    <Section
      id="ai"
      index="04"
      label="AI workflow"
      note="Claude · Codex · custom CLI"
      title={
        <>
          <MaskLine inView>One brief.</MaskLine>
          <MaskLine inView delay={0.08}>
            A team of <span className="em">agents.</span>
          </MaskLine>
        </>
      }
    >
      <Reveal>
        <p className="max-w-2xl text-lg leading-relaxed text-fg/70">{ai.intro}</p>
      </Reveal>

      {/* ---------- Dòng chảy ---------- */}
      <div className="relative mt-16">
        {/* đường nối ngang (desktop) */}
        <div aria-hidden className="absolute left-[10%] right-[10%] top-[1.375rem] hidden h-px bg-line lg:block">
          <motion.span
            className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-fg"
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <ol className="grid gap-10 lg:grid-cols-5 lg:gap-6">
          {ai.steps.map((s, i) => (
            <motion.li
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
              className="relative flex gap-5 lg:block lg:text-center"
            >
              <span
                className={cn(
                  'relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border text-sm tabular-nums lg:mx-auto',
                  i === 1 ? 'border-fg bg-fg text-bg' : 'border-line bg-bg',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="lg:mt-6">
                <h3 className="text-lg font-medium tracking-tight">{s.name}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{s.detail}</p>
                {s.tools && (
                  <div className={cn('mt-4 flex flex-wrap gap-1.5 lg:justify-center', s.name === 'Workers' && 'flex-col items-start lg:items-center')}>
                    {s.tools.map((t) => (
                      <span key={t} className="border border-line px-2 py-1 text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="mt-20 grid gap-x-8 border-t border-line md:grid-cols-2">
        {ai.points.map((p, i) => (
          <Reveal key={p}>
            <p className="flex gap-4 border-b border-line py-5 text-[15px] leading-relaxed">
              <span className="tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
              {p}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
