import { useRef, type PointerEvent } from 'react';
import { motion } from 'motion/react';
import { content } from '../../data';
import SectionHeading from '../fx/SectionHeading';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Vòng tên kỹ năng xoay 3D bằng CSS thuần (preserve-3d) — nhẹ, không cần WebGL. */
function SkillRing() {
  const names = content.skills.flatMap((g) => g.skills.map((s) => s.name));
  const step = 360 / names.length;
  const radius = Math.max(220, names.length * 22);
  return (
    <div className="relative mx-auto mb-20 h-40 w-full overflow-hidden [perspective:1100px] md:h-48" aria-hidden>
      <div className="skill-ring absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
        {names.map((n, i) => (
          <span
            key={n}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-xl font-bold text-bone/80 [backface-visibility:hidden] md:text-3xl"
            style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)` }}
          >
            {n}
            <span className="ml-3 text-blood-600">✦</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-abyss to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-abyss to-transparent" />
    </div>
  );
}

function Drops({ level }: { level: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`${level} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`h-2 w-2 rotate-45 ${i < level ? 'bg-blood-500 shadow-blood' : 'border border-ash'}`} />
      ))}
    </div>
  );
}

export default function Arsenal() {
  const gridRef = useRef<HTMLDivElement>(null);

  // Spotlight: mỗi ô nhận toạ độ chuột riêng → viền đỏ sáng lên theo con trỏ
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    gridRef.current?.querySelectorAll<HTMLElement>('[data-spot]').forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  };

  return (
    <section id="arsenal" className="relative px-5 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-7xl">
        <SectionHeading chapter="III" kicker="Tools of the trade" title="The Arsenal" align="center" />
        <SkillRing />

        <div ref={gridRef} onPointerMove={onMove} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {content.skills.map((group, gi) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: EASE, delay: gi * 0.1 }}
              data-spot
              className="spotlight relative border border-ash bg-crypt p-6"
            >
              <div className="relative flex items-baseline justify-between">
                <h3 className="font-display text-xl font-bold text-bone">{group.name}</h3>
                <span className="font-display text-3xl font-black text-blood-700">{group.sigil}</span>
              </div>
              <ul className="relative mt-6 space-y-4">
                {group.skills.map((s) => (
                  <li key={s.name} className="group/skill">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-bone/90 transition-colors group-hover/skill:text-blood-400">{s.name}</span>
                      <Drops level={s.level} />
                    </div>
                    {s.note && (
                      <p className="mt-1 max-h-0 overflow-hidden font-mono text-[10px] uppercase tracking-wider text-fog opacity-0 transition-all duration-500 group-hover/skill:max-h-10 group-hover/skill:opacity-100">
                        {s.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
